# UI Environment Variables

This `.env` file contains environment-specific configuration for the frontend application.

## Vite Environment Variables

Vite exposes environment variables to your app with the `VITE_` prefix.

### Required Variables

```bash
# API Configuration
VITE_API_URL=http://127.0.0.1:3001  # Local dev server

# Cognito Configuration (optional for local dev)
VITE_COGNITO_USER_POOL_ID=your-user-pool-id
VITE_COGNITO_CLIENT_ID=your-client-id
VITE_COGNITO_REGION=ca-central-1

# Cognito Hosted UI (optional)
VITE_COGNITO_DOMAIN=your-cognito-domain
VITE_COGNITO_REDIRECT_URI=http://localhost:5173/callback
VITE_COGNITO_LOGOUT_URI=http://localhost:5173
```

## Local Development

For local development with the mock server (`npm run dev:both`), you can use:

```bash
VITE_API_URL=http://127.0.0.1:3001
```

The local server (`server/config-server.js`) provides mock authentication and API endpoints.

## AWS Deployment

When deploying to AWS, update these values to match your CloudFormation stack outputs:

```bash
VITE_API_URL=https://your-api-gateway.execute-api.region.amazonaws.com/prod
VITE_COGNITO_USER_POOL_ID=region_XXXXXXXXX
VITE_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Security Notes

- ✅ Frontend environment variables are **publicly accessible** in the browser
- ❌ Never put secrets, API keys, or passwords in VITE_ variables
- 🔒 Use backend/Lambda environment variables for sensitive data
- 📝 This file is git-ignored - copy from `.env.example` and fill in your values
