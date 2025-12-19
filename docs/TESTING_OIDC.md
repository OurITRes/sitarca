# Testing OIDC Authentication with Cognito

## Prerequisites

- Cognito User Pool configured: `ca-central-1_diALmgpwp`
- Test user created: `test@example.com` / `P@ssw0rd123!`
- Frontend running on `http://localhost:5173`
- Backend running on `http://localhost:3001`

## Step 1: Verify Environment Variables

Check that your `.env.local` has:

```bash
VITE_COGNITO_DOMAIN=poc-cyberwatch-ai.auth.ca-central-1.amazoncognito.com
VITE_COGNITO_USER_POOL_ID=ca-central-1_diALmgpwp
VITE_COGNITO_CLIENT_ID=3vlaq9e4let52nkjudiid9qrv0
VITE_COGNITO_REGION=ca-central-1
VITE_COGNITO_REDIRECT_URI=http://localhost:5173/callback
VITE_API_URL=http://127.0.0.1:3001
```

## Step 2: Start the Application

```bash
# Terminal 1: Start backend (local API server)
npm run dev:backend

# Terminal 2: Start frontend
npm run dev
```

Verify:

- Backend on `http://localhost:3001`
- Frontend on `http://localhost:5173`

## Step 3: Test Local Authentication (Admin)

1. Click **Login**
2. Select **Local Authentication**
3. Enter:
   - ID: `Admin`
   - Password: `admin`
4. Click **Login**

Expected:

- ✅ Logged in as Admin
- ✅ Profile page shows Admin name
- ✅ Can save profile and select roles

## Step 4: Test SSO with Cognito (OIDC)

### 4a. Login via SSO

1. Click **Login**
2. Click **Login with Cognito**
3. You're redirected to Cognito login page
4. Enter:
   - Email: `test@example.com`
   - Password: `P@ssw0rd123!`
5. Click **Sign In**

Expected:

- ✅ Redirected back to [`http://localhost:5173/callback`](http://localhost:5173/callback)
- ✅ Callback handler exchanges authorization code for tokens
- ✅ Logged in as [`test@example.com`](mailto:test@example.com)

### 4b. Verify OIDC Claims Decoded

Open browser DevTools (F12) → Console:

```javascript
// Check if OIDC token is stored
const idToken = sessionStorage.getItem('idToken');
console.log('ID Token:', idToken);

// Decode and check claims
import { getUserFromToken } from './src/services/auth.js';
const user = getUserFromToken();
console.log('User from OIDC token:', user);

// Should output:
// {
//   id: "ca-central-1_diALmgpwp_cognito_userid",
//   email: "test@example.com",
//   displayName: "test@example.com",
//   firstName: undefined,  // Not set in Cognito test user
//   lastName: undefined,
//   picture: undefined,
//   authMode: "oidc",
//   oidcClaims: { ...full JWT claims... }
// }
```

### 4c. Profile Page Auto-Population

1. Go to **Profile** page
2. Check if these are pre-filled (from OIDC token):
   - Email: `test@example.com`
   - Display Name: `test@example.com` (or custom name if set in Cognito)
   - Picture: (if set in Cognito user attributes)

Expected:

- ✅ Email field has `test@example.com`
- ✅ Fields auto-populated from JWT claims
- ✅ No manual API calls to `/users/me`

### 4d. Save Profile

1. Modify profile (name, business role, etc.)
2. Upload avatar (optional)
3. Select roles (if available)
4. Click **Save Profile**

Expected:

- ✅ No CORS errors
- ✅ Profile saved to `server/data/sso-users.json`
- ✅ Roles stored with user

Verify in backend:

```bash
cat server/data/sso-users.json
```

Should show:

```json
{
  "sso_users": [
    {
      "id": "ca-central-1_diALmgpwp_...",
      "email": "test@example.com",
      "displayName": "My Custom Name",
      "firstName": "John",
      "lastName": "Doe",
      "roles": ["admin"],
      "authMode": "oidc",
      "lastUpdated": "2025-01-15T10:00:00Z"
    }
  ]
}
```

## Step 5: Verify No Extra API Calls

Open DevTools → Network tab:

1. Login with SSO
2. Watch network requests

Expected requests:

```text
POST /oauth2/token        ← Code exchange (once)
GET /users               ← Load all users (initial)
PUT /users/{id}          ← Save profile (once)
GET /roles               ← Load roles (once)
```

**NOT expected:**

```text
❌ GET /userinfo          ← Should NOT happen (info in JWT)
❌ Multiple token exchanges
❌ CORS errors on /users/:id
```

## Step 6: Test Role Assignment

1. On Profile page, check **Available Roles**
2. Select roles (e.g., Admin, Developer)
3. Click **Save Profile**

Expected:

- ✅ Roles saved in `server/data/sso-users.json`
- ✅ Next login, roles are pre-selected

Verify:

```javascript
const user = getUserFromToken();
console.log('User roles:', user.oidcClaims?.['cognito:groups']);
// Note: Cognito stores groups in 'cognito:groups' claim
```

## Step 7: Test Session Persistence

1. Close browser tab
2. Reopen `http://localhost:5173`
3. Profile page should show your saved info from step 4

Expected:

- ✅ `sessionStorage` has `idToken`
- ✅ User is still logged in
- ✅ Profile loads from `sso-users.json`

## Step 8: Test Logout (if implemented)

1. Click **Logout**
2. `sessionStorage` cleared
3. Redirected to login page

Expected:

- ✅ `getIdToken()` returns null
- ✅ `getUserFromToken()` returns null
- ✅ Local authentication re-required

## Debugging Issues

### Issue: Redirect Loop on Callback

**Problem:** [`http://localhost:5173/callback`](http://localhost:5173/callback) shows login page again

**Solution:**

1. Check that Cognito CallbackURLs include `http://localhost:5173/callback`
2. Check that `VITE_COGNITO_REDIRECT_URI` matches exactly
3. Check browser console for errors

```bash
# Verify in AWS CLI
aws cognito-idp describe-user-pool-client \
  --user-pool-id ca-central-1_diALmgpwp \
  --client-id 3vlaq9e4let52nkjudiid9qrv0 \
  --region ca-central-1 | grep -A 10 CallbackURLs
```

### Issue: "PKCE Code Verifier Not Found"

**Problem:** `sessionStorage.getItem('pkce_code_verifier')` returns null

**Likely cause:** Third-party cookies disabled

**Solution:**

1. Check browser settings (DevTools → Application → Cookies)
2. Allow third-party cookies for localhost
3. Use Incognito window (better test)

### Issue: JWT Decode Error

**Problem:** `getUserFromToken()` returns null

**Debugging:**

```javascript
const token = sessionStorage.getItem('idToken');
console.log('Token parts:', token?.split('.').length); // Should be 3
console.log('Token payload:', atob(token?.split('.')[1])); // Should be valid JSON
```

### Issue: CORS Error on Save Profile

**Problem:** `PUT /users/:id` returns CORS error

**Solution:**

- Verify `server/config-server.js` has CORS headers
- Check that backend is running on `http://127.0.0.1:3001`
- Verify `VITE_API_URL=http://127.0.0.1:3001` in `.env.local`

### Issue: No Roles Showing

**Problem:** "Available Roles" dropdown is empty

**Debugging:**

```javascript
const roles = await authService.getRoles();
console.log('Roles from API:', roles);

// Check server has roles configured
fetch('http://127.0.0.1:3001/roles')
  .then(r => r.json())
  .then(roles => console.log('Available roles:', roles));
```

## Testing Checklist

- [ ] Admin/admin login works
- [ ] Profile page loads for Admin
- [ ] Admin can save profile
- [ ] Admin can assign roles
- [ ] SSO login with Cognito works
- [ ] User redirected back to callback URL
- [ ] `getUserFromToken()` returns user data
- [ ] Profile page auto-populates email from JWT
- [ ] Can save SSO user profile
- [ ] Roles save correctly
- [ ] No CORS errors
- [ ] No extra API calls (no `/userinfo`)
- [ ] Logout clears session
- [ ] Re-login works properly

## Advanced Testing

### Test with Groups in Cognito

1. In Cognito User Pool:

   - Create groups: `admin`, `developer`, `viewer`
   - Add [`test@example.com`](mailto:test@example.com) to `admin` group

2. After login, check claims:

```javascript
const user = getUserFromToken();
console.log('Groups:', user.oidcClaims?.['cognito:groups']);
// Should show: ["admin"]
```

3. Use groups for role-based access:

```javascript
const isAdmin = user.oidcClaims?.['cognito:groups']?.includes('admin');
if (isAdmin) {
  // Show admin features
}
```

### Test OIDC Discovery

```javascript
// Verify OIDC provider discovery works
const discoveryUrl = 'https://cognito-idp.ca-central-1.amazonaws.com/ca-central-1_diALmgpwp/.well-known/openid-configuration';

fetch(discoveryUrl)
  .then(r => r.json())
  .then(config => {
    console.log('OIDC endpoints:');
    console.log('  Authorization:', config.authorization_endpoint);
    console.log('  Token:', config.token_endpoint);
    console.log('  UserInfo:', config.userinfo_endpoint);
  });
```

### Test Token Expiration

1. Get current token expiry:

```javascript
const user = getUserFromToken();
const expiresAt = new Date(user.oidcClaims.exp * 1000);
console.log('Token expires at:', expiresAt);
console.log('Expires in:', Math.round((expiresAt - Date.now()) / 1000), 'seconds');
```

2. Wait for token to expire (or test with short-lived token)
3. Verify refresh needed

## Success Criteria

✅ **All tests pass when:**

1. Local authentication (Admin/admin) works completely
2. SSO authentication (Cognito) works completely  
3. Profile auto-populates from OIDC JWT claims
4. No extra API calls (no separate `/userinfo`)
5. No CORS errors
6. Roles save and load correctly
7. Session persists correctly
8. Application ready for Entra ID migration

---

**Need help?** Check:

- [OIDC.md](./OIDC.md) - OIDC explanation
- [OIDC_IMPLEMENTATION.md](./OIDC_IMPLEMENTATION.md) - Implementation details
- Browser console for error messages
- Network tab for API call details
