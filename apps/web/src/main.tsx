import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './fonts';
import './i18n';
import './index.css';
import { App } from './app/App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// When a new version is published, the updated service worker takes control (skipWaiting + clientsClaim).
// Reload once at that moment so children never stay on an outdated cached build.
if ('serviceWorker' in navigator) {
  const hadController = !!navigator.serviceWorker.controller;
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return; // first install: nothing stale to replace
    reloading = true;
    window.location.reload();
  });
  // Check for a new version whenever the app comes back to the foreground.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      navigator.serviceWorker.getRegistration().then((r) => r?.update()).catch(() => undefined);
    }
  });
}
