import React, { useRef } from 'react';
import { useUnifiedData } from '../context/UnifiedDataContext';
import { Upload, FileText, Tag } from 'lucide-react';
import { t } from '../i18n';

export default function PingcastlePage({ ctx }) {
  const lang = ctx?.config?.language || 'fr';
  const { ingestData, findings } = useUnifiedData();
  const fileInputRef = useRef(null);

  // Simulation de chargement fichier (en prod: utilise fast-xml-parser)
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // TODO: Ici lire le fichier XML et le parser
    // Pour le test, on injecte de la fausse donnée
    const mockData = {
      risks: [
        { id: 'P-063', ruleName: 'Spooler Service Running', score: 80, overview: 'PrintNightmare vector' },
        { id: 'P-016', ruleName: 'AdminCount attribute', score: 60, overview: 'Persistence issue' }
      ]
    };
    
    ingestData('PingCastle', mockData);
  };

  const pcFindings = findings.filter(f => f.source === 'PingCastle');

  return (
    <div className="p-6 bg-white min-h-screen">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <FileText className="text-blue-600"/> {t('pingcastle.title', lang)}
      </h2>

      {/* Zone d'upload */}
      <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50 mb-8">
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          className="hidden" 
          accept=".xml"
        />
        <button 
          onClick={() => fileInputRef.current.click()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto"
        >
          <Upload size={20} /> {t('pingcastle.upload', lang)}
        </button>
        <p className="text-slate-400 mt-2 text-sm">Récupération automatique depuis le partage DFS disponible</p>
      </div>

      {/* Liste avec Tags MITRE */}
      <div className="space-y-3">
        {pcFindings.map(finding => (
          <div key={finding.id} className="bg-slate-800 p-4 rounded border border-slate-700 flex justify-between">
            <div>
              <div className="flex gap-2 items-center mb-1">
                 <span className={`px-2 py-0.5 rounded text-xs font-bold ${finding.severity === 'CRITICAL' ? 'bg-red-900 text-red-200' : 'bg-yellow-900 text-yellow-200'}`}>
                    {finding.severity}
                 </span>
                 <h4 className="font-semibold">{finding.title}</h4>
              </div>
              <p className="text-sm text-slate-400">{finding.description}</p>
            </div>
            
            {/* Affichage des mappings MITRE auto */}
            <div className="flex flex-col items-end gap-1">
               {finding.complianceTags
                  .filter(t => t.includes('MITRE'))
                  .map(tag => (
                    <span key={tag} className="flex items-center gap-1 text-xs bg-purple-900/50 text-purple-300 px-2 py-1 rounded border border-purple-700">
                      <Tag size={12}/> {tag}
                    </span>
               ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
