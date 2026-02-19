import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            manifest: false, // Use custom manifest.json in /public
            registerType: 'prompt', // Ask user before updating (safer, no auto-reload)
            workbox: {
                // Only cache local static assets (JS, CSS, images, fonts)
                // DO NOT cache API calls (they're cross-origin and need real-time data)
                globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,gif,woff,woff2}'],

                // SPA navigation fallback
                navigateFallback: '/index.html',
                navigateFallbackDenylist: [
                    /^\/api/,     // Don't intercept /api routes
                    /^\/sw\.js/,  // Don't intercept service worker file
                ],

                // NO runtime caching for API calls
                // API is on separate domain (api.desalinasiac.cloud)
                // and should ALWAYS fetch from network for real-time data
                runtimeCaching: [],

                // Don't take control immediately (prevents reload loop)
                clientsClaim: false,
                skipWaiting: false,
            }
        })
    ],
    resolve: {
        dedupe: ['react', 'react-dom']
    },
    server: {
        host: true,
        port: 5173,
    },
})
