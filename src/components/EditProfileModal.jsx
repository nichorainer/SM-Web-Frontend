import React, { useState, useEffect } from 'react';
import { Avatar } from '@chakra-ui/react';
import '../styles/edit-profile-modal.css';

export default function EditProfileModal({ isOpen, onClose, user, token, onUserUpdated }) {
  if (!isOpen) return null;

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

  const handleSave = async () => {
    try {
      const res = await fetch('http://localhost:8080/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          full_name: form.fullName,
          username: form.username,
          email: form.email,
          password: form.password,
          // avatar tidak dikirim ke backend, hanya disimpan lokal
        })
      });

      if (!res.ok) throw new Error('Failed to update profile');

      const data = await res.json();
      onUserUpdated(data.data);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error updating profile');
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

          <div className="modal-actions">
            <button className="btn-primary" onClick={handleSave}>
              Save
            </button>
            <button className="btn-subtle" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}