import React, { useState, useEffect } from 'react';
import { Card } from '../components';
import { Save, RefreshCw, Trash2 } from 'lucide-react';
import { t } from '../i18n';
import { getUserFromToken } from '../services/auth';

export default function ProfilePage({ ctx }) {
  const { authenticatedUser, currentUser, setAuthenticatedUser, setCurrentUser, authService, loadUsers, getInitials, setActiveView } = ctx;
  const lang = ctx?.config?.language || 'fr';
  
  // Try to get user info from OIDC token first (if SSO)
  const tokenUser = getUserFromToken();
  const isSso = Boolean(tokenUser || (authenticatedUser && ((authenticatedUser.authMode || '').toLowerCase() === 'sso' || (authenticatedUser.authMode || '').toLowerCase() === 'oidc')));
  const profileUserId = authenticatedUser?.email || authenticatedUser?.id;
  
  const [idState, setIdState] = useState((authenticatedUser && authenticatedUser.id) || tokenUser?.id || currentUser.id || '');
  const [displayNameState, setDisplayNameState] = useState((authenticatedUser && authenticatedUser.displayName) || tokenUser?.displayName || currentUser.displayName || '');
  const [businessRoleState, setBusinessRoleState] = useState((authenticatedUser && authenticatedUser.businessRole) || currentUser.businessRole || '');
  const [firstNameState, setFirstNameState] = useState((authenticatedUser && authenticatedUser.firstName) || tokenUser?.firstName || currentUser.firstName || '');
  const [lastNameState, setLastNameState] = useState((authenticatedUser && authenticatedUser.lastName) || tokenUser?.lastName || currentUser.lastName || '');
  const [profileIconState, setProfileIconState] = useState((authenticatedUser && authenticatedUser.profileIcon) || tokenUser?.picture || currentUser.profileIcon || '');
  const [avatarOffsetX, setAvatarOffsetX] = useState((authenticatedUser && authenticatedUser.profileIconCrop && (authenticatedUser.profileIconCrop.right ?? null)) || (authenticatedUser && authenticatedUser.profileIconPosition ? authenticatedUser.profileIconPosition.x : 50));
  const [avatarOffsetY, setAvatarOffsetY] = useState((authenticatedUser && authenticatedUser.profileIconCrop && (authenticatedUser.profileIconCrop.bottom ?? null)) || (authenticatedUser && authenticatedUser.profileIconPosition ? authenticatedUser.profileIconPosition.y : 50));
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);

  useEffect(() => {
    let mounted = true;
    async function loadFullUser() {
      try {
        const id = profileUserId;
        if (!id) return;
        const users = await authService.getUsers();
        const u = Array.isArray(users) ? users.find(x => x.id === id) : null;
        if (!u || !mounted) return;
        if (u.id) setIdState(u.id);
        if (u.firstName) setFirstNameState(u.firstName);
        if (u.lastName) setLastNameState(u.lastName);
        if (u.displayName) setDisplayNameState(u.displayName);
        if (u.businessRole) setBusinessRoleState(u.businessRole);
        if (u.profileIcon) setProfileIconState(u.profileIcon);
        if (u.profileIconPosition) {
          setAvatarOffsetX(u.profileIconPosition.x ?? 50);
          setAvatarOffsetY(u.profileIconPosition.y ?? 50);
        }
        if (u.profileIconCrop) {
          if (typeof u.profileIconCrop.bottom === 'number') setAvatarOffsetY(u.profileIconCrop.bottom);
          if (typeof u.profileIconCrop.right === 'number') setAvatarOffsetX(u.profileIconCrop.right);
        }
        // Load roles for SSO users
        if (u.roles && Array.isArray(u.roles)) {
          setSelectedRoles(u.roles);
        }
      } catch (e) {
        console.warn('Unable to load full user for profile view', e);
      }
    }
    loadFullUser();
    return () => { mounted = false; };
  }, [profileUserId, authService]);

  // Load available roles
  useEffect(() => {
    async function loadRoles() {
      try {
        const roles = await authService.getRoles();
        setAvailableRoles(Array.isArray(roles) ? roles : []);
      } catch (e) {
        console.warn('Unable to load roles', e);
      }
    }
    loadRoles();
  }, [authService]);

  useEffect(() => {
    if (lastNameState || firstNameState) {
      const fn = String(firstNameState || '').trim();
      const ln = String(lastNameState || '').trim();
      const newDisplayName = [fn, ln].filter(Boolean).join(' ').trim();
      setDisplayNameState(newDisplayName || displayNameState);
    }
  }, [firstNameState, lastNameState]);

  const compressImage = (dataUrl, maxWidth = 600, maxHeight = 600, quality = 0.75) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;
        if (w > h) {
          if (w > maxWidth) { h = Math.round(h * maxWidth / w); w = maxWidth; }
        } else {
          if (h > maxHeight) { w = Math.round(w * maxHeight / h); h = maxHeight; }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = dataUrl;
    });
  };

  const onFileChange = async (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const compressed = await compressImage(reader.result);
      setProfileIconState(compressed);
    };
    reader.readAsDataURL(f);
  };

  const resetAvatarPosition = () => { setAvatarOffsetX(50); setAvatarOffsetY(50); };

  const savePositionOnly = async () => {
    try {
      const payload = { profileIconPosition: { x: Number(avatarOffsetX), y: Number(avatarOffsetY) }, profileIconCrop: { bottom: Number(avatarOffsetY), right: Number(avatarOffsetX), size: 100 } };
      const updated = await authService.updateUser(profileUserId || authenticatedUser.id, payload);
      setAuthenticatedUser((u) => ({ ...u, ...updated }));
      setCurrentUser((u) => ({ ...u, ...updated }));
      await loadUsers();
      alert('Position sauvegardée');
    } catch (e) {
      alert('Erreur sauvegarde position: ' + (e?.message || String(e)));
    }
  };

  const centerPosition = async () => { resetAvatarPosition(); await savePositionOnly(); };

  const deleteImage = async () => {
    if (!confirm('Supprimer la photo de profil ?')) return;
    try {
      const payload = { profileIcon: '', profileIconPosition: null, profileIconCrop: null };
      const updated = await authService.updateUser(profileUserId || authenticatedUser.id, payload);
      setProfileIconState('');
      setAuthenticatedUser((u) => ({ ...u, ...updated }));
      setCurrentUser((u) => ({ ...u, ...updated }));
      await loadUsers();
      alert('Photo supprimée');
    } catch (e) {
      alert('Erreur suppression: ' + (e?.message || String(e)));
    }
  };

  const saveProfile = async () => {
    if (newPassword && newPassword !== confirmPassword) return alert('Password confirmation does not match');
    setSavingProfile(true);
    try {
      const payload = { displayName: displayNameState, businessRole: businessRoleState || '', firstName: firstNameState || '', lastName: lastNameState || '' };
      if (!isSso) payload.id = idState;
      if (profileIconState) payload.profileIcon = profileIconState;
      payload.profileIconPosition = { x: Number(avatarOffsetX), y: Number(avatarOffsetY) };
      payload.profileIconCrop = { bottom: Number(avatarOffsetY), right: Number(avatarOffsetX), size: 100 };
      if (!isSso && newPassword) payload.password = newPassword;
      if (!isSso) {
        payload.roles = selectedRoles && selectedRoles.length > 0 ? selectedRoles : ['user'];
      }
      const targetId = profileUserId || authenticatedUser.id;
      const updated = await authService.updateUser(targetId, payload);
      setAuthenticatedUser((u) => ({ ...u, ...updated }));
      setCurrentUser((u) => ({ ...u, ...updated }));
      setNewPassword('');
      setConfirmPassword('');
      await loadUsers();
      alert('Profil mis à jour');
    } catch (e) {
      alert('Erreur sauvegarde profil: ' + (e?.message || String(e)));
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-300 space-y-6 max-w-2xl">
      <h2 className="text-2xl font-bold text-slate-800">Mon Profil</h2>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Email / ID</label>
            <input value={idState} onChange={(e) => setIdState(e.target.value)} className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800" disabled={isSso} />
            {isSso && <p className="text-[11px] text-slate-500 mt-1">Géré par l&apos;IdP (lecture seule).</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Nom</label>
              <input value={lastNameState} onChange={(e) => setLastNameState(e.target.value)} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Prénom</label>
              <input value={firstNameState} onChange={(e) => setFirstNameState(e.target.value)} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Nom complet (auto-généré)</label>
            <input value={displayNameState} readOnly className="w-full p-2 border border-slate-300 rounded bg-slate-50 text-slate-600" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Rôle métier (optionnel)</label>
            <select value={businessRoleState} onChange={(e) => setBusinessRoleState(e.target.value)} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white">
              <option value="">-- Aucun --</option>
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
          <div className="w-full p-2 border border-slate-300 rounded">
            <label className="block text-xs font-semibold text-slate-700 mb-2">Rôles techniques</label>
            <div className="space-y-2">
              {availableRoles && availableRoles.length > 0 ? (
                availableRoles.map(role => (
                  <label key={role} className={`flex items-center gap-2 ${isSso ? 'opacity-60 cursor-not-allowed' : ''}`}>
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes(role)}
                      onChange={(e) => {
                        if (isSso) return;
                        if (e.target.checked) {
                          setSelectedRoles([...selectedRoles, role]);
                        } else {
                          setSelectedRoles(selectedRoles.filter(r => r !== role));
                        }
                      }}
                      className="rounded"
                      disabled={isSso}
                    />
                    <span className="text-sm text-slate-700">{role}</span>
                  </label>
                ))
              ) : (
                <div className="text-xs text-slate-500">Aucun rôle disponible</div>
              )}
            </div>
            {selectedRoles.length > 0 && (
              <div className="mt-2 p-2 bg-slate-50 rounded text-xs text-slate-700">
                <strong>Sélectionnés:</strong> {selectedRoles.join(', ')}
              </div>
            )}
            {isSso && <p className="text-[11px] text-slate-500 mt-2">Les rôles sont gérés par un administrateur.</p>}
          </div>
          <div className="space-y-4 grid grid-cols-3 gap-4">
            <div className="mt-1">
              <label className="block text-xs font-semibold text-slate-700 mb-2 text-center">Avatar</label>
              <div className="flex items-end space-x-4">
                <input type="file" accept="image/*" onChange={onFileChange} className="flex-1 p-2 border border-slate-300 rounded text-sm cursor-pointer" />
              </div>
            </div>
            <div className="mt-3 spans-2 col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-2 text-center">Aperçu de la photo</label>
              <div className="mx-auto w-48 h-48 bg-slate-50 border border-slate-200 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-40 h-40 rounded-full overflow-hidden bg-indigo-500 flex items-center justify-center">
                    {profileIconState ? (
                      <img src={profileIconState} alt="aperçu profil" className="w-full h-full object-cover" style={{ objectPosition: `${Number(avatarOffsetX)}% ${Number(avatarOffsetY)}%` }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
                        {getInitials((authenticatedUser && authenticatedUser.displayName) || currentUser.displayName || (authenticatedUser && authenticatedUser.id) || currentUser.id)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-col items-center">
                <input type="range" min="-50" max="150" value={avatarOffsetX} onChange={(e) => setAvatarOffsetX(e.target.value)} className="w-48" />
                <div className="flex items-center justify-center space-x-3 mt-3">
                  <button title={t('profile.savePosition', lang)} onClick={savePositionOnly} className="p-2 bg-slate-100 rounded hover:bg-slate-200"><Save size={16} /></button>
                  <button title={t('profile.center', lang)} onClick={() => { resetAvatarPosition(); centerPosition(); }} className="p-2 bg-slate-100 rounded hover:bg-slate-200"><RefreshCw size={16} /></button>
                  <button title={t('profile.removeImage', lang)} onClick={deleteImage} className="p-2 bg-slate-100 rounded hover:bg-slate-200 text-red-500"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          </div>
          {!isSso && (
            <div className="border-t border-slate-200 pt-4 mt-4">
              <h3 className="font-semibold text-slate-800 mb-4">Changer le mot de passe</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">Nouveau mot de passe (optionnel)</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder={t('profile.keepCurrent', lang)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">Confirmer le mot de passe</label>
                  <input type="password" placeholder={t('profile.confirmNew', lang)} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                </div>
              </div>
            </div>
          )}
          <div className="flex items-center space-x-2 mt-6 pt-4 border-t border-slate-200">
            <button onClick={saveProfile} disabled={savingProfile} className="px-4 py-2 bg-indigo-600 text-white font-medium rounded hover:bg-indigo-700 transition-colors disabled:opacity-50">{savingProfile ? 'Enregistrement...' : 'Enregistrer les modifications'}</button>
            <button onClick={() => setActiveView('settings')} className="px-4 py-2 bg-slate-200 text-slate-700 font-medium rounded hover:bg-slate-300 transition-colors">Annuler</button>
          </div>
        </div>
      </div>
    </div>
  );
}
