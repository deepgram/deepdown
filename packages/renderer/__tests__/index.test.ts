// packages/renderer/__tests__/index.test.ts
import * as fs from 'fs';
import * as path from 'path';
import { renderTemplate, renderTemplateFile } from '../src';
import { getFixturePath } from './setup';

describe('Renderer', () => {
  describe('renderTemplate', () => {
    it('should render a simple template with provided data', () => {
      const template = '# {{title}}\n\n{{description}}';
      const data = {
        title: 'Test Document',
        description: 'This is a test document'
      };
      
      const result = renderTemplate({ template, data });
      
      // Use snapshot testing
      expect(result).toMatchSnapshot('simple-template');
    });
  });
  
  describe('renderTemplateFile', () => {
    // Create a temp directory for test outputs
    const tempDir = path.join(__dirname, '__temp__');
    
    beforeAll(() => {
      // Set up temp directory
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
    });
    
    afterAll(() => {
      // Clean up temp directory after tests
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });
    
    it('should render a template file with schema data', () => {
      // Use fixture paths
      const templatePath = getFixturePath.template('simple.deepdown');
      const dataPath = getFixturePath.data('sample.json');
      
      // Load data from fixture
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      
      const outputPath = path.join(tempDir, 'output.md');
      
      // Render the template
      const result = renderTemplateFile({
        templatePath,
        data,
        outputPath
      });
      
      // Snapshot testing
      expect(result).toMatchSnapshot('template-file-output');
      
      // Also verify file was written
      expect(fs.existsSync(outputPath)).toBe(true);
    });
  });
});