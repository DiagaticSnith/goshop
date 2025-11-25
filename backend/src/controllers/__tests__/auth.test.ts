describe('auth controller', () => {
  afterEach(() => jest.resetModules());

  test('register returns 200 and token when firebase and prisma succeed', async () => {
    // prevent real PrismaClient initialization by supplying a mocked global.prisma
    (global as any).prisma = { user: { create: jest.fn().mockResolvedValue({ id: 1 }) } };

    // Mock firebase-admin so config/firebase initializes a safe test auth object
    jest.mock('firebase-admin', () => {
      const authMock = {
        createUser: jest.fn().mockResolvedValue({ uid: 'fuid' }),
        updateUser: jest.fn().mockResolvedValue(true),
        createCustomToken: jest.fn().mockResolvedValue('custom_token'),
        setCustomUserClaims: jest.fn().mockResolvedValue(true)
      };
      const storageMock = () => ({ bucket: jest.fn() });
      return {
        initializeApp: jest.fn(() => ({ auth: () => authMock, storage: storageMock })),
        credential: { cert: jest.fn(() => ({ })) }
      };
    });

    const { register } = await import('../auth');

    const req: any = { body: { email: 'a@b.com', password: 'securepw', fullName: 'A B', isAdmin: false } };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const next = jest.fn();

    await register(req, { status } as any, next as any);

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({ token: 'custom_token' });
  });

  afterAll(() => { delete (global as any).prisma; });
});
