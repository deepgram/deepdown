/**
 * Core functionality for Deepdown markdown templating
 * @packageDocumentation
 */

import { validateTemplate } from '@deepgram/deepdown-utils';

/**
 * Processes Deepdown markdown templates
 * @param template - The markdown template to process
 * @returns The processed markdown
 */
export function processTemplate(template: string): string {
  // Check if the template is valid before processing
  if (!validateTemplate(template)) {
    throw new Error('Invalid template');
  }
  
  // Implementation will go here
  return template;
}

/**
 * Version of the package
 */
export const version = '0.0.1'; 