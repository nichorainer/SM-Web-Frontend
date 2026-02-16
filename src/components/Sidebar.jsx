import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import '../styles/sidebar.css';
import { logout } from '../utils/auth';

export default function Sidebar() {
  const linkClass = ({ isActive }) => `nav-item ${isActive ? 'active' : ''}`;
  const navigate = useNavigate()
  
  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="sidebar-brand">
          <div className="sidebar-logo">SM</div>
          <div className="brand-text">SM Web</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/home" className={linkClass} end>Home</NavLink>
        <NavLink to="/orders" className={linkClass}>Orders</NavLink>
        <NavLink to="/products" className={linkClass}>Products</NavLink>
        <NavLink to="/users" className={linkClass}>Users</NavLink>
        <NavLink to="/profile" className={linkClass}>Profile</NavLink>
      </nav>
      <div className="sidebar-bottom">
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </aside>
  );
}