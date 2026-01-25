import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '@chakra-ui/react';
import { getUser, isAuthenticated, updateUser } from '../utils/auth';
import '../styles/profile-page.css';
import EditProfileModal from '../components/EditProfileModal';

const USER_STORAGE_KEY = 'sm_user';

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const user = isAuthenticated() ? getUser() : null;

  const [form, setForm] = useState({
    fullName: user?.full_name || '',
    username: user?.username || '',
    email: user?.email || '',
    password: user?.password || '',
    role: user?.role || 'staff',
    avatarUrl: user?.avatarUrl || null,
  });

  // Avatar sync langsung dari getUser
  const [avatarSrc, setAvatarSrc] = useState(user?.avatarUrl || null);
  const fileRef = useRef(null);
  const isAdmin = user?.role === 'admin';
  const [savingAvatar, setSavingAvatar] = useState(false);

  // Keep form in sync if user object changes externally
  useEffect(() => {
    const u = getUser();
    setForm((prev) => ({
      ...prev,
      fullName: u?.full_name || prev.fullName,
      username: u?.username || prev.username,
      email: u?.email || prev.email,
      password: u?.password || prev.password,
      role: u?.role || prev.role,
      avatarUrl: u?.avatarUrl || prev.avatarUrl,
    }));
    setAvatarSrc(u?.avatarUrl || null);
  }, []);

  // Listen for avatar-updated events (dispatched by Header or other)
  useEffect(() => {
    function onAvatarUpdated(e) {
      const val = e?.detail ?? null;
      setAvatarSrc(val);
      setForm((prev) => ({ ...prev, avatarUrl: val }));
    }
    window.addEventListener('avatar-updated', onAvatarUpdated);
    return () => window.removeEventListener('avatar-updated', onAvatarUpdated);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Popup notification state
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifType, setNotifType] = useState('success'); // 'success' | 'error'
  const [notifMessage, setNotifMessage] = useState('');

  // helper untuk buka popup
  function showNotification(type, message) {
    setNotifType(type);
    setNotifMessage(message);
    setNotifOpen(true);
  }

  // Save from modal or form submit
  const handleSave = (e) => {
    if (e && e.preventDefault) e.preventDefault();

    // Basic validation
    if (!form.fullName.trim() || !form.username.trim() || !form.email.trim()) {
      alert('Full name, username and email are required.');
      return;
    }

    // Update localStorage via helper
    const updated = updateUser({
      full_name: form.fullName,
      username: form.username,
      email: form.email,
      // only set password if provided (demo)
      ...(form.password ? { password: form.password } : {}),
      avatarUrl: avatarSrc || null,
      role: form.role,
    });

    if (updated) {
      // dispatch custom event so other components knows the changes made
      window.dispatchEvent(new CustomEvent('user-updated', { detail: updated }));
      // reflect changes in local state
      setForm((prev) => ({ ...prev, password: '' })); // clear password input
      showNotification('success', 'Profile updated successfully.');
    } else {
      showNotification('error', 'Failed to update profile.');
    }
  };

  function handleModalSave() {
    const updated = updateUser({
      full_name: form.fullName,
      username: form.username,
      email: form.email,
      ...(form.password ? { password: form.password } : {}),
      avatarUrl: avatarSrc || null,
      role: form.role,
    });
    // dispatch custom event so other components knows the changes made
    if (updated) {
      window.dispatchEvent(new CustomEvent('user-updated', { detail: updated }));
      showNotification('success', 'Profile updated successfully.');
    } else {
      showNotification('error', 'Failed to update profile.');
    }
    setModalOpen(false);
  }

  // Handle upload avatar
  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSavingAvatar(true);
    try {
      const base64 = await fileToBase64(file);
      // update storage
      const updated = updateUser({ avatarUrl: base64 });
      if (updated) {
        // simpan juga ke cache header (opsional)
      try {
        localStorage.setItem('user-avatar', base64);
      } catch (err) {
        // ignore storage errors
      }
        setAvatarSrc(base64);
        setForm((prev) => ({ ...prev, avatarUrl: base64 }));
        window.dispatchEvent(new CustomEvent('avatar-updated', { detail: base64 }));
      }
    } catch (err) {
      console.error('failed to read file', err);
    } finally {
      setSavingAvatar(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function triggerFileSelect() {
    fileRef.current?.click();
  }

  // Remove Avatar Handler
  function removeAvatar() {
    try {
      // update sm_user
      updateUser({ avatarUrl: null });

      // hapus cache avatar yang mungkin dipakai Header
      try {
        localStorage.removeItem('user-avatar');
      } catch (err) {
        // ignore
      }

      // update state agar Avatar menampilkan inisial (Chakra Avatar pakai prop name)
      setAvatarSrc(null);
      setForm((prev) => ({ ...prev, avatarUrl: null }));

      // beri tahu komponen lain
      window.dispatchEvent(new CustomEvent('avatar-updated', { detail: null }));
    } catch (err) {
      console.error('failed to remove avatar', err);
    }
  }

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  function handleEditToggle() {
    setModalOpen(true);
  }
  function handleModalClose() {
    setModalOpen(false);
  }
  function handleModalSave() {
    // validate then save
    handleSave();
    setModalOpen(false);
  }

  if (!user) {
    // not authenticated (demo)
    return (
      <div className="profile-page">
        <p>Please login to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div>
          <h2 className="page-title">Profile</h2>
          <p className="page-sub">Manage your personal information</p>
        </div>
      </div>

      <div className="profile-card">
        <div className="profile-left">
          <div className="avatar-large">
            <Avatar boxSize="96px" name={form.fullName || 'User'} src={avatarSrc || undefined} />
          </div>

          <div className="basic-info">
            <h3 className="name">{form.fullName || '...'}</h3>
            <div className="email">{form.email || '...'}</div>
            {/* Upload to change avatar */}
            <div style={{ marginTop: 12 }}>
              <button 
                type="button" 
                className="btn-outline-add" 
                onClick={triggerFileSelect}
              >
                Change avatar
              </button>
              {/* Remove/delete avatar */}
              <button
                type="button"
                className="btn-outline-remove"
                onClick={removeAvatar}
                style={{ marginLeft: 8 }}
              >
                Remove avatar
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFile}
              />
              {savingAvatar && (
                <div className="muted" style={{ marginTop: 8 }}>
                  Saving avatar…
                </div>
              )}
            </div>
          </div>
        </div>

        <form className="profile-form" onSubmit={handleSave}>
          <div className="form-row">
            <label>Full Name</label>
            <input
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Enter your full name here"
            />
          </div>

          <div className="form-row">
            <label>Username</label>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Username"
            />
          </div>

          <div className="form-row">
            <label>E-mail</label>
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="user@example.com"
              type="email"
            />
          </div>

          <div className="form-row">
            <label>Password</label>
            <input
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="********"
              type="password"
              autoComplete="new-password"
            />
          </div>

          <div className="form-row">
            <label>Role</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              disabled={!isAdmin}
            >
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
            {!isAdmin && (
              <div className="muted small">
                Role is set to <strong>staff</strong>. Only admins can change this.
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="btn-primary" onClick={handleEditToggle}>
              Edit Profile
            </button>
          </div>
        </form>
      </div>

      {/* Edit Profile Modal */}
      {modalOpen && (
        <EditProfileModal
          isOpen={modalOpen}
          onClose={handleModalClose}
          onSave={handleModalSave}
          form={form}
          onChange={handleChange}
        />
      )}

      {/* Notification popup */}
      {notifOpen && (
        <div
          className="notif-overlay"
          onClick={() => setNotifOpen(false)} // klik di luar menutup
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            className={`notif-card ${notifType === 'success' ? 'success' : 'error'}`}
            onClick={(e) => e.stopPropagation()} // mencegah close saat klik di dalam
            style={{
              width: 360,
              maxWidth: '90%',
              background: '#fff',
              borderRadius: 8,
              padding: 20,
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              position: 'relative',
            }}
          >
            {/* Close X */}
            <button
              aria-label="Close"
              onClick={() => setNotifOpen(false)}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                border: 'none',
                background: 'transparent',
                fontSize: 18,
                cursor: 'pointer',
              }}
            >
              ×
            </button>

            {/* Icon + Message */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: notifType === 'success' ? '#E6FFFA' : '#FFF5F5',
                  color: notifType === 'success' ? '#059669' : '#C53030',
                  fontSize: 20,
                  fontWeight: 700,
                }}
              >
                {notifType === 'success' ? '✓' : '!' }
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>
                  {notifType === 'success' ? 'Success' : 'Error'}
                </div>
                <div style={{ color: '#333' }}>{notifMessage}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}