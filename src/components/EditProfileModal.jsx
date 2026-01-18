import React from 'react';
import { Avatar } from '@chakra-ui/react';
import './edit-profile-modal.css'; // optional custom styling

export default function EditProfileModal({ isOpen, onClose, form, onChange, onSave }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Edit Profile</h3>

        <div className="modal-avatar">
          <Avatar name={form.fullName || 'User'} src={form.avatarUrl} boxSize="64px" />
        </div>

        <div className="modal-form">
          <label>Full Name</label>
          <input name="fullName" value={form.fullName} onChange={onChange} />

          <label>Username</label>
          <input name="username" value={form.username} onChange={onChange} />

          <label>Email</label>
          <input name="email" value={form.email} onChange={onChange} />

          <label>Password</label>
          <input name="password" value={form.password} onChange={onChange} type="password" />

          <div className="modal-actions">
            <button className="btn-primary" onClick={onSave}>Save</button>
            <button className="btn-ghost" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}