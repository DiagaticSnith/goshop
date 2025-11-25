import axios from "axios";

// Prefer explicit VITE_BACKEND_URL. Otherwise build an absolute URL to the backend
// using the current hostname and the default backend port (3000). This ensures
// API requests are sent to the backend service rather than the frontend host.
const getBackendBaseUrl = () => {
    const env = (import.meta.env as any);
    const apiUrl = env.VITE_API_URL || env.VITE_BACKEND_URL;
    if (apiUrl) return apiUrl;
    // If running in a browser, use the window location hostname; otherwise fallback to localhost
    if (typeof window !== 'undefined' && window.location) {
        const protocol = window.location.protocol || 'http:';
        const hostname = window.location.hostname || 'localhost';
        if (hostname.startsWith('user-')) {
            const forced = 'https://goshop-production-d095.up.railway.app';
            console.warn('[api] runtime fallback mapping user-* ->', forced, '(temporary)');
            return forced;
        }
        return `${protocol}//${hostname}:3000`;
    }
    return 'http://localhost:3000';
};

export const api = axios.create({
    baseURL: getBackendBaseUrl()
});

// Helpful runtime log for debugging origins when testing in the browser
if (typeof window !== 'undefined') {
    // eslint-disable-next-line no-console
    console.info('[api] baseURL ->', api.defaults.baseURL);
}
