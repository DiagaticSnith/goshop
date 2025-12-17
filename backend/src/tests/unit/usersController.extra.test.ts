import { jest } from '@jest/globals';

const mockPrisma: any = {
  user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), findMany: jest.fn() }
};
const mockAuth: any = { updateUser: jest.fn(), createCustomToken: jest.fn() };

jest.mock('../../config/prisma-client', () => ({ __esModule: true, default: mockPrisma }));
jest.mock('../../config/firebase', () => ({ __esModule: true, auth: mockAuth }));

import * as usersController from '../../controllers/users';

const makeRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Users controller extra branches', () => {
  beforeEach(() => jest.clearAllMocks());

  test('updateUser returns 200 and token when firebase update succeeds', async () => {
    const foundUser = { firebaseId: 'u2', avatar: null, fullName: 'Old' };
    mockPrisma.user.findUnique.mockResolvedValueOnce(foundUser);
    mockPrisma.user.update.mockResolvedValueOnce({ firebaseId: 'u2', fullName: 'New' });
    mockAuth.updateUser.mockResolvedValueOnce({});
    mockAuth.createCustomToken.mockResolvedValueOnce('token-123');

    const req: any = { params: { id: 'u2' }, uid: 'u2', role: 'USER', body: { firstName: 'F', lastName: 'L', phone: '' }, image: undefined };
    const res = makeRes();
    await usersController.updateUser(req as any, res as any, (()=>{}) as any);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ user: expect.any(Object), token: 'token-123' }));
  });

  test('deleteUser returns 200 when update succeeds', async () => {
    mockPrisma.user.update.mockResolvedValueOnce({ firebaseId: 'u1' });
    const res = makeRes();
    await usersController.deleteUser({ params: { id: 'u1' } } as any, res as any, (()=>{}) as any);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('updateUser returns error details when DEBUG_ERRORS=true', async () => {
    process.env.DEBUG_ERRORS = 'true';
    // Force an error in the main try block
    mockPrisma.user.findUnique.mockRejectedValueOnce(new Error('boom'));
    const res = makeRes();
    await usersController.updateUser({ params: { id: 'x' }, uid: 'x', role: 'USER', body: {} } as any, res as any, (()=>{}) as any);
    expect(res.status).toHaveBeenCalledWith(500);
    delete process.env.DEBUG_ERRORS;
  });
});

export {};
