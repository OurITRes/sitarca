import React, { useEffect, useState } from 'react';
import { Card } from '../components';
import { Users, RefreshCw, Plus, Shield, ShieldCheck, Trash2, Award, X } from 'lucide-react';
import { t } from '../i18n';

export default function UsersPage({ ctx }) {
  const { users = [], loadUsers, setActiveView, authService, config, setConfig, handleSaveConfig, authenticatedUser } = ctx;
  const lang = config?.language || 'fr';
  // Show list if user is admin or if there's no authenticated user (local mode)
  const isAdmin = ((authenticatedUser?.roles || []).includes('admin')) || ((ctx.currentUser?.roles || []).includes('admin')) || !authenticatedUser;
  const [roles, setRoles] = useState(config?.appRoles || ['admin', 'analyst', 'viewer']);
  const [newRole, setNewRole] = useState('');
  const [selectedUserForRoles, setSelectedUserForRoles] = useState(null);
  const [userRolesModal, setUserRolesModal] = useState(false);
  const [savingRoles, setSavingRoles] = useState(false);
  const [showAddSsoModal, setShowAddSsoModal] = useState(false);
  const [newSsoUser, setNewSsoUser] = useState({ id: '', email: '', displayName: '', idp: 'entra', issuer: '', subject: '' });
  const [ssoAutoCreate, setSsoAutoCreate] = useState(Boolean(config?.ssoAutoCreateUsers));

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep local roles state in sync with config changes (avoids stale first-save)
  useEffect(() => {
    const cfgRoles = Array.isArray(config?.appRoles) ? config.appRoles : [];
    if (cfgRoles.length && JSON.stringify(cfgRoles) !== JSON.stringify(roles)) {
      setRoles(cfgRoles);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config?.appRoles]);

  useEffect(() => {
    setSsoAutoCreate(Boolean(config?.ssoAutoCreateUsers));
  }, [config?.ssoAutoCreateUsers]);

  const handleSaveUserRoles = async () => {
    if (!selectedUserForRoles) return;
    setSavingRoles(true);
    try {
      const payload = {
        ...selectedUserForRoles,
        roles: selectedUserForRoles.roles || [],
        authMode: selectedUserForRoles.authMode || 'local',
        idp: selectedUserForRoles.idp || '',
      };
      // Ensure minimal identity fields for SSO users to persist provider
      if ((payload.authMode || '').toLowerCase() === 'sso') {
        payload.email = selectedUserForRoles.email || selectedUserForRoles.id || '';
        payload.issuer = selectedUserForRoles.issuer || '';
        payload.subject = selectedUserForRoles.subject || '';
      }
      await authService.updateUser(selectedUserForRoles.id, payload);
      setUserRolesModal(false);
      await loadUsers();
    } catch (err) {
      console.error('Error saving user roles:', err);
    } finally {
      setSavingRoles(false);
    }
  };

  const toggleUserRole = (role) => {
    if (!selectedUserForRoles) return;
    const currentRoles = selectedUserForRoles.roles || [];
    const newRoles = currentRoles.includes(role)
      ? currentRoles.filter(r => r !== role)
      : [...currentRoles, role];
    setSelectedUserForRoles({ ...selectedUserForRoles, roles: newRoles });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
           <h2 className="text-2xl font-bold text-slate-800 flex items-center">
             <Users className="mr-2 text-indigo-600" size={28} />
             {t('users.title', lang)}
           </h2>
           <p className="text-slate-500 mt-1 text-sm">{t('users.description', lang)}</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAddSsoModal(true)}
            className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm"
          >
            <Plus size={16} />
             <span>Ajouter un utilisateur SSO</span>
          </button>
          <button
            onClick={() => loadUsers()}
            className="inline-flex items-center space-x-2 bg-slate-800 hover:bg-slate-900 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-sm"
          >
            <RefreshCw size={16} />
             <span>{t('users.refresh', lang)}</span>
          </button>
        </div>
      </div>

      {isAdmin && (
        <Card className="border border-amber-200 bg-amber-50">
          <div className="p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-amber-900">Auto-création des comptes SSO</p>
              <p className="text-xs text-amber-800">Autoriser ou non la création automatique lors d&apos;une première connexion.</p>
            </div>
            <button
              onClick={async () => {
                const next = !ssoAutoCreate;
                setSsoAutoCreate(next);
                setConfig(prev => ({ ...prev, ssoAutoCreateUsers: next }));
                try {
                  await handleSaveConfig(null, { ssoAutoCreateUsers: next });
                } catch (err) {
                  console.error('Failed to save SSO auto-create flag', err);
                }
              }}
              className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-semibold shadow-sm border ${ssoAutoCreate ? 'bg-green-600 text-white border-green-700' : 'bg-white text-slate-700 border-slate-300'}`}
            >
              {ssoAutoCreate ? 'Activé' : 'Désactivé'}
            </button>
          </div>
        </Card>
      )}

      {/* Add SSO User Modal */}
      {showAddSsoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg">
            <div className="p-6 space-y-4">
              <h3 className="text-lg font-bold text-slate-800">Pré-déclarer un utilisateur SSO</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-slate-500">Email/UPN (ID)</label>
                  <input value={newSsoUser.id} onChange={e=>setNewSsoUser({...newSsoUser, id: e.target.value})} className="w-full p-2 border rounded" />
                </div>
                <div>
                  <label className="text-xs text-slate-500">Affiché</label>
                  <input value={newSsoUser.displayName} onChange={e=>setNewSsoUser({...newSsoUser, displayName: e.target.value})} className="w-full p-2 border rounded" />
                </div>
                <div>
                  <label className="text-xs text-slate-500">Email</label>
                  <input value={newSsoUser.email} onChange={e=>setNewSsoUser({...newSsoUser, email: e.target.value})} className="w-full p-2 border rounded" />
                </div>
                <div>
                  <label className="text-xs text-slate-500">Fournisseur (IdP)</label>
                  <select value={newSsoUser.idp} onChange={e=>setNewSsoUser({...newSsoUser, idp: e.target.value})} className="w-full p-2 border rounded bg-white">
                    <option value="entra">Microsoft Entra ID</option>
                    <option value="cognito">AWS Cognito</option>
                    <option value="okta">Okta</option>
                    <option value="google">Google</option>
                    <option value="generic">Generic OIDC</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500">Issuer (optionnel)</label>
                  <input value={newSsoUser.issuer} onChange={e=>setNewSsoUser({...newSsoUser, issuer: e.target.value})} className="w-full p-2 border rounded" />
                </div>
                <div>
                  <label className="text-xs text-slate-500">Subject/Sub (optionnel)</label>
                  <input value={newSsoUser.subject} onChange={e=>setNewSsoUser({...newSsoUser, subject: e.target.value})} className="w-full p-2 border rounded" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button onClick={()=>setShowAddSsoModal(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50">Annuler</button>
                <button
                  onClick={async ()=>{
                    if (!newSsoUser.id) return;
                    try{
                      await authService.createUser({
                        ...newSsoUser,
                        authMode: 'sso',
                        roles: [],
                      });
                      setShowAddSsoModal(false);
                      setNewSsoUser({ id: '', email: '', displayName: '', idp: 'entra', issuer: '', subject: '' });
                      await loadUsers();
                    }catch(err){
                      console.error('create sso user failed', err);
                      alert('Création utilisateur SSO échouée: ' + (err?.message||'unknown'));
                    }
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                >Créer</button>
              </div>
              <p className="text-xs text-slate-500">Note: Les utilisateurs locaux se créent depuis la page de login (mot de passe temporaire requis).</p>
            </div>
          </Card>
        </div>
      )}

      {/* Role Assignment Modal */}
      {userRolesModal && selectedUserForRoles && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">
                Roles pour: {selectedUserForRoles.displayName || selectedUserForRoles.id}
              </h3>
              <div className="space-y-3 mb-6">
                {roles.map((role) => (
                  <label key={role} className="flex items-center space-x-3 cursor-pointer p-3 hover:bg-slate-50 rounded-lg">
                    <input
                      type="checkbox"
                      checked={(selectedUserForRoles.roles || []).includes(role)}
                      onChange={() => toggleUserRole(role)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium text-slate-700">{role}</span>
                  </label>
                ))}
              </div>
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => setUserRolesModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveUserRoles}
                  disabled={savingRoles}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {savingRoles ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      <Card className="border-t-4 border-t-blue-500">
        <div className="p-4">
          <h3 className="text-lg font-bold text-slate-800 mb-3">{t('users.usersList', lang)}</h3>
          {!isAdmin && (
            <div className="text-xs text-slate-500 mb-2">
              Accès en lecture seule (droits administrateur requis pour modifier).
            </div>
          )}
          {users.length === 0 ? (
            <div className="text-sm text-slate-500 flex items-center space-x-2">
               <ShieldCheck size={16} className="text-green-500" />
               <span>{t('users.noUsers', lang)}</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-xs text-slate-500 uppercase">
                  <tr>
                     <th className="p-2 text-middle">ID</th>
                     <th className="p-2 text-middle">{t('users.name', lang)}</th>
                     <th className="p-2 text-middle">{t('users.roles', lang)}</th>
                     <th className="p-2 text-middle">{t('users.auth', lang)}</th>
                    <th className="p-2 text-middle"></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-t">
                      <td className="p-2 align-middle">{u.id}</td>
                      <td className="p-2 align-middle">{u.displayName || u.firstName || u.id}</td>
                      <td className="p-2 align-middle">
                        <div className="flex items-center gap-2">
                          <span className="text-xs">{(u.roles || []).join(', ') || 'aucun role'}</span>
                          <button
                            onClick={() => {
                              setSelectedUserForRoles(u);
                              setUserRolesModal(true);
                            }}
                            disabled={!isAdmin}
                            className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 text-xs"
                            title="Assigner des rôles"
                          >
                            <Shield size={14} />
                          </button>
                        </div>
                      </td>
                      <td className="p-2 align-middle">
                        <div className="flex items-center gap-2">
                          <select
                            value={u.authMode || 'local'}
                            onChange={async (e) => {
                              const m = e.target.value;
                              await authService.updateUser(u.id, { ...u, authMode: m });
                              loadUsers();
                            }}
                            disabled={!isAdmin}
                            className="p-1 border rounded text-sm bg-white"
                          >
                            <option value="local">{t('users.local', lang)}</option>
                            <option value="sso">SSO</option>
                          </select>
                          {(u.authMode||'local') === 'sso' && (
                            <select
                              value={u.idp || 'entra'}
                              onChange={async (e)=>{ await authService.updateUser(u.id, { ...u, authMode: 'sso', idp: e.target.value }); loadUsers(); }}
                              disabled={!isAdmin}
                              className="p-1 border rounded text-sm bg-white"
                              title="Fournisseur SSO"
                            >
                              <option value="entra">EntraID</option>
                              <option value="cognito">Cognito</option>
                              <option value="okta">Okta</option>
                              <option value="google">Google</option>
                              <option value="generic">OIDC</option>
                            </select>
                          )}
                        </div>
                      </td>
                      <td className="p-2 align-middle text-right">
                        {isAdmin && (
                          <button
                            className="inline-flex items-center space-x-1 text-red-600 hover:text-red-700"
                            onClick={async () => {
                              await authService.deleteUser(u.id);
                              loadUsers();
                            }}
                          >
                            <Trash2 size={14} />
                             <span>{t('users.delete', lang)}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {isAdmin && (
      <Card className="border-t-4 border-t-amber-500">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Award className="text-amber-600" size={24} />
          </div>
          <div className="flex-1">
             <h3 className="text-lg font-bold text-slate-800">{t('users.applicationRoles', lang)}</h3>
             <p className="text-sm text-slate-500">{t('users.defineRoles', lang)}</p>
          </div>
          <button
            onClick={async () => {
              // Persist with explicit override to avoid relying on async setState
              await handleSaveConfig(null, { appRoles: roles });
              // Update local config for immediate UI consistency
              setConfig(prev => ({ ...prev, appRoles: roles }));
            }}
            className="inline-flex items-center space-x-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm"
          >
            <Shield size={16} />
             <span>{t('users.saveRoles', lang)}</span>
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {roles.map((role, idx) => (
              <div key={idx} className="inline-flex items-center space-x-2 bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-lg">
                <Award size={14} className="text-amber-600" />
                <span className="text-sm font-medium text-slate-700">{role}</span>
                <button
                  onClick={() => setRoles(roles.filter((_, i) => i !== idx))}
                  className="text-slate-400 hover:text-red-600 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center space-x-2 pt-2 border-t border-slate-200">
            <input
              type="text"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && newRole.trim()) {
                  if (!roles.includes(newRole.trim())) {
                    setRoles([...roles, newRole.trim()]);
                  }
                  setNewRole('');
                }
              }}
              placeholder={t('users.newRoleName', lang)}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm"
            />
            <button
              onClick={() => {
                if (newRole.trim() && !roles.includes(newRole.trim())) {
                  setRoles([...roles, newRole.trim()]);
                  setNewRole('');
                }
              }}
              className="inline-flex items-center space-x-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              <Plus size={16} />
               <span>{t('users.addRole', lang)}</span>
            </button>
          </div>

          <p className="text-xs text-slate-500">
             {t('users.rolesInfo', lang)}
           </p>
        </div>
      </Card>
      )}
    </div>
  );
}
