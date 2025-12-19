# OIDC (OpenID Connect) Implementation

## Vue d'ensemble

Cette application utilise **OIDC (OpenID Connect)** pour l'authentification.
OIDC est un standard d'authentification qui fonctionne avec n'importe quel
fournisseur d'identité compatible OIDC.

## Pourquoi OIDC ?

| Aspect | OAuth 2.0 seul | OIDC |
| ------ | -------------- | ---- |
| **Standard** | Autorisation uniquement | Authentification + Autorisation |
| **Token ID** | ❌ | ✅ Contient les claims utilisateur |
| **Claims utilisateur** | Requête `/userinfo` | Directement dans le JWT |
| **Providers compatibles** | Limité | Cognito, Entra ID, Google, etc. |
| **Sécurité** | Claims du serveur | JWT signé cryptographiquement |

## Architecture

### Frontend (React)

```text
src/services/auth.js
├── generateCodeChallenge()     // PKCE pour sécurité
├── startSSO()                  // Redirige vers provider OIDC
├── handleOAuthCallback()       // Récupère les tokens
├── getUserFromToken()          // Extrait les claims du JWT
└── getApiBase()                // Route vers local ou AWS
```

### Backend (Node.js)

```text
server/
├── oidc-provider.js            // Configuration OIDC standard
├── config-server.js            // Endpoints locaux
└── data/
    ├── sso-users.json          // Profils utilisateurs SSO
    └── users.json              // Utilisateurs locaux
```

## Claims OIDC Standards

Le JWT `id_token` contient automatiquement ces claims standards :

```javascript
{
  "sub": "unique-user-id",              // Subject (ID utilisateur unique)
  "email": "user@example.com",          // Email
  "email_verified": true,               // Email vérifié ?
  "name": "John Doe",                   // Nom complet
  "given_name": "John",                 // Prénom
  "family_name": "Doe",                 // Nom de famille
  "picture": "https://...",             // Photo de profil
  "aud": "client-id",                   // Audience (ID client)
  "iss": "https://issuer-url",          // Issuer (fournisseur)
  "iat": 1234567890,                    // Issued at (date d'émission)
  "exp": 1234567890                     // Expiration
}
```

### Claims personnalisés (optionnels)

Cognito et Entra ID peuvent ajouter des claims personnalisés :

```javascript
{
  "cognito:groups": ["admin", "developers"],     // Cognito: Groupes
  "cognito:username": "john.doe",                // Cognito: Username
  "custom:department": "Engineering",            // Cognito: Custom attributes
  "groups": ["admin"],                           // Entra ID: Groupes
  "oid": "unique-id",                            // Entra ID: Object ID
  "roles": ["admin", "user"]                     // Entra ID: Roles
}
```

## Intégration actuellement : Cognito

### Configuration Cognito

```text
User Pool: ca-central-1_diALmgpwp
Client: 3vlaq9e4let52nkjudiid9qrv0
Domain: poc-cyberwatch-ai.auth.ca-central-1.amazoncognito.com
Redirect: http://localhost:5173/callback
Scopes: openid email profile
```

### OIDC Discovery URL

```text
https://cognito-idp.ca-central-1.amazonaws.com/ca-central-1_diALmgpwp/.well-known/openid-configuration
```

## Préparer pour Entra ID (Azure AD)

### 1. Configuration Entra ID

Dans Azure Portal :

1. **Créer une application** : Azure AD → App registrations → New registration
2. **Redirect URI** : `http://localhost:5173/callback`, `http://localhost:3001/callback`
3. **Authentification** :
   - Implicit grant: ✅ ID token
   - Authorization code: ✅ Access token + ID token
4. **Certificats & secrets** : Créer un client secret (non obligatoire pour public clients)
5. **API permissions** :
   - User.Read
   - email
   - openid
   - profile

### 2. Mise à jour configuration

```bash
# .env ou environment variables

# Cognito
OIDC_PROVIDER_URL=https://cognito-idp.ca-central-1.amazonaws.com/ca-central-1_diALmgpwp
OIDC_CLIENT_ID=3vlaq9e4let52nkjudiid9qrv0
OIDC_REDIRECT_URI=http://localhost:5173/callback

# Ou Entra ID
# OIDC_PROVIDER_URL=https://login.microsoftonline.com/tenant-id/v2.0
# OIDC_CLIENT_ID=your-app-id
# OIDC_CLIENT_SECRET=your-client-secret
```

### 3. Code inchangé

Le reste du code fonctionne **identiquement** car il utilise l'OIDC discovery standard :

```javascript
// Fonctionne avec Cognito, Entra ID, ou tout provider OIDC
const issuer = await Issuer.discover(process.env.OIDC_PROVIDER_URL);
const client = new issuer.Client(config);
```

## Flux d'authentification

```text
1. User clique "Login with SSO"
   ↓
2. Frontend appelle startSSO() → Redirige vers OIDC provider
   - Utilise PKCE pour sécurité
   - Stocke code_challenge et code_verifier
   ↓
3. User s'authentifie auprès du provider (Cognito/Entra ID/Google)
   ↓
4. Provider redirige vers http://localhost:5173/callback?code=...&state=...
   ↓
5. Frontend appelle handleOAuthCallback(code)
   - Récupère code_verifier depuis sessionStorage
   - Échange code pour tokens (id_token + access_token)
   ↓
6. Frontend appelle getUserFromToken()
   - Décode JWT id_token
   - Extrait les claims OIDC (email, name, picture, etc.)
   - Retourne objet utilisateur
   ↓
7. Utilisateur connecté et profil rempli automatiquement
```

## Gestion des rôles

### Cognito

```javascript
// Dans Cognito User Pool:
// 1. Groups → Admin, User, Developer
// 2. User → Ajouter aux groups

// Claims dans id_token:
{
  "cognito:groups": ["admin"]
}
```

### Entra ID

```javascript
// Dans Azure AD:
// 1. App roles → Admin, User, Developer
// 2. User/Group → Assigner le role

// Claims dans id_token:
{
  "roles": ["admin"]
}
```

### Normalisation universelle

```javascript
// Dans Profile.jsx
const user = getUserFromToken();
const roles = user.oidcClaims?.["cognito:groups"] || 
              user.oidcClaims?.roles || 
              [];
```

## Stockage des utilisateurs

### Local (Admin/admin)

```json
// server/data/users.json
{
  "users": [
    { "id": "Admin", "password": "...", "displayName": "Administrator", "roles": [] }
  ]
}
```

### SSO (Cognito ou Entra ID)

```json
// server/data/sso-users.json
{
  "sso_users": [
    {
      "id": "cognito_unique_id",
      "email": "user@example.com",
      "displayName": "User Name",
      "firstName": "User",
      "lastName": "Name",
      "picture": "https://...",
      "roles": ["admin"],
      "authMode": "oidc",
      "provider": "cognito",  // ou "entra-id"
      "lastUpdated": "2025-01-15T10:00:00Z"
    }
  ]
}
```

## Exemple : Configuration pour Entra ID

### 1. Enregistrer l'application Azure

```bash
# CLI Azure
az ad app create --display-name "AD Cyberwatch AI" \
  --web-redirect-uris "http://localhost:5173/callback" "http://localhost:3001/callback" \
  --enable-access-token-issuance true \
  --enable-id-token-issuance true
```

### 2. Variables d'environnement

```bash
# .env.local (frontend)
VITE_COGNITO_DOMAIN=https://login.microsoftonline.com
VITE_COGNITO_USER_POOL_ID=your-tenant-id  # ou laissez vide pour v2.0
VITE_COGNITO_CLIENT_ID=your-app-id
VITE_COGNITO_REGION=v2.0  # Utilise v2.0 endpoint
VITE_COGNITO_REDIRECT_URI=http://localhost:5173/callback

# .env (backend)
OIDC_PROVIDER_URL=https://login.microsoftonline.com/your-tenant-id/v2.0
OIDC_CLIENT_ID=your-app-id
OIDC_CLIENT_SECRET=your-secret
OIDC_REDIRECT_URI=http://localhost:3001/callback
```

### 3. Adapter le frontend

```javascript
// Dans auth.js
const cognitoUrl = import.meta.env.VITE_COGNITO_DOMAIN;

// Détection automatique du provider:
const isEntraId = cognitoUrl.includes('microsoftonline');
const scope = isEntraId ? 'openid email profile' : 'email openid profile';
```

## Avantages de cette approche

✅ **Standardisée** : OIDC est un standard industrie
✅ **Multi-provider** : Fonctionne avec Cognito, Entra ID, Google, GitHub, etc.
✅ **Sécurisée** : PKCE + JWT signature validation
✅ **Évolutive** : Migration de provider sans changement majeur
✅ **Agnostique cloud** : AWS, Azure, on-premise, tout fonctionne
✅ **Claims-based** : Les infos utilisateur dans le JWT, pas de requête supplémentaire

## Migration future Cognito → Entra ID

**Avant** (avec openid-client configurable):

```javascript
// Tout fonctionne via OIDC discovery
const issuer = await Issuer.discover(OIDC_PROVIDER_URL);
```

**Étapes pour migrer** :

1. Changer `OIDC_PROVIDER_URL` vers Entra ID
2. Changer `OIDC_CLIENT_ID` et `OIDC_CLIENT_SECRET` vers les infos Entra ID
3. Adapter la gestion des claims si besoin (cognito:groups → roles)
4. **Aucun changement de code applicatif** !

## Références

- [OIDC Specification](https://openid.net/specs/openid-connect-core-1_0.html)
- [openid-client Documentation](https://github.com/panva/node-openid-client)
- [Amazon Cognito OIDC](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools-oidc-provider.html)
- [Microsoft Entra ID OIDC](https://learn.microsoft.com/en-us/entra/identity-platform/v2-protocols-oidc)
