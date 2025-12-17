import React, { useState } from 'react';
import { useUnifiedData } from '../context/UnifiedDataContext';
import { Search, Play, Network } from 'lucide-react';
import { t } from '../i18n';

export default function BloodhoundPage({ ctx }) {
  const lang = ctx?.config?.language || 'fr';
  const { ingestData } = useUnifiedData();
  const [cypherQuery, setCypherQuery] = useState("MATCH p=(u:User)-[r:MemberOf*1..]->(g:Group) WHERE g.name CONTAINS 'ADMIN' RETURN p");

  const runCypher = () => {
    // Simulation API Call
    console.log("Running Cypher:", cypherQuery);
    
    // On simule un retour de BloodHound Enterprise
    const mockBHEFinding = [
      {
        id: 'BH-CUSTOM-01',
        source: 'BloodHound',
        title: 'Custom Cypher Path Found',
        severity: 'HIGH',
        description: 'Resultat de la requete Cypher personnalisée',
        complianceTags: ['MITRE:T1087', 'NIST:DETECT'],
        affectedAssets: ['CN=ADM_JDOE,OU=IT'],
        remediation: { status: 'OPEN', effort: 'HIGH' }
      }
    ];
    
    ingestData('BloodHound', mockBHEFinding);
  };

  return (
    <div className="p-6 bg-white min-h-screen">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Network className="text-green-600"/> {t('bloodhound.title', lang)}
      </h2>

      {/* Console Cypher */}
      <div className="bg-slate-100 p-4 rounded-xl border border-slate-300 mb-6">
        <label className="text-sm text-slate-600 mb-2 block">{t('bloodhound.cypherQuery', lang)}</label>
        <textarea 
          value={cypherQuery}
          onChange={(e) => setCypherQuery(e.target.value)}
          className="w-full bg-white font-mono text-sm p-3 rounded border border-slate-300 h-32 focus:border-green-500 outline-none"
        />
        <div className="flex justify-end mt-2">
            <button 
                onClick={runCypher}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2"
            >
                <Play size={16}/> {t('bloodhound.execute', lang)}
            </button>
        </div>
      </div>
      
      {/* Ici tu afficherais la liste des findings BloodHound comme dans PingCastlePage */}
    </div>
  );
}