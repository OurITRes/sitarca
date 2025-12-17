const API_BASE = 'http://127.0.0.1:3001';

export async function getUsers(){
  try{ const r = await fetch(`${API_BASE}/users`); if (!r.ok) throw new Error('no'); return await r.json(); }catch{ return []; }
}

export async function createUser(user){
  try{
    const r = await fetch(`${API_BASE}/users`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(user) });
    const data = await r.json().catch(()=>null);
    if (!r.ok) throw new Error(data?.message || data?.error || r.statusText || 'create_failed');
    return data;
  }catch(e){
    throw new Error(`createUser failed: ${e.message}`);
  }
}

export async function updateUser(id, user){
  try{
    const r = await fetch(`${API_BASE}/users/${encodeURIComponent(id)}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(user) });
    const data = await r.json().catch(()=>null);
    if (!r.ok) throw new Error(data?.message || data?.error || r.statusText || 'update_failed');
    return data;
  }catch(e){
    throw new Error(`updateUser failed: ${e.message}`);
  }
}

export async function deleteUser(id){
  try{
    const r = await fetch(`${API_BASE}/users/${encodeURIComponent(id)}`, { method: 'DELETE' });
    const data = await r.json().catch(()=>null);
    if (!r.ok) throw new Error(data?.message || data?.error || r.statusText || 'delete_failed');
    return data;
  }catch(e){
    throw new Error(`deleteUser failed: ${e.message}`);
  }
}

export async function getRoles(){
  try{ const r = await fetch(`${API_BASE}/roles`); if (!r.ok) throw new Error('no'); return await r.json(); }catch{ return []; }
}

export async function createRole(role){
  try{ const r = await fetch(`${API_BASE}/roles`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(role) }); return await r.json(); }catch{ return null; }
}

export async function login(id, password){
  try{
    const r = await fetch(`${API_BASE}/auth/login`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({id, password}) });
    const data = await r.json().catch(()=>null);
    if (!r.ok) throw new Error(data?.message || data?.error || r.statusText || 'login_failed');
    // Ensure response contains a displayName; if not, try to enrich from users endpoint
    if (!data?.displayName) {
      try {
        const users = await getUsers();
        const u = Array.isArray(users) ? users.find(x => x.id === id) : (users?.find?.(x => x.id === id));
        if (u && u.displayName) data.displayName = u.displayName;
      } catch {
        /* ignore enrichment errors */
      }
    }
    return data;
  }catch(e){
    throw new Error(`login failed: ${e.message}`);
  }
}

export async function startSSO(){
  try{ const r = await fetch(`${API_BASE}/auth/sso`, { method: 'POST' }); return await r.json(); }catch{ return null; }
}

export default { getUsers, createUser, updateUser, deleteUser, getRoles, createRole, login, startSSO };
