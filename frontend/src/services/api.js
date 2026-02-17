import axios from 'axios';

// Automatically detect the correct API URL based on current hostname
// This allows the app to work on both localhost and network IP
const getApiBaseUrl = () => {
    // Get current hostname (e.g., 'localhost' or '192.168.43.238')
    const hostname = window.location.hostname;

    // Backend always runs on port 3000
    const backendPort = 3000;

    // Use the same hostname as frontend, but with backend port
    // This ensures that:
    // - localhost:5173 -> localhost:3000
    // - 192.168.43.238:5173 -> 192.168.43.238:3000
    return `http://${hostname}:${backendPort}/api`;
};

const api = axios.create({
    baseURL: getApiBaseUrl(),
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 second timeout
});

// Add request interceptor to include JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('iot_access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        console.log(`📡 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
    },
    (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
    }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
    (response) => {
        console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - Status: ${response.status}`);
        return response;
    },
    (error) => {
        if (error.code === 'ECONNABORTED') {
            console.error('⏱️ Request Timeout:', error.config?.url);
            error.message = 'Request timeout - Backend mungkin tidak merespons';
        } else if (error.code === 'ERR_NETWORK') {
            console.error('🌐 Network Error:', error.config?.url);
            error.message = 'Tidak dapat terhubung ke backend. Pastikan backend berjalan di port 3000';
        } else if (error.response) {
            console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url} - Status: ${error.response.status}`, error.response.data);
        } else {
            console.error('❌ Unknown Error:', error.message);
        }
        return Promise.reject(error);
    }
);

// Log the API URL for debugging
console.log('🔗 API Base URL:', api.defaults.baseURL);

export default api;
