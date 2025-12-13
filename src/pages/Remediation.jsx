import React from 'react';
import { Card } from '../components';
import { List, Layout, CheckCircle, Link as LinkIcon } from 'lucide-react';
import { ResponsiveContainer, ScatterChart, CartesianGrid, XAxis, YAxis, ZAxis, Tooltip, Legend, Scatter } from 'recharts';
import ResponsiveGuard from '../components/ResponsiveGuard';

export default function RemediationView({ ctx }) {
  const { remediationViewMode, setRemediationViewMode, remediationValidated, setRemediationValidated, remediationPlan, updateRemediationItem } = ctx;
  return (
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
            <button onClick={() => setRemediationViewMode('list')} className={`px-3 py-1 rounded text-sm font-medium transition-colors ${remediationViewMode === 'list' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}>
              <List size={16} className="inline mr-1" /> Liste
            </button>
            <button onClick={() => setRemediationViewMode('matrix')} className={`px-3 py-1 rounded text-sm font-medium transition-colors ${remediationViewMode === 'matrix' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}>
              <Layout size={16} className="inline mr-1" /> Matrice
            </button>
          </div>
          {remediationValidated ? (
            <div className="px-4 py-2 bg-green-100 text-green-800 rounded-lg border border-green-200 font-bold flex items-center">
              <CheckCircle size={18} className="mr-2" /> Plan Validé
            </div>
          ) : (
            <button onClick={() => setRemediationValidated(true)} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-lg transition-colors flex items-center animate-pulse">
              <CheckCircle size={18} className="mr-2" /> Valider le Plan
            </button>
          )}
        </div>
      </div>

      <Card>
        {remediationViewMode === 'matrix' ? (
          <div className="h-96">
            <h3 className="font-bold text-slate-700 mb-4">Matrice Complexité vs Criticité (Quick Wins)</h3>
            <ResponsiveGuard className="h-full">
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
            </ResponsiveGuard>
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
                            Requiert #{step.dependency}
                          </div>
                        ) : <span className="text-slate-400 text-xs">-</span>}
                      </td>
                      <td className="p-4">
                        <input type="text" value={step.owner} onChange={(e) => updateRemediationItem(step.id, 'owner', e.target.value)} className="w-full p-1 border border-slate-300 rounded text-xs text-slate-600 focus:text-slate-900 focus:ring-2 focus:ring-indigo-500 placeholder-slate-300" placeholder="Suggéré par JIRA..." />
                      </td>
                      <td className="p-4">
                        <select value={step.status} onChange={(e) => updateRemediationItem(step.id, 'status', e.target.value)} className="w-full p-1 border border-slate-300 rounded text-xs bg-white focus:ring-2 focus:ring-indigo-500">
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
}
