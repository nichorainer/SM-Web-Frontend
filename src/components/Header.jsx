import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoNotificationsOutline } from "react-icons/io5";
import '../styles/header.css';
import { getUser } from '../utils/auth';

const AVATAR_STORAGE_KEY = 'user-avatar';

export default function Header() {
  const user = getUser();
  const [avatarSrc, setAvatarSrc] = useState(user?.avatarUrl || null);
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const [notifCount, setNotifCount] = useState(0); // default 0, bisa diisi dari API nanti

   // Tutup popup jika klik di luar
  useEffect(() => {
    function onDocClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // Sync avatar dari localStorage atau user
  useEffect(() => {
    const storedAvatar = localStorage.getItem(AVATAR_STORAGE_KEY);
    if (storedAvatar) setAvatarSrc(storedAvatar);
    else if (user?.avatarUrl) setAvatarSrc(user.avatarUrl);
    else setAvatarSrc(null);
  }, [user]);

  // Handle upload avatar
  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      localStorage.setItem(AVATAR_STORAGE_KEY, reader.result);

      // Update user object agar sinkron dengan Profile/Admin
      try {
        const raw = localStorage.getItem('sm_user');
        const u = raw ? JSON.parse(raw) : {};
        u.avatarUrl = reader.result;
        localStorage.setItem('sm_user', JSON.stringify(u));
      } catch (err) {
        console.warn('failed to update user object in storage', err);
      }

      setAvatarSrc(reader.result);
      window.dispatchEvent(new CustomEvent('avatar-updated', { detail: reader.result }));
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  // Trigger file selector
  function triggerFileSelect() {
    fileInputRef.current?.click();
  }

  // Handle logout (placeholder)
  function handleLogout() {
    console.log('Logging out...');
    navigate('/login');
  }

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
              <img src={avatarSrc ?? undefined} alt="User Avatar" className="avatar" />
              <div className="profile-info">
                <span className="profile-name">{user?.name || 'Guest'}</span>
                <span className="profile-role">{user?.role || 'Staff'}</span>
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