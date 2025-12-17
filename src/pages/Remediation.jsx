import React from 'react';
import { Card } from '../components';
import { List, Layout, CheckCircle, Link as LinkIcon } from 'lucide-react';
import { ResponsiveContainer, ScatterChart, CartesianGrid, XAxis, YAxis, ZAxis, Tooltip, Legend, Scatter } from 'recharts';
import ResponsiveGuard from '../components/ResponsiveGuard';
import { t } from '../i18n';

export default function RemediationPage({ ctx }) {
  const { remediationViewMode, setRemediationViewMode, remediationValidated, setRemediationValidated, remediationPlan, updateRemediationItem, config } = ctx;
  const lang = config?.currentLanguage || 'fr';
  return (
    <div className="animate-in fade-in duration-300 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center">
            <CheckCircle className="mr-2 text-emerald-600" size={28} />
            {t('remediation.title', lang)}
          </h2>
          <p className="text-slate-500 mt-1">{t('remediation.description', lang)}</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex bg-white rounded-lg border border-slate-300 p-1">
            <button onClick={() => setRemediationViewMode('list')} className={`px-3 py-1 rounded text-sm font-medium transition-colors ${remediationViewMode === 'list' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}>
              <List size={16} className="inline mr-1" /> {t('remediation.list', lang)}
            </button>
            <button onClick={() => setRemediationViewMode('matrix')} className={`px-3 py-1 rounded text-sm font-medium transition-colors ${remediationViewMode === 'matrix' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}>
              <Layout size={16} className="inline mr-1" /> {t('remediation.matrix', lang)}
            </button>
          </div>
          {remediationValidated ? (
            <div className="px-4 py-2 bg-green-100 text-green-800 rounded-lg border border-green-200 font-bold flex items-center">
              <CheckCircle size={18} className="mr-2" /> {t('remediation.planValidated', lang)}
            </div>
          ) : (
            <button onClick={() => setRemediationValidated(true)} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-lg transition-colors flex items-center animate-pulse">
              <CheckCircle size={18} className="mr-2" /> {t('remediation.validatePlan', lang)}
            </button>
          )}
        </div>
      </div>

      <Card>
        {remediationViewMode === 'matrix' ? (
          <div className="h-96">
            <h3 className="font-bold text-slate-700 mb-4">{t('remediation.complexityMatrix', lang)}</h3>
            <div style={{ display: 'block', height: '328px', width: '100%', overflow: 'hidden' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis type="number" dataKey="complexity" name={t('remediation.effort', lang)} unit="%" label={{ value: t('remediation.effort', lang), position: 'bottom', offset: 0 }} />
                  <YAxis type="number" dataKey="criticality" name={t('remediation.impact', lang)} unit="%" label={{ value: t('remediation.impact', lang), angle: -90, position: 'left' }} />
                  <ZAxis range={[100, 300]} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Legend />
                  <Scatter name={t('remediation.actions', lang)} data={remediationPlan} fill="#4f46e5" shape="circle" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <p className="text-center text-xs text-slate-500 mt-2">{t('remediation.quickWinsZone', lang)}</p>
          </div>
        ) : (
          <>
            <h3 className="font-bold text-slate-700 mb-4">{t('remediation.detailActions', lang)}</h3>
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b">
                  <tr>
                    <th className="p-4 w-16">ID</th>
                    <th className="p-4">{t('remediation.requiredAction', lang)}</th>
                    <th className="p-4 w-32">{t('remediation.priority', lang)}</th>
                    <th className="p-4">{t('remediation.dependencies', lang)}</th>
                    <th className="p-4">{t('remediation.responsible', lang)}</th>
                    <th className="p-4">{t('remediation.status', lang)}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {remediationPlan.map(step => (
                    <tr key={step.id} className="bg-white hover:bg-slate-50">
                      <td className="p-4 font-bold text-slate-500">#{step.id}</td>
                      <td className="p-4 font-medium text-slate-800">{step.task}</td>
                      <td className="p-4">
                        <select value={step.priority} onChange={(e) => updateRemediationItem(step.id, 'priority', e.target.value)} className="w-full p-1 border border-slate-300 rounded text-xs bg-white focus:ring-2 focus:ring-indigo-500">
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
                            {t('remediation.requires', lang)}{step.dependency}
                          </div>
                        ) : <span className="text-slate-400 text-xs">-</span>}
                      </td>
                      <td className="p-4">
                        <input type="text" value={step.owner} onChange={(e) => updateRemediationItem(step.id, 'owner', e.target.value)} className="w-full p-1 border border-slate-300 rounded text-xs text-slate-600 focus:text-slate-900 focus:ring-2 focus:ring-indigo-500 placeholder-slate-300" placeholder={t('remediation.suggestedByJira', lang)} />
                      </td>
                      <td className="p-4">
                        <select value={step.status} onChange={(e) => updateRemediationItem(step.id, 'status', e.target.value)} className="w-full p-1 border border-slate-300 rounded text-xs bg-white focus:ring-2 focus:ring-indigo-500">
                          <option value={t('remediation.todo', lang)}>To Do</option>
                          <option value={t('remediation.inProgress', lang)}>In Progress</option>
                          <option value={t('remediation.done', lang)}>Done</option>
                          <option value={t('remediation.validation', lang)}>Validation</option>
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
}
