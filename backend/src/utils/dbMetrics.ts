import prisma from '../config/prisma-client';
import { register } from './metrics';
import client from 'prom-client';

let intervalHandle: NodeJS.Timeout | null = null;

function createGauges() {
  const Gauge = client.Gauge;
  return {
    threads_connected: new Gauge({ name: 'mysql_threads_connected', help: 'Threads connected', registers: [register] }),
    threads_running: new Gauge({ name: 'mysql_threads_running', help: 'Threads running', registers: [register] }),
    queries_total: new Gauge({ name: 'mysql_queries_total', help: 'Global queries total (snapshot)', registers: [register] }),
    slow_queries_total: new Gauge({ name: 'mysql_slow_queries_total', help: 'Slow queries total', registers: [register] }),
    innodb_buffer_pool_pages_free: new Gauge({ name: 'mysql_innodb_buffer_pool_pages_free', help: 'InnoDB buffer pool pages free', registers: [register] }),
    innodb_buffer_pool_pages_total: new Gauge({ name: 'mysql_innodb_buffer_pool_pages_total', help: 'InnoDB buffer pool pages total', registers: [register] })
  };
}

async function collectOnce(gauges: ReturnType<typeof createGauges> | null) {
  if (!gauges) return;
  try {
    // Use raw query; $queryRaw returns any[] for MySQL
    const rows: any[] = await (prisma as any).$queryRawUnsafe('SHOW GLOBAL STATUS');
    const map: Record<string, number> = {};
    for (const r of rows) {
      const name = r.Variable_name || r.variable_name || r.Variable_name?.toString();
      const val = r.Value || r.value || r.Value?.toString();
      if (!name) continue;
      const num = Number(val);
      if (!Number.isNaN(num)) map[String(name)] = num;
    }

    if (map.Threads_connected !== undefined) gauges.threads_connected.set(map.Threads_connected);
    if (map.Threads_running !== undefined) gauges.threads_running.set(map.Threads_running);
    if (map.Queries !== undefined) gauges.queries_total.set(map.Queries);
    if (map.Slow_queries !== undefined) gauges.slow_queries_total.set(map.Slow_queries);
    if (map.Innodb_buffer_pool_pages_free !== undefined) gauges.innodb_buffer_pool_pages_free.set(map.Innodb_buffer_pool_pages_free);
    if (map.Innodb_buffer_pool_pages_total !== undefined) gauges.innodb_buffer_pool_pages_total.set(map.Innodb_buffer_pool_pages_total);
  } catch (err: any) {
    // Many managed DBs may restrict SHOW GLOBAL STATUS; warn and continue
    console.warn('dbMetrics: failed to collect MySQL status:', err && err.message);
  }
}

export default {
  start: (opts: { intervalMs?: number } = {}) => {
    if (!prisma) {
      console.info('dbMetrics: prisma client not available; skipping DB metrics');
      return;
    }
    const gauges = createGauges();
    const intervalMs = opts.intervalMs || 15000;
    // Initial collection
    collectOnce(gauges).then(() => console.info('dbMetrics: initial collection complete')).catch(() => {});
    intervalHandle = setInterval(() => collectOnce(gauges), intervalMs);
    console.info('dbMetrics: started polling MySQL status every', intervalMs, 'ms');
  },
  stop: () => {
    if (intervalHandle) {
      clearInterval(intervalHandle);
      intervalHandle = null;
    }
  }
};
