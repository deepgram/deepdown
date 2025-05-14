// Root jest.config.js
export default {
  // Set projects to null at root level since we'll use Lerna to run tests in each package
  projects: null,
  
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.json',
    }]
  },
  // Global coverage thresholds to encourage good test coverage
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  // Don't watch node_modules or dist folders
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/'
  ],
  // Default timeout for tests (in ms)
  testTimeout: 10000
};