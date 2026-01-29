import React, { useState } from 'react';
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
          avatar_url: form.avatarUrl
        })
      });

      if (!res.ok) {
        throw new Error('Failed to update profile');
      }

      const data = await res.json();
      // Notify parent with updated user data
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
          <Avatar
            size="xl"
            name={user?.full_name|| "Unknown User"}
            src={user?.avatar_url || undefined}
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

          <label>Avatar URL</label>
          <input
            name="avatarUrl"
            value={form.avatarUrl}
            onChange={handleChange}
            placeholder="Enter avatar URL"
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