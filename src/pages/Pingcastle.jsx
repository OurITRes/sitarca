import React, { useState, useEffect } from 'react';
import { FileText, Tag, Shield, CheckCircle, XCircle, Filter, Download, Settings, AlertTriangle, Database, MapPin } from 'lucide-react';
import { t } from '../i18n';

export default function PingcastlePage({ ctx }) {
  const { config } = ctx || {};
  const lang = config?.language || 'fr';
  const [latestReport, setLatestReport] = useState(null);
  const [findings, setFindings] = useState([]);
  const [pingcastleRules, setPingcastleRules] = useState([]);
  const [selectedFramework, setSelectedFramework] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all'); // all, mapped, unmapped
  const [loading, setLoading] = useState(true);

  // Frameworks disponibles
  const frameworks = [
    { id: 'all', name: 'Tous les frameworks', color: 'slate' },
    { id: 'MITRE', name: 'MITRE ATT&CK', color: 'purple' },
    { id: 'NIST', name: 'NIST CSF', color: 'blue' },
    { id: 'CIS', name: 'CIS Controls', color: 'green' },
    { id: 'ISO27001', name: 'ISO 27001', color: 'orange' },
  ];

  // Règles PingCastle prédéfinies (mockées pour l'instant)
  const defaultRules = [
    { id: 'A-Krbtgt', name: 'KRBTGT Account Weakness', category: 'Anomalies', severity: 'CRITICAL', frameworks: ['MITRE:T1558.003', 'NIST:DE.CM', 'CIS:5.4'] },
    { id: 'P-AdminLogin', name: 'Admin Login from Workstation', category: 'PrivilegedAccounts', severity: 'HIGH', frameworks: ['MITRE:T1078.002', 'NIST:PR.AC', 'CIS:4.3'] },
    { id: 'P-DelegationGPOData', name: 'Dangerous GPO Delegation', category: 'PrivilegedAccounts', severity: 'HIGH', frameworks: ['MITRE:T1484.001', 'ISO27001:A.9.2'] },
    { id: 'S-DC-SubnetMissing', name: 'DC Without Subnet', category: 'StaleObjects', severity: 'MEDIUM', frameworks: ['NIST:ID.AM', 'CIS:1.4'] },
    { id: 'A-LMHashAuthorized', name: 'LM Hash Authorized', category: 'Anomalies', severity: 'CRITICAL', frameworks: ['MITRE:T1003', 'NIST:PR.DS', 'CIS:5.1'] },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Charger les règles prédéfinies (à terme depuis API)
      setPingcastleRules(defaultRules);

      // Charger les findings depuis l'API
      const weaknessesData = await authService.getWeaknesses();
      
      // Mock du dernier rapport si pas de données réelles
      if (weaknessesData && weaknessesData.length > 0) {
        setFindings(weaknessesData);
        setLatestReport({
          uploadedAt: new Date().toISOString(),
          filename: 'ad_healthcheck_latest.xml',
          totalFindings: weaknessesData.length,
        });
      } else {
        // Données mockées pour démonstration
        const mockFindings = [
          { 
            id: 'W001', 
            riskId: 'A-Krbtgt', 
            title: 'KRBTGT password never changed',
            category: 'Anomalies',
            severity: 'CRITICAL',
            points: 100,
            description: 'The KRBTGT account password has not been changed in over 180 days',
            frameworks: ['MITRE:T1558.003', 'NIST:DE.CM'],
            mapped: true,
            evidenceCount: 3
          },
          { 
            id: 'W002', 
            riskId: 'P-AdminLogin', 
            title: 'Administrators logging from workstations',
            category: 'PrivilegedAccounts',
            severity: 'HIGH',
            points: 75,
            description: 'Domain admins are logging in from regular workstations',
            frameworks: ['MITRE:T1078.002'],
            mapped: true,
            evidenceCount: 12
          },
          { 
            id: 'W003', 
            riskId: 'UNKNOWN', 
            title: 'Weak password policy detected',
            category: 'Unknown',
            severity: 'MEDIUM',
            points: 50,
            description: 'Password policy does not meet security requirements',
            frameworks: [],
            mapped: false,
            evidenceCount: 1
          },
        ];
        setFindings(mockFindings);
        setLatestReport({
          uploadedAt: new Date().toISOString(),
          filename: 'demo_report.xml',
          totalFindings: mockFindings.length,
        });
      }
    } catch (error) {
      console.error('Error loading PingCastle data:', error);
      // Fallback sur données mockées en cas d'erreur
      const mockFindings = [
        { 
          id: 'W001', 
          riskId: 'A-Krbtgt', 
          title: 'KRBTGT password never changed',
          category: 'Anomalies',
          severity: 'CRITICAL',
          points: 100,
          description: 'The KRBTGT account password has not been changed in over 180 days',
          frameworks: ['MITRE:T1558.003', 'NIST:DE.CM'],
          mapped: true,
          evidenceCount: 3
        },
      ];
      setFindings(mockFindings);
    } finally {
      setLoading(false);
    }
  };

  const mapFindingToRule = (finding, rule) => {
    // Mapper un finding à une règle
    const updatedFindings = findings.map(f => 
      f.id === finding.id 
        ? { ...f, riskId: rule.id, frameworks: rule.frameworks, mapped: true, category: rule.category }
        : f
    );
    setFindings(updatedFindings);
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

  return (
    <div className="space-y-6">
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

      {/* Stats et filtres */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Findings</p>
              <p className="text-2xl font-bold text-slate-800">{findings.length}</p>
            </div>
            <Database className="text-blue-600" size={32} />
          </div>
        </div>
        
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Mappés</p>
              <p className="text-2xl font-bold text-green-600">{findings.filter(f => f.mapped).length}</p>
            </div>
            <CheckCircle className="text-green-600" size={32} />
          </div>
        </div>
        
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Non mappés</p>
              <p className="text-2xl font-bold text-orange-600">{findings.filter(f => !f.mapped).length}</p>
            </div>
            <XCircle className="text-orange-600" size={32} />
          </div>
        </div>
        
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Règles actives</p>
              <p className="text-2xl font-bold text-indigo-600">{pingcastleRules.length}</p>
            </div>
            <Settings className="text-indigo-600" size={32} />
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex items-center gap-4">
          <Filter size={20} className="text-slate-600" />
          <div className="flex-1 flex gap-3">
            {frameworks.map(fw => (
              <button
                key={fw.id}
                onClick={() => setSelectedFramework(fw.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedFramework === fw.id
                    ? `bg-${fw.color}-600 text-white`
                    : `bg-${fw.color}-100 text-${fw.color}-700 hover:bg-${fw.color}-200`
                }`}
              >
                {fw.name}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-2 rounded text-sm font-medium ${
                filterStatus === 'all' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setFilterStatus('mapped')}
              className={`px-3 py-2 rounded text-sm font-medium ${
                filterStatus === 'mapped' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700'
              }`}
            >
              Mappés
            </button>
            <button
              onClick={() => setFilterStatus('unmapped')}
              className={`px-3 py-2 rounded text-sm font-medium ${
                filterStatus === 'unmapped' ? 'bg-orange-600 text-white' : 'bg-orange-100 text-orange-700'
              }`}
            >
              Non mappés
            </button>
          </div>
        </div>
      </div>

      {/* Liste des findings */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Chargement des données...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFindings.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
              <Filter size={48} className="text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">Aucun finding ne correspond aux filtres sélectionnés</p>
            </div>
          ) : (
            filteredFindings.map(finding => (
              <div key={finding.id} className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded text-xs font-bold ${getSeverityColor(finding.severity)}`}>
                        {finding.severity}
                      </span>
                      {finding.mapped ? (
                        <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                          <CheckCircle size={14} />
                          Mappé: {finding.riskId}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                          <XCircle size={14} />
                          Non mappé
                        </span>
                      )}
                      {finding.category && (
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">
                          {finding.category}
                        </span>
                      )}
                    </div>
                    <h4 className="font-semibold text-slate-800 mb-1">{finding.title}</h4>
                    <p className="text-sm text-slate-600 mb-3">{finding.description}</p>
                    
                    {/* Frameworks mappés */}
                    {finding.frameworks && finding.frameworks.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {finding.frameworks.map(fw => (
                          <span
                            key={fw}
                            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-${getFrameworkColor(fw)}-100 text-${getFrameworkColor(fw)}-700 border border-${getFrameworkColor(fw)}-300`}
                          >
                            <Tag size={12} />
                            {fw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="ml-4 flex flex-col gap-2">
                    {!finding.mapped && (
                      <div className="relative group">
                        <button className="flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-700">
                          <MapPin size={14} />
                          Mapper
                        </button>
                        {/* Dropdown des règles disponibles */}
                        <div className="hidden group-hover:block absolute right-0 mt-1 w-64 bg-white border border-slate-300 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                          {pingcastleRules.map(rule => (
                            <button
                              key={rule.id}
                              onClick={() => mapFindingToRule(finding, rule)}
                              className="w-full text-left px-3 py-2 hover:bg-slate-100 border-b border-slate-100 last:border-0"
                            >
                              <div className="font-medium text-sm text-slate-800">{rule.id}</div>
                              <div className="text-xs text-slate-600">{rule.name}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <span className="text-xs text-slate-500 text-center">
                      {finding.evidenceCount || 0} preuves
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Section des règles PingCastle */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Settings size={20} className="text-indigo-600" />
          Règles PingCastle configurées ({pingcastleRules.length})
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {pingcastleRules.map(rule => (
            <div key={rule.id} className="border border-slate-200 rounded-lg p-3 hover:border-indigo-300 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="font-mono text-sm font-bold text-indigo-600">{rule.id}</span>
                  <h5 className="font-medium text-slate-800 text-sm">{rule.name}</h5>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${getSeverityColor(rule.severity)}`}>
                  {rule.severity}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {rule.frameworks.map(fw => (
                  <span key={fw} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                    {fw}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
