# Sitarca - High Level Architecture (HLA)

Ce document décrit l'architecture logique et les flux de données de la plateforme Sitarca (Version Identity Focus).

## 1. Diagramme de Composants

L'architecture repose sur le pattern "Hexagonal" (Ports & Adapters) simplifié en trois tiers.

```mermaid
flowchart TD
  subgraph Sources["Sources (Inputs)"]
    PC["PingCastle XML"]
    BH["BloodHound JSON / API"]
  end

  subgraph Core["SITARCA Core System"]
    direction TB

    subgraph Backend["Backend Layer"]
      EngineN["Normalize Engine"]

      ETL["Ingestion / ETL Service"]
      
      Engine["Mapping Engine"]
      
      API["REST API Gateway"]
    end

    subgraph Data ["Data Layer view"]
        direction TB
        subgraph DataBase["DataBase view (Docker)"]
            DB[("DynamoDB Local")]
        end
        RawData@{ title: RawData, shape: lin-cyl, label: "Store xml files parsed to json to S3 storage" } 
    end

  end

  subgraph Frontend["Frontend Layer"]
    UI["Frontend SPA (React/Vue)"]
  end

  %% Flux
  PC --> ETL
  BH --> ETL
  ETL -- "Ingest" --> RawData
  EngineN -- Read --> RawData
  EngineN -- "Normalizes/standardizes" --> DB

  Engine <-. "reads/writes/uses/completes" .-> DB

  UI <-- "requests/answers" --> API
  API <-- "read/writes" --> DB
  API -- "orders" --> Engine
  API -- "updates" --> EngineN
  API -- "manually uploads rules_updates / vuln files / cypher queries answers" --> ETL
```

---

```mermaid
erDiagram
  
  USERS {
    int id PK 
    string[] roles_ids FK
    string name
    string displayName
    string firstName
    string lastName
    string email
    string issuer
    string token
  }

  ROLES {
    int id PK
    string name
  }

  FRAMEWORKS {
    int id PK
    string name 
    string Version 
  }

  CONTROLS {
    int id PK
    int framework_id FK
    string name
    blob description
  }

  SCHEMA {
    int id PK
  }

  PCRULES {
    string riskid PK
    int[] controls_ids FK
    string type
    string category
    blob description
    blob documentation
    int maturity_level
    string model
    blob solution
    blob technical_explanation
    string title
  }


  NORMALIZEDWEAKNESS {
    int id PK
    string riskid FK
    int datetime 
    string source
    int score
    string scope
  }

  UPLOADS {
      int id PK
      string filename
      string s3Key
      string bucket
      datetime uploadedAt
      boolean uploadedStatus
      string source
      datetime uploadCompletedAt
    }
```

## 2. Description des Flux de Données

### A. Flux d'Ingestion (La "Pierre de Rosette")

C'est l'étape critique où la donnée technique devient "intelligible" pour le métier.

1. **Collection** : Les fichiers (Rapport XML PingCastle ou Exports JSON Bloodhound) sont déposés ou
   récupérés par le service d'ingestion.
2. **Parsing** :
   * PingCastle Parser extrait les `HealthCheck` et `RiskRules`.
   * Bloodhound Parser analyse les `Nodes` et `Edges` pour identifier les "High Value Targets" exposées.
3. **Normalisation** : Chaque entrée est convertie en objet JSON standardisé `SitarcaFinding`.
   * _Exemple_ : Une règle PingCastle "LAPS not enabled" et un nœud Bloodhound "LAPS readable" deviennent
      tous deux des Findings de type `IdentityWeakness`.

### B. Flux de Mapping (L'Intelligence)

Ce processus transforme la liste de problèmes techniques en tableau de bord de gouvernance.

1. **Chargement** : Le moteur lit les `SitarcaFinding` normalisés.
2. **Matching** : Il parcourt la table de règles (`/data/translation_rules`).
   * _Condition_ : SI `Finding.Tags` contient "Kerberos" ET `Finding.Severity` > 70...
   * _Action_ : ... ALORS marquer le contrôle `NIST PR.AC-3` comme "EN ÉCHEC".
3. **Calcul** : Le moteur agrège les résultats pour produire un score de conformité par Framework.

## 3. Choix Technologiques (Préconisations)

* **Data Serialization** : JSON (Strict Schemas via Pydantic ou TypeBox).
* **Backend** : Python (FastAPI) pour sa facilité de manipulation de données et bibliothèques graph
  (NetworkX) si besoin d'analyser les chemins Bloodhound.
* **Frontend** : React ou Vue.js.
* **Stockage (V1)** : Système de fichiers structuré (JSON files) pour faciliter la portabilité
  "Entreprise". Pas de base de données lourde (PostgreSQL) requise pour la V1.
