import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Tag, Shield, CheckCircle, XCircle, Filter, Download, Settings, AlertTriangle, Database, MapPin, BookOpen, List, ChevronDown, ChevronUp, X } from 'lucide-react';
import { getWeaknesses, getPingCastleRules } from '../services/auth';

export default function PingcastlePage({ ctx }) {
  const { config } = ctx || {};
  // eslint-disable-next-line no-unused-vars
  const lang = config?.language || 'fr'; // Conservé pour future internationalisation
  
  const [activeTab, setActiveTab] = useState('findings'); // 'findings' or 'rules'
  const [latestReport, setLatestReport] = useState(null);
  const [findings, setFindings] = useState([]);
  const [pingcastleRules, setPingcastleRules] = useState([]);
  const [selectedFramework, setSelectedFramework] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all'); // all, mapped, unmapped
  const [loading, setLoading] = useState(true);
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [selectedRule, setSelectedRule] = useState(null);
  const [expandedRule, setExpandedRule] = useState(null);

  // Frameworks disponibles
  const frameworks = [
    { id: 'all', name: 'Tous les frameworks', color: 'slate' },
    { id: 'MITRE', name: 'MITRE ATT&CK', color: 'purple' },
    { id: 'NIST', name: 'NIST CSF', color: 'blue' },
    { id: 'CIS', name: 'CIS Controls', color: 'green' },
    { id: 'ISO27001', name: 'ISO 27001', color: 'orange' },
  ];

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Charger les règles PingCastle depuis le XML
      const rulesData = await getPingCastleRules();
      setPingcastleRules(rulesData.rules || []);

      // Charger les findings depuis l'API
      const weaknessesResponse = await getWeaknesses();
      const weaknessesData = weaknessesResponse?.weaknesses || weaknessesResponse || [];

      if (weaknessesData.length > 0) {
        // Transformer les données de l'API pour correspondre au format attendu
        const transformedFindings = weaknessesData.map((w, idx) => {
          const evidenceList = w.evidence || [];
          const maxPoints = Math.max(...evidenceList.map(e => parseInt(e.points) || 0), 0);
          return {
            id: w.id || w._id || `${w.riskId || 'UNKNOWN'}-${w.domain || 'unknown'}-${w.date || idx}`,
            riskId: w.riskId || w.weakness_id || 'UNKNOWN',
            title: w.title || w.name || w.riskId || 'Sans titre',
            category: w.category || 'Unknown',
            severity: w.severity || w.risk_level || 'MEDIUM',
            points: w.points || w.score || maxPoints,
            description: w.description || 'Pas de description disponible',
            frameworks: w.frameworks || [],
            mapped: w.mapped || Boolean(w.riskId && w.riskId !== 'UNKNOWN'),
            evidenceCount: w.evidenceCount || w.evidence_count || evidenceList.length || 0,
          };
        });

        setFindings(transformedFindings);

        // Utiliser les métadonnées du premier finding s'il y en a
        const first = weaknessesData[0];
        setLatestReport({
          uploadedAt: first?.uploadedAt || first?.date || new Date().toISOString(),
          filename: first?.filename || (first?.domain ? `${first.domain}.xml` : 'latest_report.xml'),
          totalFindings: transformedFindings.length,
        });
      } else {
        // Aucune donnée disponible
        setFindings([]);
        setLatestReport(null);
      }
    } catch (error) {
      console.error('Error loading PingCastle data:', error);
      // En cas d'erreur, afficher un état vide plutôt que des données mockées
      setFindings([]);
      setPingcastleRules([]);
      setLatestReport(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    
    // Auto-refresh seulement au montage du composant, pas en continu
    const interval = setInterval(() => {
      loadData();
    }, 30000); // Refresh toutes les 30 secondes au lieu de 5-10

    return () => clearInterval(interval);
  }, [loadData]); // Ajout de loadData comme dépendance

  const mapFindingToRule = (finding, rule) => {
    // Mapper un finding à une règle
    const updatedFindings = findings.map(f => 
      f.id === finding.id 
        ? { ...f, riskId: rule.id, frameworks: rule.frameworks, mapped: true, category: rule.category, severity: rule.severity }
        : f
    );
    setFindings(updatedFindings);
    setSelectedFinding(null);
  };

  const filteredFindings = findings.filter(f => {
    // Filtre par framework
    if (selectedFramework !== 'all') {
      const hasFramework = f.frameworks?.some(fw => fw.startsWith(selectedFramework));
      if (!hasFramework) return false;
    }
    
    // Filtre par statut de mapping
    if (filterStatus === 'mapped' && !f.mapped) return false;
    if (filterStatus === 'unmapped' && f.mapped) return false;
    
    return true;
  });

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-600 text-white';
      case 'HIGH': return 'bg-orange-600 text-white';
      case 'MEDIUM': return 'bg-yellow-600 text-white';
      default: return 'bg-slate-600 text-white';
    }
  };

  const getFrameworkColor = (framework) => {
    const fw = frameworks.find(f => framework.startsWith(f.id));
    return fw ? fw.color : 'slate';
  };

  const getCategoryBadgeColor = (category) => {
    const colors = {
      'Anomalies': 'bg-red-100 text-red-800 border-red-300',
      'PrivilegedAccounts': 'bg-purple-100 text-purple-800 border-purple-300',
      'StaleObjects': 'bg-orange-100 text-orange-800 border-orange-300',
      'NetworkTopography': 'bg-blue-100 text-blue-800 border-blue-300',
      'ObjectConfig': 'bg-green-100 text-green-800 border-green-300',
    };
    return colors[category] || 'bg-slate-100 text-slate-800 border-slate-300';
  };

  // Modal de détail du finding
  const FindingDetailModal = ({ finding, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">{finding.title}</h2>
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${getSeverityColor(finding.severity)}`}>
                {finding.severity}
              </span>
              <span className="px-3 py-1 bg-white text-blue-800 rounded-full text-xs font-medium">
                {finding.riskId}
              </span>
              <span className={`px-3 py-1 rounded text-xs font-medium border ${getCategoryBadgeColor(finding.category)}`}>
                {finding.category}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Description</h3>
            <p className="text-slate-700">{finding.description}</p>
          </div>
          
          {finding.frameworks && finding.frameworks.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Frameworks</h3>
              <div className="flex flex-wrap gap-2">
                {finding.frameworks.map(fw => (
                  <span
                    key={fw}
                    className={`flex items-center gap-1 px-3 py-1 rounded text-sm font-medium bg-${getFrameworkColor(fw)}-100 text-${getFrameworkColor(fw)}-700 border border-${getFrameworkColor(fw)}-300`}
                  >
                    <Tag size={14} />
                    {fw}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>{finding.evidenceCount || 0} évidence(s)</strong> trouvée(s) pour cette faiblesse
            </p>
          </div>
          
          {!finding.mapped && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-orange-800 mb-3">
                <strong>Non mappé</strong> - Ce finding n'est pas encore associé à une règle PingCastle
              </p>
              <button
                onClick={() => {
                  setSelectedFinding(finding);
                  setActiveTab('rules');
                  onClose();
                }}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700"
              >
                Mapper à une règle
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Modal de détail de règle
  const RuleDetailModal = ({ rule, onClose, findingToMap }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">{rule.title}</h2>
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${getSeverityColor(rule.severity)}`}>
                {rule.severity}
              </span>
              <span className="px-3 py-1 bg-white text-indigo-800 rounded-full text-xs font-medium font-mono">
                {rule.id}
              </span>
              <span className={`px-3 py-1 rounded text-xs font-medium border ${getCategoryBadgeColor(rule.category)}`}>
                {rule.category}
              </span>
              <span className="px-2 py-1 bg-white bg-opacity-20 rounded text-xs">
                Level {rule.maturityLevel}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Description</h3>
            <p className="text-slate-700">{rule.description}</p>
          </div>
          
          {rule.technicalExplanation && (
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Explication technique</h3>
              <p className="text-slate-700 whitespace-pre-wrap">{rule.technicalExplanation}</p>
            </div>
          )}
          
          {rule.solution && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-900 mb-2">Solution recommandée</h3>
              <p className="text-green-800 whitespace-pre-wrap">{rule.solution}</p>
            </div>
          )}
          
          {rule.frameworks && rule.frameworks.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Références MITRE ATT&CK</h3>
              <div className="flex flex-wrap gap-2">
                {rule.frameworks.map(fw => (
                  <span
                    key={fw}
                    className={`flex items-center gap-1 px-3 py-1 rounded text-sm font-medium bg-purple-100 text-purple-700 border border-purple-300`}
                  >
                    <Tag size={14} />
                    {fw}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {findingToMap && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 mb-3">
                Mapper le finding <strong>{findingToMap.title}</strong> à cette règle ?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    mapFindingToRule(findingToMap, rule);
                    onClose();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Confirmer le mapping
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Chargement des données PingCastle...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header avec info du dernier rapport */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg p-6 shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <Shield size={28} />
              PingCastle - Analyse Active Directory
            </h2>
            {latestReport && (
              <div className="flex items-center gap-4 text-sm opacity-90">
                <span className="flex items-center gap-1">
                  <FileText size={16} />
                  {latestReport.filename}
                </span>
                <span className="flex items-center gap-1">
                  <Database size={16} />
                  {latestReport.totalFindings} findings
                </span>
                <span className="flex items-center gap-1">
                  <AlertTriangle size={16} />
                  Dernière analyse: {new Date(latestReport.uploadedAt).toLocaleString('fr-CA')}
                </span>
              </div>
            )}
          </div>
          <button className="flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors">
            <Download size={18} />
            Exporter
          </button>
        </div>
      </div>

      {/* Onglets */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('findings')}
            className={`flex-1 px-6 py-4 font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'findings'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <List size={20} />
            Findings ({findings.length})
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`flex-1 px-6 py-4 font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'rules'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <BookOpen size={20} />
            Règles PingCastle ({pingcastleRules.length})
          </button>
        </div>

        {/* Contenu des onglets */}
        {activeTab === 'findings' ? (
          <div className="p-6">
            {/* Stats et filtres pour findings */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Total Findings</p>
                    <p className="text-2xl font-bold text-blue-800">{findings.length}</p>
                  </div>
                  <Database className="text-blue-600" size={32} />
                </div>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Mappés</p>
                    <p className="text-2xl font-bold text-green-800">{findings.filter(f => f.mapped).length}</p>
                  </div>
                  <CheckCircle className="text-green-600" size={32} />
                </div>
              </div>
              
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600 font-medium">Non mappés</p>
                    <p className="text-2xl font-bold text-orange-800">{findings.filter(f => !f.mapped).length}</p>
                  </div>
                  <XCircle className="text-orange-600" size={32} />
                </div>
              </div>
            </div>

            {/* Filtres findings */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-4">
                <Filter size={20} className="text-slate-600" />
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilterStatus('all')}
                    className={`px-3 py-2 rounded text-sm font-medium ${
                      filterStatus === 'all' ? 'bg-slate-700 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Tous
                  </button>
                  <button
                    onClick={() => setFilterStatus('mapped')}
                    className={`px-3 py-2 rounded text-sm font-medium ${
                      filterStatus === 'mapped' ? 'bg-green-600 text-white' : 'bg-white text-green-700 hover:bg-green-50'
                    }`}
                  >
                    Mappés
                  </button>
                  <button
                    onClick={() => setFilterStatus('unmapped')}
                    className={`px-3 py-2 rounded text-sm font-medium ${
                      filterStatus === 'unmapped' ? 'bg-orange-600 text-white' : 'bg-white text-orange-700 hover:bg-orange-50'
                    }`}
                  >
                    Non mappés
                  </button>
                </div>
                {/* Ajout du filtre framework pour utiliser setSelectedFramework */}
                <div className="flex gap-2 ml-8">
                  {frameworks.map(fw => (
                    <button
                      key={fw.id}
                      onClick={() => setSelectedFramework(fw.id)}
                      className={`px-3 py-2 rounded text-sm font-medium border ${
                        selectedFramework === fw.id
                          ? 'bg-indigo-600 text-white border-indigo-700'
                          : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'
                      }`}
                    >
                      {fw.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Liste des findings */}
            <div className="space-y-3">
              {filteredFindings.length === 0 ? (
                <div className="text-center py-12 text-slate-600">
                  <Filter size={48} className="text-slate-300 mx-auto mb-4" />
                  <p className="font-medium">Aucun finding ne correspond aux filtres sélectionnés</p>
                </div>
              ) : (
                filteredFindings.map(finding => (
                  <div
                    key={finding.id}
                    className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedFinding(finding)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-3 py-1 rounded text-xs font-bold ${getSeverityColor(finding.severity)}`}>
                            {finding.severity}
                          </span>
                          {finding.mapped ? (
                            <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                              <CheckCircle size={14} />
                              {finding.riskId}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                              <XCircle size={14} />
                              Non mappé
                            </span>
                          )}
                          <span className={`px-2 py-1 rounded text-xs border ${getCategoryBadgeColor(finding.category)}`}>
                            {finding.category}
                          </span>
                        </div>
                        <h4 className="font-semibold text-slate-800 mb-1">{finding.title}</h4>
                        <p className="text-sm text-slate-600 line-clamp-2">{finding.description}</p>
                        
                        {finding.frameworks && finding.frameworks.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {finding.frameworks.slice(0, 3).map(fw => (
                              <span
                                key={fw}
                                className="px-2 py-1 rounded text-xs bg-purple-100 text-purple-700"
                              >
                                {fw}
                              </span>
                            ))}
                            {finding.frameworks.length > 3 && (
                              <span className="px-2 py-1 text-xs text-slate-500">
                                +{finding.frameworks.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-4 text-right">
                        <span className="text-xs text-slate-500">
                          {finding.evidenceCount || 0} preuve(s)
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="p-6">
            {/* Stats pour règles */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(sev => (
                <div key={sev} className={`border-2 rounded-lg p-4 ${getSeverityColor(sev)} bg-opacity-10`}>
                  <p className="text-sm font-medium opacity-80">{sev}</p>
                  <p className="text-2xl font-bold">
                    {pingcastleRules.filter(r => r.severity === sev).length}
                  </p>
                </div>
              ))}
            </div>

            {/* Liste des règles */}
            <div className="space-y-2">
              {pingcastleRules.map(rule => (
                <div key={rule.id} className="border border-slate-200 rounded-lg overflow-hidden">
                  <div
                    className="flex items-start justify-between p-4 hover:bg-slate-50 cursor-pointer"
                    onClick={() => setExpandedRule(expandedRule === rule.id ? null : rule.id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded text-xs font-bold ${getSeverityColor(rule.severity)}`}>
                          {rule.severity}
                        </span>
                        <span className="font-mono text-sm font-bold text-indigo-600">{rule.id}</span>
                        <span className={`px-2 py-1 rounded text-xs border ${getCategoryBadgeColor(rule.category)}`}>
                          {rule.category}
                        </span>
                        <span className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-700">
                          Level {rule.maturityLevel}
                        </span>
                      </div>
                      <h5 className="font-semibold text-slate-800 text-sm">{rule.title}</h5>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedFinding && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            mapFindingToRule(selectedFinding, rule);
                          }}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
                        >
                          <MapPin size={14} className="inline mr-1" />
                          Mapper
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRule(rule);
                        }}
                        className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-medium hover:bg-indigo-200"
                      >
                        Détails
                      </button>
                      {expandedRule === rule.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>
                  
                  {expandedRule === rule.id && (
                    <div className="border-t border-slate-200 p-4 bg-slate-50 space-y-3">
                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-1">Description:</p>
                        <p className="text-sm text-slate-600">{rule.description}</p>
                      </div>
                      {rule.frameworks && rule.frameworks.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {rule.frameworks.map(fw => (
                            <span key={fw} className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
                              {fw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedFinding && !selectedRule && (
        <FindingDetailModal finding={selectedFinding} onClose={() => setSelectedFinding(null)} />
      )}
      {selectedRule && (
        <RuleDetailModal 
          rule={selectedRule} 
          onClose={() => setSelectedRule(null)} 
          findingToMap={selectedFinding}
        />
      )}
    </div>
  );
}
