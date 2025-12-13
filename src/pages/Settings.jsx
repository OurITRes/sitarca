import React from 'react';
import { Card } from '../components';
import { Settings as SettingsIcon, RefreshCw, Save, Globe, Users, Ticket, Folder, Database, Server, Lock, FileText, Network } from 'lucide-react';
import ResponsiveGuard from '../components/ResponsiveGuard';
import { t } from '../i18n';

export default function SettingsView({ ctx }) {
  const { config, setConfig, handleSaveConfig, isSaving, supportedLanguages, addSupportedLanguage, loadUsers, setActiveView, authService } = ctx;
  return (
    <div className="animate-in fade-in duration-300 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center">
            <SettingsIcon className="mr-2 text-indigo-600" size={28} />
            Paramètres & Connecteurs
          </h2>
          <p className="text-slate-500 mt-1">Gérez les connexions aux sources de données et systèmes de billetterie.</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="space-y-1 mr-4"></div>
          <button onClick={handleSaveConfig} className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm">
            {isSaving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
            <span>{t('settings.save', config.language)}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <Card className="border-t-4 border-t-emerald-500">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Globe className="text-emerald-600" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Langues</h3>
              <p className="text-sm text-slate-500">Langue par défaut et gestion des languages</p>
            </div>
          </div>
          <div className="space-y-6">
            <div className="p-4 bg-slate-50 rounded border border-slate-200">
              <h4 className="font-semibold text-slate-800 mb-3 flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>Langues</h4>
              <div className="text-xs text-slate-400 flex ">Langues disponibles: {supportedLanguages.join(', ').toUpperCase()}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Langue par défaut</label>
                  <select value={config.defaultLanguage} onChange={(e) => setConfig({ ...config, defaultLanguage: e.target.value })} className="w-full p-2 border border-slate-300 rounded text-sm">
                    {supportedLanguages.map((lang) => (<option key={lang} value={lang}>{lang.toUpperCase()}</option>))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Ajouter une langue</label>
                  <div className="flex items-center space-x-2">
                    <input id="newLang" type="text" placeholder="fr" className="w-full p-2 border border-slate-300 rounded text-sm w-24" />
                    <button onClick={() => { const el = document.getElementById('newLang'); if (!el) return; const val = el.value.trim().toLowerCase(); if (!val) return; addSupportedLanguage(val); el.value = ''; }} className="px-3 py-1 bg-slate-800 text-white rounded text-sm">Ajouter</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="border-t-4 border-t-blue-400">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="text-blue-600" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Gestion des Utilisateurs</h3>
              <p className="text-sm text-slate-500">Utilisateurs locaux, rôles et authentification (SSO optionnel).</p>
            </div>
          </div>
          <div>
            <div className="mb-3">
              <button className="px-3 py-2 bg-blue-600 text-white rounded text-sm" onClick={() => setActiveView('register')}>Créer un utilisateur</button>
              <p className="text-xs text-slate-400 mt-2">La création d'utilisateurs se fait via la page d'enregistrement dédiée.</p>
            </div>
            <div>
              <button className="px-3 py-1 bg-slate-700 text-white rounded text-sm mr-2" onClick={() => loadUsers()}>Rafraîchir</button>
              <button className="px-3 py-1 bg-indigo-600 text-white rounded text-sm" onClick={async ()=>{ const r=await authService.startSSO(); alert(JSON.stringify(r)); }}>Tester SSO</button>
            </div>
            <div className="mt-4">
              <table className="w-full text-sm">
                <thead className="text-xs text-slate-500 uppercase"><tr><th>ID</th><th>Nom</th><th>Roles</th><th>Auth</th><th></th></tr></thead>
                <tbody>
                  {ctx.users.map(u=> (
                    <tr key={u.id} className="border-t">
                      <td className="p-2">{u.id}</td>
                      <td className="p-2">{u.displayName}</td>
                      <td className="p-2">{(u.roles||[]).join(', ')}</td>
                      <td className="p-2">
                        <select value={u.authMode||'local'} onChange={async (e) => { const m=e.target.value; await authService.updateUser(u.id, {...u, authMode: m}); loadUsers(); }} className="p-1 border rounded text-sm">
                          <option value="local">Local</option>
                          <option value="sso">SSO</option>
                        </select>
                      </td>
                      <td className="p-2"><button className="text-red-600" onClick={async ()=>{ await authService.deleteUser(u.id); loadUsers(); }}>Suppr</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>

        <Card className="border-t-4 border-t-emerald-500">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Ticket className="text-emerald-600" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Systèmes de Billetterie & Remédiation</h3>
              <p className="text-sm text-slate-500">Connexion aux outils ITSM pour la création automatique de tickets.</p>
            </div>
          </div>
          <div className="space-y-6">
            <div className="p-4 bg-slate-50 rounded border border-slate-200">
              <h4 className="font-semibold text-slate-800 mb-3 flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span> JIRA Software</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Instance URL</label>
                  <input type="text" value={config.jiraUrl} onChange={(e) => setConfig({...config, jiraUrl: e.target.value})} className="w-full p-2 border border-slate-300 rounded text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Projet Key (ex: SEC, IT)</label>
                  <input type="text" value={config.jiraProject} onChange={(e) => setConfig({...config, jiraProject: e.target.value})} className="w-full p-2 border border-slate-300 rounded text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Service User</label>
                  <input type="text" value={config.jiraUser} onChange={(e) => setConfig({...config, jiraUser: e.target.value})} className="w-full p-2 border border-slate-300 rounded text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">API Token</label>
                  <input type="password" value={config.jiraToken} onChange={(e) => setConfig({...config, jiraToken: e.target.value})} className="w-full p-2 border border-slate-300 rounded text-sm font-mono" />
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded border border-slate-200">
              <h4 className="font-semibold text-slate-800 mb-3 flex items-center"><span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span> ServiceNow</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Instance URL</label>
                  <input type="text" value={config.snUrl} onChange={(e) => setConfig({...config, snUrl: e.target.value})} className="w-full p-2 border border-slate-300 rounded text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">User ID</label>
                  <input type="text" value={config.snUser} onChange={(e) => setConfig({...config, snUser: e.target.value})} className="w-full p-2 border border-slate-300 rounded text-sm" />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Password / Token</label>
                  <input type="password" value={config.snToken} onChange={(e) => setConfig({...config, snToken: e.target.value})} className="w-full p-2 border border-slate-300 rounded text-sm font-mono" />
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded border border-slate-200">
              <h4 className="font-semibold text-slate-800 mb-3 flex items-center"><span className="w-2 h-2 bg-slate-500 rounded-full mr-2"></span> Configuration Workflow Remédiation</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Auto-Approbation si Risque &lt;</label>
                  <select value={config.autoApprovalThreshold} onChange={(e) => setConfig({...config, autoApprovalThreshold: e.target.value})} className="w-full p-2 border border-slate-300 rounded text-sm bg-white">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Assigné par défaut</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-2.5 text-slate-400" size={14} />
                    <input type="text" value={config.defaultAssignee} onChange={(e) => setConfig({...config, defaultAssignee: e.target.value})} className="w-full pl-9 p-2 border border-slate-300 rounded text-sm" />
                  </div>
                </div>
                <div className="space-y-1 flex items-center pt-6">
                  <input type="checkbox" checked={config.requireCabApproval} onChange={(e) => setConfig({...config, requireCabApproval: e.target.checked})} className="mr-2 h-4 w-4 text-blue-600 rounded focus:ring-blue-500" />
                  <label className="text-sm text-slate-700">Approbation CAB requise pour Tier 0</label>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="border-t-4 border-t-purple-500">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Network className="text-purple-600" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">BloodHound Enterprise</h3>
              <p className="text-sm text-slate-500">Configuration de l'accès API pour la récupération des graphes d'attaque.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">URL de l'API / Instance</label>
              <div className="relative">
                <Server className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input type="text" value={config.bhUrl} onChange={(e) => setConfig({...config, bhUrl: e.target.value})} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Token API</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input type="password" value={config.bhToken} onChange={(e) => setConfig({...config, bhToken: e.target.value})} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm font-mono" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="border-t-4 border-t-blue-500">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="text-blue-600" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">PingCastle (Analyse Statique)</h3>
              <p className="text-sm text-slate-500">Emplacement des rapports d'audit XML et des fichiers de règles.</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Dossier des Rapports XML</label>
              <div className="relative">
                <Folder className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input type="text" value={config.pcReportPath} onChange={(e) => setConfig({...config, pcReportPath: e.target.value})} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm font-mono" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Fichier Catalog des Règles</label>
              <div className="relative">
                <Database className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input type="text" value={config.pcCatalogPath} onChange={(e) => setConfig({...config, pcCatalogPath: e.target.value})} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm font-mono" />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
