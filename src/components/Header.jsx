import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoNotificationsOutline } from "react-icons/io5";
import { Avatar } from '@chakra-ui/react';
import '../styles/header.css';
import { getUser } from '../utils/auth';

const AVATAR_STORAGE_KEY = 'user-avatar';
const AUTH_TOKEN_KEY = 'auth_token';
const USER_STORAGE_KEY = 'sm_user';

export default function Header() {
  // ambil initial user dari helper
  const initialUser = getUser();
  const [userData, setUserData] = useState(initialUser || null);
  const [avatarSrc, setAvatarSrc] = useState(
    // prefer stored avatar key, fallback ke user.avatarUrl
    localStorage.getItem(AVATAR_STORAGE_KEY) || initialUser?.avatarUrl || null
  );
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const [notifCount] = useState(0); // default 0, bisa diisi dari API nanti

  // Close both notification and profile pop up when outside click
  useEffect(() => {
    function onDocClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // Sync initial user setiap mount (jika ada perubahan sebelum mount)
  useEffect(() => {
    const u = getUser();
    setUserData(u);
    const storedAvatar = localStorage.getItem(AVATAR_STORAGE_KEY);
    if (storedAvatar) setAvatarSrc(storedAvatar);
    else setAvatarSrc(u?.avatarUrl || null);
  }, []);

  // Listen for user-updated events (profile edits in same tab)
  useEffect(() => {
    function onUserUpdated(e) {
      const updatedUser = e?.detail ?? null;
      if (updatedUser) {
        setUserData(updatedUser);
        // prefer explicit avatar cache if present, else use updatedUser.avatarUrl
        const storedAvatar = localStorage.getItem(AVATAR_STORAGE_KEY);
        setAvatarSrc(storedAvatar || updatedUser.avatarUrl || null);
      } else {
        // fallback: reload from storage
        const u = getUser();
        setUserData(u);
        const storedAvatar = localStorage.getItem(AVATAR_STORAGE_KEY);
        setAvatarSrc(storedAvatar || u?.avatarUrl || null);
      }
    }

    window.addEventListener('user-updated', onUserUpdated);
    return () => window.removeEventListener('user-updated', onUserUpdated);
  }, []);

  // Listen for avatar-updated custom event (dispatched oleh ProfilePage / Header)
  useEffect(() => {
    function onAvatarUpdated(e) {
      const val = e?.detail ?? null;
      setAvatarSrc(val);
      // juga refresh userData dari storage agar fullname/role terupdate
      const u = getUser();
      setUserData(u);
    }
    window.addEventListener('avatar-updated', onAvatarUpdated);
    return () => window.removeEventListener('avatar-updated', onAvatarUpdated);
  }, []);

  // Listen for storage events (sinkron antar tab)
  useEffect(() => {
    function onStorage(e) {
      if (!e) return;
      // jika sm_user berubah, reload userData
      if (e.key === 'sm_user' || e.key === AVATAR_STORAGE_KEY) {
        const u = getUser();
        setUserData(u);
        const storedAvatar = localStorage.getItem(AVATAR_STORAGE_KEY);
        setAvatarSrc(storedAvatar || u?.avatarUrl || null);
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Handle upload avatar (via header change avatar)
  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      try {
        // Simpan juga ke key avatar lokal (opsional)
        localStorage.setItem(AVATAR_STORAGE_KEY, base64);

        // Update sm_user agar konsisten dengan ProfilePage
        try {
          if (typeof updateUser === 'function') {
            updateUser({ avatarUrl: base64 });
          } else {
            const raw = localStorage.getItem('sm_user');
            const u = raw ? JSON.parse(raw) : {};
            u.avatarUrl = base64;
            localStorage.setItem('sm_user', JSON.stringify(u));
          }
        } catch (err) {
          console.warn('failed to update user object in storage', err);
        }

        setAvatarSrc(base64);
        // dispatch event agar komponen lain (ProfilePage) tahu avatar berubah
        window.dispatchEvent(new CustomEvent('avatar-updated', { detail: base64 }));
      } catch (err) {
        console.error('Failed to save avatar', err);
      }
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  // Trigger file selector
  function triggerFileSelect() {
    fileInputRef.current?.click();
  }

  // Logout handle
  function handleLogout() {
    try {
      // hapus token dan user object
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);

      // hapus avatar cache jika ada
      try { localStorage.removeItem(AVATAR_STORAGE_KEY); } catch (e) {}

      // beri tahu komponen lain bahwa user sudah logout
      window.dispatchEvent(new CustomEvent('user-logged-out'));

      // reset local state jika perlu (jika ada setter di scope)
      try {
        setUserData(null);
        setAvatarSrc(null);
      } catch (e) {
        // ignore if setters not in scope
      }

      // navigate ke login, replace agar user tidak bisa back ke halaman sebelumnya
      navigate('/login', { replace: true });

      // fallback: jika navigate tidak memaksa reload (rare), paksa redirect
      setTimeout(() => {
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }, 200);
    } catch (err) {
      console.warn('logout error', err);
    }
  }

  // Derive display name and role from userData (note: register uses full_name)
  // Display: Full Name
  const displayName = userData?.full_name || userData?.name || 'Guest';
  // Display: Role
  const rawRole = userData?.role || 'admin';
  const displayRole = rawRole.charAt(0).toUpperCase() + rawRole.slice(1).toLowerCase();

  return (
    <header className="header">
      <div className="header-left"></div>

      <div className="header-right">
        {/* Notification button */}
        <div ref={notifRef} className="notification-container">
          <button
            className="notification-btn"
            onClick={() => setNotifOpen(!notifOpen)}
          >
            <IoNotificationsOutline size={22} />
            {notifCount > 0 && (
              <span className="notif-badge">{notifCount}</span>
            )}
          </button>
          {notifOpen && (
            <div className="notif-menu" role="menu" aria-label="Notifications menu">
              <div className="notif-item muted">No new notifications right now</div>
            </div>
          )}
        </div>

        {/* Profile dropdown */}
        <div className="profile" ref={profileRef}>
          <div className="profile">
            <button
              className="profile-btn"
              onClick={() => setOpen(!open)}
            >
              <Avatar
                name={displayName}
                src={avatarSrc || undefined}
                boxSize="36px"
                className="avatar"
              />
              <div className="profile-info">
                <span className="profile-name">{displayName}</span>
                <span className="profile-role">{displayRole}</span>
              </div>
            </button>

            {open && (
              <div className="profile-menu" role="menu">
                <button
                  className="menu-item"
                  onClick={() => {
                    setOpen(false);
                    navigate('/profile');
                  }}
                >
                  Profile
                </button>

                <button
                  className="menu-item"
                  onClick={() => {
                    setOpen(false);
                    triggerFileSelect();
                  }}
                >
                  Change avatar
                </button>

                <button className="menu-item" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            )}
          </div>

          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>
      </div>
    </header>
  );
}