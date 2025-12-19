# Configuration AWS dans Automation.jsx

## Vue d'ensemble

La page **Automation** (Intégrations) contient maintenant une nouvelle carte **Configuration AWS**
qui affiche et permet de configurer les paramètres de la stack AWS SAM utilisée par l'application.

## Carte AWS Configuration

### Informations affichées (lecture seule)

La carte affiche les paramètres actuels de la stack :

```text
Stack Name:           adcyberwatch-poc
Region:               ca-central-1
Cognito Pool:         ca-central-1_diALmgpwp
HTTP API:             87viw60pjl.execute-api.ca-central-1
DynamoDB Table:       adcyberwatch-main
Lambda Functions:     adcyberwatch-ingest
```

### Paramètres configurables

1. **AWS Region**

   - Sélection de la région AWS.
   - Options : `us-east-1`, `us-west-2`, `eu-west-1`, `eu-central-1`, `ca-central-1`, `ap-northeast-1`
   - Défaut : `ca-central-1` (Canada)

2. **HTTP API Gateway ID**

   - ID unique de l'API Gateway.
   - Exemple : `87viw60pjl`
   - Utilisé pour construire : `https://{ID}.execute-api.{REGION}.amazonaws.com`

3. **DynamoDB Table Name**

   - Nom de la table DynamoDB.
   - Exemple : `adcyberwatch-main`
   - Stocke les résultats des analyses.

4. **S3 Bucket (Raw Scans)**

   - Bucket S3 pour les fichiers bruts uploadés.
   - Exemple : `adcyberwatch-raw`
   - Déclenche l'ingestion via EventBridge.

5. **S3 Bucket (Curated Data)**

   - Bucket S3 pour les données traitées.
   - Exemple : `adcyberwatch-curated`
   - Résultats après normalisation.

6. **Lambda Ingest Function**

   - Nom de la fonction Lambda d'ingestion.
   - Exemple : `adcyberwatch-ingest`
   - Déclenché par EventBridge sur upload S3.

## Intégration avec Cognito/Entra ID

**Oui, c'est lié !**

La page Automation contient **deux cartes SSO importantes** :

1. **Configuration SSO** (existante)

   - Paramètres Cognito/Entra ID.
   - Support multi-provider OIDC.
   - Test de connexion.

2. **Configuration AWS** (nouvelle)

   - Paramètres de la stack SAM.
   - Infrastructure cloud.
   - Intégration des services AWS.

### Flux complet

```text
Frontend (React)
├─ SSO Configuration Card
│  └─ Cognito/Entra ID authentication
│
├─ AWS Configuration Card
│  └─ AWS SAM stack infrastructure
│
└─ API Calls via AWS Gateway
   └─ Upload → S3 → Lambda → DynamoDB
```

## Architecture AWS affichée

```text
Application
    │
    ├─ Cognito (ca-central-1_diALmgpwp)
    │  └─ SSO provider
    │
    ├─ HTTP API Gateway (87viw60pjl)
    │  └─ API routes: /health, /me, /uploads/presign, /roles, /users
    │
    ├─ S3 (adcyberwatch-raw)
    │  └─ Raw XML/JSON uploads
    │
    ├─ Lambda (adcyberwatch-ingest)
    │  └─ Process raw data
    │
    ├─ DynamoDB (adcyberwatch-main)
    │  └─ Store findings
    │
    └─ S3 (adcyberwatch-curated)
       └─ Final processed data
```

## Code ajouté

### Import du nouvel icône

```javascript
import { Cloud } from 'lucide-react';
```

### Carte AWS

```jsx
<Card className="border-t-4 border-t-orange-500">
  <div className="flex items-center space-x-3 mb-6">
    <div className="p-2 bg-orange-100 rounded-lg">
      <Cloud className="text-orange-600" size={24} />
    </div>
    <div>
      <h3 className="text-lg font-bold text-slate-800">Configuration AWS</h3>
      <p className="text-sm text-slate-500">
        Paramètres d'intégration Amazon Web Services (SAM Stack)
      </p>
    </div>
  </div>

  <!-- Contenu: infos + paramètres + bouton save -->
</Card>
```

### Gestion d'état

```javascript
// Les paramètres sont stockés dans config
config.awsRegion;           // ca-central-1
config.awsApiGatewayId;     // 87viw60pjl
config.awsDynamoDBTable;    // adcyberwatch-main
config.awsS3BucketRaw;      // adcyberwatch-raw
config.awsS3BucketCurated;  // adcyberwatch-curated
config.awsLambdaIngest;     // adcyberwatch-ingest
```

### Sauvegarde

- Bouton "Sauvegarder AWS" qui appelle `handleSaveConfig()`.
- Tous les paramètres sont persistés dans `server/data/config.json`.

## Utilisation pratique

### Cas d'usage 1 : Configuration locale (développement)

```text
Region:       ca-central-1
API Gateway:  87viw60pjl
DynamoDB:     adcyberwatch-main
S3 Raw:       adcyberwatch-raw
S3 Curated:   adcyberwatch-curated
Lambda:       adcyberwatch-ingest
```

### Cas d'usage 2 : Configuration production

```text
Region:       us-east-1 (si data center US)
API Gateway:  {prod-api-id}
DynamoDB:     adcyberwatch-prod
S3 Raw:       adcyberwatch-prod-raw
S3 Curated:   adcyberwatch-prod-curated
Lambda:       adcyberwatch-ingest-prod
```

### Cas d'usage 3 : Multi-régions

```text
# Région 1 (Canada)
Region:       ca-central-1
API Gateway:  {canada-api}
DynamoDB:     adcyberwatch-ca

# Région 2 (Europe)
Region:       eu-west-1
API Gateway:  {europe-api}
DynamoDB:     adcyberwatch-eu
```

## Affichage des informations

### Design de la carte

```text
┌─ Configuration AWS ─────────────────┐
│ 🌩️                                  │
│ Paramètres d'intégration AWS...    │
│                                    │
│ ℹ️ Informations actuelles           │
│ Stack Name:    adcyberwatch-poc    │
│ Region:        ca-central-1        │
│ Cognito Pool:  ca-central-1_...    │
│ HTTP API:      87viw60pjl...       │
│ DynamoDB:      adcyberwatch-main   │
│ Lambda:        adcyberwatch-ingest │
│                                    │
│ [Champs éditables]                 │
│ AWS Region:        [Select]        │
│ API Gateway ID:    [Input]         │
│ DynamoDB Table:    [Input]         │
│ S3 Bucket (Raw):   [Input]         │
│ S3 Bucket (Cur):   [Input]         │
│ Lambda Function:   [Input]         │
│                                    │
│              [Sauvegarder AWS] btn │
└────────────────────────────────────┘
```

### Couleurs

- **Bordure** : Orange (`border-t-4 border-t-orange-500`)
- **Icône bg** : Orange clair (`bg-orange-100`)
- **Icône** : Orange foncé (`text-orange-600`)
- **Bouton** : Orange (`bg-orange-600`)

## Lien avec OIDC

### Configuration SSO (Cognito/Entra ID)

- Handles : Authentification de l'utilisateur.
- Stores : User profile, roles, permissions.
- Uses : OIDC protocol.

### Configuration AWS

- Handles : Infrastructure cloud.
- Stores : AWS resource references.
- Uses : SDK to interact with AWS services.

### Ensemble

- **SSO** : "Qui êtes-vous ?"
- **AWS** : "Qu'allez-vous faire avec ces ressources ?"

## Persistance

Les paramètres AWS sont sauvegardés dans `server/data/config.json` :

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

## Validation

- Les champs acceptent n'importe quelle valeur (validation côté serveur possible).
- Les valeurs par défaut correspondent à la stack actuellement déployée.
- À utiliser pour pointer vers différentes stacks / environnements.

## Cas d'erreur à gérer (optionnel)

```javascript
// Exemple: Vérifier la validité des paramètres
const validateAwsConfig = (config) => {
  const required = ['awsApiGatewayId', 'awsDynamoDBTable', 'awsS3BucketRaw'];
  return required.every(key => config[key]?.length > 0);
};
```

## Relation avec les autres pages

| Page       | Quoi              | AWS Config                           |
|------------|-------------------|--------------------------------------|
| Upload     | Upload XML        | Uses: `awsS3BucketRaw`               |
| Findings   | Affiche résultats | Uses: `awsDynamoDBTable`             |
| Automation | Configure l'infra | **Gère les params**                  |
| Profile    | Auth user         | N/A (voir SSO Config)                |

## Améliorations futures

1. **Test de connexion**

   - Vérifier accès aux ressources AWS.
   - Tester les permissions IAM.

2. **Affichage du statut**

   - ✅ API Gateway actif
   - ✅ S3 buckets accessibles
   - ✅ DynamoDB table OK

3. **Multi-stack**

   - Switch entre dev / prod / staging.
   - Sauvegarder plusieurs configurations.

4. **Intégration SAM**

   - Deploy directement depuis l'UI.
   - Voir logs de déploiement.

---

**L'intégration SSO + AWS Config fait de cette page le hub de configuration complet de l'application !** 🎉
