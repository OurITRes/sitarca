import React, { useState } from 'react';
import { Card } from '../components';
import { Globe, PlusCircle, Edit2, Save, X, Shield } from 'lucide-react';
import { TRANSLATIONS } from '../i18n/index.js';
import { API_BASE } from '../services/api';

export default function LanguagesPage({ ctx }) {
  const { config, setConfig, supportedLanguages, addSupportedLanguage, authenticatedUser, currentUser } = ctx;

  const availableLanguages = (supportedLanguages && supportedLanguages.length > 0)
    ? supportedLanguages
    : ['fr', 'en'];
  const hasLanguageSelector = availableLanguages.length > 2;
  const defaultLanguage = config?.defaultLanguage || 'fr';
  const initialSelectedLang = hasLanguageSelector
    ? (availableLanguages.find(l => l !== 'en') || availableLanguages[0])
    : defaultLanguage;

  const [selectedLangForTranslation, setSelectedLangForTranslation] = useState(initialSelectedLang);
  const [editedTranslations, setEditedTranslations] = useState(null);
  const [ignoredKeys, setIgnoredKeys] = useState(new Set());
  const [editingRowKey, setEditingRowKey] = useState(null);

  // Vérifier si l'utilisateur est admin - accepter plusieurs variantes
  const userRoles = authenticatedUser?.roles || currentUser?.roles || [];
  const isAdmin = Array.isArray(userRoles) && userRoles.some(role => 
    role && (role.toLowerCase() === 'admin' || role.toLowerCase() === 'administrator')
  );

  // Charger les traductions pour la langue sélectionnée
  const translationsData = TRANSLATIONS || {};
  const englishTranslations = translationsData['en'] || {};
  const targetLang = hasLanguageSelector ? selectedLangForTranslation : defaultLanguage;
  const showThirdColumn = targetLang && targetLang !== 'en';
  const targetTranslations = editedTranslations || (translationsData[targetLang] || {});
  const translationEntries = Object.keys(englishTranslations)
    .sort((a, b) => a.localeCompare(b))
    .map((key) => ({
      key,
      en: englishTranslations[key] || '',
      target: targetTranslations[key] || ''
    }));

  const handleEditTranslation = (key, value) => {
    setEditedTranslations({
      ...targetTranslations,
      [key]: value
    });
  };

  const toggleIgnoreKey = (key) => {
    setIgnoredKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleSaveTranslations = async () => {
    try {
      if (ignoredKeys.size > 0) {
        console.log('Tentative de suppression de', ignoredKeys.size, 'clés:', Array.from(ignoredKeys));
        
        // Supprimer les clés du fichier i18n via le serveur
        const response = await fetch(`${API_BASE}/translations/remove-keys`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keys: Array.from(ignoredKeys) })
        });
        
        console.log('Response status:', response.status);
        const result = await response.json();
        console.log('Response body:', result);
        
        if (!response.ok) {
          throw new Error(result.message || result.error || 'Échec de la suppression des clés');
        }
        
        if (result.charactersRemoved === 0) {
          alert(`Attention: ${ignoredKeys.size} clé(s) sélectionnée(s) mais aucune n'a été trouvée dans le fichier.\n\nCes clés ont peut-être déjà été supprimées ou n'existent pas.`);
        } else {
          alert(`${result.removedKeys} clé(s) supprimée(s) du fichier i18n avec succès !\n${result.charactersRemoved} caractères supprimés.\n\nRechargez la page pour voir les changements.`);
        }
        setIgnoredKeys(new Set());
      }
      
      // Sauvegarder les traductions modifiées si editedTranslations existe
      if (editedTranslations) {
        // Calculer les clés qui ont réellement changé
        const changedKeys = Object.keys(editedTranslations).filter(
          key => editedTranslations[key] !== targetTranslations[key]
        );
        
        if (changedKeys.length > 0) {
          console.log('Sauvegarde des traductions modifiées pour la langue:', targetLang);
          
          // Préparer les mises à jour
          const updates = {};
          changedKeys.forEach(key => {
            updates[key] = editedTranslations[key];
          });
          
          // Sauvegarder dans le fichier i18n
          const updateResponse = await fetch(`${API_BASE}/translations/update-keys`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              updates,
              language: targetLang 
            })
          });
          
          const updateResult = await updateResponse.json();
          console.log('Update response:', updateResult);
          
          if (!updateResponse.ok) {
            throw new Error(updateResult.message || updateResult.error || 'Échec de la mise à jour des traductions');
          }
          
          alert(`${updateResult.updatedKeys} traduction(s) sauvegardée(s) dans le fichier i18n !\n\nRechargez la page pour voir les changements.`);
          
          // Aussi sauvegarder dans la config locale (optionnel)
          if (config && setConfig) {
            const cleanedTranslations = Object.fromEntries(
              Object.entries(editedTranslations).filter(([k]) => !ignoredKeys.has(k))
            );
            setConfig({
              ...config,
              translations: {
                ...(config.translations || {}),
                [targetLang]: cleanedTranslations
              }
            });
          }
        }
      }
    } catch (error) {
      console.error('Erreur complète:', error);
      alert('Erreur: ' + error.message + '\n\nVérifiez que le serveur config tourne sur le port 3001.\nVoir la console (F12) pour plus de détails.');
    }
  };

  return (
    <div className="animate-in fade-in duration-300 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center">
            <Globe className="mr-2 text-emerald-600" size={28} />
            Langues
          </h2>
          <p className="text-slate-500 mt-1 text-sm">Langue par défaut et gestion des langues disponibles.</p>
        </div>
      </div>

      <Card className="border-t-4 border-t-emerald-500">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <Globe className="text-emerald-600" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Langues</h3>
            <p className="text-sm text-slate-500">Langue par défaut et gestion des langues</p>
            <p className="text-xs text-slate-400 mt-1">Rôles actuels: {userRoles.join(', ') || 'aucun'} | Admin: {isAdmin ? 'OUI' : 'NON'}</p>
          </div>
        </div>
        <div className="space-y-6">
          <div className="p-4 bg-slate-50 rounded border border-slate-200">
            <h4 className="font-semibold text-slate-800 mb-3 flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>Langues</h4>
            <div className="text-xs text-slate-400 flex">Langues disponibles: {supportedLanguages?.join(', ').toUpperCase() || 'FR, EN'}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Langue par défaut</label>
                <select value={config?.defaultLanguage || 'fr'} onChange={(e) => setConfig({ ...config, defaultLanguage: e.target.value })} className="w-full p-2 border border-slate-300 rounded text-sm">
                  {supportedLanguages?.map((lang) => (<option key={lang} value={lang}>{lang.toUpperCase()}</option>))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Ajouter une langue</label>
                <div className="flex items-center space-x-2">
                  <input id="newLang" type="text" placeholder="fr" className="w-full p-2 border border-slate-300 rounded text-sm w-24" />
                  <button onClick={() => { const el = document.getElementById('newLang'); if (!el) return; const val = el.value.trim().toLowerCase(); if (!val) return; addSupportedLanguage(val); el.value = ''; }} className="px-3 py-1 bg-slate-800 text-white rounded text-sm inline-flex items-center space-x-1">
                    <PlusCircle size={14} />
                    <span>Ajouter</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {isAdmin && (
        <Card className="border-t-4 border-t-purple-500">
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Edit2 className="text-purple-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Gestion des Traductions</h3>
                <p className="text-sm text-slate-500">Double-cliquez sur une valeur pour l'éditer</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {ignoredKeys.size > 0 && (
                <button
                  onClick={handleSaveTranslations}
                  className="inline-flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  <Save size={16} />
                  <span>Supprimer {ignoredKeys.size} clé(s)</span>
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {hasLanguageSelector && (
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">Sélectionnez la langue à éditer (colonne 3)</label>
                <select
                  value={selectedLangForTranslation}
                  onChange={(e) => {
                    setSelectedLangForTranslation(e.target.value);
                    setEditedTranslations(null);
                    setIgnoredKeys(new Set());
                  }}
                  className="w-full md:w-64 p-2 border border-slate-300 rounded text-sm"
                >
                  {availableLanguages.filter((lang) => lang !== 'en').map((lang) => (
                    <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            )}

            {translationEntries.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm table-fixed">
                  <colgroup>
                    <col style={{ width: '60px' }} />
                    <col style={{ width: showThirdColumn ? '35%' : '70%' }} />
                    {showThirdColumn && <col style={{ width: '35%' }} />}
                  </colgroup>
                  <thead className="bg-slate-100 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-center font-semibold text-slate-700">Ignorer</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">EN</th>
                      {showThirdColumn && (
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">{targetLang.toUpperCase()}</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {translationEntries.map((row, idx) => (
                      <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50">
                        <td className="px-4 py-3 text-center align-top">
                          <input
                            type="checkbox"
                            checked={ignoredKeys.has(row.key)}
                            onChange={() => toggleIgnoreKey(row.key)}
                            className="w-4 h-4 text-red-600 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3 text-left align-top">
                          <div className="text-slate-800 text-sm break-words" title={row.key}>{row.en}</div>
                        </td>
                        {showThirdColumn && (
                          <td className="px-4 py-3 text-left align-top" onDoubleClick={() => setEditingRowKey(row.key)}>
                            {editingRowKey === row.key ? (
                              <div className="flex items-center space-x-2">
                                <input
                                  type="text"
                                  value={editedTranslations?.[row.key] ?? row.target}
                                  onChange={(e) => handleEditTranslation(row.key, e.target.value)}
                                  onBlur={() => setEditingRowKey(null)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleSaveTranslations();
                                      setEditingRowKey(null);
                                    } else if (e.key === 'Escape') {
                                      setEditingRowKey(null);
                                    }
                                  }}
                                  autoFocus
                                  className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                />
                                <button
                                  onClick={() => {
                                    handleSaveTranslations();
                                    setEditingRowKey(null);
                                  }}
                                  className="p-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs"
                                >
                                  <Save size={14} />
                                </button>
                              </div>
                            ) : (
                              <div className="text-slate-800 text-sm break-words cursor-pointer hover:bg-purple-50 px-2 py-1 rounded">
                                {(editedTranslations?.[row.key] ?? row.target) || <span className="text-slate-400 italic">Double-cliquez pour éditer</span>}
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <p>Aucune traduction disponible pour cette langue</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {!isAdmin && (
        <Card className="border-t-4 border-t-slate-300 bg-slate-50">
          <div className="flex items-center space-x-3 py-4">
            <Shield className="text-slate-400" size={20} />
            <p className="text-sm text-slate-600">
              Seuls les administrateurs peuvent gérer les traductions. Connectez-vous avec un compte administrateur pour accéder à cette section.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
