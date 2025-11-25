const express = require('express');
const request = require('supertest');

// increase timeout for integration tests
jest.setTimeout(10000);

describe('Integration: POST /auth/session-login', () => {
  afterEach(() => {
    jest.resetModules();
    delete global.prisma;
  });

  test('returns user info when token valid and user exists (happy path)', async () => {
    jest.resetModules();
    // Provide a mocked global.prisma so config/prisma-client will reuse it
    global.prisma = { user: { findUnique: jest.fn().mockResolvedValue({ firebaseId: 'uid-1', email: 'a@b.com', role: 'USER', fullName: 'Alice' }) } };
    // Mock config/firebase so routes use a fake auth.verifyIdToken
    jest.doMock('../config/firebase', () => ({
      auth: { verifyIdToken: jest.fn().mockResolvedValue({ uid: 'uid-1' }) }
    }));

    const authRoutes = require('../routes/auth').default;
    const app = express();
    app.use(express.json());
    app.use('/auth', authRoutes);

    const res = await request(app).post('/auth/session-login').send({ idToken: 'valid-token' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ email: 'a@b.com', role: 'USER', fullName: 'Alice' });
  });

  test('returns 404 when token valid but user not found', async () => {
    jest.resetModules();
    global.prisma = { user: { findUnique: jest.fn().mockResolvedValue(null) } };
    jest.doMock('../config/firebase', () => ({ auth: { verifyIdToken: jest.fn().mockResolvedValue({ uid: 'uid-2' }) } }));
    const authRoutes = require('../routes/auth').default;
    const app = express(); app.use(express.json()); app.use('/auth', authRoutes);

    const res = await request(app).post('/auth/session-login').send({ idToken: 'token' });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: 'User not found' });
  });

  test('returns 403 when account is locked', async () => {
    jest.resetModules();
    global.prisma = { user: { findUnique: jest.fn().mockResolvedValue({ firebaseId: 'uid-3', email: 'b@c.com', role: 'USER', fullName: 'Bob', status: 'HIDDEN' }) } };
    jest.doMock('../config/firebase', () => ({ auth: { verifyIdToken: jest.fn().mockResolvedValue({ uid: 'uid-3' }) } }));
    const authRoutes = require('../routes/auth').default;
    const app = express(); app.use(express.json()); app.use('/auth', authRoutes);

    const res = await request(app).post('/auth/session-login').send({ idToken: 'token' });
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: 'Account is locked' });
  });

  test('returns 401 when token invalid', async () => {
    jest.resetModules();
    jest.doMock('../config/firebase', () => ({ auth: { verifyIdToken: jest.fn().mockRejectedValue(new Error('Invalid token')) } }));
    global.prisma = { user: { findUnique: jest.fn() } };
    const authRoutes = require('../routes/auth').default;
    const app = express(); app.use(express.json()); app.use('/auth', authRoutes);

    const res = await request(app).post('/auth/session-login').send({ idToken: 'bad' });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: 'Invalid token' });
  });
});
