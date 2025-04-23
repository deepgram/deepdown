import { SchemaRefResolverOptions, resolveSchemaRefs } from '@deepgram/deepdown-renderer/dist/schema-resolver';

/**
 * AsyncAPI-specific options for resolving references
 */
export interface AsyncAPIResolverOptions extends SchemaRefResolverOptions {
  /** Whether to resolve security schemes (default: true) */
  resolveSecurity?: boolean;
}

/**
 * Resolves all references in an AsyncAPI specification, including security schemes
 * on channels and operations.
 * 
 * @param schema - The AsyncAPI schema object to resolve references for
 * @param options - Options for resolving references
 * @returns A promise that resolves to the schema with all references resolved
 */
export async function resolveAsyncAPI(
  schema: any,
  options: AsyncAPIResolverOptions = {}
): Promise<any> {
  if (!schema) {
    return schema;
  }

  // First, resolve standard JSON Schema $ref pointers
  let resolvedSchema = await resolveSchemaRefs(schema, options);
  
  // Then, handle AsyncAPI-specific security scheme resolution if requested
  if (options.resolveSecurity !== false) {
    resolvedSchema = await resolveAsyncAPISecuritySchemes(resolvedSchema);
  }
  
  return resolvedSchema;
}

/**
 * Resolves security schemes in an AsyncAPI document.
 * 
 * Security schemes are defined in components.securitySchemes but referenced directly
 * by name in the security array at the root or channel/operation level without using $ref pointers.
 * 
 * @param schema - The AsyncAPI schema object to resolve security schemes for
 * @returns The schema with resolved security schemes
 */
export async function resolveAsyncAPISecuritySchemes(schema: any): Promise<any> {
  if (!schema || !schema.components || !schema.components.securitySchemes) {
    return schema;
  }
  
  // Create a new copy to avoid modifying the original
  const result = JSON.parse(JSON.stringify(schema));
  const securitySchemes = result.components.securitySchemes;
  
  // Handle global server security
  if (result.servers) {
    for (const serverName in result.servers) {
      const server = result.servers[serverName];
      if (Array.isArray(server.security)) {
        server.security = resolveSecurityRequirements(server.security, securitySchemes);
      }
    }
  }
  
  // Handle channel-level and operation-level security
  if (result.channels) {
    for (const channelName in result.channels) {
      const channel = result.channels[channelName];
      
      // Handle security at channel level
      if (Array.isArray(channel.security)) {
        channel.security = resolveSecurityRequirements(channel.security, securitySchemes);
      }
      
      // Handle security at operation (publish/subscribe) level
      for (const operation of ['publish', 'subscribe']) {
        if (channel[operation] && Array.isArray(channel[operation].security)) {
          channel[operation].security = resolveSecurityRequirements(
            channel[operation].security,
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
export function registerAsyncAPICurlHelpers(): void {
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
  resolveAsyncAPI,
  resolveAsyncAPISecuritySchemes,
  registerAsyncAPICurlHelpers
}; 