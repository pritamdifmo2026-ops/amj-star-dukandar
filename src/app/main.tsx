import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '../index.css';

if (import.meta.env.PROD || (typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1'))) {
  console.log = () => {};
  console.debug = () => {};
  console.info = () => {};
}

const root = document.getElementById('root');

if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
