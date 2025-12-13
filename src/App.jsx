import React, { useEffect, useState } from 'react';
import { Shield, BarChart2, Network, CheckCircle, Brain, Settings, ChevronRight, AlertTriangle } from 'lucide-react';

import { useAppState, useRemediationActions, useConfig, useMLSimulation } from './hooks';
import { t } from './i18n';
import * as authService from './services/auth';
import './styles/App.css';

import Login from './components/Login';
import Register from './components/Register';

import DashboardPage from './pages/Dashboard';
import RemediationPage from './pages/Remediation';
import DetailsPage from './pages/Details';
import MLPage from './pages/ML';
import SettingsPage from './pages/Settings';
import ProfilePage from './pages/Profile';

export default function AdSecurityOpsCenter() {
  const {
    activeView,
    setActiveView,
    adaptiveMode,
    setAdaptiveMode,
    complianceScore,
    selectedRisk,
    setSelectedRisk,
    remediationValidated,
    setRemediationValidated,
    remediationPlan,
    setRemediationPlan,
    remediationViewMode,
    setRemediationViewMode,
  } = useAppState();

  const { updateRemediationItem } = useRemediationActions(remediationPlan, setRemediationPlan);
  const { config, setConfig, handleSaveConfig, isSaving, supportedLanguages, addSupportedLanguage } = useConfig();
  const { isSimulating, runSimulation } = useMLSimulation(setAdaptiveMode);

  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [users, setUsers] = useState([]);

  const loadUsers = async () => {
    try {
      const res = await authService.listUsers();
      const list = Array.isArray(res) ? res : res?.users || res?.data || [];
      setUsers(list || []);
    } catch (e) {
      console.error('Failed to load users', e);
      setUsers([]);
    }
  };

  const getDefaultDisplayName = () => config?.defaultUserName || 'Jean Sécurité';

  const [currentUser, setCurrentUser] = useState({
    id: 'local',
    displayName: getDefaultDisplayName(),
    roles: ['admin'],
  });

  const [authenticatedUser, setAuthenticatedUser] = useState(() => {
    try {
      const raw = sessionStorage.getItem('adsec_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (authenticatedUser) {
      sessionStorage.setItem('adsec_user', JSON.stringify(authenticatedUser));
    } else {
      sessionStorage.removeItem('adsec_user');
    }
  }, [authenticatedUser]);

  useEffect(() => {
    setCurrentUser((u) => ({ ...u, displayName: getDefaultDisplayName() }));
  }, [config?.defaultUserName]);

  useEffect(() => {
    if (activeView === 'settings') {
      loadUsers();
    }
  }, [activeView]);

  const getInitials = (fallbackName) => {
    const fn = (authenticatedUser && authenticatedUser.firstName) || (currentUser && currentUser.firstName) || '';
    const ln = (authenticatedUser && authenticatedUser.lastName) || (currentUser && currentUser.lastName) || '';
    const a = (fn || '').trim();
    const b = (ln || '').trim();
    if (a || b) return ((a ? a[0] : '') + (b ? b[0] : '')).toUpperCase();
    if (!fallbackName) return '';
    let s = String(fallbackName || '');
    if (s.includes('@')) s = s.split('@')[0];
    s = s.replace(/[^A-Za-z0-9]+/g, ' ').trim();
    const parts = s.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const handleLogout = () => {
    setAuthenticatedUser(null);
    setActiveView('dashboard');
  };

  const ctx = {
    activeView,
    setActiveView,
    adaptiveMode,
    setAdaptiveMode,
    complianceScore,
    selectedRisk,
    setSelectedRisk,
    remediationValidated,
    setRemediationValidated,
    remediationPlan,
    setRemediationPlan,
    remediationViewMode,
    setRemediationViewMode,
    updateRemediationItem,
    config,
    setConfig,
    handleSaveConfig,
    isSaving,
    supportedLanguages,
    addSupportedLanguage,
    isSimulating,
    runSimulation,
    users,
    setUsers,
    loadUsers,
    authenticatedUser,
    setAuthenticatedUser,
    currentUser,
    setCurrentUser,
    getInitials,
    authService,
  };

  if (!authenticatedUser) {
    return (
      <Login
        onAuth={(user) => {
          setAuthenticatedUser(user);
          setActiveView('dashboard');
        }}
        appName={config.appName}
        appSuffix={config.appSuffix}
        appSubtitle={t('app.subtitle', config.language)}
      />
    );
  }

  if (activeView === 'register') {
    return (
      <Register
        onDone={async () => {
          await loadUsers();
          setActiveView('settings');
        }}
        appName={config.appName}
        appSuffix={config.appSuffix}
        appSubtitle={t('app.subtitle', config.language)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex">
      <aside className="fixed left-0 top-0 bottom-0 w-72 bg-slate-900 text-slate-300 flex flex-col z-20 shadow-2xl">
        <div className="p-6 flex items-center space-x-3 border-b border-slate-800 bg-slate-950">
          <Shield className="text-indigo-500" size={32} />
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-lg font-bold text-white tracking-tight leading-none">
                {config.appName}
                <span className="text-indigo-500">{config.appSuffix || '.AI'}</span>
              </h1>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-slate-500">{t('app.subtitle', config.language)}</span>
          </div>
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen((v) => !v)}
              className="ml-2 px-2 py-0.5 bg-slate-800 text-white rounded text-xs font-semibold"
              aria-label="language"
            >
              {(config.language || 'fr').toUpperCase()}
            </button>
            {langMenuOpen && (
              <div className="absolute right-0 mt-2 w-28 bg-white border border-slate-200 rounded shadow-lg z-50">
                {supportedLanguages.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      setConfig({ ...config, language: lang });
                      setLangMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100"
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Opérations</p>
          {[
            { id: 'dashboard', icon: BarChart2, label: 'Command Center' },
            { id: 'details', icon: Network, label: 'Investigation & Graphe' },
            { id: 'remediation', icon: CheckCircle, label: 'Plan de Remédiation' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                activeView === item.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <item.icon size={20} className={activeView === item.id ? 'text-white' : 'text-slate-500 group-hover:text-white'} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}

          <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mt-8 mb-2">Intelligence</p>
          {[
            { id: 'ml', icon: Brain, label: 'Moteur IA & Modèle' },
            { id: 'settings', icon: Settings, label: 'Paramètres & Connecteurs' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                activeView === item.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <item.icon size={20} className={activeView === item.id ? 'text-white' : 'text-slate-500 group-hover:text-white'} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950">
          <div className="flex items-center space-x-2 hover:bg-slate-800 rounded-lg p-2 transition-colors relative">
            <div
              className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0 cursor-pointer"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              {((authenticatedUser && authenticatedUser.profileIcon) || currentUser.profileIcon) ? (
                <img
                  src={(authenticatedUser && authenticatedUser.profileIcon) || currentUser.profileIcon}
                  alt="avatar"
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                getInitials(
                  (authenticatedUser && authenticatedUser.displayName) ||
                    currentUser.displayName ||
                    (authenticatedUser && authenticatedUser.id) ||
                    currentUser.id
                )
              )}
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-bold text-white truncate">
                {(authenticatedUser && authenticatedUser.displayName) || currentUser.displayName}
              </span>
              <span className="text-xs text-slate-500 truncate">
                {(() => {
                  const role = (authenticatedUser && authenticatedUser.businessRole) || currentUser.businessRole;
                  return role ? role : 'Local Admin';
                })()}
              </span>
            </div>
            <button
              onClick={() => setActiveView('profile')}
              className="flex-shrink-0 text-slate-500 hover:text-white hover:bg-slate-700 rounded p-1 transition-colors"
              title="Accéder au profil"
            >
              <span className="text-lg font-bold">⋯</span>
            </button>
            {userMenuOpen && (
              <div className="absolute bottom-full left-4 right-4 mb-2 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-50">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setUserMenuOpen(false);
                    setActiveView('profile');
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white rounded-t-lg"
                >
                  Mon Profil
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setUserMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-600/20 hover:text-red-300 rounded-b-lg border-t border-slate-700"
                >
                  Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className="ml-72 flex-1 p-8 pb-20">
        <header className="mb-8 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200 sticky top-4 z-10">
          <div>
            <div className="flex items-center space-x-2 text-slate-400 text-sm mb-1">
              <span>Opérations</span>
              <ChevronRight size={14} />
              <span className="text-slate-800 font-medium capitalize">
                {activeView === 'ml'
                  ? 'Intelligence Artificielle'
                  : activeView === 'settings'
                  ? 'Configuration'
                  : activeView === 'profile'
                  ? 'Profil'
                  : activeView}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-800">
              {activeView === 'dashboard' && "Vue d'Ensemble de la Posture"}
              {activeView === 'details' && 'Investigation & Graphe'}
              {activeView === 'ml' && 'Configuration du Modèle Adaptatif'}
              {activeView === 'remediation' && "Plan d'Amélioration Continue"}
              {activeView === 'settings' && 'Paramètres & Connecteurs'}
              {activeView === 'profile' && 'Mon Profil'}
            </h2>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center px-3 py-1.5 bg-slate-100 rounded-lg text-sm font-medium text-slate-600 border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
              PingCastle: Synced 2h ago
            </div>
            <button className="p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200 relative">
              <AlertTriangle size={20} />
              <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        {activeView === 'dashboard' && <DashboardPage ctx={ctx} />}
        {activeView === 'details' && <DetailsPage ctx={ctx} />}
        {activeView === 'remediation' && <RemediationPage ctx={ctx} />}
        {activeView === 'ml' && <MLPage ctx={ctx} />}
        {activeView === 'settings' && <SettingsPage ctx={ctx} />}
        {activeView === 'profile' && <ProfilePage ctx={ctx} />}
      </main>
    </div>
  );
}
