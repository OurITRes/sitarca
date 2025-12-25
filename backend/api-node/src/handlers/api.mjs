import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

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

  // MVP "séparation env" => préfixe dans la clé
  const today = new Date().toISOString().split('T')[0];
  const uuid = uuidv4();
  const safeEnv = (env || DEFAULT_DATA_ENV || 'prod').replace(/[^a-zA-Z0-9_-]/g, '');
  const s3Key = `raw/env=${safeEnv}/${source}/scan/date=${today}/${uuid}.xml`;

  try {
    const command = new PutObjectCommand({ Bucket: RAW_BUCKET, Key: s3Key });
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });
    return json(200, { uploadUrl, s3Key, expiresIn: 900 }, headers);
  } catch (err) {
    console.error('[presign] error:', err);
    return json(500, { error: 'Failed to generate presigned URL' }, headers);
  }
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

    return json(404, { error: 'Not Found' }, headers);
  } catch (err) {
    console.error('Unhandled error:', err);
    return json(500, { error: 'Internal Server Error' }, headers);
  }
};
