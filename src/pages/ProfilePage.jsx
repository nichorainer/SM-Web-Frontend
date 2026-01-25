import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '@chakra-ui/react';
import { getUser, isAuthenticated } from '../utils/auth';
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
      // reflect changes in local state
      setForm((prev) => ({ ...prev, password: '' })); // clear password input
      alert('Profile updated successfully.');
    } else {
      alert('Failed to update profile.');
    }
  };

  function handleModalSave() {
    updateUser({
      full_name: form.fullName,
      username: form.username,
      email: form.email,
      password: form.password || '',
      avatarUrl: avatarSrc || null,
    });
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

  // Untuk remove avatar
  function removeAvatar() {
    updateUser({ avatarUrl: null });
    setAvatarSrc(null);
    setForm((prev) => ({ ...prev, avatarUrl: null }));
    window.dispatchEvent(new CustomEvent('avatar-updated', { detail: null }));
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
            <Avatar boxSize="96px" name={form.fullName || 'User'} src={avatarSrc} />
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
    </div>
  );
}