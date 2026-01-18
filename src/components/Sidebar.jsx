import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { logoutUser, getUser, isAuthenticated } from '../utils/auth';
import '../styles/sidebar.css';

export default function Sidebar() {
  const navigate = useNavigate();
  const user = getUser();
  const linkClass = ({ isActive }) => `nav-item ${isActive ? 'active' : ''}`;

  const handleLogout = () => {
    logoutUser();
    navigate('/login', { replace: true });
  };

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="logo">SM</div>
        <div className="brand-text">SM Web</div>
      </div>

      <nav className="nav">
        <NavLink to="/" className={linkClass} end>Home</NavLink>
        <NavLink to="/orders" className={linkClass}>Orders</NavLink>
        <NavLink to="/products" className={linkClass}>Products</NavLink>
        <NavLink to="/admin" className={linkClass}>Admin</NavLink>
        <NavLink to="/profile" className={linkClass}>Profile</NavLink>
      </nav>

      {isAuthenticated() && (
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      )}
    </aside>
  );
}