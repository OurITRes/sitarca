export const MOCK_TREND_DATA = [
  { month: 'Jan', score: 45, risks: 120 },
  { month: 'Fev', score: 48, risks: 115 },
  { month: 'Mar', score: 55, risks: 90 },
  { month: 'Avr', score: 62, risks: 85 },
  { month: 'Mai', score: 60, risks: 88 },
  { month: 'Juin', score: 68, risks: 72 },
];

export const DETAILED_FINDINGS = [
  {
    id: 'PC-004',
    source: 'PingCastle',
    title: 'Krbtgt password not changed recently',
    description: 'Le compte krbtgt n\'a pas changé de mot de passe depuis plus de 400 jours. Risque majeur de persistance (Golden Ticket).',
    score: 100,
    risk: 'Critical',
    asset: 'Domain Controller (KDC)',
    remediation_cost: 'Low',
    security_gain: 'High',
    mappings: {
        nist_2: 'PR.AA-01',
        nist_1: 'PR.AC-1',
        cis_8: '5.4',
        cis_7: '16.3',
        custom: 'SEC-POL-05'
    }
  },
  {
    id: 'BH-001',
    source: 'BloodHound',
    title: 'Kerberoasting to Domain Admin',
    description: 'Un chemin court (3 sauts) permet à un utilisateur standard de compromettre un compte de service, puis d\'escalader vers Domain Admin.',
    score: 95,
    probability: 0.85,
    risk: 'Critical',
    asset: 'Domain Admins',
    mitre_id: 'T1558',
    remediation_cost: 'Medium',
    security_gain: 'Critical',
    mappings: {
        nist_2: 'PR.AA-05',
        nist_1: 'PR.AC-6',
        cis_8: '6.8',
        cis_7: '4.7',
        custom: 'SEC-ID-02'
    }
  },
  {
    id: 'PC-003',
    source: 'PingCastle',
    title: 'Pre-Windows 2000 Compatible Access',
    description: 'Le groupe "Everyone" est présent dans ce groupe historique, exposant la lecture de tout l\'AD.',
    score: 90,
    risk: 'High',
    asset: 'AD Domain Root',
    remediation_cost: 'High',
    security_gain: 'Medium',
    mappings: {
        nist_2: 'PR.AC-03',
        nist_1: 'PR.AC-4',
        cis_8: '3.3',
        cis_7: '13.4',
        custom: 'SEC-ACC-10'
    }
  },
];

export const AI_WEIGHTS = [
  { feature: 'Exploitability (BloodHound)', weight: 0.45, change: '+5%' },
  { feature: 'Asset Criticality (Tier 0)', weight: 0.30, change: '+2%' },
  { feature: 'CVSS Score', weight: 0.15, change: '-4%' },
  { feature: 'Control Presence', weight: 0.10, change: '-3%' },
];

export const INITIAL_REMEDIATION_PLAN = [
  { id: 1, task: "Réinitialiser le mot de passe KRBTGT (x2)", status: "To Do", owner: "SysAdmin Team", priority: "Critical", complexity: 10, criticality: 90, dependency: null },
  { id: 2, task: "Restreindre les permissions 'Service Accounts'", status: "In Progress", owner: "IAM Team", priority: "High", complexity: 40, criticality: 70, dependency: null },
  { id: 3, task: "Corriger les ACLs 'Domain Controllers'", status: "Done", owner: "SecOps", priority: "Medium", complexity: 60, criticality: 60, dependency: 2 },
  { id: 4, task: "Désactiver Spooler sur les DC", status: "To Do", owner: "SysAdmin Team", priority: "Low", complexity: 20, criticality: 30, dependency: null },
];
