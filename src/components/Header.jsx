import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/header.css';

const AVATAR_STORAGE_KEY = 'user-avatar';

export default function Header() {
  const [avatarSrc, setAvatarSrc] = useState('/images/sample-avatar.jpg'); // default sample image
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // Load avatar from localStorage if available
  useEffect(() => {
    const storedAvatar = localStorage.getItem(AVATAR_STORAGE_KEY);
    if (storedAvatar) {
      setAvatarSrc(storedAvatar);
    }
  }, []);

  // Convert file to base64
  async function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  }

  // Handle avatar upload
  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await fileToBase64(file);
      localStorage.setItem(AVATAR_STORAGE_KEY, base64);
      setAvatarSrc(base64);
    } catch (err) {
      console.error('Failed to read avatar file', err);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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
      <div className="header-left">
      </div>

      <div className="header-right">
        {/* Notification button */}
        <button
          className="notification-btn"
          onClick={() => setNotifOpen(!notifOpen)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 24c1.104 0 2-.9 2-2h-4c0 1.1.896 2 2 2zm6.364-6c-.828 0-1.5-.672-1.5-1.5V11c0-3.084-1.729-5.64-4.364-6.708V4c0-.828-.672-1.5-1.5-1.5S9.5 3.172 9.5 4v.292C6.865 5.36 5.136 7.916 5.136 11v5.5c0 .828-.672 1.5-1.5 1.5H3v2h18v-2h-2.636z" />
          </svg>
        </button>

        {notifOpen && (
          <div className="notif-menu" role="menu" aria-label="Notifications menu">
            <div className="notif-item muted">No new notifications right now</div>
          </div>
        )}

        {/* Profile dropdown */}
        <div className="profile">
          <button
            className="profile-btn"
            onClick={() => setOpen(!open)}
          >
            <img src={avatarSrc} alt="User Avatar" className="avatar" />
            <div className="profile-info">
              <span className="profile-name">Nicholas Rainer</span>
              <span className="profile-role">Admin</span>
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