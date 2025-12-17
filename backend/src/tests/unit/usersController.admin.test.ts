import { jest } from '@jest/globals';

const mockPrisma: any = { user: { findUnique: jest.fn(), update: jest.fn() } };
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

describe('Users controller admin branches', () => {
  beforeEach(() => jest.clearAllMocks());

  test('ADMIN can update another user', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'u2', email: 'b@b.com' });
    mockPrisma.user.update.mockResolvedValueOnce({ id: 'u2', name: 'updated' });
    mockAuth.updateUser.mockResolvedValueOnce({ uid: 'u2' });
    mockAuth.createCustomToken.mockResolvedValueOnce('token');

    const req: any = { params: { id: 'u2' }, body: { name: 'updated' }, uid: 'admin', role: 'ADMIN' };
    const res = makeRes();
    await usersController.updateUser(req as any, res as any, (()=>{}) as any);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
  });
});

export {};
