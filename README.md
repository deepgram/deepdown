# Deepdown

Markdown templating format for generating AI-ready docs from JSON Schema, built for vector stores and RAG workflows.

## Project Structure

Deepdown is a monorepo built with Lerna, containing the following packages:

- **parser**: Converts YAML/JSON files to structured data
- **renderer**: Generates markdown files from templates
- **cli**: Command-line interface for Deepdown
- **resolver-openapi**: OpenAPI-specific functionality for resolving references and security schemes
- **resolver-asyncapi**: AsyncAPI-specific functionality for resolving references and security schemes
- **provider-pinecone**: Uploads markdown files to Pinecone vector store

## Installation

```bash
# Install dependencies
npm install

# Build all packages
npm run build
```

## Usage

### Command Line

```bash
# Parse YAML and render templates in a single step
npx deepdown build "specs/**/*.yaml" "templates/**/*.deepdown" --output ./output/markdown

# Parse YAML files only
npx deepdown parse "specs/**/*.yaml" --output ./output/json --pretty

# Render markdown files from JSON data
npx deepdown render "templates/**/*.deepdown" --data ./output/json/spec.json --output ./output/markdown
```

### Programmatic Usage

```javascript
import { parseFiles, renderTemplates, buildProject } from '@deepgram/deepdown';

// Parse and render in a single step (recommended)
const renderedFiles = await buildProject(
  'specs/**/*.yaml',
  'templates/**/*.deepdown',
  './output/markdown'
);

// Or parse and render separately
const parsedData = await parseFiles(['specs/api.yaml', 'specs/schema.yaml']);
const renderedFiles = await renderTemplates(
  ['templates/schema.deepdown', 'templates/api.deepdown'],
  parsedData,
  './output/markdown'
);
```

### Using with Vector Stores

```javascript
import { uploadToPinecone } from '@deepgram/deepdown-provider-pinecone';

// Upload markdown files to Pinecone
await uploadToPinecone(['output/markdown/schema.md', 'output/markdown/api.md'], {
  apiKey: 'your-pinecone-api-key',
  environment: 'gcp-starter',
  indexName: 'deepdown-docs',
  embeddingFunction: async (text) => {
    // Generate embeddings using your preferred model
    return [/* vector */];
  }
});
```

## JSON Schema Reference Resolution

Deepdown now supports resolving JSON Schema `$ref` pointers before rendering templates. This is useful when you want to have a fully resolved, flat schema without references in your output.

### Using Reference Resolution

You can enable reference resolution by using the `--resolve-refs` flag with the `build` or `render` commands:

```bash
# Build with reference resolution
deepdown build specs/my-openapi.yaml templates/my-template.deepdown --output docs/output --resolve-refs

# Optionally preserve internal references while still resolving external ones
deepdown build specs/my-openapi.yaml templates/my-template.deepdown --output docs/output --resolve-refs --preserve-refs
```

### API Specification Security Resolution

For OpenAPI and AsyncAPI specifications, Deepdown also supports resolving security schemes that are not standard `$ref` pointers. Security schemes in these specs are defined in `components.securitySchemes` but referenced directly by name in the `security` arrays.

```bash
# Resolve security schemes for OpenAPI/AsyncAPI specs
deepdown build specs/my-openapi.yaml templates/my-template.deepdown --output docs/output --resolve-refs --resolve-security

# Explicitly specify the spec type if auto-detection fails
deepdown build specs/my-spec.yaml templates/my-template.deepdown --output docs/output --resolve-refs --resolve-security --spec-type openapi
```

Security resolution provides these benefits:

- Expands security requirements at global, path, and operation levels in OpenAPI
- Expands security requirements at server, channel, and operation levels in AsyncAPI
- Makes it easier to access all security scheme details directly in templates
- Maintains the original security scope requirements

#### Specification Auto-Detection

Deepdown automatically detects the specification type through multiple methods:

1. **Standard Identifiers**:
   - OpenAPI: Presence of `openapi` or `swagger` fields
   - AsyncAPI: Presence of `asyncapi` field
   - JSON Schema: Presence of `$schema`, `type`, and/or `properties` fields

2. **Title Content**:
   - Specifications with titles containing "OpenAPI" or "Swagger" will be detected as OpenAPI
   - Specifications with titles containing "AsyncAPI" will be detected as AsyncAPI

3. **Filename**:
   - Files with names containing "openapi", "swagger", or "api-spec" will be detected as OpenAPI
   - Files with names containing "asyncapi", "async-api", or "event-api" will be detected as AsyncAPI

This multi-layered detection approach ensures that specifications are correctly identified even when they lack standard markers.

### How Reference Resolution Works

When you enable reference resolution:

1. All `$ref` pointers in your JSON Schema are resolved before the template is rendered
2. External file references and URL references are retrieved and included inline
3. By default, all references (including internal ones) are replaced with their actual content
4. With the `--preserve-refs` option, internal references are maintained while external ones are resolved

This can be particularly useful for:

- Ensuring all schema content is available in a single document
- Making it easier to traverse complex schemas in templates
- Creating more consistent documentation where all schema details are fully expanded

## Development

```bash
# Run development mode (watches for changes)
npm run dev

# Run tests
npm test

# Lint code
npm run lint
```

## License

ISC License - Copyright (c) 2025 Deepgram

[More info](LICENSE).
