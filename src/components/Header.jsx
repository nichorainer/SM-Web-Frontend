import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, logoutUser, isAuthenticated } from '../utils/auth';
import { Avatar } from '@chakra-ui/react';
import './header.css';

const AVATAR_STORAGE_KEY = 'sm_user_avatar_base64';

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
}

export default function Header() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const user = isAuthenticated() ? getUser() : null;
  const menuRef = useRef(null);
  const notifRef = useRef(null);
  const fileInputRef = useRef(null);

  const [avatarSrc, setAvatarSrc] = useState(() => {
    try {
      return localStorage.getItem(AVATAR_STORAGE_KEY) || user?.avatarUrl || '/images/sengun_adebayo.jpg';
    } catch {
      return user?.avatarUrl || '/images/sengun_adebayo.jpg';
    }
  });

  useEffect(() => {
    function onDocClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(AVATAR_STORAGE_KEY);
      if (stored) {
        setAvatarSrc(stored);
      } else if (user?.avatarUrl) {
        setAvatarSrc(user.avatarUrl);
      } else {
        setAvatarSrc('/images/sengun_adebayo.jpg');
      }
    } catch {
      setAvatarSrc(user?.avatarUrl || '/images/sengun_adebayo.jpg');
    }
  }, [user]);

  useEffect(() => {
    function onAvatarUpdated(e) {
      const newSrc = e?.detail ?? localStorage.getItem(AVATAR_STORAGE_KEY) ?? user?.avatarUrl ?? '/images/sengun_adebayo.jpg';
      setAvatarSrc(newSrc);
    }
    window.addEventListener('avatar-updated', onAvatarUpdated);
    return () => window.removeEventListener('avatar-updated', onAvatarUpdated);
  }, [user]);


  const handleLogout = () => {
    logoutUser();
    navigate('/login', { replace: true });
  };

  const unreadCount = 0;

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await fileToBase64(file);
      // persist base64 for demo; in production upload to server and store URL
      localStorage.setItem(AVATAR_STORAGE_KEY, base64);
      setAvatarSrc(base64);
    } catch (err) {
      // fallback: do nothing, keep previous avatar
      // optionally show a toast or console
      console.error('Failed to read avatar file', err);
    } finally {
      // reset input so same file can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function triggerFileSelect() {
    fileInputRef.current?.click();
  }

  return (
    <header className="app-header">
      <div className="header-left" />

      <div className="header-right">
        <input className="search" placeholder="Search..." aria-label="Search" />

        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="notif-wrap" ref={notifRef}>
            <button
              className="notification-btn"
              onClick={() => setNotifOpen(prev => !prev)}
              aria-haspopup="true"
              aria-expanded={notifOpen}
              aria-label="Notifications"
              title="Notifications"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M15 17H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
                <path d="M12 22c1.1 0 2-.9 2-2H10c0 1.1.9 2 2 2z" fill="currentColor" opacity="0.4"/>
                <path d="M18 8a6 6 0 10-12 0v4l-2 2v1h16v-1l-2-2V8z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {unreadCount > 0 && <span className="notif-badge" aria-hidden>{unreadCount}</span>}
            </button>

            {notifOpen && (
              <div className="notif-menu" role="menu" aria-label="Notifications menu">
                <div className="notif-item muted">No new notifications right now</div>
              </div>
            )}
          </div>

          <div className="profile" ref={menuRef}>
            <button
              className="profile-btn"
              onClick={() => setOpen(prev => !prev)}
              aria-haspopup="true"
              aria-expanded={open}
              title={user ? user.name : 'User'}
            >
              <Avatar
                size="sm"
                name={user ? user.name : 'Guest'}
                src={avatarSrc}
              />
              <div className="profile-info">
                <div className="profile-name">{user ? user.name : 'Guest'}</div>
                <div className="profile-role">Admin</div>
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
                    // open file selector to change avatar
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

            {/* hidden file input for avatar upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
              aria-hidden
            />
          </div>
        </div>
      </div>
    </header>
  );
}