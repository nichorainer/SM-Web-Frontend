import React, { useState, useEffect } from 'react';
import { Avatar, Spinner } from '@chakra-ui/react';
import '../styles/edit-profile-modal.css';
import { updateUser } from '../utils/auth';

export default function EditProfileModal({ isOpen, onClose, user, onUserUpdated}) {
  if (!isOpen) return null;
  // For loading effect
  const [loading, setLoading] = useState(false);

  // Local form state initialized from user prop
  const [form, setForm] = useState({
    fullName: user?.full_name || '',
    username: user?.username || '',
    email: user?.email || '',
    password: '',
    avatarUrl: user?.avatar_url || ''
  });

  // Reset form everytime Edit Profile Modal opens
  useEffect(() => {
    if (isOpen && user) {
      const storedAvatar = localStorage.getItem("avatar");
      setForm({
        fullName: user.full_name || '',
        username: user.username || '',
        email: user.email || '',
        password: '',
        avatarUrl: storedAvatar || ''
      });
    }
  }, [isOpen, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Edit profile handler
  const handleSave = async () => {
    try {
      setLoading(true);
      // Ambil userId dari localStorage
      const raw = localStorage.getItem("user");
      const parsed = raw ? JSON.parse(raw) : null;
      const userId = parsed?.id;

      if (!userId) {
        alert("No user ID found");
        return;
      }

      // Payload sesuai field BE
      const payload = {
        id: userId,
        full_name: form.fullName,
        username: form.username,
        email: form.email,
        password: form.password || "",
      };

      // Panggil helper updateUser dari auth.js
      const result = await updateUser(userId, payload);

      if (result.status === "error") {
        throw new Error(result.message);
      }

      // Simpan hasil update ke localStorage
      const updatedUser = result.data || result; 
      localStorage.setItem("user", JSON.stringify(result.data || result));
      onUserUpdated?.(updatedUser);
      window.dispatchEvent(new CustomEvent('user:refreshed', { detail: { user: updatedUser } }));

      // Tutup modal / refresh state
      onClose();
    } catch (err) {
      console.error("handleSave error:", err);
      alert("Error updating profile");
    } finally {
      setTimeout(() => setLoading(false), 5000);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Edit Profile</h3>

        <div className="modal-avatar">
          {/* Show avatar preview */}
          <Avatar
            size="xl"
            name={form.fullName || "Unknown User"}
            src={form.avatarUrl || undefined}
          />
        </div>

        <div className="modal-form">
          <label>Full Name</label>
          <input
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
            placeholder="Enter your new full name"
          />

          <label>Username</label>
          <input
            name="username"
            value={form.username}
            onChange={handleChange}
            placeholder="Enter your new username"
          />

          <label>E-mail</label>
          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Enter your new e-mail"
          />

          <label>Password</label>
          <input
            name="password"
            value={form.password}
            onChange={handleChange}
            type="password"
            placeholder="Enter your new password"
          />
          {/* Save Button and Cancel Button */}
          <div className="modal-actions">
            <button 
              className="btn-primary" 
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner size="sm" /> Saving...
                </>
              ) : (
                "Save"
              )}
            </button>
            <button
            className="btn-subtle" 
            onClick={onClose}
            disabled={loading}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
