import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Parses a YAML file and returns it as a JavaScript object
 * @param filePath Path to the YAML file
 * @returns Parsed JavaScript object
 */
export function parseYamlFile(filePath: string): any {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return parseYamlString(fileContent);
  } catch (error) {
    throw new Error(`Failed to parse YAML file ${filePath}: ${error}`);
  }
}

/**
 * Parses a YAML string and returns it as a JavaScript object
 * @param yamlString YAML content as a string
 * @returns Parsed JavaScript object
 */
export function parseYamlString(yamlString: string): any {
  try {
    return yaml.load(yamlString);
  } catch (error) {
    throw new Error(`Failed to parse YAML string: ${error}`);
  }
}

/**
 * Parses multiple YAML files and returns them as an array of objects
 * @param globPattern Glob pattern to match files
 * @returns Array of parsed objects with their file paths
 */
export function parseMultipleFiles(filePaths: string[]): Array<{ path: string; content: any }> {
  return filePaths.map(filePath => ({
    path: filePath,
    content: parseYamlFile(filePath)
  }));
}

/**
 * Converts a JavaScript object to JSON string
 * @param data Object to convert
 * @param pretty Whether to pretty-print the JSON
 * @returns JSON string
 */
export function toJson(data: any, pretty = false): string {
  return pretty 
    ? JSON.stringify(data, null, 2) 
    : JSON.stringify(data);
}

export default {
  parseYamlFile,
  parseYamlString,
  parseMultipleFiles,
  toJson
}; 