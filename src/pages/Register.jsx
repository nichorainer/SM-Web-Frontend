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
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    if (!full_name.trim() || !username.trim() || !email.trim() || !password) {
      setError('All fields are required');
      return false;
    }
    // basic email format check
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      // Call backend register API
      const res = await registerUser({
        full_name,
        username,
        email,
        password,
        permissions: {
          orders: true,
          products: true,
          users: false,
        },
      });
      
      if (res && res.status === "success") {
        // Navigate to login page
        navigate('/login', { replace: true });
      } else {
        setError(res?.message || "Failed to register");
      }
    } catch (err) {
      console.error('register error', err);
      setError(err?.message || "Unexpected error during registration");
    } finally {
      setSubmitting(false);
    }
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
              value={full_name}
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
              placeholder="User@example.com"
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