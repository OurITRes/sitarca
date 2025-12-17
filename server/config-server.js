// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (c) 2025 OurITRes

/* global process */
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const DATA_DIR = path.join(__dirname, 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

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

app.get('/config', (req, res) => {
  try {
    const content = fs.readFileSync(CONFIG_FILE, 'utf8');
    res.type('application/json').send(content);
  } catch {
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

// --- Users API (separate users.json) ---
const readUsers = () => {
  try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')) || []; } catch { return []; }
};
const writeUsers = (users) => {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

app.get('/users', (req, res) => {
  const users = readUsers();
  res.send(users);
});

app.post('/users', (req, res) => {
  const users = readUsers();
  const user = req.body || {};
  if (!user.id) return res.status(400).send({ error: 'id_required', message: 'Field "id" is required' });
  if (users.find(u => u.id === user.id)) return res.status(409).send({ error: 'user_exists', message: `User ${user.id} already exists` });

  // If a plaintext password was provided, store its hash and remove plaintext
  if (user.password) {
    try { user.passwordHash = hashPassword(user.password); } catch { return res.status(500).send({ error: 'hash_error', message: 'Unable to hash password' }); }
    delete user.password;
  }

  // Set displayName from last/first if provided
  if (!user.displayName) {
    const ln = user.lastName || '';
    const fn = user.firstName || '';
    if (ln || fn) user.displayName = `${ln}${fn ? (ln ? ', ' : '') + fn : ''}`.trim();
    else user.displayName = user.id;
  }

  user.roles = user.roles || ['user'];
  user.authMode = user.authMode || 'local';

  users.push(user);
  try { writeUsers(users); } catch { return res.status(500).send({ error: 'write_failed', message: 'Unable to persist users file' }); }
  res.status(201).send(user);
});

app.put('/users/:id', (req, res) => {
  const users = readUsers();
  const id = req.params.id;
  const idx = users.findIndex(u => u.id === id);
  if (idx < 0) return res.status(404).send({ error: 'not_found', message: 'User not found' });
  const body = req.body || {};

  // handle password update
  if (body.password) {
    try { body.passwordHash = hashPassword(body.password); } catch { return res.status(500).send({ error: 'hash_error', message: 'Unable to hash password' }); }
    delete body.password;
  }

  users[idx] = { ...users[idx], ...body };
  try { writeUsers(users); } catch { return res.status(500).send({ error: 'write_failed', message: 'Unable to persist users file' }); }
  res.send(users[idx]);
});

app.delete('/users/:id', (req, res) => {
  let users = readUsers();
  const id = req.params.id;
  users = users.filter(u => u.id !== id);
  try { writeUsers(users); } catch { return res.status(500).send({ error: 'write_failed', message: 'Unable to persist users file' }); }
  res.send({ ok: true });
});

app.get('/roles', (req, res) => {
  // read roles from config.json
  try {
    const full = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')) || {};
    res.send(full.roles || []);
  } catch {
    res.send([]);
  }
});

app.post('/roles', (req, res) => {
  try {
    const full = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')) || {};
    const role = req.body || {};
    full.roles = full.roles || [];
    full.roles.push(role);
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(full, null, 2));
    res.send(role);
  } catch {
    res.status(500).send({ error: 'roles_update_failed' });
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
  res.send({ ssoRedirect: 'https://sso.example.com/auth?client_id=demo' });
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

app.listen(PORT, () => {
  console.log(`Config server listening on http://127.0.0.1:${PORT}`);
  console.log(`Config file: ${CONFIG_FILE}`);
});
