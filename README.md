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

### Structure rapide

- `src/App.jsx` : Shell principal (auth, navigation, injection du contexte
  partagé).
- `src/pages/*` : Vues isolées (Dashboard, Details, Remediation, ML,
  Settings, Profile).
- `src/services/auth.js` : appels API auth et utilisateurs vers le serveur
  Express.
- `server/config-server.js` : API locale (config + utilisateurs) avec
  persistance fichier.
- `scripts/dev-both.js` : lance Vite et le serveur config en parallèle.

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
