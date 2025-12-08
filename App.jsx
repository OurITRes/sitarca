import React, { useState, useEffect } from 'react';
import {
 Shield,
 Activity,
 AlertTriangle,
 CheckCircle,
 FileText,
 Settings,
 Brain,
 Network,
 BarChart2,
 RefreshCw,
 ChevronRight,
 Zap,
 Lock,
 Server,
 User,
 ArrowRight,
 Play,
 Clock,
 Target,
 Database,
 Save,
 Folder,
 Ticket,
 CheckSquare,
 ClipboardList,
 Users,
 Layout,
 List,
 Link as LinkIcon,
 TrendingUp
} from 'lucide-react';
import {
 AreaChart,
 Area,
 XAxis,
 YAxis,
 CartesianGrid,
 Tooltip,
 ResponsiveContainer,
 RadarChart,
 PolarGrid,
 PolarAngleAxis,
 PolarRadiusAxis, // Added missing import
 Radar,
 Line,
 Legend,
 ScatterChart,
 Scatter,
 ZAxis
} from 'recharts';

// --- DONNÉES DE DÉMO & CONSTANTES ---

const MOCK_TREND_DATA = [
 { month: 'Jan', score: 45, risks: 120 },
 { month: 'Fev', score: 48, risks: 115 },
 { month: 'Mar', score: 55, risks: 90 },
 { month: 'Avr', score: 62, risks: 85 },
 { month: 'Mai', score: 60, risks: 88 },
 { month: 'Juin', score: 68, risks: 72 },
];

const DETAILED_FINDINGS = [
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

const AI_WEIGHTS = [
 { feature: 'Exploitability (BloodHound)', weight: 0.45, change: '+5%' },
 { feature: 'Asset Criticality (Tier 0)', weight: 0.30, change: '+2%' },
 { feature: 'CVSS Score', weight: 0.15, change: '-4%' },
 { feature: 'Control Presence', weight: 0.10, change: '-3%' },
];

const INITIAL_REMEDIATION_PLAN = [
   { id: 1, task: "Réinitialiser le mot de passe KRBTGT (x2)", status: "To Do", owner: "SysAdmin Team", priority: "Critical", complexity: 10, criticality: 90, dependency: null },
   { id: 2, task: "Restreindre les permissions 'Service Accounts'", status: "In Progress", owner: "IAM Team", priority: "High", complexity: 40, criticality: 70, dependency: null },
   { id: 3, task: "Corriger les ACLs 'Domain Controllers'", status: "Done", owner: "SecOps", priority: "Medium", complexity: 60, criticality: 60, dependency: 2 }, // Depend de #2
   { id: 4, task: "Désactiver Spooler sur les DC", status: "To Do", owner: "SysAdmin Team", priority: "Low", complexity: 20, criticality: 30, dependency: null },
];

// --- COMPOSANTS UI ---

const Card = ({ children, className = "", onClick }) => (
 <div onClick={onClick} className={`bg-white rounded-xl shadow-sm border border-slate-200 p-5 ${className}`}>
   {children}
 </div>
);

const Badge = ({ type, text }) => {
 const colors = {
   Critical: 'bg-rose-100 text-rose-800 border-rose-200',
   High: 'bg-orange-100 text-orange-800 border-orange-200',
   Medium: 'bg-amber-100 text-amber-800 border-amber-200',
   Low: 'bg-emerald-100 text-emerald-800 border-emerald-200',
   SourcePC: 'bg-blue-50 text-blue-700 border-blue-200',
   SourceBH: 'bg-purple-50 text-purple-700 border-purple-200',
   Validated: 'bg-green-100 text-green-800 border-green-200',
   Done: 'bg-green-100 text-green-800 border-green-200',
   "In Progress": 'bg-blue-100 text-blue-800 border-blue-200',
   "To Do": 'bg-slate-100 text-slate-600 border-slate-200',
   Pending: 'bg-slate-100 text-slate-600 border-slate-200'
 };
 return (
   <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colors[type] || colors.Medium}`}>
     {text}
   </span>
 );
};

const AttackPathVisualizer = () => (
 <div className="relative w-full h-64 bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center border border-slate-700 shadow-inner">
   <div className="absolute top-4 left-4 text-xs text-slate-400 font-mono">
      {`> GRAPH_QUERY: MATCH p=(u:User)-[r:MemberOf*1..]->(g:Group {name:'DOMAIN ADMINS'}) RETURN p`}
   </div>
  
   <svg className="w-full h-full" viewBox="0 0 600 200">
     <line x1="100" y1="100" x2="250" y2="100" stroke="#64748b" strokeWidth="2" strokeDasharray="4"/>
     <line x1="250" y1="100" x2="400" y2="100" stroke="#ef4444" strokeWidth="3" />
     <line x1="400" y1="100" x2="500" y2="100" stroke="#ef4444" strokeWidth="3" />
    
     <g className="cursor-pointer hover:opacity-80 transition-opacity">
       <circle cx="100" cy="100" r="25" fill="#3b82f6" />
       <User x="88" y="88" className="text-white w-6 h-6" />
       <text x="100" y="140" textAnchor="middle" fill="#94a3b8" fontSize="12">Compromised User</text>
     </g>

     <g className="cursor-pointer hover:opacity-80 transition-opacity">
       <rect x="225" y="75" width="50" height="50" rx="4" fill="#6366f1" />
       <UsersGroupIcon x="238" y="88" className="text-white w-6 h-6" />
       <text x="250" y="140" textAnchor="middle" fill="#94a3b8" fontSize="12">Helpdesk Group</text>
       <text x="175" y="95" fill="#64748b" fontSize="10">MemberOf</text>
     </g>

     <g className="cursor-pointer hover:opacity-80 transition-opacity">
       <rect x="375" y="75" width="50" height="50" rx="4" fill="#f59e0b" />
       <Server x="388" y="88" className="text-white w-6 h-6" />
       <text x="400" y="140" textAnchor="middle" fill="#94a3b8" fontSize="12">Admin Server</text>
       <text x="325" y="95" fill="#ef4444" fontSize="10" fontWeight="bold">AdminTo</text>
     </g>

     <g className="cursor-pointer hover:opacity-80 transition-opacity animate-pulse">
       <circle cx="500" cy="100" r="30" fill="#ef4444" stroke="#7f1d1d" strokeWidth="4" />
       <Target x="488" y="88" className="text-white w-6 h-6" />
       <text x="500" y="150" textAnchor="middle" fill="#f87171" fontSize="12" fontWeight="bold">DOMAIN ADMINS</text>
       <text x="450" y="95" fill="#ef4444" fontSize="10" fontWeight="bold">MemberOf</text>
     </g>
   </svg>
 </div>
);

const UsersGroupIcon = (props) => (
 <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);


// --- APPLICATION PRINCIPALE ---

export default function AdSecurityOpsCenter() {
 const [activeView, setActiveView] = useState('dashboard');
 const [adaptiveMode, setAdaptiveMode] = useState(false);
 const [complianceScore, setComplianceScore] = useState(68);
 const [selectedRisk, setSelectedRisk] = useState(null);
 const [remediationValidated, setRemediationValidated] = useState(false);
  // State pour le plan de remédiation
 const [remediationPlan, setRemediationPlan] = useState(INITIAL_REMEDIATION_PLAN);
 const [remediationViewMode, setRemediationViewMode] = useState('list'); // 'list' or 'matrix'

 // Configuration
 const [config, setConfig] = useState({
   bhUrl: 'https://bloodhound.corp.internal',
   bhToken: '********************',
   pcReportPath: 'C:\\Reports\\PingCastle\\',
   pcCatalogPath: 'C:\\PingCastle\\Rules\\Catalog.xml',
   nistEnabled: true,
   cisEnabled: true,
   customEnabled: true,
   jiraUrl: 'https://jira.company.com',
   jiraUser: 'svc_cyberwatch',
   jiraToken: '********************',
   jiraProject: 'SEC',
   snUrl: 'https://company.service-now.com',
   snUser: 'mid_server_user',
   snToken: '********************',
   autoApprovalThreshold: 'Low',
   defaultAssignee: 'SOC_L1',
   requireCabApproval: true
 });
  const [isSimulating, setIsSimulating] = useState(false);
 const [isSaving, setIsSaving] = useState(false);

 useEffect(() => {
   if (adaptiveMode) {
     const interval = setInterval(() => {
       setComplianceScore(prev => prev < 82 ? prev + 0.1 : 82);
     }, 100);
     return () => clearInterval(interval);
   } else {
     setComplianceScore(68);
   }
 }, [adaptiveMode]);

 const runSimulation = () => {
   setIsSimulating(true);
   setTimeout(() => {
     setAdaptiveMode(true);
     setIsSimulating(false);
   }, 1500);
 };

 const handleSaveConfig = (e) => {
   e.preventDefault();
   setIsSaving(true);
   setTimeout(() => setIsSaving(false), 1000);
 };

 // Mise à jour des champs JIRA dans le tableau
 const updateRemediationItem = (id, field, value) => {
   setRemediationPlan(prev => prev.map(item =>
     item.id === id ? { ...item, [field]: value } : item
   ));
 };

 // --- VUES ---

 const DashboardView = () => (
   <div className="space-y-6 animate-in fade-in duration-500">
     <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
       <Card className="flex flex-col justify-between border-l-4 border-l-blue-500">
         <div className="flex justify-between items-start">
           <div>
             <p className="text-slate-500 text-sm font-medium">Score de Sécurité AD</p>
             <h3 className="text-3xl font-bold text-slate-800 mt-2">{Math.floor(complianceScore)}/100</h3>
           </div>
           <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
             <Shield size={24} />
           </div>
         </div>
         <div className="mt-4 flex items-center text-sm">
           <span className="text-green-600 font-medium flex items-center">
             <ArrowRight className="rotate-[-45deg]" size={14} /> +12%
           </span>
           <span className="text-slate-400 ml-2">depuis le mois dernier</span>
         </div>
       </Card>

       <Card className="flex flex-col justify-between border-l-4 border-l-red-500">
         <div className="flex justify-between items-start">
           <div>
             <p className="text-slate-500 text-sm font-medium">Chemins Critiques (Tier 0)</p>
             <h3 className="text-3xl font-bold text-slate-800 mt-2">3</h3>
           </div>
           <div className="p-2 bg-red-50 rounded-lg text-red-600">
             <Network size={24} />
           </div>
         </div>
         <div className="mt-4 text-sm text-slate-500">
           Identifiés par BloodHound
         </div>
       </Card>

       <Card className="flex flex-col justify-between border-l-4 border-l-purple-500">
         <div className="flex justify-between items-start">
           <div>
             <p className="text-slate-500 text-sm font-medium">Contrôles NIST 2.0 Actifs</p>
             <h3 className="text-3xl font-bold text-slate-800 mt-2">64%</h3>
           </div>
           <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
             <FileText size={24} />
           </div>
         </div>
         <div className="mt-4 w-full bg-slate-100 rounded-full h-2">
           <div className="bg-purple-500 h-2 rounded-full" style={{width: '64%'}}></div>
         </div>
       </Card>

       <Card className="flex flex-col justify-between border-l-4 border-l-emerald-500 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveView('remediation')}>
         <div className="flex justify-between items-start">
           <div>
             <p className="text-slate-500 text-sm font-medium">Plan d'Action</p>
             <h3 className="text-3xl font-bold text-slate-800 mt-2">12</h3>
           </div>
           <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
             <CheckCircle size={24} />
           </div>
         </div>
         <div className="mt-4 text-sm text-emerald-700 font-medium">
            {remediationValidated ? 'Plan Validé - En cours' : 'En attente de validation'}
         </div>
       </Card>
     </div>

     <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
       <div className="lg:col-span-2 space-y-6">
         <Card className="h-96">
           <div className="flex justify-between items-center mb-6">
             <h3 className="font-bold text-slate-700 flex items-center">
               <Activity className="mr-2 text-blue-500" size={20}/>
               Évolution de la Posture & Risques
             </h3>
             <select className="text-sm border-slate-200 rounded-md shadow-sm">
               <option>6 derniers mois</option>
               <option>Cette année</option>
             </select>
           </div>
           <ResponsiveContainer width="100%" height="100%">
             <AreaChart data={MOCK_TREND_DATA} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
               <defs>
                 <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                   <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                   <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                 </linearGradient>
               </defs>
               <XAxis dataKey="month" />
               <YAxis />
               <CartesianGrid strokeDasharray="3 3" vertical={false} />
               <Tooltip />
               <Area type="monotone" dataKey="score" stroke="#3b82f6" fillOpacity={1} fill="url(#colorScore)" name="Score de Conformité" />
               <Line type="monotone" dataKey="risks" stroke="#ef4444" strokeWidth={2} name="Risques Détectés" />
             </AreaChart>
           </ResponsiveContainer>
         </Card>

         <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
           <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
             <h3 className="font-bold text-slate-700">Top Failles Identifiées</h3>
             <button className="text-sm text-blue-600 hover:underline">Voir tout</button>
           </div>
           <table className="w-full text-sm text-left">
             <thead className="text-xs text-slate-500 uppercase bg-slate-50">
               <tr>
                 <th className="px-6 py-3">Source</th>
                 <th className="px-6 py-3">Faille</th>
                 <th className="px-6 py-3">Asset</th>
                 <th className="px-6 py-3">Priorité IA</th>
                 <th className="px-6 py-3">Action</th>
               </tr>
             </thead>
             <tbody>
               {DETAILED_FINDINGS.map((item) => (
                 <tr key={item.id} className="bg-white border-b hover:bg-slate-50 transition-colors">
                   <td className="px-6 py-4">
                     <Badge type={item.source === 'PingCastle' ? 'SourcePC' : 'SourceBH'} text={item.source} />
                   </td>
                   <td className="px-6 py-4 font-medium text-slate-900">{item.title}</td>
                   <td className="px-6 py-4 text-slate-500">{item.asset}</td>
                   <td className="px-6 py-4">
                     <Badge type={item.risk} text={item.risk} />
                   </td>
                   <td className="px-6 py-4">
                     <button
                       onClick={() => { setSelectedRisk(item); setActiveView('details'); }}
                       className="text-blue-600 hover:text-blue-900 font-medium"
                     >
                       Analyser
                     </button>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
       </div>

       <div className="space-y-6">
         <Card className="h-80">
           <h3 className="font-bold text-slate-700 mb-2">Couverture NIST CSF 2.0</h3>
           <ResponsiveContainer width="100%" height="100%">
             <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
               { category: 'Identify', score: 85, max: 100 },
               { category: 'Protect', score: 45, max: 100 },
               { category: 'Detect', score: 60, max: 100 },
               { category: 'Respond', score: 70, max: 100 },
               { category: 'Recover', score: 90, max: 100 },
             ]}>
               <PolarGrid />
               <PolarAngleAxis dataKey="category" tick={{ fill: '#64748b', fontSize: 11 }} />
               <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false}/>
               <Radar name="Actuel" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
               <Legend />
             </RadarChart>
           </ResponsiveContainer>
         </Card>

         <Card className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white border-none relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10">
             <Brain size={100} />
           </div>
           <div className="relative z-10">
             <div className="flex items-center space-x-2 mb-4">
               <Zap className="text-yellow-400" size={20} />
               <h3 className="font-bold">IA Insight</h3>
             </div>
             <p className="text-sm text-indigo-100 mb-4 leading-relaxed">
               L'analyse des derniers chemins BloodHound montre que le correctif du groupe <strong>"Service Accounts"</strong> réduirait votre exposition globale de <strong>18%</strong>.
             </p>
             <button
               onClick={() => setActiveView('ml')}
               className="w-full py-2 bg-indigo-500 hover:bg-indigo-600 rounded text-sm font-semibold transition-colors"
             >
               Voir l'analyse prédictive
             </button>
           </div>
         </Card>
       </div>
     </div>
   </div>
 );

 const SettingsView = () => (
   <div className="animate-in fade-in duration-300 space-y-8">
     <div className="flex items-center justify-between">
       <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center">
            <Settings className="mr-2 text-indigo-600" size={28} />
            Paramètres & Connecteurs
          </h2>
          <p className="text-slate-500 mt-1">Gérez les connexions aux sources de données et systèmes de billetterie.</p>
       </div>
       <button
         onClick={handleSaveConfig}
         className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
       >
         {isSaving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
         <span>{isSaving ? 'Enregistrement...' : 'Sauvegarder'}</span>
       </button>
     </div>

     <div className="grid grid-cols-1 gap-8">
      
       {/* Section Ticketing */}
       <Card className="border-t-4 border-t-emerald-500">
         <div className="flex items-center space-x-3 mb-6">
           <div className="p-2 bg-emerald-100 rounded-lg">
             <Ticket className="text-emerald-600" size={24} />
           </div>
           <div>
             <h3 className="text-lg font-bold text-slate-800">Systèmes de Billetterie & Remédiation</h3>
             <p className="text-sm text-slate-500">Connexion aux outils ITSM pour la création automatique de tickets.</p>
           </div>
         </div>
        
         <div className="space-y-6">
           {/* JIRA */}
           <div className="p-4 bg-slate-50 rounded border border-slate-200">
              <h4 className="font-semibold text-slate-800 mb-3 flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span> JIRA Software
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-1">
                   <label className="text-xs font-semibold text-slate-500 uppercase">Instance URL</label>
                   <input type="text" value={config.jiraUrl} onChange={(e) => setConfig({...config, jiraUrl: e.target.value})} className="w-full p-2 border border-slate-300 rounded text-sm" />
                 </div>
                  <div className="space-y-1">
                   <label className="text-xs font-semibold text-slate-500 uppercase">Projet Key (ex: SEC, IT)</label>
                   <input type="text" value={config.jiraProject} onChange={(e) => setConfig({...config, jiraProject: e.target.value})} className="w-full p-2 border border-slate-300 rounded text-sm" />
                 </div>
                 <div className="space-y-1">
                   <label className="text-xs font-semibold text-slate-500 uppercase">Service User</label>
                   <input type="text" value={config.jiraUser} onChange={(e) => setConfig({...config, jiraUser: e.target.value})} className="w-full p-2 border border-slate-300 rounded text-sm" />
                 </div>
                  <div className="space-y-1">
                   <label className="text-xs font-semibold text-slate-500 uppercase">API Token</label>
                   <input type="password" value={config.jiraToken} onChange={(e) => setConfig({...config, jiraToken: e.target.value})} className="w-full p-2 border border-slate-300 rounded text-sm font-mono" />
                 </div>
              </div>
           </div>


           {/* ServiceNow */}
           <div className="p-4 bg-slate-50 rounded border border-slate-200">
              <h4 className="font-semibold text-slate-800 mb-3 flex items-center">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span> ServiceNow
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-1">
                   <label className="text-xs font-semibold text-slate-500 uppercase">Instance URL</label>
                   <input type="text" value={config.snUrl} onChange={(e) => setConfig({...config, snUrl: e.target.value})} className="w-full p-2 border border-slate-300 rounded text-sm" />
                 </div>
                  <div className="space-y-1">
                   <label className="text-xs font-semibold text-slate-500 uppercase">User ID</label>
                   <input type="text" value={config.snUser} onChange={(e) => setConfig({...config, snUser: e.target.value})} className="w-full p-2 border border-slate-300 rounded text-sm" />
                 </div>
                  <div className="space-y-1 md:col-span-2">
                   <label className="text-xs font-semibold text-slate-500 uppercase">Password / Token</label>
                   <input type="password" value={config.snToken} onChange={(e) => setConfig({...config, snToken: e.target.value})} className="w-full p-2 border border-slate-300 rounded text-sm font-mono" />
                 </div>
              </div>
           </div>

           {/* Remediation Config */}
           <div className="p-4 bg-slate-50 rounded border border-slate-200">
              <h4 className="font-semibold text-slate-800 mb-3 flex items-center">
                <span className="w-2 h-2 bg-slate-500 rounded-full mr-2"></span> Configuration Workflow Remédiation
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="space-y-1">
                   <label className="text-xs font-semibold text-slate-500 uppercase">Auto-Approbation si Risque &lt;</label>
                   <select value={config.autoApprovalThreshold} onChange={(e) => setConfig({...config, autoApprovalThreshold: e.target.value})} className="w-full p-2 border border-slate-300 rounded text-sm bg-white">
                       <option value="Low">Low</option>
                       <option value="Medium">Medium</option>
                       <option value="High">High</option>
                   </select>
                 </div>
                  <div className="space-y-1">
                   <label className="text-xs font-semibold text-slate-500 uppercase">Assigné par défaut</label>
                   <div className="relative">
                       <Users className="absolute left-3 top-2.5 text-slate-400" size={14} />
                       <input type="text" value={config.defaultAssignee} onChange={(e) => setConfig({...config, defaultAssignee: e.target.value})} className="w-full pl-9 p-2 border border-slate-300 rounded text-sm" />
                   </div>
                 </div>
                  <div className="space-y-1 flex items-center pt-6">
                    <input type="checkbox" checked={config.requireCabApproval} onChange={(e) => setConfig({...config, requireCabApproval: e.target.checked})} className="mr-2 h-4 w-4 text-blue-600 rounded focus:ring-blue-500" />
                    <label className="text-sm text-slate-700">Approbation CAB requise pour Tier 0</label>
                 </div>
              </div>
           </div>
         </div>
       </Card>

       {/* Section BloodHound Enterprise */}
       <Card className="border-t-4 border-t-purple-500">
         <div className="flex items-center space-x-3 mb-6">
           <div className="p-2 bg-purple-100 rounded-lg">
             <Network className="text-purple-600" size={24} />
           </div>
           <div>
             <h3 className="text-lg font-bold text-slate-800">BloodHound Enterprise</h3>
             <p className="text-sm text-slate-500">Configuration de l'accès API pour la récupération des graphes d'attaque.</p>
           </div>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">URL de l'API / Instance</label>
              <div className="relative">
                <Server className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input type="text" value={config.bhUrl} onChange={(e) => setConfig({...config, bhUrl: e.target.value})} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Token API</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input type="password" value={config.bhToken} onChange={(e) => setConfig({...config, bhToken: e.target.value})} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm font-mono" />
              </div>
            </div>
         </div>
       </Card>

       {/* Section PingCastle */}
       <Card className="border-t-4 border-t-blue-500">
         <div className="flex items-center space-x-3 mb-6">
           <div className="p-2 bg-blue-100 rounded-lg">
             <FileText className="text-blue-600" size={24} />
           </div>
           <div>
             <h3 className="text-lg font-bold text-slate-800">PingCastle (Analyse Statique)</h3>
             <p className="text-sm text-slate-500">Emplacement des rapports d'audit XML et des fichiers de règles.</p>
           </div>
         </div>
         <div className="space-y-4">
           <div className="space-y-1">
             <label className="text-sm font-medium text-slate-700">Dossier des Rapports XML</label>
             <div className="relative">
                <Folder className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input type="text" value={config.pcReportPath} onChange={(e) => setConfig({...config, pcReportPath: e.target.value})} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm font-mono" />
             </div>
           </div>
            <div className="space-y-1">
             <label className="text-sm font-medium text-slate-700">Fichier Catalog des Règles</label>
             <div className="relative">
                <Database className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input type="text" value={config.pcCatalogPath} onChange={(e) => setConfig({...config, pcCatalogPath: e.target.value})} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm font-mono" />
             </div>
           </div>
         </div>
       </Card>
     </div>
   </div>
 );

 const RemediationView = () => (
   <div className="animate-in fade-in duration-300 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
           <h2 className="text-2xl font-bold text-slate-800 flex items-center">
               <CheckCircle className="mr-2 text-emerald-600" size={28} />
               Plan Global de Remédiation
           </h2>
           <p className="text-slate-500 mt-1">Validez la stratégie globale avant d'autoriser la création de tickets unitaires.</p>
        </div>
        <div className="flex items-center space-x-3">
            <div className="flex bg-white rounded-lg border border-slate-300 p-1">
                <button
                   onClick={() => setRemediationViewMode('list')}
                   className={`px-3 py-1 rounded text-sm font-medium transition-colors ${remediationViewMode === 'list' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <List size={16} className="inline mr-1" /> Liste
                </button>
                <button
                   onClick={() => setRemediationViewMode('matrix')}
                   className={`px-3 py-1 rounded text-sm font-medium transition-colors ${remediationViewMode === 'matrix' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Layout size={16} className="inline mr-1" /> Matrice
                </button>
            </div>
           
            {remediationValidated ? (
                <div className="px-4 py-2 bg-green-100 text-green-800 rounded-lg border border-green-200 font-bold flex items-center">
                    <CheckCircle size={18} className="mr-2" /> Plan Validé
                </div>
            ) : (
                <button
                   onClick={() => setRemediationValidated(true)}
                   className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-lg transition-colors flex items-center animate-pulse"
                >
                    <CheckSquare size={18} className="mr-2" /> Valider le Plan
                </button>
            )}
        </div>
      </div>

      <Card>
          {remediationViewMode === 'matrix' ? (
               <div className="h-96">
                   <h3 className="font-bold text-slate-700 mb-4">Matrice Complexité vs Criticité (Quick Wins)</h3>
                   <ResponsiveContainer width="100%" height="90%">
                       <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                           <CartesianGrid />
                           <XAxis type="number" dataKey="complexity" name="Complexité" unit="%" label={{ value: 'Effort / Complexité', position: 'bottom', offset: 0 }} />
                           <YAxis type="number" dataKey="criticality" name="Criticité" unit="%" label={{ value: 'Impact / Criticité', angle: -90, position: 'left' }} />
                           <ZAxis range={[100, 300]} />
                           <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                           <Legend />
                           <Scatter name="Actions de remédiation" data={remediationPlan} fill="#4f46e5" shape="circle" />
                       </ScatterChart>
                   </ResponsiveContainer>
                   <p className="text-center text-xs text-slate-500 mt-2">Zone en haut à gauche : Priorité absolue (Fort Impact, Faible Effort)</p>
               </div>
          ) : (
              <>
              <h3 className="font-bold text-slate-700 mb-4">Détail des Actions & Synchronisation JIRA</h3>
              <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b">
                          <tr>
                              <th className="p-4 w-16">ID</th>
                              <th className="p-4">Action Requise</th>
                              <th className="p-4 w-32">Priorité</th>
                              <th className="p-4">Dépendances</th>
                              <th className="p-4">Responsable (JIRA Suggest)</th>
                              <th className="p-4">Statut (JIRA Sync)</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y">
                          {remediationPlan.map(step => (
                              <tr key={step.id} className="bg-white hover:bg-slate-50">
                                  <td className="p-4 font-bold text-slate-500">#{step.id}</td>
                                  <td className="p-4 font-medium text-slate-800">{step.task}</td>
                                  <td className="p-4">
                                      <select
                                           value={step.priority}
                                           onChange={(e) => updateRemediationItem(step.id, 'priority', e.target.value)}
                                           className="w-full p-1 border border-slate-300 rounded text-xs bg-white focus:ring-2 focus:ring-indigo-500"
                                      >
                                          <option value="Critical">Critical</option>
                                          <option value="High">High</option>
                                          <option value="Medium">Medium</option>
                                          <option value="Low">Low</option>
                                      </select>
                                  </td>
                                  <td className="p-4">
                                      {step.dependency ? (
                                          <div className="flex items-center text-amber-600 text-xs bg-amber-50 px-2 py-1 rounded w-fit">
                                              <LinkIcon size={12} className="mr-1" />
                                              Requiert #{step.dependency}
                                          </div>
                                      ) : <span className="text-slate-400 text-xs">-</span>}
                                  </td>
                                  <td className="p-4">
                                      <input
                                           type="text"
                                           value={step.owner}
                                           onChange={(e) => updateRemediationItem(step.id, 'owner', e.target.value)}
                                           className="w-full p-1 border border-slate-300 rounded text-xs text-slate-600 focus:text-slate-900 focus:ring-2 focus:ring-indigo-500 placeholder-slate-300"
                                           placeholder="Suggéré par JIRA..."
                                      />
                                  </td>
                                  <td className="p-4">
                                      <select
                                           value={step.status}
                                           onChange={(e) => updateRemediationItem(step.id, 'status', e.target.value)}
                                           className="w-full p-1 border border-slate-300 rounded text-xs bg-white focus:ring-2 focus:ring-indigo-500"
                                      >
                                          <option value="To Do">To Do</option>
                                          <option value="In Progress">In Progress</option>
                                          <option value="Done">Done</option>
                                          <option value="Validation">Validation</option>
                                      </select>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
              </>
          )}
      </Card>
   </div>
 );

 const DetailedAnalysisView = () => {
   // Force la sélection du premier risque par défaut si aucun n'est sélectionné via le tableau de bord
   const activeRisk = selectedRisk || DETAILED_FINDINGS[0];
   const mappings = activeRisk.mappings;

   return (
   <div className="animate-in slide-in-from-right duration-300 space-y-6">
     <div className="flex justify-between items-center mb-4">
         <button onClick={() => setActiveView('dashboard')} className="flex items-center text-slate-500 hover:text-slate-800 font-medium transition-colors">
           <ArrowRight className="rotate-180 mr-2" size={18} /> Retour au Command Center
         </button>
        
         <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
             <span className="text-xs font-bold text-slate-500 px-2 uppercase">Sélectionner Vulnérabilité:</span>
             <select
               className="text-sm border-none focus:ring-0 text-slate-700 font-medium bg-transparent cursor-pointer outline-none"
               value={activeRisk.id}
               onChange={(e) => setSelectedRisk(DETAILED_FINDINGS.find(f => f.id === e.target.value))}
             >
                 {DETAILED_FINDINGS.map(f => (
                     <option key={f.id} value={f.id}>{f.id} - {f.title.substring(0, 40)}...</option>
                 ))}
             </select>
         </div>
     </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 space-y-6">
           <Card className="border-t-4 border-t-red-500">
             <div className="flex justify-between items-start mb-4">
               <div>
                 <div className="flex items-center space-x-3 mb-2">
                   <Badge type="Critical" text="Critical Risk" />
                   <span className="text-slate-400 text-sm font-mono">ID: {activeRisk.id}</span>
                 </div>
                 <h2 className="text-2xl font-bold text-slate-900">{activeRisk.title}</h2>
               </div>
              
               <div className="flex flex-col items-end space-y-2">
                   <button
                       disabled={!remediationValidated}
                       className={`px-4 py-2 rounded-lg font-medium shadow-sm transition-colors flex items-center space-x-2 ${remediationValidated ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                   >
                       <Ticket size={18} />
                       <span>{remediationValidated ? 'Générer un Ticket Jira' : 'Plan non validé'}</span>
                   </button>
                   {!remediationValidated && (
                        <span className="text-[10px] text-red-500">Validez le plan de remédiation d'abord</span>
                   )}
               </div>
             </div>
             <p className="text-slate-600 mb-6">{activeRisk.description}</p>
            
             <h3 className="font-semibold text-slate-800 mb-3 flex items-center">
               <Network className="mr-2 text-indigo-500" size={18} />
               Visualisation du Chemin d'Attaque (BloodHound Data)
             </h3>
             <AttackPathVisualizer />
           </Card>

           <Card>
             <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                 <ClipboardList className="mr-2 text-slate-500" size={20} />
                 Analyse de Conformité (Mapping Complet)
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {/* NIST */}
               <div className="bg-slate-50 p-3 rounded border border-slate-200">
                   <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">NIST CSF</h4>
                   <div className="space-y-2">
                       <div className="flex justify-between items-center text-sm">
                           <span className="text-slate-600">Version 2.0 (2024)</span>
                           <span className="font-mono font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">{mappings.nist_2}</span>
                       </div>
                        <div className="flex justify-between items-center text-sm opacity-70">
                           <span className="text-slate-600">Version 1.1</span>
                           <span className="font-mono font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded">{mappings.nist_1}</span>
                       </div>
                   </div>
               </div>

                {/* CIS */}
                <div className="bg-slate-50 p-3 rounded border border-slate-200">
                   <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">CIS Controls</h4>
                   <div className="space-y-2">
                       <div className="flex justify-between items-center text-sm">
                           <span className="text-slate-600">Version v8</span>
                           <span className="font-mono font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">{mappings.cis_8}</span>
                       </div>
                        <div className="flex justify-between items-center text-sm opacity-70">
                           <span className="text-slate-600">Version v7</span>
                           <span className="font-mono font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded">{mappings.cis_7}</span>
                       </div>
                   </div>
               </div>

               {/* Custom */}
               <div className="bg-slate-50 p-3 rounded border border-slate-200 md:col-span-2">
                   <div className="flex justify-between items-center">
                       <span className="text-xs font-bold text-slate-500 uppercase">Modèle Custom (Interne)</span>
                       <span className="font-mono font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded">{mappings.custom}</span>
                   </div>
               </div>
             </div>
           </Card>
         </div>

         <div className="space-y-6">
           <Card className="bg-white border-l-4 border-l-emerald-500 shadow-md">
               <div className="flex items-center space-x-3 mb-4">
                   <div className="p-2 bg-emerald-100 rounded-full text-emerald-600">
                       <TrendingUp size={24} />
                   </div>
                   <div>
                       <h3 className="font-bold text-slate-800">Gain de Remédiation</h3>
                       <p className="text-xs text-slate-500">Impact estimé sur le score global</p>
                   </div>
               </div>
               <div className="text-center py-4">
                   <div className="text-4xl font-extrabold text-emerald-600 mb-1">+18%</div>
                   <div className="text-sm text-slate-600 font-medium">De réduction de surface d'attaque</div>
               </div>
               <div className="w-full bg-slate-100 rounded-full h-2.5 mb-2 overflow-hidden">
                   <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: '85%' }}></div>
               </div>
               <p className="text-xs text-slate-400 text-center">Criticité: {activeRisk.risk} | Coût: {activeRisk.remediation_cost}</p>
           </Card>

           <Card className="bg-slate-50 border-slate-200">
             <h3 className="font-bold text-slate-800 mb-4">Actions Techniques Recommandées</h3>
             <ul className="space-y-4">
               <li className="flex items-start space-x-3">
                 <div className="mt-1 min-w-[20px] h-5 rounded-full border-2 border-slate-300 flex items-center justify-center text-xs font-bold text-slate-500">1</div>
                 <div>
                   <p className="text-sm font-medium text-slate-800">Rotation du mot de passe</p>
                   <p className="text-xs text-slate-500">Changer immédiatement le mot de passe du compte de service impacté (min 25 chars).</p>
                 </div>
               </li>
               <li className="flex items-start space-x-3">
                 <div className="mt-1 min-w-[20px] h-5 rounded-full border-2 border-slate-300 flex items-center justify-center text-xs font-bold text-slate-500">2</div>
                 <div>
                   <p className="text-sm font-medium text-slate-800">AES Encryption</p>
                   <p className="text-xs text-slate-500">Activer le support AES pour Kerberos afin de rendre le cracking plus difficile.</p>
                 </div>
               </li>
             </ul>
           </Card>
         </div>
       </div>
   </div>
 )};

 const MLView = () => (
   <div className="space-y-6 animate-in fade-in">
     <div className="flex justify-between items-center">
       <div>
         <h2 className="text-2xl font-bold text-slate-800">Centre d'Apprentissage Machine</h2>
         <p className="text-slate-500 text-sm">Calibration du modèle de risque basé sur les données historiques.</p>
       </div>
       <button
         onClick={runSimulation}
         disabled={isSimulating || adaptiveMode}
         className={`px-6 py-3 rounded-lg font-bold text-white shadow-lg flex items-center space-x-2 transition-all ${adaptiveMode ? 'bg-green-600 cursor-default' : 'bg-indigo-600 hover:bg-indigo-700'}`}
       >
         {isSimulating ? <RefreshCw className="animate-spin" /> : adaptiveMode ? <CheckCircle /> : <Play fill="white" size={18} />}
         <span>{isSimulating ? 'Entraînement en cours...' : adaptiveMode ? 'Modèle Optimisé Actif' : 'Lancer l\'Optimisation du Modèle'}</span>
       </button>
     </div>

     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
       <Card className="col-span-2">
         <h3 className="font-bold text-slate-700 mb-4">Pondération des Caractéristiques</h3>
         <div className="space-y-4">
           {AI_WEIGHTS.map((w, idx) => (
             <div key={idx}>
               <div className="flex justify-between text-sm mb-1">
                 <span className="font-medium text-slate-700">{w.feature}</span>
                 <div className="flex space-x-2">
                   <span className={`text-xs font-bold ${adaptiveMode ? (w.change.includes('+') ? 'text-green-600' : 'text-red-500') : 'hidden'}`}>
                     {w.change}
                   </span>
                   <span className="font-mono text-slate-500">{(w.weight * 100).toFixed(0)}%</span>
                 </div>
               </div>
               <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                 <div
                   className={`h-full rounded-full transition-all duration-1000 ${adaptiveMode ? 'bg-indigo-500' : 'bg-slate-400'}`}
                   style={{
                     width: `${adaptiveMode ? (w.weight * 100) + (parseInt(w.change)) : w.weight * 100}%`
                   }}
                 ></div>
               </div>
             </div>
           ))}
         </div>
       </Card>

       <Card className="bg-slate-900 text-white flex flex-col justify-center items-center text-center p-8">
         <div className="relative mb-6">
           <div className={`absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full ${adaptiveMode ? 'animate-pulse' : ''}`}></div>
           <Brain size={64} className="relative z-10 text-indigo-400" />
         </div>
         <h3 className="text-xl font-bold">Précision du Modèle</h3>
         <div className="text-4xl font-bold my-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
           {adaptiveMode ? '94.2%' : '81.5%'}
         </div>
       </Card>
     </div>
   </div>
 );

 return (
   <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex">
     <aside className="fixed left-0 top-0 bottom-0 w-72 bg-slate-900 text-slate-300 flex flex-col z-20 shadow-2xl">
       <div className="p-6 flex items-center space-x-3 border-b border-slate-800 bg-slate-950">
         <Shield className="text-indigo-500" size={32} />
         <div>
           <h1 className="text-lg font-bold text-white tracking-tight leading-none">BNC CyberWatch<span className="text-indigo-500">.AI</span></h1>
           <span className="text-[10px] uppercase tracking-widest text-slate-500">AD Defense Platform</span>
         </div>
       </div>
      
       <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
         <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Opérations</p>
         {[
           { id: 'dashboard', icon: BarChart2, label: 'Command Center' },
           { id: 'details', icon: Network, label: 'Investigation & Graphe' },
           { id: 'remediation', icon: CheckCircle, label: 'Plan de Remédiation' },
         ].map(item => (
           <button
             key={item.id}
             onClick={() => setActiveView(item.id)}
             className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${activeView === item.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
           >
             <item.icon size={20} className={activeView === item.id ? 'text-white' : 'text-slate-500 group-hover:text-white'} />
             <span className="font-medium">{item.label}</span>
           </button>
         ))}

         <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mt-8 mb-2">Intelligence</p>
         {[
           { id: 'ml', icon: Brain, label: 'Moteur IA & Modèle' },
           { id: 'settings', icon: Settings, label: 'Paramètres & Connecteurs' },
         ].map(item => (
           <button
             key={item.id}
             onClick={() => setActiveView(item.id)}
             className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${activeView === item.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
           >
             <item.icon size={20} className={activeView === item.id ? 'text-white' : 'text-slate-500 group-hover:text-white'} />
             <span className="font-medium">{item.label}</span>
           </button>
         ))}
       </div>

       <div className="p-4 border-t border-slate-800 bg-slate-950">
         <div className="flex items-center space-x-3">
           <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold shadow-lg">JS</div>
           <div className="flex flex-col">
             <span className="text-sm font-bold text-white">Jean Sécurité</span>
             <span className="text-xs text-slate-500">CISO - Admin</span>
           </div>
           <Settings
             size={16}
             className="ml-auto text-slate-500 hover:text-white cursor-pointer"
             onClick={() => setActiveView('settings')}
           />
         </div>
       </div>
     </aside>

     <main className="ml-72 flex-1 p-8 pb-20">
       <header className="mb-8 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200 sticky top-4 z-10">
         <div>
           <div className="flex items-center space-x-2 text-slate-400 text-sm mb-1">
             <span>Opérations</span>
             <ChevronRight size={14} />
             <span className="text-slate-800 font-medium capitalize">
               {activeView === 'ml' ? 'Intelligence Artificielle' :
                activeView === 'settings' ? 'Configuration' :
                activeView}
             </span>
           </div>
           <h2 className="text-xl font-bold text-slate-800">
              {activeView === 'dashboard' && 'Vue d\'Ensemble de la Posture'}
              {activeView === 'details' && 'Investigation & Graphe'}
              {activeView === 'ml' && 'Configuration du Modèle Adaptatif'}
              {activeView === 'remediation' && 'Plan d\'Amélioration Continue'}
              {activeView === 'settings' && 'Paramètres & Connecteurs'}
           </h2>
         </div>
        
         <div className="flex items-center space-x-4">
           <div className="hidden md:flex items-center px-3 py-1.5 bg-slate-100 rounded-lg text-sm font-medium text-slate-600 border border-slate-200">
             <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
             PingCastle: Synced 2h ago
           </div>
            <button className="p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200 relative">
               <AlertTriangle size={20} />
               <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
         </div>
       </header>

       {activeView === 'dashboard' && <DashboardView />}
       {activeView === 'details' && <DetailedAnalysisView />}
       {activeView === 'ml' && <MLView />}
       {activeView === 'settings' && <SettingsView />}
       {activeView === 'remediation' && <RemediationView />}

     </main>
   </div>
 );
}
