import axios from "axios";

const getDefaultBackend = () => {
  if (!import.meta.env.PROD) return "http://localhost:3000";
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL as string;
  if (import.meta.env.VITE_BACKEND_URL) return import.meta.env.VITE_BACKEND_URL as string;
  try {
    const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
    const runtimeDefault = `http://${host}:3000`;
    if (typeof window !== "undefined" && host && host.startsWith("user-")) {
      console.warn("[api] Forcing backend to https://backend-production-815c.up.railway.app (temporary)");
      return "https://backend-production-815c.up.railway.app";
    }
    return runtimeDefault;
  } catch (e) {
    return "http://localhost:3000";
  }
};

export const api = axios.create({
  baseURL: getDefaultBackend()
});

export default api;
