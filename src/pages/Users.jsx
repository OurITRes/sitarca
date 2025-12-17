import React, { useEffect, useState } from 'react';
import { Card } from '../components';
import { Users, RefreshCw, Plus, Shield, ShieldCheck, Trash2, Award, X } from 'lucide-react';
import { t } from '../i18n';

export default function UsersPage({ ctx }) {
  const { users = [], loadUsers, setActiveView, authService, config, setConfig, handleSaveConfig, authenticatedUser } = ctx;
  const lang = config?.language || 'fr';
  const isAdmin = (authenticatedUser?.roles || []).includes('admin');
  const [roles, setRoles] = useState(config?.appRoles || ['admin', 'analyst', 'viewer']);
  const [newRole, setNewRole] = useState('');

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            onClick={() => setActiveView('register')}
            className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm"
          >
            <Plus size={16} />
             <span>{t('users.create', lang)}</span>
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
      <Card className="border-t-4 border-t-blue-500">
        <div className="p-4">
          <h3 className="text-lg font-bold text-slate-800 mb-3">{t('users.usersList', lang)}</h3>
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
                      <td className="p-2 align-middle">{(u.roles || []).join(', ')}</td>
                      <td className="p-2 align-middle">
                        <select
                          value={u.authMode || 'local'}
                          onChange={async (e) => {
                            const m = e.target.value;
                            await authService.updateUser(u.id, { ...u, authMode: m });
                            loadUsers();
                          }}
                          className="p-1 border rounded text-sm bg-white"
                        >
                          <option value="local">{t('users.local', lang)}</option>
                          <option value="sso">SSO</option>
                        </select>
                      </td>
                      <td className="p-2 align-middle text-right">
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
      )}

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
              await setConfig({...config, appRoles: roles});
              await handleSaveConfig();
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
