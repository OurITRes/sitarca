import React, { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';
import * as authService from '../services/auth';
import Register from './Register';
import { t } from '../i18n';

export default function Login({ onAuth, appName = 'CyberWatch', appSuffix = '.AI', lang = 'fr' }) {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fallback, setFallback] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    // quick reachability check to determine if backend is reachable
    let mounted = true;
    (async () => {
      try {
        const res = await authService.getUsers();
        if (!mounted) return;
        const list = Array.isArray(res) ? res : ((res && res.users) || []);
        setFallback(list.length === 0);
      } catch {
        if (!mounted) return;
        setFallback(true);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const isValidId = (v) => {
    if (!v) return false;
    // Accept email-like (user@domain) or UPN with backslash (DOMAIN\\user)
    return v.includes('@') || v.indexOf('\\') !== -1;
  };

  const handleLocalLogin = async () => {
    setError('');
    if (!isValidId(id) || !password) return setError('Entrez un email/UPN valide et un mot de passe');
    setLoading(true);
    try {
      const res = await authService.login(id, password);
      onAuth(res);
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleSSO = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await authService.startSSO();
      if (res && res.user) {
        onAuth(res.user);
      } else {
        alert('SSO started (stub): ' + JSON.stringify(res));
      }
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  if (showRegister) return <Register onDone={() => setShowRegister(false)} appName={appName} appSuffix={appSuffix} lang={lang} />;

  return (
    <div className="min-h-screen flex items-start justify-center bg-slate-50 py-12">
      <div className="w-full max-w-3xl p-6">
        <header className="mb-6 flex flex-col items-center text-center">
          <div className="p-3 bg-gradient-to-br from-indigo-700 to-slate-900 rounded-full text-white shadow-lg mb-3">
            <Shield size={28} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-sky-400">{appName}{appSuffix}</span>
            <span className="ml-3 text-sm text-slate-600">— Plateforme de Défense AD</span>
          </h1>
        </header>

        <div className="bg-white rounded shadow p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded bg-white">
              <h3 className="text-lg font-bold mb-4">Connexion locale</h3>
              <div className="space-y-2">
                <input placeholder={t('login.email', lang)} value={id} onChange={e => setId(e.target.value)} className="w-full p-2 border rounded" />
                <input placeholder={t('login.password', lang)} value={password} onChange={e => setPassword(e.target.value)} type="password" className="w-full p-2 border rounded" />
                <button onClick={handleLocalLogin} disabled={loading} className="w-full py-2 bg-indigo-600 text-white rounded">Se connecter</button>
              </div>

              <hr className="my-4" />

              <div className="text-sm text-slate-600">
                <p>Vous n'avez pas de compte local ? <button className="text-blue-600 underline" onClick={() => setShowRegister(true)}>Créer un utilisateur</button></p>
              </div>
            </div>

            <div className="p-6 rounded">
              {fallback && (
                <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded">
                  Serveur d'authentification indisponible — l'application utilisera la configuration locale (fallback).
                </div>
              )}
              <div>
                <h3 className="text-lg font-bold mb-4">Single Sign-On (SSO)</h3>
                <p className="text-sm text-slate-600 mb-4">Utilisez votre fournisseur d'identité d'entreprise (Azure AD, Okta, Keycloak...). Ceci est un stub local.</p>
                <button onClick={handleSSO} disabled={loading} className="w-full py-2 bg-blue-600 text-white rounded">Se connecter via SSO</button>
              </div>

              <div className="text-xs text-slate-400 mt-6">
                <p>Si le serveur SSO n'est pas disponible, créez un compte local via la page de création.</p>
              </div>
            </div>

            {error && <div className="col-span-2 text-red-600 mt-2">{error}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
