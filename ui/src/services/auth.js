import { CognitoUserPool, CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';

// OIDC: Decode JWT without verification (for claims extraction from id_token)
// Note: Token signature verification happens server-side; client-side decode is safe for display only
function decodeJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid JWT format');
    
    const decoded = JSON.parse(atob(parts[1]));
    return decoded;
  } catch (e) {
    console.error('Failed to decode JWT:', e);
    return null;
  }
}

// Extract user information from OIDC id_token claims
export function getUserFromToken() {
  const idToken = getIdToken();
  if (!idToken) return null;
  
  const claims = decodeJWT(idToken);
  if (!claims) return null;
  
  // Map OIDC standard claims to user object
  return {
    sub: claims.sub,
    id: claims.email || claims.sub, // Prefer email as ID for SSO
    email: claims.email,
    displayName: (claims.given_name || '') && (claims.family_name || '')
      ? `${claims.given_name} ${claims.family_name}`
      : (claims.name || claims.preferred_username || claims.email || claims.sub),
    firstName: claims.given_name,
    lastName: claims.family_name,
    picture: claims.picture,
    authMode: 'oidc',
    oidcClaims: claims, // Store all claims for extensibility
  };
}

// PKCE helpers for OAuth2
function generateRandomString(length = 128) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  const values = new Uint8Array(length);
  crypto.getRandomValues(values);
  for (let i = 0; i < length; i++) {
    result += charset[values[i] % charset.length];
  }
  return result;
}

async function generateCodeChallenge(codeVerifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode.apply(null, new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Cognito configuration
const poolData = {
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
};

const COGNITO_DOMAIN = import.meta.env.VITE_COGNITO_DOMAIN;
const COGNITO_REGION = import.meta.env.VITE_COGNITO_REGION || 'ca-central-1';
const REDIRECT_URI = import.meta.env.VITE_COGNITO_REDIRECT_URI || 'http://localhost:5173/callback';

const userPool = new CognitoUserPool(poolData);
// Load runtime UI configuration from local server
async function getServerConfig() {
  try {
    const resp = await fetch(`${API_BASE}/config`);
    if (!resp.ok) return {};
    const data = await resp.json();
    return data.config || {};
  } catch {
    return {};
  }
}

// Helper to get ID token
export function getIdToken() {
  return sessionStorage.getItem('idToken');
}

// Helper to check if user is authenticated via Cognito (SSO) or local
export function isLocalUser() {
  const token = getIdToken();
  // Si pas de token Cognito, c'est un utilisateur local
  return !token;
}

// Check if token is expired
export function isTokenExpired() {
  const idToken = getIdToken();
  if (!idToken) return true;
  
  const claims = decodeJWT(idToken);
  if (!claims || !claims.exp) return true;
  
  // exp is in seconds, compare with current time (in seconds)
  const now = Math.floor(Date.now() / 1000);
  return claims.exp < now;
}

// Check if token is about to expire (based on configured threshold)
export async function isTokenAboutToExpire(thresholdSeconds = 300) {
  const idToken = getIdToken();
  if (!idToken) return true;
  
  const claims = decodeJWT(idToken);
  if (!claims || !claims.exp) return true;
  
  const now = Math.floor(Date.now() / 1000);
  const timeUntilExpiry = claims.exp - now;
  
  // Check if expiration is within threshold seconds
  return timeUntilExpiry <= thresholdSeconds;
}

// Refresh the token using refresh token
export async function refreshAccessToken() {
  try {
    const refreshToken = sessionStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const cognitoUser = userPool.getCurrentUser();
    if (!cognitoUser) {
      throw new Error('No current user');
    }

    return new Promise((resolve, reject) => {
      const refreshTokenObj = {
        Token: refreshToken,
      };
      
      cognitoUser.refreshSession(refreshTokenObj, (err, result) => {
        if (err) {
          reject(err);
        } else {
          const idToken = result.getIdToken().getJwtToken();
          const accessToken = result.getAccessToken().getJwtToken();
          
          // Update tokens in sessionStorage
          sessionStorage.setItem('idToken', idToken);
          sessionStorage.setItem('accessToken', accessToken);
          
          resolve({
            idToken,
            accessToken,
          });
        }
      });
    });
  } catch (error) {
    console.error('Token refresh failed:', error);
    // If refresh fails, logout user
    logout();
    throw error;
  }
}

// Helper to get the appropriate API base URL
// Note: Currently unused as all user/role management uses local server
// Kept for potential future use or documentation purposes
// eslint-disable-next-line no-unused-vars
function getApiBase() {
  const localAPI = 'http://127.0.0.1:3001';
  return isLocalUser() ? localAPI : API_BASE;
}

// Helper to fetch with authentication
async function fetchWithAuth(url, options = {}) {
  const token = getIdToken();
  
  // For local users (no SSO token), make request without Bearer token
  const headers = {
    ...options.headers,
  };
  
  // Only add Authorization header if we have an SSO token
  if (token) {
    // Get config to check token refresh settings
    let config = {};
    try {
      const resp = await fetch(`${API_BASE}/config`);
      const data = await resp.json();
      config = data.config || {};
    } catch {
      // intentionally ignore config fetch errors
    }
    
    const thresholdSeconds = config.tokenRefreshThreshold || 300; // default 5 min
    
    // Check if token is expired and refresh if needed
    if (isTokenExpired()) {
      try {
        await refreshAccessToken();
      } catch (error) {
        console.error('Failed to refresh token:', error);
        // Token refresh failed, redirect to login
        window.location.href = '/login';
        throw new Error('Session expired. Please log in again.');
      }
    } else if (await isTokenAboutToExpire(thresholdSeconds)) {
      // Token is about to expire, refresh proactively
      try {
        await refreshAccessToken();
      } catch (error) {
        console.error('Proactive token refresh failed:', error);
        // Non-blocking error for proactive refresh
      }
    }
    
    headers['Authorization'] = `Bearer ${getIdToken()}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 401 Unauthorized - token might be invalid
  if (response.status === 401) {
    // Try to refresh token once
    if (token) {
      try {
        await refreshAccessToken();
        // Retry request with new token
        headers['Authorization'] = `Bearer ${getIdToken()}`;
        return fetch(url, {
          ...options,
          headers,
        });
      } catch (error) {
        console.error('Token refresh failed after 401:', error);
        window.location.href = '/login';
        throw new Error('Session expired. Please log in again.');
      }
    }
  }

  return response;
}

// Cognito authentication
export function loginCognito(email, password) {
  return new Promise((resolve, reject) => {
    const authenticationData = {
      Username: email,
      Password: password,
    };
    const authenticationDetails = new AuthenticationDetails(authenticationData);

    const userData = {
      Username: email,
      Pool: userPool,
    };
    const cognitoUser = new CognitoUser(userData);

    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (result) => {
        const idToken = result.getIdToken().getJwtToken();
        const accessToken = result.getAccessToken().getJwtToken();
        const refreshToken = result.getRefreshToken().getToken();

        // Store tokens in sessionStorage
        sessionStorage.setItem('idToken', idToken);
        sessionStorage.setItem('accessToken', accessToken);
        sessionStorage.setItem('refreshToken', refreshToken);

        resolve({
          idToken,
          accessToken,
          refreshToken,
          user: {
            email: result.getIdToken().payload.email,
            sub: result.getIdToken().payload.sub,
            username: email,
          },
        });
      },
      onFailure: (err) => {
        reject(err);
      },
    });
  });
}

export function logout() {
  const cognitoUser = userPool.getCurrentUser();
  if (cognitoUser) {
    cognitoUser.signOut();
  }
  sessionStorage.removeItem('idToken');
  sessionStorage.removeItem('accessToken');
  sessionStorage.removeItem('refreshToken');
}

// Upload file to S3 using presigned URL
export async function uploadFile(file, source = 'pingcastle') {
  try {
    // Always use local server for uploads (both local and SSO users)
    const localAPI = 'http://127.0.0.1:3001';
    
    const response = await fetchWithAuth(`${localAPI}/uploads/presign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename: file.name,
        source,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to get presigned URL');
    }

    const { uploadUrl, s3Key, uploadId } = await response.json();

    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload file to S3');
    }

    return { s3Key, uploadUrl, uploadId };
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}

export async function getUploads() {
  try {
    const localAPI = 'http://127.0.0.1:3001';
    // Use fetch directly for local API (no auth needed)
    const response = await fetch(`${localAPI}/uploads`);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to fetch uploads');
    }
    
    const data = await response.json();
    return data.uploads || [];
  } catch (error) {
    console.error('Get uploads error:', error);
    throw error;
  }
}

export async function deleteUpload(s3Key) {
  try {
    const localAPI = 'http://127.0.0.1:3001';
    const params = new URLSearchParams({ key: s3Key });
    // Use fetch directly for local API (no auth needed)
    const response = await fetch(`${localAPI}/uploads?${params.toString()}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to delete upload');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Delete upload error:', error);
    throw error;
  }
}

export async function getMe() {
  try {
    const response = await fetchWithAuth(`${API_BASE}/me`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to get user info');
    }
    return await response.json();
  } catch (error) {
    console.error('Get me error:', error);
    throw error;
  }
}

export async function getWeaknesses() {
  try {
    // Always use local server for weaknesses (both local and SSO users)
    const localAPI = 'http://127.0.0.1:3001';
    
    const response = await fetch(`${localAPI}/weaknesses`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to get weaknesses');
    }
    return await response.json();
  } catch (error) {
    console.error('Get weaknesses error:', error);
    throw error;
  }
}

export async function getPingCastleRules() {
  try {
    // Always use local server for PingCastle rules
    const localAPI = 'http://127.0.0.1:3001';
    
    const response = await fetch(`${localAPI}/pingcastle/rules`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to get PingCastle rules');
    }
    return await response.json();
  } catch (error) {
    console.error('Get PingCastle rules error:', error);
    throw error;
  }
}

export async function getWeaknessDetail(weaknessId) {
  try {
    const response = await fetchWithAuth(`${API_BASE}/weaknesses/${weaknessId}`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to get weakness detail');
    }
    return await response.json();
  } catch (error) {
    console.error('Get weakness detail error:', error);
    throw error;
  }
}

export async function getUsers(){
  const localAPI = 'http://127.0.0.1:3001';
  try{ 
    const r = await fetch(`${localAPI}/users`); 
    if (!r.ok) throw new Error('not ok: ' + r.status);
    const data = await r.json();
    console.log('getUsers result:', data);
    return data;
  }catch{
    // getUsers error intentionally ignored
    return [];
  }
}

export async function createUser(user){
  const localAPI = 'http://127.0.0.1:3001';
  try{
    const r = await fetch(`${localAPI}/users`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(user) });
    const data = await r.json().catch(()=>null);
    if (!r.ok) throw new Error(data?.message || data?.error || r.statusText || 'create_failed');
    return data;
  }catch(e){
    throw new Error(`createUser failed: ${e.message}`);
  }
}

export async function updateUser(id, user){
  const localAPI = 'http://127.0.0.1:3001';
  try{
    const r = await fetch(`${localAPI}/users/${encodeURIComponent(id)}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(user) });
    const data = await r.json().catch(()=>null);
    if (!r.ok) throw new Error(data?.message || data?.error || r.statusText || 'update_failed');
    return data;
  }catch(e){
    throw new Error(`updateUser failed: ${e.message}`);
  }
}

export async function deleteUser(id){
  const localAPI = 'http://127.0.0.1:3001';
  try{
    const r = await fetch(`${localAPI}/users/${encodeURIComponent(id)}`, { method: 'DELETE' });
    const data = await r.json().catch(()=>null);
    if (!r.ok) throw new Error(data?.message || data?.error || r.statusText || 'delete_failed');
    return data;
  }catch(e){
    throw new Error(`deleteUser failed: ${e.message}`);
  }
}

export async function getRoles(){
  const localAPI = 'http://127.0.0.1:3001';
  try{ const r = await fetch(`${localAPI}/roles`); if (!r.ok) throw new Error('no'); return await r.json(); }catch{ return []; }
}

export async function createRole(role){
  const localAPI = 'http://127.0.0.1:3001';
  try{
    const payload = (typeof role === 'string') ? role : (role?.role || role?.name || '');
    const r = await fetch(`${localAPI}/roles`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    const data = await r.json().catch(()=>null);
    if (!r.ok) throw new Error(data?.message || data?.error || r.statusText || 'create_role_failed');
    return data;
  }catch(e){ throw new Error(`createRole failed: ${e.message}`); }
}

export async function deleteRole(role){
  const localAPI = 'http://127.0.0.1:3001';
  try{ const r = await fetch(`${localAPI}/roles/${encodeURIComponent(role)}`, { method: 'DELETE' }); const data = await r.json(); if (!r.ok) throw new Error(data?.error || 'delete_role_failed'); return data; }catch(e){ throw new Error(`deleteRole failed: ${e.message}`); }
}

export async function login(id, password){
  // Use local server authentication (port 3001)
  const localAPI = 'http://127.0.0.1:3001';
  try{
    const r = await fetch(`${localAPI}/auth/login`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ id, password })
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data?.message || data?.error || r.statusText || 'login_failed');
    
    // Enrich with user data if available
    if (data && data.id) {
      try {
        const users = await getUsers();
        const u = Array.isArray(users) ? users.find(x => x.id === id) : (users?.find?.(x => x.id === id));
        if (u && u.displayName) data.displayName = u.displayName;
      } catch {
        /* ignore enrichment errors */
      }
    }
    return data;
  } catch(e) {
    throw new Error(`login failed: ${e.message}`);
  }
}

export async function startSSO(){
  // Redirect to Cognito Hosted UI with PKCE
  // Pull overrides from UI config when available
  const cfg = await getServerConfig();
  const domain = cfg.ssoCognitoDomain || COGNITO_DOMAIN;
  if (!domain) {
    throw new Error('Cognito domain not configured');
  }
  
  // Generate PKCE code verifier and challenge
  const codeVerifier = generateRandomString(128);
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  
  // Store code verifier for later exchange
  sessionStorage.setItem('pkce_code_verifier', codeVerifier);
  
  // Pull overrides from UI config when available
  const region = cfg.awsRegion || COGNITO_REGION;
  const clientId = cfg.ssoClientId || poolData.ClientId;
  const redirectUri = cfg.ssoRedirectUri || REDIRECT_URI;
  
  const cognitoUrl = `https://${domain}.auth.${region}.amazoncognito.com/login`;
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: 'email openid profile',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });
  
  window.location.href = `${cognitoUrl}?${params.toString()}`;
}

export async function handleOAuthCallback(code) {
  // Exchange authorization code for tokens using PKCE
  // Pull overrides from UI config when available
  const cfg = await getServerConfig();
  const domain = cfg.ssoCognitoDomain || COGNITO_DOMAIN;
  const region = cfg.awsRegion || COGNITO_REGION;
  const clientId = cfg.ssoClientId || poolData.ClientId;
  const redirectUri = cfg.ssoRedirectUri || REDIRECT_URI;
  const tokenUrl = `https://${domain}.auth.${region}.amazoncognito.com/oauth2/token`;
  
  // Get the stored code verifier
  const codeVerifier = sessionStorage.getItem('pkce_code_verifier');
  if (!codeVerifier) {
    throw new Error('PKCE code verifier not found. Please start SSO again.');
  }
  
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    code: code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error_description || error.error || 'Failed to exchange code for tokens');
  }

  const tokens = await response.json();
  
  // Store tokens
  sessionStorage.setItem('idToken', tokens.id_token);
  sessionStorage.setItem('accessToken', tokens.access_token);
  if (tokens.refresh_token) {
    sessionStorage.setItem('refreshToken', tokens.refresh_token);
  }
  
  // Clean up PKCE verifier after successful exchange
  sessionStorage.removeItem('pkce_code_verifier');

  // Extract OIDC claims from ID token
  const userInfo = getUserFromToken();
  
  // Link SSO identity server-side for role assignment
  try {
    const linkResp = await fetch(`${API_BASE}/auth/sso/link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: tokens.id_token }),
    });
    if (linkResp.ok) {
      const linked = await linkResp.json();
      // Optionally store app session token in the future
      return {
        idToken: tokens.id_token,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        user: {
          id: linked.id || userInfo?.id,
          email: linked.email || userInfo?.email,
          displayName: linked.displayName || userInfo?.displayName,
          firstName: linked.firstName || userInfo?.firstName,
          lastName: linked.lastName || userInfo?.lastName,
          picture: linked.profileIcon || userInfo?.picture,
          roles: linked.roles || userInfo?.roles || [],
          authMode: 'sso',
          idp: linked.idp || 'cognito',
          issuer: linked.issuer,
          subject: linked.subject,
          oidcClaims: userInfo?.oidcClaims,
        },
      };
    }
  } catch {
    /* non-blocking: linking may fail in dev */
  }

  return {
    idToken: tokens.id_token,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    user: userInfo,
  };
}

export default { getUsers, createUser, updateUser, deleteUser, getRoles, createRole, login, startSSO };
