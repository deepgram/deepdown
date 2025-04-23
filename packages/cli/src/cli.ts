#!/usr/bin/env node

import { Command } from 'commander';
import { glob } from 'glob';
import path from 'path';
import fs from 'fs';
import deepdown, {
  parseMultipleFiles, 
  parseYamlFile,
  renderMultipleTemplateFiles, 
  renderMultipleTemplateFilesWithResolvedRefs,
  resolveOpenAPI,
  resolveAsyncAPI,
  detectSpecType,
  SchemaRefResolverOptions
} from '@deepgram/deepdown';

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
      // Use the unified build function from the main package
      const buildOptions = {
        outputDir: options.output,
        resolveRefs: options.resolveRefs,
        preserveRefs: options.preserveRefs,
        resolveSecurity: options.resolveSecurity,
        rootKey: options.rootKey,
        verbose: options.verbose,
        specType: options.specType || undefined
      };
      
      // If using glob patterns, resolve them first
      const specFiles = await glob(specsPattern);
      const templateFiles = await glob(templatesPattern);
      
      if (specFiles.length === 0) {
        console.error(`No spec files found matching pattern: ${specsPattern}`);
        process.exit(1);
      }
      
      if (templateFiles.length === 0) {
        console.error(`No template files found matching pattern: ${templatesPattern}`);
        process.exit(1);
      }
      
      if (options.verbose) {
        console.log(`Found ${specFiles.length} spec files and ${templateFiles.length} template files`);
      }
      
      const renderedFiles = await deepdown.build(specFiles, templateFiles, buildOptions);
      
      if (options.output) {
        console.log(`Rendered files written to ${options.output}`);
      } else {
        // Output to console if no output directory specified
        renderedFiles.forEach((result, index) => {
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
            dataCopy[options.rootKey] = await resolveOpenAPI(dataCopy[options.rootKey], {
              preserveRefs: options.preserveRefs,
              resolveSecurity: true
            });
          } else if (specType === 'asyncapi' && dataCopy[options.rootKey]) {
            console.log('Resolving AsyncAPI references and security schemes');
            dataCopy[options.rootKey] = await resolveAsyncAPI(dataCopy[options.rootKey], {
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

program.parse();