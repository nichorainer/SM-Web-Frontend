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
  const user = isAuthenticated()
    ? getUser()
    : {
      full_name: '',
      username: '', 
      email: '',
      password: '', 
      role: 'staff',
    };

  const [form, setForm] = useState({
    fullName: user.full_name || '',
    username: user.username || '',
    email: user.email || '',
    password: '',
    role: user.role || 'staff',
  });

  // Avatar sync langsung dari getUser
 const [avatarSrc, setAvatarSrc] = useState(user?.avatarUrl || null);

  const fileRef = useRef(null);
  const isAdmin = user?.role === 'admin';
  const [savingAvatar, setSavingAvatar] = useState(false);

  useEffect(() => {
    // setiap kali user berubah, sync avatar
    setAvatarSrc(user?.avatarUrl || null);
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = (e) => {
    if (e) e.preventDefault();
    try {
      const raw = localStorage.getItem(USER_STORAGE_KEY);
      const u = raw ? JSON.parse(raw) : {};
      u.name = form.fullName;
      u.username = form.username;
      u.email = form.email;
      if (form.password) {
        // demo only: password not stored
      }
      if (avatarSrc) u.avatarUrl = avatarSrc;
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(u));
    } catch (err) {
      console.error('failed to save profile to localStorage', err);
    }
  };

  // Handle upload avatar
  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSavingAvatar(true);
    try {
      const base64 = await fileToBase64(file);
      // simpan avatar ke user object
      const raw = localStorage.getItem(USER_STORAGE_KEY);
      const u = raw ? JSON.parse(raw) : {};
      u.avatarUrl = base64;
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(u));

      setAvatarSrc(base64);
      window.dispatchEvent(new CustomEvent('avatar-updated', { detail: base64 }));
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
    try {
      const raw = localStorage.getItem(USER_STORAGE_KEY);
      if (raw) {
        const u = JSON.parse(raw);
        delete u.avatarUrl;
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(u));
      }
    } catch {}
    setAvatarSrc(null);
    window.dispatchEvent(new CustomEvent('avatar-updated', { detail: null }));
  }

  // modal state
  const [modalOpen, setModalOpen] = useState(false);
  function handleEditToggle() { setModalOpen(true); }
  function handleModalClose() { setModalOpen(false); }
  function handleModalSave() { handleSave(); setModalOpen(false); }

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
            <h3 className="name">{form.fullName || '—'}</h3>
            <div className="email">{form.email || '—'}</div>
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
              value={user.fullName}
              onChange={handleChange}
              placeholder="Enter your full name here"
            />
          </div>

          <div className="form-row">
            <label>Username</label>
            <input
              name="username"
              value={user.username}
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
              type="Enter e-mail here"
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