# @deepgram/deepdown

The main package for Deepdown, a markdown templating format for generating AI-ready documentation from JSON Schema, OpenAPI, and AsyncAPI specifications.

## Installation

```bash
npm install @deepgram/deepdown
# or
yarn add @deepgram/deepdown
# or
pnpm add @deepgram/deepdown
```

## Usage

```typescript
import deepdown from '@deepgram/deepdown';
// or specific imports
import { build, parseYamlFile, renderTemplate } from '@deepgram/deepdown';

// Basic usage - build documentation from spec and template files
const outputFiles = await deepdown.build(
  'path/to/openapi.yaml', 
  'path/to/template.md', 
  { 
    outputDir: 'path/to/output',
    resolveRefs: true
  }
);

// Advanced usage - process and render with custom options
const spec = await parseYamlFile('path/to/api-spec.yaml');
const result = await renderTemplate(
  '# {{spec.info.title}}\n\n{{spec.info.description}}', 
  { spec }
);
```

## API Reference

### Main Functions

- `build(specPaths, templatePaths, options)` - Process specs and templates to generate markdown files
- `detectSpecType(spec, filename?)` - Auto-detect if a spec is OpenAPI, AsyncAPI, or JSON Schema

### Parser Functions

- `parseYamlFile(filePath)` - Parse a YAML file into a JavaScript object
- `parseYamlString(yamlString)` - Parse a YAML string into a JavaScript object
- `parseMultipleFiles(filePaths)` - Parse multiple YAML files
- `toJson(object)` - Convert an object to a JSON string

### Renderer Functions

- `renderTemplate(template, data)` - Render a template string with data
- `renderTemplateFile(templatePath, data)` - Render a template file with data
- `renderTemplateFileWithResolvedRefs(templatePath, data, options)` - Render a template file with reference resolution
- `renderMultipleTemplateFiles(templatePaths, data, outputDir?)` - Render multiple template files

### Resolver Functions

- `resolveOpenAPI(spec, options)` - Resolve OpenAPI references and security schemes
- `resolveAsyncAPI(spec, options)` - Resolve AsyncAPI references and security schemes

## Options

The `build` function accepts the following options:

- `outputDir` - Directory where generated markdown files will be saved
- `resolveRefs` - Whether to resolve JSON Schema $ref pointers (default: false)
- `preserveRefs` - Whether to preserve internal $ref pointers when resolving (default: false)
- `resolveSecurity` - Whether to resolve security schemes for API specs (default: false)
- `specType` - Force a specific spec type ('openapi', 'asyncapi', or 'jsonschema')
- `rootKey` - Root key name for the spec data in templates (default: 'spec')
- `verbose` - Show verbose output during processing

## License

MIT 