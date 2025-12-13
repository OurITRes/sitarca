import { useState, useEffect } from 'react';
import { APP_CONFIG } from '../config';

export const useConfig = () => {
  const [config, setConfig] = useState({
    // app display values
    appName: APP_CONFIG.appName,
    appSuffix: APP_CONFIG.appSuffix,
    appSubtitle: APP_CONFIG.appSubtitle,
    // localization
    language: APP_CONFIG.defaultLanguage || 'fr',
    defaultLanguage: APP_CONFIG.defaultLanguage || 'fr',

    // data/connectors
    bhUrl: 'https://bloodhound.corp.internal',
    bhToken: '********************',
    pcReportPath: 'C:\\Reports\\PingCastle\\',
    pcCatalogPath: 'C:\\PingCastle\\Rules\\Catalog.xml',
    nistEnabled: true,
    cisEnabled: true,
    customEnabled: true,
    jiraUrl: 'https://jira.company.com',
    jiraUser: 'svc_cyberwatch',
    jiraToken: '********************',
    jiraProject: 'SEC',
    snUrl: 'https://company.service-now.com',
    snUser: 'mid_server_user',
    snToken: '********************',
    autoApprovalThreshold: 'Low',
    defaultAssignee: 'SOC_L1',
    requireCabApproval: true
  });

  const [isSaving, setIsSaving] = useState(false);
  // supported languages list (editable)
  const [supportedLanguages, setSupportedLanguages] = useState(() => {
    try {
      const saved = localStorage.getItem('adcw_supportedLanguages');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return APP_CONFIG.supportedLanguages || ['fr', 'en'];
  });

  const addSupportedLanguage = (lang) => {
    const code = String(lang || '').trim().toLowerCase();
    if (!code) return false;
    setSupportedLanguages((prev) => {
      if (prev.includes(code)) return prev;
      const next = [...prev, code];
      try { localStorage.setItem('adcw_supportedLanguages', JSON.stringify(next)); } catch(e){}
      return next;
    });
    return true;
  };

  // load saved config from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('adcw_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        setConfig((prev) => ({ ...prev, ...parsed }));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const handleSaveConfig = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsSaving(true);
    try {
      localStorage.setItem('adcw_config', JSON.stringify(config));
      localStorage.setItem('adcw_supportedLanguages', JSON.stringify(supportedLanguages));
    } catch (err) {
      // ignore localStorage errors
    }

    // Try to persist to a simple server endpoint if available (temporary backend)
    // This will not block the UI; failure is ignored.
    try {
      fetch('http://127.0.0.1:3001/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, supportedLanguages })
      }).catch(() => {});
    } catch (err) {}

    setTimeout(() => setIsSaving(false), 700);
  };

  return {
    config,
    setConfig,
    supportedLanguages,
    addSupportedLanguage,
    isSaving,
    handleSaveConfig,
  };
};
