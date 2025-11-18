import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './assets/styles/styles.css'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { store, persistor } from './app/store'
import { AuthProvider } from './context/AuthContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <QueryClientProvider client={new QueryClient()}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </QueryClientProvider>
      </PersistGate>
    </Provider>
  </React.StrictMode>
)

// Send page load telemetry to backend
try {
  const sendPageLoad = () => {
    try {
      const navEntries = (performance.getEntriesByType && performance.getEntriesByType('navigation')) || [];
      const nav = navEntries[0] as any;
      let durationSec = 0;
      if (nav && typeof nav.loadEventEnd === 'number' && nav.loadEventEnd > 0) {
        durationSec = nav.loadEventEnd / 1000;
      } else if (typeof performance.now === 'function') {
        durationSec = performance.now() / 1000;
      }
      const payload = JSON.stringify({ event: 'page_load', route: location.pathname, origin: location.origin, duration: durationSec });
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/metrics/events', payload);
      } else {
        fetch('/metrics/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload }).catch(() => {});
      }
    } catch (e) {}
  };
  if (document.readyState === 'complete') {
    setTimeout(sendPageLoad, 0);
  } else {
    window.addEventListener('load', () => setTimeout(sendPageLoad, 0));
  }
} catch (e) {}
