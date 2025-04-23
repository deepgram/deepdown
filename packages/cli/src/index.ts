import * as parser from '@deepgram/deepdown-parser';
import * as renderer from '@deepgram/deepdown-renderer';
import * as path from 'path';
import { glob } from 'glob';

// Re-export from sub-packages
export { parser, renderer };

// Export API for programmatic usage
export async function parseFiles(
  files: string[], 
  outputDir?: string, 
  pretty = false
): Promise<any[]> {
  const parsedFiles = parser.parseMultipleFiles(files);
  
  return parsedFiles.map((file: { path: string; content: any }) => file.content);
}

export async function renderTemplates(
  templates: string[],
  data: any,
  outputDir?: string
): Promise<string[]> {
  return renderer.renderMultipleTemplateFiles(
    templates,
    data,
    outputDir
  );
}

/**
 * Build project by parsing spec files and rendering templates in a single step
 * @param specPattern Glob pattern for spec files
 * @param templatePattern Glob pattern for template files
 * @param outputDir Optional output directory for rendered files
 * @returns Array of rendered markdown content
 */
export async function buildProject(
  specPattern: string,
  templatePattern: string,
  outputDir?: string
): Promise<string[]> {
  // Find spec files
  const specFiles = await glob(specPattern);
  if (specFiles.length === 0) {
    throw new Error(`No spec files found matching pattern: ${specPattern}`);
  }
  
  // Parse spec files
  const parsedFiles = parser.parseMultipleFiles(specFiles);
  const parsedData = parsedFiles.reduce((result: Record<string, any>, file: { path: string; content: any }) => {
    // Use the filename without extension as the key
    const key = path.basename(file.path, path.extname(file.path));
    result[key] = file.content;
    return result;
  }, {});
  
  // Find template files
  const templateFiles = await glob(templatePattern);
  if (templateFiles.length === 0) {
    throw new Error(`No template files found matching pattern: ${templatePattern}`);
  }
  
  // Render templates with parsed data
  return renderer.renderMultipleTemplateFiles(
    templateFiles,
    parsedData,
    outputDir
  );
}

export default {
  parseFiles,
  renderTemplates,
  buildProject
}; 