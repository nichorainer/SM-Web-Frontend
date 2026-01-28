import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../utils/auth';
import '../utils/auth.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState(''); // to identify email/username
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // Call backend login API
      const res = await loginUser({
        username_or_email: usernameOrEmail,
        password,
      });

      // Pastikan res selalu ada dan punya status
      if (res && res.status === "success") {
        // Save JWT token to localStorage
        if (res.data?.token) {
          localStorage.setItem("token", res.data.token);
        }

        // Navigate to home or profile page
        navigate('/', { replace: true });
      } else {
        setError(res?.message || "Login failed");
      }
    } catch (err) {
      console.error('login error', err);
      // Gunakan fallback aman untuk error
      setError(err?.message || "Unexpected error during login");
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <div className="auth-root">
      <div className="auth-card">
        <h2 className="auth-title">Login</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <label className="field">
            <span className="label-text">Username or E-mail</span>
            <input
              type="text"
              name="identifier"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="username or e-mail"
              autoComplete="username"
              required
            />
          </label>

          <label className="field">
            <span className="label-text">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="enter your password here"
              autoComplete="current-password"
              required
            />
          </label>

          {error && <div className="auth-error">{error}</div>}

          <button className="btn-primary auth-btn" type="submit" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Login'}
          </button>

          <div className="auth-footer">
            <span>Don't have an account?</span>
            <Link to="/register" className="link"> Register</Link>
          </div>
        </form>
      </div>
    </div>
  );
}