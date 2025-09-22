module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests'],
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: [
    'background.js',
    'options.js',
    '!jest.config.cjs',
    '!jest.setup.js',
    '!babel.config.cjs',
    '!**/node_modules/**',
    '!**/coverage/**',
  ],
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
  coverageReporters: ['text', 'lcov', 'html'],
};
