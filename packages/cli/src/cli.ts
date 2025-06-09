#!/usr/bin/env node

import { Command } from 'commander';
import { glob } from 'glob';
import path from 'path';
import fs from 'fs';
import deepdown, {
  parseMultipleFiles,
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
  .version('0.0.1')
  .addHelpText('after', '\nTip: Run "deepdown setup-completion" to enable tab-completion for commands and options.');

// Add a command to show setup instructions
program
  .command('setup-completion')
  .description('Show tab-completion setup instructions')
  .action(() => {
    // Use the same code from postinstall.js
    console.log('\x1b[32m%s\x1b[0m', '✨ Tab-Completion Setup');
    console.log('\x1b[36m%s\x1b[0m', 'Set up shell tab completion to make working with the CLI easier:');
    console.log(`
\x1b[33mBash:\x1b[0m
  deepdown completion > ~/.deepdown-completion.bash
  echo 'source ~/.deepdown-completion.bash' >> ~/.bashrc
  source ~/.bashrc

\x1b[33mZsh:\x1b[0m
  deepdown completion --shell zsh > ~/.deepdown-completion.zsh
  echo 'source ~/.deepdown-completion.zsh' >> ~/.zshrc
  source ~/.zshrc

\x1b[33mFish:\x1b[0m
  mkdir -p ~/.config/fish/completions
  deepdown completion --shell fish > ~/.config/fish/completions/deepdown.fish

\x1b[33mPowerShell:\x1b[0m
  deepdown completion --shell powershell > ~/.deepdown-completion.ps1
  echo '. ~/.deepdown-completion.ps1' >> $PROFILE
`);
  });

// Add autocompletion setup command
program
  .command('completion')
  .description('Generate shell completion script')
  .option('-s, --shell <type>', 'Shell type: bash, zsh, fish, or powershell', 'bash')
  .action((options) => {
    const shell = options.shell.toLowerCase();
    let script = '';
    
    if (shell === 'bash') {
      script = `
# Bash completion script for deepdown CLI
_deepdown_completion() {
  local cur prev opts
  COMPREPLY=()
  cur="\${COMP_WORDS[COMP_CWORD]}"
  prev="\${COMP_WORDS[COMP_CWORD-1]}"
  
  # All available commands
  opts="build parse render completion helpers"
  
  # Complete commands
  if [[ \${COMP_CWORD} -eq 1 ]]; then
    COMPREPLY=( $(compgen -W "\${opts}" -- \${cur}) )
    return 0
  fi
  
  # Command-specific options
  case "\${COMP_WORDS[1]}" in
    build)
      if [[ \${prev} == "-o" || \${prev} == "--output" ]]; then
        COMPREPLY=( $(compgen -d -- \${cur}) )
      elif [[ \${prev} == "--spec-type" ]]; then
        COMPREPLY=( $(compgen -W "openapi asyncapi jsonschema" -- \${cur}) )
      elif [[ \${cur} == -* ]]; then
        COMPREPLY=( $(compgen -W "-o --output -v --verbose -r --root-key --resolve-refs --preserve-refs --resolve-security --spec-type" -- \${cur}) )
      fi
      ;;
    parse)
      if [[ \${prev} == "-o" || \${prev} == "--output" ]]; then
        COMPREPLY=( $(compgen -d -- \${cur}) )
      elif [[ \${cur} == -* ]]; then
        COMPREPLY=( $(compgen -W "-o --output -p --pretty" -- \${cur}) )
      fi
      ;;
    render)
      if [[ \${prev} == "-o" || \${prev} == "--output" || \${prev} == "-d" || \${prev} == "--data" ]]; then
        COMPREPLY=( $(compgen -f -- \${cur}) )
      elif [[ \${prev} == "--spec-type" ]]; then
        COMPREPLY=( $(compgen -W "openapi asyncapi jsonschema" -- \${cur}) )
      elif [[ \${cur} == -* ]]; then
        COMPREPLY=( $(compgen -W "-d --data -o --output -r --root-key --resolve-refs --preserve-refs --resolve-security --spec-type" -- \${cur}) )
      fi
      ;;
    completion)
      if [[ \${prev} == "-s" || \${prev} == "--shell" ]]; then
        COMPREPLY=( $(compgen -W "bash zsh fish powershell" -- \${cur}) )
      elif [[ \${cur} == -* ]]; then
        COMPREPLY=( $(compgen -W "-s --shell" -- \${cur}) )
      fi
      ;;
    helpers)
      if [[ \${prev} == "-f" || \${prev} == "--format" ]]; then
        COMPREPLY=( $(compgen -W "table json markdown" -- \${cur}) )
      elif [[ \${cur} == -* ]]; then
        COMPREPLY=( $(compgen -W "-f --format" -- \${cur}) )
      fi
      ;;
  esac
  
  return 0
}

complete -F _deepdown_completion deepdown
`;
    } else if (shell === 'zsh') {
      script = `#compdef deepdown
# Zsh completion script for deepdown CLI

_deepdown() {
  local -a commands options
  
  commands=(
    'build:Parse spec files and render templates in a single step'
    'parse:Parse YAML/JSON spec files'
    'render:Render markdown from templates and data'
    'completion:Generate shell completion script'
    'helpers:List all available Handlebars helpers'
  )
  
  if (( CURRENT == 2 )); then
    _describe -t commands 'deepdown commands' commands
    return
  fi
  
  case "$words[2]" in
    build)
      options=(
        '-o:Output directory:_files -/'
        '--output:Output directory:_files -/'
        '-v[Show detailed output]'
        '--verbose[Show detailed output]'
        '-r:Root key name for the spec data in templates:'
        '--root-key:Root key name for the spec data in templates:'
        '--resolve-refs[Resolve JSON Schema $ref pointers before rendering]'
        '--preserve-refs[When resolving refs, preserve internal references]'
        '--resolve-security[Resolve security schemes for OpenAPI/AsyncAPI specs]'
        '--spec-type:Force specification type:(openapi asyncapi jsonschema)'
      )
      _arguments -s $options
      ;;
    parse)
      options=(
        '-o:Output directory:_files -/'
        '--output:Output directory:_files -/'
        '-p[Pretty print JSON output]'
        '--pretty[Pretty print JSON output]'
      )
      _arguments -s $options
      ;;
    render)
      options=(
        '-d:JSON data file to use:_files'
        '--data:JSON data file to use:_files'
        '-o:Output directory:_files -/'
        '--output:Output directory:_files -/'
        '-r:Root key name for the spec data in templates:'
        '--root-key:Root key name for the spec data in templates:'
        '--resolve-refs[Resolve JSON Schema $ref pointers before rendering]'
        '--preserve-refs[When resolving refs, preserve internal references]'
        '--resolve-security[Resolve security schemes for OpenAPI/AsyncAPI specs]'
        '--spec-type:Force specification type:(openapi asyncapi jsonschema)'
      )
      _arguments -s $options
      ;;
    completion)
      options=(
        '-s:Shell type:(bash zsh fish powershell)'
        '--shell:Shell type:(bash zsh fish powershell)'
      )
      _arguments -s $options
      ;;
    helpers)
      options=(
        '-f:Output format:(table json markdown)'
        '--format:Output format:(table json markdown)'
      )
      _arguments -s $options
      ;;
  esac
}

compdef _deepdown deepdown
`;
    } else if (shell === 'fish') {
      script = `
# Fish completion script for deepdown CLI
function __fish_deepdown_no_subcommand
    not __fish_seen_subcommand_from build parse render completion helpers
end

# Main commands
complete -c deepdown -f -n '__fish_deepdown_no_subcommand' -a build -d 'Parse spec files and render templates in a single step'
complete -c deepdown -f -n '__fish_deepdown_no_subcommand' -a parse -d 'Parse YAML/JSON spec files'
complete -c deepdown -f -n '__fish_deepdown_no_subcommand' -a render -d 'Render markdown from templates and data'
complete -c deepdown -f -n '__fish_deepdown_no_subcommand' -a completion -d 'Generate shell completion script'
complete -c deepdown -f -n '__fish_deepdown_no_subcommand' -a helpers -d 'List all available Handlebars helpers'

# build command options
complete -c deepdown -f -n '__fish_seen_subcommand_from build' -s o -l output -d 'Output directory for rendered markdown' -a '(__fish_complete_directories)'
complete -c deepdown -f -n '__fish_seen_subcommand_from build' -s v -l verbose -d 'Show detailed output'
complete -c deepdown -f -n '__fish_seen_subcommand_from build' -s r -l root-key -d 'Root key name for the spec data in templates'
complete -c deepdown -f -n '__fish_seen_subcommand_from build' -l resolve-refs -d 'Resolve JSON Schema $ref pointers before rendering'
complete -c deepdown -f -n '__fish_seen_subcommand_from build' -l preserve-refs -d 'When resolving refs, preserve internal references'
complete -c deepdown -f -n '__fish_seen_subcommand_from build' -l resolve-security -d 'Resolve security schemes for OpenAPI/AsyncAPI specs'
complete -c deepdown -f -n '__fish_seen_subcommand_from build' -l spec-type -d 'Force specification type' -a 'openapi asyncapi jsonschema'

# parse command options
complete -c deepdown -f -n '__fish_seen_subcommand_from parse' -s o -l output -d 'Output directory for parsed JSON' -a '(__fish_complete_directories)'
complete -c deepdown -f -n '__fish_seen_subcommand_from parse' -s p -l pretty -d 'Pretty print JSON output'

# render command options
complete -c deepdown -f -n '__fish_seen_subcommand_from render' -s d -l data -d 'JSON data file to use' -a '(__fish_complete_path)'
complete -c deepdown -f -n '__fish_seen_subcommand_from render' -s o -l output -d 'Output directory for rendered markdown' -a '(__fish_complete_directories)'
complete -c deepdown -f -n '__fish_seen_subcommand_from render' -s r -l root-key -d 'Root key name for the spec data in templates'
complete -c deepdown -f -n '__fish_seen_subcommand_from render' -l resolve-refs -d 'Resolve JSON Schema $ref pointers before rendering'
complete -c deepdown -f -n '__fish_seen_subcommand_from render' -l preserve-refs -d 'When resolving refs, preserve internal references'
complete -c deepdown -f -n '__fish_seen_subcommand_from render' -l resolve-security -d 'Resolve security schemes for OpenAPI/AsyncAPI specs'
complete -c deepdown -f -n '__fish_seen_subcommand_from render' -l spec-type -d 'Force specification type' -a 'openapi asyncapi jsonschema'

# completion command options
complete -c deepdown -f -n '__fish_seen_subcommand_from completion' -s s -l shell -d 'Shell type' -a 'bash zsh fish powershell'

# helpers command options
complete -c deepdown -f -n '__fish_seen_subcommand_from helpers' -s f -l format -d 'Output format' -a 'table json markdown'
`;
    } else if (shell === 'powershell') {
      script = `
# PowerShell completion script for deepdown CLI
Register-ArgumentCompleter -Native -CommandName deepdown -ScriptBlock {
    param($wordToComplete, $commandAst, $cursorPosition)
    
    $commands = @('build', 'parse', 'render', 'completion', 'helpers')
    $commandArgs = @{
        'build' = @{
            '-o' = $null
            '--output' = $null
            '-v' = $null
            '--verbose' = $null
            '-r' = $null
            '--root-key' = $null
            '--resolve-refs' = $null
            '--preserve-refs' = $null
            '--resolve-security' = $null
            '--spec-type' = @('openapi', 'asyncapi', 'jsonschema')
        }
        'parse' = @{
            '-o' = $null
            '--output' = $null
            '-p' = $null
            '--pretty' = $null
        }
        'render' = @{
            '-d' = $null
            '--data' = $null
            '-o' = $null
            '--output' = $null
            '-r' = $null
            '--root-key' = $null
            '--resolve-refs' = $null
            '--preserve-refs' = $null
            '--resolve-security' = $null
            '--spec-type' = @('openapi', 'asyncapi', 'jsonschema')
        }
        'completion' = @{
            '-s' = @('bash', 'zsh', 'fish', 'powershell')
            '--shell' = @('bash', 'zsh', 'fish', 'powershell')
        }
        'helpers' = @{
            '-f' = @('table', 'json', 'markdown')
            '--format' = @('table', 'json', 'markdown')
        }
    }
    
    $command = $commandAst.CommandElements | Select-Object -Skip 1 -First 1 -ErrorAction SilentlyContinue
    if ($command -and $command.Value -in $commands) {
        $params = $commandArgs[$command.Value]
        $leftovers = $commandAst.CommandElements | Select-Object -Skip 2
        
        $lastParam = $leftovers | Select-Object -Last 1 -ErrorAction SilentlyContinue
        
        if ($lastParam -and $params.ContainsKey($lastParam.Value)) {
            $values = $params[$lastParam.Value]
            if ($values) {
                return $values | Where-Object { $_ -like "$wordToComplete*" } | 
                    ForEach-Object { [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterValue', $_) }
            }
            return
        }
        
        return $params.Keys | Where-Object { $_ -like "$wordToComplete*" } | 
            ForEach-Object { [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_) }
    }
    else {
        return $commands | Where-Object { $_ -like "$wordToComplete*" } | 
            ForEach-Object { [System.Management.Automation.CompletionResult]::new($_, $_, 'Command', $_) }
    }
}
`;
    } else {
      console.error(`Unsupported shell type: ${shell}. Supported shells are: bash, zsh, fish, powershell`);
      process.exit(1);
    }
    
    console.log(`# deepdown CLI completion script for ${shell}`);
    console.log(script);
    console.log(`
# Installation instructions:
#
# For bash:
#   deepdown completion > ~/.deepdown-completion.bash
#   echo 'source ~/.deepdown-completion.bash' >> ~/.bashrc
#
# For zsh:
#   deepdown completion --shell zsh > ~/.deepdown-completion.zsh
#   echo 'source ~/.deepdown-completion.zsh' >> ~/.zshrc
#
# For fish:
#   deepdown completion --shell fish > ~/.config/fish/completions/deepdown.fish
#
# For PowerShell:
#   deepdown completion --shell powershell > ~/.deepdown-completion.ps1
#   echo '. ~/.deepdown-completion.ps1' >> $PROFILE
`);
  });

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

program
  .command('helpers')
  .description('List all available Handlebars helpers with descriptions and usage examples')
  .option('-f, --format <type>', 'Output format: table, json, or markdown', 'table')
  .action((options) => {
    const helpers = [
      {
        name: 'json',
        description: 'Convert a JavaScript object to JSON string with pretty formatting',
        usage: '{{json data}}'
      },
      {
        name: 'includes',
        description: 'Check if an array includes a specific value',
        usage: '{{#if (includes array "value")}}...{{/if}}'
      },
      {
        name: 'ne',
        description: 'Check if two values are not equal',
        usage: '{{#if (ne a b)}}...{{/if}}'
      },
      {
        name: 'eq',
        description: 'Check if two values are equal',
        usage: '{{#if (eq a b)}}...{{/if}}'
      },
      {
        name: 'gt',
        description: 'Check if first value is greater than second',
        usage: '{{#if (gt a b)}}...{{/if}}'
      },
      {
        name: 'lt',
        description: 'Check if first value is less than second',
        usage: '{{#if (lt a b)}}...{{/if}}'
      },
      {
        name: 'lookup',
        description: 'Dynamically look up a property in an object',
        usage: '{{lookup object "propertyName"}}'
      },
      {
        name: 'uppercase',
        description: 'Convert a string to uppercase',
        usage: '{{uppercase "text"}}'
      },
      {
        name: 'lowercase',
        description: 'Convert a string to lowercase',
        usage: '{{lowercase "TEXT"}}'
      },
      {
        name: 'capitalize',
        description: 'Capitalize the first letter of a string',
        usage: '{{capitalize "text"}}'
      },
      {
        name: 'basename',
        description: 'Extract the last segment from a schema reference path',
        usage: '{{basename "#/components/schemas/Pet"}}'
      },
      {
        name: 'flattenProperties',
        description: 'Recursively flatten JSON Schema properties into a flat list with dot notation paths',
        usage: '{{#each (flattenProperties schema)}}{{path}} - {{type}}{{/each}}'
      },
      {
        name: 'generateExample',
        description: 'Generate realistic example JSON from a JSON Schema',
        usage: '{{generateExample schema}} or {{generateExample schema requiredOnly=true}}'
      },
      {
        name: 'buildPropertyPath',
        description: 'Build dot notation and array notation paths safely for nested properties',
        usage: '{{buildPropertyPath "metadata" "request_id" false}}'
      },
      {
        name: 'getPropertyType',
        description: 'Get a human-readable type description for a schema property',
        usage: '{{getPropertyType property}}'
      },
      {
        name: 'isRequired',
        description: 'Check if a property is required in a schema',
        usage: '{{#if (isRequired "propertyName" schema.required)}}Required{{/if}}'
      },
      {
        name: 'flattenPropertiesTable',
        description: 'Generate a complete flattened properties table in markdown format',
        usage: '| Property | Type | Required | Description |\\n|----------|------|----------|-------------|\\n{{flattenPropertiesTable schema}}'
      }
    ];

    if (options.format === 'json') {
      console.log(JSON.stringify(helpers, null, 2));
    } else if (options.format === 'markdown') {
      console.log('# Deepdown Handlebars Helpers\n');
      console.log('The following helpers are available in your Deepdown templates:\n');
      
      helpers.forEach(helper => {
        console.log(`## \`${helper.name}\`\n`);
        console.log(`${helper.description}\n`);
        console.log('**Usage:**');
        console.log('```handlebars');
        console.log(helper.usage);
        console.log('```\n');
      });
    } else {
      // Default table format
      console.log('\x1b[32m%s\x1b[0m', '📚 Available Handlebars Helpers');
      console.log('\x1b[36m%s\x1b[0m', 'Use these helpers in your .deepdown templates:\n');
      
      const maxNameLength = Math.max(...helpers.map(h => h.name.length));
      const maxUsageLength = Math.max(...helpers.map(h => h.usage.length));
      
      console.log(`${'Helper'.padEnd(maxNameLength)} | ${'Usage'.padEnd(maxUsageLength)} | Description`);
      console.log(`${'-'.repeat(maxNameLength)}-|-${'-'.repeat(maxUsageLength)}-|-${'-'.repeat(30)}`);
      
      helpers.forEach(helper => {
        console.log(`${helper.name.padEnd(maxNameLength)} | ${helper.usage.padEnd(maxUsageLength)} | ${helper.description}`);
      });
      
      console.log('\n\x1b[33m%s\x1b[0m', 'Tip: Use --format markdown to get detailed documentation, or --format json for machine-readable output.');
    }
  });

program.parse();