import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import Router from './routes/Router';
import './App.css';

console.log('main.jsx start');

const rootEl = document.getElementById('root');
if (!rootEl) console.error('root element not found');
createRoot(rootEl).render(
  <React.StrictMode>
    <BrowserRouter>
      <Router />
    </BrowserRouter>
  </React.StrictMode>
);
