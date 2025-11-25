import axios from "axios";

// Helper to read Vite's `import.meta.env` but with a Node/Jest-friendly fallback.
const readImportMetaEnv = (): Record<string, any> => {
  // Allow tests to inject configuration via `globalThis.__IMPORT_META_ENV__`.
  // @ts-ignore
  if ((globalThis as any).__IMPORT_META_ENV__) return (globalThis as any).__IMPORT_META_ENV__;
  try {
    // In Vite/browser this is available as `import.meta.env`.
    // Use try/catch and `@ts-ignore` to avoid TypeScript/Node issues.
    // @ts-ignore
    const env = (import.meta as any).env;
    if (env) return env;
  } catch (e) {
    // ignore - fallback to empty
  }
  return {};
};

export const getDefaultBackend = () => {
  const env = readImportMetaEnv();
  if (!env.PROD) return "http://localhost:3000";
  if (env.VITE_API_URL) return env.VITE_API_URL as string;
  if (env.VITE_BACKEND_URL) return env.VITE_BACKEND_URL as string;
  try {
    const host = typeof window !== "undefined" ? (window as any).location.hostname : "localhost";
    const runtimeDefault = `http://${host}:3000`;
    if (typeof window !== "undefined" && host && (host.startsWith("user-") || host.startsWith("admin-"))) {
      console.warn("[api] Forcing backend to https://backend-production-9be7.up.railway.app (temporary)");
      console.log("[api] Resolved baseURL -> https://backend-production-9be7.up.railway.app");
      return "https://backend-production-9be7.up.railway.app";
    }
    try {
      console.log(`[api] Resolved baseURL -> ${runtimeDefault}`);
    } catch (e) {
      // ignore logging errors in some runtimes
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
