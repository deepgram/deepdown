// packages/renderer/__tests__/setup.ts
import path from 'path';

// Export fixture helpers as functions, avoiding global namespace
export const getFixturePath = {
  template: (name: string) => path.join(__dirname, '__fixtures__', 'templates', name),
  data: (name: string) => path.join(__dirname, '__fixtures__', 'data', name)
};

// Add any Jest-specific setup if needed
beforeAll(() => {
  // Setup code if needed before all tests
});

afterAll(() => {
  // Cleanup code if needed after all tests
});