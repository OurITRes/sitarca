import React, { useState } from 'react';
import { useUnifiedData } from '../context/UnifiedDataContext';
import { Edit2, Save } from 'lucide-react';
import { t } from '../i18n';

export default function RosettaPage({ ctx }) {
  const lang = ctx?.config?.language || 'fr';
  const { findings, updateFindingMapping } = useUnifiedData();
  const [editingId, setEditingId] = useState(null);
  const [tempTags, setTempTags] = useState("");

  const startEdit = (finding) => {
    setEditingId(finding.id);
    setTempTags(finding.complianceTags.join(", "));
  };

  const saveEdit = (id) => {
    const newTagsArray = tempTags.split(',').map(t => t.trim());
    updateFindingMapping(id, newTagsArray);
    setEditingId(null);
  };

  return (
    <div className="p-6 bg-white min-h-screen">
      <h2 className="text-2xl font-bold mb-6">{t('rosetta.title', lang)}</h2>
      <p className="text-slate-400 mb-4">{t('rosetta.description', lang)}</p>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-700">
              <th className="p-3">{t('rosetta.source', lang)}</th>
              <th className="p-3">{t('rosetta.titleId', lang)}</th>
              <th className="p-3">{t('rosetta.mappings', lang)}</th>
              <th className="p-3">{t('rosetta.actions', lang)}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {findings.map(f => (
              <tr key={f.id} className="hover:bg-slate-800/50">
                <td className="p-3 text-sm text-slate-400">{f.source}</td>
                <td className="p-3">
                    <div className="font-semibold">{f.title}</div>
                    <div className="text-xs text-slate-500">{f.originalId}</div>
                </td>
                <td className="p-3">
                    {editingId === f.id ? (
                        <input 
                            type="text" 
                            value={tempTags}
                            onChange={(e) => setTempTags(e.target.value)}
                            className="bg-slate-900 border border-blue-500 rounded p-1 w-full text-sm"
                        />
                    ) : (
                        <div className="flex flex-wrap gap-1">
                            {f.complianceTags.map(tag => (
                                <span key={tag} className="bg-slate-700 px-2 py-0.5 rounded text-xs text-blue-200">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </td>
                <td className="p-3">
                    {editingId === f.id ? (
                        <button onClick={() => saveEdit(f.id)} className="text-green-400"><Save size={18}/></button>
                    ) : (
                        <button onClick={() => startEdit(f)} className="text-blue-400"><Edit2 size={18}/></button>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}