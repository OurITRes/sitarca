# Réponses - Intégrations & Configuration AWS

## Question 1: La Vue Intégrations offre une carte pour configurer EntraID - Est-ce lié?

### Oui, c'est lié

La page **Automation.jsx** (appelée "Intégrations" dans le menu) contient maintenant **deux cartes importantes**:

#### 1. Configuration SSO (Existante)

```text
┌─ Configuration SSO ─────────────────┐
│ 🛡️ Configuration SSO                │
│ Paramètres d'authentification...   │
│                                    │
│ Provider:        [Dropdown]        │
│ - Azure AD / Entra ID              │
│ - Okta                             │
│ - Google Workspace                 │
│ - SAML 2.0                         │
│                                    │
│ Client ID:       [Input]           │
│ Tenant ID:       [Input]           │
│ Redirect URI:    [Input]           │
│                                    │
│ [Tester SSO] [Sauvegarder SSO]    │
└────────────────────────────────────┘
```

**Gère**: L'authentification utilisateur (Cognito, Entra ID, etc.)

#### 2. Configuration AWS (Nouvelle - ajoutée pour vous)

```text
┌─ Configuration AWS ─────────────────┐
│ 🌩️ Configuration AWS                │
│ Paramètres d'intégration AWS...    │
│                                    │
│ ℹ️ Infos actuelles                 │
│ Stack Name:    adcyberwatch-poc    │
│ Region:        ca-central-1        │
│ API Gateway:   87viw60pjl...       │
│ DynamoDB:      adcyberwatch-main   │
│                                    │
│ AWS Region:        [Select]        │
│ API Gateway ID:    [Input]         │
│ DynamoDB Table:    [Input]         │
│ S3 Raw Bucket:     [Input]         │
│ S3 Curated Bucket: [Input]         │
│ Lambda Function:   [Input]         │
│                                    │
│              [Sauvegarder AWS]     │
└────────────────────────────────────┘
```

**Gère**: L'infrastructure AWS (SAM Stack)

### Le lien

```text
Application Automation Page
├─ SSO Configuration
│  └─ "Qui êtes-vous?" → Cognito/Entra ID
│
└─ AWS Configuration
   └─ "Où stocker vos données?" → AWS Stack
```

**Ensemble**: Configuration complète de l'authentification ET de l'infrastructure!

---

## Question 2: Ajouter une carte avec les paramètres AWS utilisés

### ✅ FAIT! Carte "Configuration AWS" ajoutée

#### Paramètres affichés (lecture seule)

```text
Stack Name:           adcyberwatch-poc
Region:               ca-central-1
Cognito Pool:         ca-central-1_diALmgpwp
HTTP API Gateway:     87viw60pjl.execute-api.ca-central-1
DynamoDB Table:       adcyberwatch-main
Lambda Functions:     adcyberwatch-ingest
```

#### Paramètres configurables

1. **AWS Region** (Dropdown)
   - ca-central-1 (Canada)
   - us-east-1 (N. Virginia)
   - us-west-2 (Oregon)
   - eu-west-1 (Ireland)
   - eu-central-1 (Frankfurt)
   - ap-northeast-1 (Tokyo)

2. **HTTP API Gateway ID**
   - ID pour construire: `https://{ID}.execute-api.{REGION}.amazonaws.com`
   - Exemple: `87viw60pjl`
   - Utilisé pour tous les appels API

3. **DynamoDB Table Name**
   - Stocke les résultats des analyses
   - Exemple: `adcyberwatch-main`
   - Clé: `WEAK#{weakness-id}`

4. **S3 Bucket (Raw Scans)**
   - Fichiers XML/JSON uploadés
   - Exemple: `adcyberwatch-raw`
   - Déclenche Lambda via EventBridge

5. **S3 Bucket (Curated Data)**
   - Données traitées/normalisées
   - Exemple: `adcyberwatch-curated`
   - Stocke résultats finaux

6. **Lambda Ingest Function**
   - Traite les fichiers uploadés
   - Exemple: `adcyberwatch-ingest`
   - Déclenché automatiquement

### Architecture visualisée

```text
Frontend Application (React)
    │
    ├─ Cognito Auth (ca-central-1_diALmgpwp)
    │  └─ User login + SSO
    │
    ├─ HTTP API Gateway (87viw60pjl)
    │  ├─ GET /health
    │  ├─ GET /me (user info)
    │  ├─ POST /uploads/presign (pre-signed URL)
    │  ├─ GET /roles
    │  └─ PUT /users/:id
    │
    └─ File Upload Flow
       ├─ User selects XML file
       ├─ Get pre-signed URL from API Gateway
       ├─ Upload directly to S3 (adcyberwatch-raw)
       ├─ S3 triggers EventBridge
       ├─ EventBridge invokes Lambda (adcyberwatch-ingest)
       ├─ Lambda processes and stores in DynamoDB (adcyberwatch-main)
       └─ Results available in UI
```

### Où ajouter

**Fichier**: `src/pages/Automation.jsx`

**Localisation**: Nouvelle carte "Configuration AWS" ajoutée après la carte "Configuration SSO"

**Icône**: Cloud (🌩️) avec style orange

### Persistance

Les paramètres sont sauvegardés dans `server/data/config.json`:

```json
{
  "awsRegion": "ca-central-1",
  "awsApiGatewayId": "87viw60pjl",
  "awsDynamoDBTable": "adcyberwatch-main",
  "awsS3BucketRaw": "adcyberwatch-raw",
  "awsS3BucketCurated": "adcyberwatch-curated",
  "awsLambdaIngest": "adcyberwatch-ingest"
}
```

### Utilité

1. **Pour le développement**
   - Changer facilement de stack AWS
   - Tester sur différentes régions
   - Pointer vers dev/staging/prod

2. **Pour la documentation**
   - Afficher la config actuelle
   - Rappeler les IDs des ressources
   - Tracer les dépendances

3. **Pour la maintenance**
   - Mise à jour des références
   - Migration de stack
   - Changement de région

### Exemple d'utilisation

**Scénario**: Vous avez deux stacks AWS (dev et prod)

**Dev Stack**:

- Region: ca-central-1
- API: 87viw60pjl
- Table: adcyberwatch-dev
- S3 Raw: adcyberwatch-raw-dev

**Prod Stack**:

- Region: us-east-1
- API: prod1234567890
- Table: adcyberwatch-prod
- S3 Raw: adcyberwatch-raw-prod

**Action**: Dans la page Automation, changez les paramètres → Cliquez "Sauvegarder AWS" → L'app pointe vers prod!

---

## Résumé: Configuration Complète

### Page Automation = Hub Central

```text
┌─ Automation (Intégrations) ──────────────────┐
│                                              │
│ 1. Systèmes de Billetterie                   │
│    ├─ JIRA Software                          │
│    └─ ServiceNow                             │
│                                              │
│ 2. Remédiations                              │
│    └─ Configuration Workflow                 │
│                                              │
│ 3. Configuration SSO ⭐                      │
│    ├─ Cognito                                │
│    ├─ Entra ID (Azure AD)                    │
│    ├─ Okta                                   │
│    └─ SAML 2.0                               │
│                                              │
│ 4. Configuration AWS ⭐ (NOUVEAU)            │
│    ├─ Région                                 │
│    ├─ API Gateway                            │
│    ├─ DynamoDB                               │
│    ├─ S3 Buckets                             │
│    └─ Lambda Functions                       │
│                                              │
└──────────────────────────────────────────────┘
```

### Flux utilisateur

1. **Admin arrive sur Automation**
2. Voit la "Configuration SSO"
   - Configure Cognito ou Entra ID
   - Teste la connexion
3. Voit la "Configuration AWS"
   - Affichage infos actuelles
   - Peut changer les paramètres
   - Sauvegarde les modifications
4. **Résultat**: App complètement configurée! ✅

---

## Fichiers modifiés/créés

| Fichier                    | Changement                 |
|----------------------------|----------------------------|
| `src/pages/Automation.jsx` | Ajout carte AWS Config     |
| `docs/AWS_CONFIG.md`       | Documentation complète     |

## Statut

✅ **Prêt à utiliser**

- Carte visible dans Automation
- Paramètres par défaut corrects
- Sauvegarde fonctionnelle
- Documentation complète

---

**La page Automation est maintenant le point central pour configurer TOUTE l'infrastructure!** 🎉
