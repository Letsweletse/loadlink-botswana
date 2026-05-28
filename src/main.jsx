import React from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { getRouter } from './router';
import { ErrorBoundary } from './components/ErrorBoundary';
import './styles.css';

const root = document.getElementById('root');

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('Van-Link service worker registration failed', error);
    });
  });
}

if (root) {
  const router = getRouter();
  createRoot(root).render(
    <React.StrictMode>
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </React.StrictMode>,
  );
}
