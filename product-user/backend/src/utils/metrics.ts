import client from 'prom-client';

// Create registry and collect defaults
export const register = new client.Registry();
client.collectDefaultMetrics({ register });

// HTTP metrics
export const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register]
});

export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register]
});

// In-flight requests gauge
export const inFlightRequests = new client.Gauge({
  name: 'http_in_flight_requests',
  help: 'In-flight HTTP requests',
  registers: [register]
});

// Business metrics
export const ordersConfirmedCounter = new client.Counter({
  name: 'orders_confirmed_total',
  help: 'Total number of confirmed orders',
  labelNames: ['source'],
  registers: [register]
});

export const ordersRejectedCounter = new client.Counter({
  name: 'orders_rejected_total',
  help: 'Total number of rejected orders',
  labelNames: ['source'],
  registers: [register]
});

// Frontend events counter (generic)
export const frontendEventsCounter = new client.Counter({
  name: 'frontend_events_total',
  help: 'Frontend events received via beacon',
  labelNames: ['event', 'page', 'userAgent'],
  registers: [register]
});

// Helper to safely increment frontend events
export function recordFrontendEvent(event: string, labels: Record<string, string | undefined> = {}) {
  try {
    frontendEventsCounter.inc({ event, page: labels.page || 'unknown', userAgent: labels.userAgent || 'unknown' }, 1);
  } catch (e) {
    // ignore metric errors
  }
}

export default client;
