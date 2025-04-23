#!/usr/bin/env node

import { Command } from 'commander';
import { glob } from 'glob';
import path from 'path';
import fs from 'fs';
import { parseMultipleFiles, parseYamlFile } from '@deepgram/deepdown-parser';
import { 
  renderMultipleTemplateFiles, 
  renderMultipleTemplateFilesWithResolvedRefs
} from '@deepgram/deepdown-renderer';
import { SchemaRefResolverOptions } from '@deepgram/deepdown-renderer/dist/schema-resolver';

// We'll need to build the packages first for these imports to work
import openAPIResolver from '@deepgram/deepdown-resolver-openapi';
import asyncAPIResolver from '@deepgram/deepdown-resolver-asyncapi';

const program = new Command();

program
  .name('deepdown')
  .description('Deepdown - Markdown templating tool for generating AI-ready docs')
  .version('0.0.1');

program
  .command('build')
  .description('Parse spec files and render templates in a single step')
  .argument('<specs>', 'Glob pattern for spec files to parse')
  .argument('<templates>', 'Glob pattern for template files')
  .option('-o, --output <dir>', 'Output directory for rendered markdown')
  .option('-v, --verbose', 'Show detailed output', false)
  .option('-r, --root-key <n>', 'Root key name for the spec data in templates', 'spec')
  .option('--resolve-refs', 'Resolve JSON Schema $ref pointers before rendering', false)
  .option('--preserve-refs', 'When resolving refs, preserve internal references', false)
  .option('--resolve-security', 'Resolve security schemes for OpenAPI/AsyncAPI specs', false)
  .option('--spec-type <type>', 'Force specification type (openapi, asyncapi, jsonschema)', '')
  .action(async (specsPattern, templatesPattern, options) => {
    try {
      // Find the spec files
      const specFiles = await glob(specsPattern);
      
      if (specFiles.length === 0) {
        console.error(`No spec files found matching pattern: ${specsPattern}`);
        process.exit(1);
      }
      
      if (options.verbose) {
        console.log(`Found ${specFiles.length} spec files`);
      }
      
      // Parse the spec files in memory
      const parsedFiles = parseMultipleFiles(specFiles);
      const parsedData: Record<string, any> = {};
      
      // Use the rootKey option or the filename as the key
      if (parsedFiles.length === 1) {
        // If there's only one file, use the rootKey directly
        parsedData[options.rootKey] = parsedFiles[0].content;
      } else {
        // If there are multiple files, use rootKey as the parent with filenames as sub-keys
        parsedData[options.rootKey] = {};
        parsedFiles.forEach((file: { path: string; content: any }) => {
          const key = path.basename(file.path, path.extname(file.path));
          parsedData[options.rootKey][key] = file.content;
        });
      }
      
      // Find the template files
      const templateFiles = await glob(templatesPattern);
      
      if (templateFiles.length === 0) {
        console.error(`No template files found matching pattern: ${templatesPattern}`);
        process.exit(1);
      }
      
      if (options.verbose) {
        console.log(`Found ${templateFiles.length} template files`);
      }
      
      let renderedFiles;
      
      // Choose whether to resolve references based on the option
      if (options.resolveRefs) {
        if (options.verbose) {
          console.log('Resolving references before rendering');
        }
        
        // Detect spec type if not explicitly provided
        let specType = options.specType;
        if (!specType && parsedData[options.rootKey]) {
          const spec = parsedData[options.rootKey];
          // If we're using parsedFiles which has the file path, use that for filename detection
          const filename = parsedFiles.length === 1 ? 
            path.basename(parsedFiles[0].path) : 
            '';
          specType = detectSpecType(spec, filename) || 'jsonschema';
        }
        
        if (options.verbose) {
          console.log(`Detected spec type: ${specType}`);
        }
        
        // If it's an OpenAPI or AsyncAPI spec and we should resolve security schemes
        if (options.resolveRefs && options.resolveSecurity) {
          if (options.verbose) {
            console.log('Using specialized resolver for security schemes');
          }
          
          // Create a deep copy of the data
          const dataCopy = JSON.parse(JSON.stringify(parsedData));
          
          // Apply the appropriate resolver based on spec type
          if (specType === 'openapi' && dataCopy[options.rootKey]) {
            if (options.verbose) {
              console.log('Resolving OpenAPI references and security schemes');
            }
            dataCopy[options.rootKey] = await openAPIResolver.resolveOpenAPI(dataCopy[options.rootKey], {
              preserveRefs: options.preserveRefs,
              resolveSecurity: true
            });
          } else if (specType === 'asyncapi' && dataCopy[options.rootKey]) {
            if (options.verbose) {
              console.log('Resolving AsyncAPI references and security schemes');
            }
            dataCopy[options.rootKey] = await asyncAPIResolver.resolveAsyncAPI(dataCopy[options.rootKey], {
              preserveRefs: options.preserveRefs,
              resolveSecurity: true
            });
          } else {
            // Fall back to standard JSON Schema ref resolution
            if (options.verbose) {
              console.log('Using standard JSON Schema reference resolution');
            }
          }
          
          // Use the already resolved data with the standard renderer
          renderedFiles = renderMultipleTemplateFiles(
            templateFiles,
            dataCopy,
            options.output
          );
        } else {
          // Use the standard ref-resolving renderer
          const refResolutionOptions: SchemaRefResolverOptions = {
            preserveRefs: options.preserveRefs,
            specType: specType as any
          };
          
          renderedFiles = await renderMultipleTemplateFilesWithResolvedRefs(
            templateFiles,
            parsedData,
            options.output,
            undefined, // helpers
            refResolutionOptions
          );
        }
      } else {
        // Use the standard renderer without reference resolution
        renderedFiles = renderMultipleTemplateFiles(
          templateFiles,
          parsedData,
          options.output
        );
      }
      
      if (options.output) {
        console.log(`Rendered files written to ${options.output}`);
      } else {
        // Output to console
        renderedFiles.forEach((result: string, index: number) => {
          console.log(`\n--- ${templateFiles[index]} ---\n`);
          console.log(result);
        });
      }
    } catch (error) {
      console.error(`Error building files: ${error}`);
      process.exit(1);
    }
  });

program
  .command('parse')
  .description('Parse YAML/JSON spec files')
  .argument('<files>', 'Glob pattern for spec files to parse')
  .option('-o, --output <dir>', 'Output directory for parsed JSON')
  .option('-p, --pretty', 'Pretty print JSON output', false)
  .action(async (filesPattern, options) => {
    try {
      const files = await glob(filesPattern);
      
      if (files.length === 0) {
        console.error(`No files found matching pattern: ${filesPattern}`);
        process.exit(1);
      }
      
      console.log(`Found ${files.length} files to parse`);
      const parsedFiles = parseMultipleFiles(files);
      
      if (options.output) {
        // Create output directory if it doesn't exist
        if (!fs.existsSync(options.output)) {
          fs.mkdirSync(options.output, { recursive: true });
        }
        
        // Write each parsed file
        parsedFiles.forEach((file: { path: string; content: any }) => {
          const outputPath = path.join(
            options.output, 
            `${path.basename(file.path, path.extname(file.path))}.json`
          );
          
          fs.writeFileSync(
            outputPath, 
            JSON.stringify(file.content, null, options.pretty ? 2 : 0),
            'utf8'
          );
        });
        
        console.log(`Parsed files written to ${options.output}`);
      } else {
        // Just output to console
        console.log(JSON.stringify(parsedFiles, null, options.pretty ? 2 : 0));
      }
    } catch (error) {
      console.error(`Error parsing files: ${error}`);
      process.exit(1);
    }
  });

program
  .command('render')
  .description('Render markdown from templates and data')
  .argument('<templates>', 'Glob pattern for template files')
  .option('-d, --data <file>', 'JSON data file to use')
  .option('-o, --output <dir>', 'Output directory for rendered markdown')
  .option('-r, --root-key <n>', 'Root key name for the spec data in templates', 'spec')
  .option('--resolve-refs', 'Resolve JSON Schema $ref pointers before rendering', false)
  .option('--preserve-refs', 'When resolving refs, preserve internal references', false)
  .option('--resolve-security', 'Resolve security schemes for OpenAPI/AsyncAPI specs', false)
  .option('--spec-type <type>', 'Force specification type (openapi, asyncapi, jsonschema)', '')
  .action(async (templatesPattern, options) => {
    try {
      if (!options.data) {
        console.error('Data file is required. Use --data option.');
        process.exit(1);
      }
      
      const templates = await glob(templatesPattern);
      
      if (templates.length === 0) {
        console.error(`No template files found matching pattern: ${templatesPattern}`);
        process.exit(1);
      }
      
      console.log(`Found ${templates.length} template files`);
      
      // Read data file
      const dataContent = fs.readFileSync(options.data, 'utf8');
      const jsonData = JSON.parse(dataContent);
      
      // Wrap the data with the root key
      const data: Record<string, any> = {};
      data[options.rootKey] = jsonData;
      
      let results;
      
      // Choose whether to resolve references based on the option
      if (options.resolveRefs) {
        console.log('Resolving references before rendering');
        
        // Detect spec type if not explicitly provided
        let specType = options.specType;
        if (!specType && data[options.rootKey]) {
          const spec = data[options.rootKey];
          // Extract filename from the data file path
          const filename = path.basename(options.data);
          specType = detectSpecType(spec, filename) || 'jsonschema';
        }
        
        console.log(`Detected spec type: ${specType}`);
        
        // If it's an OpenAPI or AsyncAPI spec and we should resolve security schemes
        if (options.resolveRefs && options.resolveSecurity) {
          console.log('Using specialized resolver for security schemes');
          
          // Create a deep copy of the data
          const dataCopy = JSON.parse(JSON.stringify(data));
          
          // Apply the appropriate resolver based on spec type
          if (specType === 'openapi' && dataCopy[options.rootKey]) {
            console.log('Resolving OpenAPI references and security schemes');
            dataCopy[options.rootKey] = await openAPIResolver.resolveOpenAPI(dataCopy[options.rootKey], {
              preserveRefs: options.preserveRefs,
              resolveSecurity: true
            });
          } else if (specType === 'asyncapi' && dataCopy[options.rootKey]) {
            console.log('Resolving AsyncAPI references and security schemes');
            dataCopy[options.rootKey] = await asyncAPIResolver.resolveAsyncAPI(dataCopy[options.rootKey], {
              preserveRefs: options.preserveRefs,
              resolveSecurity: true
            });
          } else {
            // Fall back to standard JSON Schema ref resolution
            console.log('Using standard JSON Schema reference resolution');
          }
          
          // Use the already resolved data with the standard renderer
          results = renderMultipleTemplateFiles(
            templates,
            dataCopy,
            options.output
          );
        } else {
          // Use the standard ref-resolving renderer
          const refResolutionOptions: SchemaRefResolverOptions = {
            preserveRefs: options.preserveRefs,
            specType: specType as any
          };
          
          results = await renderMultipleTemplateFilesWithResolvedRefs(
            templates,
            data,
            options.output,
            undefined, // helpers
            refResolutionOptions
          );
        }
      } else {
        // Use the standard renderer without reference resolution
        results = renderMultipleTemplateFiles(
          templates,
          data,
          options.output
        );
      }
      
      if (options.output) {
        console.log(`Rendered files written to ${options.output}`);
      } else {
        // Just output to console
        results.forEach((result: string, index: number) => {
          console.log(`\n--- ${templates[index]} ---\n`);
          console.log(result);
        });
      }
    } catch (error) {
      console.error(`Error rendering templates: ${error}`);
      process.exit(1);
    }
  });

// Add this helper function for improved spec detection
/**
 * Detects the type of API specification based on its content and filename
 * @param spec - The specification object
 * @param filename - Optional filename to check for hints
 * @returns The detected spec type, or undefined if not recognized
 */
function detectSpecType(spec: any, filename?: string): 'openapi' | 'asyncapi' | 'jsonschema' | undefined {
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

program.parse();