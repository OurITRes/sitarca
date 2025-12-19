# AD Cyberwatch.AI (beta)

Tableau de bord de sécurité Active Directory avec vues dédiées
(Command Center, Investigation & Graphe, Plan de remédiation, IA/Modèle,
Paramètres & Connecteurs, Profil). Frontend React/Vite + serveur de
configuration Express pour la persistance locale des paramètres et des
utilisateurs.

## Fonctionnalités principales

- Auth local + gestion des utilisateurs (création, suppression, rôles,
  mode local/SSO stub) via la page Paramètres.
- Vues extraites par page : Dashboard, Détails/Investigation, Remédiation,
  Moteur IA/Modèle, Paramètres & Connecteurs, Profil.
- Stockage config/utilisateurs en fichiers JSON côté serveur
  (`server/data/config.json`, `server/data/users.json`).
- Sélecteur de langue, affichage nom/avatar, navigation latérale et header
  communs.

## Prérequis

- Node.js 18+ (recommandé) et npm.

## Installation

1. Installer les dépendances :

   ```bash
   npm install
   ```

## Lancer en développement

- Front + serveur config en parallèle (ports par défaut 5173 et 3001) :

  ```bash
  npm run dev:both
  ```

- Ou séparément :

  ```bash
  npm run dev          # Frontend Vite
  node server/config-server.js  # API config/utilisateurs
  ```

### Build / Lint

- Build : `npm run build`
- Preview du build : `npm run preview`
- Lint : `npm run lint`

### Structure rapide (UI isolée)

- Voir la section détaillée « Structure du projet » ci‑dessous.
- `ui/` contient tout le frontend (React/Vite) isolé.
- `server/` contient l’API locale et les données côté serveur.
- `backend/` contient les fonctions Lambda (API et ingestion).
- `infra/` contient l’infrastructure (SAM/CloudFormation, tests, événements).

### Authentification et données

- Les utilisateurs sont stockés dans `server/data/users.json`. Créez-en un via
  la page Paramètres -> "Créer un utilisateur" ou en POST sur `/users`.
- Login vérifie l'ID + mot de passe (hash SHA-256 côté serveur). Les comptes
  sans mot de passe défini ne pourront pas se connecter.
- Les paramètres (Jira, ServiceNow, langues, etc.) sont stockés dans
  `server/data/config.json` via `/config`.

### Déploiement local rapide

1. `npm install`
2. `npm run dev:both`
3. Ouvrir [http://localhost:5173](http://localhost:5173) et se connecter avec
   un utilisateur présent dans `server/data/users.json` ou en créer un depuis
   Paramètres.

## License

This project is licensed under the GNU Affero General Public License v3.0
(AGPL-3.0-only). See the [LICENSE](./LICENSE) file.

If you run a modified version of this software as a network service, you must
offer the corresponding source code to users interacting with it over the
network (AGPLv3).

---

## Structure du projet (actualisée)

```text
ad-cyberwatch.ai/
├── ui/                         # 📱 UI LAYER (frontend isolé)
│   ├── src/                    # composants React, pages, services
│   ├── public/                 # assets statiques
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json            # dépendances UI
│   └── (tailwind, postcss, eslint, etc.)
│
├── server/                     # 💾 API locale & données (dev)
│   ├── config-server.js        # serveur Express local
│   ├── oidc-provider.js        # fournisseur OIDC de dev
│   └── data/                   # 🔒 données côté serveur (non exposées)
│       ├── users.json          # comptes locaux
│       ├── uploads.json        # métadonnées d’upload
│       ├── config.json         # configuration runtime
│       └── *.xml               # fichiers PingCastle/BloodHound
│
├── backend/                    # ⚡ Fonctions Lambda (AWS)
│   ├── api-node/               # API (Node.js) → /health, /me, /uploads/presign
│   └── ingest-python/          # Ingestion (Python) → parse XML → DynamoDB
│
├── infra/                      # 🏗️ Infra as Code (SAM/CloudFormation)
│   ├── template.yaml           # ressources (S3, DynamoDB, Cognito, API, Lambda)
│   ├── __tests__/              # tests d’infrastructure
│   └── events/                 # événements de test pour Lambda
│
├── config/                     # ⚙️ Environnements & Sécurité
│   ├── environments/           # dev/staging/prod (.json)
│   └── security/               # IAM policies, CORS, Auth
│
├── docs/                       # 📚 documentation
├── scripts/                    # 🛠️ outils (ex: dev-both.js)
└── archivesNotUsed/            # 🗄️ archives (ignorées par git)
```

### Segregation logique

- **UI (ui/):** application SPA React, déployée sur S3/CloudFront.
- **API (backend/api-node):** endpoints backend (presign, me, health).
- **Data processing (backend/ingest-python):** ingestion de scans et insertion DynamoDB.
- **Données serveur (server/data):** utilisateurs/config/fichiers XML,
  jamais exposés directement au client.
- **Infra (infra/):** définition des ressources AWS (S3 raw/curated,
  DynamoDB pk/sk, Cognito, API Gateway/HTTP API, EventBridge, Lambda).
- **Environnements (config/environments):** variables par environnement (dev/staging/prod).
- **Sécurité (config/security):** politiques IAM minimales, CORS, paramètres Cognito.

### Scripts & commandes

- Lancer UI + serveur local: `npm run dev:both`
- Lancer uniquement l’UI: `npm run dev` (dans ui)
- Build UI: `npm run build` (dans ui)

### Bonnes pratiques sécurité

- Ne jamais mettre de secrets dans les variables `VITE_*` (visibles côté client).
- Utiliser AWS Secrets Manager / Parameter Store pour les secrets en prod.
- Appliquer le principe du moindre privilège sur les IAM policies.
