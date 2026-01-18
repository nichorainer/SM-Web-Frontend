import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoNotificationsOutline } from "react-icons/io5";
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
            <IoNotificationsOutline size={22} />
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