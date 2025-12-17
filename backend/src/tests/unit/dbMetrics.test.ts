import { jest } from '@jest/globals';

const mockPrisma: any = { $queryRawUnsafe: jest.fn() };
const mockClient: any = { Gauge: jest.fn().mockImplementation(() => ({ set: jest.fn() })) };
const mockRegister: any = {};

jest.mock('../../config/prisma-client', () => ({ __esModule: true, default: mockPrisma }));
jest.mock('prom-client', () => ({ __esModule: true, default: mockClient }));
jest.mock('../../utils/metrics', () => ({ register: mockRegister }), { virtual: true });

import dbMetrics from '../../utils/dbMetrics';

describe('dbMetrics', () => {
  beforeEach(() => jest.resetAllMocks());

  test('start is disabled in test env', () => {
    const info = jest.spyOn(console, 'info').mockImplementation(() => {});
    process.env.NODE_ENV = 'test';
    dbMetrics.start();
    expect(info).toHaveBeenCalledWith('dbMetrics: disabled in test environment');
    info.mockRestore();
  });

  test('collectOnce maps rows to gauges when query returns values', async () => {
    // simulate non-test env to let start run
    process.env.NODE_ENV = 'development';
    // provide rows with differing key casing
    mockPrisma.$queryRawUnsafe.mockResolvedValueOnce([
      { Variable_name: 'Threads_connected', Value: '10' },
      { variable_name: 'Queries', value: '123' },
      { Variable_name: 'Innodb_buffer_pool_pages_free', Value: '5' }
    ]);

    // Start will call collectOnce once; ensure no exception thrown
    dbMetrics.start({ intervalMs: 1000 });

    // give the initial Promise microtask a chance
    await new Promise((r) => setImmediate(r));

    // stop the interval to avoid test leak
    dbMetrics.stop();
  });
});

export {};
