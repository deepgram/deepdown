// packages/renderer/__tests__/snapshotResolver.cjs
const path = require('path');

module.exports = {
  // Store snapshots alongside tests
  resolveSnapshotPath: (testPath, snapshotExtension) => 
    path.join(
      path.dirname(testPath),
      '__snapshots__',
      path.basename(testPath) + snapshotExtension
    ),
  
  // Find test file from snapshot
  resolveTestPath: (snapshotFilePath, snapshotExtension) => {
    const snapshotFileName = path.basename(snapshotFilePath);
    const testFileName = snapshotFileName.slice(0, -snapshotExtension.length);
    return path.join(
      path.dirname(path.dirname(snapshotFilePath)), // Go up from __snapshots__
      testFileName
    );
  },
  
  // Test file for consistency checks
  testPathForConsistencyCheck: 'packages/renderer/__tests__/index.test.ts'
};