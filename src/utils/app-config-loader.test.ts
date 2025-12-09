import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { tmpdir } from 'os';
import { getAppConfig, getJsonValueByPath, jsonPathExists } from './app-config-loader';
import { Rule } from 'eslint';

// Mock ESLint RuleContext
class MockContext implements Rule.RuleContext {
  private cwd: string;
  filename: string = '';
  sourceCode: any;
  settings: any = {};
  parserOptions: any = {};
  parserPath: string | null = null;
  options: any[] = [];
  getCwd(): string {
    return this.cwd;
  }
  getFilename(): string {
    return this.filename;
  }
  getScope(): any {
    return null;
  }
  getSourceCode(): any {
    return this.sourceCode;
  }
  getDeclaredVariables(node: Rule.Node): any[] {
    return [];
  }
  markVariableAsUsed(name: string): boolean {
    return false;
  }
  report(descriptor: Rule.ReportDescriptor): void {
    // Mock implementation
  }

  constructor(cwd: string) {
    this.cwd = cwd;
    this.sourceCode = {
      text: '',
      lines: [],
    };
  }
}

describe('app-config-loader', () => {
  let tempDir: string;
  let configPath: string;
  let context: MockContext;

  beforeEach(() => {
    tempDir = path.join(tmpdir(), `hosanna-test-${Date.now()}`);
    const assetsMetaDir = path.join(tempDir, 'assets', 'meta');
    fs.mkdirSync(assetsMetaDir, { recursive: true });
    configPath = path.join(assetsMetaDir, 'app.config.json');
    context = new MockContext(tempDir);
  });

  afterEach(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('getAppConfig', () => {
    it('should load and parse app.config.json from assets/meta/app.config.json', () => {
      const config = {
        rows: {},
        translations: { en: {} },
        cells: {},
        theme: { colors: {}, fonts: {} },
        controls: {},
      };
      fs.writeFileSync(configPath, JSON.stringify(config));

      const result = getAppConfig(context);
      expect(result).toEqual(config);
    });

    it('should return null if file does not exist', () => {
      const result = getAppConfig(context);
      expect(result).toBeNull();
    });

    it('should return null if file contains invalid JSON', () => {
      fs.writeFileSync(configPath, '{ invalid json }');
      const result = getAppConfig(context);
      expect(result).toBeNull();
    });

    it('should cache the config per context', () => {
      const config = {
        rows: {},
        translations: { en: {} },
        cells: {},
        theme: { colors: {}, fonts: {} },
        controls: {},
      };
      fs.writeFileSync(configPath, JSON.stringify(config));

      const result1 = getAppConfig(context);
      const result2 = getAppConfig(context);

      expect(result1).toBe(result2); // Same reference due to caching
      expect(result1).toEqual(config);
    });

    it('should handle different contexts independently', () => {
      const config1 = { rows: {}, translations: { en: {} }, cells: {}, theme: { colors: {}, fonts: {} }, controls: {} };
      const config2 = { rows: {}, translations: { en: {} }, cells: {}, theme: { colors: {}, fonts: {} }, controls: {}, extra: true };

      fs.writeFileSync(configPath, JSON.stringify(config1));
      const result1 = getAppConfig(context);

      const context2 = new MockContext(tempDir);
      fs.writeFileSync(configPath, JSON.stringify(config2));
      const result2 = getAppConfig(context2);

      expect(result1).not.toEqual(result2);
    });
  });

  describe('getJsonValueByPath', () => {
    const config = {
      theme: {
        colors: {
          primary: '#FF0000',
          secondary: '#00FF00',
        },
        fonts: {
          main: 'Arial',
        },
      },
      cells: {
        regular: {
          style: 'default',
        },
      },
    };

    it('should return value for valid path', () => {
      expect(getJsonValueByPath(config, 'theme.colors.primary')).toBe('#FF0000');
      expect(getJsonValueByPath(config, 'cells.regular.style')).toBe('default');
    });

    it('should return undefined for invalid path', () => {
      expect(getJsonValueByPath(config, 'theme.colors.invalid')).toBeUndefined();
      expect(getJsonValueByPath(config, 'invalid.path')).toBeUndefined();
    });

    it('should return undefined for null config', () => {
      expect(getJsonValueByPath(null, 'theme.colors.primary')).toBeUndefined();
    });

    it('should return undefined for undefined config', () => {
      expect(getJsonValueByPath(undefined, 'theme.colors.primary')).toBeUndefined();
    });

    it('should handle empty path', () => {
      expect(getJsonValueByPath(config, '')).toBe(config);
    });

    it('should handle nested paths', () => {
      expect(getJsonValueByPath(config, 'theme')).toEqual({
        colors: {
          primary: '#FF0000',
          secondary: '#00FF00',
        },
        fonts: {
          main: 'Arial',
        },
      });
    });
  });

  describe('jsonPathExists', () => {
    const config = {
      theme: {
        colors: {
          primary: '#FF0000',
        },
      },
    };

    it('should return true for existing path', () => {
      expect(jsonPathExists(config, 'theme.colors.primary')).toBe(true);
      expect(jsonPathExists(config, 'theme')).toBe(true);
    });

    it('should return false for non-existing path', () => {
      expect(jsonPathExists(config, 'theme.colors.invalid')).toBe(false);
      expect(jsonPathExists(config, 'invalid.path')).toBe(false);
    });

    it('should return false for null config', () => {
      expect(jsonPathExists(null, 'theme.colors.primary')).toBe(false);
    });

    it('should return false for undefined config', () => {
      expect(jsonPathExists(undefined, 'theme.colors.primary')).toBe(false);
    });
  });
});

