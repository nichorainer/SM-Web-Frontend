import React from 'react';
import { Avatar } from '@chakra-ui/react';
import '../styles/edit-profile-modal.css';

export default function EditProfileModal({ isOpen, onClose, form, onChange, onSave }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Edit Profile</h3>

        <div className="modal-avatar">
          {/* Avatar shows initials from user.full_name */}
            <Avatar
              size="xl"
              name={form?.full_name || "Unknown User"} // initials fallback
              src={form.avatarUrl || undefined}
              style={{
                width: "168px",
                height: "168px",
                fontSize: "32px",
              }}
            />
        </div>

        <div className="modal-form">
          <label>Full Name</label>
          <input name="fullName" onChange={onChange} placeholder="Enter your new full name"/>

          <label>Username</label>
          <input name="username" onChange={onChange} placeholder="Enter your new username"/>

          <label>E-mail</label>
          <input name="email" onChange={onChange} placeholder="Enter your new e-mail"/>

          <label>Password</label>
          <input name="password" onChange={onChange} type="password" placeholder="Enter your new password"/>

          <div className="modal-actions">
            <button
              className="btn-primary"
              onClick={() => {
                // parent will validate and call updateUser
                onSave();
              }}
            >
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