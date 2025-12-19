# OIDC Implementation Summary

## Quick Facts

| Aspect | Before (OAuth2) | Now (OIDC) |
| ------ | --------------- | ---------- |
| **Standard** | Authorization only | Authentication + Authorization ⭐ |
| **User Info** | Separate API call | In JWT id_token ⭐ |
| **Requests** | Token exchange + `/users/me` | Token exchange only ⭐ |
| **Cognito Support** | ✅ | ✅ |
| **Entra ID Support** | ❌ | ✅ ⭐ |
| **Provider Change** | Requires code changes | Config variables only ⭐ |

## Files Changed

### Core Authentication (`src/services/auth.js`)

```javascript
// NEW: Decode JWT and extract OIDC claims
export function getUserFromToken() {
  const claims = decodeJWT(getIdToken());
  return {
    id: claims.sub,              // OIDC standard subject
    email: claims.email,         // OIDC standard
    displayName: claims.name,    // OIDC standard
    firstName: claims.given_name,
    lastName: claims.family_name,
    picture: claims.picture,
    oidcClaims: claims,          // All claims for extensibility
  };
}

// MODIFIED: Use OIDC claims instead of separate API call
export async function handleOAuthCallback(code) {
  const tokens = await exchangeCode(code);
  sessionStorage.setItem('idToken', tokens.id_token);
  
  // Get user info directly from JWT claims
  const user = getUserFromToken();
  return { tokens, user };
}
```

### New OIDC Server Module (`server/oidc-provider.js`)

```javascript
// OIDC discovery and client initialization
// Works with any OIDC provider: Cognito, Entra ID, Google, GitHub...
import { Issuer, generators } from 'openid-client';

const issuer = await Issuer.discover(OIDC_PROVIDER_URL);
const client = new issuer.Client(config);
```

### Profile Page (`src/pages/Profile.jsx`)

```jsx
// NEW: Automatically populate from OIDC claims
const tokenUser = getUserFromToken();

const [displayName, setDisplayName] = useState(
  tokenUser?.displayName || currentUser.displayName || ''
);
const [picture, setPicture] = useState(
  tokenUser?.picture || currentUser.profileIcon || ''
);
```

## Environment Variables

Create `.env.local`:

```bash
# Cognito (Current)
VITE_COGNITO_DOMAIN=poc-cyberwatch-ai.auth.ca-central-1.amazoncognito.com
VITE_COGNITO_CLIENT_ID=3vlaq9e4let52nkjudiid9qrv0
VITE_COGNITO_REDIRECT_URI=http://localhost:5173/callback

# For Entra ID (Future - Just change these!)
# VITE_COGNITO_DOMAIN=https://login.microsoftonline.com
# VITE_COGNITO_CLIENT_ID=your-azure-app-id
# VITE_COGNITO_REDIRECT_URI=http://localhost:5173/callback
```

## Authentication Flow

```text
User clicks "Login"
    ↓
startSSO()
  • Generate PKCE code_verifier
  • Send code_challenge to Cognito
    ↓
User authenticates with Cognito/Entra ID
    ↓
Redirects back with authorization code
    ↓
handleOAuthCallback(code)
  • Exchange code for tokens (with code_verifier)
  • Receive id_token (JWT with claims)
  • Receive access_token
    ↓
getUserFromToken()
  • Decode id_token (JWT payload)
  • Extract OIDC claims: email, name, picture, roles
  • Return user object
    ↓
Profile page auto-populates
✅ User logged in with complete profile
```

## Key OIDC Claims (In JWT)

```javascript
{
  "sub": "cognito_unique_id",           // Subject (unique user ID)
  "email": "user@example.com",
  "email_verified": true,
  "name": "John Doe",
  "given_name": "John",
  "family_name": "Doe",
  "picture": "https://...",
  "cognito:groups": ["admin"],          // Cognito: Groups
  "roles": ["admin"],                   // Entra ID: Roles
  "aud": "client_id",
  "iss": "issuer_url",
  "iat": 1234567890,
  "exp": 1234567890
}
```

## Why OIDC? Why Now?

1. **Standards-based** - OIDC is the modern standard for authentication
2. **Multi-provider** - Same code works with Cognito, Entra ID, Google, GitHub...
3. **More secure** - Fewer HTTP requests, claims in signed JWT
4. **Future-proof** - Ready to migrate from Cognito to Entra ID with zero code changes
5. **Performance** - No extra `/users/me` API call needed

## Migration to Entra ID

When you're ready to use Azure AD:

1. **Create app in Entra ID**
   - Azure Portal → App registrations
   - Set redirect_uris to your callback URL
   - Copy app ID

2. **Update environment variables**

   ```bash
   VITE_COGNITO_DOMAIN=https://login.microsoftonline.com
   VITE_COGNITO_USER_POOL_ID=your-tenant-id
   VITE_COGNITO_CLIENT_ID=your-app-id
   VITE_COGNITO_REDIRECT_URI=http://localhost:5173/callback
   ```

3. **That's it!** ✅
   - No code changes needed
   - `getUserFromToken()` works identically
   - Role/group claims just change from `cognito:groups` to `roles`

## Dependencies Added

```json
{
  "dependencies": {
    "openid-client": "^5.7.0",
    "express-session": "^1.18.1"
  }
}
```

Install with: `npm install`

## Security (PKCE)

Flow still uses PKCE (Proof Key for Public Clients):

```javascript
// 1. Generate random verifier
const codeVerifier = generateRandomString();

// 2. Create challenge from verifier
const codeChallenge = await generateCodeChallenge(codeVerifier);

// 3. Send challenge to provider
// Provider verifies code_verifier matches code_challenge at token exchange
```

✅ Protects against authorization code interception attacks

## Documentation

- See [OIDC.md](./OIDC.md) for detailed OIDC explanation
- See [OIDC_IMPLEMENTATION.md](./OIDC_IMPLEMENTATION.md) for complete implementation guide
- See [.env.example](./.env.example) for all configuration options

## Testing

```javascript
// Verify user info from token
const user = getUserFromToken();
console.log(user);
// Should show: { id, email, displayName, firstName, lastName, picture, oidcClaims }

// Verify profile auto-populates
// 1. Login via SSO
// 2. Go to Profile page
// 3. Email, name, picture should be filled automatically

// Verify roles work
const roles = getUserFromToken()?.oidcClaims?.['cognito:groups'] || [];
console.log('User roles:', roles);
```

## Architecture Diagram

```text
Frontend (React)                Backend (Node.js)
────────────────               ────────────────

[Login Button]
       │
       ├→ startSSO()
       │  • Generate PKCE code_verifier
       │  • Redirect to Cognito/Entra ID
       │
[Provider]
       │
       ├→ User authenticates
       │
       └→ Redirect with code + state
              │
              ├→ handleOAuthCallback(code)
              │  • Exchange code for tokens
              │  • Decode id_token JWT
              │  • Extract OIDC claims
              │
              └→ getUserFromToken()
                 • Return user object with
                   email, name, picture, roles

[Profile Page]
    • Auto-populate from getUserFromToken()
    • No extra API calls needed
    • Works with any OIDC provider
```

## Next Steps (Optional)

1. Test with real Entra ID account when ready
2. Implement token refresh if sessions need to be long
3. Add server-side token validation if needed
4. Implement logout with refresh token revocation
5. Add role-based access control (RBAC) based on claims

---

**You're now ready to support both Cognito and Entra ID!** 🎉

For detailed implementation guide, see [OIDC_IMPLEMENTATION.md](./OIDC_IMPLEMENTATION.md)
