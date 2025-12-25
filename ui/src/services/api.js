export const API_BASE = import.meta.env.VITE_API_URL || `${window.location.origin}/api`;

// MVP: env selection par localStorage (tu pourras ajouter un écran plus tard)
export const DEFAULT_ENV = 'prod';
export const getSelectedEnv = () => localStorage.getItem('cw.env') || DEFAULT_ENV;
export const setSelectedEnv = (env) => localStorage.setItem('cw.env', env);

const join = (base, path) => `${base}${path.startsWith('/') ? path : `/${path}`}`;

export const controlUrl = (path) => join(API_BASE, path);
export const dataUrl = (path, env = getSelectedEnv()) => join(API_BASE, `/data/${encodeURIComponent(env)}${path.startsWith('/') ? path : `/${path}`}`);
