# Authentication & OIDC Documentation

This directory contains comprehensive documentation about the application's
authentication system, OIDC implementation, and migration paths.

## Quick Navigation

### 📖 For Getting Started

- **[OIDC_SUMMARY.md](./OIDC_SUMMARY.md)** - Quick overview of OIDC and why we use it
  - Best for: Understanding the basics quickly
  - Read time: 5 minutes

### 🔧 For Implementation Details

- **[OIDC.md](./OIDC.md)** - Deep dive into OIDC architecture
  - Best for: Understanding how everything works
  - Read time: 15 minutes
  - Includes: Claims mapping, role management, provider comparison

- **[OIDC_IMPLEMENTATION.md](./OIDC_IMPLEMENTATION.md)** - Step-by-step implementation guide
  - Best for: Understanding the code changes
  - Read time: 20 minutes
  - Includes: Code samples, architecture diagrams, best practices

### 🧪 For Testing

- **[TESTING_OIDC.md](./TESTING_OIDC.md)** - Complete testing guide
  - Best for: Testing the authentication flow
  - Read time: 10 minutes (execution time: 30 minutes)
  - Includes: Step-by-step test procedures, debugging tips, success criteria

### 🚀 For Migration to Entra ID

- **[MIGRATE_TO_ENTRA_ID.md](./MIGRATE_TO_ENTRA_ID.md)** - Complete Entra ID setup guide
  - Best for: Setting up Microsoft Entra ID (Azure AD) as authentication provider
  - Read time: 15 minutes
  - Includes: App registration steps, claim mapping, troubleshooting

## Quick Reference

### Current Implementation

```text
Authentication Type:  OIDC (OpenID Connect)
Primary Provider:     Amazon Cognito (AWS)
Alternative Provider: Microsoft Entra ID (ready to switch)
Backend Server:       Node.js Express on port 3001
Frontend:            React + Vite on port 5173
Security:            PKCE (Proof Key for Public Clients)
User Storage:        
  - Local: server/data/users.json
  - SSO:   server/data/sso-users.json
```

### Authentication Flows

#### Local (Admin User)

```text
Login → Check credentials in users.json → Set authenticated user → Access app
```

#### SSO (Cognito/Entra ID)

```text
Login → Redirect to OIDC provider → User authenticates → 
Exchange code for tokens → Decode JWT → Extract claims → Access app
```

### What is OIDC?

OIDC = OAuth 2.0 + Identification

| Aspect | OAuth 2.0 | OIDC |
| ------ | --------- | ---- |
| Purpose | Authorization | Authentication + Authorization |
| Identifies User | ❌ Requires extra API call | ✅ In JWT id_token |
| Providers | Limited | All major providers |
| Security | Good | Better (signed JWT) |

**Key Benefit:** User info is in the JWT, no extra HTTP requests needed.

### Environment Variables

#### Frontend (`.env.local`)

**For Cognito (Current):**

```bash
VITE_COGNITO_DOMAIN=poc-cyberwatch-ai.auth.ca-central-1.amazoncognito.com
VITE_COGNITO_USER_POOL_ID=ca-central-1_diALmgpwp
VITE_COGNITO_CLIENT_ID=3vlaq9e4let52nkjudiid9qrv0
VITE_COGNITO_REDIRECT_URI=http://localhost:5173/callback
VITE_API_URL=http://127.0.0.1:3001
```

**For Entra ID (Future):**

```bash
VITE_COGNITO_DOMAIN=https://login.microsoftonline.com
VITE_COGNITO_USER_POOL_ID=your-tenant-id
VITE_COGNITO_CLIENT_ID=your-app-id
VITE_COGNITO_REDIRECT_URI=http://localhost:5173/callback
VITE_API_URL=http://127.0.0.1:3001
```

#### Backend (`.env`)

**For Cognito (Current):**

```bash
OIDC_PROVIDER_URL=https://cognito-idp.ca-central-1.amazonaws.com/ca-central-1_diALmgpwp
OIDC_CLIENT_ID=3vlaq9e4let52nkjudiid9qrv0
OIDC_REDIRECT_URI=http://localhost:3001/callback
```

**For Entra ID (Future):**

```bash
OIDC_PROVIDER_URL=https://login.microsoftonline.com/your-tenant-id/v2.0
OIDC_CLIENT_ID=your-app-id
OIDC_CLIENT_SECRET=your-secret
OIDC_REDIRECT_URI=http://localhost:3001/callback
```

See [.env.example](../.env.example) for full reference.

## File Changes Summary

### Modified Files

| File | Changes |
| ---- | ------- |
| `src/services/auth.js` | Added OIDC claim extraction, modified callback handling |
| `src/pages/Profile.jsx` | Import `getUserFromToken()`, pre-fill from JWT claims |
| `.env.example` | Updated with OIDC configuration examples |
| `package.json` | Added `openid-client` and `express-session` dependencies |

### New Files

| File | Purpose |
| ---- | ------- |
| `server/oidc-provider.js` | OIDC discovery and client initialization |
| `docs/OIDC.md` | OIDC architecture and concepts |
| `docs/OIDC_SUMMARY.md` | Quick OIDC overview |
| `docs/OIDC_IMPLEMENTATION.md` | Implementation guide |
| `docs/TESTING_OIDC.md` | Testing procedures |
| `docs/MIGRATE_TO_ENTRA_ID.md` | Entra ID setup guide |

## Common Tasks

### How do I

#### ...log in as an admin

1. Open the app
2. Click **Login**
3. Select **Local Authentication**
4. Enter ID: `Admin`, Password: `admin`

#### ...log in with SSO (Cognito)

1. Open the app
2. Click **Login**
3. Click **Login with Cognito**
4. Sign in with your Cognito user (<test@example.com> / P@ssw0rd123!)

#### ...get user information

```javascript
import { getUserFromToken } from './services/auth';

const user = getUserFromToken();
console.log(user.email);        // From JWT claim
console.log(user.displayName);  // From JWT claim
console.log(user.roles);        // From JWT claim
```

#### ...check which provider is being used

```javascript
import { getIdToken } from './services/auth';

if (getIdToken()) {
  console.log('Using SSO (OIDC)');
} else {
  console.log('Using local authentication');
}
```

#### ...migrate from Cognito to Entra ID

See [MIGRATE_TO_ENTRA_ID.md](./MIGRATE_TO_ENTRA_ID.md) - just change environment variables!

#### ...add custom user attributes

For Cognito:

1. User Pool → Attributes
2. Add custom attribute (e.g., `department`)
3. Attribute appears in JWT claim (e.g., `custom:department`)

For Entra ID:

1. Enterprise app → User attributes
2. Add claim mapping
3. Appears in JWT

#### ...assign roles to SSO users

1. Go to Profile page
2. Select roles from the dropdown
3. Click Save
4. Roles saved in `server/data/sso-users.json`

## Troubleshooting

### Login Issues

| Problem | Solution |
| ------- | -------- |
| **Redirect loop on callback** | Check `VITE_COGNITO_REDIRECT_URI` matches in provider config |
| **PKCE code verifier not found** | Enable third-party cookies (or use Incognito) |
| **Invalid credentials (local)** | Admin ID must be exactly `Admin`, password `admin` |
| **No user email after SSO login** | Email claim must exist in provider config |

### API Issues

| Problem | Solution |
| ------- | -------- |
| **CORS error on save profile** | Ensure backend running on `http://127.0.0.1:3001` |
| **Cannot load roles** | Verify `getRoles()` endpoint returning data |
| **SSO user not saving** | Check `server/data/sso-users.json` permissions |

For more troubleshooting, see the specific documentation file for your issue.

## Security Considerations

### PKCE (Proof Key for Public Clients)

- ✅ Protects authorization code from interception
- ✅ Required for browser-based apps
- ✅ Automatically handled by `startSSO()` and `handleOAuthCallback()`

### JWT Token Handling

- ✅ Stored in `sessionStorage` (cleared on tab close)
- ✅ ID token signature verified by provider
- ✅ Client-side decode safe (signature already verified)
- ❌ Never put tokens in localStorage (vulnerable to XSS)

### Claims Validation

- ✅ Server can validate tokens using `oidc-client` library
- ✅ Profile info extracted only from verified JWT
- ❌ Never trust claims from unverified sources

## OIDC Standards Compliance

This implementation follows:

- ✅ [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)
- ✅ [OAuth 2.0 Authorization Code Flow](https://tools.ietf.org/html/rfc6749)
- ✅ [PKCE (RFC 7636)](https://tools.ietf.org/html/rfc7636)
- ✅ [JSON Web Token (JWT, RFC 7519)](https://tools.ietf.org/html/rfc7519)

## Supported Providers

| Provider | Status | Guide |
| -------- | ------ | ----- |
| **Cognito** | ✅ Current | Use as-is |
| **Entra ID** | ✅ Ready | [MIGRATE_TO_ENTRA_ID.md](./MIGRATE_TO_ENTRA_ID.md) |
| **Google** | ✅ Possible | Similar to Entra ID setup |
| **GitHub** | ✅ Possible | Similar to Entra ID setup |
| **Okta** | ✅ Possible | Similar to Entra ID setup |

## Key Architecture Decisions

### Why OIDC instead of OAuth 2.0 only?

- OIDC includes user identification in the JWT
- No need for extra `/userinfo` API calls
- Works with all major identity providers
- Better for future provider migration

### Why store SSO users in JSON file?

- Easy to understand and backup
- Works for small teams (MVP phase)
- When scaling, migrate to proper database

### Why PKCE for public client?

- PKCE protects against authorization code interception
- Required for public clients (browser apps)
- Only minimal performance overhead

### Why separate local and SSO user files?

- Local users: `users.json` (for Admin user)
- SSO users: `sso-users.json` (for Cognito/Entra ID users)
- Easier to migrate or remove one auth method

## Performance

- **No extra HTTP requests:** User info in JWT
- **Session storage:** Tokens in memory, cleared on tab close
- **Lightweight:** OIDC discovery cached after first app load
- **Fast token exchange:** Standard OAuth 2.0 code exchange

## Next Steps

1. **Run tests:** Follow [TESTING_OIDC.md](./TESTING_OIDC.md)
2. **Understand architecture:** Read [OIDC_IMPLEMENTATION.md](./OIDC_IMPLEMENTATION.md)
3. **Plan Entra ID migration:** Review [MIGRATE_TO_ENTRA_ID.md](./MIGRATE_TO_ENTRA_ID.md)
4. **Implement production setup:** Update redirect URIs, HTTPS, etc.

## Support

For specific questions:

- **How does OIDC work?** → Read [OIDC.md](./OIDC.md)
- **How to set it up?** → Follow [OIDC_IMPLEMENTATION.md](./OIDC_IMPLEMENTATION.md)
- **How to test it?** → Use [TESTING_OIDC.md](./TESTING_OIDC.md)
- **How to switch to Entra ID?** → Use [MIGRATE_TO_ENTRA_ID.md](./MIGRATE_TO_ENTRA_ID.md)

---

**Your app is now ready for enterprise-grade authentication!** 🎉

Last updated: January 2025
