module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|native-base|react-native-.*|@react-native-.*)/)',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  globals: {
    __DEV__: true,
  },
  collectCoverageFrom: [
    '**/*.{js,jsx,ts,tsx}',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/__tests__/**',
    '!jest.config.js',
    '!jest.setup.js',
    '!**/*.d.ts',
    '!android/**',
    '!ios/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60
    }
  }
};
