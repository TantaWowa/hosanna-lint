import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './app-config-style-key-valid';
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

describe('app-config-style-key-valid', () => {
  let tempDir: string;
  let configPath: string;
  let originalCwd: string;

  beforeEach(() => {
    // Save original working directory
    originalCwd = process.cwd();

    // Create temporary directory structure for testing
    tempDir = path.join(tmpdir(), `hosanna-test-${Date.now()}`);
    const assetsMetaDir = path.join(tempDir, 'assets', 'meta');
    fs.mkdirSync(assetsMetaDir, { recursive: true });
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
    fs.writeFileSync(configPath, JSON.stringify(config));

    // Change to temp directory so context.getCwd() returns it
    process.chdir(tempDir);
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
    it('should pass valid styleKey in object literal', () => {
      ruleTester.run('app-config-style-key-valid', rule, {
        valid: [
          {
            code: `const obj = { styleKey: "theme.colors.primary" };`,
            filename: 'test.ts',
          },
        ],
        invalid: [],
      });
    });

    it('should pass valid fontKey in object literal', () => {
      ruleTester.run('app-config-style-key-valid', rule, {
        valid: [
          {
            code: `const obj = { fontKey: "theme.fonts.main" };`,
            filename: 'test.ts',
            options: [],
          },
        ],
        invalid: [],
      });
    });

    it('should pass fontKey with direct system font specification', () => {
      ruleTester.run('app-config-style-key-valid', rule, {
        valid: [
          {
            code: `const obj = { fontKey: "LargeBold,24" };`,
            filename: 'test.ts',
            options: [],
          },
          {
            code: `const obj = { fontKey: "Small,16" };`,
            filename: 'test.ts',
            options: [],
          },
          {
            code: `const obj = { fontKey: "MediumBold,20" };`,
            filename: 'test.ts',
            options: [],
          },
        ],
        invalid: [],
      });
    });

    it('should pass fontKey with direct font file path', () => {
      ruleTester.run('app-config-style-key-valid', rule, {
        valid: [
          {
            code: `const obj = { fontKey: "pkg:/assets/fonts/Montserrat-Black.ttf,34" };`,
            filename: 'test.ts',
            options: [],
          },
          {
            code: `const obj = { fontKey: "pkg:/assets/fonts/font.ttf,30" };`,
            filename: 'test.ts',
            options: [],
          },
        ],
        invalid: [],
      });
    });

    it('should pass valid fontStyleKey in object literal', () => {
      ruleTester.run('app-config-style-key-valid', rule, {
        valid: [
          {
            code: `const obj = { fontStyleKey: "theme.fonts.main" };`,
            filename: 'test.ts',
            options: [],
          },
        ],
        invalid: [],
      });
    });

    it('should pass valid settingsKey in object literal', () => {
      ruleTester.run('app-config-style-key-valid', rule, {
        valid: [
          {
            code: `const obj = { settingsKey: "styles.default" };`,
            filename: 'test.ts',
            options: [],
          },
        ],
        invalid: [],
      });
    });

    it('should pass valid cellSettingsKey in object literal', () => {
      ruleTester.run('app-config-style-key-valid', rule, {
        valid: [
          {
            code: `const obj = { cellSettingsKey: "styles.primary" };`,
            filename: 'test.ts',
            options: [],
          },
        ],
        invalid: [],
      });
    });

    it('should pass valid loadingCellStyleKey in object literal', () => {
      ruleTester.run('app-config-style-key-valid', rule, {
        valid: [
          {
            code: `const obj = { loadingCellStyleKey: "styles.default" };`,
            filename: 'test.ts',
            options: [],
          },
        ],
        invalid: [],
      });
    });

    it('should pass valid styleKey in assignment expression', () => {
      ruleTester.run('app-config-style-key-valid', rule, {
        valid: [
          {
            code: `obj.styleKey = "theme.colors.primary";`,
            filename: 'test.ts',
            options: [],
          },
        ],
        invalid: [],
      });
    });

    it('should pass fontKey with direct font specification in assignment', () => {
      ruleTester.run('app-config-style-key-valid', rule, {
        valid: [
          {
            code: `obj.fontKey = "LargeBold,24";`,
            filename: 'test.ts',
            options: [],
          },
          {
            code: `obj.fontKey = "pkg:/assets/fonts/font.ttf,30";`,
            filename: 'test.ts',
            options: [],
          },
        ],
        invalid: [],
      });
    });

    it('should pass valid styleKey with ternary operator', () => {
      ruleTester.run('app-config-style-key-valid', rule, {
        valid: [
          {
            code: `obj.styleKey = condition ? "theme.colors.primary" : "theme.colors.secondary";`,
            filename: 'test.ts',
            options: [],
          },
        ],
        invalid: [],
      });
    });

    it('should pass valid styleKey with null coalescing operator', () => {
      ruleTester.run('app-config-style-key-valid', rule, {
        valid: [
          {
            code: `obj.styleKey = value ?? "theme.colors.primary";`,
            filename: 'test.ts',
            options: [],
          },
        ],
        invalid: [],
      });
    });

    it('should pass valid styleKey with logical OR operator', () => {
      ruleTester.run('app-config-style-key-valid', rule, {
        valid: [
          {
            code: `obj.styleKey = value || "theme.colors.primary";`,
            filename: 'test.ts',
            options: [],
          },
        ],
        invalid: [],
      });
    });
  });

  describe('warnings for keys ending in Key with ~ prefix', () => {
    it('should warn for styleKey with ~ prefix outside app.config.json', () => {
      ruleTester.run('app-config-style-key-valid', rule, {
        valid: [],
        invalid: [
          {
            code: `const obj = { styleKey: "~theme.styles.heading" };`,
            filename: 'test.ts',
            options: [],
            errors: [
              {
                messageId: 'keyWithTildeWarning',
                data: { property: 'styleKey' },
              },
            ],
          },
        ],
      });
    });

    it('should warn for titleFontKey with ~ prefix outside app.config.json', () => {
      ruleTester.run('app-config-style-key-valid', rule, {
        valid: [],
        invalid: [
          {
            code: `const obj = { titleFontKey: "~theme.fonts.text-regular-32" };`,
            filename: 'test.ts',
            options: [],
            errors: [
              {
                messageId: 'keyWithTildeWarning',
                data: { property: 'titleFontKey' },
              },
            ],
          },
        ],
      });
    });

    it('should not warn for fontKey with ~ prefix', () => {
      ruleTester.run('app-config-style-key-valid', rule, {
        valid: [
          {
            code: `const obj = { fontKey: "~theme.fonts.heading" };`,
            filename: 'test.ts',
            options: [],
          },
        ],
        invalid: [],
      });
    });
  });

  describe('invalid cases', () => {
    it('should fail invalid styleKey in object literal', () => {
      ruleTester.run('app-config-style-key-valid', rule, {
        valid: [],
        invalid: [
          {
            code: `const obj = { styleKey: "invalid.path" };`,
            filename: 'test.ts',
            options: [],
            errors: [
              {
                messageId: 'invalidStyleKey',
                data: { path: 'invalid.path' },
              },
            ],
          },
        ],
      });
    });

    it('should fail invalid fontKey in object literal', () => {
      ruleTester.run('app-config-style-key-valid', rule, {
        valid: [],
        invalid: [
          {
            code: `const obj = { fontKey: "theme.fonts.invalid" };`,
            filename: 'test.ts',
            options: [],
            errors: [
              {
                messageId: 'invalidStyleKey',
                data: { path: 'theme.fonts.invalid' },
              },
            ],
          },
        ],
      });
    });

    it('should fail invalid fontKey path (not a direct font specification)', () => {
      ruleTester.run('app-config-style-key-valid', rule, {
        valid: [],
        invalid: [
          {
            code: `const obj = { fontKey: "invalid.path" };`,
            filename: 'test.ts',
            options: [],
            errors: [
              {
                messageId: 'invalidStyleKey',
                data: { path: 'invalid.path' },
              },
            ],
          },
        ],
      });
    });

    it('should fail invalid system font name in fontKey', () => {
      ruleTester.run('app-config-style-key-valid', rule, {
        valid: [],
        invalid: [
          {
            code: `const obj = { fontKey: "LargeBsdf,32" };`,
            filename: 'test.ts',
            options: [],
            errors: [
              {
                messageId: 'invalidFontKeyFormat',
              },
            ],
          },
          {
            code: `const obj = { fontKey: "InvalidFont,20" };`,
            filename: 'test.ts',
            options: [],
            errors: [
              {
                messageId: 'invalidFontKeyFormat',
              },
            ],
          },
          {
            code: `const obj = { fontKey: "SmallRegular,16" };`,
            filename: 'test.ts',
            options: [],
            errors: [
              {
                messageId: 'invalidFontKeyFormat',
              },
            ],
          },
        ],
      });
    });

    it('should fail invalid font file path in fontKey', () => {
      ruleTester.run('app-config-style-key-valid', rule, {
        valid: [],
        invalid: [
          {
            code: `const obj = { fontKey: "pkg:/someFontFile/font.ttf,30" };`,
            filename: 'test.ts',
            options: [],
            errors: [
              {
                messageId: 'invalidFontKeyFormat',
              },
            ],
          },
        ],
      });
    });

    it('should fail invalid font size format in fontKey', () => {
      ruleTester.run('app-config-style-key-valid', rule, {
        valid: [],
        invalid: [
          {
            code: `const obj = { fontKey: "LargeBold,abc" };`,
            filename: 'test.ts',
            options: [],
            errors: [
              {
                messageId: 'invalidFontKeyFormat',
              },
            ],
          },
          {
            code: `const obj = { fontKey: "LargeBold,-10" };`,
            filename: 'test.ts',
            options: [],
            errors: [
              {
                messageId: 'invalidFontKeyFormat',
              },
            ],
          },
        ],
      });
    });

    it('should fail invalid styleKey in assignment expression', () => {
      ruleTester.run('app-config-style-key-valid', rule, {
        valid: [],
        invalid: [
          {
            code: `obj.styleKey = "invalid.path";`,
            filename: 'test.ts',
            options: [],
            errors: [
              {
                messageId: 'invalidStyleKey',
                data: { path: 'invalid.path' },
              },
            ],
          },
        ],
      });
    });

    it('should fail invalid path in ternary operator', () => {
      ruleTester.run('app-config-style-key-valid', rule, {
        valid: [],
        invalid: [
          {
            code: `obj.styleKey = condition ? "theme.colors.primary" : "invalid.path";`,
            filename: 'test.ts',
            options: [],
            errors: [
              {
                messageId: 'invalidStyleKey',
                data: { path: 'invalid.path' },
              },
            ],
          },
        ],
      });
    });

    it('should fail invalid path in null coalescing operator', () => {
      ruleTester.run('app-config-style-key-valid', rule, {
        valid: [],
        invalid: [
          {
            code: `obj.styleKey = value ?? "invalid.path";`,
            filename: 'test.ts',
            options: [],
            errors: [
              {
                messageId: 'invalidStyleKey',
                data: { path: 'invalid.path' },
              },
            ],
          },
        ],
      });
    });

    it('should fail invalid path in logical OR operator', () => {
      ruleTester.run('app-config-style-key-valid', rule, {
        valid: [],
        invalid: [
          {
            code: `obj.styleKey = value || "invalid.path";`,
            filename: 'test.ts',
            options: [],
            errors: [
              {
                messageId: 'invalidStyleKey',
                data: { path: 'invalid.path' },
              },
            ],
          },
        ],
      });
    });

    it('should fail multiple invalid paths in ternary operator', () => {
      ruleTester.run('app-config-style-key-valid', rule, {
        valid: [],
        invalid: [
          {
            code: `obj.styleKey = condition ? "invalid.path1" : "invalid.path2";`,
            filename: 'test.ts',
            options: [],
            errors: [
              {
                messageId: 'invalidStyleKey',
                data: { path: 'invalid.path1' },
              },
              {
                messageId: 'invalidStyleKey',
                data: { path: 'invalid.path2' },
              },
            ],
          },
        ],
      });
    });
  });

  describe('edge cases', () => {
    it('should skip validation when app.config.json does not exist', () => {
      // Remove the config file
      fs.unlinkSync(configPath);

      ruleTester.run('app-config-style-key-valid', rule, {
        valid: [
          {
            code: `const obj = { styleKey: "any.path" };`,
            filename: 'test.ts',
            options: [],
          },
        ],
        invalid: [],
      });
    });

    it('should skip non-style-key properties', () => {
      ruleTester.run('app-config-style-key-valid', rule, {
        valid: [
          {
            code: `const obj = { otherKey: "invalid.path" };`,
            filename: 'test.ts',
            options: [],
          },
        ],
        invalid: [],
      });
    });

    it('should skip non-string literal values', () => {
      ruleTester.run('app-config-style-key-valid', rule, {
        valid: [
          {
            code: `const obj = { styleKey: someVariable };`,
            filename: 'test.ts',
            options: [],
          },
        ],
        invalid: [],
      });
    });
  });
});

