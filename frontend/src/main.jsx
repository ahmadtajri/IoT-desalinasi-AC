import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Service Worker cleanup: unregister OLD/stale service workers
// but allow the new VitePWA service worker to register properly
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
            // Only unregister old SW that don't match current scope
            // VitePWA will register the proper new one automatically
            const swUrl = registration.active?.scriptURL || '';
            if (swUrl.includes('sw.js') && !swUrl.includes('workbox')) {
                // Old custom sw.js — unregister it
                registration.unregister();
                console.log('[SW] Unregistered old service worker:', swUrl);
            }
        }
    });
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
