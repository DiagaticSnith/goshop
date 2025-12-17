describe('auth.register error handling', () => {
  afterEach(() => jest.resetModules());

  test('returns 400 when missing fields', async () => {
    const { register } = await import('../../controllers/auth');
    const req: any = { body: { email: '', password: '', fullName: '' } };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const next = jest.fn();
    await register(req, { status } as any, next as any);
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({ message: 'Missing required fields: email, password, fullName' });
  });

  test('returns 400 when password too short', async () => {
    const { register } = await import('../../controllers/auth');
    const req: any = { body: { email: 'a@b.com', password: '123', fullName: 'A' } };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const next = jest.fn();
    await register(req, { status } as any, next as any);
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({ message: 'Password must be at least 6 characters' });
  });

  test('returns 400 when invalid email', async () => {
    const { register } = await import('../../controllers/auth');
    const req: any = { body: { email: 'not-an-email', password: '123456', fullName: 'A' } };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const next = jest.fn();
    await register(req, { status } as any, next as any);
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({ message: 'Invalid email format' });
  });

  test('maps firebase error codes to friendly messages via next()', async () => {
    jest.resetModules();
    // mock firebase admin to throw error with code
    jest.doMock('firebase-admin', () => {
      return {
        initializeApp: jest.fn(() => ({ auth: () => ({ createUser: jest.fn().mockRejectedValue({ code: 'auth/email-already-exists', message: 'exists' }) }), storage: () => ({ bucket: jest.fn() }) })),
        credential: { cert: jest.fn(() => ({ })) }
      };
    });
    (global as any).prisma = { user: { create: jest.fn() }, __isMock: true };
    const { register } = await import('../../controllers/auth');
    const req: any = { body: { email: 'a@b.com', password: '123456', fullName: 'A' } };
    const next = jest.fn();
    await register(req, {} as any, next as any);
    expect(next).toHaveBeenCalled();
    const calledWith = next.mock.calls[0][0];
    expect(calledWith.message).toBe('Email already in use');
  });
});