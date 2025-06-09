import * as Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { resolveSchemaRefs, SchemaRefResolverOptions } from './schema-resolver';

// Register default helpers
Handlebars.registerHelper('json', function(context) {
  return JSON.stringify(context, null, 2);
});

// Add includes helper to check if an array includes a value
Handlebars.registerHelper('includes', function(array, value) {
  if (!array || !Array.isArray(array)) return false;
  return array.includes(value);
});

// Add helpers for comparisons and checking
Handlebars.registerHelper('ne', function(a, b) {
  return a !== b;
});

Handlebars.registerHelper('eq', function(a, b) {
  return a === b;
});

Handlebars.registerHelper('gt', function(a, b) {
  return a > b;
});

Handlebars.registerHelper('lt', function(a, b) {
  return a < b;
});

Handlebars.registerHelper('lookup', function(obj, prop) {
  if (obj && typeof obj === 'object') {
    return obj[prop];
  }
  return undefined;
});

// Add string transformation helpers
Handlebars.registerHelper('uppercase', function(str) {
  if (typeof str !== 'string') return '';
  return str.toUpperCase();
});

Handlebars.registerHelper('lowercase', function(str) {
  if (typeof str !== 'string') return '';
  return str.toLowerCase();
});

Handlebars.registerHelper('capitalize', function(str) {
  if (typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
});

// Add basename helper for parsing schema references
Handlebars.registerHelper('basename', function(ref) {
  if (typeof ref !== 'string') return '';
  
  // Example: #/components/schemas/Pet -> Pet
  const parts = ref.split('/');
  return parts[parts.length - 1];
});


interface FlattenedProperty {
  path: string;
  type: string;
  required: boolean;
  description: string;
  format?: string;
  example?: any;
}

Handlebars.registerHelper('flattenProperties', function(schema: any, options?: Handlebars.HelperOptions): FlattenedProperty[] | string {
  /**
   * Recursively flatten schema properties into a flat list
   * Returns: [{path: 'metadata.request_id', type: 'string', required: true, description: '...'}]
   */
  
  function flattenSchema(obj: any, basePath: string = '', parentRequired: string[] = []): FlattenedProperty[] {
    const flattened: FlattenedProperty[] = [];
    
    if (!obj || !obj.properties) {
      return flattened;
    }
    
    Object.keys(obj.properties).forEach(key => {
      const property = obj.properties[key];
      const currentPath = basePath ? `${basePath}.${key}` : key;
      const isRequired = parentRequired.includes(key);
      
      // Add current property
      flattened.push({
        path: currentPath,
        type: property.type || 'object',
        required: isRequired,
        description: property.description || '',
        format: property.format,
        example: property.example
      });
      
      // Handle nested objects
      if (property.type === 'object' && property.properties) {
        const nestedFlattened = flattenSchema(
          property, 
          currentPath, 
          property.required || []
        );
        flattened.push(...nestedFlattened);
      }
      
      // Handle arrays with object items
      if (property.type === 'array' && property.items) {
        const arrayPath = `${currentPath}[]`;
        
        if (property.items.type === 'object' && property.items.properties) {
          // Add array indicator
          flattened.push({
            path: arrayPath,
            type: `array[${property.items.type}]`,
            required: isRequired,
            description: `Array of ${property.items.type} items`,
            format: property.format,
            example: property.example
          });
          
          // Flatten array item properties
          const arrayItemFlattened = flattenSchema(
            property.items, 
            arrayPath, 
            property.items.required || []
          );
          flattened.push(...arrayItemFlattened);
        } else {
          // Simple array
          flattened.push({
            path: arrayPath,
            type: `array[${property.items.type || 'any'}]`,
            required: isRequired,
            description: property.description || `Array of ${property.items.type || 'any'} values`,
            format: property.format,
            example: property.example
          });
        }
      }
    });
    
    return flattened;
  }
  
  const flattened = flattenSchema(schema, '', schema.required || []);
  
  // Return formatted table rows if in table context
  if (options && options.fn) {
    return flattened.map(prop => options.fn(prop)).join('');
  }
  
  return flattened;
});

Handlebars.registerHelper('generateExample', function(schema: any, options?: Handlebars.HelperOptions): string {
  /**
   * Recursively generate realistic example JSON from schema
   * Handles nested objects, arrays, and all data types
   */
  
  function generateValue(property: any, propertyName: string = ''): any {
    // Use existing example if available
    if (property.example !== undefined) {
      return property.example;
    }
    
    // Generate based on type
    switch (property.type) {
      case 'string':
        if (property.format === 'uuid') {
          return `${propertyName}_uuid_example`;
        }
        if (property.format === 'date-time') {
          return new Date().toISOString();
        }
        if (property.format === 'uri') {
          return `https://example.com/${propertyName}`;
        }
        return `example_${propertyName || 'string'}`;
        
      case 'number':
      case 'integer':
        if (propertyName.includes('confidence') || propertyName.includes('score')) {
          return 0.95;
        }
        if (propertyName.includes('time') || propertyName.includes('duration')) {
          return 25.5;
        }
        if (propertyName.includes('count') || propertyName.includes('num')) {
          return 5;
        }
        return 42;
        
      case 'boolean':
        return true;
        
      case 'array':
        if (property.items) {
          const itemExample: any = generateValue(property.items, propertyName);
          return [itemExample];
        }
        return [];
        
      case 'object':
        if (property.properties) {
          return generateObjectFromSchema(property);
        }
        return {};
        
      default:
        return null;
    }
  }
  
  function generateObjectFromSchema(schema: any, requiredOnly: boolean = false): Record<string, any> {
    const result: Record<string, any> = {};
    
    if (!schema.properties) {
      return result;
    }
    
    const requiredFields = schema.required || [];
    const propsToProcess = requiredOnly 
      ? Object.keys(schema.properties).filter(key => requiredFields.includes(key))
      : Object.keys(schema.properties);
    
    propsToProcess.forEach(key => {
      const property = schema.properties[key];
      result[key] = generateValue(property, key);
    });
    
    return result;
  }
  
  // Check if we should only generate required properties
  const requiredOnly = options && options.hash && options.hash.requiredOnly;
  
  const example = generateObjectFromSchema(schema, requiredOnly);
  
  // Return as formatted JSON string
  return JSON.stringify(example, null, 2);
});

Handlebars.registerHelper('buildPropertyPath', function(basePath: string, propertyName: string, isArray: boolean): string {
  /**
   * Build dot notation and array notation paths safely
   * Handles: metadata.model_info[model_id].name, results.channels[].alternatives[]
   */
  
  if (!basePath && !propertyName) {
    return '';
  }
  
  if (!basePath) {
    return isArray ? `${propertyName}[]` : propertyName;
  }
  
  if (!propertyName) {
    return basePath;
  }
  
  // Handle array notation
  if (isArray) {
    return `${basePath}.${propertyName}[]`;
  }
  
  // Handle special characters in property names
  const safeName = propertyName.includes('.') || propertyName.includes(' ') 
    ? `["${propertyName}"]` 
    : propertyName;
    
  return `${basePath}.${safeName}`;
});

Handlebars.registerHelper('getPropertyType', function(property: any): string {
  /**
   * Get a human-readable type description for a property
   */
  
  if (!property) return 'unknown';
  
  let typeDesc = property.type || 'object';
  
  if (property.format) {
    typeDesc += ` (${property.format})`;
  }
  
  if (property.type === 'array' && property.items) {
    if (property.items.type) {
      typeDesc = `array[${property.items.type}]`;
    } else {
      typeDesc = 'array[object]';
    }
  }
  
  return typeDesc;
});

Handlebars.registerHelper('isRequired', function(propertyName: string, requiredArray: string[]): boolean {
  /**
   * Check if a property is required
   */
  
  if (!requiredArray || !Array.isArray(requiredArray)) {
    return false;
  }
  
  return requiredArray.includes(propertyName);
});

Handlebars.registerHelper('flattenPropertiesTable', function(schema: any): Handlebars.SafeString {
  /**
   * Generate a complete flattened properties table for markdown
   */
  
  // Since we can't directly access the registered helper, we'll recreate the flattening logic
  function flattenSchema(obj: any, basePath: string = '', parentRequired: string[] = []): FlattenedProperty[] {
    const flattened: FlattenedProperty[] = [];
    
    if (!obj || !obj.properties) {
      return flattened;
    }
    
    Object.keys(obj.properties).forEach(key => {
      const property = obj.properties[key];
      const currentPath = basePath ? `${basePath}.${key}` : key;
      const isRequired = parentRequired.includes(key);
      
      flattened.push({
        path: currentPath,
        type: property.type || 'object',
        required: isRequired,
        description: property.description || '',
        format: property.format,
        example: property.example
      });
      
      // Handle nested objects
      if (property.type === 'object' && property.properties) {
        const nestedFlattened = flattenSchema(
          property, 
          currentPath, 
          property.required || []
        );
        flattened.push(...nestedFlattened);
      }
      
      // Handle arrays with object items
      if (property.type === 'array' && property.items) {
        const arrayPath = `${currentPath}[]`;
        
        if (property.items.type === 'object' && property.items.properties) {
          flattened.push({
            path: arrayPath,
            type: `array[${property.items.type}]`,
            required: isRequired,
            description: `Array of ${property.items.type} items`,
            format: property.format,
            example: property.example
          });
          
          const arrayItemFlattened = flattenSchema(
            property.items, 
            arrayPath, 
            property.items.required || []
          );
          flattened.push(...arrayItemFlattened);
        } else {
          flattened.push({
            path: arrayPath,
            type: `array[${property.items.type || 'any'}]`,
            required: isRequired,
            description: property.description || `Array of ${property.items.type || 'any'} values`,
            format: property.format,
            example: property.example
          });
        }
      }
    });
    
    return flattened;
  }
  
  const flattened = flattenSchema(schema, '', schema.required || []);
  
  let tableRows = '';
  flattened.forEach((prop: FlattenedProperty) => {
    const required = prop.required ? 'Yes' : 'No';
    const description = prop.description || `${prop.type} property`;
    
    tableRows += `| \`${prop.path}\` | ${prop.type} | ${required} | ${description} |\n`;
  });
  
  return new Handlebars.SafeString(tableRows);
});

/**
 * Interface for template frontmatter
 */
export interface TemplateFrontmatter {
  outputPattern?: string;
  splitOn?: string;
  groupBy?: string;
  [key: string]: string | undefined; // Add index signature
}

/**
 * Extracts frontmatter from a template string
 */
function extractFrontmatter(template: string): { frontmatter: TemplateFrontmatter | null, content: string } {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = template.match(frontmatterRegex);
  
  if (!match) {
    console.log('No frontmatter found in template');
    return { frontmatter: null, content: template };
  }
  
  try {
    // Parse the frontmatter as a simple key-value object
    const frontmatterStr = match[1];
    const content = match[2];
    
    console.log('Found frontmatter:', frontmatterStr);
    
    const frontmatter: TemplateFrontmatter = {};
    frontmatterStr.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length > 0) {
        const value = valueParts.join(':').trim();
        // Remove quotes if present
        frontmatter[key.trim()] = value.replace(/^["'](.*)["']$/, '$1');
      }
    });
    
    console.log('Parsed frontmatter:', frontmatter);
    
    return { frontmatter, content };
  } catch (error) {
    console.warn(`Error parsing frontmatter: ${error}`);
    return { frontmatter: null, content: template };
  }
}

/**
 * Options for rendering a template
 */
export interface RenderOptions {
  /** Template source content */
  template: string;
  /** Data to apply to the template */
  data: any;
  /** Optional Handlebars helper functions */
  helpers?: Record<string, Handlebars.HelperDelegate>;
}

/**
 * Options for rendering a template file
 */
export interface RenderFileOptions {
  /** Path to the template file */
  templatePath: string;
  /** Data to apply to the template */
  data: any;
  /** Optional output path to write the rendered content */
  outputPath?: string;
  /** Optional Handlebars helper functions */
  helpers?: Record<string, Handlebars.HelperDelegate>;
}

/**
 * Options for rendering a template file with schema reference resolution
 */
export interface RenderFileWithRefResolutionOptions extends RenderFileOptions {
  /** Options for resolving JSON Schema references */
  refResolutionOptions?: SchemaRefResolverOptions;
}

/**
 * Renders a template with the provided data
 */
export function renderTemplate(options: RenderOptions): string {
  // Register any helpers
  if (options.helpers) {
    Object.entries(options.helpers).forEach(([name, helper]) => {
      Handlebars.registerHelper(name, helper);
    });
  }

  const template = Handlebars.compile(options.template);
  return template(options.data);
}

/**
 * Renders a template file with the provided data, supporting multi-file output based on frontmatter
 */
export function renderTemplateFile(options: RenderFileOptions): string | string[] {
  const templateContent = fs.readFileSync(options.templatePath, 'utf8');
  const { frontmatter, content } = extractFrontmatter(templateContent);
  
  // If no frontmatter or no split requested, just render as normal
  if (!frontmatter || !frontmatter.splitOn) {
    const result = renderTemplate({
      template: templateContent,
      data: options.data,
      helpers: options.helpers
    });

    // Optionally write output to a file
    if (options.outputPath) {
      const outputDir = path.dirname(options.outputPath);
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      fs.writeFileSync(options.outputPath, result, 'utf8');
    }

    return result;
  }
  
  // Handle multi-file output based on frontmatter
  const splitOn = frontmatter.splitOn;
  const groupBy = frontmatter.groupBy;
  const outputPattern = frontmatter.outputPattern;
  
  if (!options.outputPath) {
    console.warn('Multi-file output requested but no output directory specified');
    return renderTemplate({
      template: content,
      data: options.data,
      helpers: options.helpers
    });
  }
  
  // Get the data to split on
  const specData = options.data?.spec || {};
  
  // Handle nested paths like "components.schemas"
  let splitData: Record<string, any> | undefined;
  if (splitOn && splitOn.includes('.')) {
    const parts = splitOn.split('.');
    let current = specData;
    for (const part of parts) {
      if (!current || typeof current !== 'object') {
        current = undefined;
        break;
      }
      current = current[part];
    }
    splitData = current as Record<string, any> | undefined;
  } else {
    splitData = specData[splitOn as string] as Record<string, any> | undefined;
  }
  
  if (!splitData) {
    console.warn(`Split key '${splitOn}' not found in data`);
    return renderTemplate({
      template: content,
      data: options.data,
      helpers: options.helpers
    });
  }
  
  const results: string[] = [];
  
  // Process each entry
  Object.entries(splitData).forEach(([entryName, entryData]) => {
    console.log(`Processing entry: ${entryName}`);
    
    if (groupBy === 'method' && typeof entryData === 'object' && entryData !== null) {
      console.log(`Entry ${entryName} is being processed by method`);
      
      // Define a list of valid HTTP methods
      const validMethods = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'];
      
      // Each HTTP method gets its own file
      Object.entries(entryData as Record<string, any>).forEach(([methodName, methodData]) => {
        // Skip non-method entries
        if (!validMethods.includes(methodName.toLowerCase())) {
          return;
        }
        
        console.log(`Processing method: ${methodName}`);
        // Create a context for this specific method
        const context = {
          ...options.data,
          '@pathName': entryName,
          '@methodName': methodName,
          ...methodData as object
        };
        
        // Also add the variables directly into the method data for template access
        if (typeof methodData === 'object' && methodData !== null) {
          (methodData as any).pathName = entryName;
          (methodData as any).methodName = methodName;
        }
        
        // Create a combined context that includes both top-level vars and method-specific data
        const renderContext = {
          ...options.data,
          pathName: entryName,
          methodName: methodName,
          ...methodData as object
        };
        
        // Render the template with this context
        const renderedContent = renderTemplate({
          template: content,
          data: renderContext,
          helpers: options.helpers
        });
        
        results.push(renderedContent);
        
        // Generate the output path using the pattern
        if (outputPattern && options.outputPath) {
          console.log('Output pattern:', outputPattern);
          console.log('Context keys:', Object.keys(context));
          
          try {
            // Create a basic template without handlebar's normal escaping
            let outputFilePath = outputPattern;
            
            // Replace template variables with values from the context
            Object.entries(context).forEach(([key, value]) => {
              if (key.startsWith('@') && typeof value === 'string') {
                const varName = key;
                const regex = new RegExp(`{{${varName}}}`, 'g');
                outputFilePath = outputFilePath.replace(regex, value);
                
                console.log(`Replacing ${varName} with ${value}`);
              }
            });
            
            console.log('methodName value:', context['@methodName']);
            console.log('After replacements, outputFilePath:', outputFilePath);
            
            // Replace any remaining template variables with empty string
            outputFilePath = outputFilePath.replace(/{{[^}]+}}/g, '');
            
            // Normalize the path
            outputFilePath = outputFilePath
              .replace(/\/+/g, '/') // Normalize slashes
              .replace(/^\//, ''); // Remove leading slash
            
            // Replace any invalid characters in the filepath
            outputFilePath = outputFilePath
              .replace(/[{}]/g, '_') // Replace path parameter braces with underscores
              .replace(/[<>:"|?*]/g, '_'); // Replace other invalid filename characters
            
            console.log(`Final output path: ${outputFilePath}`);
            
            const fullOutputPath = path.join(path.dirname(options.outputPath), outputFilePath);
            console.log(`Full output path: ${fullOutputPath}`);
            
            const outputDir = path.dirname(fullOutputPath);
            
            // Create directory if it doesn't exist
            if (!fs.existsSync(outputDir)) {
              fs.mkdirSync(outputDir, { recursive: true });
            }
            
            // Write the file
            fs.writeFileSync(fullOutputPath, renderedContent, 'utf8');
          } catch (error) {
            console.error(`Error generating output path: ${error}`);
          }
        }
      });
    } else if (typeof entryData === 'object' && entryData !== null) {
      console.log(`Entry ${entryName} is being processed directly`);
      // Default is one file per entry (path or schema)
      const context = {
        ...options.data,
        '@pathName': entryName,
        '@schemaName': entryName, // Use the same variable for schemas
        ...entryData as object
      };
      
      // Also add the @ variables to the top level for content rendering
      if (typeof entryData === 'object' && entryData !== null) {
        (entryData as any).pathName = entryName;
        (entryData as any).schemaName = entryName;
      }
      
      // Create a combined context that includes both top-level vars and entry-specific data
      const renderContext = {
        ...options.data,
        pathName: entryName,
        schemaName: entryName,
        ...entryData as object
      };
      
      const renderedContent = renderTemplate({
        template: content,
        data: renderContext,
        helpers: options.helpers
      });
      
      results.push(renderedContent);
      
      // Generate the output path using the pattern
      if (outputPattern && options.outputPath) {
        console.log('Output pattern:', outputPattern);
        console.log('Context keys:', Object.keys(context));
        
        try {
          // Create a basic template without handlebar's normal escaping
          let outputFilePath = outputPattern;
          
          // Replace template variables with values from the context
          Object.entries(context).forEach(([key, value]) => {
            if (key.startsWith('@') && typeof value === 'string') {
              const varName = key;
              const regex = new RegExp(`{{${varName}}}`, 'g');
              outputFilePath = outputFilePath.replace(regex, value);
              
              console.log(`Replacing ${varName} with ${value}`);
            }
          });
          
          console.log('methodName value:', context['@methodName']);
          console.log('After replacements, outputFilePath:', outputFilePath);
          
          // Replace any remaining template variables with empty string
          outputFilePath = outputFilePath.replace(/{{[^}]+}}/g, '');
          
          // Normalize the path
          outputFilePath = outputFilePath
            .replace(/\/+/g, '/') // Normalize slashes
            .replace(/^\//, ''); // Remove leading slash
          
          // Replace any invalid characters in the filepath
          outputFilePath = outputFilePath
            .replace(/[{}]/g, '_') // Replace path parameter braces with underscores
            .replace(/[<>:"|?*]/g, '_'); // Replace other invalid filename characters
          
          console.log(`Final output path: ${outputFilePath}`);
          
          const fullOutputPath = path.join(path.dirname(options.outputPath), outputFilePath);
          console.log(`Full output path: ${fullOutputPath}`);
          
          const outputDir = path.dirname(fullOutputPath);
          
          // Create directory if it doesn't exist
          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
          }
          
          // Write the file
          fs.writeFileSync(fullOutputPath, renderedContent, 'utf8');
        } catch (error) {
          console.error(`Error generating output path: ${error}`);
        }
      }
    }
  });
  
  return results;
}

/**
 * Renders multiple templates with the same data
 */
export function renderMultipleTemplates(templates: string[], data: any, helpers?: Record<string, Handlebars.HelperDelegate>): string[] {
  return templates.map(template => 
    renderTemplate({ template, data, helpers })
  );
}

/**
 * Renders multiple template files with the same data
 */
export function renderMultipleTemplateFiles(
  templatePaths: string[], 
  data: any, 
  outputDir?: string,
  helpers?: Record<string, Handlebars.HelperDelegate>
): string[] {
  return templatePaths.flatMap(templatePath => {
    const outputBasename = path.basename(templatePath).replace(/\.(hbs|handlebars|deepdown)$/, '.md');
    const outputPath = outputDir 
      ? path.join(outputDir, outputBasename)
      : undefined;
      
    const result = renderTemplateFile({
      templatePath,
      data,
      outputPath,
      helpers
    });
    
    return Array.isArray(result) ? result : [result];
  });
}

/**
 * Renders a template file with the provided data, resolving any JSON Schema references
 * in the data object before rendering. This is useful for flattening $ref pointers in
 * schemas before they're processed by the template.
 */
export async function renderTemplateFileWithResolvedRefs(
  options: RenderFileWithRefResolutionOptions
): Promise<string | string[]> {
  // Create a copy of the data to avoid modifying the original
  const dataCopy = JSON.parse(JSON.stringify(options.data));
  
  // If spec property exists, resolve its references
  if (dataCopy.spec) {
    try {
      dataCopy.spec = await resolveSchemaRefs(dataCopy.spec, options.refResolutionOptions);
    } catch (error) {
      console.warn('Error resolving schema references:', error);
      // Continue with the original spec if resolution fails
    }
  }
  
  // Use the standard renderTemplateFile with the resolved data
  return renderTemplateFile({
    templatePath: options.templatePath,
    data: dataCopy,
    outputPath: options.outputPath,
    helpers: options.helpers
  });
}

/**
 * Renders multiple template files with the provided data with resolved references
 */
export async function renderMultipleTemplateFilesWithResolvedRefs(
  templatePaths: string[], 
  data: any, 
  outputDir?: string,
  helpers?: Record<string, Handlebars.HelperDelegate>,
  refResolutionOptions?: SchemaRefResolverOptions
): Promise<string[]> {
  // Create a copy of the data and resolve references once
  const dataCopy = JSON.parse(JSON.stringify(data));
  
  // If spec property exists, resolve its references
  if (dataCopy.spec) {
    try {
      dataCopy.spec = await resolveSchemaRefs(dataCopy.spec, refResolutionOptions);
    } catch (error) {
      console.warn('Error resolving schema references:', error);
      // Continue with the original spec if resolution fails
    }
  }

  // Use the resolved data for all templates
  return templatePaths.flatMap(templatePath => {
    const outputBasename = path.basename(templatePath).replace(/\.(hbs|handlebars|deepdown)$/, '.md');
    const outputPath = outputDir 
      ? path.join(outputDir, outputBasename)
      : undefined;
      
    const result = renderTemplateFile({
      templatePath,
      data: dataCopy,
      outputPath,
      helpers
    });
    
    return Array.isArray(result) ? result : [result];
  });
}

export default {
  renderTemplate,
  renderTemplateFile,
  renderTemplateFileWithResolvedRefs,
  renderMultipleTemplates,
  renderMultipleTemplateFiles,
  renderMultipleTemplateFilesWithResolvedRefs
}; 