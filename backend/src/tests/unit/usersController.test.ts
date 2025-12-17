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

describe('Users controller', () => {
  beforeEach(() => jest.clearAllMocks());

  test('createUser returns 400 when email missing', async () => {
    const res = makeRes();
    await usersController.createUser({ body: {} } as any, res as any, (()=>{}) as any);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('createUser returns 400 when existing user', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 1 });
    const res = makeRes();
    await usersController.createUser({ body: { email: 'a@b.com' } } as any, res as any, (()=>{}) as any);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('createUser returns 201 when created', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(null);
    mockPrisma.user.create.mockResolvedValueOnce({ firebaseId: 'u1' });
    const res = makeRes();
    await usersController.createUser({ body: { email: 'a@b.com' } } as any, res as any, (()=>{}) as any);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('updateUser returns 403 when requester not owner nor admin', async () => {
    const req: any = { params: { id: 'u1' }, uid: 'other', role: 'USER', body: {} };
    const res = makeRes();
    await usersController.updateUser(req as any, res as any, (()=>{}) as any);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('getUserByFirebaseId returns 404 when not found', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(null);
    const res = makeRes();
    await usersController.getUserByFirebaseId({ params: { id: 'uX' } } as any, res as any);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('updateUser returns 500 when firebase update fails in non-prod', async () => {
    const foundUser = { firebaseId: 'u2', avatar: null, fullName: 'Old' };
    mockPrisma.user.findUnique.mockResolvedValueOnce(foundUser);
    mockPrisma.user.update.mockResolvedValueOnce(foundUser);
    const req: any = { params: { id: 'u2' }, uid: 'u2', role: 'USER', body: { firstName: 'F' }, image: undefined };
    const res = makeRes();
    // Make firebase update throw
    mockAuth.updateUser.mockRejectedValueOnce(new Error('fb fail'));
    await usersController.updateUser(req as any, res as any, (()=>{}) as any);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('toggleUserStatus returns 400 when trying to toggle ADMIN', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({ firebaseId: 'a', role: 'ADMIN', status: 'ACTIVE' });
    const res = makeRes();
    await usersController.toggleUserStatus({ params: { id: 'a' } } as any, res as any, (()=>{}) as any);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('updateUserRole returns 400 on invalid role and succeeds on valid', async () => {
    const res = makeRes();
    await usersController.updateUserRole({ params: { id: 'u' }, body: { role: 'WRONG' } } as any, res as any, (()=>{}) as any);
    expect(res.status).toHaveBeenCalledWith(400);

    mockPrisma.user.update.mockResolvedValueOnce({ firebaseId: 'u', role: 'ADMIN' });
    const res2 = makeRes();
    await usersController.updateUserRole({ params: { id: 'u' }, body: { role: 'ADMIN' } } as any, res2 as any, (()=>{}) as any);
    expect(res2.json).toHaveBeenCalled();
  });
});

export {};
