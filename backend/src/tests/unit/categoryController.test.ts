import { jest } from '@jest/globals';

const mockPrisma: any = {
  category: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  }
};

jest.mock('../../config/prisma-client', () => ({ __esModule: true, default: mockPrisma }));

import { getAllCategories, getSingleCategory, createCategory, updateCategory, deleteCategory } from '../../controllers/category';

const makeRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Category controller', () => {
  beforeEach(() => jest.clearAllMocks());

  test('getAllCategories returns 200 when categories exist', async () => {
    mockPrisma.category.findMany.mockResolvedValueOnce([{ id: 1, name: 'C' }]);
    const res = makeRes();
    await getAllCategories({} as any, res as any);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('getSingleCategory returns 404 when missing', async () => {
    mockPrisma.category.findUnique.mockResolvedValueOnce(null);
    const res = makeRes();
    await getSingleCategory({ params: { id: '99' } } as any, res as any);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('createCategory validates input and returns 400', async () => {
    const res = makeRes();
    await createCategory({ body: { name: 123 } } as any, res as any);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('createCategory returns 201 on success', async () => {
    mockPrisma.category.create.mockResolvedValueOnce({ id: 2, name: 'X' });
    const res = makeRes();
    await createCategory({ body: { name: 'X' } } as any, res as any);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('updateCategory returns 400 for invalid name', async () => {
    const res = makeRes();
    await updateCategory({ params: { id: '1' }, body: { name: 123 } } as any, res as any);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('deleteCategory returns 200 when deleted', async () => {
    mockPrisma.category.delete.mockResolvedValueOnce({ id: 3 });
    const res = makeRes();
    await deleteCategory({ params: { id: '3' } } as any, res as any);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

export {};
