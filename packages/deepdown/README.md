# Deepdown

Markdown templating format for generating AI-ready docs from JSON Schema, OpenAPI, and AsyncAPI specifications.

Built for vector stores and RAG (Retrieval Augmented Generation) workflows, Deepdown helps you create consistent, semantic documentation that's ready for AI applications.

## Overview

Deepdown transforms API specifications and JSON Schema documents into markdown documentation using templating. The resulting output is optimized for:

- Vector databases and embeddings
- RAG workflows
- Providing consistent structure for LLM consumption
- Making complex API documentation accessible to AI systems

## Installation

```bash
# NPM
npm install -g @deepgram/deepdown

# PNPM
pnpm add -g @deepgram/deepdown

# Yarn
yarn global add @deepgram/deepdown
```

## Quick Start

```bash
# Generate docs from an OpenAPI spec
deepdown build specs/openapi.yaml templates/api.deepdown --output docs/

# Generate docs from a JSON Schema
deepdown build specs/schema.json templates/schema.deepdown --output docs/
```

## Usage

### Command Line Interface

```bash
# Basic: Generate docs from a spec and template
deepdown build <spec-file> <template-file> --output <output-dir>

# Parse multiple spec files
deepdown build "specs/**/*.yaml" "templates/**/*.deepdown" --output docs/

# Resolve JSON Schema references
deepdown build specs/api.yaml templates/api.deepdown --output docs/ --resolve-refs

# Resolve security schemes in OpenAPI specs
deepdown build specs/api.yaml templates/api.deepdown --output docs/ --resolve-refs --resolve-security
```

### Tab Completion

Set up tab completion to make working with the CLI easier:

```bash
# Generate and install Bash completion
deepdown completion > ~/.deepdown-completion.bash
echo 'source ~/.deepdown-completion.bash' >> ~/.bashrc
source ~/.bashrc

# For ZSH users
deepdown completion --shell zsh > ~/.deepdown-completion.zsh
echo 'source ~/.deepdown-completion.zsh' >> ~/.zshrc
source ~/.zshrc

# For Fish shell
deepdown completion --shell fish > ~/.config/fish/completions/deepdown.fish

# For PowerShell
deepdown completion --shell powershell > ~/.deepdown-completion.ps1
echo '. ~/.deepdown-completion.ps1' >> $PROFILE
```

### Programmatic Usage

```javascript
import deepdown from '@deepgram/deepdown';

// Generate docs from a spec and template
const docs = await deepdown.build(
  'specs/api.yaml',
  'templates/api.deepdown',
  { 
    outputDir: 'docs/',
    resolveRefs: true,
    resolveSecurity: true
  }
);

// Access specific functions
import { parseYamlFile, renderTemplate } from '@deepgram/deepdown';

const spec = await parseYamlFile('specs/api.yaml');
const markdown = await renderTemplate('# {{spec.info.title}}', { spec });
```

## Template Format

Deepdown templates use Handlebars syntax to access spec data:

```markdown
# {{spec.info.title}}

{{spec.info.description}}

## Endpoints

{{#each spec.paths}}
  {{#each this}}
### {{@key}} {{../key}}

{{summary}}

{{description}}
  {{/each}}
{{/each}}
```

## Advanced Features

- Reference resolution for JSON Schema `$ref` pointers
- Security scheme resolution for OpenAPI and AsyncAPI specs
- Automatic spec type detection (OpenAPI, AsyncAPI, JSON Schema)
- Direct upload to vector stores via providers

For more details, see [PACKAGES.md](PACKAGES.md).

## Development

Deepdown is a monorepo with multiple packages. See [PACKAGES.md](PACKAGES.md) for details on the package structure and development workflow.

```bash
# Clone the repository
git clone https://github.com/deepgram/deepdown.git
cd deepdown

# Install dependencies
pnpm install

# Build all packages
npx lerna run build
```

## License

MIT License - Copyright (c) 2025 Deepgram
