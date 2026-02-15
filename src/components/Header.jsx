import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoNotificationsOutline } from "react-icons/io5";
import { Avatar } from '@chakra-ui/react';
import '../styles/header.css';
import {
  getProfile,
  readLocalAvatar, 
  onAuthEvent, 
  offAuthEvent, 
  setLocalAvatarAndEmit,
  logout 
} from '../utils/auth';

export default function Header() {
  const navigate = useNavigate();
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const fileInputRef = useRef(null);

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifCount] = useState(0); // keep your existing logic
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const triggerFileSelect = () => {
    if (!fileInputRef.current) {
      console.warn('file input ref not ready');
      return;
    }
    fileInputRef.current.click();
};

  // user display state
  const [avatarSrc, setAvatarSrc] = useState(null);
  const [displayName, setDisplayName] = useState("Guest");
  const [displayRole, setDisplayRole] = useState(""); // keep if you set role elsewhere
  const [userId, setUserId] = useState(null);
  const userIdRef = useRef(null);

  // Close both notification and profile pop up when outside click
  useEffect(() => {
    function onDocClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // Initialize profile and avatar on mount
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const profile = await getProfile();
        if (!mounted || !profile) return;

        setUserId(profile.id);
        userIdRef.current = profile.id;

        setDisplayName(profile.full_name || profile.fullName || "Guest");
        setDisplayRole(profile.role || "");
        const local = readLocalAvatar(profile.id);
        setAvatarSrc(local || profile.avatar_url || profile.avatarUrl || null);
      } catch (err) {
        console.error("Header getProfile error:", err);
      }
    }
    init();

    // Handler: update avatar when emitter/window event arrives
    const avatarHandler = (e) => {
      const { id, dataUrl } = e?.detail ?? {};
      console.log("Header avatarHandler event:", e?.type, e?.detail);
      // If id provided, only update when it matches current user; if no id, update anyway
      if (!id || id === userIdRef.current) {
        setAvatarSrc(dataUrl || null);
      }
    };

    // Handler: update name when emitter/window event arrives
    const nameHandler = (e) => {
      const { id, fullName } = e?.detail ?? {};
      console.log("Header nameHandler event:", e?.type, e?.detail);
      // Update if event is for current user or if no id provided
      if (!fullName) return;
      if (!id || id === userIdRef.current) {
        setDisplayName(fullName);
      }
    };

    const userRefreshedHandler = (e) => {
      const { user } = e?.detail ?? {};
      console.log("Header userRefreshed event:", e?.type, e?.detail);
      if (!user) return;
      userIdRef.current = user.id;
      setUserId(user.id);
      setDisplayName(user.full_name || user.fullName || "Guest");
      const local = readLocalAvatar(user.id);
      setAvatarSrc(local || user.avatar_url || user.avatarUrl || null);
      if (user.role) setDisplayRole(user.role);
    };

    // Subscribe to utils emitter (if available)
    try {
      onAuthEvent?.("avatar:changed", avatarHandler);
      onAuthEvent?.("name:changed", nameHandler);
      onAuthEvent?.("user:refreshed", userRefreshedHandler);
    } catch (err) {
      console.warn("Header emitter subscribe failed (ok if not present):", err);
    }

    // Legacy window events fallback
    function onUserUpdatedWindow(e) {
      console.log("Header window user-updated:", e?.detail);
      const updated = e?.detail ?? null;
      if (updated) {
        userIdRef.current = updated.id;
        setUserId(updated.id);
        setDisplayName(updated.full_name || updated.fullName || "Guest");
        const local = readLocalAvatar(updated.id);
        setAvatarSrc(local || updated.avatar_url || updated.avatarUrl || null);
        if (updated.role) setDisplayRole(updated.role);
      }
    }
    function onAvatarUpdatedWindow(e) {
      console.log("Header window avatar-updated:", e?.detail);
      const val = e?.detail ?? null;
      // If event carries no id, assume it's for current user; otherwise compare
      // Some legacy events send just dataUrl; we update avatarSrc directly
      setAvatarSrc(val || null);
    }

    window.addEventListener("user-updated", onUserUpdatedWindow);
    window.addEventListener("avatar-updated", onAvatarUpdatedWindow);

    return () => {
      mounted = false;
      try {
        offAuthEvent?.("avatar:changed", avatarHandler);
        offAuthEvent?.("name:changed", nameHandler);
        offAuthEvent?.("user:refreshed", userRefreshedHandler);
      } catch (err) {
        // ignore
      }
      window.removeEventListener("user-updated", onUserUpdatedWindow);
      window.removeEventListener("avatar-updated", onAvatarUpdatedWindow);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle file selection from header
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      // Persist FE-only and emit event so other components sync
      setLocalAvatarAndEmit(userId, dataUrl);
      // Update local header immediately
      setAvatarSrc(dataUrl);
      setUploading(false);
      e.target.value = "";
    };
    reader.onerror = (err) => {
      console.error("Header FileReader error:", err);
      setUploading(false);
      e.target.value = "";
    };
    reader.readAsDataURL(file);
  };

  // Logout handler
  function handleLogout() {
    try {
      logout();
      
      // beri tahu komponen lain
      window.dispatchEvent(new CustomEvent('user-logged-out'));

      // bersihkan avatar / state lokal
      setAvatarSrc(null);
      setDisplayName("Guest");
      setDisplayRole("");

      // redirect ke login
      navigate('/login', { replace: true });

      // fallback redirect paksa
      setTimeout(() => {
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }, 200);
    } catch (err) {
      console.warn('logout error', err);
    }
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
              aria-haspopup="true"
            >
              <Avatar
                name={displayName}
                src={avatarSrc || undefined}
                boxSize="36px"
                className="avatar"
              />
              <div className="profile-info">
                <span className="profile-name">{displayName}</span>
                <span className="profile-role">
                  {displayRole
                  ? `${displayRole.charAt(0).toUpperCase()}${displayRole.slice(1)}`
                  : ''}
              </span>
              </div>
            </button>

            {open && (
              <div className="profile-menu" role="menu">
                <button
                  className="menu-item"
                  onClick={() => {
                    setOpen(false);
                    navigate("/profile");
                  }}
                >
                  Profile
                </button>

                <button
                  className="menu-item"
                  onClick={() => {
                    setOpen(false);
                    // jika belum ada userId, beri feedback kecil
                    if (!userId) {
                      console.warn('No user id yet, cannot change avatar');
                      return;
                    }
                    triggerFileSelect();
                  }}
                  disabled={!userId}
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
            style={{ display: "none" }}
            aria-hidden
          />
        </div>
      </div>
    </header>
  );
}