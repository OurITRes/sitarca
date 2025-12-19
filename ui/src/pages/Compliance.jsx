import React, { useMemo, useState } from 'react';
import { Card } from '../components'; // Votre composant existant conservé
import { Shield, Filter, BarChart3 } from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar as RechartsRadar,
  Legend,
  Tooltip // Ajouté pour une meilleure UX, retirez-le si non souhaité
} from 'recharts';
import { useUnifiedData } from '../context/UnifiedDataContext'; // L'injection du moteur unifié
import { t } from '../i18n'; // Votre i18n conservé

// --- Configuration des Frameworks ---
const FRAMEWORKS = {
  NIST_CSF_2_0: {
    name: 'NIST CSF 2.0',
    description: 'National Institute of Standards and Technology Cybersecurity Framework',
    color: '#3b82f6',
    categories: ['GOVERN', 'IDENTIFY', 'PROTECT', 'DETECT', 'RESPOND', 'RECOVER'],
  },
  CIS_V8: {
    name: 'CIS Controls v8',
    description: 'Center for Internet Security Controls',
    color: '#10b981',
    categories: ['IG1', 'IG2', 'IG3'],
  },
  MITRE_ATTACK: {
    name: 'MITRE ATT&CK',
    description: 'Adversarial Tactics, Techniques & Common Knowledge',
    color: '#8b5cf6',
    categories: ['Initial Access', 'Execution', 'Persistence', 'Privilege Escalation', 'Defense Evasion'],
  },
};

// Système de pénalité unifié (aligné avec votre logique précédente)
const severityPenalty = {
  CRITICAL: 25, // Augmenté légèrement pour marquer le risque
  HIGH: 10,
  MEDIUM: 5,
  LOW: 1,
};

export default function CompliancePage({ ctx }) {
  // 1. Connexion au "Cerveau" (Context)
  const { findings = [] } = useUnifiedData();
  
  // 2. Gestion de la langue existante
  const lang = ctx?.config?.language || 'fr';
  const [selectedFramework, setSelectedFramework] = useState('NIST_CSF_2_0');

  // 3. Logique de Calcul "Pierre de Rosette" (Intégrée dans votre useMemo)
  const radarData = useMemo(() => {
    const framework = FRAMEWORKS[selectedFramework];
    const categories = framework?.categories || [];

    return categories.map((cat) => {
      // Filtrage intelligent : Supporte "NIST:PROTECT" ou raccourci "PR" (ex: PR.AC-01)
      const relevantFindings = findings.filter((f) =>
        (f.complianceTags || []).some((tag) => {
          if (!tag) return false;
          const upperTag = tag.toUpperCase();
          const upperCat = cat.toUpperCase();
          // Logique de matching souple pour attraper les préfixes (ex: 'PR' match 'PROTECT')
          return upperTag.includes(upperCat) || upperTag.includes(upperCat.slice(0, 2));
        })
      );

      // Calcul du score basé sur les pénalités
      const penalty = relevantFindings.reduce((acc, f) => {
        const sev = (f.severity || '').toUpperCase();
        return acc + (severityPenalty[sev] ?? 2);
      }, 0);

      const score = Math.max(0, 100 - penalty);
      
      return { 
        subject: cat, 
        score, 
        fullMark: 100,
        count: relevantFindings.length // Utile pour le tooltip
      };
    });
  }, [findings, selectedFramework]);

  // Calculs globaux
  const overallScore =
    radarData.length > 0
      ? Math.round(radarData.reduce((s, d) => s + d.score, 0) / radarData.length)
      : 0;

  const total = findings.length;
  const critical = findings.filter((f) => (f.severity || '').toUpperCase() === 'CRITICAL').length;
  const high = findings.filter((f) => (f.severity || '').toUpperCase() === 'HIGH').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header & Filtres */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center">
            <BarChart3 className="mr-2 text-blue-600" size={28} />
            {t('compliance.title', lang)}
          </h2>
          <p className="text-slate-500 mt-1">{t('compliance.description', lang)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="text-slate-400" size={18} />
          <select
            className="bg-white border border-slate-300 rounded px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
            value={selectedFramework}
            onChange={(e) => setSelectedFramework(e.target.value)}
          >
            {Object.keys(FRAMEWORKS).map((fw) => (
              <option key={fw} value={fw}>
                {FRAMEWORKS[fw].name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Card Principale (Votre composant UI) */}
      <Card className="h-full">
        {/* En-tête de la Card */}
        <div className="flex justify-between items-center mb-6 pb-6 border-b border-slate-200">
          <div>
            <h3 className="font-bold text-slate-700 flex items-center">
              <Shield className="mr-2 text-purple-600" size={20} />
              {FRAMEWORKS[selectedFramework]?.name} — {t('compliance.coverage', lang)}
            </h3>
            <p className="text-xs text-slate-500 mt-1">{t('compliance.radarDescription', lang)}</p>
          </div>
          <div className="text-right">
            <p className="text-slate-500 text-sm font-medium">{t('compliance.overallScore', lang)}</p>
            <p className={`text-3xl font-bold mt-1 ${overallScore < 50 ? 'text-red-600' : overallScore < 80 ? 'text-amber-600' : 'text-slate-800'}`}>
              {overallScore} / 100
            </p>
          </div>
        </div>

        {/* Graphique Radar */}
        <div style={{ display: 'block', height: '420px', width: '100%', overflow: 'hidden' }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
              <PolarGrid strokeDasharray="3 3" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
              <RechartsRadar
                name="Score"
                dataKey="score"
                stroke={FRAMEWORKS[selectedFramework]?.color || '#8884d8'}
                fill={FRAMEWORKS[selectedFramework]?.color || '#8884d8'}
                fillOpacity={0.55}
              />
              <Tooltip 
                formatter={(value) => [`${value} / 100`, t('compliance.score', lang) || 'Score']}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend wrapperStyle={{ paddingTop: '12px' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* KPIs (Statistiques au bas de la carte) */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-slate-500">{t('compliance.totalFindings', lang)}</p>
            <p className="text-2xl font-bold text-slate-800">{total}</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-red-500">{t('compliance.criticalFindings', lang)}</p>
            <p className="text-2xl font-bold text-red-600">{critical}</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-amber-600">{t('compliance.highFindings', lang)}</p>
            <p className="text-2xl font-bold text-amber-700">{high}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}