import { SchemaRefResolverOptions, resolveSchemaRefs } from '@deepgram/deepdown-renderer/dist/schema-resolver';

/**
 * OpenAPI-specific options for resolving references
 */
export interface OpenAPIResolverOptions extends SchemaRefResolverOptions {
  /** Whether to resolve security schemes (default: true) */
  resolveSecurity?: boolean;
}

/**
 * Resolves all references in an OpenAPI specification, including security schemes
 * on paths and operations.
 * 
 * @param schema - The OpenAPI schema object to resolve references for
 * @param options - Options for resolving references
 * @returns A promise that resolves to the schema with all references resolved
 */
export async function resolveOpenAPI(
  schema: any,
  options: OpenAPIResolverOptions = {}
): Promise<any> {
  if (!schema) {
    return schema;
  }

  // First, resolve standard JSON Schema $ref pointers
  let resolvedSchema = await resolveSchemaRefs(schema, options);
  
  // Then, handle OpenAPI-specific security scheme resolution if requested
  if (options.resolveSecurity !== false) {
    resolvedSchema = await resolveOpenAPISecuritySchemes(resolvedSchema);
  }
  
  return resolvedSchema;
}

/**
 * Resolves security schemes in an OpenAPI document.
 * 
 * Security schemes are defined in components.securitySchemes but referenced directly
 * by name in the security array at the root or operation level without using $ref pointers.
 * 
 * @param schema - The OpenAPI schema object to resolve security schemes for
 * @returns The schema with resolved security schemes
 */
export async function resolveOpenAPISecuritySchemes(schema: any): Promise<any> {
  if (!schema || !schema.components || !schema.components.securitySchemes) {
    return schema;
  }
  
  // Create a new copy to avoid modifying the original
  const result = JSON.parse(JSON.stringify(schema));
  const securitySchemes = result.components.securitySchemes;
  
  // Handle global security requirement objects
  if (Array.isArray(result.security)) {
    result.security = resolveSecurityRequirements(result.security, securitySchemes);
  }
  
  // Handle path-level security requirement objects
  if (result.paths) {
    for (const path in result.paths) {
      const pathItem = result.paths[path];
      
      // Handle operation-level security requirements
      for (const method of ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace']) {
        if (pathItem[method] && Array.isArray(pathItem[method].security)) {
          pathItem[method].security = resolveSecurityRequirements(
            pathItem[method].security,
            securitySchemes
          );
        }
      }
    }
  }
  
  return result;
}

/**
 * Register handlebar helpers for curl command generation
 */
export function registerOpenAPICurlHelpers(): void {
  // This would contain the implementation for registering curl command helpers
  // For now it's just a placeholder
}

/**
 * Resolves security requirement objects by expanding them with the full security scheme
 * 
 * @param securityRequirements - Array of security requirement objects
 * @param securitySchemes - Security schemes defined in components.securitySchemes
 * @returns Expanded security requirements with full scheme details
 */
function resolveSecurityRequirements(
  securityRequirements: any[],
  securitySchemes: Record<string, any>
): any[] {
  return securityRequirements.map(requirement => {
    const expandedRequirement: Record<string, any> = {};
    
    // Each requirement is an object with security scheme names as keys
    for (const schemeName in requirement) {
      if (securitySchemes[schemeName]) {
        // Create an expanded entry with both scopes and scheme details
        expandedRequirement[schemeName] = {
          // Keep the original scopes
          scopes: requirement[schemeName],
          // Add the full security scheme details
          scheme: securitySchemes[schemeName]
        };
      } else {
        // Keep the original if scheme not found
        expandedRequirement[schemeName] = requirement[schemeName];
      }
    }
    
    return expandedRequirement;
  });
}

export default {
  resolveOpenAPI,
  resolveOpenAPISecuritySchemes,
  registerOpenAPICurlHelpers
}; 