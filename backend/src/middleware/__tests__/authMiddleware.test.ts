import { authMiddleware } from '../../middleware/authMiddleware';

describe('authMiddleware', () => {
  afterEach(() => jest.resetModules());

  test('returns 401 when no Authorization header', async () => {
    const req: any = { headers: {} };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const next = jest.fn();
    await authMiddleware(req, { status } as any, next as any);
    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({ message: 'Authorization is required' });
  });

  test('returns 401 when token invalid', async () => {
    jest.resetModules();
    jest.doMock('../../config/firebase', () => ({ auth: { verifyIdToken: jest.fn().mockRejectedValue(new Error('bad')) } }));
    const { authMiddleware: middleware } = await import('../../middleware/authMiddleware');
    const req: any = { headers: { authorization: 'Bearer badtoken' } };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const next = jest.fn();
    await middleware(req, { status } as any, next as any);
    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({ message: 'Unauthorized' });
  });

  test('returns 403 when user status HIDDEN', async () => {
    jest.resetModules();
    (global as any).prisma = { user: { findUnique: jest.fn().mockResolvedValue({ firebaseId: 'u1', role: 'USER', status: 'HIDDEN' }) } };
    jest.doMock('../../config/firebase', () => ({ auth: { verifyIdToken: jest.fn().mockResolvedValue({ uid: 'u1' }) } }));
    const { authMiddleware: middleware } = await import('../../middleware/authMiddleware');
    const req: any = { headers: { authorization: 'Bearer tok' } };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const next = jest.fn();
    await middleware(req, { status } as any, next as any);
    expect(status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith({ message: 'Account is locked' });
  });

  test('calls next and sets uid/role on success', async () => {
    jest.resetModules();
    (global as any).prisma = { user: { findUnique: jest.fn().mockResolvedValue({ firebaseId: 'u1', role: 'ADMIN' }) } };
    jest.doMock('../../config/firebase', () => ({ auth: { verifyIdToken: jest.fn().mockResolvedValue({ uid: 'u1' }) } }));
    const { authMiddleware: middleware } = await import('../../middleware/authMiddleware');
    const req: any = { headers: { authorization: 'Bearer tok' } };
    const next = jest.fn();
    await middleware(req, {} as any, next as any);
    expect(next).toHaveBeenCalled();
    expect(req.uid).toBe('u1');
    expect(req.role).toBe('ADMIN');
  });
});
