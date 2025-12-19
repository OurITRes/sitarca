import React from 'react';
import { Card, Badge, AttackPathVisualizer } from '../components';
import { ArrowRight, Ticket, Network, ClipboardList, TrendingUp } from 'lucide-react';
import { DETAILED_FINDINGS } from '../utils/constants';
import { t } from '../i18n';

export default function DetailedAnalysisView({ ctx }) {
  const { selectedRisk, setSelectedRisk, remediationValidated, setActiveView, config } = ctx;
  const lang = config?.currentLanguage || 'fr';
  const activeRisk = selectedRisk || DETAILED_FINDINGS[0];
  const mappings = activeRisk.mappings;

  return (
    <div className="animate-in slide-in-from-right duration-300 space-y-6">
      <div className="flex justify-between items-center mb-4">
         <button onClick={() => setActiveView('dashboard')} className="flex items-center text-slate-500 hover:text-slate-800 font-medium transition-colors">
           <ArrowRight className="rotate-180 mr-2" size={18} /> {t('details.backTo', lang)}{t('menu.command', lang)}
         </button>
         <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
           <span className="text-xs font-bold text-slate-500 px-2 uppercase">{t('details.selectVulnerability', lang)}</span>
          <select className="text-sm border-none focus:ring-0 text-slate-700 font-medium bg-transparent cursor-pointer outline-none" value={activeRisk.id} onChange={(e) => setSelectedRisk(DETAILED_FINDINGS.find(f => f.id === e.target.value))}>
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
                   <Badge type="Critical" text={t('details.criticalRisk', lang)} />
                   <span className="text-slate-400 text-sm font-mono">ID {activeRisk.id}</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900">{activeRisk.title}</h2>
              </div>
              <div className="flex flex-col items-end space-y-2">
                <button disabled={!remediationValidated} className={`px-4 py-2 rounded-lg font-medium shadow-sm transition-colors flex items-center space-x-2 ${remediationValidated ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                   <Ticket size={18} />
                   <span>{remediationValidated ? t('details.generateJiraTicket', lang) : t('details.planNotValidated', lang)}</span>
                 </button>
                 {!remediationValidated && (
                   <span className="text-[10px] text-red-500">{t('details.validateFirst', lang)}</span>
                 )}
              </div>
            </div>
            <p className="text-slate-600 mb-6">{activeRisk.description}</p>
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center">
               <Network className="mr-2 text-indigo-500" size={18} />
               {t('details.attackPathVisualization', lang)}
             </h3>
            <AttackPathVisualizer />
          </Card>

          <Card>
            <h3 className="font-bold text-slate-800 mb-4 flex items-center">
               <ClipboardList className="mr-2 text-slate-500" size={20} />
               {t('details.complianceAnalysis', lang)}
             </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                 <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">NIST CSF</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                     <span className="text-slate-600">{t('details.version', lang)} 2.0 (2024)</span>
                    <span className="font-mono font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">{mappings.nist_2}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm opacity-70">
                     <span className="text-slate-600">{t('details.version', lang)} 1.1</span>
                    <span className="font-mono font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded">{mappings.nist_1}</span>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                 <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">{t('details.cisControls', lang)}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                     <span className="text-slate-600">{t('details.version', lang)} v8</span>
                    <span className="font-mono font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">{mappings.cis_8}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm opacity-70">
                     <span className="text-slate-600">{t('details.version', lang)} v7</span>
                    <span className="font-mono font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded">{mappings.cis_7}</span>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded border border-slate-200 md:col-span-2">
                 <div className="flex justify-between items-center">
                   <span className="text-xs font-bold text-slate-500 uppercase">{t('details.customModel', lang)}</span>
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
                 <h3 className="font-bold text-slate-800">{t('details.remediationGain', lang)}</h3>
                 <p className="text-xs text-slate-500">{t('details.estimatedImpact', lang)}</p>
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
                      <p className="text-xs text-slate-400 text-center">{t('details.criticality', lang)} {activeRisk.risk} | {t('details.cost', lang)} {activeRisk.remediation_cost}</p>
          </Card>
          <Card className="bg-slate-50 border-slate-200">
             <h3 className="font-bold text-slate-800 mb-4">{t('details.recommendedActions', lang)}</h3>
            <ul className="space-y-4">
              <li className="flex items-start space-x-3">
                <div className="mt-1 min-w-[20px] h-5 rounded-full border-2 border-slate-300 flex items-center justify-center text-xs font-bold text-slate-500">1</div>
                <div>
                   <p className="text-sm font-medium text-slate-800">{t('details.passwordRotation', lang)}</p>
                   <p className="text-xs text-slate-500">{t('details.passwordRotationDescription', lang)}</p>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <div className="mt-1 min-w-[20px] h-5 rounded-full border-2 border-slate-300 flex items-center justify-center text-xs font-bold text-slate-500">2</div>
                <div>
                   <p className="text-sm font-medium text-slate-800">{t('details.aesEncryption', lang)}</p>
                   <p className="text-xs text-slate-500">{t('details.aesEncryptionDescription', lang)}</p>
                </div>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
