import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './app-config-get-valid';
import * as fs from 'fs';
import * as path from 'path';
import { tmpdir } from 'os';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
  },
});

describe('app-config-get-valid', () => {
  let tempDir: string;
  let configPath: string;
  let originalCwd: string;

  beforeEach(() => {
    // Save original working directory
    originalCwd = process.cwd();

    // Create temporary directory structure for testing with unique name to avoid conflicts
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    tempDir = path.join(tmpdir(), `hosanna-test-${uniqueId}`);

    // Ensure parent directory exists
    try {
      fs.mkdirSync(tempDir, { recursive: true });
    } catch (e) {
      // If directory already exists, use it
    }

    const assetsMetaDir = path.join(tempDir, 'assets', 'meta');
    try {
      fs.mkdirSync(assetsMetaDir, { recursive: true });
    } catch (e) {
      // Directory might already exist
    }

    configPath = path.join(assetsMetaDir, 'app.config.json');

    // Create a valid app.config.json for testing
    const config = {
      rows: {},
      translations: { en: {} },
      cells: {},
      theme: {
        colors: {
          primary: '#FF0000',
          secondary: '#00FF00',
        },
        fonts: {
          main: 'Arial',
          heading: 'Helvetica',
        },
      },
      controls: {},
      styles: {
        default: {
          color: '#000000',
        },
        primary: {
          color: '#FF0000',
        },
      },
    };

    try {
      fs.writeFileSync(configPath, JSON.stringify(config));
    } catch (e) {
      // If write fails, ensure directory exists and try again
      fs.mkdirSync(assetsMetaDir, { recursive: true });
      fs.writeFileSync(configPath, JSON.stringify(config));
    }

    // Change to temp directory so context.getCwd() returns it
    try {
      process.chdir(tempDir);
    } catch (e) {
      // If chdir fails, the test will still work if the path is absolute
    }
  });

  afterEach(() => {
    // Restore original working directory
    try {
      process.chdir(originalCwd);
    } catch (e) {
      // Ignore errors if directory was already cleaned up
    }

    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  });

  describe('valid cases', () => {
    it('should pass valid appConfig.get() call', () => {
      ruleTester.run('app-config-get-valid', rule, {
        valid: [
          {
            code: `const color = appConfig.get("theme.colors.primary");`,
            filename: 'test.ts',
          },
        ],
        invalid: [],
      });
    });

    it('should pass valid appConfig.get<Type>() call', () => {
      ruleTester.run('app-config-get-valid', rule, {
        valid: [
          {
            code: `const color = appConfig.get<string>("theme.colors.primary");`,
            filename: 'test.ts',
          },
        ],
        invalid: [],
      });
    });

    it('should pass valid obj.appConfig.get() call', () => {
      ruleTester.run('app-config-get-valid', rule, {
        valid: [
          {
            code: `const color = someObj.appConfig.get("theme.colors.primary");`,
            filename: 'test.ts',
          },
        ],
        invalid: [],
      });
    });

    it('should pass valid appConfig.get() with template literal (simple)', () => {
      ruleTester.run('app-config-get-valid', rule, {
        valid: [
          {
            code: 'const color = appConfig.get(`theme.colors.primary`);',
            filename: 'test.ts',
          },
        ],
        invalid: [],
      });
    });

    it('should skip non-string literal arguments', () => {
      ruleTester.run('app-config-get-valid', rule, {
        valid: [
          {
            code: `const color = appConfig.get(someVariable);`,
            filename: 'test.ts',
          },
          {
            code: `const color = appConfig.get(getKey());`,
            filename: 'test.ts',
          },
        ],
        invalid: [],
      });
    });

    it('should skip template literals with expressions', () => {
      ruleTester.run('app-config-get-valid', rule, {
        valid: [
          {
            code: 'const color = appConfig.get(`theme.colors.${key}`);',
            filename: 'test.ts',
          },
        ],
        invalid: [],
      });
    });
  });

  describe('invalid cases', () => {
    it('should fail invalid appConfig.get() call', () => {
      ruleTester.run('app-config-get-valid', rule, {
        valid: [],
        invalid: [
          {
            code: `const color = appConfig.get("invalid.path");`,
            filename: 'test.ts',
            errors: [
              {
                messageId: 'invalidAppConfigKey',
                data: { path: 'invalid.path' },
              },
            ],
          },
        ],
      });
    });

    it('should fail invalid appConfig.get<Type>() call', () => {
      ruleTester.run('app-config-get-valid', rule, {
        valid: [],
        invalid: [
          {
            code: `const color = appConfig.get<string>("theme.colors.invalid");`,
            filename: 'test.ts',
            errors: [
              {
                messageId: 'invalidAppConfigKey',
                data: { path: 'theme.colors.invalid' },
              },
            ],
          },
        ],
      });
    });

    it('should fail invalid obj.appConfig.get() call', () => {
      ruleTester.run('app-config-get-valid', rule, {
        valid: [],
        invalid: [
          {
            code: `const color = someObj.appConfig.get("invalid.path");`,
            filename: 'test.ts',
            errors: [
              {
                messageId: 'invalidAppConfigKey',
                data: { path: 'invalid.path' },
              },
            ],
          },
        ],
      });
    });

    it('should fail invalid appConfig.get() with template literal', () => {
      ruleTester.run('app-config-get-valid', rule, {
        valid: [],
        invalid: [
          {
            code: 'const color = appConfig.get(`invalid.path`);',
            filename: 'test.ts',
            errors: [
              {
                messageId: 'invalidAppConfigKey',
                data: { path: 'invalid.path' },
              },
            ],
          },
        ],
      });
    });
  });

  describe('edge cases', () => {
    it('should skip validation when app.config.json does not exist', () => {
      // Remove the config file if it exists
      try {
        if (fs.existsSync(configPath)) {
          fs.unlinkSync(configPath);
        }
      } catch (e) {
        // Ignore errors
      }

      ruleTester.run('app-config-get-valid', rule, {
        valid: [
          {
            code: `const color = appConfig.get("any.path");`,
            filename: 'test.ts',
          },
        ],
        invalid: [],
      });
    });

    it('should skip non-appConfig.get() calls', () => {
      ruleTester.run('app-config-get-valid', rule, {
        valid: [
          {
            code: `const color = otherConfig.get("invalid.path");`,
            filename: 'test.ts',
          },
          {
            code: `const color = appConfig.otherMethod("invalid.path");`,
            filename: 'test.ts',
          },
        ],
        invalid: [],
      });
    });

    it('should skip appConfig.get() calls without arguments', () => {
      ruleTester.run('app-config-get-valid', rule, {
        valid: [
          {
            code: `const color = appConfig.get();`,
            filename: 'test.ts',
          },
        ],
        invalid: [],
      });
    });
  });
});

