const TRANSLATIONS = {
  en: {
    'app.subtitle': 'AD Defense Platform',
    'settings.title': 'Settings & Connectors',
    'settings.save': 'Save',
    'settings.appNameLabel': 'Application Name',
    'settings.languageLabel': 'Language',
    'settings.appNamePlaceholder': 'Enter application name',
    'menu.operations': 'Operations',
    'menu.command': 'Command Center',
    'menu.details': 'Investigation & Graph',
    'menu.remediation': 'Remediation Plan',
    'menu.ml': 'AI Engine & Model'
  },
  fr: {
    'app.subtitle': 'Plateforme de Défense AD',
    'settings.title': 'Paramètres & Connecteurs',
    'settings.save': 'Sauvegarder',
    'settings.appNameLabel': "Nom de l'application",
    'settings.languageLabel': 'Langue',
    'settings.appNamePlaceholder': "Entrez le nom de l'application",
    'menu.operations': 'Opérations',
    'menu.command': 'Command Center',
    'menu.details': 'Investigation & Graphe',
    'menu.remediation': 'Plan de Remédiation',
    'menu.ml': 'Moteur IA & Modèle'
  }
};

export const SUPPORTED_LANGUAGES = ['en', 'fr'];

export function t(key, lang = 'fr') {
  const bundle = TRANSLATIONS[lang] || TRANSLATIONS['fr'];
  return bundle[key] || key;
}

export default {
  t,
  SUPPORTED_LANGUAGES,
  TRANSLATIONS
};
