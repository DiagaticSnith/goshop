// Minimal Jest setup to provide a safe `global.prisma` mocked object
// This prevents tests from triggering a real PrismaClient construction
// when modules import `src/config/prisma-client.ts`.

if (!global.prisma) {
  // Provide the minimal shape used across controllers/tests.
  // Tests that need specific behavior should override these methods.
  global.prisma = {
    user: {
      findUnique: async () => null,
      findFirst: async () => null,
      create: async () => null,
      update: async () => null,
    },
    product: {
      findUnique: async () => null,
      findMany: async () => [],
      create: async () => null,
      update: async () => null,
      delete: async () => null,
      count: async () => 0,
    },
    checkoutSession: {
      findUnique: async () => null,
    },
    order: {
      create: async () => null,
      findUnique: async () => null,
      findMany: async () => []
    },
    cartItem: {
      findUnique: async () => null,
      findMany: async () => []
    },
    // Generic helpers used in some code paths
    $transaction: async (cb) => {
      if (typeof cb === 'function') return cb();
      return [];
    },
    $connect: async () => {},
    $disconnect: async () => {}
  };
}

// Silence stray console warnings in tests that are expected by design.
// Tests can still assert on logs if they mock console methods directly.
// (Leave default console behavior otherwise.)
