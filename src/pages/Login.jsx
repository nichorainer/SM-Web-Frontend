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

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    // Validate using identifier (not `email`) — identifier can be email or username
    if (!identifier.trim() || !password) {
      setError('Username/E-mail and Password are required');
      return;
    }

    setSubmitting(true);

     try {
      // Attempt login treating identifier as an email first
      let result;
      try {
        // loginUser should validate and throw or return falsy on failure
        result = loginUser({ email: identifier.trim(), password });
      } catch (errEmail) {
        // If email attempt fails, try using identifier as username
        try {
          result = loginUser({ username: identifier.trim(), password });
        } catch (errUser) {
          // Both attempts failed: show friendly error and stop submitting state
          setError('User not registered or invalid credentials.');
          setSubmitting(false);
          return;
        }
      }

      // If loginUser returned null/undefined, treat as failure
      if (!result || !result.user) {
        setError('User not found or invalid credentials.');
        setSubmitting(false);
        return;
      }

      // Successful login: extract token and user
      const { token, user } = result;

      // Optionally persist token/user if loginUser doesn't already do it
      // localStorage.setItem('auth_token', token);
      // localStorage.setItem('sm_user', JSON.stringify(user));

      // Notify other parts of the app (header/profile) about the updated user
      window.dispatchEvent(new CustomEvent('user-updated', { detail: user }));

      // Redirect to home/dashboard
      navigate('/home', { replace: true });
    } catch (err) {
      // Fallback error handling for unexpected errors
      setError(err?.message || 'Failed to sign in. Check your credentials.');
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