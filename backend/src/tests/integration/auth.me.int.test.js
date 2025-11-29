const express = require('express');
const request = require('supertest');
jest.setTimeout(20000);

describe('Integration: GET /auth/me', () => {
  afterEach(() => {
    jest.resetModules();
    delete global.prisma;
  });

  test('returns user info when authenticated', async () => {
    jest.resetModules();
    jest.doMock('../../middleware/authMiddleware', () => ({ authMiddleware: (req, res, next) => { req.uid = 'uid-1'; next(); } }));
    global.prisma = { user: { findUnique: jest.fn().mockResolvedValue({ firebaseId: 'uid-1', email: 'a@b.com', role: 'USER', fullName: 'Alice', status: 'ACTIVE' }) } };

    const authRoutes = require('../../routes/auth').default;
    const app = express();
    app.use(express.json());
    app.use('/auth', authRoutes);

    const res = await request(app).get('/auth/me');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ email: 'a@b.com', role: 'USER', fullName: 'Alice', status: 'ACTIVE' });
  });

  test('returns 404 when user missing', async () => {
    jest.resetModules();
    jest.doMock('../../middleware/authMiddleware', () => ({ authMiddleware: (req, res, next) => { req.uid = 'uid-2'; next(); } }));
    global.prisma = { user: { findUnique: jest.fn().mockResolvedValue(null) } };
    const authRoutes = require('../../routes/auth').default;
    const app = express(); app.use(express.json()); app.use('/auth', authRoutes);
    const res = await request(app).get('/auth/me');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: 'User not found' });
  });

  test('returns 500 when prisma throws', async () => {
    jest.resetModules();
    jest.doMock('../../middleware/authMiddleware', () => ({ authMiddleware: (req, res, next) => { req.uid = 'uid-3'; next(); } }));
    global.prisma = { user: { findUnique: jest.fn().mockRejectedValue(new Error('db fail')) } };
    const authRoutes = require('../../routes/auth').default;
    const app = express(); app.use(express.json()); app.use('/auth', authRoutes);
    const res = await request(app).get('/auth/me');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: 'Unable to load session' });
  });
});
