import $RefParser from '@apidevtools/json-schema-ref-parser';

/**
 * Options for resolving JSON Schema references
 */
export interface SchemaRefResolverOptions {
  /** Whether to preserve $ref pointers (true) or replace them with the referenced values (false) */
  preserveRefs?: boolean;
  /** Whether to resolve circular references */
  resolveCircular?: boolean;
  /** Type of specification being resolved (for spec-specific resolution) */
  specType?: 'openapi' | 'asyncapi' | 'jsonschema';
}

/**
 * Resolves all JSON Schema $ref pointers in the given schema.
 * 
 * @param schema - The JSON Schema object to resolve references for
 * @param options - Options for resolving references
 * @returns A promise that resolves to the schema with all references resolved
 */
export async function resolveSchemaRefs(
  schema: any,
  options: SchemaRefResolverOptions = {}
): Promise<any> {
  if (!schema) {
    return schema;
  }

  const opts = {
    dereference: {
      circular: options.resolveCircular !== false
    }
  };

  try {
    // If preserveRefs is true, use bundle, otherwise use dereference
    if (options.preserveRefs) {
      // Bundle resolves external references but keeps internal references
      const result = await $RefParser.bundle(schema, opts);
      return result;
    } else {
      // Dereference completely resolves all references
      const result = await $RefParser.dereference(schema, opts);
      return result;
    }
  } catch (error) {
    console.error('Error resolving JSON Schema references:', error);
    throw error;
  }
}

/**
 * This function will be moved to a dedicated openapi-resolver package
 * TODO: Implement OpenAPI-specific security scheme resolution
 */
export async function resolveOpenAPISecuritySchemes(
  schema: any,
  options: SchemaRefResolverOptions = {}
): Promise<any> {
  // Placeholder for OpenAPI-specific security scheme resolution
  // Will be implemented in a dedicated @deepgram/deepdown-openapi package
  return schema;
}

/**
 * This function will be moved to a dedicated asyncapi-resolver package
 * TODO: Implement AsyncAPI-specific security scheme resolution
 */
export async function resolveAsyncAPISecuritySchemes(
  schema: any,
  options: SchemaRefResolverOptions = {}
): Promise<any> {
  // Placeholder for AsyncAPI-specific security scheme resolution
  // Will be implemented in a dedicated @deepgram/deepdown-asyncapi package
  return schema;
}

export default {
  resolveSchemaRefs,
  resolveOpenAPISecuritySchemes,
  resolveAsyncAPISecuritySchemes
}; 