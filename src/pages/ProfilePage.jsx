import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, useToast } from '@chakra-ui/react';
import { 
  getProfile, 
  updateUser,
  readLocalAvatar,
  setLocalAvatarAndEmit,
  onAuthEvent,
  offAuthEvent,
} from '../utils/auth';
import '../styles/profile-page.css';
import EditProfileModal from '../components/EditProfileModal';

export default function ProfilePage() {
  const navigate = useNavigate();
  // user data
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  //avatar state
  const [avatarUrl, setAvatarUrl] = useState('');
  const [savingAvatar, setSavingAvatar] = useState(false);
  const toast = useToast();
  // used to trigger hidden file input
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);

    // Popup notification state
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifType, setNotifType] = useState('success'); // 'success' | 'error'
  const [notifMessage, setNotifMessage] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);

  // Form declaration (will sync with user when loaded)
  const [form, setForm] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    role: '',
    avatarUrl: '',
  });

  // Helper untuk buka popup notification
  function showNotification(type, message) {
    setNotifType(type);
    setNotifMessage(message);
    setNotifOpen(true);
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Open modal, close modal, save modal
  function handleEditToggle() {
    setModalOpen(true);
  }

  function handleModalClose() {
    setModalOpen(false);
  }

  function handleModalSave() {
    handleSave();
    setModalOpen(false);
  }

  // Save modal handler
  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    const updated = {
      full_name: form.fullName,
      username: form.username,
      email: form.email,
      ...(form.password ? { password: form.password } : {}),
    };

    try {
      // Kirim ke backend
      const res = await updateUser("me", updated);

      if (res.status === "success") {
        // save to localStorage FE
        saveUser(res.data);
        setUser(res.data);

        // dispatch custom event supaya komponen lain tahu
        // window.dispatchEvent(new CustomEvent("user-updated", { detail: res.data }));
        emitUserRefreshed(res.data); // broadcast changes

        // reset password agar tidak tersimpan plaintext
        setForm((prev) => ({ ...prev, password: "" }));

        showNotification("success", "Profile updated successfully.");
      } else {
        showNotification("error", res.message || "Failed to update profile.");
      }
    } catch (err) {
      showNotification("error", "Error saving profile to backend.");
    }
  };

  // User initialization
  useEffect(() => {
    // Get user from BE
    async function initUser() {
      const profile = await getProfile();
      if (!profile) {
        navigate('/login', { replace: true });
        return;
      }

      setUser(profile);
      console.log("User set in ProfilePage:", profile);
      setForm({
        fullName: profile.full_name || '',
        username: profile.username || '',
        email: profile.email || '',
        password: '',
        role: profile.role || '',
        avatarUrl: readLocalAvatar(profile.id) || '',
      });

      // prefer FE-stored avatar, else initials akan tampil
      const localAvatar = readLocalAvatar(profile.id);
      setAvatarUrl(localAvatar || '');
    }
    initUser();
  }, [navigate]);

    // ---------------------------
    // Subscribe to emitter/window events so this page updates when other tabs/components change avatar/name
    // ---------------------------
    
    // avatar handler
    useEffect(() => {
      const avatarHandler = (e) => {
        const { id, dataUrl } = e?.detail ?? {};
        if (!user || id === user.id) {
          setAvatarUrl(dataUrl || '');
          setForm((prev) => ({ ...prev, avatarUrl: dataUrl || '' }));
          setUser((prev) => (prev ? { ...prev, avatar_url: dataUrl || null } : prev));
        }
      };

      // name handler
      const nameHandler = (e) => {
        const { id, fullName } = e?.detail ?? {};
        if (!user || id === user.id) {
          if (fullName) {
            setForm((prev) => ({ ...prev, fullName }));
            setUser((prev) => (prev ? { ...prev, full_name: fullName } : prev));
          }
        }
      };

      // refreshed handler
      const userRefreshedHandler = (e) => {
        const { user: refreshed } = e?.detail ?? {};
        if (refreshed && (!user || refreshed.id === user.id)) {
          const localAvatar = readLocalAvatar(refreshed.id);
          setUser(refreshed);
          setForm((prev) => ({
            ...prev,
            fullName: refreshed.full_name || '',
            username: refreshed.username || '',
            email: refreshed.email || '',
            role: refreshed.role || '',
            avatarUrl: localAvatar || '',
          }));
          setAvatarUrl(localAvatar || '');
        }
      };

      // Subscribe ke emitter dari auth.js
      onAuthEvent('avatar:changed', avatarHandler);
      onAuthEvent('name:changed', nameHandler);
      onAuthEvent('user:refreshed', userRefreshedHandler);

      return () => {
        offAuthEvent('avatar:changed', avatarHandler);
        offAuthEvent('name:changed', nameHandler);
        offAuthEvent('user:refreshed', userRefreshedHandler);
      };
    }, [user?.id]);

  // file reader
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      toast({
        title: 'No file selected',
        description: 'Please choose an image to upload.',
        status: 'warning',
        duration: 4000,
        isClosable: true,
        position: 'top-right', 
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: 'User not loaded',
        description: 'Cannot save avatar before user is loaded.',
        status: 'error',
        duration: 4000,
        isClosable: true,
        position: 'top-right',
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      try {
        const base64 = reader.result;
        setAvatarUrl(base64);
        setSavingAvatar(true);

        // Persist FE-only using utils helper (per-user key) and emit emitter event
        setLocalAvatarAndEmit(user.id, base64);

        // // Also keep legacy localStorage key for backward compatibility
        // try {
        //   localStorage.setItem('avatar', base64);
        // } catch (err) {
        //   // ignore storage errors
        // }

        // // Also dispatch legacy window event for other parts that listen to it
        // try {
        //   window.dispatchEvent(new CustomEvent('avatar-updated', { detail: base64 }));
        // } catch (err) {
        //   // ignore
        // }

        // // Show success toast
        // toast({
        //   title: 'Avatar updated',
        //   description: 'Your avatar was saved locally.',
        //   status: 'success',
        //   duration: 4000,
        //   isClosable: true,
        //   position: 'top-right',
        // });

        setSavingAvatar(false);
      } catch (err) {
        setSavingAvatar(false);
        // Show error toast
        toast({
          title: 'Failed to save avatar',
          description: 'Something went wrong while saving locally.',
          status: 'error',
          duration: 4000,
          isClosable: true,
          position: 'top-right',
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Handler to remove avatar (FE-only)
  const removeAvatar = () => {
    if (!user?.id) {
      toast({
        title: 'User not loaded',
        description: 'Cannot remove avatar before user is loaded.',
        status: 'error',
        duration: 4000,
        isClosable: true,
        position: 'top-right',
      });
      return;
    }

    try {
      // Remove via utils helper (per-user)
      setLocalAvatarAndEmit(user.id, null);
      // Also remove legacy key
      try {
        localStorage.removeItem('avatar');
      } catch (err) {
        // ignore
      }
      // Dispatch legacy window event
      try {
        window.dispatchEvent(new CustomEvent('avatar-updated', { detail: null }));
      } catch (err) {
        // error
      }

      setAvatarUrl('');
      toast({
        title: 'Avatar removed',
        description: 'Your avatar has been cleared.',
        status: 'info',
        duration: 4000,
        isClosable: true,
        position: 'top-right',
      });
    } catch (err) {
      toast({
        title: 'Failed to remove avatar',
        description: 'Something went wrong while removing.',
        status: 'error',
        duration: 4000,
        isClosable: true,
        position: 'top-right',
      });
    }
  };


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
            {/* Avatar */}
            <Avatar
              name={
                form.fullName || 
                user?.full_name || 
                "Guest"
              }
              src={avatarUrl || undefined}
              size="2xl"
              style={{
                width: "168px",
                height: "168px",
                fontSize: "32px",
              }}
            />
          </div>

          <div className="basic-info">
            <h3 className="name">{user?.full_name || "Guest"}</h3>

            {/* Upload to change avatar */}
            <div style={{ marginTop: 12 }}>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleFileSelect}
              />

              <button
                type="button"
                className="btn-outline-add"
                onClick={() => fileInputRef.current?.click()}
              >
                Change Avatar
              </button>

              <button
                type="button"
                className="btn-outline-remove"
                onClick={removeAvatar}
                style={{ marginLeft: 8 }}
              >
                Remove Avatar
              </button>

              {savingAvatar && (
                <div className="muted" style={{ marginTop: 8 }}>
                  Saving avatar…
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="profile-form">
          <div className="form-row">
            <label>Full Name</label>
            <input
              value={user?.full_name || ''}
              readOnly
              placeholder="Edit your full name here"
            />
          </div>

          <div className="form-row">
            <label>Username</label>
            <input
              value={user?.username || ''}
              readOnly
              placeholder="Edit your username here"
            />
          </div>

          <div className="form-row">
            <label>E-mail</label>
            <input
              value={user?.email || ''}
              readOnly
              placeholder="user@example.com"
              type="email"
            />
          </div>

          <div className="form-row">
            <label>Password</label>
            <input
              type="password"
              value={form.password ? "********" : "********"}
              readOnly
              placeholder="********"
            />
          </div>

          <div className="form-row">
            <label>Role</label>
            <input
              name="role"
              value="Admin"
              disabled
            />

            {/* Muted message */}
            <div className="muted small">
              You already have the highest authorization here.
            </div>
          </div>


          <div className="form-actions">
            <button type="button" className="btn-primary" onClick={handleEditToggle}>
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {modalOpen && (
        <EditProfileModal
          isOpen={modalOpen}
          onClose={handleModalClose}
          onSave={handleModalSave}
          user={user}
          form={form}
          onChange={handleChange}
          onUserUpdated={(updatedUser) => setUser(updatedUser)}
        />
      )}

      {/* Notification popup */}
      {notifOpen && (
        <div
          className="notif-overlay"
          onClick={() => setNotifOpen(false)}
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
            onClick={(e) => e.stopPropagation()}
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