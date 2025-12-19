import React from 'react';
import { Shield, ArrowRight, Network, FileText, CheckCircle, Activity, Zap, Brain } from 'lucide-react';
import { Badge, Card, AttackPathVisualizer } from '../components';
import ResponsiveGuard from '../components/ResponsiveGuard';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Line, Legend } from 'recharts';
import { MOCK_TREND_DATA, DETAILED_FINDINGS } from '../utils/constants';
import { t } from '../i18n';

export default function DashboardView({ ctx }) {
  const { complianceScore, remediationValidated, setActiveView, setSelectedRisk, config } = ctx;
  const lang = config?.language || 'fr';
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="flex flex-col justify-between border-l-4 border-l-blue-500">
          <div className="flex justify-between items-start">
            <div>
               <p className="text-slate-500 text-sm font-medium">{t('dashboard.adSecurityScore', lang)}</p>
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
             <span className="text-slate-400 ml-2">{t('dashboard.since', lang)}</span>
          </div>
        </Card>

        <Card className="flex flex-col justify-between border-l-4 border-l-red-500">
          <div className="flex justify-between items-start">
            <div>
               <p className="text-slate-500 text-sm font-medium">{t('dashboard.criticalPaths', lang)}</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">3</h3>
            </div>
            <div className="p-2 bg-red-50 rounded-lg text-red-600">
              <Network size={24} />
            </div>
          </div>
          <div className="mt-4 text-sm text-slate-500">
             {t('dashboard.identifiedByBloodhound', lang)}
           </div>
        </Card>

        <Card className="flex flex-col justify-between border-l-4 border-l-purple-500">
          <div className="flex justify-between items-start">
            <div>
               <p className="text-slate-500 text-sm font-medium">{t('dashboard.nistControls', lang)}</p>
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
               <p className="text-slate-500 text-sm font-medium">{t('dashboard.remediationPlan', lang)}</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">12</h3>
            </div>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <CheckCircle size={24} />
            </div>
          </div>
          <div className="mt-4 text-sm text-emerald-700 font-medium">
              {remediationValidated ? t('dashboard.planValidated', lang) : t('dashboard.awaitingValidation', lang)}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="h-96">
            <div className="flex justify-between items-center mb-6">
               <h3 className="font-bold text-slate-700 flex items-center">
                 <Activity className="mr-2 text-blue-500" size={20}/>
                 {t('dashboard.evolution', lang)}
               </h3>
               <select className="text-sm border-slate-200 rounded-md shadow-sm" aria-label={t('dashboard.timePeriod', lang)}>
                 <option>{t('dashboard.lastMonths', lang)}</option>
                 <option>{t('dashboard.thisYear', lang)}</option>
               </select>
            </div>
            <div style={{ display: 'block', height: '328px', width: '100%', overflow: 'hidden' }}>
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
                <Area type="monotone" dataKey="score" stroke="#3b82f6" fillOpacity={1} fill="url(#colorScore)" name={t('dashboard.compliance', lang)} />
                <Line type="monotone" dataKey="risks" stroke="#ef4444" strokeWidth={2} name={t('dashboard.detectedRisks', lang)} />
              </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
               <h3 className="font-bold text-slate-700">{t('dashboard.topFlaws', lang)}</h3>
               <button className="text-sm text-blue-600 hover:underline">{t('dashboard.viewAll', lang)}</button>
            </div>
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                <tr>
                   <th className="px-6 py-3">{t('dashboard.source', lang)}</th>
                   <th className="px-6 py-3">{t('dashboard.flaw', lang)}</th>
                   <th className="px-6 py-3">{t('dashboard.asset', lang)}</th>
                   <th className="px-6 py-3">{t('dashboard.priorityAI', lang)}</th>
                   <th className="px-6 py-3">{t('dashboard.action', lang)}</th>
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
                         {t('dashboard.analyze', lang)}
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
             <h3 className="font-bold text-slate-700 mb-2">{t('dashboard.nistCoverage', lang)}</h3>
            <div style={{ display: 'block', height: '288px', width: '100%', overflow: 'hidden' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
                  { category: t('compliance.identify', lang), score: 85, max: 100 },
                  { category: t('compliance.protect', lang), score: 45, max: 100 },
                  { category: t('compliance.detect', lang), score: 60, max: 100 },
                  { category: t('compliance.respond', lang), score: 70, max: 100 },
                  { category: t('compliance.recover', lang), score: 90, max: 100 },
                ]}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false}/>
                  <Radar name={t('dashboard.current', lang)} dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white border-none relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Brain size={100} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center space-x-2 mb-4">
                <Zap className="text-yellow-400" size={20} />
                 <h3 className="font-bold">{t('dashboard.aiInsight', lang)}</h3>
              </div>
              <p className="text-sm text-indigo-100 mb-4 leading-relaxed">
                 {t('dashboard.aiInsightText1', lang)}<strong>{t('dashboard.serviceAccounts', lang)}</strong>{t('dashboard.aiInsightText2', lang)}<strong>18%</strong>.
              </p>
              <button
                onClick={() => setActiveView('ml')}
                className="w-full py-2 bg-indigo-500 hover:bg-indigo-600 rounded text-sm font-semibold transition-colors"
              >
                 {t('dashboard.viewAnalysis', lang)}
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
