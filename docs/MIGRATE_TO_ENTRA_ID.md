# Migration Guide: Cognito → Entra ID (Azure AD)

## Overview

This application is now **OIDC-based**, meaning it can work with:

- ✅ Amazon Cognito (current)
- ✅ Microsoft Entra ID (ready to switch)
- ✅ Google, GitHub, or any OIDC provider

**Migration effort: 10 minutes** (only environment variable changes needed)

## Pre-Migration Checklist

Before switching to Entra ID, ensure:

- [ ] You have Azure subscription or Entra ID access
- [ ] You have Global Admin or Application Admin role
- [ ] Cognito tests pass (see [TESTING_OIDC.md](./TESTING_OIDC.md))
- [ ] Backend running with correct environment variables
- [ ] Frontend running with correct environment variables

## Step 1: Register Application in Entra ID

### Using Azure Portal (GUI)

1. Go to [https://portal.azure.com](https://portal.azure.com)
2. Navigate to **Azure AD** (or search for "App registrations")
3. Click **New registration**
4. Fill in:
   - **Name:** `AD Cyberwatch AI`
   - **Supported account types:** `Accounts in this organizational directory only` (single tenant)
   - **Redirect URI:**
     - Platform: **Web**
     - URI: `http://localhost:5173/callback`
     - Also add: `http://localhost:3001/callback` for backend
   - Click **Register**

5. Copy the following IDs from Overview page:
   - **Application (client) ID** → `VITE_COGNITO_CLIENT_ID`
   - **Directory (tenant) ID** → `VITE_COGNITO_USER_POOL_ID`

### Using Azure CLI

```bash
# Install Azure CLI if needed
# Windows: https://learn.microsoft.com/en-us/cli/azure/install-azure-cli-windows

# Login to Azure
az login

# Create application
az ad app create \
  --display-name "AD Cyberwatch AI" \
  --web-redirect-uris "http://localhost:5173/callback" "http://localhost:3001/callback" \
  --enable-access-token-issuance true \
  --enable-id-token-issuance true \
  --public-client-redirect-uris "http://localhost:5173/callback"

# Note the appId and tenantId from output
```

## Step 2: Configure API Permissions

### In Azure Portal

1. **Go to** your app registration → **API permissions**
2. **Click** "Add a permission"
3. **Select** "Microsoft Graph"
4. **Choose** "Delegated permissions"
5. **Search for and select:**
   - `email`
   - `openid`
   - `profile`
   - `User.Read` (basic user info)

6. **Click** "Add permissions"
7. Click **"Grant admin consent for [tenant]"**

Expected permissions:

```text
✅ email
✅ openid
✅ profile
✅ User.Read
```

### Using Azure CLI (Permissions)

```bash
# List available Microsoft Graph permissions
az ad app permission list-all --filter "displayName eq 'User.Read'" \
  --query "[0].{id:id,displayName:displayName}"

# Add permissions to your app
APP_ID="your-app-id"
GRAPH_API_ID="00000003-0000-0000-c000-000000000000"  # Microsoft Graph

# Add User.Read permission
az ad app permission add \
  --id $APP_ID \
  --api $GRAPH_API_ID \
  --api-permissions "e1fe6dd8-ba31-4d61-89e7-88639da4683d=Scope"

# Grant admin consent
az ad app permission admin-consent --id $APP_ID
```

## Step 3: Create Client Secret (Optional for Public Clients)

### Public Client (Recommended for SPA)

If your app is public (single-page app in browser), **no client secret needed**.

Skip this step and go to Step 4.

### Confidential Client (Optional - for Backend)

If you want server-side token validation:

1. **Go to** your app registration → **Certificates & secrets**
2. **Click** "New client secret"
3. **Description:** `Backend OIDC`
4. **Expires:** 24 months
5. **Click** "Add"
6. **Copy** the Secret value (you can only see it once!)

Save as: `OIDC_CLIENT_SECRET=your-secret-value`

## Step 4: Update Environment Variables

### Frontend (`.env.local`)

Replace Cognito variables with Entra ID:

```bash
# OLD (Cognito)
# VITE_COGNITO_DOMAIN=poc-cyberwatch-ai.auth.ca-central-1.amazoncognito.com
# VITE_COGNITO_USER_POOL_ID=ca-central-1_diALmgpwp
# VITE_COGNITO_CLIENT_ID=3vlaq9e4let52nkjudiid9qrv0
# VITE_COGNITO_REGION=ca-central-1

# NEW (Entra ID)
VITE_COGNITO_DOMAIN=https://login.microsoftonline.com
VITE_COGNITO_USER_POOL_ID=your-tenant-id
VITE_COGNITO_CLIENT_ID=your-app-id
VITE_COGNITO_REGION=v2.0
VITE_COGNITO_REDIRECT_URI=http://localhost:5173/callback

# Keep this the same
VITE_API_URL=http://127.0.0.1:3001
```

Get values from Azure Portal:

- `your-tenant-id` → Directory (tenant) ID
- `your-app-id` → Application (client) ID

### Backend (`.env`)

```bash
# OLD (Cognito)
# OIDC_PROVIDER_URL=https://cognito-idp.ca-central-1.amazonaws.com/ca-central-1_diALmgpwp
# OIDC_CLIENT_ID=3vlaq9e4let52nkjudiid9qrv0
# OIDC_REDIRECT_URI=http://localhost:3001/callback

# NEW (Entra ID)
OIDC_PROVIDER_URL=https://login.microsoftonline.com/your-tenant-id/v2.0
OIDC_CLIENT_ID=your-app-id
OIDC_CLIENT_SECRET=your-client-secret  # If created
OIDC_REDIRECT_URI=http://localhost:3001/callback
```

## Step 5: Testing

### Start the Application

```bash
# Terminal 1: Backend
npm run dev:backend

# Terminal 2: Frontend
npm run dev
```

### Test Login

1. Go to `http://localhost:5173`
2. Click **Login**
3. Click **Login with Cognito** (button text same, but now uses Entra ID)
4. You're redirected to Microsoft login
5. Sign in with your Entra ID account
6. You're redirected back to the application

Expected:

- ✅ Logged in successfully
- ✅ User info from Entra ID token
- ✅ Profile auto-populated

### Verify OIDC Claims

Open browser console (F12):

```javascript
import { getUserFromToken } from './src/services/auth.js';
const user = getUserFromToken();
console.log('User:', user);

// Should show Entra ID claims:
// {
//   id: "oid-from-entra-id",
//   email: "your@company.com",
//   displayName: "Your Name",
//   firstName: "Your",
//   lastName: "Name",
//   picture: undefined,  // Entra ID might not include picture by default
//   oidcClaims: {
//     sub: "oid",
//     email: "your@company.com",
//     name: "Your Name",
//     given_name: "Your",
//     family_name: "Name",
//     oid: "entra-id-oid",  // Entra ID specific
//     tid: "tenant-id",     // Entra ID specific
//     roles: ["admin"],     // If app roles assigned
//     groups: ["group-id"]  // If groups assigned
//   }
// }
```

## Step 6: Enable Groups/Roles (Optional)

### Option A: Use Entra ID Groups

Groups in Entra ID become `groups` claim in the JWT:

1. In Entra ID, create groups (e.g., `Admins`, `Developers`)
2. Add users to groups
3. In app registration → **Token configuration** → **Add groups claim**
   - Select: "All groups"
4. Now JWT will have: `"groups": ["group-id-1", "group-id-2"]`

### Option B: Use App Roles

App roles are app-specific (recommended):

1. In app registration → **App roles** → **Create app role**
2. Create roles:
   - **Admin**
   - **Developer**
   - **Viewer**
3. Go to **Enterprise applications** → Find your app
4. Go to **Users and groups**
5. Assign users to roles
6. Now JWT will have: `"roles": ["Admin"]`

### Use Groups/Roles in Code

```javascript
const user = getUserFromToken();

// Get Entra ID groups
const groups = user.oidcClaims?.groups || [];
console.log('Groups:', groups);

// Get Entra ID roles (if app roles configured)
const roles = user.oidcClaims?.roles || [];
console.log('Roles:', roles);

// Universal helper (works for Cognito or Entra ID)
const getRoles = () => {
  const claims = getUserFromToken()?.oidcClaims || {};
  return claims['cognito:groups'] ||  // Cognito groups
         claims.roles ||              // Entra ID app roles
         claims.groups ||             // Entra ID security groups
         [];
};

console.log('All roles/groups:', getRoles());
```

## Step 7: Add More Redirect URIs (Production)

For production deployment:

1. In app registration → **Authentication**
2. **Redirect URIs** section
3. **Add URI** for each environment:
   - `https://your-domain.com/callback`
   - `https://your-domain.com/callback/`
   - `http://localhost:5173/callback` (keep for development)

4. **Logout URL** (optional):
   - `https://your-domain.com/logout`

## Troubleshooting

### Issue: Redirect URI Mismatch

**Error:** `AADSTS50011: The redirect URI specified in the request doesn't match...`

**Solution:**

1. Check exact spelling/case of redirect URI
2. Compare with what's in Entra ID app registration
3. Common issue: `http://` vs `https://`

### Issue: Invalid Scopes

**Error:** `AADSTS650052: The app needs access to a service...`

**Solution:**

1. Go to app registration → **API permissions**
2. Ensure you've added: `openid`, `email`, `profile`, `User.Read`
3. Click **Grant admin consent**

### Issue: User Not Found

**Error:** After login: "User not found"

**Likely cause:** User doesn't have email set in Entra ID

**Solution:**

1. Go to Entra ID → Users → Select your user
2. Edit profile and add email address
3. Try login again

### Issue: Blank Picture

Entra ID doesn't include profile picture by default.

**Workaround:**

```javascript
const user = getUserFromToken();
const picture = user.picture || `https://ui-avatars.com/api/?name=${user.displayName}`;
```

### Issue: PKCE Error

**Error:** `invalid_grant` during token exchange

**Solution:**

This is rare with Entra ID. If it happens:

1. Check `VITE_COGNITO_REDIRECT_URI` matches exactly in Entra ID
2. Clear browser cache/cookies
3. Try Incognito window

## Comparing Claims: Cognito vs Entra ID

| Claim | Cognito | Entra ID | Usage |
| ----- | ------- | -------- | ----- |
| `sub` | `cognito_id` | `oid` (object ID) | User unique ID |
| `email` | `user@domain` | `user@company.com` | Email |
| `name` | Full name | Full name | Display name |
| `given_name` | First name | First name | First name |
| `family_name` | Last name | Last name | Last name |
| `picture` | URL | (not included) | Avatar |
| `groups` | `cognito:groups` | `groups` | Security groups |
| `roles` | N/A | `roles` | App roles |
| `aud` | Client ID | Client ID | Audience |
| `iss` | Cognito issuer | Azure issuer | Issuer |

## Universal Code Pattern

Write code that works with both Cognito and Entra ID:

```javascript
// Universal user info getter
export function getUserInfo() {
  const user = getUserFromToken();
  return {
    // Standard OIDC claims (both providers)
    id: user?.id,
    email: user?.email,
    displayName: user?.displayName,
    firstName: user?.firstName,
    lastName: user?.lastName,
    picture: user?.picture || `https://ui-avatars.com/api/?name=${user?.displayName}`,
    
    // Get roles from either provider
    roles: user?.oidcClaims?.['cognito:groups'] || 
           user?.oidcClaims?.roles || 
           [],
    
    // Get groups (Entra ID)
    groups: user?.oidcClaims?.groups || [],
    
    // Provider detection
    provider: user?.oidcClaims?.iss?.includes('cognito') ? 'cognito' : 'entra-id',
  };
}
```

## Rollback to Cognito

If you need to switch back to Cognito:

1. Restore `.env.local` with Cognito values:

```bash
VITE_COGNITO_DOMAIN=poc-cyberwatch-ai.auth.ca-central-1.amazoncognito.com
VITE_COGNITO_USER_POOL_ID=ca-central-1_diALmgpwp
VITE_COGNITO_CLIENT_ID=3vlaq9e4let52nkjudiid9qrv0
```

2. Restart frontend/backend
3. Login works again with Cognito

**No code changes needed** - that's the power of OIDC! ✨

## Verification Checklist

- [ ] Azure app created in Entra ID
- [ ] API permissions granted (openid, email, profile, User.Read)
- [ ] Client ID and Tenant ID copied
- [ ] `.env.local` updated with Entra ID values
- [ ] `.env` updated with Entra ID OIDC values
- [ ] Frontend restarted
- [ ] Backend restarted
- [ ] Login with Entra ID works
- [ ] `getUserFromToken()` returns correct data
- [ ] Profile page auto-populates
- [ ] No console errors
- [ ] Can save profile
- [ ] Roles/groups working (if configured)

## What Didn't Change

✅ **Frontend code** - Same `getUserFromToken()` and auth flow
✅ **Backend API** - Same user management endpoints
✅ **Profile storage** - Same `sso-users.json` format
✅ **PKCE security** - Still used
✅ **JWT validation** - Still works
✅ **Local authentication** - Still works (Admin/admin)

## What Changed

⚙️ **Only environment variables** for OIDC provider discovery
⚙️ **Optional:** Grant/claim mapping if using Entra ID specific features
⚙️ **Optional:** Picture handling (since Entra ID doesn't include by default)

## Next Steps

1. **Test with Entra ID account** - Run [TESTING_OIDC.md](./TESTING_OIDC.md) guide
2. **Configure roles/groups** if needed
3. **Deploy to production** with production redirect URIs
4. **Monitor token expiry** - Set up refresh if needed
5. **Migrate users** from local admin + Cognito to Entra ID only

---

**Congratulations!** Your application is now **provider-agnostic** 🎉

For questions:

- See [OIDC_IMPLEMENTATION.md](./OIDC_IMPLEMENTATION.md) for technical details
- See [TESTING_OIDC.md](./TESTING_OIDC.md) for testing procedures
- Microsoft Entra ID docs: <https://learn.microsoft.com/en-us/entra/identity-platform/>
