import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import './App.css';

export default function App() {
  return (
    <div className="app-root">
      <Sidebar />
      <div className="main-area">
        <Header />
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}