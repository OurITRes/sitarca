// la "Pierre de Rosette" (Dictionnaire de Mapping)
// C'est ici que seras stockée l'intelligence. 
// C'est un fichier statique pour commencer, mais qui pourra venir d'une DB plus tard.


interface MappingRule {
  nist?: string[];
  cis?: string[];
  iso?: string[];
  mitre?: string[];
}

export const COMPLIANCE_DICTIONARY: Record<string, MappingRule> = {
  // --- PingCastle Rules ---
  "P-063": { // Print Spooler
    nist: ["PR.PT-03", "PR.IP-01"],
    cis: ["4.8"],
    mitre: ["T1547.001"],
    iso: ["A.12.1.2"]
  },
  "P-016": { // AdminCount
    nist: ["PR.AC-06"],
    cis: ["5.4"],
    mitre: ["T1098"],
    iso: ["A.9.2.3"]
  },
  
  // --- BloodHound Findings ---
  "BH-DCSync": {
    nist: ["PR.AC-04", "ID.RA-01"],
    cis: ["6.8"],
    mitre: ["T1003.006"],
    iso: ["A.8.2"]
  }
  // Tu enrichiras ce fichier petit à petit
};