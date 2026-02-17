import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            manifest: false, // Use our custom manifest.json
            registerType: 'autoUpdate',
            workbox: {
                clientsClaim: true,
                skipWaiting: true,
                maximumFileSizeToCacheInBytes: 3000000, // 3MB
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/localhost:3000\/api\//,
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'api-cache',
                            networkTimeoutSeconds: 5,
                            expiration: {
                                maxEntries: 50,
                                maxAgeSeconds: 3600 // 1 hour
                            }
                        }
                    }
                ]
            }
        })
    ],
    resolve: {
        // Ensure only one instance of React is used
        dedupe: ['react', 'react-dom']
    },
    server: {
        host: true,
        port: 5173,
        hmr: {
            protocol: 'ws',
            host: 'localhost',
            port: 5173,
        }
    },
})
