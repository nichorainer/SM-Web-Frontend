import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../utils/auth';
import '../utils/auth.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [full_name, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !email.trim() || !password) {
      setError('All fields are required');
      return;
    }
    setSubmitting(true);
    // Simulate register (replace with API call)
    setTimeout(() => {
      registerUser({ name, email, password });
      setSubmitting(false);
      navigate('/login', { replace: true });
    }, 800);
  };

  return (
    <div className="auth-root">
      <div className="auth-card">
        <h2 className="auth-title">Register</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          {/* Full Name Form */}
          <label className="field">
            <span className="label-text"> Full Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              required
            />
          </label>
          {/* Username Form */}
          <label className="field">
            <span className="label-text">Username</span>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Choose a username"
              required
            />
          </label>
          {/* E-mail Form */}
          <label className="field">
            <span className="label-text">E-mail</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
            />
          </label>
          {/* Password Form */}
          <label className="field">
            <span className="label-text">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password here"
              required
            />
          </label>

          {error && <div className="auth-error">{error}</div>}

          <button className="btn-primary auth-btn" type="submit" disabled={submitting}>
            {submitting ? 'Creating account...' : 'Register'}
          </button>

          <div className="auth-footer">
            <span>Already have an account?</span>
            <Link to="/login" className="link"> Login</Link>
          </div>
        </form>
      </div>
    </div>
  );
}