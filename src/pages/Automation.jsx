import React from 'react';
import { Card } from '../components';
import { Settings as SettingsIcon, MonitorCog, RefreshCw, Save, Globe, Users, Ticket, Folder, Database, Server, Lock, FileText, Network, Shield, Key, Link, Cloud, Clock } from 'lucide-react';
import ResponsiveGuard from '../components/ResponsiveGuard';
import { t } from '../i18n';

export default function AutomationPage({ ctx }) {
  const { config, setConfig, handleSaveConfig, isSaving } = ctx;
  const lang = config?.language || 'fr';
  
  return (
    <div className="animate-in fade-in duration-300 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center">
            <Ticket className="mr-2 text-indigo-600" size={28} />
            {t('pageTitle.automation', lang) || 'Automatisations'}
          </h2>
          <p className="text-slate-500 mt-1">Gestion des workflows, remédiations et synchronisations.</p>
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
              <MonitorCog  className="text-emerald-600" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Systèmes de Billetterie</h3>
              <p className="text-sm text-slate-500">Connexions aux API de ces systèmes pour la création automatique de tickets.</p>
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
          </div>
        </Card>

        <Card className="border-t-4 border-t-purple-500">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Network className="text-purple-600" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Remédiations</h3>
              <p className="text-sm text-slate-500">Configuration des conditions d'automatisation du workflow</p>
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
        </Card>

        <Card className="border-t-4 border-t-emerald-500">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Clock className="text-emerald-600" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">{t('connectors.frequencies', lang)}</h3>
              <p className="text-sm text-slate-500">{t('connectors.frequenciesDescription', lang)}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">{t('connectors.bhPolling', lang)}</label>
              <div className="relative">
                <RefreshCw className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input 
                  type="number" 
                  min="1" 
                  value={config.bhPollingInterval || 24} 
                  onChange={(e) => setConfig({...config, bhPollingInterval: parseInt(e.target.value) || 24})} 
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm" 
                />
              </div>
              <p className="text-xs text-slate-500">Fréquence de récupération des données BloodHound</p>
              <p className="text-xs text-slate-500">{t('connectors.bhPollingDescription', lang)}</p>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">{t('connectors.pcPolling', lang)}</label>
              <div className="relative">
                <RefreshCw className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input 
                  type="number" 
                  min="1" 
                  value={config.pcPollingInterval || 7} 
                  onChange={(e) => setConfig({...config, pcPollingInterval: parseInt(e.target.value) || 7})} 
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm" 
                />
              </div>
              <p className="text-xs text-slate-500">Fréquence de lecture des rapports PingCastle</p>
              <p className="text-xs text-slate-500">{t('connectors.pcPollingDescription', lang)}</p>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">{t('connectors.appRefresh', lang)}</label>
              <div className="relative">
                <RefreshCw className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input 
                  type="number" 
                  min="5" 
                  value={config.appRefreshInterval || 30} 
                  onChange={(e) => setConfig({...config, appRefreshInterval: parseInt(e.target.value) || 30})} 
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm" 
                />
              </div>
              <p className="text-xs text-slate-500">Intervalle de mise à jour de l'interface</p>
              <p className="text-xs text-slate-500">{t('connectors.appRefreshDescription', lang)}</p>
            </div>
          </div>
        </Card>

        <Card className="border-t-4 border-t-orange-500">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Key className="text-orange-600" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Gestion des Tokens</h3>
              <p className="text-sm text-slate-500">Configuration du renouvellement automatique des tokens d'authentification.</p>
            </div>
          </div>
          <div className="space-y-6">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Intervalle de renouvellement (secondes)</label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input 
                  type="number" 
                  min="60" 
                  step="60"
                  value={config.tokenRefreshInterval || 3600} 
                  onChange={(e) => setConfig({...config, tokenRefreshInterval: parseInt(e.target.value) || 3600})} 
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm" 
                />
              </div>
              <p className="text-xs text-slate-500">Fréquence de renouvellement du token. Minimum 60 secondes.</p>
              <p className="text-xs text-slate-500">Par défaut: 3600 secondes (1 heure)</p>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Seuil avant expiration (secondes)</label>
              <div className="relative">
                <Shield className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input 
                  type="number" 
                  min="30" 
                  step="30"
                  value={config.tokenRefreshThreshold || 300} 
                  onChange={(e) => setConfig({...config, tokenRefreshThreshold: parseInt(e.target.value) || 300})} 
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm" 
                />
              </div>
              <p className="text-xs text-slate-500">Le token sera renouvellé si l'expiration est dans moins de X secondes.</p>
              <p className="text-xs text-slate-500">Par défaut: 300 secondes (5 minutes)</p>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">ℹ️ Information:</span> Le renouvellement automatique du token SSO Cognito est activé. En cas d'expiration du refresh token (généralement 30 jours), l'utilisateur sera redirigé vers la page de connexion.
              </p>
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
}
