import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Layout, 
  Server, 
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
  Globe,       
  CreditCard,  
  X,           
  Network,
  Key,
  Lock,
  RefreshCw,
  Database
} from 'lucide-react';

// --- Configuration ---
// Note: Dans une vraie implémentation, ces appels se feraient via un proxy backend pour éviter les erreurs CORS
// et protéger les clés API. Ici, nous simulons le comportement pour l'interface.

// --- Données de référence (MITRE, NIST, etc.) ---
const OPTIONS_MITRE = [
  { value: "T1003.006", label: "T1003.006 - DCSync (OS Credential Dumping)" },
  { value: "T1558.003", label: "T1558.003 - Kerberoasting" },
  { value: "T1558.004", label: "T1558.004 - AS-REP Roasting" },
  { value: "T1208", label: "T1208 - Kerberoasting (Legacy)" },
  { value: "T1098", label: "T1098 - Account Manipulation" },
  { value: "T1078", label: "T1078 - Valid Accounts" },
  { value: "T1134", label: "T1134 - Access Token Manipulation" },
  { value: "T1484.001", label: "T1484.001 - Group Policy Modification" },
  { value: "T1550.002", label: "T1550.002 - Pass the Hash" },
  { value: "T1550.003", label: "T1550.003 - Pass the Ticket" },
  { value: "T1046", label: "T1046 - Network Service Scanning" },
  { value: "T1069", label: "T1069 - Permission Groups Discovery" },
  { value: "T1087", label: "T1087 - Account Discovery" }
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

const OPTIONS_SCOPE = [
  "Tier 0", "Tier 1", "Tier 2", "Domain Controllers", 
  "Workstations", "Service Accounts", "Azure AD", "Foreign Domains", "GPO"
];

const OPTIONS_CUSTOM = [
  { value: "BH-HIGH", label: "BloodHound - Critique" },
  { value: "BH-MED", label: "BloodHound - Moyen" },
  { value: "PATH-01", label: "Chemin d'Attaque Confirmé" },
  { value: "AD-HYGIENE", label: "Hygiène AD Manquante" },
  { value: "AUDIT-24", label: "AUDIT-24 - Audit Annuel" }
];

// --- Données Mockées pour la simulation API ---
const MOCK_API_RESPONSE = {
  data: [
    { 
      id: "finding-101",
      title: "DCSync Rights on Domain Object", 
      risk_level: "CRITICAL",
      risk_score: 100,
      description: "Principals with DCSync rights can replicate secrets from the Domain Controller, effectively granting them full control over the domain.", 
      explanation: "Edge: DCSync. This edge indicates that the source principal has 'DS-Replication-Get-Changes' and 'DS-Replication-Get-Changes-All' extended rights.", 
      resolution: "Remove the DCSync permissions from the account unless absolutely necessary (e.g., another DC or Azure AD Connect).",
      affected_assets: 2
    },
    { 
      id: "finding-102",
      title: "Kerberoastable Users with High Privileges", 
      risk_level: "HIGH",
      risk_score: 90, 
      description: "Users with an SPN set that are also members of high-value groups (Domain Admins, etc.). An attacker can request a TGS and crack it offline.", 
      explanation: "Node Property: hasspn=true. Filter for path to Domain Admins != null.", 
      resolution: "Remove the SPN if not needed, use a strong/complex password (25+ chars), or use a gMSA.",
      affected_assets: 5
    },
    { 
      id: "finding-103",
      title: "AS-REP Roastable Users (DontRequirePreAuth)", 
      risk_level: "HIGH",
      risk_score: 75, 
      description: "Users with 'Do not require Kerberos preauthentication' enabled. Attackers can request a TGT without a password.", 
      explanation: "UserAccountControl flag: DONT_REQ_PREAUTH set.", 
      resolution: "Enable Kerberos Pre-Authentication for these accounts via AD Users & Computers or PowerShell.",
      affected_assets: 12
    },
    { 
      id: "finding-104",
      title: "Unconstrained Delegation on non-DC", 
      risk_level: "CRITICAL",
      risk_score: 85, 
      description: "Computers with Unconstrained Delegation allow an attacker to harvest TGTs of any user connecting to them.", 
      explanation: "Attribute: userAccountControl includes TRUSTED_FOR_DELEGATION. Monitor for non-DC computers.", 
      resolution: "Configure Resource-Based Constrained Delegation (RBCD) or Standard Constrained Delegation instead.",
      affected_assets: 1
    },
    { 
      id: "finding-201",
      title: "Shortest Path to Domain Admins", 
      risk_level: "MEDIUM",
      risk_score: 60, 
      description: "Analysis of the shortest graph path from a compromised user to the Domain Admins group.", 
      explanation: "Graph Query: MATCH p=shortestPath((u:User)-[*1..]->(g:Group {name:'DOMAIN ADMINS@...'})) RETURN p", 
      resolution: "Break the attack path by removing unnecessary group memberships or local admin rights (Tiered Administration).",
      affected_assets: 156
    }
  ]
};

// --- Logique de Mapping Automatique ---
const KNOWN_MAPPINGS = {
  "DCSync": { mitre: "T1003.006", nist: "PR.AC-06", scope: ["Tier 0"] },
  "Kerberoast": { mitre: "T1558.003", nist: "PR.AA-01", scope: ["Service Accounts"] },
  "AS-REP": { mitre: "T1558.004", nist: "PR.AA-01", scope: ["Workstations", "Service Accounts"] },
  "Delegation": { mitre: "T1558", nist: "PR.AC-06", scope: ["Tier 1", "Tier 2"] },
  "Shortest Path": { mitre: "T1078", nist: "DE.AE-02", scope: ["Tier 0", "Tier 1"] },
  "Admin": { mitre: "T1098", nist: "PR.AC-06", scope: ["Tier 0"] },
  "GPO": { mitre: "T1484.001", nist: "PR.CM-01", scope: ["GPO"] },
};

export default function App() {
  // États principaux
  const [rules, setRules] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [filterText, setFilterText] = useState('');
  
  // États API
  const [apiUrl, setApiUrl] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [tokenKey, setTokenKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Onglet actif
  const [activeTab, setActiveTab] = useState('description');

  // --- Fonction de fetch API ---
  const fetchFindings = async () => {
    setIsLoading(true);
    setApiError(null);

    try {
      // Simulation d'un délai réseau
      await new Promise(resolve => setTimeout(resolve, 1500));

      // LOGIQUE RÉELLE (Commentée pour la démo)
      /*
      // 1. Login pour obtenir le token JWT
      const loginResp = await fetch(`${apiUrl}/api/v2/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login_method: 'secret', username: tokenId, secret: tokenKey })
      });
      const loginData = await loginResp.json();
      const jwt = loginData.token;

      // 2. Récupérer les findings
      const findingsResp = await fetch(`${apiUrl}/api/v2/findings?limit=100`, {
        headers: { 'Authorization': `Bearer ${jwt}` }
      });
      const data = await findingsResp.json();
      */

      // POUR LA DÉMO : On utilise les données mockées si aucune URL valide n'est fournie
      // ou si on est dans l'environnement de preview.
      const data = MOCK_API_RESPONSE;

      if (!data || !data.data) {
        throw new Error("Format de réponse API invalide");
      }

      processApiData(data.data);
      setIsConnected(true);

    } catch (err) {
      console.error(err);
      setApiError("Impossible de connecter à l'API BloodHound. Vérifiez l'URL et les identifiants (Mode Démo activé si champs vides).");
      // Fallback pour ne pas bloquer l'utilisateur dans la démo
      if (!apiUrl) {
         processApiData(MOCK_API_RESPONSE.data);
         setIsConnected(true);
         setApiError(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // --- Traitement des données JSON API ---
  const processApiData = (apiFindings) => {
    const processed = apiFindings.map((finding, index) => {
      let suggestion = { 
        mitre: "", nist: "", scope: ["Tier 2"] 
      };
      const titleUpper = (finding.title || finding.name || "").toUpperCase();
      
      // Auto-mapping
      for (const [key, val] of Object.entries(KNOWN_MAPPINGS)) {
        if (titleUpper.includes(key.toUpperCase())) {
          suggestion = { ...suggestion, ...val };
        }
      }

      // Gestion du Score
      let scoreInt = 0;
      if (typeof finding.risk_score === 'number') {
        scoreInt = finding.risk_score;
      } else {
        const lvl = (finding.risk_level || "").toUpperCase();
        if (lvl === 'CRITICAL') scoreInt = 100;
        else if (lvl === 'HIGH') scoreInt = 80;
        else if (lvl === 'MEDIUM') scoreInt = 50;
        else if (lvl === 'LOW') scoreInt = 20;
      }

      return {
        id: finding.id || `finding-${index}`,
        title: finding.title || "Finding Inconnu",
        score: scoreInt,
        description: finding.description || "Pas de description.",
        technical: finding.explanation || "Pas de détails techniques.",
        remediation: finding.resolution || "Pas de plan de remédiation.",
        affected_count: finding.affected_assets || 0,
        
        // Champs modifiables
        mitre: suggestion.mitre,
        nist: suggestion.nist,
        custom: "",
        scope: suggestion.scope
      };
    });

    setRules(processed);
    if (processed.length > 0) setSelectedId(processed[0].id);
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
      exportObj[r.title] = {
        bh_finding_id: r.id,
        mitre_techniques: r.mitre ? [r.mitre] : [],
        nist_csf: r.nist ? [r.nist] : [],
        custom_internal: r.custom,
        scope: r.scope,
        risk_score: r.score
      };
    });

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "BloodHound_Compliance_Map.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // --- Composants UI ---
  const getRiskBadgeColor = (score) => {
    if (score >= 80) return "bg-red-100 text-red-800 border-red-200";
    if (score >= 50) return "bg-orange-100 text-orange-800 border-orange-200";
    return "bg-yellow-100 text-yellow-800 border-yellow-200";
  };

  const filteredRules = useMemo(() => {
    return rules.filter(r => r.title.toLowerCase().includes(filterText.toLowerCase()));
  }, [rules, filterText]);

  const selectedRule = useMemo(() => {
    return rules.find(r => r.id === selectedId);
  }, [rules, selectedId]);

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-900 overflow-hidden">
      
      {/* SIDEBAR */}
      <div className="w-80 bg-slate-900 flex flex-col border-r border-slate-800 flex-shrink-0">
        
        {/* API CONFIGURATION */}
        <div className="p-5 border-b border-slate-800 bg-slate-950">
          <h2 className="text-white font-bold text-lg flex items-center gap-2 mb-4">
            <Network className="text-emerald-400" />
            BH API <span className="text-emerald-400">Connector</span>
          </h2>

          {!isConnected ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                  <Globe size={10} /> URL de l'instance
                </label>
                <input 
                  type="text" 
                  placeholder="https://bloodhound.corp.local" 
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  className="w-full bg-slate-800 text-slate-200 text-xs rounded px-3 py-2 border border-slate-700 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                    <Key size={10} /> Token ID
                  </label>
                  <input 
                    type="text" 
                    placeholder="ID..." 
                    value={tokenId}
                    onChange={(e) => setTokenId(e.target.value)}
                    className="w-full bg-slate-800 text-slate-200 text-xs rounded px-3 py-2 border border-slate-700 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                    <Lock size={10} /> Token Key
                  </label>
                  <input 
                    type="password" 
                    placeholder="Key..." 
                    value={tokenKey}
                    onChange={(e) => setTokenKey(e.target.value)}
                    className="w-full bg-slate-800 text-slate-200 text-xs rounded px-3 py-2 border border-slate-700 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button 
                onClick={fetchFindings}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded transition-colors shadow-lg shadow-emerald-900/20"
              >
                {isLoading ? <RefreshCw size={14} className="animate-spin" /> : <Database size={14} />}
                {isLoading ? 'Connexion...' : 'Récupérer Findings'}
              </button>
              
              <p className="text-[10px] text-slate-500 text-center italic mt-1">
                Laisser vide pour utiliser les données Démo.
              </p>
            </div>
          ) : (
            <div className="bg-emerald-900/20 border border-emerald-900 rounded p-3 text-center">
              <p className="text-emerald-400 text-xs font-bold flex items-center justify-center gap-2 mb-2">
                <CheckCircle size={14} /> Connecté à l'API
              </p>
              <button 
                onClick={() => setIsConnected(false)}
                className="text-[10px] text-slate-400 underline hover:text-slate-200"
              >
                Changer de configuration
              </button>
            </div>
          )}

          {apiError && (
            <div className="mt-3 p-2 bg-red-900/30 border border-red-800 rounded text-[10px] text-red-300">
              {apiError}
            </div>
          )}
        </div>

        {/* LIST SEARCH */}
        <div className="p-3 bg-slate-900 border-b border-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={14} />
            <input 
              type="text" 
              placeholder="Rechercher un finding..." 
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full bg-slate-800 text-slate-200 text-xs rounded pl-9 pr-3 py-2 border border-slate-700 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* LIST FINDINGS */}
        <div className="flex-1 overflow-y-auto">
          {filteredRules.length === 0 ? (
            <div className="p-8 text-center text-slate-600 text-sm flex flex-col items-center">
              <Server className="mb-2 opacity-30" size={32} />
              <p>En attente des données...</p>
            </div>
          ) : (
            filteredRules.map(rule => {
              const hasMapping = rule.mitre || rule.nist;
              return (
                <div 
                  key={rule.id}
                  onClick={() => setSelectedId(rule.id)}
                  className={`p-3 border-b border-slate-800 cursor-pointer transition-colors hover:bg-slate-800 group ${
                    selectedId === rule.id ? 'bg-emerald-900/20 border-l-4 border-l-emerald-500' : 'border-l-4 border-l-transparent'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-xs font-medium truncate w-10/12 ${selectedId === rule.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                      {rule.title}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-600">Assets: {rule.affected_count}</span>
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded ${getRiskBadgeColor(rule.score)}`}>{rule.score}</span>
                      {hasMapping && <CheckCircle size={10} className="text-emerald-500" />}
                    </div>
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
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded font-semibold flex items-center justify-center gap-2 transition-colors text-xs"
          >
            <FileJson size={14} /> Exporter le Mapping
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100">
        {!selectedRule ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <ShieldAlert size={64} strokeWidth={1} className="mb-4 text-slate-300" />
            <h2 className="text-xl font-bold text-slate-700 mb-2">Aucun Finding Sélectionné</h2>
            <p className="text-slate-500 text-sm max-w-xs text-center">
              Connectez-vous à l'API BloodHound ou utilisez le mode démo pour charger les vulnérabilités.
            </p>
          </div>
        ) : (
          <div className="h-full overflow-y-auto p-8">
            <div className="max-w-5xl mx-auto space-y-6">
              
              {/* Header Card */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-slate-100 text-slate-500 text-[10px] font-mono px-2 py-1 rounded border border-slate-200">
                      ID: {selectedRule.id}
                    </span>
                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                      <Globe size={12} /> BloodHound Enterprise
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold text-slate-800 mb-2">{selectedRule.title}</h1>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                     <span className="flex items-center gap-1"><Server size={14}/> {selectedRule.affected_count} Assets affectés</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-4 py-2 rounded-lg text-lg font-bold border flex items-center gap-2 ${getRiskBadgeColor(selectedRule.score)}`}>
                    <AlertTriangle size={20} />
                    {selectedRule.score} / 100
                  </span>
                  <span className="text-xs text-slate-400">Score d'exposition</span>
                </div>
              </div>

              {/* Mapping Editor */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex justify-between items-center">
                  <h3 className="font-bold text-slate-700 flex items-center gap-2 text-sm">
                    <SlidersHorizontal className="text-emerald-600" size={16} />
                    Classification GRC & Conformité
                  </h3>
                </div>
                
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* MITRE */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">MITRE ATT&CK</label>
                    <div className="relative">
                      <Flame className="absolute left-3 top-2.5 text-slate-400" size={16} />
                      <select 
                        value={selectedRule.mitre || ''}
                        onChange={(e) => updateRule(selectedRule.id, 'mitre', e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded border border-slate-200 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none bg-slate-50"
                      >
                        <option value="">Non mappé</option>
                        {OPTIONS_MITRE.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* NIST */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">NIST CSF 2.0</label>
                    <div className="relative">
                      <ShieldAlert className="absolute left-3 top-2.5 text-slate-400" size={16} />
                      <select 
                        value={selectedRule.nist || ''}
                        onChange={(e) => updateRule(selectedRule.id, 'nist', e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded border border-slate-200 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none bg-slate-50"
                      >
                        <option value="">Non mappé</option>
                        {OPTIONS_NIST_2.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* SCOPE (Multi-Select) */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Scope / Tiering Active Directory</label>
                    <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                      <div className="flex flex-wrap gap-2 mb-3">
                        {(!selectedRule.scope || selectedRule.scope.length === 0) && (
                          <span className="text-xs text-slate-400 italic">Aucun scope défini.</span>
                        )}
                        {selectedRule.scope && selectedRule.scope.map((scopeItem, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-white text-slate-700 border border-slate-200 shadow-sm">
                            {scopeItem}
                            <button 
                              onClick={() => removeScope(selectedRule.id, scopeItem)}
                              className="text-slate-400 hover:text-red-500 focus:outline-none ml-1"
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>

                      <div className="flex gap-2">
                         <div className="relative flex-1">
                          <Crosshair className="absolute left-3 top-2.5 text-slate-400" size={16} />
                          <select 
                            value="" 
                            onChange={(e) => addScope(selectedRule.id, e.target.value)}
                            className="w-full pl-9 pr-3 py-2 rounded border border-slate-200 text-sm focus:border-emerald-500 outline-none bg-white"
                          >
                            <option value="">+ Ajouter un tag...</option>
                            {OPTIONS_SCOPE.map((opt) => (
                              <option 
                                key={opt} 
                                value={opt} 
                                disabled={selectedRule.scope && selectedRule.scope.includes(opt)}
                              >
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="relative flex-1">
                          <Briefcase className="absolute left-3 top-2.5 text-slate-400" size={16} />
                          <select 
                            value={selectedRule.custom || ''}
                            onChange={(e) => updateRule(selectedRule.id, 'custom', e.target.value)}
                            className="w-full pl-9 pr-3 py-2 rounded border border-slate-200 text-sm focus:border-emerald-500 outline-none bg-white"
                          >
                            <option value="">Status Interne...</option>
                            {OPTIONS_CUSTOM.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detail Tabs */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[300px]">
                <div className="flex border-b border-slate-200">
                  <button 
                    onClick={() => setActiveTab('description')}
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-colors border-b-2 ${activeTab === 'description' ? 'border-emerald-500 text-emerald-700 bg-emerald-50' : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                  >
                    <FileText size={14} /> Description
                  </button>
                  <button 
                    onClick={() => setActiveTab('technical')}
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-colors border-b-2 ${activeTab === 'technical' ? 'border-emerald-500 text-emerald-700 bg-emerald-50' : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                  >
                    <Code size={14} /> Cypher & Tech
                  </button>
                  <button 
                    onClick={() => setActiveTab('remediation')}
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-colors border-b-2 ${activeTab === 'remediation' ? 'border-emerald-500 text-emerald-700 bg-emerald-50' : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                  >
                    <Lightbulb size={14} /> Remédiation
                  </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
                  {activeTab === 'description' && (
                    <div className="prose prose-sm prose-slate max-w-none">
                      <p className="text-slate-700 leading-relaxed">{selectedRule.description}</p>
                    </div>
                  )}
                  {activeTab === 'technical' && (
                    <div className="space-y-4">
                      <div className="bg-slate-900 text-slate-300 p-4 rounded-lg font-mono text-xs border border-slate-800 shadow-inner">
                        <div className="flex items-center gap-2 mb-2 text-emerald-500 border-b border-slate-800 pb-2">
                          <Code size={12} /> Logique de détection
                        </div>
                        {selectedRule.technical}
                      </div>
                    </div>
                  )}
                  {activeTab === 'remediation' && (
                    <div className="bg-sky-50 text-sky-900 p-5 rounded-lg border border-sky-100 flex gap-4 items-start shadow-sm">
                      <Info className="mt-0.5 flex-shrink-0 text-sky-600" size={24} />
                      <div>
                        <h4 className="font-bold text-sky-800 mb-1 text-sm">Action recommandée</h4>
                        <p className="text-sm leading-relaxed">{selectedRule.remediation}</p>
                      </div>
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
