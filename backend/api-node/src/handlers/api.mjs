import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const fs = require('fs');
const path = require('path');
const { parseStringPromise } = require('xml2js');
import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

const s3Client = new S3Client({});


const TENANT_ALIAS = process.env.TENANT_ALIAS || 'local';
const DEFAULT_DATA_ENV = process.env.DEFAULT_DATA_ENV || 'prod';
const ENABLED_DATA_ENVS = (process.env.ENABLED_DATA_ENVS || 'prod,dev')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const RAW_BUCKET = process.env.RAW_BUCKET; // MVP: bucket unique
const FRAMEWORKS_BUCKET = process.env.FRAMEWORKS_BUCKET;

function getUserFromAuthorizer(event) {
  const auth = event.requestContext?.authorizer;
  const claims = auth?.jwt?.claims || auth?.claims;
  if (!claims) return null;

  const groupsRaw = claims['cognito:groups'];
  const groups = Array.isArray(groupsRaw)
    ? groupsRaw
    : (typeof groupsRaw === 'string' ? groupsRaw.split(',').map(s => s.trim()).filter(Boolean) : []);

  return {
    sub: claims.sub,
    email: claims.email,
    username: claims['cognito:username'] || claims.username,
    groups,
    claims
  };
}

function corsHeaders(event) {
  const allowList = (process.env.CORS_ALLOW_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  const reqOrigin = event?.headers?.origin || event?.headers?.Origin;

  // si pas de allowList => fallback permissif DEV
  if (allowList.length === 0) {
    return {
      'Access-Control-Allow-Origin': reqOrigin || '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Amz-Security-Token,X-Api-Key',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Credentials': 'true',
      'Vary': 'Origin',
    };
  }

  const origin = (reqOrigin && allowList.includes(reqOrigin)) ? reqOrigin : allowList[0];
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Amz-Security-Token,X-Api-Key',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin',
  };
}

function json(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  };
}

function normalizePath(event) {
  const method = event?.requestContext?.http?.method || event?.httpMethod || '';
  const rawPath = event?.rawPath || event?.path || '';
  const stage = event?.requestContext?.stage;

  // HTTP API: parfois rawPath inclut /prod/..., parfois non => on strip si présent
  let path = rawPath;
  if (stage && path.startsWith(`/${stage}/`)) {
    path = path.slice(stage.length + 1);
  } else if (stage && path === `/${stage}`) {
    path = '/';
  }
  return { method, stage, rawPath, path: path || '/' };
}

/**
 * GET /health (public)
 */
async function healthHandler(event, headers) {
  return json(200, { status: 'ok', ts: new Date().toISOString() }, headers);
}

/**
 * GET /public/config (public)
 * => runtime config minimal (branding + envs + tenantAlias)
 */
async function publicConfigHandler(event, headers) {
  return json(200, {
    tenantAlias: TENANT_ALIAS,
    defaultEnv: DEFAULT_DATA_ENV,
    enabledEnvs: ENABLED_DATA_ENVS,
    frameworksBucket: FRAMEWORKS_BUCKET || null,
    // Placeholders branding (tu pourras enrichir)
    branding: { productName: 'AD Cyberwatch AI', tenantAlias: TENANT_ALIAS },
    supportedLanguages: ['en', 'fr'],
    config: {
      // tu peux y mettre ce que ton UI attend (MVP)
      minPasswordLength: 12
    }
  }, headers);
}

/**
 * GET /control/environments (protected)
 */
async function controlEnvironmentsHandler(event, headers) {
  const user = getUserFromAuthorizer(event);
  if (!user) return json(401, { error: 'Unauthorized' }, headers);

  // MVP: on renvoie des env ids, et l’UI construit /data/{env}/...
  const envs = ENABLED_DATA_ENVS.map(id => ({
    id,
    label: id.toUpperCase(),
    isDefault: id === DEFAULT_DATA_ENV
  }));

  return json(200, {
    tenantAlias: TENANT_ALIAS,
    defaultEnv: DEFAULT_DATA_ENV,
    environments: envs
  }, headers);
}

/**
 * GET /control/me (protected)
 */
async function controlMeHandler(event, headers) {
  const user = getUserFromAuthorizer(event);
  if (!user) return json(401, { error: 'Unauthorized' }, headers);

  return json(200, {
    tenantAlias: TENANT_ALIAS,
    user: {
      sub: user.sub,
      email: user.email,
      username: user.username,
      roles: user.groups || [],
    },
    ts: new Date().toISOString()
  }, headers);
}

async function listUploadsFromS3(env) {
  const Prefix = `raw/env=${env}/`;

  const resp = await s3Client.send(new ListObjectsV2Command({
    Bucket: RAW_BUCKET,
    Prefix,
    MaxKeys: 100
  }));

  const items = (resp.Contents || []).map(o => {
    const key = o.Key;
    const filename = key.split('/').pop();
    return {
      id: key,                 // simple et stable
      s3Key: key,
      filename,
      status: "uploaded",
      findings: 0,
      uploadedAt: (o.LastModified || new Date()).toISOString()
    };
  });

  // tri newest first
  items.sort((a,b) => (b.uploadedAt || "").localeCompare(a.uploadedAt || ""));
  return items;
}

async function deleteUploadFromS3(key) {
  await s3Client.send(new DeleteObjectCommand({ Bucket: RAW_BUCKET, Key: key }));
  return { ok: true };
}

/**
 * POST /uploads/presign (protected)  (legacy)
 * POST /data/{env}/uploads/presign (protected)
 * Body: { source: string, filename: string }
 */
async function presignHandler(event, headers, env) {
  const user = getUserFromAuthorizer(event);
  if (!user) return json(401, { error: 'Unauthorized' }, headers);

  let body;
  try {
    body = typeof event.body === 'string' ? JSON.parse(event.body) : (event.body || {});
  } catch {
    return json(400, { error: 'Invalid JSON body' }, headers);
  }

  const { source, filename } = body;
  if (!source || !filename) return json(400, { error: 'Missing source or filename' }, headers);

  if (!RAW_BUCKET) return json(500, { error: 'RAW_BUCKET missing' }, headers);


  // Génère un uploadId unique (UUID)
  const uploadId = randomUUID();
  // MVP "séparation env" => préfixe dans la clé
  const today = new Date().toISOString().split('T')[0];
  const uuid = randomUUID();
  const safeEnv = (env || DEFAULT_DATA_ENV || 'prod').replace(/[^a-zA-Z0-9_-]/g, '');
  const s3Key = `raw/env=${safeEnv}/${source}/scan/date=${today}/${uploadId}.xml`;

  try {
    const command = new PutObjectCommand({ Bucket: RAW_BUCKET, Key: s3Key });
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });
    return json(200, { uploadUrl, s3Key, uploadId, expiresIn: 900 }, headers);
  } catch (err) {
    console.error('[presign] error:', err);
    return json(500, { error: 'Failed to generate presigned URL' }, headers);
  }
}
async function uploadsListHandler(event, headers, env) {
  const user = getUserFromAuthorizer(event);
  if (!user) return json(401, { error: 'Unauthorized' }, headers);

  const safeEnv = (env || DEFAULT_DATA_ENV || 'prod').replace(/[^a-zA-Z0-9_-]/g, '');
  const items = await listUploadsFromS3(safeEnv);
  return json(200, { env: safeEnv, uploads: items }, headers);
}

async function uploadsDeleteHandler(event, headers, env) {
  const user = getUserFromAuthorizer(event);
  if (!user) return json(401, { error: 'Unauthorized' }, headers);

  const safeEnv = (env || DEFAULT_DATA_ENV || 'prod').replace(/[^a-zA-Z0-9_-]/g, '');
  const key = event.queryStringParameters?.key;
  if (!key) return json(400, { error: 'Missing key query parameter' }, headers);

  // Optionnel (sécurité légère): empêcher de delete hors env
  if (!key.startsWith(`raw/env=${safeEnv}/`)) {
    return json(400, { error: 'Key not in selected env prefix' }, headers);
  }

  const resp = await deleteUploadFromS3(key);
  return json(200, { env: safeEnv, ...resp }, headers);
}


export const handler = async (event) => {
  const headers = corsHeaders(event);
  const { method, path, rawPath, stage } = normalizePath(event);

  // Préflight (au cas où)
  if (method === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  console.info('API request:', { method, rawPath, path, stage });

  try {
    // public
    if (method === 'GET' && path === '/health') return await healthHandler(event, headers);
    if (method === 'GET' && path === '/public/config') return await publicConfigHandler(event, headers);

    // control (protected)
    if (method === 'GET' && (path === '/control/me' || path === '/me')) return await controlMeHandler(event, headers);
    if (method === 'GET' && path === '/control/environments') return await controlEnvironmentsHandler(event, headers);

    // data plane presign
    const m = path.match(/^\/data\/([^/]+)\/uploads\/presign$/);
    if (method === 'POST' && m) return await presignHandler(event, headers, m[1]);
    if (method === 'POST' && path === '/uploads/presign') return await presignHandler(event, headers, DEFAULT_DATA_ENV);

    // GET /data/{env}/pingcastle/rules
    const mRules = path.match(/^\/data\/([^/]+)\/pingcastle\/rules$/);
    if (mRules && method === 'GET') {
      try {
        const rulesPath = path.join(__dirname, '../../../../server/data/PingCastleRules.xml');
        const xml = fs.readFileSync(rulesPath, 'utf-8');
        const result = await parseStringPromise(xml, { explicitArray: false });
        const rules = result.ArrayOfExportedRule?.ExportedRule || [];
        return json(200, { rules }, headers);
      } catch (err) {
        console.error('Error reading PingCastleRules.xml:', err);
        return json(500, { error: 'Failed to load PingCastle rules' }, headers);
      }
    }

    // GET /data/{env}/pingcastle/weaknesses (or findings)
    const mWeak = path.match(/^\/data\/([^/]+)\/pingcastle\/(weaknesses|findings)$/);
    if (mWeak && method === 'GET') {
      try {
        // Pour MVP, on prend le fichier ad_hc_labad.local.xml
        const xmlPath = path.join(__dirname, '../../../../server/data/ad_hc_labad.local.xml');
        const xml = fs.readFileSync(xmlPath, 'utf-8');
        const result = await parseStringPromise(xml, { explicitArray: false });
        // Extraction simple des faiblesses (RiskRules)
        const rules = result.HealthcheckData?.RiskRules?.HealthcheckRiskRule || [];
        return json(200, { weaknesses: rules }, headers);
      } catch (err) {
        console.error('Error reading PingCastle findings:', err);
        return json(500, { error: 'Failed to load PingCastle weaknesses' }, headers);
      }
    }
    // data plane uploads list/delete
    const mList = path.match(/^\/data\/([^/]+)\/uploads$/);
    if (mList && method === 'GET') return await uploadsListHandler(event, headers, mList[1]);
    if (mList && method === 'DELETE') return await uploadsDeleteHandler(event, headers, mList[1]);

    // legacy uploads list/delete (compat)
    // /uploads?env=dev
    if (path === '/uploads' && method === 'GET') {
      const env = event.queryStringParameters?.env || DEFAULT_DATA_ENV;
      return await uploadsListHandler(event, headers, env);
    }
    if (path === '/uploads' && method === 'DELETE') {
      const env = event.queryStringParameters?.env || DEFAULT_DATA_ENV;
      return await uploadsDeleteHandler(event, headers, env);
    }

    return json(404, { error: 'Not Found' }, headers);
  } catch (err) {
    console.error('Unhandled error:', err);
    return json(500, { error: 'Internal Server Error' }, headers);
  }
};
