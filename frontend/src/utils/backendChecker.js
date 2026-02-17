/**
 * Backend Connection Checker Utility
 * Checks if the backend is running and accessible
 */

import axios from 'axios';

export const checkBackendConnection = async () => {
    const hostname = window.location.hostname;
    const backendUrl = `http://${hostname}:3000`;
    
    try {
        console.log('🔍 Checking backend connection at:', backendUrl);
        const response = await axios.get(`${backendUrl}/api`, { timeout: 5000 });
        
        if (response.data) {
            console.log('✅ Backend is running!', response.data);
            return {
                status: 'online',
                message: 'Backend terhubung',
                data: response.data
            };
        }
    } catch (error) {
        console.error('❌ Backend check failed:', error.message);
        
        if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
            return {
                status: 'offline',
                message: `Backend tidak dapat dijangkau di ${backendUrl}:3000. Pastikan backend sedang berjalan.`,
                error: error.message
            };
        } else if (error.code === 'ECONNABORTED') {
            return {
                status: 'timeout',
                message: 'Backend tidak merespons dalam waktu yang ditentukan',
                error: error.message
            };
        } else {
            return {
                status: 'error',
                message: error.message || 'Terjadi kesalahan saat memeriksa backend',
                error: error.message
            };
        }
    }
};

// Auto-check backend on app load (can be called from App.jsx)
export const autoCheckBackend = async () => {
    const result = await checkBackendConnection();
    
    if (result.status !== 'online') {
        console.warn('⚠️ BACKEND WARNING:', result.message);
        
        // Show a user-friendly notification
        if (typeof window !== 'undefined' && window.localStorage) {
            const lastWarning = localStorage.getItem('backend_warning_time');
            const now = Date.now();
            
            // Only show warning once every 5 minutes
            if (!lastWarning || now - parseInt(lastWarning) > 5 * 60 * 1000) {
                localStorage.setItem('backend_warning_time', now.toString());
                
                // You can integrate with your toast/notification system here
                console.error('🚨 BACKEND TIDAK TERHUBUNG:', result.message);
            }
        }
    }
    
    return result;
};
