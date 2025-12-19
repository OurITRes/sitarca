// Définir le "Contrat" (TypeScript Interfaces)
// C'est la fondation. On crée les types qui vont régir toute l'application.

// Les sources possibles
export type DataSource = 'PingCastle' | 'BloodHound' | 'Manual' | string;

// Les niveaux de sévérité unifiés
export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';


// Identification des frameworks supportés (clé canonique)
export type FrameworkKey =
  | 'NIST_CSF'      // NIST Cybersecurity Framework (ex: 1.1, 2.0)
  | 'CIS_CONTROLS'  // CIS Controls (ex: v7, v8)
  | 'ISO_27001'     // ISO/IEC 27001 (ex: 2022, 2023)
  | 'STIG'          // DISA STIG
  | 'MITRE_ATTACK'  // MITRE ATT&CK (techniques / mitigations)
  | 'PCI_DSS'       // PCI DSS (ex: 4.0, 4.0.1)
  | 'BNC_INTERNAL'  // Framework interne BNC
  | string;         // Permet d'ajouter d'autres frameworks sans changer le modèle

// La structure de nos Frameworks (pour l'affichage dynamique)
export interface FrameworkSubCategory {
  id: string;   // ex: "AC"
  name: string; // ex: "Access Control"
}

export interface FrameworkCategory {
  id: string;   // ex: "PR" ou "Identify"
  name: string; // ex: "Protect"
  subCategories?: FrameworkSubCategory[]; 
}

export interface SecurityFramework {
  id: FrameworkKey;        // ex: "NIST_CSF"
  version?: string;        // ex: "2.0"
  categories: FrameworkCategory[];
}

// Référence à un contrôle/élément d'un framework (versionnable)
export interface FrameworkReference {
  framework: FrameworkKey;   // ex: 'NIST_CSF', 'CIS_CONTROLS', 'ISO_27001', 'STIG', 'PCI_DSS'
  version?: string;          // ex: '1.1', '2.0', 'v8', '2022', '2023', '4.0', '4.0.1'
  controlId: string;         // identifiant du contrôle dans le framework (ex: "PR.AC-06", "5.2", "A.9.2", "SV-12345")
  controlName?: string;      // optionnel : nom lisible du contrôle
  scoreContribution?: number; // Score normalisé (0-100) pour aider au calcul de compliance global
  referenceUrl?: string; // lien ou référence externe (doc, URL)
}

// Détails spécifiques à MITRE (plus riche qu'un simple mapping)
export interface MitreContext {
  techniques: string[];       // ex: ["T1098", "T1078"]
  tactics: string[];          // ex: ["Persistence", "Privilege Escalation"]
  mitigations?: string[];     // D3FEND IDs ex: ["D3-LAL"]
}

// Détails spécifiques à la SOURCE (PingCastle / BloodHound)
// Cela évite de polluer l'objet principal avec des champs qui n'existent que chez PingCastle
export interface SourceMetadata {
  toolId?: string;            // PingCastle RiskID (ex: "P-063")
  toolCategory?: string;      // ex: PingCastle Model or bloodhound Mitre category+subcategory 
  reportLocation?: string;    // ex: "domain_health_check.html#P-063"
  maturityLevel?: number;     // PingCastle maturity (0-5)
  technicalExplanation?: string; 
  rawOutput?: any;            // Pour stocker le JSON brut si besoin de debug
}


// L'atome central : Le Finding Unifié
export interface UnifiedFinding {
  id: string;              // ex: "P-063" ou "BH-DCSync"
  source: DataSource;
  originalId: string;      // L'ID dans l'outil d'origine

  title: string;
  description: string;
  affectedAssets: string[]; // ex: ["SRV-01", "PC-HR"]

  severity: SeverityLevel;
  
  // Mapping générique vers plusieurs frameworks / versions
  // - Permet plusieurs références (ex: NIST CSF 1.1 et 2.0, CIS v7 et v8, etc.)
  complianceReferences?: FrameworkReference[];
  // ou 
  // complianceTags: {
  //   nist_csf_1.1?: string[];     // ["PR.AC-6"]
  //   nist_csf_2.0?: string[];     // ["PR.AC-06"]
  //   cis_v7?: string[];           // ["5.2"]
  //   cis_v8?: string[];           // ["5.2"]
  //   iso_27001_2022?: string[];   // ["A.9.2"]
  //   iso_27001_2023?: string[];   // ["A.9.2"]
  //   mitre_attack?: string[];     // ["T1078"]
  //   stig?: String[];             // ex: ["SV-12345", "SV-67890"]
  //   pci_dss_v4.0?: String[];     // ex: ["1.1.1", "3.2.1"]
  //   pci_dss_v4.0.1?: String[];   // ex: ["1.1.1", "3.2.1"]
  //   bnc_internal?: String[];     // ex: ["PR.AC-6.h"]    
  // };

  // CHAMP SPÉCIFIQUE POUR MITRE (pour faciliter accès et UI)
  // mitre?: {
  //   riskID?: string;              // ex: "S-Inactive"
  //   title?: string;                // ex: "Inactive account check"
  //   techniques?: string[];           // ex: [""]
  //   categories?: string[];          // ex: "StaleObjects"
  //   model?: string;       // subcategories ex: "InactiveUserOrComputer"
  //   type?: string;        // "Active Directory"
  //   mitigations?: MitreMitigation[];  // mitigations ["M1018"]
  //   mitigprobableTechniques?: MitreMitigation[];  // techniques probables des mitigations
  //   mitigReferenceUrl?: MitreMitigation[]; // possibilité d'indiquer un lien vers l'ATT&CK matrix / source
  //   referenceUrl?: string; // possibilité d'indiquer un lien vers l'ATT&CK matrix / source
  //   documentation: string[];
  //   description: string[];
  //   technicalExplanation: string[]; 
  //   solution: string[];
  //   reportLocation: string[];
  //   maturityLevel: number; // ex: 1 à 5
  //};

  
  // Pour tes recommandations futures (Plan de remédiation)
  remediation: {
    effort: 'LOW' | 'MEDIUM' | 'HIGH';
    action: string;
    addresses?: FrameworkReference[]; // si la remediation adresse directement certains contrôles/frameworkRefs
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ACCEPTED_RISK'; // devrait a terme etre des status dynamiques provenant de JIRA
    comment?: string;
  };

  // Métadonnées supplémentaires : tags libres, timestamps, etc.
  tags?: string[];
  timestamps: {
    detectedAt: string; // ISO Date
    updatedAt: string;  // ISO Date
  };
}