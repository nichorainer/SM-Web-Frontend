import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, useToast } from '@chakra-ui/react';
import { getToken, updateUser } from '../utils/auth';
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

  // User token
  useEffect(() => {
  const token = getToken();
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      // fallback: fetch from backend
      getUser("me").then(res => {
        if (res.status === "success") {
          setUser(res.data);
          localStorage.setItem("user", JSON.stringify(res.data));
        } else {
          setError(res.message);
        }
      });
    }
  }, [navigate]);

  // FE stores avatar
  useEffect(() => {
    const cachedAvatar = localStorage.getItem("avatar");
    if (cachedAvatar) {
      setAvatarUrl(cachedAvatar);
    }
  }, []);


  // Upload avatar handler
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
      if (!file) {
      toast({
        title: "No file selected",
        description: "Please choose an image to upload.",
        status: "warning",
        duration: 4000,
        isClosable: true,
        position: "top-right",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      try {
        const base64 = reader.result;
        setAvatarUrl(base64);
        setSavingAvatar(true);
        // Save avatar locally
        localStorage.setItem("avatar", base64);

        // Show success toast
        toast({
          title: "Avatar updated",
          description: "Your avatar was saved locally.",
          status: "success",
          duration: 4000,
          isClosable: true,
          position: "top-right",
        });

        setSavingAvatar(false);
      } catch (err) {
        setSavingAvatar(false);
        // Show error toast
        toast({
          title: "Failed to save avatar",
          description: "Something went wrong while saving locally.",
          status: "error",
          duration: 4000,
          isClosable: true,
          position: "top-right",
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Handler to remove avatar
  const removeAvatar = () => {
    try {
      localStorage.removeItem("avatar");
      setAvatarUrl("");

      toast({
        title: "Avatar removed",
        description: "Your avatar has been cleared.",
        status: "info",
        duration: 4000,
        isClosable: true,
        position: "top-right",
      });
    } catch (err) {
      toast({
        title: "Failed to remove avatar",
        description: "Something went wrong while removing.",
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "top-right",
      });
    }
  };

  // Popup notification state
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifType, setNotifType] = useState('success'); // 'success' | 'error'
  const [notifMessage, setNotifMessage] = useState('');

  // Helper untuk buka popup notification
  function showNotification(type, message) {
    setNotifType(type);
    setNotifMessage(message);
    setNotifOpen(true);
  }

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);

  // Form declaration
  const [form, setForm] = useState({
    fullName: user?.full_name || "",
    username: user?.username || "",
    email: user?.email || "",
    password: "",
    role: user?.role || "",
    avatarUrl: avatarUrl || "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Open modal, close modal, save modal
  function handleEditToggle() {
    setModalOpen(true);
  }

  function handleModalClose () {
    setModalOpen(false);
  }
  
  function handleModalSave() {
    handleSave();
    setModalOpen(false);
  }

  // Save from modal or form submit
  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    const updated = {
      full_name: form.fullName,
      username: form.username,
      email: form.email,
      ...(form.password ? { password: form.password } : {}),
      role: form.role,
      avatarUrl: form.avatarUrl || null,
    };

    try {
      // Kirim ke backend
      const res = await updateUser("me", updated);

      if (res.status === "success") {
        // simpan ke localStorage agar tetap ada di FE
        localStorage.setItem("user", JSON.stringify(res.data));
        setUser(res.data);

        // dispatch custom event supaya komponen lain tahu
        window.dispatchEvent(new CustomEvent("user-updated", { detail: res.data }));

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

  function handleModalSave() {
    handleSave();
    setModalOpen(false);
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
            {/* Avatar shows initials from user.full_name */}
            <Avatar
              size="xl"
              name={user?.full_name || "Unknown User"} // initials fallback
              src={avatarUrl || user?.avatarUrl || undefined}
              style={{
                width: "168px",
                height: "168px",
                fontSize: "32px",
              }}
            />
          </div>

          <div className="basic-info">
            <h3 className="name">{user?.full_name || 'Unknown User'}</h3>

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
              value="********"
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
          form={form}
          onChange={handleChange}
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