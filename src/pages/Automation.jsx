import React, { useState } from 'react';
import { Card } from '../components';
import { Settings as SettingsIcon, MonitorCog, RefreshCw, Save, Globe, Users, Ticket, Folder, Database, Server, Lock, FileText, Network, Shield, Key, Link } from 'lucide-react';
import ResponsiveGuard from '../components/ResponsiveGuard';
import { t } from '../i18n';

export default function AutomationPage({ ctx }) {
  const { config, setConfig, handleSaveConfig, isSaving, authService } = ctx;
  const [ssoConfig, setSsoConfig] = useState({
    provider: config?.ssoProvider || 'azuread',
    clientId: config?.ssoClientId || '',
    tenantId: config?.ssoTenantId || '',
    redirectUri: config?.ssoRedirectUri || ''
  });
  
  // Sync ssoConfig with config when config changes
  React.useEffect(() => {
    setSsoConfig({
      provider: config?.ssoProvider || 'azuread',
      clientId: config?.ssoClientId || '',
      tenantId: config?.ssoTenantId || '',
      redirectUri: config?.ssoRedirectUri || ''
    });
  }, [config?.ssoProvider, config?.ssoClientId, config?.ssoTenantId, config?.ssoRedirectUri]);
  
  return (
    <div className="animate-in fade-in duration-300 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center">
            <Ticket className="mr-2 text-indigo-600" size={28} />
            Systèmes de Billetterie & Remédiation
          </h2>
          <p className="text-slate-500 mt-1">Connexion aux outils ITSM pour la création automatique de tickets.</p>
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

        <Card className="border-t-4 border-t-purple-500">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Shield className="text-purple-600" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-800">Configuration SSO</h3>
              <p className="text-sm text-slate-500">Paramètres d'authentification unique (Single Sign-On)</p>
            </div>
            <button
              onClick={async () => {
                await setConfig({
                  ...config,
                  ssoProvider: ssoConfig.provider,
                  ssoClientId: ssoConfig.clientId,
                  ssoTenantId: ssoConfig.tenantId,
                  ssoRedirectUri: ssoConfig.redirectUri
                });
                await handleSaveConfig();
              }}
              className="inline-flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm"
            >
              <Shield size={16} />
              <span>Sauvegarder SSO</span>
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Provider SSO</label>
                <div className="relative">
                  <Link className="absolute left-3 top-2.5 text-slate-400" size={16} />
                  <select
                    value={ssoConfig.provider}
                    onChange={(e) => setSsoConfig({...ssoConfig, provider: e.target.value})}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    <option value="azuread">Azure AD / Entra ID</option>
                    <option value="okta">Okta</option>
                    <option value="google">Google Workspace</option>
                    <option value="saml">SAML 2.0</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Client ID / Application ID</label>
                <div className="relative">
                  <Key className="absolute left-3 top-2.5 text-slate-400" size={16} />
                  <input
                    type="text"
                    value={ssoConfig.clientId}
                    onChange={(e) => setSsoConfig({...ssoConfig, clientId: e.target.value})}
                    placeholder="00000000-0000-0000-0000-000000000000"
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Tenant ID / Organization ID</label>
                <div className="relative">
                  <Server className="absolute left-3 top-2.5 text-slate-400" size={16} />
                  <input
                    type="text"
                    value={ssoConfig.tenantId}
                    onChange={(e) => setSsoConfig({...ssoConfig, tenantId: e.target.value})}
                    placeholder="00000000-0000-0000-0000-000000000000"
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Redirect URI</label>
                <div className="relative">
                  <Link className="absolute left-3 top-2.5 text-slate-400" size={16} />
                  <input
                    type="text"
                    value={ssoConfig.redirectUri}
                    onChange={(e) => setSsoConfig({...ssoConfig, redirectUri: e.target.value})}
                    placeholder="http://localhost:5173/auth/callback"
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-500">
                Une fois configuré, utilisez le bouton "Tester SSO" pour vérifier la connexion.
              </p>
              <button
                onClick={async () => {
                  const r = await authService.startSSO();
                  alert(JSON.stringify(r, null, 2));
                }}
                className="inline-flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2 rounded-lg text-sm font-medium border border-slate-200"
              >
                <Shield size={16} />
                <span>Tester SSO</span>
              </button>
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
}
