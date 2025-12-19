# Cognito/SSO Login Troubleshooting Guide

## Common Issues & Solutions

### 1. **Login Page Not Loading**

**Symptoms:** Blank page or page doesn't load

**Possible Causes:**

- Frontend server not running
- Port conflicts
- Build errors

**Solution:**

```bash
# Kill any existing node processes
Get-Process | Where-Object {$_.ProcessName -eq 'node'} | Stop-Process -Force

# Start both servers
npm run dev:both
```

### 2. **SSO Button Not Working / Redirect Issues**

**Symptoms:** Click SSO button, nothing happens or error appears

**Possible Causes:**

- AWS Cognito App Client callback URL mismatch
- Incorrect Cognito domain
- Client ID mismatch

**Solution - Verify AWS Cognito Configuration:**

1. **Go to AWS Cognito Console:**
   - Region: `ca-central-1`
   - User Pool: `ca-central-1_diALmgpwp`

2. **Check App Client Settings:**
   - App Client ID should be: `3vlaq9e4let52nkjudiid9qrv0`
   - Allowed callback URLs must include: `http://localhost:5173/callback`
   - Allowed sign-out URLs must include: `http://localhost:5173`
   - OAuth 2.0 Grant Types: Authorization code grant
   - OAuth Scopes: email, openid, profile

3. **Check Hosted UI Domain:**
   - Domain prefix should be: `poc-cyberwatch-ai`
   - Full domain: `poc-cyberwatch-ai.auth.ca-central-1.amazoncognito.com`

### 3. **After Login - 404 or "Invalid Redirect"**

**Symptoms:** SSO redirects but shows error

**Cause:** Callback URL not registered in Cognito

**Solution:**

```bash
# Add callback URL in AWS Console:
# 1. Go to Cognito > App clients > Your app client
# 2. Scroll to "Hosted UI" section
# 3. Add callback URLs: http://localhost:5173/callback
# 4. Add sign-out URLs: http://localhost:5173
# 5. Save changes
```

### 4. **CORS Errors**

**Symptoms:** Console shows CORS policy errors

**Cause:** Cognito domain or API not allowing localhost

**Solution:**

- Verify Cognito callback URLs include `http://localhost:5173/callback`
- Check browser console for specific CORS error details

### 5. **Config Mismatch**

**Check these files match:**

**.env:**

```env
VITE_COGNITO_USER_POOL_ID=ca-central-1_diALmgpwp
VITE_COGNITO_CLIENT_ID=3vlaq9e4let52nkjudiid9qrv0
VITE_COGNITO_REGION=ca-central-1
VITE_COGNITO_DOMAIN=poc-cyberwatch-ai
VITE_COGNITO_REDIRECT_URI=http://localhost:5173/callback
```

**server/data/config.json:**

```json
{
  "ssoClientId": "3vlaq9e4let52nkjudiid9qrv0",
  "ssoRedirectUri": "http://localhost:5173/callback",
  "ssoCognitoDomain": "poc-cyberwatch-ai",
  "awsRegion": "ca-central-1"
}
```

### 6. **Test Local Login First**

**To isolate the issue:**

1. Try local login with Admin account
2. If local works, issue is SSO-specific
3. If local doesn't work, issue is with server/frontend

**Local Admin Credentials (from users.json):**

- ID: `Admin`
- Check `server/data/users.json` for password hash

### 7. **Check Server Logs**

**When SSO login is attempted, check terminal output for:**

- `[SSO Link] Request body keys`
- `[SSO Link] Received claims`
- `[findSsoUser] Matched by...`
- Any error messages

## Quick Diagnostic Commands

```powershell
# 1. Check if servers are running
Get-Process | Where-Object {$_.ProcessName -eq 'node'}

# 2. Check port 5173 (frontend)
Test-NetConnection -ComputerName localhost -Port 5173

# 3. Check port 3001 (backend)
Test-NetConnection -ComputerName localhost -Port 3001

# 4. View environment variables (from project root)
Get-Content .env

# 5. Test backend endpoint
Invoke-WebRequest -Uri "http://localhost:3001/config" -Method GET
```

## Most Likely Fix for AWS Changes

If you changed AWS settings, the most common issue is:

**Callback URL mismatch in Cognito App Client:**

1. Open AWS Console
2. Navigate to Cognito User Pools
3. Select your user pool: `ca-central-1_diALmgpwp`
4. Click "App integration" tab
5. Under "App clients and analytics", click your app client
6. Scroll to "Hosted UI" settings
7. Verify these EXACT URLs:
   - **Allowed callback URLs:** `http://localhost:5173/callback`
   - **Allowed sign-out URLs:** `http://localhost:5173`
8. Click "Save changes"

## Browser Console Debugging

Open browser DevTools (F12) and check:

- **Console tab:** Look for JavaScript errors
- **Network tab:** Check if requests to Cognito are failing
- **Application tab > Session Storage:** Check for `pkce_code_verifier`, `idToken`

## Need More Help?

Provide these details:

1. What exact error message appears (if any)?
2. What happens when you click "Se connecter via SSO"?
3. Any errors in browser console (F12)?
4. Any errors in terminal where you ran `npm run dev:both`?
