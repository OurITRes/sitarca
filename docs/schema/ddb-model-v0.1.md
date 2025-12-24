# DynamoDB Data Model (Single Table Design) v0.1

## 1. Table Design

### Primary Key Configuration

- **Partition Key (PK):** `pk` (String)
- **Sort Key (SK):** `sk` (String)

### Global Secondary Indexes (GSI)

**GSI1** (Utilisé pour le "Reverse Lookup" des findings à travers le temps)

- **PK:** `gsi1pk` (String)
- **SK:** `gsi1sk` (String)

## 2. Entities & Access Patterns

### 2.1 RUN (Scan Execution)

Représente l'exécution d'un scan (PingCastle, BloodHound, etc.).

| Attribute | Value / Pattern | Description |
| :--- | :--- | :--- |
| **pk** | `TENANT#default` | Partition unique pour lister tous les runs (Multi-tenant ready). |
| **sk** | `RUN#<runId>` | `runId` est un timestamp ISO ou UUID (ex: `2024-12-24T10:00:00Z`). |
| `runId` | String | Identifiant unique de l'exécution. |
| `source` | `pingcastle` \| `bhe` | Source de la donnée. |
| `createdAt` | ISO8601 String | Date de création. |
| `domain` | String | Domaine audité (ex: `corp.local`). |
| `rawS3Key` | String (S3 URI) | Chemin vers le fichier brut (XML/JSON uploadé). |
| `curatedS3Key` | String (S3 URI) | Chemin vers le fichier normalisé (ASFF JSON). |
| `stats` | Map | Résumé (ex: `{ "total": 50, "critical": 2 }`). |

**Access Pattern (Query):**

- **Lister les runs récents :** `PK="TENANT#default" AND SK begins_with("RUN#")` (ScanIndexForward=false)

---

### 2.2 FINDING (Security Issue)

Représente une anomalie de sécurité détectée lors d'un run spécifique.

| Attribute | Value / Pattern | Description |
| :--- | :--- | :--- |
| **pk** | `RUN#<runId>` | Regroupe tous les findings d'un même scan. |
| **sk** | `FINDING#<findingId>` | `findingId` composite (ex: `pc:rule=PC-001;asset=dom`). |
| **gsi1pk** | `<findingId>` | **Lookup Direct** : ID du finding (sans le préfixe FINDING# si souhaité, ou avec). |
| **gsi1sk** | `RUN#<runId>` | Permet de trier l'historique de ce finding par date de run. |
| `findingId` | String | Identifiant déterministe unique du finding. |
| `asff` | JSON Map | Le payload complet au format ASFF (voir `finding-asff.md`). |
| `severityLabel` | String | `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, `INFO`. |
| `title` | String | Titre du finding pour affichage liste. |
| `resourceKey` | String | Identifiant de la ressource touchée (ex: `user1@corp.local`). |
| `workflowStatus` | String | `NEW`, `NOTIFIED`, `RESOLVED`, `SUPPRESSED`. |
| `recordState` | String | `ACTIVE`, `ARCHIVED`. |
| `tags` | `List of strings` | Tags de compliance (ex: `NIST`, `MITRE:T1003`). |
| `overrides` | Map | Surcharges manuelles (ex: fausses positifs, changement sévérité). |

**Access Pattern (Query):**

- **Récupérer le rapport d'un run :** `PK="RUN#<runId>"`
- **Voir l'historique d'un finding :** `GSI1PK="<findingId>"` (via Index GSI1)

---

### 2.3 MAPPING (Compliance Rules)

Définit la correspondance entre une règle technique (Source) et un Framework de conformité.

| Attribute | Value / Pattern | Description |
| :--- | :--- | :--- |
| **pk** | `MAP#<frameworkId>#<version>` | ex: `MAP#NIST_CSF#2.0` ou `MAP#MITRE_ATTACK#v14`. |
| **sk** | `SRC#<source>#RULE#<ruleId>` | ex: `SRC#pingcastle#RULE#P-063`. |
| `controlIds` | `List of strings` | Liste des contrôles cibles (ex: `["PR.AC-01"]`). |
| `confidence` | Number | Niveau de confiance du mapping (0-100). |
| `notes` | String | Justification du mapping (humain ou IA). |

## 3 Access Pattern (Query Strategies)

### 3.1. UI - Dashboard Principal

Afficher la liste des scans récents.

- `PK = "TENANT#default"`
- `SK begins_with "RUN#"`
- `ScanIndexForward = false` (Du plus récent au plus ancien).

### 3.2. UI - Rapport de Scan (Details)

Afficher tous les findings d'un scan spécifique.

- `PK = "RUN#<selected_run_id>"`
- (Optionnel) `SK begins_with "FINDING#"`
- `ScanIndexForward = false` (si on ajoute d'autres métadonnées dans le futur).

### 3.3. Compliance Engine - Enrichissement

Quand un finding P-063 arrive, quels sont les contrôles NIST associés ?

- `PK = "MAP#NIST_CSF_2.0"`
- `SK = "SRC#pingcastle#RULE#P-063"`

Note: En production, ces mappings sont mis en cache (Memory/Redis) pour éviter de requêter DDB à chaque finding.

### 3.4. Recherche d'historique (Finding Lifecycle)

Voir l'évolution d'un problème spécifique ("Est-ce que ce serveur a toujours eu ce problème ?").

- `GSI1PK = "FINDING#<specific_finding_id>"`
- `GSI1SK (trie par run/date).`

## 4. Notes

1. **Frameworks Definition :** Les définitions de frameworks (liste des contrôles, descriptions) ne sont pas stockées
dans DynamoDB mais dans des fichiers statiques S3 (ou code), car ce sont des données froides (issue #38).
2. **ASFF Storage :** L'attribut `asff` est stocké directement dans l'item FINDING.
