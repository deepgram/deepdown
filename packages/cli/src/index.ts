/**
 * @deepgram/deepdown-cli - CLI for Deepdown markdown templating
 * 
 * This package provides command line interface for the @deepgram/deepdown package.
 * It allows users to build documentation from spec files and templates directly from the terminal.
 */

// Re-export everything from the main package
export * from '@deepgram/deepdown';

// Export the CLI functionality
import './cli'; // The CLI file doesn't export anything, it just runs the command

// Re-export the default export from the main package
import deepdown from '@deepgram/deepdown';
export default deepdown; 