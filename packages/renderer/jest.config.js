// packages/renderer/jest.config.js
export default {
  // Use the root directory as the context
  rootDir: '../../',
  // Set display name for better reporting in the monorepo
  displayName: 'renderer',
  // Target this package's tests
  testMatch: ['<rootDir>/packages/renderer/__tests__/**/*.test.ts'],
  // Include transforms from root config if they exist
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/packages/renderer/tsconfig.test.json',
        isolatedModules: true
      }
    ]
  },
  // Use modular setup file approach to avoid global namespace conflicts
  setupFilesAfterEnv: ['<rootDir>/packages/renderer/__tests__/setup.ts'],
  // Package-specific snapshot resolver
  snapshotResolver: '<rootDir>/packages/renderer/__tests__/snapshotResolver.cjs',
  // Ensure we're not testing built files
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  // Only collect coverage from this package's source
  collectCoverageFrom: ['<rootDir>/packages/renderer/src/**/*.ts']
};