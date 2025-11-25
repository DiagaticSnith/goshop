import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./assets/styles/styles.css";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./app/store";
import { QueryClientProvider, QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";
import { persistor } from "./app/store";
import { PersistGate } from "redux-persist/integration/react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AxiosError } from "axios";
import { api } from './app/api';

const queryClient = new QueryClient({
    queryCache: new QueryCache({
        onError: (error) => {
            if (error instanceof AxiosError) {
                toast.error(error.message);
            }
        },
    }),
    mutationCache: new MutationCache({
        onError: (error) => {
            if (error instanceof AxiosError) {
                toast.error(error.response?.data.message);
            }
        },
    }),
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <BrowserRouter>
            <QueryClientProvider client={queryClient}>
                <Provider store={store}>
                    <PersistGate loading={null} persistor={persistor}>
                        <App />
                    </PersistGate>
                </Provider>
            </QueryClientProvider>
        </BrowserRouter>
    </React.StrictMode>
);

// Send a lightweight page load telemetry event to backend
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
            const base = (api && (api as any).defaults && (api as any).defaults.baseURL) ? String((api as any).defaults.baseURL).replace(/\/$/, '') : '';
            const target = base ? `${base}/metrics/events` : '/metrics/events';
            if (navigator.sendBeacon) {
                navigator.sendBeacon(target, payload);
            } else {
                fetch(target, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload }).catch(() => {});
            }
        } catch (e) {}
    };
    if (document.readyState === 'complete') {
        setTimeout(sendPageLoad, 0);
    } else {
        window.addEventListener('load', () => setTimeout(sendPageLoad, 0));
    }
} catch (e) {}
