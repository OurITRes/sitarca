import React, { useState } from 'react';
import { getSelectedEnv, setSelectedEnv } from '../services/api';

export default function EnvironmentSwitcher() {
  const [env, setEnv] = useState(getSelectedEnv());
  const [envs] = useState(() => {
    try {
      const raw = localStorage.getItem('cw.envs');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  if (!envs || envs.length === 0) return null;

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <span style={{ fontSize: 12, opacity: 0.8 }}>Env</span>
      <select
        value={env}
        onChange={(e) => {
          const next = e.target.value;
          setEnv(next);
          setSelectedEnv(next);
          // simple et efficace : on reload pour que tous les hooks reprennent la bonne env
          window.location.reload();
        }}
        style={{ padding: '6px 8px', borderRadius: 8 }}
      >
        {envs.map((x) => (
          <option key={x.id} value={x.id}>
            {x.label || x.id}
          </option>
        ))}
      </select>
    </div>
  );
}
