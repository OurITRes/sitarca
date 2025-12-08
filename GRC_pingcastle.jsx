import React, { useState, useMemo, useRef } from 'react';
import { 
  Layout, 
  UploadCloud, 
  Search, 
  Wand2, 
  FileJson, 
  ArrowUp, 
  SlidersHorizontal, 
  Info, 
  ShieldAlert, 
  Flame, 
  Crosshair, 
  CheckCircle,
  AlertTriangle,
  Circle,
  FileText,
  Code,
  Lightbulb,
  BookOpen, 
  Briefcase,
  Globe,       // Pour ISO 27001
  CreditCard,  // Pour PCI DSS
  X            // Pour supprimer les tags
} from 'lucide-react';

// --- Données de référence pour les listes déroulantes ---
const OPTIONS_MITRE = [
  { value: "T1003.006", label: "T1003.006 - OS Credential Dumping: DCSync" },
  { value: "T1098", label: "T1098 - Account Manipulation" },
  { value: "T1187", label: "T1187 - Forced Authentication" },
  { value: "T1547.012", label: "T1547.012 - Print Spooler Service" },
  { value: "T1210", label: "T1210 - Exploitation of Remote Services" },
  { value: "T1558", label: "T1558 - Steal or Forge Kerberos Tickets" },
  { value: "T1558.004", label: "T1558.004 - AS-REP Roasting" },
  { value: "T1484.001", label: "T1484.001 - Group Policy Modification" },
  { value: "T1110", label: "T1110 - Brute Force" },
  { value: "T1078", label: "T1078 - Valid Accounts" }
];

const OPTIONS_NIST_2 = [
  { value: "PR.AC-06", label: "PR.AC-06 - Principe de moindre privilège" },
  { value: "PR.AA-01", label: "PR.AA-01 - Politiques d'authentification" },
  { value: "PR.PT-04", label: "PR.PT-04 - Sécurité des réseaux" },
  { value: "PR.PT-03", label: "PR.PT-03 - Accès distants sécurisés" },
  { value: "DE.AE-02", label: "DE.AE-02 - Détection d'anomalies" },
  { value: "PR.AC-01", label: "PR.AC-01 - Gestion des identités" },
  { value: "PR.AC-07", label: "PR.AC-07 - Authentification des utilisateurs" },
  { value: "PR.CM-01", label: "PR.CM-01 - Gestion des configurations" }
];

const OPTIONS_NIST_1_1 = [
  { value: "PR.AC-4", label: "PR.AC-4 - Access Control" },
  { value: "PR.AC-1", label: "PR.AC-1 - IAM Policy" },
  { value: "PR.PT-2", label: "PR.PT-2 - Network Protection" },
  { value: "PR.PT-1", label: "PR.PT-1 - Audit Logs" },
  { value: "DE.AE-2", label: "DE.AE-2 - Anomalies Detection" },
  { value: "PR.AC-6", label: "PR.AC-6 - Identity Proofing" },
  { value: "PR.IP-1", label: "PR.IP-1 - Baseline Configuration" },
  { value: "PR.AC-7", label: "PR.AC-7 - Authentication" }
];

const OPTIONS_CIS_8 = [
  { value: "4.1", label: "4.1 - Establish Access Control Process" },
  { value: "5.2", label: "5.2 - Unique Passwords" },
  { value: "4.8", label: "4.8 - Securely Configure Enterprise Assets" },
  { value: "12.1", label: "12.1 - Ensure Network Infrastructure Management" },
  { value: "7.1", label: "7.1 - Establish Vulnerability Management" },
  { value: "5.4", label: "5.4 - Centralized Account Management" },
  { value: "3.3", label: "3.3 - Data Access Control" },
  { value: "1.1", label: "1.1 - Hardware Asset Inventory" },
  { value: "5.1", label: "5.1 - Establish Accounts Inventory" }
];

const OPTIONS_CIS_7 = [
  { value: "4.1", label: "4.1 - Controlled Use of Admin Privileges" },
  { value: "4.2", label: "4.2 - Change Default Passwords" },
  { value: "9.1", label: "9.1 - Limit Open Ports" },
  { value: "10.1", label: "10.1 - Data Recovery" },
  { value: "6.2", label: "6.2 - Activate Audit Logging" },
  { value: "4.3", label: "4.3 - Unique Passwords" },
  { value: "13.3", label: "13.3 - Monitor Network Traffic" },
  { value: "1.2", label: "1.2 - Address Unassigned Assets" },
  { value: "16.1", label: "16.1 - Account Monitoring" }
];

const OPTIONS_STIG = [
  { value: "V-220001", label: "V-220001 - AD Admin SDHolder" },
  { value: "V-220002", label: "V-220002 - LAPS Configuration" },
  { value: "V-220003", label: "V-220003 - SMB Signing" },
  { value: "V-220004", label: "V-220004 - Print Spooler" },
  { value: "V-220005", label: "V-220005 - Secure Channel" },
  { value: "V-220006", label: "V-220006 - Kerberos Policy" },
  { value: "V-220007", label: "V-220007 - Legacy Protocols" },
  { value: "V-220008", label: "V-220008 - GPO Integrity" },
  { value: "V-220009", label: "V-220009 - Password Policy" }
];

const OPTIONS_ISO27001 = [
  { value: "A.9.2.1", label: "A.9.2.1 - User registration and de-registration" },
  { value: "A.9.2.3", label: "A.9.2.3 - Management of privileged access rights" },
  { value: "A.9.4.3", label: "A.9.4.3 - Password management system" },
  { value: "A.12.6.1", label: "A.12.6.1 - Management of technical vulnerabilities" },
  { value: "A.13.1.1", label: "A.13.1.1 - Network controls" },
  { value: "A.14.2.5", label: "A.14.2.5 - Secure system engineering principles" }
];

const OPTIONS_PCIDSS = [
  { value: "Req 2.1", label: "Req 2.1 - Change vendor defaults" },
  { value: "Req 7.1", label: "Req 7.1 - Limit access to cardholder data" },
  { value: "Req 8.1", label: "Req 8.1 - Define and implement access policies" },
  { value: "Req 8.2", label: "Req 8.2 - Use strong authentication" },
  { value: "Req 10.2", label: "Req 10.2 - Implement audit trails" },
  { value: "Req 11.2", label: "Req 11.2 - Run internal vulnerability scans" }
];

const OPTIONS_SCOPE = [
  "Tout l'environnement",
  "Domain Controllers",
  "Workstations",
  "Servers",
  "Admin Accounts",
  "Legacy",
  "Cloud Infrastructure",
  "DMZ"
];

const OPTIONS_CUSTOM = [
  { value: "INT-HIGH", label: "Critique - Interne" },
  { value: "INT-MED", label: "Moyen - Interne" },
  { value: "INT-LOW", label: "Faible - Interne" },
  { value: "COMP-001", label: "COMP-001 - Conformité Légale" },
  { value: "AUDIT-24", label: "AUDIT-24 - Audit Annuel" }
];

// --- Données de démonstration ---
const DEMO_DATA = [
  { Title: "LAPS not installed or configured", Risk: "80", Description: "Local Administrator Password Solution (LAPS) is not detected.", Technical: "Check LDAP for ms-Mcs-AdmPwd attributes.", Recommendation: "Deploy LAPS via GPO." },
  { Title: "AdminSDHolder is orphan", Risk: "60", Description: "The AdminSDHolder object has an ACL that does not match the default.", Technical: "Get-Acl on AdminSDHolder object.", Recommendation: "Restore default SDDL." },
  { Title: "SMB Signing not required", Risk: "40", Description: "SMB Signing is not enforced on Domain Controllers.", Technical: "RegKey: HKLM\\System\\CCS\\Services\\LanmanServer", Recommendation: "Enable RequireSecuritySignature via GPO." },
  { Title: "Pre-Windows 2000 Compatible Access group", Risk: "90", Description: "The group contains 'Everyone' or 'Anonymous'.", Technical: "Get-ADGroupMember 'Pre-Windows 2000...'", Recommendation: "Remove Everyone from this group immediately." }
];

// --- Logique de Mapping Automatique ---
const KNOWN_MAPPINGS = {
  "AdminSDHolder": { mitre: "T1098", nist: "PR.AC-06", nist11: "PR.AC-4", cis8: "4.1", cis7: "4.1", stig: "V-220001", iso: "A.9.2.3", pci: "Req 8.1", scope: ["Admin Accounts"] },
  "LAPS": { mitre: "T1003.006", nist: "PR.AA-01", nist11: "PR.AC-1", cis8: "5.2", cis7: "4.2", stig: "V-220002", iso: "A.9.4.3", pci: "Req 2.1", scope: ["Workstations"] },
  "SMB Signing": { mitre: "T1187", nist: "PR.PT-04", nist11: "PR.PT-2", cis8: "4.8", cis7: "9.1", stig: "V-220003", iso: "A.13.1.1", pci: "Req 11.2", scope: ["Tout l'environnement"] },
  "Print Spooler": { mitre: "T1547.012", nist: "PR.PT-03", nist11: "PR.PT-1", cis8: "12.1", cis7: "10.1", stig: "V-220004", iso: "A.12.6.1", pci: "Req 2.1", scope: ["Domain Controllers"] },
  "Zerologon": { mitre: "T1210", nist: "DE.AE-02", nist11: "DE.AE-2", cis8: "7.1", cis7: "6.2", stig: "V-220005", iso: "A.14.2.5", pci: "Req 11.2", scope: ["Domain Controllers"] },
  "KRBTGT": { mitre: "T1558", nist: "PR.AC-01", nist11: "PR.AC-1", cis8: "5.4", cis7: "4.3", stig: "V-220006", iso: "A.9.2.3", pci: "Req 8.2", scope: ["Domain Controllers"] },
  "Pre-Windows 2000": { mitre: "T1558.004", nist: "PR.AC-07", nist11: "PR.AC-6", cis8: "3.3", cis7: "13.3", stig: "V-220007", iso: "A.9.2.1", pci: "Req 7.1", scope: ["Legacy"] },
  "Orphaned GPO": { mitre: "T1484.001", nist: "PR.CM-01", nist11: "PR.IP-1", cis8: "1.1", cis7: "1.2", stig: "V-220008", iso: "A.12.6.1", pci: "Req 2.1", scope: ["Tout l'environnement"] },
  "Weak Password": { mitre: "T1110", nist: "PR.AA-01", nist11: "PR.AC-7", cis8: "5.1", cis7: "16.1", stig: "V-220009", iso: "A.9.4.3", pci: "Req 8.2", scope: ["Tout l'environnement"] }
};

export default function App() {
  // États principaux
  const [rules, setRules] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [filterText, setFilterText] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Onglet actif dans le panneau de détails
  const [activeTab, setActiveTab] = useState('description'); // 'description', 'technical', 'remediation'

  // --- Traitement des données ---
  const processRawData = (data) => {
    const processed = data.map((row, index) => {
      let suggestion = { 
        mitre: "", nist: "", nist11: "", cis8: "", cis7: "", 
        stig: "", iso: "", pci: "", custom: "", 
        scope: ["Tout l'environnement"] 
      };
      const titleUpper = (row.Title || row.Name || "").toUpperCase();
      
      // Auto-mapping basique
      for (const [key, val] of Object.entries(KNOWN_MAPPINGS)) {
        if (titleUpper.includes(key.toUpperCase())) {
          suggestion = { ...suggestion, ...val };
        }
      }

      // Assurer que scope est un tableau
      if (!Array.isArray(suggestion.scope)) {
        suggestion.scope = [suggestion.scope];
      }

      return {
        id: index,
        title: row.Title || row.Name || "Règle Inconnue",
        score: parseInt(row.Risk || row.Score || "0", 10),
        description: row.Description || "Pas de description.",
        technical: row.Technical || row.Explanation || "Pas de détails techniques.",
        remediation: row.Remediation || row.Recommendation || "Pas de plan de remédiation.",
        mitre: suggestion.mitre,
        nist: suggestion.nist,
        nist11: suggestion.nist11,
        cis8: suggestion.cis8,
        cis7: suggestion.cis7,
        stig: suggestion.stig,
        iso: suggestion.iso,
        pci: suggestion.pci,
        custom: suggestion.custom,
        scope: suggestion.scope
      };
    });

    setRules(processed);
    
    if (processed.length > 0) {
      setSelectedId(0);
    } else {
      setSelectedId(null);
    }
  };

  // --- Actions ---
  const handleLoadDemo = () => {
    processRawData(DEMO_DATA);
  };

  const updateRule = (id, field, value) => {
    setRules(prevRules => 
      prevRules.map(rule => 
        rule.id === id ? { ...rule, [field]: value } : rule
      )
    );
  };

  const addScope = (id, newScope) => {
    if (!newScope) return;
    setRules(prevRules => 
      prevRules.map(rule => {
        if (rule.id !== id) return rule;
        const currentScopes = rule.scope || [];
        if (currentScopes.includes(newScope)) return rule;
        return { ...rule, scope: [...currentScopes, newScope] };
      })
    );
  };

  const removeScope = (id, scopeToRemove) => {
    setRules(prevRules => 
      prevRules.map(rule => {
        if (rule.id !== id) return rule;
        return { ...rule, scope: rule.scope.filter(s => s !== scopeToRemove) };
      })
    );
  };

  const handleExport = () => {
    const exportObj = {};
    rules.forEach(r => {
      const hasData = r.mitre || r.nist || r.nist11 || r.cis8 || r.cis7 || r.stig || r.iso || r.pci || r.custom;
      if (hasData) {
        exportObj[r.title] = {
          mitre_techniques: r.mitre ? r.mitre.split(',').map(s => s.trim()).filter(s => s) : [],
          nist_csf_2: r.nist ? r.nist.split(',').map(s => s.trim()).filter(s => s) : [],
          nist_csf_1_1: r.nist11 ? r.nist11.split(',').map(s => s.trim()).filter(s => s) : [],
          cis_v8: r.cis8 ? r.cis8.split(',').map(s => s.trim()).filter(s => s) : [],
          cis_v7: r.cis7 ? r.cis7.split(',').map(s => s.trim()).filter(s => s) : [],
          stig_id: r.stig ? r.stig.split(',').map(s => s.trim()).filter(s => s) : [],
          iso_27001: r.iso ? r.iso.split(',').map(s => s.trim()).filter(s => s) : [],
          pci_dss: r.pci ? r.pci.split(',').map(s => s.trim()).filter(s => s) : [],
          custom_internal: r.custom,
          scope: r.scope,
          risk_score_baseline: r.score
        };
      }
    });

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "PingCastle_Compliance_Full_Dictionary.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // --- CSV Parser Simple ---
  const handleFileUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) return;

      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const result = lines.slice(1).map(line => {
        const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
        const obj = {};
        headers.forEach((h, i) => {
          let val = values[i] || "";
          val = val.replace(/^"|"$/g, '').trim();
          obj[h] = val;
        });
        return obj;
      });
      processRawData(result);
    };
    reader.readAsText(file);
  };

  // --- Gestion du Drag & Drop ---
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // --- Filtrage et Sélection ---
  const filteredRules = useMemo(() => {
    return rules.filter(r => r.title.toLowerCase().includes(filterText.toLowerCase()));
  }, [rules, filterText]);

  const selectedRule = useMemo(() => {
    return rules.find(r => r.id === selectedId);
  }, [rules, selectedId]);

  // --- Composants UI ---
  const getRiskBadgeColor = (score) => {
    if (score >= 80) return "bg-red-100 text-red-800 border-red-200";
    if (score >= 50) return "bg-orange-100 text-orange-800 border-orange-200";
    return "bg-yellow-100 text-yellow-800 border-yellow-200";
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-900 overflow-hidden">
      
      {/* SIDEBAR */}
      <div className="w-80 bg-slate-900 flex flex-col border-r border-slate-800 flex-shrink-0">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950">
          <h2 className="text-white font-bold text-lg flex items-center gap-2 mb-4">
            <Layout className="text-indigo-400" />
            PingCastle <span className="text-indigo-400">Mapper</span>
          </h2>

          {/* Drop Zone */}
          <div 
            className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors mb-4 ${
              dragActive ? "border-indigo-400 bg-slate-800" : "border-slate-700 hover:border-slate-500 hover:bg-slate-800"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              className="hidden" 
              accept=".csv"
              onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0])}
            />
            <UploadCloud className="mx-auto text-slate-400 mb-2" size={24} />
            <p className="text-xs text-slate-400">Glisser CSV ou cliquer</p>
          </div>

          {/* Search */}
          <div className="relative mb-2">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder="Filtrer..." 
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full bg-slate-800 text-slate-200 text-sm rounded pl-9 pr-3 py-2 border border-slate-700 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Demo Button */}
          <button 
            onClick={handleLoadDemo}
            className="w-full flex items-center justify-center gap-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded transition-colors border border-slate-700"
          >
            <Wand2 size={14} /> Charger Données Démo
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {filteredRules.length === 0 ? (
            <div className="p-8 text-center text-slate-600 text-sm">
              <ArrowUp className="mx-auto mb-2 opacity-50" />
              <p>Importez un fichier ou chargez la démo pour commencer.</p>
            </div>
          ) : (
            filteredRules.map(rule => {
              const hasMapping = rule.mitre || rule.nist;
              return (
                <div 
                  key={rule.id}
                  onClick={() => setSelectedId(rule.id)}
                  className={`p-3 border-b border-slate-800 cursor-pointer transition-colors hover:bg-slate-800 ${
                    selectedId === rule.id ? 'bg-indigo-900/30 border-l-4 border-l-indigo-500' : 'border-l-4 border-l-transparent'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-sm font-medium truncate w-10/12 ${selectedId === rule.id ? 'text-white' : 'text-slate-300'}`}>
                      {rule.title}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Risk: {rule.score}</span>
                    {hasMapping ? (
                      <CheckCircle size={14} className="text-emerald-500" />
                    ) : (
                      <Circle size={14} className="text-slate-700" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Export Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800">
          <button 
            onClick={handleExport}
            disabled={rules.length === 0}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <FileJson size={18} /> Exporter JSON
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100">
        {!selectedRule ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <Layout size={64} strokeWidth={1} className="mb-4 text-slate-300" />
            <h2 className="text-2xl font-bold text-slate-700 mb-2">Dictionnaire de Conformité</h2>
            <p className="text-slate-500 max-w-md text-center">Sélectionnez une règle dans le menu de gauche pour commencer le mapping vers les frameworks de sécurité (NIST, CIS, STIG, MITRE, ISO, PCI).</p>
          </div>
        ) : (
          <div className="h-full overflow-y-auto p-8">
            <div className="max-w-6xl mx-auto space-y-6">
              
              {/* Header Card */}
              <div className="flex justify-between items-start">
                <div>
                  <h6 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Règle PingCastle</h6>
                  <h1 className="text-2xl font-bold text-slate-800 mb-1">{selectedRule.title}</h1>
                  <span className="text-xs text-slate-400 font-mono">ID: {selectedRule.id}</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-bold border ${getRiskBadgeColor(selectedRule.score)}`}>
                  Risk: {selectedRule.score}
                </span>
              </div>

              {/* Mapping Editor */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-white p-4 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-bold text-slate-700 flex items-center gap-2">
                    <SlidersHorizontal className="text-indigo-600" size={20} />
                    Configuration GRC
                  </h3>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Info size={12} /> Sauvegarde automatique
                  </span>
                </div>
                
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* MITRE */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-2">MITRE ATT&CK</label>
                    <div className="relative">
                      <Flame className="absolute left-3 top-2.5 text-slate-400" size={18} />
                      <select 
                        value={selectedRule.mitre || ''}
                        onChange={(e) => updateRule(selectedRule.id, 'mitre', e.target.value)}
                        className="w-full pl-10 pr-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all bg-white"
                      >
                        <option value="">Sélectionner une technique...</option>
                        {OPTIONS_MITRE.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* NIST 2.0 */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-2">NIST CSF 2.0</label>
                    <div className="relative">
                      <ShieldAlert className="absolute left-3 top-2.5 text-slate-400" size={18} />
                      <select 
                        value={selectedRule.nist || ''}
                        onChange={(e) => updateRule(selectedRule.id, 'nist', e.target.value)}
                        className="w-full pl-10 pr-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all bg-white"
                      >
                        <option value="">Sélectionner un contrôle...</option>
                        {OPTIONS_NIST_2.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* NIST 1.1 */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-2">NIST CSF 1.1</label>
                    <div className="relative">
                      <ShieldAlert className="absolute left-3 top-2.5 text-slate-400" size={18} />
                      <select 
                        value={selectedRule.nist11 || ''}
                        onChange={(e) => updateRule(selectedRule.id, 'nist11', e.target.value)}
                        className="w-full pl-10 pr-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all bg-white"
                      >
                        <option value="">Sélectionner un contrôle...</option>
                        {OPTIONS_NIST_1_1.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* CIS V8 */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-2">CIS Benchmark V8</label>
                    <div className="relative">
                      <BookOpen className="absolute left-3 top-2.5 text-slate-400" size={18} />
                      <select 
                        value={selectedRule.cis8 || ''}
                        onChange={(e) => updateRule(selectedRule.id, 'cis8', e.target.value)}
                        className="w-full pl-10 pr-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all bg-white"
                      >
                        <option value="">Sélectionner une règle...</option>
                        {OPTIONS_CIS_8.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* CIS V7 */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-2">CIS Benchmark V7</label>
                    <div className="relative">
                      <BookOpen className="absolute left-3 top-2.5 text-slate-400" size={18} />
                      <select 
                        value={selectedRule.cis7 || ''}
                        onChange={(e) => updateRule(selectedRule.id, 'cis7', e.target.value)}
                        className="w-full pl-10 pr-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all bg-white"
                      >
                         <option value="">Sélectionner une règle...</option>
                        {OPTIONS_CIS_7.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* STIG */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-2">DISA STIG ID</label>
                    <div className="relative">
                      <BookOpen className="absolute left-3 top-2.5 text-slate-400" size={18} />
                      <select 
                        value={selectedRule.stig || ''}
                        onChange={(e) => updateRule(selectedRule.id, 'stig', e.target.value)}
                        className="w-full pl-10 pr-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all bg-white"
                      >
                        <option value="">Sélectionner un ID STIG...</option>
                        {OPTIONS_STIG.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* ISO 27001 (Nouveau) */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-2">ISO 27001</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-2.5 text-slate-400" size={18} />
                      <select 
                        value={selectedRule.iso || ''}
                        onChange={(e) => updateRule(selectedRule.id, 'iso', e.target.value)}
                        className="w-full pl-10 pr-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all bg-white"
                      >
                        <option value="">Sélectionner un contrôle...</option>
                        {OPTIONS_ISO27001.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* PCI DSS (Nouveau) */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-2">PCI DSS v4.0</label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-2.5 text-slate-400" size={18} />
                      <select 
                        value={selectedRule.pci || ''}
                        onChange={(e) => updateRule(selectedRule.id, 'pci', e.target.value)}
                        className="w-full pl-10 pr-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all bg-white"
                      >
                        <option value="">Sélectionner une exigence...</option>
                        {OPTIONS_PCIDSS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* SCOPE (Modifié pour Multi-Select) */}
                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="block text-sm font-semibold text-slate-600 mb-2">Portée Applicable (Scope)</label>
                    <div className="p-3 border border-slate-300 rounded-lg bg-slate-50">
                      
                      {/* Liste des tags sélectionnés */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {(!selectedRule.scope || selectedRule.scope.length === 0) && (
                          <span className="text-sm text-slate-400 italic">Aucune portée définie.</span>
                        )}
                        {selectedRule.scope && selectedRule.scope.map((scopeItem, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">
                            {scopeItem}
                            <button 
                              onClick={() => removeScope(selectedRule.id, scopeItem)}
                              className="hover:text-indigo-900 focus:outline-none"
                            >
                              <X size={14} />
                            </button>
                          </span>
                        ))}
                      </div>

                      {/* Sélecteur d'ajout */}
                      <div className="relative max-w-sm">
                        <Crosshair className="absolute left-3 top-2.5 text-slate-400" size={18} />
                        <select 
                          value="" 
                          onChange={(e) => addScope(selectedRule.id, e.target.value)}
                          className="w-full pl-10 pr-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all bg-white text-sm"
                        >
                          <option value="">+ Ajouter une portée...</option>
                          {OPTIONS_SCOPE.map((opt) => (
                            <option 
                              key={opt} 
                              value={opt} 
                              disabled={selectedRule.scope && selectedRule.scope.includes(opt)}
                              className={selectedRule.scope && selectedRule.scope.includes(opt) ? "text-slate-300" : ""}
                            >
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                   {/* Custom */}
                   <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-2">Custom / Interne</label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-2.5 text-slate-400" size={18} />
                      <select 
                        value={selectedRule.custom || ''}
                        onChange={(e) => updateRule(selectedRule.id, 'custom', e.target.value)}
                        className="w-full pl-10 pr-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all bg-white"
                      >
                        <option value="">Sélectionner une ref...</option>
                        {OPTIONS_CUSTOM.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    </div>
                  </div>

                </div>
              </div>

              {/* Detail Tabs */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-96">
                <div className="flex border-b border-slate-100">
                  <button 
                    onClick={() => setActiveTab('description')}
                    className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors border-b-2 ${activeTab === 'description' ? 'border-indigo-500 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
                  >
                    <FileText size={16} /> Description
                  </button>
                  <button 
                    onClick={() => setActiveTab('technical')}
                    className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors border-b-2 ${activeTab === 'technical' ? 'border-indigo-500 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
                  >
                    <Code size={16} /> Technique
                  </button>
                  <button 
                    onClick={() => setActiveTab('remediation')}
                    className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors border-b-2 ${activeTab === 'remediation' ? 'border-indigo-500 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
                  >
                    <Lightbulb size={16} /> Remédiation
                  </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                  {activeTab === 'description' && (
                    <div className="prose prose-slate text-slate-600 leading-relaxed">
                      {selectedRule.description}
                    </div>
                  )}
                  {activeTab === 'technical' && (
                    <div className="bg-slate-900 text-pink-400 p-4 rounded-lg font-mono text-sm border border-slate-800">
                      {selectedRule.technical}
                    </div>
                  )}
                  {activeTab === 'remediation' && (
                    <div className="bg-sky-50 text-sky-900 p-4 rounded-lg border border-sky-100 flex gap-3 items-start">
                      <Info className="mt-1 flex-shrink-0 text-sky-600" size={20} />
                      <div>{selectedRule.remediation}</div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}