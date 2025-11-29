module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Only look for tests inside the backend `src` folder to avoid picking
  // up test files from other workspace packages.
  roots: ['<rootDir>/src'],
  // Only run tests placed directly under `src/tests/unit` and `src/tests/integration`
  // This prevents duplicate runs for tests still present under subfolders.
  testMatch: [
    '<rootDir>/src/tests/unit/*.test.[jt]s?(x)',
    '<rootDir>/src/tests/integration/*.test.[jt]s?(x)'
  ],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  setupFiles: ['<rootDir>/jest.setup.js']
};
