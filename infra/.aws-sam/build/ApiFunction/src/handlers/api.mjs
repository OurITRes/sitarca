import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({});
const rawBucket = process.env.RAW_BUCKET;

/**
 * Utility: extract JWT claims from authorizer context
 */
function getUserFromAuthorizer(event) {
  const auth = event.requestContext?.authorizer;
  const claims = auth?.jwt?.claims || auth?.claims;
  if (!claims) {
    return null;
  }
  return {
    sub: claims.sub,
    email: claims.email,
    username: claims['cognito:username']
  };
}

/**
 * Utility: format response
 */
function response(statusCode, body, isBase64 = false) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
    isBase64Encoded: isBase64
  };
}

/**
 * GET /health - public endpoint
 */
async function healthHandler(event) {
  console.info('[health]', { httpMethod: event.httpMethod, path: event.path });
  return response(200, { status: 'ok', timestamp: new Date().toISOString() });
}

/**
 * GET /me - protected endpoint (JWT required)
 */
async function meHandler(event) {
  console.info('[me]', { httpMethod: event.httpMethod, path: event.path });
  
  const user = getUserFromAuthorizer(event);
  if (!user) {
    return response(401, { error: 'Unauthorized' });
  }

  return response(200, {
    user: user,
    timestamp: new Date().toISOString()
  });
}

/**
 * POST /uploads/presign - protected endpoint (JWT required)
 * Body: { source: string, filename: string }
 * Returns: { uploadUrl: string, s3Key: string }
 */
async function presignHandler(event) {
  console.info('[presign]', { httpMethod: event.httpMethod, path: event.path });
  
  const user = getUserFromAuthorizer(event);
  if (!user) {
    return response(401, { error: 'Unauthorized' });
  }

  // Parse request body
  let body;
  try {
    body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
  } catch (err) {
    return response(400, { error: 'Invalid JSON body' });
  }

  const { source, filename } = body;
  if (!source || !filename) {
    return response(400, { error: 'Missing source or filename' });
  }

  // Generate S3 key
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const uuid = uuidv4();
  const s3Key = `raw/${source}/scan/date=${today}/${uuid}.xml`;

  try {
    // Generate presigned PUT URL (valid for 15 minutes)
    const command = new PutObjectCommand({
      Bucket: rawBucket,
      Key: s3Key
    });
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

    return response(200, {
      uploadUrl,
      s3Key,
      expiresIn: 900
    });
  } catch (err) {
    console.error('[presign] error:', err);
    return response(500, { error: 'Failed to generate presigned URL' });
  }
}

/**
 * Router based on path + method
 */
export const handler = async (event) => {
  // Support HTTP API (payload v2.0) and REST API (v1.0) event shapes
  const method = event?.requestContext?.http?.method || event?.httpMethod || '';
  const rawPath = event?.rawPath || event?.path || '';
  const stage = event?.requestContext?.stage;

  // Normalize path: strip stage prefix (e.g., "/prod/health" -> "/health")
  let path = rawPath;
  if (stage) {
    const prefix = `/${stage}`;
    if (rawPath.startsWith(prefix)) {
      path = rawPath.slice(prefix.length) || '/';
    }
  }

  console.info('API request:', {
    method,
    rawPath,
    path,
    stage,
    requestId: event?.requestContext?.requestId
  });

  try {
    // Routes
    if (method === 'GET' && path === '/health') {
      return await healthHandler(event);
    }

    if (method === 'GET' && path === '/me') {
      return await meHandler(event);
    }

    if (method === 'POST' && path === '/uploads/presign') {
      return await presignHandler(event);
    }

    // 404
    return response(404, { error: 'Not Found' });
  } catch (err) {
    console.error('Unhandled error:', err);
    return response(500, { error: 'Internal Server Error' });
  }
};
