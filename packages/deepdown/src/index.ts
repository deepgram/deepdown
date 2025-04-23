/**
 * @deepgram/deepdown - Main entry point for the Deepdown library
 * 
 * This package provides a unified interface for parsing, rendering, and working with
 * API specifications and JSON Schema documents to generate AI-ready markdown documentation.
 */

import { parseYamlFile, parseYamlString, parseMultipleFiles, toJson } from '@deepgram/deepdown-parser';
import { SchemaRefResolverOptions } from '@deepgram/deepdown-renderer/dist/schema-resolver';
import { 
  renderTemplate, 
  renderTemplateFile, 
  renderTemplateFileWithResolvedRefs,
  renderMultipleTemplates,
  renderMultipleTemplateFiles,
  renderMultipleTemplateFilesWithResolvedRefs
} from '@deepgram/deepdown-renderer';
import { resolveOpenAPI } from '@deepgram/deepdown-resolver-openapi';
import { resolveAsyncAPI } from '@deepgram/deepdown-resolver-asyncapi';

// Re-export types and functions from sub-packages
export * from '@deepgram/deepdown-parser';
export { SchemaRefResolverOptions } from '@deepgram/deepdown-renderer/dist/schema-resolver';
export { 
  renderTemplate, 
  renderTemplateFile,
  renderTemplateFileWithResolvedRefs,
  renderMultipleTemplates,
  renderMultipleTemplateFiles,
  renderMultipleTemplateFilesWithResolvedRefs,
  RenderOptions,
  RenderFileOptions,
  RenderFileWithRefResolutionOptions
} from '@deepgram/deepdown-renderer';
export { 
  resolveOpenAPI, 
  registerOpenAPICurlHelpers,
  OpenAPIResolverOptions 
} from '@deepgram/deepdown-resolver-openapi';
export { 
  resolveAsyncAPI, 
  registerAsyncAPICurlHelpers,
  AsyncAPIResolverOptions 
} from '@deepgram/deepdown-resolver-asyncapi';

/**
 * Unified function to detect the type of specification
 * @param spec - The specification object to check
 * @param filename - Optional filename for additional detection hints
 * @returns The detected spec type, or undefined if not recognized
 */
export function detectSpecType(
  spec: any, 
  filename?: string
): 'openapi' | 'asyncapi' | 'jsonschema' | undefined {
  if (!spec) {
    return undefined;
  }

  // Check for OpenAPI spec
  if (
    // OpenAPI 3.x has 'openapi' field
    spec.openapi || 
    // Swagger 2.0 has 'swagger' field
    spec.swagger || 
    // Check info title for keywords
    (spec.info?.title && 
      (spec.info.title.toLowerCase().includes('openapi') || 
       spec.info.title.toLowerCase().includes('swagger')))
  ) {
    return 'openapi';
  }

  // Check for AsyncAPI spec
  if (
    // AsyncAPI has 'asyncapi' field
    spec.asyncapi || 
    // Check info title for keywords
    (spec.info?.title && 
      spec.info.title.toLowerCase().includes('asyncapi'))
  ) {
    return 'asyncapi';
  }

  // If filename is provided, check it for hints
  if (filename) {
    const lowerFilename = filename.toLowerCase();
    
    // Check for OpenAPI/Swagger in filename
    if (
      lowerFilename.includes('openapi') ||
      lowerFilename.includes('swagger') ||
      lowerFilename.includes('api-spec')
    ) {
      return 'openapi';
    }
    
    // Check for AsyncAPI in filename
    if (
      lowerFilename.includes('asyncapi') ||
      lowerFilename.includes('async-api') ||
      lowerFilename.includes('event-api')
    ) {
      return 'asyncapi';
    }
  }

  // Fallback to generic JSON Schema
  if (
    // Check for JSON Schema specific fields
    spec.$schema ||
    spec.properties ||
    spec.type
  ) {
    return 'jsonschema';
  }

  return undefined;
}

/**
 * Options for the main Deepdown build/process functions
 */
export interface DeepdownOptions {
  /** Output directory for rendered markdown files */
  outputDir?: string;
  /** Whether to resolve JSON Schema $ref pointers before rendering (default: false) */
  resolveRefs?: boolean;
  /** Whether to preserve internal $ref pointers when resolving refs (default: false) */
  preserveRefs?: boolean;
  /** Whether to resolve security schemes for API specs (default: false) */
  resolveSecurity?: boolean;
  /** Force a specific spec type instead of auto-detection */
  specType?: 'openapi' | 'asyncapi' | 'jsonschema';
  /** Root key name for the spec data in templates (default: 'spec') */
  rootKey?: string;
  /** Show verbose output during processing */
  verbose?: boolean;
}

/**
 * Main function to build markdown from specs and templates
 * 
 * @param specPaths - Array of paths to spec files
 * @param templatePaths - Array of paths to template files
 * @param options - Configuration options
 * @returns Array of paths to generated markdown files
 */
export async function build(
  specPaths: string | string[],
  templatePaths: string | string[],
  options: DeepdownOptions = {}
): Promise<string[]> {
  const opts = {
    outputDir: options.outputDir,
    resolveRefs: options.resolveRefs || false,
    preserveRefs: options.preserveRefs || false,
    resolveSecurity: options.resolveSecurity || false,
    rootKey: options.rootKey || 'spec',
    verbose: options.verbose || false,
    specType: options.specType
  };

  // Convert single paths to arrays
  const specPathsArray = Array.isArray(specPaths) ? specPaths : [specPaths];
  const templatePathsArray = Array.isArray(templatePaths) ? templatePaths : [templatePaths];
  
  if (opts.verbose) {
    console.log(`Processing ${specPathsArray.length} spec file(s) and ${templatePathsArray.length} template file(s)`);
  }
  
  // Parse the spec files
  const parsedFiles = parseMultipleFiles(specPathsArray);
  
  if (parsedFiles.length === 0) {
    throw new Error(`No spec files found at paths: ${specPathsArray.join(', ')}`);
  }
  
  const parsedData: Record<string, any> = {};
  
  // Use the rootKey option or the filename as the key
  if (parsedFiles.length === 1) {
    parsedData[opts.rootKey] = parsedFiles[0].content;
  } else {
    parsedData[opts.rootKey] = {};
    parsedFiles.forEach(file => {
      const key = file.path.split('/').pop()?.split('.')[0] || 'unknown';
      parsedData[opts.rootKey][key] = file.content;
    });
  }
  
  // If resolving references is required
  if (opts.resolveRefs) {
    // Detect spec type if not explicitly provided
    let specType = opts.specType;
    if (!specType && parsedData[opts.rootKey]) {
      const spec = parsedData[opts.rootKey];
      const filename = parsedFiles.length === 1 ? 
        parsedFiles[0].path.split('/').pop() || '' : '';
      
      specType = detectSpecType(spec, filename) || 'jsonschema';
    }
    
    if (opts.verbose) {
      console.log(`Detected spec type: ${specType}`);
    }
    
    // If it's an OpenAPI or AsyncAPI spec and we should resolve security schemes
    if (opts.resolveRefs && opts.resolveSecurity) {
      if (opts.verbose) {
        console.log('Using specialized resolver for security schemes');
      }
      
      // Create a deep copy of the data
      const dataCopy = JSON.parse(JSON.stringify(parsedData));
      
      // Apply the appropriate resolver based on spec type
      if (specType === 'openapi' && dataCopy[opts.rootKey]) {
        if (opts.verbose) {
          console.log('Resolving OpenAPI references and security schemes');
        }
        dataCopy[opts.rootKey] = await resolveOpenAPI(dataCopy[opts.rootKey], {
          preserveRefs: opts.preserveRefs,
          resolveSecurity: true
        });
      } else if (specType === 'asyncapi' && dataCopy[opts.rootKey]) {
        if (opts.verbose) {
          console.log('Resolving AsyncAPI references and security schemes');
        }
        dataCopy[opts.rootKey] = await resolveAsyncAPI(dataCopy[opts.rootKey], {
          preserveRefs: opts.preserveRefs,
          resolveSecurity: true
        });
      } else if (opts.verbose) {
        console.log('Using standard JSON Schema reference resolution');
      }
      
      // Use the standard renderer with the pre-resolved data
      return renderMultipleTemplateFiles(
        templatePathsArray,
        dataCopy,
        opts.outputDir
      );
    } else {
      // Use the standard ref-resolving renderer
      const refResolutionOptions: SchemaRefResolverOptions = {
        preserveRefs: opts.preserveRefs,
        specType: specType as any
      };
      
      return await renderMultipleTemplateFilesWithResolvedRefs(
        templatePathsArray,
        parsedData,
        opts.outputDir,
        undefined, // helpers
        refResolutionOptions
      );
    }
  } else {
    // Use the standard renderer without reference resolution
    return renderMultipleTemplateFiles(
      templatePathsArray,
      parsedData,
      opts.outputDir
    );
  }
}

// Default exports
export default {
  // Main function
  build,
  
  // Parser functions
  parseYamlFile,
  parseYamlString,
  parseMultipleFiles,
  toJson,
  
  // Renderer functions
  renderTemplate,
  renderTemplateFile,
  renderTemplateFileWithResolvedRefs,
  renderMultipleTemplates, 
  renderMultipleTemplateFiles,
  renderMultipleTemplateFilesWithResolvedRefs,
  
  // Resolver functions
  resolveOpenAPI,
  resolveAsyncAPI,
  
  // Utility functions
  detectSpecType
}; 