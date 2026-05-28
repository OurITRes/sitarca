# Sitarca - High Level Architecture (HLA)

Ce document décrit l'architecture logique et les flux de données de la plateforme Sitarca (Version Identity Focus).

## 1. Diagramme de Composants

L'architecture repose sur le pattern "Hexagonal" (Ports & Adapters) simplifié en trois tiers.

```mermaid
erDiagram
    %% GESTION DES ACCÈS
    ROLES ||--o{ USERS : "RBAC"
    ROLES {
        int id PK
        string name_fr
        string name_en
    }

    USERS {
        int id PK
        string email
        string displayName
        string firstName
        string lastName
        string role_id FK "Lien vers ROLES"
        string auth_type "Local, SSO"
        string issuer
        string token
        string language "fr, en"
    }
    
    %% CONFORMITÉ (FRAMEWORKS)
    FRAMEWORKS ||--o{ CONTROLS : "Contient"
    FRAMEWORKS {
        int id PK
        string name "NIST, CIS, ISO"
        string version "v2.1, 27001:2013"
    }

    CONTROLS {
        int id PK
        int framework_id FK "Lien vers CONTROLS"
        string name "PR.IP-6"
        string title_en "Data is destroyed according to policy"
        string title_fr "La donnée est détrtuite conformément à la politique"
        string description_en "csf.tools Note: Subcategories do not have detailed descriptions."
        string description_fr "csf.tools Note: Les souscatégories n'ont pas de description détaillée."
    }

    %% LA PIERRE DE ROSETTE (Le Pivot)
    CONTROLS ||--o{ STANDARD_DEFINITIONS : "Contrôle"
    STANDARD_DEFINITIONS {
        string _id PK "Code Unique (ex: VULN-AD-001)"
        string title_fr
        string title_en
        string description_fr
        string description_en
        array mapped_controls "Lien vers FRAMEWORKS"
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
    UPLOADS ||--o{ PCRULES : "creates/updates"
    PCRULES {
        string riskid PK
        int[] controls_ids FK
        string type
        string category
        string description_fr
        string description_en
        string documentation_fr
        string documentation_en
        int maturity_level
        string model
        string solution_fr
        string solution_en
        string technical_explanation_fr
        string technical_explanation_en
        string title_fr
        string title_en
    }
    UPLOADS ||--o{ PCFINDINGS : "loads"
    PCRULES ||--|| PCFINDINGS : "defines"
    PCFINDINGS {
        int id PK
        string riskid FK 
        int datetime 
        string source
        int score
        string scope
        string entity_name "Objet AD affecté"
        string status_en "New, Fixed"
        string status_fr "Nouveau, Résolu"
    }

    NORMALIZEDWEAKNESS {
        int id PK
        string riskid FK
        int datetime 
        string source
        int score
        string scope
    }

    FINDINGS {
        string standard_id FK "Lien vers STANDARD_DEFINITIONS"
        objectId scan_id FK
        string entity_name "Objet AD affecté"
        string status "New, Fixed"
        object original_data "Preuve technique brute"
    }

    TOOL_MAPPING_RULES {
        string tool_name "PingCastle, BloodHound"
        string original_rule_id "ex: UserPasswordNeverExpires (PC)"
        string target_standard_id FK "Lien vers STANDARD_DEFINITIONS"
    }

    %% LES DONNÉES VIVANTES (Scans - bloodhound & Résultats - pingcastle)
    SCANS {
        date scan_date
        string source_type
        string uploaded_by FK "Lien vers USERS"
    }

    %% RELATIONS
    
    
    STANDARD_DEFINITIONS ||--o{ TOOL_MAPPING_RULES : "Traduit"
    STANDARD_DEFINITIONS ||--o{ FINDINGS : "Catégorise"
    SCANS ||--o{ FINDINGS : "Contient"
```

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

  ROLES ||--o{ USERS : assigns
  PCRULES ||--o{ NORMALIZEDWEAKNESS : details
  CONTROLS ||--o{ FRAMEWORKS : "included in"
  USERS ||--o{ UPLOADS : "push updates or read update status"
```

```mermaid
flowchart TD
  subgraph Sources["Sources (Inputs)"]
    subgraph AWS["AWS S3 Storage"]
        PC["PingCastle XML files stored in S3"]
    end
    subgraph Saas["SpecterOps SaaS"]
        BH["BloodHound API"]
    end
  end

  subgraph Core["SITARCA Core System"]
    direction TB

    subgraph Backend["Backend Layer"]
      EngineN["Normalize Engine"]

      ETL["Ingestion / ETL Service"]
      
      Engine["Mapping Engine"]
      
      API["REST API Gateway"]
    end

    subgraph Data ["Data Layer"]
        direction TB
        subgraph DataBase["DataBase"]
            DB[("DynamoDB")]
        end
        subgraph Files["AWS S3 Storage"]
            RawData@{ title: RawData, shape: lin-cyl, label: "xml files parsed to json" } 
        end
    end

    subgraph Frontend["Frontend Layer"]
        UI["Frontend SPA (React/Vue)"]
    end

  end


  %% Flux
  ETL -- reads --> PC 
  ETL -- requests --> BH
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
