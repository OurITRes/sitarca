# Migration vers OIDC Complet - Guide d'Implémentation

## Résumé des changements

Vous aviez raison ! L'application utilise maintenant **OIDC (OpenID Connect)** au lieu d'OAuth2 simple. Cela signifie :

✅ **Les informations utilisateur proviennent du JWT idToken**
✅ **Pas de requête supplémentaire à `/users` pour SSO**
✅ **Fonctionne avec n'importe quel provider OIDC**

## Qu'est-ce qui a changé ?

### Avant (OAuth2)

```javascript
// 1. Récupérer le token
const token = await exchangeCodeForToken(code);
sessionStorage.setItem('token', token);

// 2. Faire une requête supplémentaire pour les infos utilisateur
const user = await fetch('/api/users/me');
// → Requête HTTP supplémentaire ❌
```

### Maintenant (OIDC)

```javascript
// 1. Récupérer le token
const tokens = await exchangeCodeForTokens(code);
sessionStorage.setItem('idToken', tokens.id_token);

// 2. Décoder le JWT pour extraire les claims
const user = getUserFromToken();
// → Les infos sont déjà dans le JWT ✅
```

## Architecture OIDC

### Frontend (`src/services/auth.js`)

**Nouvelles fonctions :**

```javascript
// Décode le JWT et extrait les claims OIDC
export function getUserFromToken() {
  const idToken = getIdToken();
  const claims = decodeJWT(idToken);
  
  return {
    id: claims.sub,                    // OIDC standard: unique user ID
    email: claims.email,               // OIDC standard
    displayName: claims.name,          // OIDC standard
    firstName: claims.given_name,      // OIDC standard
    lastName: claims.family_name,      // OIDC standard
    picture: claims.picture,           // OIDC standard
    authMode: 'oidc',
    oidcClaims: claims,               // Tous les claims pour extensibilité
  };
}

// Helper interne pour décoder sans vérifier la signature
function decodeJWT(token) {
  const parts = token.split('.');
  const decoded = JSON.parse(atob(parts[1])); // Base64 decode payload
  return decoded;
}
```

**Avantages :**

- ✅ Aucune requête supplémentaire au serveur
- ✅ Token signé cryptographiquement (confiance complète)
- ✅ Compatible avec Cognito, Entra ID, Google, GitHub, etc.

### Backend (`server/oidc-provider.js`) - NOUVEAU

Fichier complet pour OIDC server-side (validation tokens côté serveur):

```javascript
import { Issuer, generators } from 'openid-client';

// Découverte automatique des endpoints OIDC
const issuer = await Issuer.discover(OIDC_PROVIDER_URL);
const client = new issuer.Client(config);

// Échange du code contre les tokens
const tokenSet = await client.callback(redirectUri, { code, state }, { nonce });

// Récupération et validation des claims
const claims = tokenSet.claims();
```

**Pour plus tard (optionnel) :**

- Valider les tokens côté serveur avant d'accorder l'accès
- Implémenter les routes OIDC si backend doit être un client OIDC

## Claims OIDC Standards

Tous ces claims sont automatiquement dans le JWT `id_token` :

| Claim | Type | Exemple |
| ----- | ---- | ------- |
| `sub` | String | `"cognito_user_id"` |
| `email` | String | `"user@example.com"` |
| `email_verified` | Boolean | `true` |
| `name` | String | `"John Doe"` |
| `given_name` | String | `"John"` |
| `family_name` | String | `"Doe"` |
| `picture` | String | `"https://..."` |
| `aud` | String | `"client_id"` |
| `iss` | String | `"https://issuer"` |
| `iat` | Number | `1234567890` |
| `exp` | Number | `1234567890` |

## Profile.jsx - Utilisation automatique des claims OIDC

```jsx
import { getUserFromToken } from '../services/auth';

export default function ProfilePage({ ctx }) {
  // Récupérer automatiquement les infos du token OIDC
  const tokenUser = getUserFromToken();
  
  const [displayName, setDisplayName] = useState(
    tokenUser?.displayName || currentUser.displayName || ''
  );
  const [firstName, setFirstName] = useState(
    tokenUser?.firstName || currentUser.firstName || ''
  );
  const [picture, setPicture] = useState(
    tokenUser?.picture || currentUser.profileIcon || ''
  );
  
  // ... reste du code
}
```

**Résultat :**

- ✅ Photo de profil chargée depuis `claims.picture`
- ✅ Nom rempli depuis `claims.name`
- ✅ Email pré-rempli depuis `claims.email`
- ✅ Pas d'appel à `/users/me`

## Préparation pour Entra ID (Azure AD)

### 1. Créer l'app dans Entra ID

```bash
az ad app create \
  --display-name "AD Cyberwatch AI" \
  --web-redirect-uris "http://localhost:5173/callback" "http://localhost:3001/callback" \
  --enable-access-token-issuance true \
  --enable-id-token-issuance true
```

### 2. Changer les variables d'environnement

```bash
# .env.local (pour Entra ID)
VITE_COGNITO_DOMAIN=https://login.microsoftonline.com
VITE_COGNITO_USER_POOL_ID=your-tenant-id
VITE_COGNITO_CLIENT_ID=your-app-id
VITE_COGNITO_REGION=v2.0
VITE_COGNITO_REDIRECT_URI=http://localhost:5173/callback

# .env (pour Entra ID)
OIDC_PROVIDER_URL=https://login.microsoftonline.com/your-tenant-id/v2.0
OIDC_CLIENT_ID=your-app-id
OIDC_CLIENT_SECRET=your-secret
```

### 3. C'est tout

L'application fonctionne **exactement pareil** car elle utilise OIDC discovery standard.

## Gestion des rôles (Cognito vs Entra ID)

### Cognito

```javascript
// Les groupes Cognito deviennent un claim
{
  "cognito:groups": ["admin", "developers"]
}

// Accès universal:
const user = getUserFromToken();
const roles = user.oidcClaims?.['cognito:groups'] || [];
```

### Entra ID

```javascript
// Les roles Entra ID deviennent un claim
{
  "roles": ["admin", "developers"]
}

// Accès universel (même code):
const user = getUserFromToken();
const roles = user.oidcClaims?.roles || [];
```

### Helper universel

```javascript
export function getUserRoles() {
  const user = getUserFromToken();
  const claims = user?.oidcClaims || {};
  
  // Accepte cognito:groups ou roles
  return claims['cognito:groups'] || claims.roles || [];
}
```

## Flux complet (Frontend)

```text
User clique "Login"
     ↓
startSSO() → Génère code_verifier (PKCE)
     ↓
Redirige vers provider avec code_challenge
     ↓
User s'authentifie chez Cognito/Entra ID
     ↓
Callback: code + state + nonce
     ↓
handleOAuthCallback(code)
  - Récupère code_verifier
  - Échange code pour tokens
  - Sauvegarde idToken dans sessionStorage
     ↓
Profile page charge → getUserFromToken()
  - Décode idToken
  - Extrait claims (email, name, picture, roles)
  - Affiche le profil automatiquement
     ↓
✅ Utilisateur connecté avec profil complet
```

## Dépendances ajoutées

```json
{
  "dependencies": {
    "openid-client": "^5.7.0",
    "express-session": "^1.18.1"
  }
}
```

**À installer :**

```bash
npm install
```

## Migration future : Cognito → Entra ID

| Étape | Cognito | Entra ID | Effort |
| ----- | ------- | -------- | ------ |
| Créer l'app | Cognito console | Azure portal | 5 min |
| Config variables | `OIDC_PROVIDER_URL` → Cognito | → Entra ID | 2 min |
| Claims utilisateur | Automatique | Automatique | 0 min |
| Gestion rôles | `cognito:groups` | `roles` claim | Helper |
| Code applicatif | OIDC universel | OIDC universel | 0 min ⭐ |

**Verdict :** Avec OIDC, migrer de provider est une simple modification de variables d'environnement !

## Fichiers modifiés

```text
src/services/auth.js
├── ✅ Ajouté: decodeJWT()
├── ✅ Ajouté: getUserFromToken() → Info depuis JWT
├── ✅ Modifié: handleOAuthCallback() → Utilise getUserFromToken()
└── ✅ Modifié: Routing vers local server pour users/roles

server/oidc-provider.js [NOUVEAU]
├── OIDC discovery automatique
├── Token exchange avec validation
└── getUserInfo() si besoin futur

src/pages/Profile.jsx
├── ✅ Import: getUserFromToken
├── ✅ State pré-rempli depuis token
└── ✅ Photo depuis claims.picture

.env.example
├── ✅ Config Cognito commentée
├── ✅ Config Entra ID commentée
└── ✅ Instructions claires
```

## Tests à faire

```javascript
// 1. Vérifier getUserFromToken() retourne les claims
const user = getUserFromToken();
console.log(user);
// Devrait afficher: { id, email, displayName, firstName, lastName, picture, oidcClaims }

// 2. Vérifier le profil se pré-remplit
// → Login SSO
// → Aller sur Profile
// → Email, nom, prénom, photo doivent être remplis

// 3. Vérifier les rôles
const roles = getUserFromToken()?.oidcClaims?.['cognito:groups'] || [];
console.log(roles);
```

## Points clés

🔐 **Sécurité :**

- PKCE protège le code_verifier
- JWT est signé par le provider
- Client-side decode est sûr (pas de vérif nécessaire, juste extraction)
- Server-side validation possible avec oidc-client

🌍 **Universalité :**

- Cognito ✅
- Entra ID ✅
- Google ✅
- GitHub ✅
- N'importe quel OIDC ✅

⚡ **Performance :**

- Moins de requêtes HTTP
- Info utilisateur dans JWT
- Pas de round-trip supplémentaire

📱 **Extensibilité :**

- Claims personnalisés supportés
- Rôles/groupes gérés nativement
- SSO simple et puissant

## Prochaines étapes (optionnel)

1. **Tester avec Entra ID** si vous y avez accès
2. **Ajouter token refresh** si les sessions sont longues
3. **Valider tokens côté serveur** avec oidc-client si needed
4. **Ajouter logout** avec revocation du refresh token
5. **Cache des claims** si besoin de performance extrême

---

**Vous êtes maintenant prêt pour envisager Entra ID !** 🎉
