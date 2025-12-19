# Guide d'Accès Persistant à DynamoDB pour Utilisateurs Locaux

## 🎯 Problème

Vous êtes développeur local avec un compte IAM AWS, et vous devez accéder à DynamoDB en permanence - même en
mode de développement local - pour synchroniser les indicateurs de synchronisation PingCastle.

## 📋 Solutions Possibles

### Solution 1: DynamoDB Local (Recommandé pour le Développement)

**Avantages:**

- Pas d'accès internet requis
- Pas de frais AWS
- Développement rapide et répétable
- Parfait pour tests et debugging

**Étapes:**

#### 1. Installer DynamoDB Local

```bash
# Télécharger DynamoDB Local (via AWS CLI ou Docker)
docker pull amazon/dynamodb-local
```

#### 2. Lancer DynamoDB Local

```bash
# Via Docker (recommandé)
docker run -p 8000:8000 amazon/dynamodb-local

# Ou installer localement:
# https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.DownloadingAndRunning.html
```

#### 3. Configurer SDK AWS dans votre app

**Backend (Express):**

```javascript
// server/dynamodb-client.js
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const isLocal = process.env.NODE_ENV === 'development' && process.env.DYNAMODB_LOCAL === 'true';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ca-central-1',
  ...(isLocal && {
    endpoint: 'http://localhost:8000',
    credentials: {
      accessKeyId: 'local',
      secretAccessKey: 'local'
    }
  })
});

export const docClient = DynamoDBDocumentClient.from(client);
```

**Variables d'environnement (`.env`):**

```env
NODE_ENV=development
DYNAMODB_LOCAL=true
AWS_REGION=ca-central-1
AWS_ACCESS_KEY_ID=local
AWS_SECRET_ACCESS_KEY=local
```

#### 4. Créer les tables localement

```javascript
// server/init-dynamodb-local.js
import { DynamoDBClient, CreateTableCommand } from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient({
  endpoint: 'http://localhost:8000',
  region: 'ca-central-1'
});

async function createTables() {
  try {
    await client.send(new CreateTableCommand({
      TableName: 'adcyberwatch-main',
      KeySchema: [
        { AttributeName: 'PK', KeyType: 'HASH' },
        { AttributeName: 'SK', KeyType: 'RANGE' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'PK', AttributeType: 'S' },
        { AttributeName: 'SK', AttributeType: 'S' }
      ],
      BillingMode: 'PAY_PER_REQUEST'
    }));
    console.log('Table créée: adcyberwatch-main');
  } catch (err) {
    if (err.name !== 'ResourceInUseException') {
      console.error('Erreur:', err);
    }
  }
}

createTables();
```

**Dans `package.json`:**

```json
{
  "scripts": {
    "dev:dynamodb": "docker run -p 8000:8000 amazon/dynamodb-local",
    "dev:init-db": "node server/init-dynamodb-local.js",
    "dev": "npm run dev:dynamodb & npm run dev:init-db && node server/config-server.js"
  }
}
```

#### 5. Vérifier la connexion

```bash
# Via AWS CLI
aws dynamodb scan --table-name adcyberwatch-main --endpoint-url http://localhost:8000
```

---

### Solution 2: Authentification IAM AWS (Pour Production & Teams)

**Avantages:**

- Accès à la vraie base AWS
- Partage entre développeurs
- Pas de configuration locale
- Suivi et audit AWS

**Étapes:**

#### 1. Configurer vos credentials AWS

**Méthode A: Fichier `~/.aws/credentials`**

```ini
[default]
aws_access_key_id = YOUR_ACCESS_KEY
aws_secret_access_key = YOUR_SECRET_KEY
region = ca-central-1
```

##### Méthode B: Variables d'environnement

```bash
export AWS_ACCESS_KEY_ID=your-key
export AWS_SECRET_ACCESS_KEY=your-secret
export AWS_REGION=ca-central-1
```

##### Méthode C: AWS SSO (Recommandé)

```bash
# Configurer une session SSO
aws sso login --profile my-profile

# Votre app utilisera automatiquement les credentials SSO
```

#### 2. Vérifier les permissions IAM

Votre utilisateur/rôle IAM doit avoir ces permissions sur DynamoDB:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": "arn:aws:dynamodb:ca-central-1:*:table/adcyberwatch-*"
    }
  ]
}
```

#### 3. Configurer le SDK (Production)

```javascript
// server/dynamodb-client.js (version production)
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// SDK cherchera automatiquement:
// 1. Variables d'env AWS_*
// 2. Fichier ~/.aws/credentials
// 3. Rôle IAM (si sur EC2/ECS/Lambda)
// 4. SSO session

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ca-central-1'
});

export const docClient = DynamoDBDocumentClient.from(client);
```

#### 4. Tester la connexion

```javascript
// server/test-dynamo.js
import { docClient } from './dynamodb-client.js';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';

async function test() {
  try {
    const result = await docClient.send(
      new ScanCommand({ TableName: 'adcyberwatch-main', Limit: 1 })
    );
    console.log('✅ Connexion réussie!');
    console.log('Éléments:', result.Count);
  } catch (err) {
    console.error('❌ Erreur connexion:', err.message);
  }
}

test();
```

**Exécuter le test:**

```bash
node server/test-dynamo.js
```

---

### Solution 3: Dual Mode (DynamoDB Local OU AWS)

**Parfait pour dev & prod dans la même codebase:**

```javascript
// server/config.js
export const DynamoDBConfig = {
  get isLocal() {
    return process.env.DYNAMODB_LOCAL === 'true';
  },

  get connectionOptions() {
    if (this.isLocal) {
      return {
        endpoint: 'http://localhost:8000',
        region: 'ca-central-1',
        credentials: {
          accessKeyId: 'local',
          secretAccessKey: 'local'
        }
      };
    }
    
    return {
      region: process.env.AWS_REGION || 'ca-central-1'
      // SDK trouvera automatiquement les credentials
    };
  }
};

// server/dynamodb-client.js
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBConfig } from './config.js';

const client = new DynamoDBClient(DynamoDBConfig.connectionOptions);
export const docClient = DynamoDBDocumentClient.from(client);
```

**Variables .env:**

```env
# Development
DYNAMODB_LOCAL=true

# Production (commentez DYNAMODB_LOCAL)
# AWS_REGION=ca-central-1
```

---

## 📊 Synchronisation PingCastle ↔ DynamoDB

### Stockage des Données

```javascript
// Structure de stockage PingCastle dans DynamoDB
{
  PK: "PINGCASTLE#2025-01-15",           // Date du dernier scan
  SK: "SYNC#status",
  lastSyncDate: "2025-01-15T10:30:00Z",
  totalFindings: 145,
  criticalCount: 8,
  highCount: 34,
  mediumCount: 52,
  lowCount: 51,
  reportPath: "/uploads/PingCastle_2025-01-15.xml",
  ttl: 1735689000,  // Expire après 30 jours
}
```

### Fonction de Synchronisation

```javascript
// server/services/pingcastle-sync.js
import { docClient } from '../dynamodb-client.js';
import { PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import fs from 'fs';
import xml2js from 'xml2js';

export async function syncPingCastleReport(filePath) {
  try {
    // 1. Parser le rapport XML
    const xmlData = fs.readFileSync(filePath, 'utf-8');
    const parser = new xml2js.Parser();
    const report = await parser.parseStringPromise(xmlData);

    // 2. Extraire les stats
    const findings = report.HealthcheckData.RiskRules?.[0].RiskRule || [];
    const stats = {
      total: findings.length,
      critical: findings.filter(f => f.Level === 'Critical').length,
      high: findings.filter(f => f.Level === 'High').length,
      medium: findings.filter(f => f.Level === 'Medium').length,
      low: findings.filter(f => f.Level === 'Low').length
    };

    // 3. Sauvegarder dans DynamoDB
    const today = new Date().toISOString().split('T')[0];
    await docClient.send(new PutCommand({
      TableName: 'adcyberwatch-main',
      Item: {
        PK: `PINGCASTLE#${today}`,
        SK: 'SYNC#status',
        lastSyncDate: new Date().toISOString(),
        ...stats,
        ttl: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 jours
      }
    }));

    return stats;
  } catch (err) {
    console.error('Erreur sync PingCastle:', err);
    throw err;
  }
}
```

### API Endpoint pour Statut

```javascript
// server/config-server.js
app.get('/api/pingcastle/status', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const result = await docClient.send(new GetCommand({
      TableName: 'adcyberwatch-main',
      Key: {
        PK: `PINGCASTLE#${today}`,
        SK: 'SYNC#status'
      }
    }));

    res.json(result.Item || {
      synced: false,
      lastSyncDate: null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

### Affichage dans l'UI

```javascript
// src/hooks/usePingCastleStatus.js
import { useEffect, useState } from 'react';

export function usePingCastleStatus() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch('/api/pingcastle/status');
        const data = await res.json();
        setStatus(data);
      } catch (err) {
        console.error('Erreur fetch status:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchStatus();
    const interval = setInterval(fetchStatus, 60000); // Refresh chaque minute

    return () => clearInterval(interval);
  }, []);

  return { status, loading };
}
```

### Composant Affichage

```jsx
// src/components/PingCastleStatusCard.jsx
import { usePingCastleStatus } from '../hooks/usePingCastleStatus';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

export function PingCastleStatusCard() {
  const { status, loading } = usePingCastleStatus();

  if (loading) return <div>Chargement...</div>;
  if (!status) return <div>Non synchronisé</div>;

  return (
    <div className="p-4 bg-blue-50 rounded border border-blue-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-slate-800">PingCastle</p>
          {status.synced ? (
            <p className="text-sm text-green-600 flex items-center">
              <CheckCircle size={16} className="mr-1" />
              Synchronisé le {new Date(status.lastSyncDate).toLocaleString()}
            </p>
          ) : (
            <p className="text-sm text-orange-600 flex items-center">
              <AlertCircle size={16} className="mr-1" />
              Jamais synchronisé
            </p>
          )}
        </div>
        <div className="text-right">
          {status.critical > 0 && (
            <p className="text-sm text-red-600">🔴 {status.critical} Critiques</p>
          )}
          {status.high > 0 && (
            <p className="text-sm text-orange-600">🟠 {status.high} Hauts</p>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## 🚀 Déploiement

### Development

```bash
# Terminal 1: DynamoDB Local
npm run dev:dynamodb

# Terminal 2: API Server
npm run dev

# Terminal 3: Frontend (Vite)
npm run dev
```

### Production (AWS)

```bash
# Pas de configuration supplémentaire requise!
# L'app connectera automatiquement à DynamoDB via:
# 1. Env vars (si sur Lambda/ECS)
# 2. Rôle IAM (si sur EC2)
# 3. SSO session (si utilisateur dev)
```

---

## 📝 Checklist

- [ ] DynamoDB Local lancé (ou credentials AWS configurés)
- [ ] Tables créées
- [ ] SDK configuré dans `server/dynamodb-client.js`
- [ ] Variables d'env correctes
- [ ] Connection test réussi
- [ ] PingCastle sync implémenté
- [ ] API endpoint `/api/pingcastle/status` actif
- [ ] Frontend affiche le statut

---

## 🔧 Troubleshooting

### "Cannot connect to DynamoDB"

```bash
# Vérifier que DynamoDB Local tourne
curl http://localhost:8000

# Ou vérifier les credentials AWS
aws dynamodb list-tables --endpoint-url http://localhost:8000
aws sts get-caller-identity  # Pour AWS réel
```

### "UnauthorizedOperation"

```bash
# Vérifier les permissions IAM
aws iam get-user-policy --user-name YOUR_USER --policy-name YOUR_POLICY
```

### "Table does not exist"

```bash
# Créer les tables
npm run dev:init-db

# Ou manuellement
aws dynamodb create-table ... --endpoint-url http://localhost:8000
```

---

## 📚 Ressources

- [DynamoDB Local Documentation](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html)
- [AWS SDK JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [IAM Policy Examples](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/access-control-overview.html)
- [PingCastle XML Format](https://www.pingcastle.com/documentation/)
