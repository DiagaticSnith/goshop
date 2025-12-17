// Minimal Jest setup to provide a safe `global.prisma` mocked object
// This prevents tests from triggering a real PrismaClient construction
// when modules import `src/config/prisma-client.ts`.

if (process.env.JEST_SUITE === 'unit') {
  if (!global.prisma) {
    global.prisma = {
      user: { findUnique: async () => null, findFirst: async () => null, create: async () => null, update: async () => null },
      product: { findUnique: async () => null, findMany: async () => [], create: async () => null, update: async () => null, delete: async () => null, deleteMany: async () => null, count: async () => 0 },
      checkoutSession: { findUnique: async () => null },
      order: { create: async () => null, findUnique: async () => null, findMany: async () => [] },
      cartItem: { findUnique: async () => null, findMany: async () => [] },
      $transaction: async (cb) => { if (typeof cb === 'function') return cb(); return []; },
      $connect: async () => {}, $disconnect: async () => {}, $queryRaw: async () => []
    };
    global.prisma.__isMock = true;
  }
} else if (process.env.JEST_SUITE === 'integration') {
  // Provide a simple firebase auth mock for integration tests unless tests set one.
  if (!global.__FIREBASE_AUTH) {
    global.__FIREBASE_AUTH = {
      verifyIdToken: async (token) => ({ uid: (global.__TEST_UID || token || 'test-uid') })
    };
  }
  // In-memory Prisma implementation for integration tests
  const makeInMemoryPrisma = () => {
    const store = new Map();
    const counters = {};
    const byModel = (m) => { if (!store.has(m)) store.set(m, []); return store.get(m); };

      const matchWhere = (item, where) => {
      if (!where) return true;
      // handle logical operators: OR / AND
      if (where.OR && Array.isArray(where.OR)) {
        return where.OR.some((sub) => matchWhere(item, sub));
      }
      if (where.AND && Array.isArray(where.AND)) {
        return where.AND.every((sub) => matchWhere(item, sub));
      }
      // simple matcher: handle { key: value } and { key: { equals, in, contains, gte, lte } }
      return Object.keys(where).every((k) => {
        const v = where[k];
        if (v && typeof v === 'object' && !Array.isArray(v)) {
          if (v.equals !== undefined) return item[k] === v.equals;
          if (v.in && Array.isArray(v.in)) return v.in.includes(item[k]);
          if (v.contains !== undefined && typeof item[k] === 'string') {
            // case-insensitive contains
            return item[k].toString().toLowerCase().includes(v.contains.toString().toLowerCase());
          }
          // Prisma text search compatibility: treat `search` like contains (support trailing *)
          if (v.search !== undefined && typeof item[k] === 'string') {
            let q = v.search.toString();
            // handle trailing wildcard (e.g., 'Bàn*') by removing '*'
            if (q.endsWith('*')) q = q.slice(0, -1);
            return item[k].toString().toLowerCase().includes(q.toLowerCase());
          }
          if (v.gte !== undefined) return (item[k] || 0) >= v.gte;
          if (v.lte !== undefined) return (item[k] || 0) <= v.lte;
          if (v.gt !== undefined) return (item[k] || 0) > v.gt;
          if (v.lt !== undefined) return (item[k] || 0) < v.lt;
          // fallback: attempt shallow match for nested objects
          return Object.keys(v).every((sub) => item[k] && item[k][sub] === v[sub]);
        }
        return item[k] === v;
      });
    };

    const modelApi = (modelName) => ({
      create: async ({ data }) => {
        const coll = byModel(modelName);
        let id;
        // generate numeric auto-increment ids for models that use numeric PKs in production
        if (modelName === 'order' || modelName === 'orderDetails') {
          counters[modelName] = (counters[modelName] || 0) + 1;
          id = data.id !== undefined ? data.id : counters[modelName];
        } else {
          id = data.id || `${modelName.slice(0,3)}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
        }
        const record = { ...data, id };
        // Provide sensible defaults matching production schema
        if (modelName === 'product' && record.status === undefined) record.status = 'ACTIVE';
        if (modelName === 'user' && record.status === undefined) record.status = 'ACTIVE';
        // handle nested create for orders -> orderDetails
        if (modelName === 'order' && data.orderDetails && data.orderDetails.create) {
          coll.push(record);
          const orderId = id;
          const ods = data.orderDetails.create;
          const odColl = byModel('orderDetails');
          for (const od of ods) {
            counters['orderDetails'] = (counters['orderDetails'] || 0) + 1;
            const odId = od.id !== undefined ? od.id : counters['orderDetails'];
            const odRec = { ...od, id: odId, orderId };
            odColl.push(odRec);
          }
          return record;
        }
        coll.push(record);
        return record;
      },
      findUnique: async ({ where, include } = {}) => {
        const coll = byModel(modelName);
        const item = coll.find((i) => matchWhere(i, where)) || null;
        if (!item) return null;
        if (include) {
          if (modelName === 'cart' && include.items) {
            const items = (byModel('cartItem') || []).filter(ci => ci.cartId === item.id);
            if (include.items.include && include.items.include.product) {
              for (const it of items) {
                it.product = (byModel('product') || []).find(p => p.id === it.productId) || null;
              }
            }
            item.items = items;
          }
          if (modelName === 'cartItem' && include.cart) {
            item.cart = (byModel('cart') || []).find(c => c.id === item.cartId) || null;
          }
          if (modelName === 'order' && include.orderDetails) {
            item.orderDetails = (byModel('orderDetails') || []).filter(od => od.orderId === item.id);
          }
        }
        return item;
      },
      findFirst: async ({ where, include } = {}) => {
        const coll = byModel(modelName);
        const item = coll.find((i) => matchWhere(i, where)) || null;
        if (!item) return null;
        if (include) {
          if (modelName === 'cart' && include.items) {
            const items = (byModel('cartItem') || []).filter(ci => ci.cartId === item.id);
            if (include.items.include && include.items.include.product) {
              for (const it of items) {
                it.product = (byModel('product') || []).find(p => p.id === it.productId) || null;
              }
            }
            item.items = items;
          }
        }
        return item;
      },
      findMany: async ({ where, orderBy, include } = {}) => {
        const coll = byModel(modelName).slice();
        let filtered = where ? coll.filter((i) => matchWhere(i, where)) : coll;
        if (orderBy) {
          const ob = Array.isArray(orderBy) ? orderBy[0] : orderBy;
          const key = Object.keys(ob)[0];
          const dirStr = (ob[key] || '').toString().toLowerCase();
          filtered.sort((a, b) => {
            if (a[key] === b[key]) return 0;
            if (a[key] > b[key]) return dirStr === 'desc' ? -1 : 1;
            return dirStr === 'desc' ? 1 : -1;
          });
        }
        if (include && modelName === 'cart') {
          for (const item of filtered) {
            const items = (byModel('cartItem') || []).filter(ci => ci.cartId === item.id);
            if (include.items && include.items.include && include.items.include.product) {
              for (const it of items) it.product = (byModel('product') || []).find(p => p.id === it.productId) || null;
            }
            item.items = items;
          }
        }
        return filtered;
      },
      aggregate: async ({ _sum, where } = {}) => {
        const coll = byModel(modelName);
        const items = where ? coll.filter((i) => matchWhere(i, where)) : coll.slice();
        const result = {};
        if (_sum) {
          result._sum = {};
          for (const key of Object.keys(_sum)) {
            if (_sum[key]) {
              result._sum[key] = items.reduce((acc, it) => acc + (Number(it[key] || 0)), 0);
            }
          }
        }
        return result;
      },
      update: async ({ where, data }) => {
        const coll = byModel(modelName);
        const idx = coll.findIndex((i) => matchWhere(i, where));
        if (idx === -1) throw new Error('Not found');
        coll[idx] = { ...coll[idx], ...data };
        return coll[idx];
      },
      updateMany: async ({ where, data } = {}) => {
        const coll = byModel(modelName);
        const targets = where ? coll.filter((i) => matchWhere(i, where)) : coll.slice();
        for (const item of targets) {
          for (const key of Object.keys(data || {})) {
            const val = data[key];
            if (val && typeof val === 'object' && val.decrement !== undefined) {
              item[key] = (item[key] || 0) - val.decrement;
              if (item[key] < 0) item[key] = 0;
            } else if (val && typeof val === 'object' && val.increment !== undefined) {
              item[key] = (item[key] || 0) + val.increment;
            } else {
              item[key] = val;
            }
          }
        }
        return { count: targets.length };
      },
      delete: async ({ where }) => {
        const coll = byModel(modelName);
        const idx = coll.findIndex((i) => matchWhere(i, where));
        if (idx === -1) return null;
        const [removed] = coll.splice(idx, 1);
        return removed;
      },
      deleteMany: async ({ where } = {}) => {
        const coll = byModel(modelName);
        if (!where) {
          const count = coll.length;
          store.set(modelName, []);
          return { count };
        }
        const toRemove = coll.filter((i) => matchWhere(i, where));
        const remaining = coll.filter((i) => !matchWhere(i, where));
        store.set(modelName, remaining);
        return { count: toRemove.length };
      },
      count: async ({ where } = {}) => {
        const coll = byModel(modelName);
        if (!where) return coll.length;
        return coll.filter((i) => matchWhere(i, where)).length;
      },
    });

    // return the composed in-memory prisma-like API
    const api = {
      user: modelApi('user'),
      product: modelApi('product'),
      order: modelApi('order'),
      orderDetails: modelApi('orderDetails'),
      cart: modelApi('cart'),
      cartItem: modelApi('cartItem'),
      checkoutSession: modelApi('checkoutSession'),
      category: modelApi('category'),
      $connect: async () => {}, $disconnect: async () => {}, $queryRaw: async () => []
    };

    api.$transaction = async (cb) => {
      if (typeof cb === 'function') return cb(api);
      return [];
    };

    return api;
  };

  if (!global.prisma) global.prisma = makeInMemoryPrisma();
  else {
    // replace with in-memory implementation while preserving any explicit mocks
    global.prisma = makeInMemoryPrisma();
  }
  global.prisma.__isMock = true;

  // Seed minimal users expected by tests that don't create them explicitly
  try {
    const g = global.prisma;
    // ensure admin-stats user exists for stats tests
    (async () => {
      const existing = await g.user.findUnique({ where: { firebaseId: 'admin-stats-uid' } });
      if (!existing) {
        await g.user.create({ data: { firebaseId: 'admin-stats-uid', email: 'admin.stats@example.com', fullName: 'Admin Stats', role: 'ADMIN' } });
      }
    })();
  } catch (e) {
    // ignore
  }
}

// Silence stray console warnings in tests that are expected by design.
// Tests can still assert on logs if they mock console methods directly.
// (Leave default console behavior otherwise.)

// Global cleanup to help Jest exit cleanly: disconnect prisma and clear prom-client registry
// setupFiles run before Jest provides test lifecycle globals, so register process
// handlers to ensure cleanup runs even when afterAll isn't available.
const __jest_setup_cleanup = async () => {
  try {
    const p = global.prisma || global.PrismaClient || undefined;
    if (p && typeof p.$disconnect === 'function') {
      // call disconnect, don't await to avoid blocking exit handler
      try { p.$disconnect(); } catch (e) {}
    } else if (global.prisma && typeof global.prisma.$disconnect === 'function') {
      try { global.prisma.$disconnect(); } catch (e) {}
    }
  } catch (e) {
    // ignore
  }

  try {
    const metrics = require('./src/utils/metrics');
    if (metrics && metrics.register && typeof metrics.register.clear === 'function') {
      metrics.register.clear();
    }
  } catch (e) {
    // ignore
  }

  try {
    if (typeof process._getActiveHandles === 'function') {
      const handles = process._getActiveHandles();
      try {
        const types = handles.map(h => (h && h.constructor && h.constructor.name) || typeof h);
        console.info('jest.setup: activeHandles:', types);
      } catch (err) {}
      console.info('jest.setup: rawActiveHandlesCount=', handles.length);
    }
    if (typeof process._getActiveRequests === 'function') {
      const reqs = process._getActiveRequests();
      console.info('jest.setup: activeRequestsCount=', reqs.length || 0);
    }
  } catch (e) {
    // ignore
  }
};

process.on('beforeExit', () => { __jest_setup_cleanup(); });
process.on('exit', () => { try { __jest_setup_cleanup(); } catch (e) {} });

// Also register afterAll if available (for environments that provide it)
if (typeof afterAll === 'function') {
  afterAll(async () => { await __jest_setup_cleanup(); });
}
