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

export const httpRequestBytesTotal = new client.Counter({
  name: 'http_request_bytes_total',
  help: 'Total bytes received in HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register]
});

export const httpResponseBytesTotal = new client.Counter({
  name: 'http_response_bytes_total',
  help: 'Total bytes sent in HTTP responses',
  labelNames: ['method', 'route', 'status'],
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

// Business metrics (additional)
export const ordersCreated = new client.Counter({
  name: 'orders_created_total',
  help: 'Total number of orders created',
  labelNames: ['source'],
  registers: [register]
});

export const checkoutSuccess = new client.Counter({
  name: 'checkout_success_total',
  help: 'Total number of successful checkouts',
  labelNames: ['source'],
  registers: [register]
});

export const stripeErrors = new client.Counter({
  name: 'stripe_errors_total',
  help: 'Total number of Stripe errors encountered',
  labelNames: ['type'],
  registers: [register]
});

// Frontend events counter (generic)
export const frontendEventsCounter = new client.Counter({
  name: 'frontend_events_total',
  help: 'Frontend events received via beacon',
  labelNames: ['event', 'page', 'userAgent'],
  registers: [register]
});

// Frontend RUM metrics (client -> backend -> Prometheus)
export const frontendPageLoadSeconds = new client.Histogram({
  name: 'frontend_page_load_seconds',
  help: 'Page load time observed from the browser (seconds)',
  labelNames: ['route', 'origin'],
  buckets: [0.1, 0.25, 0.5, 0.75, 1, 1.5, 2, 3, 5],
  registers: [register]
});

export const frontendJsErrors = new client.Counter({
  name: 'frontend_js_errors_total',
  help: 'Total number of JavaScript errors observed in the frontend',
  labelNames: ['route', 'severity'],
  registers: [register]
});

export const frontendResourceErrors = new client.Counter({
  name: 'frontend_resource_errors_total',
  help: 'Total number of resource loading errors observed in the frontend',
  labelNames: ['route', 'resource_type'],
  registers: [register]
});

export const frontendRequests = new client.Counter({
  name: 'frontend_requests_total',
  help: 'Frontend-reported request counts (for synthetic/UX tracking)',
  labelNames: ['route', 'method', 'status'],
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
