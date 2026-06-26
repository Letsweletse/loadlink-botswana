import React from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { getRouter } from './router';
import { ErrorBoundary } from './components/ErrorBoundary';
import './styles.css';

const root = document.getElementById('root');
const RECOVERY_KEY = 'vanlink_runtime_recovery_done';

async function clearVanLinkCaches() {
  try {
    if (!('caches' in window)) return;
    const keys = await window.caches.keys();
    await Promise.all(keys.filter((key) => key.toLowerCase().includes('vanlink')).map((key) => window.caches.delete(key)));
  } catch (error) {
    console.warn('Van-Link cache cleanup skipped', error);
  }
}

function looksLikeStaleBuild(error) {
  const message = String(error?.message || error || '').toLowerCase();
  return message.includes('chunk') || message.includes('dynamically imported') || message.includes('module script') || message.includes('mime type');
}

async function recover(error) {
  if (!looksLikeStaleBuild(error)) return;
  try {
    if (window.sessionStorage.getItem(RECOVERY_KEY) === 'true') return;
    window.sessionStorage.setItem(RECOVERY_KEY, 'true');
  } catch {
    return;
  }
  await clearVanLinkCaches();
  window.location.href = window.location.pathname + window.location.search + window.location.hash;
}

window.addEventListener('error', (event) => {
  void recover(event.error || event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  void recover(event.reason);
});

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => registration.update().catch(() => null))
      .catch((error) => {
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
