import React, { useState } from 'react';
import { Shield } from 'lucide-react';
import * as authService from '../services/auth';
import { t } from '../i18n';

export default function Register({ onDone, appName = 'CyberWatch', appSuffix = '.AI', lang = 'fr' }) {
  const [id, setId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [businessRole, setBusinessRole] = useState('');

  const isValidId = (v) => v && (v.includes('@') || v.includes('\\'));

  const handleCreate = async () => {
    setError('');
    if (!isValidId(id) || !password) return setError('Enter a valid email/UPN and password');
    setLoading(true);
    try {
      const user = { id, firstName: firstName || '', lastName: lastName || '', roles: ['user'], authMode: 'local' };
      if (businessRole) user.businessRole = businessRole;
      await authService.createUser({ ...user, password });
      alert('User created. You can now login.');
      if (onDone) onDone();
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-center bg-slate-50 py-12">
      <div className="w-full max-w-md p-6">
        <header className="mb-6 flex flex-col items-center text-center">
          <div className="p-3 bg-gradient-to-br from-indigo-700 to-slate-900 rounded-full text-white shadow-lg mb-3">
            <Shield size={28} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-sky-400">{appName}{appSuffix}</span>
            <span className="ml-2 text-sm text-slate-600">- Plateforme de Defense AD</span>
          </h1>
        </header>

        <div className="bg-white rounded shadow p-6">
          <h3 className="text-lg font-bold mb-4">Create local user</h3>
          <div className="space-y-3">
            <input placeholder={t('register.email', lang)} value={id} onChange={e => setId(e.target.value)} className="w-full p-2 border rounded" />
            <div className="grid grid-cols-2 gap-2">
              <input placeholder={t('register.firstName', lang)} value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full p-2 border rounded" />
              <input placeholder={t('register.lastName', lang)} value={lastName} onChange={e => setLastName(e.target.value)} className="w-full p-2 border rounded" />
            </div>
            <input placeholder={t('register.password', lang)} value={password} onChange={e => setPassword(e.target.value)} type="password" className="w-full p-2 border rounded" />
            <div>
              <label className="text-xs text-slate-500">Business role (optional)</label>
              <select value={businessRole} onChange={e => setBusinessRole(e.target.value)} className="w-full p-2 border rounded mt-1">
                <option value="">-- none --</option>
                <option>CEO</option>
                <option>CTO</option>
                <option>CISO</option>
                <option>VIP</option>
                <option>VP</option>
                <option>APM</option>
                <option>AM</option>
                <option>BO</option>
                <option>PO</option>
                <option>SM</option>
                <option>AD</option>
                <option>AE</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <button onClick={handleCreate} disabled={loading} className="py-2 px-3 bg-green-600 text-white rounded">Create</button>
              <button onClick={() => onDone && onDone()} className="py-2 px-3 bg-slate-200 rounded">Cancel</button>
            </div>
            {error && <div className="text-red-600">{error}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
