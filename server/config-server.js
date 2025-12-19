// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (c) 2025 OurITRes

/* global process, Buffer */
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { initializeOIDC, getAuthorizationUrl, exchangeCodeForTokens } from './oidc-provider.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const DATA_DIR = path.join(__dirname, 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SSO_USERS_FILE = path.join(DATA_DIR, 'sso-users.json');
const UPLOADS_FILE = path.join(DATA_DIR, 'uploads.json');

// Helper to read config with fallback to top-level object
function readConfig() {
  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
    const parsed = JSON.parse(raw) || {};
    // Some code stores config under "config", some directly at root
    return parsed.config ? { ...parsed.config } : { ...parsed };
  } catch (err) {
    console.error('Failed to read config:', err);
    return {};
  }
}

// Helper functions for SSO users
function readSsoUsers() {
  try {
    const content = fs.readFileSync(SSO_USERS_FILE, 'utf8');
    const parsed = JSON.parse(content);
    return Array.isArray(parsed.sso_users) ? parsed.sso_users : parsed;
  } catch {
    return [];
  }
}

// Name helpers
function buildDisplayName(firstName, lastName, fallback) {
  const fn = (firstName || '').trim();
  const ln = (lastName || '').trim();
  const combined = [fn, ln].filter(Boolean).join(' ').trim();
  return combined || (fallback || '').trim();
}

function mapClaimsToProfile(claims = {}, cfg = {}) {
  const email = claims.email || claims.upn || '';
  const preferredUsername = claims.preferred_username || '';
  const firstName = claims.given_name || '';
  const lastName = claims.family_name || '';
  const issuer = claims.iss || '';
  const subject = claims.sub || '';
  // Detect provider.
  const providerHint = (cfg.ssoProvider || '').toLowerCase();
  const idp = providerHint || (issuer.includes('amazonaws.com') ? 'cognito' : issuer.includes('login.microsoftonline.com') ? 'entra' : issuer.includes('okta.com') ? 'okta' : 'oidc');
  const displayName = buildDisplayName(firstName, lastName, claims.name || preferredUsername || email || (claims.upn || '') || subject);
  return { email, preferredUsername, firstName, lastName, issuer, subject, idp, displayName };
}

// Match an SSO identity against existing users using strict order:
// 1) issuer + subject, 2) email, 3) preferred_username/id
function findSsoUser({ email, issuer, subject, preferredUsername } = {}, claims = {}) {
  const users = readUsers();
  const emailLower = (email || '').toLowerCase();
  const preferredLower = (preferredUsername || claims.preferred_username || '').toLowerCase();

  let user = null;
  if (issuer && subject) {
    user = users.find(u => u.issuer === issuer && u.subject === subject);
    if (user) console.log('[findSsoUser] Matched by issuer+subject:', user.id);
  }
  if (!user && emailLower) {
    user = users.find(u => (u.email || '').toLowerCase() === emailLower);
    if (user) console.log('[findSsoUser] Matched by email:', emailLower, '-> user.id:', user.id);
  }
  if (!user && preferredLower) {
    user = users.find(u => (String(u.id || '').toLowerCase() === preferredLower) || (String(u.email || '').toLowerCase() === preferredLower));
    if (user) console.log('[findSsoUser] Matched by preferred_username:', preferredLower, '-> user.id:', user.id);
  }

  if (!user) {
    console.warn('[findSsoUser] No match found. Searched for email:', emailLower, ', preferred:', preferredLower, ', issuer+sub:', issuer, subject);
    console.warn('[findSsoUser] Available user emails:', users.map(u => u.email).filter(Boolean));
  }

  return { users, user };
}

// Link or create an SSO user according to config and mapping rules
function linkOrCreateSsoUser(mapped, claims, cfg) {
  const { users, user: existing } = findSsoUser(mapped, claims);
  const email = mapped.email || '';
  const issuer = mapped.issuer || '';
  const subject = mapped.subject || '';
  const idp = mapped.idp || '';
  const firstLinkUpdates = (target) => {
    let changed = false;
    if (!target.issuer && issuer) { target.issuer = issuer; changed = true; }
    if (!target.subject && subject) { target.subject = subject; changed = true; }
    if (!target.idp && idp) { target.idp = idp; changed = true; }
    if (!target.email && email) { target.email = email; changed = true; }
    if (!target.id && email) { target.id = email; changed = true; }
    return changed;
  };

  if (existing) {
    const user = existing;
    let changed = false;
    const firstLink = !(user.issuer && user.subject);
    console.log('[linkOrCreateSsoUser] Found existing user:', user.id, 'firstLink:', firstLink);

    if (firstLink) {
      changed = firstLinkUpdates(user) || changed;
      console.log('[linkOrCreateSsoUser] First link updates applied. issuer:', user.issuer?.substring(0, 30) + '...', 'subject:', user.subject);
    }

    // Only hydrate optional profile fields if they are missing to avoid clobbering admin edits
    if (!user.firstName && mapped.firstName) { user.firstName = mapped.firstName; changed = true; }
    if (!user.lastName && mapped.lastName) { user.lastName = mapped.lastName; changed = true; }
    const computedName = buildDisplayName(user.firstName || mapped.firstName, user.lastName || mapped.lastName, user.displayName || mapped.displayName || user.id);
    if (!user.displayName && computedName) { user.displayName = computedName; changed = true; }
    if (!user.authMode || user.authMode !== 'sso') { user.authMode = 'sso'; changed = true; }
    if (changed) {
      user.lastUpdated = new Date().toISOString();
      writeUsers(users);
    }
    return { user, created: false };
  }

  if (!cfg.ssoAutoCreateUsers || !email) {
    return { error: { status: 409, code: 'link_required', message: 'No matching predeclared SSO user. Please predeclare or enable auto-create.' } };
  }

  const newUser = {
    id: email,
    email,
    displayName: buildDisplayName(mapped.firstName, mapped.lastName, mapped.displayName || email),
    firstName: mapped.firstName || '',
    lastName: mapped.lastName || '',
    businessRole: '',
    roles: ['viewer'],
    profileIcon: '',
    profileIconPosition: { x: 50, y: 50 },
    profileIconCrop: { bottom: 50, right: 50, size: 100 },
    authMode: 'sso',
    idp,
    issuer,
    subject,
    lastUpdated: new Date().toISOString(),
  };
  users.push(newUser);
  writeUsers(users);
  return { user: newUser, created: true };
}

// Use Express's built-in JSON parser instead of body-parser
app.use(express.json());

// CORS headers to allow frontend (Vite on different port) to access API
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Ensure data dir exists
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Initialize config file if missing
if (!fs.existsSync(CONFIG_FILE)) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify({ config: {}, supportedLanguages: [] }, null, 2));
}

// --- Users API (single users.json storage, migrate SSO on startup) ---
const readUsers = () => {
  try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')) || []; } catch { return []; }
};
const writeUsers = (users) => {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

function unifySsoIntoUsers() {
  try {
    const users = readUsers();
    if (!fs.existsSync(SSO_USERS_FILE)) return;
    const ssoUsers = readSsoUsers();
    if (!Array.isArray(ssoUsers) || ssoUsers.length === 0) return;
    let changed = false;
    ssoUsers.forEach(sso => {
      const email = (sso.email || sso.id || '').toLowerCase();
      const idx = users.findIndex(u => (
        (u.issuer && u.subject && sso.issuer && sso.subject && u.issuer === sso.issuer && u.subject === sso.subject) ||
        (u.email && email && String(u.email).toLowerCase() === email) ||
        (String(u.id || '').toLowerCase() === email)
      ));
      const merged = {
        id: sso.email || sso.id,
        email: sso.email || '',
        displayName: buildDisplayName(sso.firstName, sso.lastName, sso.displayName || sso.email || sso.id),
        firstName: sso.firstName || '',
        lastName: sso.lastName || '',
        businessRole: sso.businessRole || '',
        roles: Array.isArray(sso.roles) ? sso.roles : ['viewer'],
        profileIcon: sso.profileIcon || '',
        profileIconPosition: sso.profileIconPosition || { x: 50, y: 50 },
        profileIconCrop: sso.profileIconCrop || { bottom: 50, right: 50, size: 100 },
        authMode: 'sso',
        idp: sso.idp || '',
        issuer: sso.issuer || '',
        subject: sso.subject || '',
        lastUpdated: new Date().toISOString(),
      };
      if (idx >= 0) {
        users[idx] = { ...users[idx], ...merged };
      } else {
        users.push(merged);
      }
      changed = true;
    });
    if (changed) writeUsers(users);
  } catch (e) {
    console.warn('Unify SSO into users failed:', e?.message || e);
  }
}

// Prepare OIDC env from config and lazy initialization
let oidcReady = false;
const ssoStates = new Map();
function ensureOIDCInitialized() {
  if (oidcReady) return;
  const cfg = readConfig();
  // Map config to environment variables expected by oidc-provider
  if (cfg.ssoDiscoveryUrl) process.env.OIDC_PROVIDER_URL = cfg.ssoDiscoveryUrl;
  if (cfg.ssoRedirectUri) process.env.OIDC_REDIRECT_URI = cfg.ssoRedirectUri;
  if (cfg.ssoClientId) process.env.OIDC_CLIENT_ID = cfg.ssoClientId;
  if (cfg.ssoClientSecret) process.env.OIDC_CLIENT_SECRET = cfg.ssoClientSecret;
  try {
    initializeOIDC();
    oidcReady = true;
  } catch (e) {
    console.error('Failed to initialize OIDC:', e?.message || e);
  }
}

// Initialize users file if missing: migrate from config.json users if present
if (!fs.existsSync(USERS_FILE)) {
  try {
    const cfg = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')) || {};
    const users = Array.isArray(cfg.users) ? cfg.users : [];
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch {
    fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
  }
}
// Unify SSO records into users.json (one-time at startup)
unifySsoIntoUsers();

app.get('/config', (req, res) => {
  try {
    const content = fs.readFileSync(CONFIG_FILE, 'utf8');
    let parsed = JSON.parse(content) || {};
    const cfg = parsed.config || {};

    // Ensure SSO keys exist with sensible defaults if missing
    const defaults = {
      ssoProvider: 'azuread',
      ssoProtocol: 'oidc',
      ssoClientId: '',
      ssoClientSecret: '',
      ssoTenantId: '',
      ssoDiscoveryUrl: '',
      ssoRedirectUri: 'http://localhost:5173/callback',
      ssoMetadataUrl: '',
      ssoCognitoDomain: '',
      ssoAutoCreateUsers: false
    };

    // Merge config with defaults: existing config values take precedence
    const mergedConfig = { ...defaults, ...cfg };
    
    // Check if any defaults were missing
    const hasAllDefaults = Object.keys(defaults).every(k => typeof cfg[k] !== 'undefined');
    
    // Persist if any defaults were added
    if (!hasAllDefaults) {
      parsed.config = mergedConfig;
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(parsed, null, 2));
    }

    res.type('application/json').send(JSON.stringify({ config: mergedConfig, supportedLanguages: parsed.supportedLanguages || [] }));
  } catch (err) {
    console.error('Error reading config:', err);
    res.status(500).send({ error: 'unable to read config' });
  }
});

app.post('/config', (req, res) => {
  try {
    const body = req.body || {};
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(body, null, 2));
    res.send({ ok: true });
  } catch {
    res.status(500).send({ error: 'unable to write config' });
  }
});

// Users API (single users.json storage)
app.get('/users', (req, res) => {
  const users = readUsers();
  res.send(users);
});

app.post('/users', (req, res) => {
  const users = readUsers();
  const user = req.body || {};
  if (!user.id) return res.status(400).send({ error: 'id_required', message: 'Field "id" is required' });

  const exists = users.find(u => u.id === user.id);
  if (exists) return res.status(409).send({ error: 'user_exists', message: `User ${user.id} already exists` });

  if ((user.authMode || '').toLowerCase() === 'sso') {
    user.id = (user.email || user.id || '').trim();
    user.authMode = 'sso';
  } else {
    user.authMode = user.authMode || 'local';
  }

  if (user.password && user.authMode === 'local') {
    try { user.passwordHash = hashPassword(user.password); } catch { return res.status(500).send({ error: 'hash_error', message: 'Unable to hash password' }); }
    delete user.password;
  }

  user.displayName = user.displayName || buildDisplayName(user.firstName, user.lastName, user.id);
  user.roles = Array.isArray(user.roles) ? user.roles : ['viewer'];
  user.lastUpdated = new Date().toISOString();

  users.push(user);
  try { writeUsers(users); } catch { return res.status(500).send({ error: 'write_failed', message: 'Unable to persist users file' }); }
  res.status(201).send(user);
});

app.put('/users/:id', (req, res) => {
  const id = req.params.id;
  const body = req.body || {};
  const users = readUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx < 0) return res.status(404).send({ error: 'user_not_found', message: `User ${id} not found` });

  const current = users[idx];
  const targetMode = (body.authMode || current.authMode || 'local').toLowerCase();

  const baseUpdate = {
    id: targetMode === 'sso' ? (body.email || current.email || id) : id,
    email: body.email || current.email || '',
    displayName: body.displayName || current.displayName || '',
    firstName: body.firstName || current.firstName || '',
    lastName: body.lastName || current.lastName || '',
    businessRole: body.businessRole || current.businessRole || '',
    roles: Array.isArray(body.roles) ? body.roles : (current.roles || ['viewer']),
    profileIcon: body.profileIcon || current.profileIcon || '',
    profileIconPosition: body.profileIconPosition || current.profileIconPosition || { x: 50, y: 50 },
    profileIconCrop: body.profileIconCrop || current.profileIconCrop || { bottom: 50, right: 50, size: 100 },
    authMode: targetMode,
    idp: body.idp || current.idp || '',
    issuer: body.issuer || current.issuer || '',
    subject: body.subject || current.subject || '',
    lastUpdated: new Date().toISOString(),
  };

  baseUpdate.displayName = buildDisplayName(baseUpdate.firstName, baseUpdate.lastName, baseUpdate.displayName || baseUpdate.id);

  if (targetMode === 'local' && body.password) {
    try { baseUpdate.passwordHash = hashPassword(body.password); } catch { return res.status(500).send({ error: 'hash_error', message: 'Unable to hash password' }); }
  }

  try {
    users[idx] = baseUpdate;
    writeUsers(users);
    return res.send(baseUpdate);
  } catch {
    return res.status(500).send({ error: 'write_failed', message: 'Unable to persist users file' });
  }
});

app.delete('/users/:id', (req, res) => {
  const id = req.params.id;
  const users = readUsers();
  const filtered = users.filter(u => u.id !== id);
  try {
    writeUsers(filtered);
  } catch {
    return res.status(500).send({ error: 'write_failed', message: 'Unable to persist users file' });
  }
  res.send({ ok: true });
});

app.get('/roles', (req, res) => {
  // read roles from config.json
  try {
    const full = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')) || {};
    const roles = (full.config && Array.isArray(full.config.appRoles)) ? full.config.appRoles : (Array.isArray(full.roles) ? full.roles : []);
    res.send(roles);
  } catch {
    res.send([]);
  }
});

app.post('/roles', (req, res) => {
  try {
    const full = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')) || {};
    const incoming = req.body;
    const role = (typeof incoming === 'string') ? incoming : (incoming && (incoming.role || incoming.name));
    if (typeof role !== 'string' || !role.trim()) {
      return res.status(400).send({ error: 'invalid_role', message: 'Role must be a non-empty string' });
    }
    if (!full.config) full.config = {};
    if (!Array.isArray(full.config.appRoles)) full.config.appRoles = [];
    if (!full.config.appRoles.includes(role)) full.config.appRoles.push(role);
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(full, null, 2));
    res.send({ roles: full.config.appRoles });
  } catch {
    res.status(500).send({ error: 'roles_update_failed' });
  }
});

// Remove a role from config.appRoles
app.delete('/roles/:role', (req, res) => {
  try {
    const full = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')) || {};
    let target = (req.params.role || '').trim();
    if (!target && req.body) {
      const incoming = req.body;
      target = (typeof incoming === 'string') ? incoming : (incoming && (incoming.role || incoming.name) || '').trim();
    }
    if (!target) return res.status(400).send({ error: 'invalid_role', message: 'Role param is required' });
    if (!full.config) full.config = {};
    if (!Array.isArray(full.config.appRoles)) full.config.appRoles = [];
    const before = full.config.appRoles.length;
    full.config.appRoles = full.config.appRoles.filter(r => r !== target);
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(full, null, 2));
    const removed = before - full.config.appRoles.length;
    res.send({ removed, roles: full.config.appRoles });
  } catch {
    res.status(500).send({ error: 'roles_delete_failed' });
  }
});

// --- Auth endpoints (local & SSO stub) ---
import crypto from 'crypto';

function hashPassword(pwd){ return crypto.createHash('sha256').update(pwd||'').digest('hex'); }

app.post('/auth/login', (req, res) => {
  const { id, password } = req.body || {};
  const users = readUsers();
  const user = (users||[]).find(u=>u.id===id);
  if (!user) return res.status(401).send({ error: 'user_not_found', message: `User ${id} not found` });
  const expected = (user.passwordHash || '');
  const suppliedHash = hashPassword(password);
  if (expected !== suppliedHash) return res.status(401).send({ error: 'wrong_password', message: 'Password does not match' });
  const token = crypto.randomBytes(16).toString('hex');
  res.send({ token, id, displayName: user.displayName || id, businessRole: user.businessRole || null, roles: user.roles || [], authMode: user.authMode || 'local' });
});

app.post('/auth/sso', (req, res) => {
  // Generate provider authorization URL using OIDC
  try {
    ensureOIDCInitialized();
    const cfg = readConfig();
    const { url, state, nonce } = getAuthorizationUrl();
    // Keep state to validate later on callback exchange
    ssoStates.set(state, { nonce, redirectUri: cfg.ssoRedirectUri || 'http://localhost:5173/callback', createdAt: Date.now() });
    res.send({ ssoRedirect: url, state });
  } catch (e) {
    console.error('Failed to start SSO:', e?.message || e);
    res.status(500).send({ error: 'sso_start_failed' });
  }
});

// Exchange authorization code and link SSO identity to app user
app.post('/auth/sso/callback', async (req, res) => {
  try {
    const { code, state } = req.body || {};
    if (!code || !state) return res.status(400).send({ error: 'missing_params', message: 'code and state are required' });
    ensureOIDCInitialized();
    const session = ssoStates.get(state);
    if (!session) return res.status(400).send({ error: 'invalid_state', message: 'Unknown or expired state' });

    // State entries expire after 10 minutes
    if (Date.now() - session.createdAt > 10 * 60 * 1000) {
      ssoStates.delete(state);
      return res.status(400).send({ error: 'state_expired' });
    }

    const { nonce, redirectUri } = session;
    const tokens = await exchangeCodeForTokens(code, redirectUri, state, nonce);
    const claims = tokens.claims || {};
    const cfg = readConfig();
    const mapped = mapClaimsToProfile(claims, cfg);
    const result = linkOrCreateSsoUser(mapped, claims, cfg);
    if (result?.error) return res.status(result.error.status).send({ error: result.error.code, message: result.error.message });

    const user = result.user;
    const issuer = user.issuer || mapped.issuer;
    const subject = user.subject || mapped.subject;
    const idp = user.idp || mapped.idp;

    // Issue application session token (opaque) and return linked app user
    const token = crypto.randomBytes(16).toString('hex');
    res.send({
      token,
      id: user.id,
      displayName: user.displayName || user.id,
      roles: user.roles || [],
      authMode: 'sso',
      idp: user.idp || idp,
      issuer,
      subject,
      claims,
    });
  } catch (e) {
    console.error('SSO callback failed:', e?.message || e);
    res.status(500).send({ error: 'sso_callback_failed' });
  }
});

// Link SSO user using client-provided id_token claims (dev convenience)
app.post('/auth/sso/link', (req, res) => {
  try {
    const { idToken, claims: providedClaims } = req.body || {};
    console.log('[SSO Link] Request body keys:', Object.keys(req.body || {}));
    console.log('[SSO Link] idToken present?', !!idToken, 'length:', idToken?.length);
    console.log('[SSO Link] providedClaims present?', !!providedClaims);
    
    let claims = providedClaims || {};
    if (!claims || Object.keys(claims).length === 0) {
      if (idToken) {
        try {
          const parts = String(idToken).split('.');
          console.log('[SSO Link] JWT parts count:', parts.length);
          if (parts.length === 3) {
            const payload = Buffer.from(parts[1], 'base64').toString('utf8');
            console.log('[SSO Link] Decoded payload:', payload.substring(0, 200));
            claims = JSON.parse(payload);
            console.log('[SSO Link] Parsed claims successfully, keys:', Object.keys(claims));
          }
        } catch (e) {
          console.error('[SSO Link] Failed to decode JWT:', e?.message);
        }
      }
    }
    
    if (!claims || (typeof claims !== 'object') || Object.keys(claims).length === 0) {
      console.error('[SSO Link] No valid claims after extraction');
      return res.status(400).send({ error: 'missing_claims' });
    }

    console.log('[SSO Link] Received claims:', JSON.stringify({ email: claims.email, sub: claims.sub, iss: claims.iss, given_name: claims.given_name, family_name: claims.family_name, preferred_username: claims.preferred_username, cognito_username: claims['cognito:username'] }, null, 2));

    const cfg = readConfig();
    const mapped = mapClaimsToProfile(claims, cfg);
    console.log('[SSO Link] Mapped profile:', JSON.stringify(mapped, null, 2));
    console.log('[SSO Link] ssoAutoCreateUsers:', cfg.ssoAutoCreateUsers);
    
    const result = linkOrCreateSsoUser(mapped, claims, cfg);
    if (result?.error) {
      console.error('[SSO Link] Link failed:', result.error.code, '-', result.error.message);
      return res.status(result.error.status).send({ error: result.error.code, message: result.error.message });
    }

    const user = result.user;
    console.log('[SSO Link] Link successful! User:', user.id, 'issuer:', user.issuer?.substring(0, 30) + '...', 'subject:', user.subject);
    res.send({
      id: user.id,
      displayName: user.displayName || user.id,
      roles: user.roles || [],
      authMode: 'sso',
      idp: user.idp || mapped.idp,
      issuer: user.issuer || mapped.issuer,
      subject: user.subject || mapped.subject,
    });
  } catch (e) {
    console.error('SSO link failed:', e?.message || e);
    res.status(500).send({ error: 'sso_link_failed' });
  }
});

// --- Translation management endpoint ---
app.post('/translations/remove-keys', (req, res) => {
  try {
    const { keys } = req.body || {};
    console.log('Received request to remove keys:', keys);
    
    if (!Array.isArray(keys) || keys.length === 0) {
      return res.status(400).send({ error: 'keys array required' });
    }
    
    const i18nPath = path.join(__dirname, '..', 'src', 'i18n', 'index.js');
    console.log('Reading file:', i18nPath);
    
    if (!fs.existsSync(i18nPath)) {
      console.error('File not found:', i18nPath);
      return res.status(404).send({ error: 'i18n file not found' });
    }
    
    let content = fs.readFileSync(i18nPath, 'utf8');
    const originalLength = content.length;
    let totalRemoved = 0;
    
    // Pour chaque clé à supprimer, on enlève la ligne correspondante dans EN et FR
    keys.forEach(key => {
      // Échapper les caractères spéciaux dans la clé
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Pattern 1: Clé sur une ligne complète
      const patternFullLine = new RegExp(`^\\s*'${escapedKey}':\\s*'(?:[^'\\\\]|\\\\.)*',?\\s*$`, 'gm');
      // Pattern 2: Clé au milieu d'une ligne (avec d'autres clés)
      const patternInline = new RegExp(`\\s*'${escapedKey}':\\s*'(?:[^'\\\\]|\\\\.)*',\\s*`, 'g');
      
      const before = content.length;
      
      // Essayer d'abord le pattern de ligne complète
      let newContent = content.replace(patternFullLine, '');
      
      // Si rien n'a été supprimé, essayer le pattern inline
      if (newContent.length === before) {
        newContent = content.replace(patternInline, '');
      }
      
      content = newContent;
      const after = content.length;
      const removed = before - after;
      totalRemoved += removed;
      console.log(`Key ${key}: removed ${removed} characters (${removed > 0 ? 'SUCCESS' : 'NOT FOUND'})`);
    });
    
    console.log(`Total removed: ${totalRemoved} characters from ${keys.length} keys`);
    
    console.log(`Total removed: ${totalRemoved} characters from ${keys.length} keys`);
    
    // Nettoyer les doubles sauts de ligne
    content = content.replace(/\n\n\n+/g, '\n\n');
    
    if (totalRemoved === 0) {
      console.warn('WARNING: No characters were removed. Keys might not exist or pattern did not match.');
      return res.status(400).send({ 
        error: 'no_keys_removed', 
        message: 'Aucune clé trouvée dans le fichier. Vérifiez que les clés existent.',
        keys: keys
      });
    }
    
    console.log(`Content changed from ${originalLength} to ${content.length} characters`);
    fs.writeFileSync(i18nPath, content, 'utf8');
    console.log('File saved successfully');
    
    res.send({ success: true, removedKeys: keys.length, charactersRemoved: totalRemoved });
  } catch (err) {
    console.error('Error removing translation keys:', err);
    res.status(500).send({ error: 'failed to remove keys', message: err.message });
  }
});

// --- Translation update endpoint ---
app.post('/translations/update-keys', (req, res) => {
  try {
    const { updates, language } = req.body || {};
    console.log(`Received request to update ${Object.keys(updates || {}).length} keys in language: ${language}`);
    
    if (!updates || typeof updates !== 'object') {
      return res.status(400).send({ error: 'updates object required' });
    }
    
    if (!language || (language !== 'en' && language !== 'fr')) {
      return res.status(400).send({ error: 'language must be "en" or "fr"' });
    }
    
    const i18nPath = path.join(__dirname, '..', 'src', 'i18n', 'index.js');
    console.log('Reading file:', i18nPath);
    
    if (!fs.existsSync(i18nPath)) {
      console.error('File not found:', i18nPath);
      return res.status(404).send({ error: 'i18n file not found' });
    }
    
    let content = fs.readFileSync(i18nPath, 'utf8');
    let updatedCount = 0;
    
    // Pour chaque clé à mettre à jour
    Object.entries(updates).forEach(([key, newValue]) => {
      // Échapper les caractères spéciaux
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const escapedValue = newValue.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      
      // Pattern pour trouver la clé dans la section de la langue appropriée
      // On cherche: 'key': 'old_value'
      const pattern = new RegExp(`('${escapedKey}':\\s*)'(?:[^'\\\\]|\\\\.)*'`, 'g');
      
      const before = content;
      content = content.replace(pattern, `$1'${escapedValue}'`);
      
      if (content !== before) {
        updatedCount++;
        console.log(`Key ${key}: UPDATED to "${newValue.substring(0, 50)}${newValue.length > 50 ? '...' : ''}"`);
      } else {
        console.log(`Key ${key}: NOT FOUND`);
      }
    });
    
    if (updatedCount === 0) {
      console.warn('WARNING: No keys were updated.');
      return res.status(400).send({ 
        error: 'no_keys_updated', 
        message: 'Aucune clé n\'a été mise à jour. Vérifiez que les clés existent.'
      });
    }
    
    fs.writeFileSync(i18nPath, content, 'utf8');
    console.log(`File saved successfully. Updated ${updatedCount}/${Object.keys(updates).length} keys.`);
    
    res.send({ success: true, updatedKeys: updatedCount });
  } catch (err) {
    console.error('Error updating translation keys:', err);
    res.status(500).send({ error: 'failed to update keys', message: err.message });
  }
});


// --- AWS Identity Check ---
app.get('/aws/identity', async (req, res) => {
  try {
    // Create STS client (uses default credential provider)
    const stsClient = new STSClient({ region: process.env.AWS_REGION || 'ca-central-1' });
    
    // Get caller identity
    const command = new GetCallerIdentityCommand({});
    const result = await stsClient.send(command);
    
    res.send({
      accountId: result.Account,
      arn: result.Arn,
      userId: result.UserId,
      lastChecked: new Date().toISOString(),
    });
  } catch (error) {
    // Credentials expired/missing is expected behavior - only log at debug level
    if (error.name === 'CredentialsProviderError') {
      // Silent fail - UI will show "AWS Offline" status
      res.status(401).send({
        error: 'aws_auth_failed',
        message: 'AWS credentials expired or not configured. Run: aws sso login',
      });
    } else {
      console.error('Error checking AWS identity:', error);
      res.status(500).send({
        error: 'aws_check_failed',
        message: error.message,
      });
    }
  }
});

// --- Upload API - Generate presigned S3 URL ---
app.post('/uploads/presign', async (req, res) => {
  try {
    const { filename, source = 'pingcastle' } = req.body;
    
    if (!filename) {
      return res.status(400).send({ error: 'filename_required', message: 'Filename is required' });
    }

    // Load dynamic config values from persisted config.json
    let cfg = {};
    try {
      const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      cfg = parsed.config || parsed || {};
    } catch {
      // Config file missing or invalid, use empty config
    }

    // AWS S3 configuration: prefer UI-configured values, then env vars, then defaults
    const bucketName = cfg.awsS3BucketRaw 
      || process.env.AWS_S3_BUCKET_RAW 
      || 'adcyberwatch-poc-rawbucket-5nhz0ruxom7k';
    const region = cfg.awsRegion 
      || process.env.AWS_REGION 
      || 'ca-central-1';
    
    // Initialize S3 client
    const s3Client = new S3Client({ region });
    
    // Generate unique S3 key with timestamp
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const uniqueId = Date.now();
    const s3Key = `raw/${source}/scan/date=${timestamp}/${uniqueId}-${filename}`;
    
    // Create PutObject command
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      ContentType: 'application/xml', // PingCastle reports are XML
    });
    
    // Generate presigned URL (valid for 15 minutes)
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });
    
    res.send({
      uploadUrl,
      s3Key,
      bucket: bucketName,
      expiresIn: 900,
      uploadId: uniqueId
    });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      statusCode: error.$metadata?.httpStatusCode,
    });
    res.status(500).send({ 
      error: 'presign_failed', 
      message: error.message || 'Failed to generate presigned URL',
      details: error.code
    });
  }
});

// Get upload history from S3 bucket
app.get('/uploads', async (req, res) => {
  try {
    const config = readConfig();
    const bucketName = config.awsS3BucketRaw;
    const region = config.awsRegion || 'ca-central-1';
    const tableName = 'adcyberwatch-main'; // From CloudFormation output
    
    if (!bucketName) {
      return res.status(400).send({ error: 'S3 bucket not configured' });
    }
    
    const s3Client = new S3Client({ region });
    
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: 'raw/pingcastle/scan/',
    });
    
    const response = await s3Client.send(command);
    
    // Initialize DynamoDB client
    const dynamoClient = new DynamoDBClient({ region });
    const docClient = DynamoDBDocumentClient.from(dynamoClient);
    
    const uploads = await Promise.all((response.Contents || []).map(async obj => {
      // Extract filename from key
      const keyParts = obj.Key.split('/');
      const filename = keyParts[keyParts.length - 1];
      
      // Extract timestamp from filename if present
      const timestampMatch = filename.match(/^(\d+)-/);
      const id = timestampMatch ? parseInt(timestampMatch[1]) : new Date(obj.LastModified).getTime();
      
      // Check if findings exist in DynamoDB by counting evidence items
      let findings = 0;
      let status = 'uploaded';
      
      try {
        // Count evidence entries (sk starts with EVID#) for this s3Key
        const scanCmd = new ScanCommand({
          TableName: tableName,
          FilterExpression: 's3Key = :s3Key AND begins_with(sk, :evid)',
          ExpressionAttributeValues: {
            ':s3Key': obj.Key,
            ':evid': 'EVID#'
          },
          Select: 'COUNT'
        });
        
        const result = await docClient.send(scanCmd);
        findings = result.Count || 0;
        if (findings > 0) {
          status = 'processed';
        }
      } catch (err) {
        console.warn('Could not query DynamoDB for', filename, ':', err.message);
      }
      
      return {
        id,
        filename,
        s3Key: obj.Key,
        bucket: bucketName,
        uploadedAt: obj.LastModified,
        status,
        source: 'pingcastle',
        size: obj.Size,
        findings
      };
    }));
    
    // Sort by upload date, most recent first
    uploads.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    
    res.send({ uploads });
  } catch (error) {
    console.error('Error reading uploads from S3:', error);
    res.status(500).send({ error: 'Failed to read upload history from S3' });
  }
});

// Delete upload from S3 (admin only)
app.delete('/uploads', async (req, res) => {
  try {
    // Get the s3Key from query parameter
    const s3Key = req.query.key;
    
    if (!s3Key) {
      return res.status(400).send({ error: 'S3 key is required' });
    }
    
    // TODO: Add admin check here when authentication is implemented
    // For now, allow deletion
    
    const config = readConfig();
    const bucketName = config.awsS3BucketRaw;
    const region = config.awsRegion || 'ca-central-1';
    
    if (!bucketName) {
      return res.status(400).send({ error: 'S3 bucket not configured' });
    }
    
    const s3Client = new S3Client({ region });
    
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
    });
    
    await s3Client.send(command);
    
    console.log('Deleted S3 object:', s3Key);
    res.send({ success: true, deletedKey: s3Key });
  } catch (error) {
    console.error('Error deleting upload from S3:', error);
    res.status(500).send({ error: 'Failed to delete upload from S3', message: error.message });
  }
});




app.listen(PORT, () => {
  console.log(`Config server listening on http://127.0.0.1:${PORT}`);
  console.log(`Config file: ${CONFIG_FILE}`);
});
