describe('auth register - additional firebase error mappings', () => {
  afterEach(() => jest.resetModules());

  const makeRegister = async (errCode: string) => {
    jest.resetModules();
    jest.doMock('firebase-admin', () => ({
      initializeApp: jest.fn(() => ({ auth: () => ({ createUser: jest.fn().mockRejectedValue({ code: errCode, message: 'x' }) }), storage: () => ({ bucket: jest.fn() }) })),
      credential: { cert: jest.fn(() => ({})) }
    }));
    (global as any).prisma = { user: { create: jest.fn() } };
    const { register } = await import('../auth');
    const req: any = { body: { email: 'a@b.com', password: '123456', fullName: 'A' } };
    const next = jest.fn();
    await register(req, {} as any, next as any);
    return next.mock.calls[0][0].message;
  };

  test('maps weak-password to friendly message', async () => {
    const msg = await makeRegister('auth/weak-password');
    expect(msg).toBe('Password too weak (min 6 characters)');
  });

  test('maps invalid-email to friendly message', async () => {
    const msg = await makeRegister('auth/invalid-email');
    expect(msg).toBe('Invalid email format');
  });

  test('maps configuration-not-found to friendly message', async () => {
    const msg = await makeRegister('auth/configuration-not-found');
    expect(msg).toBe('Firebase configuration error. Check serviceAccountKey.json or firebase.js');
  });
});
