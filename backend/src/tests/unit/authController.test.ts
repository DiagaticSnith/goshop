import { jest } from '@jest/globals';

const mockPrisma: any = { user: { create: jest.fn() } };
const mockAuth: any = {
  createUser: jest.fn(),
  updateUser: jest.fn(),
  createCustomToken: jest.fn(),
  setCustomUserClaims: jest.fn()
};

jest.mock('../../config/prisma-client', () => ({ __esModule: true, default: mockPrisma }));
jest.mock('../../config/firebase', () => ({ __esModule: true, auth: mockAuth }));

import { register } from '../../controllers/auth';

const makeRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  return res;
};

describe('Auth controller (unit)', () => {
  beforeEach(() => jest.clearAllMocks());

  test('register returns 400 on missing fields', async () => {
    const req: any = { body: { email: 'a@b.com' } };
    const res = makeRes();
    const next = jest.fn();
    await register(req, res as any, next as any);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('register successful path calls firebase and prisma', async () => {
    const req: any = { body: { email: 'x@x.com', password: 'secret1', fullName: 'X', isAdmin: false } };
    const res = makeRes();
    const next = jest.fn();
    mockAuth.createUser.mockResolvedValueOnce({ uid: 'u1' });
    mockAuth.createCustomToken.mockResolvedValueOnce('token-1');
    mockPrisma.user.create.mockResolvedValueOnce({ firebaseId: 'u1' });

    await register(req, res as any, next as any);
    expect(mockAuth.createUser).toHaveBeenCalledWith({ email: 'x@x.com', password: 'secret1' });
    expect(mockPrisma.user.create).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('register handles firebase createUser error', async () => {
    const req: any = { body: { email: 'x@x.com', password: 'secret1', fullName: 'X' } };
    const res = makeRes();
    const next = jest.fn();
    mockAuth.createUser.mockRejectedValueOnce({ code: 'auth/email-already-exists', message: 'exists' });
    await register(req, res as any, next as any);
    expect(next).toHaveBeenCalled();
  });

  test('register returns 400 for short password', async () => {
    const req: any = { body: { email: 'a@b.com', password: '123', fullName: 'Short' } };
    const res = makeRes();
    const next = jest.fn();
    await register(req, res as any, next as any);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('register returns 400 for invalid email', async () => {
    const req: any = { body: { email: 'not-an-email', password: 'abcdef', fullName: 'I' } };
    const res = makeRes();
    const next = jest.fn();
    await register(req, res as any, next as any);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('register maps weak-password firebase error', async () => {
    const req: any = { body: { email: 'x@x.com', password: 'secret1', fullName: 'X' } };
    const res = makeRes();
    const next = jest.fn();
    mockAuth.createUser.mockRejectedValueOnce({ code: 'auth/weak-password', message: 'weak' });
    await register(req, res as any, next as any);
    expect(next).toHaveBeenCalled();
  });

  test('registerWithGoogle returns 201 on success', async () => {
    const { registerWithGoogle } = await import('../../controllers/auth');
    const req: any = { body: { firebaseId: 'g1', email: 'g@x.com', fullName: 'G' } };
    const res = makeRes();
    const next = jest.fn();
    mockPrisma.user.create.mockResolvedValueOnce({ firebaseId: 'g1' });
    await registerWithGoogle(req, res as any, next as any);
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

export {};
