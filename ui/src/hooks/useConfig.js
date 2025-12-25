import { useState, useEffect } from 'react';
import { APP_CONFIG } from '../config';

const API_URL = import.meta.env.VITE_API_URL;

export const useConfig = () => {
  const [config, setConfig] = useState({
    appName: APP_CONFIG.appName,
    appSuffix: APP_CONFIG.appSuffix,
    appSubtitle: APP_CONFIG.appSubtitle,
    language: APP_CONFIG.defaultLanguage || 'fr',
    defaultLanguage: APP_CONFIG.defaultLanguage || 'fr',
    ssoAutoCreateUsers: false,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [supportedLanguages, setSupportedLanguages] = useState(APP_CONFIG.supportedLanguages || ['fr', 'en']);

  // Load config from server on mount
  useEffect(() => {
    fetch(`${API_URL}/public/config`)
      .then(res => res.json())
      .then(data => {
        if (data.config) {
          setConfig(prev => ({ ...prev, ...data.config }));
        }
        if (data.supportedLanguages) {
          setSupportedLanguages(data.supportedLanguages);
        }
      })
      .catch(() => {
        // ignore server errors, use defaults
      });
  }, []);

  const addSupportedLanguage = (lang) => {
    const code = String(lang || '').trim().toLowerCase();
    if (!code) return false;
    setSupportedLanguages((prev) => {
      if (prev.includes(code)) return prev;
      return [...prev, code];
    });
    return true;
  };



  const handleSaveConfig = (e, overrideConfig) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsSaving(true);

    const payloadConfig = overrideConfig ? { ...config, ...overrideConfig } : config;

    // Persist to server endpoint
    fetch(`${API_URL}/public/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: payloadConfig, supportedLanguages })
    })
      .catch(() => {
        // ignore server errors
      })
      .finally(() => {
        setTimeout(() => setIsSaving(false), 700);
      });
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
