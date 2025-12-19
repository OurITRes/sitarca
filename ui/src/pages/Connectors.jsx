import React, { useState } from 'react';
import { Card } from '../components';
import { Settings as SettingsIcon, RefreshCw, Save, Users, Ticket, Folder, Database, Server, Lock, FileText, Network, Cable, Clock, Shield, Key, Link, Cloud } from 'lucide-react';
import ResponsiveGuard from '../components/ResponsiveGuard';
import { t } from '../i18n';

export default function ConnectorsPage({ ctx }) {
  const { config, setConfig, handleSaveConfig, isSaving, authService } = ctx;
  const lang = config?.language || 'fr';

  const [ssoConfig, setSsoConfig] = useState({
    provider: 'azuread',
    protocol: 'oidc',
    clientId: '',
    clientSecret: '',
    tenantId: '',
    discoveryUrl: '',
    redirectUri: '',
    metadataUrl: '',
    cognitoDomain: ''
  });

  // Sync ssoConfig with config when config changes
  React.useEffect(() => {
    console.log('Connectors useEffect - config loaded:', config);
    setSsoConfig({
      provider: config?.ssoProvider || 'azuread',
      protocol: config?.ssoProtocol || 'oidc',
      clientId: config?.ssoClientId || '',
      clientSecret: config?.ssoClientSecret || '',
      tenantId: config?.ssoTenantId || '',
      discoveryUrl: config?.ssoDiscoveryUrl || '',
      redirectUri: config?.ssoRedirectUri || '',
      metadataUrl: config?.ssoMetadataUrl || '',
      cognitoDomain: config?.ssoCognitoDomain || ''
    });
  }, [config]);

  const isCognito = ssoConfig.provider === 'cognito';
  const isAzure = ssoConfig.provider === 'azuread';
  const isOidc = ssoConfig.protocol === 'oidc';
  const isSaml = ssoConfig.protocol === 'saml';
  return (
    <div className="animate-in fade-in duration-300 space-y-8">
      <div className="flex items-center justify-between">
        <div>
           <h2 className="text-2xl font-bold text-slate-800 flex items-center">
             <Cable className="mr-2 text-indigo-600" size={28} />{t('connectors.title', lang)}
           </h2>
           <p className="text-slate-500 mt-1">{t('connectors.description', lang)} - Authentification, Intégrations et Paramètres Avancés</p>
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
        <Card className="border-t-4 border-t-purple-500">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Network className="text-purple-600" size={24} />
            </div>
            <div>
               <h3 className="text-lg font-bold text-slate-800">{t('connectors.bloodhound', lang)}</h3>
               <p className="text-sm text-slate-500">{t('connectors.bloodhoundDescription', lang)}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
               <label className="text-sm font-medium text-slate-700">{t('connectors.apiUrl', lang)}</label>
              <div className="relative">
                <Server className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input type="text" value={config.bhUrl} onChange={(e) => setConfig({...config, bhUrl: e.target.value})} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm" />
              </div>
            </div>
            <div className="space-y-1">
               <label className="text-sm font-medium text-slate-700">API Token</label>
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
               <h3 className="text-lg font-bold text-slate-800">{t('connectors.pingcastle', lang)}</h3>
               <p className="text-sm text-slate-500">{t('connectors.pingcastleDescription', lang)}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-1">
               <label className="text-sm font-medium text-slate-700">{t('connectors.xmlReportFolder', lang)}</label>
              <div className="relative">
                <Folder className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input type="text" value={config.pcReportPath} onChange={(e) => setConfig({...config, pcReportPath: e.target.value})} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm font-mono" />
              </div>
            </div>
            <div className="space-y-1">
               <label className="text-sm font-medium text-slate-700">{t('connectors.rulesCatalogFile', lang)}</label>
              <div className="relative">
                <Database className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input type="text" value={config.pcCatalogPath} onChange={(e) => setConfig({...config, pcCatalogPath: e.target.value})} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm font-mono" />
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
              <p className="text-sm text-slate-500">Authentification unique (OAuth2, OIDC, SAML 2.0)</p>
            </div>
            <button
              onClick={() => {
                const newConfig = {
                  ...config,
                  ssoProvider: ssoConfig.provider,
                  ssoProtocol: ssoConfig.protocol,
                  ssoClientId: ssoConfig.clientId,
                  ssoClientSecret: ssoConfig.clientSecret,
                  ssoTenantId: ssoConfig.tenantId,
                  ssoDiscoveryUrl: ssoConfig.discoveryUrl,
                  ssoRedirectUri: ssoConfig.redirectUri,
                  ssoMetadataUrl: ssoConfig.metadataUrl,
                  ssoCognitoDomain: ssoConfig.cognitoDomain
                };
                setConfig(newConfig);
                handleSaveConfig(null, newConfig);
              }}
              className="inline-flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm"
            >
              <Shield size={16} />
              <span>Sauvegarder SSO</span>
            </button>
          </div>

          <div className="space-y-4">
            {/* Provider et Protocole */}
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
                    <option value="cognito">AWS Cognito</option>
                    <option value="okta">Okta</option>
                    <option value="google">Google Workspace</option>
                    <option value="custom">Custom Identity Provider</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Protocole d'authentification</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 text-slate-400" size={16} />
                  <select
                    value={ssoConfig.protocol}
                    onChange={(e) => setSsoConfig({...ssoConfig, protocol: e.target.value})}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    <option value="oidc">OpenID Connect (OIDC)</option>
                    <option value="oauth2">OAuth 2.0</option>
                    <option value="saml">SAML 2.0</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Credentials */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              {!isCognito && !isSaml && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Client Secret / API Key</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input
                      type="password"
                      value={ssoConfig.clientSecret}
                      onChange={(e) => setSsoConfig({...ssoConfig, clientSecret: e.target.value})}
                      placeholder="••••••••••••••••"
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Tenant/Org and Redirect */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isAzure && (
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
              )}

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

            {/* Discovery URLs and Cognito Domain */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isOidc && !isCognito && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Discovery URL (OIDC)</label>
                  <div className="relative">
                    <Link className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input
                      type="text"
                      value={ssoConfig.discoveryUrl}
                      onChange={(e) => setSsoConfig({...ssoConfig, discoveryUrl: e.target.value})}
                      placeholder="https://login.microsoftonline.com/tenant/.well-known/openid-configuration"
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm font-mono text-xs"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Ex: https://login.microsoftonline.com/{'{tenant}'}/.well-known/openid-configuration</p>
                </div>
              )}

              {isSaml && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Metadata URL (SAML)</label>
                  <div className="relative">
                    <Link className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input
                      type="text"
                      value={ssoConfig.metadataUrl}
                      onChange={(e) => setSsoConfig({...ssoConfig, metadataUrl: e.target.value})}
                      placeholder="https://login.microsoftonline.com/tenant/FederationMetadata/2007-06/FederationMetadata.xml"
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm font-mono text-xs"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Pour SAML 2.0 uniquement</p>
                </div>
              )}

              {isCognito && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Cognito Hosted UI Domain</label>
                  <div className="relative">
                    <Link className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input
                      type="text"
                      value={ssoConfig.cognitoDomain}
                      onChange={(e) => setSsoConfig({...ssoConfig, cognitoDomain: e.target.value})}
                      placeholder="your-domain.auth.ca-central-1.amazoncognito.com"
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm font-mono text-xs"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Ex: stack-accountid.auth.{'{region}'} .amazoncognito.com</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-blue-50 rounded border border-blue-200">
              <h4 className="font-semibold text-slate-800 mb-2 text-sm flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Configuration actuelle
              </h4>
              <div className="text-sm text-slate-700 space-y-1 font-mono text-xs">
                <div>Provider: <span className="text-blue-600 font-bold">{ssoConfig.provider}</span></div>
                <div>Protocole: <span className="text-blue-600 font-bold">{ssoConfig.protocol.toUpperCase()}</span></div>
                <div>Client ID: <span className="text-blue-600 font-bold">{ssoConfig.clientId || '(non configuré)'}</span></div>
                {isCognito && (
                  <div>Domain: <span className="text-blue-600 font-bold">{ssoConfig.cognitoDomain || '(non configuré)'}</span></div>
                )}
                {isAzure && (
                  <div>Tenant: <span className="text-blue-600 font-bold">{ssoConfig.tenantId || '(non configuré)'}</span></div>
                )}
                {!isCognito && isOidc && (
                  <div>Discovery: <span className="text-blue-600 font-bold">{ssoConfig.discoveryUrl || '(non configuré)'}</span></div>
                )}
                {isSaml && (
                  <div>Metadata: <span className="text-blue-600 font-bold">{ssoConfig.metadataUrl || '(non configuré)'}</span></div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-500">
                Supporte OAuth2, OIDC et SAML 2.0 pour tous les providers.
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

        <Card className="border-t-4 border-t-orange-500">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Cloud className="text-orange-600" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Configuration AWS</h3>
              <p className="text-sm text-slate-500">Paramètres d'intégration Amazon Web Services (SAM Stack)</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded border border-blue-200">
              <h4 className="font-semibold text-slate-800 mb-3 flex items-center text-sm">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span> 
                ℹ️ Informations actuelles de la Stack
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-medium">Stack Name:</span>
                    <span className="text-slate-800 font-mono">{config.awsStackName || 'adcyberwatch-poc'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-medium">Region:</span>
                    <span className="text-slate-800 font-mono">{config.awsRegion || 'ca-central-1'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-medium">Cognito Pool:</span>
                    <span className="text-slate-800 font-mono text-xs">{config.awsCognitoPoolId || 'ca-central-1_diALmgpwp'}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-medium">HTTP API:</span>
                    <span className="text-slate-800 font-mono text-xs">{config.awsApiGatewayId ? `${config.awsApiGatewayId}.execute-api.${config.awsRegion || 'ca-central-1'}` : '87viw60pjl.execute-api.ca-central-1'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-medium">DynamoDB Table:</span>
                    <span className="text-slate-800 font-mono">{config.awsDynamoDBTable || 'adcyberwatch-main'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-medium">Lambda Functions:</span>
                    <span className="text-slate-800 font-mono text-xs">{config.awsLambdaFunction || 'adcyberwatch-ingest'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">AWS Region</label>
                <div className="relative">
                  <Server className="absolute left-3 top-2.5 text-slate-400" size={16} />
                  <select
                    value={config.awsRegion || 'ca-central-1'}
                    onChange={(e) => setConfig({...config, awsRegion: e.target.value})}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    <option value="us-east-1">us-east-1 (N. Virginia)</option>
                    <option value="us-west-2">us-west-2 (Oregon)</option>
                    <option value="eu-west-1">eu-west-1 (Ireland)</option>
                    <option value="eu-central-1">eu-central-1 (Frankfurt)</option>
                    <option value="ca-central-1">ca-central-1 (Canada)</option>
                    <option value="ap-northeast-1">ap-northeast-1 (Tokyo)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">HTTP API Gateway ID</label>
                  <div className="relative">
                    <Link className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input
                      type="text"
                      value={config.awsApiGatewayId || '87viw60pjl'}
                      onChange={(e) => setConfig({...config, awsApiGatewayId: e.target.value})}
                      placeholder="87viw60pjl"
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">DynamoDB Table Name</label>
                  <div className="relative">
                    <Database className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input
                      type="text"
                      value={config.awsDynamoDBTable || 'adcyberwatch-main'}
                      onChange={(e) => setConfig({...config, awsDynamoDBTable: e.target.value})}
                      placeholder="adcyberwatch-main"
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Stack Name</label>
                  <div className="relative">
                    <Server className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input
                      type="text"
                      value={config.awsStackName || 'adcyberwatch-poc'}
                      onChange={(e) => setConfig({...config, awsStackName: e.target.value})}
                      placeholder="adcyberwatch-poc"
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Cognito User Pool ID</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input
                      type="text"
                      value={config.awsCognitoPoolId || 'ca-central-1_example'}
                      onChange={(e) => setConfig({...config, awsCognitoPoolId: e.target.value})}
                      placeholder="ca-central-1_XXXXXXXXX"
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">S3 Bucket (Raw Scans)</label>
                  <div className="relative">
                    <Folder className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input
                      type="text"
                      value={config.awsS3BucketRaw || 'adcyberwatch-raw'}
                      onChange={(e) => setConfig({...config, awsS3BucketRaw: e.target.value})}
                      placeholder="adcyberwatch-raw"
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">S3 Bucket (Curated Data)</label>
                  <div className="relative">
                    <Folder className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input
                      type="text"
                      value={config.awsS3BucketCurated || 'adcyberwatch-curated'}
                      onChange={(e) => setConfig({...config, awsS3BucketCurated: e.target.value})}
                      placeholder="adcyberwatch-curated"
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Lambda Ingest Function</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-2.5 text-slate-400" size={16} />
                  <input
                    type="text"
                    value={config.awsLambdaFunction || 'adcyberwatch-ingest'}
                    onChange={(e) => setConfig({...config, awsLambdaFunction: e.target.value})}
                    placeholder="adcyberwatch-ingest"
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-500">
                Configuration de la stack SAM. Tous les paramètres sont sauvegardés automatiquement.
              </p>
              <button
                onClick={handleSaveConfig}
                className="inline-flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm"
              >
                {isSaving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                <span>Sauvegarder AWS</span>
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
