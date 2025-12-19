// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (c) 2025 OurITRes

/* global process */

/**
 * OIDC (OpenID Connect) Provider Configuration
 * 
 * This module provides server-side OIDC configuration using openid-client.
 * OIDC is a standardized identity protocol that works with any OIDC-compliant provider:
 * - Amazon Cognito
 * - Microsoft Entra ID (Azure AD)
 * - Google, GitHub, etc.
 * 
 * Benefits:
 * 1. Standardized: Works with any OIDC provider
 * 2. Secure: Token validation happens server-side
 * 3. Future-proof: Easy migration between providers (e.g., Cognito → Entra ID)
 * 4. Full control: Claims validation, role mapping, etc.
 */

import { Issuer, generators } from 'openid-client';

let client;
let issuer;

/**
 * Initialize OIDC client with provider discovery
 * This discovers all OIDC endpoints automatically from the provider's metadata
 */
export async function initializeOIDC() {
  try {
    // Get configuration from environment or use Cognito defaults
    const providerUrl = process.env.OIDC_PROVIDER_URL || 
      `https://cognito-idp.${process.env.AWS_REGION || 'ca-central-1'}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID || 'ca-central-1_diALmgpwp'}`;
    
    const clientId = process.env.OIDC_CLIENT_ID || '3vlaq9e4let52nkjudiid9qrv0';
    const clientSecret = process.env.OIDC_CLIENT_SECRET; // Optional for public clients
    const redirectUri = process.env.OIDC_REDIRECT_URI || 'http://localhost:3001/callback';
    
    console.log(`[OIDC] Discovering provider: ${providerUrl}`);
    
    // Discover OIDC provider endpoints
    issuer = await Issuer.discover(providerUrl);
    console.log(`[OIDC] Discovered issuer: ${issuer.issuer}`);
    
    // Create OIDC client
    const clientConfig = {
      client_id: clientId,
      redirect_uris: [redirectUri],
      response_types: ['code'],
    };
    
    if (clientSecret) {
      clientConfig.client_secret = clientSecret;
    }
    
    client = new issuer.Client(clientConfig);
    console.log('[OIDC] Client initialized successfully');
    
    return { issuer, client };
  } catch (error) {
    console.error('[OIDC] Failed to initialize:', error.message);
    throw error;
  }
}

/**
 * Get the OIDC client instance
 */
export function getClient() {
  if (!client) {
    throw new Error('OIDC client not initialized. Call initializeOIDC() first.');
  }
  return client;
}

/**
 * Get the OIDC issuer instance
 */
export function getIssuer() {
  if (!issuer) {
    throw new Error('OIDC issuer not initialized. Call initializeOIDC() first.');
  }
  return issuer;
}

/**
 * Generate OIDC authorization URL for login
 * 
 * Compatible with:
 * - Amazon Cognito
 * - Microsoft Entra ID (Azure AD)
 * - Any OIDC provider
 */
export function getAuthorizationUrl() {
  const nonce = generators.nonce();
  const state = generators.state();
  
  return {
    url: client.authorizationUrl({
      scope: 'openid email profile',
      state: state,
      nonce: nonce,
      response_mode: 'form_post', // Optional: use form_post instead of query string
    }),
    nonce,
    state,
  };
}

/**
 * Exchange authorization code for tokens
 * Token validation happens automatically via openid-client
 */
export async function exchangeCodeForTokens(code, redirectUri, state, nonce) {
  try {
    // Exchange code for tokens (callback object is automatically validated)
    const tokenSet = await client.callback(redirectUri, { code, state }, { nonce });
    
    return {
      accessToken: tokenSet.access_token,
      idToken: tokenSet.id_token,
      refreshToken: tokenSet.refresh_token,
      expiresIn: tokenSet.expires_in,
      tokenType: tokenSet.token_type,
      claims: tokenSet.claims(), // Get validated claims from ID token
    };
  } catch (error) {
    console.error('[OIDC] Token exchange failed:', error.message);
    throw error;
  }
}

/**
 * Verify and extract claims from ID token
 * This is useful for validating tokens server-side
 */
export function verifyClaims(idToken) {
  try {
    if (!client) {
      throw new Error('OIDC client not initialized');
    }
    
    const claims = client.decryptIdToken(idToken);
    return claims;
  } catch (error) {
    console.error('[OIDC] Claim verification failed:', error.message);
    throw error;
  }
}

/**
 * Get userinfo from provider using access token
 * Useful for getting additional user information beyond what's in ID token
 */
export async function getUserInfo(accessToken) {
  try {
    const userInfo = await client.userinfo(accessToken);
    return userInfo;
  } catch (error) {
    console.error('[OIDC] UserInfo request failed:', error.message);
    throw error;
  }
}

export default {
  initializeOIDC,
  getClient,
  getIssuer,
  getAuthorizationUrl,
  exchangeCodeForTokens,
  verifyClaims,
  getUserInfo,
};
