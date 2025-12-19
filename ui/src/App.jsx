// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (c) 2025 OurITRes

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Shield, BarChart2, Network, CheckCircle, Brain, Settings, ChevronRight, AlertTriangle, Users, Globe, Radar, Compass, LayoutDashboard, ScanEye, ScanSearch, Cable, ArrowDown, ArrowDownUp, Upload } from 'lucide-react';

import { useAppState, useRemediationActions, useConfig, useMLSimulation } from './hooks';
import { t } from './i18n';
import * as authService from './services/auth';
import './styles/App.css';

import Login from './components/Login';
import Register from './components/Register';
import Callback from './pages/Callback';
import { AWSStatusIndicator } from './components/AWSStatusIndicator';

import DashboardPage from './pages/Dashboard';
import RemediationPage from './pages/Remediation';
import DetailsPage from './pages/Details';
import MLPage from './pages/ML';
import ConnectorsPage from './pages/Connectors';
import ProfilePage from './pages/Profile';
import CompliancePage from './pages/Compliance';
import PingcastlePage from './pages/Pingcastle';
import BloodhoundPage from './pages/Bloodhound';
import RosettaPage from './pages/Rosetta';
import AutomationPage from './pages/Automation';
import UsersPage from './pages/Users';
import LanguagesPage from './pages/Languages';
import UploadPage from './pages/Upload';

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

  const lang = config?.language || 'fr';

  const loadUsers = async () => {
    try {
      const res = await authService.getUsers();
      const list = Array.isArray(res) ? res : res?.users || res?.data || [];
      setUsers(list || []);
    } catch (e) {
      console.error('Failed to load users', e);
      setUsers([]);
    }
  };

  const getDefaultDisplayName = useCallback(() => config?.defaultUserName || 'Jean Sécurité', [config]);

  const [currentUser, setCurrentUser] = useState({
    id: 'local',
    displayName: getDefaultDisplayName(),
    roles: ['admin'],
  });

  const effectiveCurrentUser = useMemo(
    () => ({ ...currentUser, displayName: currentUser.displayName || getDefaultDisplayName() }),
    [currentUser, getDefaultDisplayName]
  );

  const [authenticatedUser, setAuthenticatedUser] = useState(() => {
    try {
      const raw = sessionStorage.getItem('adsec_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [users, setUsers] = useState([]);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    if (authenticatedUser) {
      sessionStorage.setItem('adsec_user', JSON.stringify(authenticatedUser));
    } else {
      sessionStorage.removeItem('adsec_user');
    }
  }, [authenticatedUser]);

  useEffect(() => {
    if (activeView === 'connectors' || activeView === 'userspage') {
      loadUsers();
    }
  }, [activeView, loadUsers]);

  const getInitials = (fallbackName) => {
    const fn = (authenticatedUser && authenticatedUser.firstName) || (effectiveCurrentUser && effectiveCurrentUser.firstName) || '';
    const ln = (authenticatedUser && authenticatedUser.lastName) || (effectiveCurrentUser && effectiveCurrentUser.lastName) || '';
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
    currentUser: effectiveCurrentUser,
    setCurrentUser,
    getInitials,
    authService,
  };

  // Check if we're on the OAuth callback route
  if (window.location.pathname === '/callback') {
    return (
      <Callback
        onAuth={(result) => {
          // Store user info from Cognito
          setAuthenticatedUser({
            id: result.user.sub,
            email: result.user.email,
            displayName: result.user.email.split('@')[0],
            idToken: result.idToken,
          });
          setActiveView('dashboard');
          // Replace the URL to remove callback params
          window.history.replaceState({}, document.title, '/');
        }}
      />
    );
  }

  if (!authenticatedUser) {
    return (
      <Login
        onAuth={(result) => {
          // Handle both local server and Cognito formats
          if (result.user && result.user.sub) {
            // Cognito format
            setAuthenticatedUser({
              id: result.user.sub,
              email: result.user.email,
              displayName: result.user.email.split('@')[0],
              idToken: result.idToken,
            });
          } else {
            // Local server format
            setAuthenticatedUser(result);
          }
          setActiveView('dashboard');
        }}
        appName={config.appName}
        appSuffix={config.appSuffix}
        appSubtitle={t('app.subtitle', lang)}
        lang={lang}
      />
    );
  }

  if (activeView === 'register') {
    return (
      <Register
        onDone={async () => {
          await loadUsers();
          setActiveView('connectors');
        }}
        appName={config.appName}
        appSuffix={config.appSuffix}
        appSubtitle={t('app.subtitle', lang)}
        lang={lang}
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

        <div className="flex-1 py-1 px-4 space-y-0.5 overflow-y-auto">
          <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('app.operations', lang)}</p>
          {[
            { id: 'dashboard', icon: LayoutDashboard , label: t('menu.command', lang) },
            { id: 'details', icon: Network, label: t('menu.details', lang) },
            { id: 'remediation', icon: CheckCircle, label: t('menu.remediation', lang) },
            { id: 'ml', icon: Brain, label: t('menu.ml', lang) },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-1.5 rounded-lg transition-all duration-200 group ${
                activeView === item.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <item.icon size={20} className={activeView === item.id ? 'text-white' : 'text-slate-500 group-hover:text-white'} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}

          <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mt-8 mb-2">{t('app.compliance', lang)}</p>
          <button
            onClick={() => setActiveView('compliance')}
            className={`w-full flex items-center space-x-3 px-4 py-1.5 rounded-lg transition-all duration-200 group ${
              activeView === 'compliance' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Radar size={20} className={activeView === 'compliance' ? 'text-white' : 'text-slate-500 group-hover:text-white'} />
            <span className="font-medium">{t('menu.compliance', lang)}</span>
          </button>
          
          {/* PingCastle avec Upload XML en sous-élément */}
          <button
            onClick={() => setActiveView('pingcastle')}
            className={`w-full flex items-center space-x-3 px-4 py-1.5 rounded-lg transition-all duration-200 group ${
              activeView === 'pingcastle' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <ScanSearch size={20} className={activeView === 'pingcastle' ? 'text-white' : 'text-slate-500 group-hover:text-white'} />
            <span className="font-medium">{t('menu.pingcastle', lang)}</span>
          </button>
          
          {/* Upload XML sous PingCastle - affichage plus petit */}
          <button
            onClick={() => setActiveView('upload')}
            className={`w-full flex items-center space-x-2 pl-11 pr-3 py-1 rounded-lg transition-all duration-200 group ${
              activeView === 'upload' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Upload size={16} className={activeView === 'upload' ? 'text-white' : 'text-slate-500 group-hover:text-white'} />
            <span className="text-sm">Upload XML</span>
          </button>
          
          {[
            { id: 'bloodhound', icon: ScanEye, label: t('menu.bloodhound', lang) },
            { id: 'rosetta', icon: Compass, label: t('menu.rosetta', lang) },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-1.5 rounded-lg transition-all duration-200 group ${
                activeView === item.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <item.icon size={20} className={activeView === item.id ? 'text-white' : 'text-slate-500 group-hover:text-white'} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}

          <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mt-8 mb-2">{t('app.settings', lang)}</p>
          {[
            { id: 'automation', icon: ArrowDownUp, label: t('menu.automation', lang) },
            { id: 'connectors', icon: Cable, label: t('menu.connectors', lang) },
            { id: 'userspage', icon: Users, label: t('menu.users', lang) },
            { id: 'languages', icon: Globe, label: t('menu.languages', lang) },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-1 rounded-lg transition-all duration-200 group ${
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
              {((authenticatedUser && authenticatedUser.profileIcon) || effectiveCurrentUser.profileIcon) ? (
                <img
                  src={(authenticatedUser && authenticatedUser.profileIcon) || effectiveCurrentUser.profileIcon}
                  alt="avatar"
                  className="w-10 h-10 rounded-full object-cover"
                  style={{
                    objectPosition: `${(authenticatedUser && authenticatedUser.profileIconPosition?.x) || 50}% ${(authenticatedUser && authenticatedUser.profileIconPosition?.y) || 50}%`
                  }}
                />
              ) : (
                getInitials(
                  (authenticatedUser && authenticatedUser.displayName) ||
                    effectiveCurrentUser.displayName ||
                    (authenticatedUser && authenticatedUser.id) ||
                    effectiveCurrentUser.id
                )
              )}
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-bold text-white truncate">
                {(authenticatedUser && authenticatedUser.displayName) || effectiveCurrentUser.displayName}
              </span>
              <span className="text-xs text-slate-400 truncate">
                {(() => {
                  const businessRole = (authenticatedUser && authenticatedUser.businessRole) || effectiveCurrentUser.businessRole;
                  const appRoles = (authenticatedUser && authenticatedUser.roles) || effectiveCurrentUser.roles || [];
                  const appRole = appRoles.length > 0 ? appRoles[0] : 'user';
                  return businessRole ? `${businessRole.toUpperCase()} __ ${appRole}` : appRole;
                })()}
              </span>
            </div>
            <button
              onClick={() => setActiveView('profile')}
              className="flex-shrink-0 text-slate-500 hover:text-white hover:bg-slate-700 rounded p-1 transition-colors"
              title={t('app.profileAccess', lang)}
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
                  {t('app.myProfile', lang)}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setUserMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-600/20 hover:text-red-300 rounded-b-lg border-t border-slate-700"
                >
                  {t('app.logout', lang)}
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
              <span>{t('app.operations', lang)}</span>
              <ChevronRight size={14} />
              <span className="text-slate-800 font-medium capitalize">
                {activeView === 'ml' ? t('breadcrumb.ml', lang)
                : activeView === 'upload' ? 'Upload XML'
                : activeView === 'connectors' ? t('breadcrumb.connectors', lang)
                : activeView === 'compliance' ? t('breadcrumb.compliance', lang)
                : activeView === 'pingcastle' ? t('breadcrumb.pingcastle', lang)
                : activeView === 'bloodhound' ? t('breadcrumb.bloodhound', lang)
                : activeView === 'rosetta' ? t('breadcrumb.rosetta', lang)
                : activeView === 'automation' ? t('breadcrumb.automation', lang)
                : activeView === 'userspage' ? t('breadcrumb.users', lang)
                : activeView === 'languages' ? t('breadcrumb.languages', lang)
                : activeView === 'profile' ? t('breadcrumb.profile', lang)
                : activeView}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-800">
              {activeView === 'dashboard' && t('pageTitle.dashboard', lang)}
              {activeView === 'upload' && 'Upload PingCastle XML'}
              {activeView === 'details' && t('pageTitle.details', lang)}
              {activeView === 'ml' && t('pageTitle.ml', lang)}
              {activeView === 'remediation' && t('pageTitle.remediation', lang)}
              {activeView === 'connectors' && t('pageTitle.connectors', lang)}
              {activeView === 'compliance' && t('pageTitle.compliance', lang)}
              {activeView === 'pingcastle' && t('pageTitle.pingcastle', lang)}
              {activeView === 'bloodhound' && t('pageTitle.bloodhound', lang)}
              {activeView === 'rosetta' && t('pageTitle.rosetta', lang)}
              {activeView === 'automation' && t('pageTitle.automation', lang)}
              {activeView === 'userspage' && t('pageTitle.users', lang)}
              {activeView === 'languages' && t('pageTitle.languages', lang)}
              {activeView === 'profile' && t('pageTitle.profile', lang)}
            </h2>
          </div>

          <div className="flex items-center space-x-4">
            <AWSStatusIndicator config={config} />
            <div className="hidden md:flex items-center px-3 py-1.5 bg-slate-100 rounded-lg text-sm font-medium text-slate-600 border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
              PingCastle: {t('app.syncedAgo', lang)}
            </div>
            <button className="p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200 relative" title={t('app.securityAlerts', lang)} aria-label={t('app.securityAlerts', lang)}>
              <AlertTriangle size={20} />
              <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        {activeView === 'dashboard' && <DashboardPage ctx={ctx} />}
        {activeView === 'upload' && <UploadPage ctx={ctx} />}
        {activeView === 'details' && <DetailsPage ctx={ctx} />}
        {activeView === 'remediation' && <RemediationPage ctx={ctx} />}
        {activeView === 'ml' && <MLPage ctx={ctx} />}
        {activeView === 'connectors' && <ConnectorsPage ctx={ctx} />}
        {activeView === 'compliance' && <CompliancePage ctx={ctx} />}
        {activeView === 'pingcastle' && <PingcastlePage ctx={ctx} />}
        {activeView === 'bloodhound' && <BloodhoundPage ctx={ctx} />}
        {activeView === 'rosetta' && <RosettaPage ctx={ctx} />}
        {activeView === 'automation' && <AutomationPage ctx={ctx} />}
        {activeView === 'userspage' && <UsersPage ctx={ctx} />}
        {activeView === 'languages' && <LanguagesPage ctx={ctx} />}
        {activeView === 'profile' && <ProfilePage ctx={ctx} />}
        
        <footer className="mt-8 pb-4 text-center text-xs text-slate-500">
          <a href="https://github.com/OurITRes/ad-cyberwatch.ai" target="_blank" rel="noopener noreferrer" className="hover:text-slate-700 underline">
            Source code
          </a>
        </footer>
      </main>
    </div>
  );
}
