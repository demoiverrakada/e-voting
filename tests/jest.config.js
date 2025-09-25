module.exports = {
  // Base configuration for all tests
  rootDir: '.',
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/node_modules/**',
    '!src/**/coverage/**',
    '!src/**/__tests__/**',
    '!src/**/_tests_/**',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/*.spec.{js,jsx,ts,tsx}',
    '!src/**/jest.config.js',
    '!src/**/jest.setup.js',
    '!src/**/*.d.ts',
    '!src/**/android/**',
    '!src/**/ios/**',
    '!src/**/Lib/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  testMatch: [
    '<rootDir>/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/**/*.spec.{js,jsx,ts,tsx}'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|native-base|react-native-.*|@react-native-.*)/)',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  globals: {
    __DEV__: true,
  },
  // Different coverage thresholds for different types of code
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60
    }
  },
  // Project-specific configurations
  projects: [
    {
      displayName: 'backend',
      testMatch: ['<rootDir>/backend/**/*.test.{js,ts}'],
      testEnvironment: 'node',
      collectCoverageFrom: [
        'src/evoting_localstorage/project_evoting/**/*.js',
        'src/evoting_localstorage/verification_server/**/*.js',
        '!src/evoting_localstorage/project_evoting/__tests__/**',
        '!src/evoting_localstorage/verification_server/__tests__/**',
        '!src/evoting_localstorage/project_evoting/node_modules/**',
        '!src/evoting_localstorage/verification_server/node_modules/**'
      ],
      coverageThreshold: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    },
    {
      displayName: 'react-native',
      testMatch: ['<rootDir>/react-native/**/*.test.{js,ts,tsx}'],
      testEnvironment: 'jsdom',
      collectCoverageFrom: [
        'src/evoting_localstorage/evoting_fron/**/*.{js,jsx,ts,tsx}',
        'src/evoting_localstorage/BallotAudit/**/*.{js,jsx,ts,tsx}',
        'src/evoting_localstorage/VoterVerification/**/*.{js,jsx,ts,tsx}',
        '!src/evoting_localstorage/evoting_fron/__tests__/**',
        '!src/evoting_localstorage/evoting_fron/_tests_/**',
        '!src/evoting_localstorage/BallotAudit/__tests__/**',
        '!src/evoting_localstorage/VoterVerification/__tests__/**',
        '!src/evoting_localstorage/evoting_fron/android/**',
        '!src/evoting_localstorage/evoting_fron/ios/**',
        '!src/evoting_localstorage/BallotAudit/android/**',
        '!src/evoting_localstorage/BallotAudit/ios/**',
        '!src/evoting_localstorage/VoterVerification/android/**',
        '!src/evoting_localstorage/VoterVerification/ios/**'
      ],
      coverageThreshold: {
        global: {
          branches: 60,
          functions: 60,
          lines: 60,
          statements: 60
        }
      }
    },
    {
      displayName: 'react-web',
      testMatch: ['<rootDir>/react-web/**/*.test.{js,jsx,ts,tsx}'],
      testEnvironment: 'jsdom',
      collectCoverageFrom: [
        'src/evoting_localstorage/verification-webpage/src/**/*.{js,jsx,ts,tsx}',
        'src/evoting_localstorage/bulletin/src/**/*.{js,jsx,ts,tsx}',
        'src/evoting_localstorage/demo/src/**/*.{js,jsx,ts,tsx}',
        'src/evoting_localstorage/admin_webpage/src/**/*.{js,jsx,ts,tsx}',
        '!src/evoting_localstorage/verification-webpage/src/__tests__/**',
        '!src/evoting_localstorage/bulletin/src/__tests__/**',
        '!src/evoting_localstorage/demo/src/__tests__/**',
        '!src/evoting_localstorage/admin_webpage/src/__tests__/**'
      ],
      coverageThreshold: {
        global: {
          branches: 60,
          functions: 60,
          lines: 60,
          statements: 60
        }
      }
    }
  ]
};