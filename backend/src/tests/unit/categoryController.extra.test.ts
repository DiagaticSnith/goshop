import { jest } from '@jest/globals';

const mockPrisma: any = { category: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() } };
jest.mock('../../config/prisma-client', () => ({ __esModule: true, default: mockPrisma }));

import * as categoryController from '../../controllers/category';

const makeRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Category controller extra branches', () => {
  beforeEach(() => jest.clearAllMocks());

  test('getAllCategories returns 404 when null', async () => {
    mockPrisma.category.findMany.mockResolvedValueOnce(null);
    const res = makeRes();
    await categoryController.getAllCategories({} as any, res as any);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('getSingleCategory returns 404 when not found', async () => {
    mockPrisma.category.findUnique.mockResolvedValueOnce(null);
    const res = makeRes();
    await categoryController.getSingleCategory({ params: { id: '10' } } as any, res as any);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('createCategory returns 400 on invalid name and 500 on DB error', async () => {
    const res = makeRes();
    await categoryController.createCategory({ body: { name: '' } } as any, res as any);
    expect(res.status).toHaveBeenCalledWith(400);

    mockPrisma.category.create.mockRejectedValueOnce(new Error('db bad'));
    const res2 = makeRes();
    await categoryController.createCategory({ body: { name: 'Good' } } as any, res2 as any);
    expect(res2.status).toHaveBeenCalledWith(500);
  });

  test('updateCategory returns 400 on invalid and 500 on DB error', async () => {
    const res = makeRes();
    await categoryController.updateCategory({ params: { id: '1' }, body: { name: '' } } as any, res as any);
    expect(res.status).toHaveBeenCalledWith(400);

    mockPrisma.category.update.mockRejectedValueOnce(new Error('up fail'));
    const res2 = makeRes();
    await categoryController.updateCategory({ params: { id: '1' }, body: { name: 'X' } } as any, res2 as any);
    expect(res2.status).toHaveBeenCalledWith(500);
  });

  test('deleteCategory handles DB error', async () => {
    mockPrisma.category.delete.mockRejectedValueOnce(new Error('del fail'));
    const res = makeRes();
    await categoryController.deleteCategory({ params: { id: '1' } } as any, res as any);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

export {};
