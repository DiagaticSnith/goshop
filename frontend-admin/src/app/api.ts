import axios from "axios";

const getDefaultBackend = () => {
  if (!import.meta.env.PROD) return "http://localhost:3000";
  if (import.meta.env.VITE_BACKEND_URL) return import.meta.env.VITE_BACKEND_URL as string;
  try {
    const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
    return `http://${host}:3000`;
  } catch (e) {
    return "http://localhost:3000";
  }
};

export const api = axios.create({
  baseURL: getDefaultBackend()
});

export default api;
