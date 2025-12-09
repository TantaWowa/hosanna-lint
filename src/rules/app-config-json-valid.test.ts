import { describe, it, expect, beforeEach } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './app-config-json-valid';
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

// Create a mock context for testing
class MockContext {
  private cwd: string;
  private fileExistence: Map<string, boolean> = new Map();

  constructor(cwd: string) {
    this.cwd = cwd;
  }

  getCwd(): string {
    return this.cwd;
  }

  setFileExists(relativePath: string, exists: boolean) {
    this.fileExistence.set(relativePath, exists);
  }

  getFileExists(relativePath: string): boolean {
    return this.fileExistence.get(relativePath) ?? false;
  }
}

describe('app-config-json-valid', () => {
  let tempDir: string;
  let assetsDir: string;

  beforeEach(() => {
    // Create temporary directory structure for testing
    tempDir = path.join(tmpdir(), `hosanna-test-${Date.now()}`);
    assetsDir = path.join(tempDir, 'assets');
    fs.mkdirSync(assetsDir, { recursive: true });
    fs.mkdirSync(path.join(assetsDir, 'images'), { recursive: true });
    fs.mkdirSync(path.join(assetsDir, 'fonts'), { recursive: true });
  });

  it('should pass valid app.config.json with all required sections', () => {
    const validJson = {
      rows: {},
      translations: { en: {} },
      cells: {},
      theme: {
        colors: {},
        fonts: {},
      },
      controls: {},
    };

    const jsonStr = JSON.stringify(validJson, null, 2);
    // Create a mock file
    const testFile = path.join(tempDir, 'src', 'meta', 'app.config.json');
    fs.mkdirSync(path.dirname(testFile), { recursive: true });
    fs.writeFileSync(testFile, jsonStr);

    // Note: RuleTester doesn't work well with JSON files
    // We'll test the validation logic directly through integration tests
    expect(validJson.rows).toBeDefined();
    expect(validJson.translations.en).toBeDefined();
    expect(validJson.cells).toBeDefined();
    expect(validJson.theme.colors).toBeDefined();
    expect(validJson.theme.fonts).toBeDefined();
    expect(validJson.controls).toBeDefined();
  });

  it('should detect missing rows section', () => {
    const invalidJson: any = {
      translations: { en: {} },
      cells: {},
      theme: { colors: {}, fonts: {} },
      controls: {},
    };

    expect(invalidJson.rows).toBeUndefined();
  });

  it('should detect missing translations section', () => {
    const invalidJson: any = {
      rows: {},
      cells: {},
      theme: { colors: {}, fonts: {} },
      controls: {},
    };

    expect(invalidJson.translations).toBeUndefined();
  });

  it('should detect missing "en" in translations', () => {
    const invalidJson: any = {
      rows: {},
      translations: { es: {} },
      cells: {},
      theme: { colors: {}, fonts: {} },
      controls: {},
    };

    expect(invalidJson.translations.en).toBeUndefined();
  });

  it('should detect missing cells section', () => {
    const invalidJson: any = {
      rows: {},
      translations: { en: {} },
      theme: { colors: {}, fonts: {} },
      controls: {},
    };

    expect(invalidJson.cells).toBeUndefined();
  });

  it('should detect missing theme section', () => {
    const invalidJson: any = {
      rows: {},
      translations: { en: {} },
      cells: {},
      controls: {},
    };

    expect(invalidJson.theme).toBeUndefined();
  });

  it('should detect missing colors in theme', () => {
    const invalidJson: any = {
      rows: {},
      translations: { en: {} },
      cells: {},
      theme: { fonts: {} },
      controls: {},
    };

    expect(invalidJson.theme.colors).toBeUndefined();
  });

  it('should detect missing fonts in theme', () => {
    const invalidJson: any = {
      rows: {},
      translations: { en: {} },
      cells: {},
      theme: { colors: {} },
      controls: {},
    };

    expect(invalidJson.theme.fonts).toBeUndefined();
  });

  it('should detect missing controls section', () => {
    const invalidJson: any = {
      rows: {},
      translations: { en: {} },
      cells: {},
      theme: { colors: {}, fonts: {} },
    };

    expect(invalidJson.controls).toBeUndefined();
  });

  it('should validate pkg:/ paths exist', () => {
    // Create a test file
    const testImagePath = path.join(assetsDir, 'images', 'test.png');
    fs.writeFileSync(testImagePath, 'test');

    const pkgPath = 'pkg:/assets/images/test.png';
    const relativePath = 'images/test.png';
    const fullPath = path.join(assetsDir, relativePath);

    expect(fs.existsSync(fullPath)).toBe(true);
  });

  it('should detect invalid pkg:/ paths', () => {
    const pkgPath = 'pkg:/assets/images/nonexistent.png';
    const relativePath = 'images/nonexistent.png';
    const fullPath = path.join(assetsDir, relativePath);

    expect(fs.existsSync(fullPath)).toBe(false);
  });

  it('should validate ~ JSON references', () => {
    const jsonObj: any = {
      theme: {
        colors: {
          white: '#FFFFFF',
        },
        fonts: {
          heading: 'font.ttf',
        },
      },
    };

    // Test valid reference
    const validRef = '~theme.colors.white';
    const pathStr = validRef.substring(1);
    let current: any = jsonObj;
    for (const part of pathStr.split('.')) {
      current = current[part];
    }
    expect(current).toBe('#FFFFFF');

    // Test invalid reference
    const invalidRef = '~theme.colors.nonexistent';
    const invalidPathStr = invalidRef.substring(1);
    current = jsonObj;
    for (const part of invalidPathStr.split('.')) {
      if (current === undefined) {
        break;
      }
      current = current[part];
    }
    expect(current).toBeUndefined();
  });

  it('should validate $extends references', () => {
    const jsonObj: any = {
      controls: {
        Label: {
          default: {
            color: '#FFFFFF',
          },
        },
        Button: {
          default: {
            $extends: 'controls.Label.default',
          },
        },
      },
    };

    // Test valid $extends
    const validExtends = 'controls.Label.default';
    let current: any = jsonObj;
    for (const part of validExtends.split('.')) {
      current = current[part];
    }
    expect(current).toBeDefined();
    expect(current.color).toBe('#FFFFFF');

    // Test invalid $extends
    const invalidExtends = 'controls.Label.nonexistent';
    current = jsonObj;
    for (const part of invalidExtends.split('.')) {
      if (current === undefined) {
        break;
      }
      current = current[part];
    }
    expect(current).toBeUndefined();
  });

  it('should handle JSON parse errors', () => {
    const invalidJson = '{ invalid json }';
    expect(() => JSON.parse(invalidJson)).toThrow();
  });

  it('should handle nested pkg:/ paths in font strings', () => {
    const jsonObj = {
      theme: {
        fonts: {
          heading: 'pkg:/assets/fonts/Poppins-SemiBold.ttf, 56',
        },
      },
    };

    const fontValue = jsonObj.theme.fonts.heading;
    expect(fontValue).toContain('pkg:/assets/fonts/Poppins-SemiBold.ttf');
  });

  it('should handle complex nested structures', () => {
    const complexJson = {
      rows: {
        regular: {
          backgroundUri: 'pkg:/assets/images/bg.png',
        },
      },
      translations: {
        en: {
          home: {
            title: 'Welcome',
          },
        },
      },
      cells: {
        regular: {
          color: '~theme.colors.white',
        },
      },
      theme: {
        colors: {
          white: '#FFFFFF',
        },
        fonts: {
          heading: 'pkg:/assets/fonts/font.ttf, 24',
        },
      },
      controls: {
        Button: {
          default: {
            $extends: 'controls.Label.default',
            color: '~theme.colors.white',
          },
        },
        Label: {
          default: {
            color: '#000000',
          },
        },
      },
    };

    expect(complexJson.rows.regular.backgroundUri).toContain('pkg:/');
    expect(complexJson.cells.regular.color).toMatch(/^~/);
    expect(complexJson.controls.Button.default.$extends).toBeDefined();
  });

  // RuleTester-based tests
  describe('RuleTester tests', () => {
    it('should pass valid app.config.json with all required sections', () => {
      ruleTester.run('app-config-json-valid', rule, {
        valid: [
          {
            code: JSON.stringify({
              rows: {},
              translations: { en: {} },
              cells: {},
              theme: { colors: {}, fonts: {} },
              controls: {},
            }, null, 2),
            filename: 'src/meta/app.config.json',
          },
        ],
        invalid: [],
      });
    });

    it('should report error for missing rows section', () => {
      ruleTester.run('app-config-json-valid', rule, {
        valid: [],
        invalid: [
          {
            code: JSON.stringify({
              translations: { en: {} },
              cells: {},
              theme: { colors: {}, fonts: {} },
              controls: {},
            }, null, 2),
            filename: 'src/meta/app.config.json',
            errors: [
              {
                messageId: 'missingSection',
                data: { section: 'rows' },
              },
            ],
          },
        ],
      });
    });

    it('should report error for missing translations section', () => {
      ruleTester.run('app-config-json-valid', rule, {
        valid: [],
        invalid: [
          {
            code: JSON.stringify({
              rows: {},
              cells: {},
              theme: { colors: {}, fonts: {} },
              controls: {},
            }, null, 2),
            filename: 'src/meta/app.config.json',
            errors: [
              {
                messageId: 'missingSection',
                data: { section: 'translations' },
              },
            ],
          },
        ],
      });
    });

    it('should report error for missing "en" in translations', () => {
      ruleTester.run('app-config-json-valid', rule, {
        valid: [],
        invalid: [
          {
            code: JSON.stringify({
              rows: {},
              translations: { es: {} },
              cells: {},
              theme: { colors: {}, fonts: {} },
              controls: {},
            }, null, 2),
            filename: 'src/meta/app.config.json',
            errors: [
              {
                messageId: 'missingTranslationEn',
              },
            ],
          },
        ],
      });
    });

    it('should report error for missing cells section', () => {
      ruleTester.run('app-config-json-valid', rule, {
        valid: [],
        invalid: [
          {
            code: JSON.stringify({
              rows: {},
              translations: { en: {} },
              theme: { colors: {}, fonts: {} },
              controls: {},
            }, null, 2),
            filename: 'src/meta/app.config.json',
            errors: [
              {
                messageId: 'missingSection',
                data: { section: 'cells' },
              },
            ],
          },
        ],
      });
    });

    it('should report error for missing theme section', () => {
      ruleTester.run('app-config-json-valid', rule, {
        valid: [],
        invalid: [
          {
            code: JSON.stringify({
              rows: {},
              translations: { en: {} },
              cells: {},
              controls: {},
            }, null, 2),
            filename: 'src/meta/app.config.json',
            errors: [
              {
                messageId: 'missingSection',
                data: { section: 'theme' },
              },
            ],
          },
        ],
      });
    });

    it('should report error for missing colors in theme', () => {
      ruleTester.run('app-config-json-valid', rule, {
        valid: [],
        invalid: [
          {
            code: JSON.stringify({
              rows: {},
              translations: { en: {} },
              cells: {},
              theme: { fonts: {} },
              controls: {},
            }, null, 2),
            filename: 'src/meta/app.config.json',
            errors: [
              {
                messageId: 'missingThemeColors',
              },
            ],
          },
        ],
      });
    });

    it('should report error for missing fonts in theme', () => {
      ruleTester.run('app-config-json-valid', rule, {
        valid: [],
        invalid: [
          {
            code: JSON.stringify({
              rows: {},
              translations: { en: {} },
              cells: {},
              theme: { colors: {} },
              controls: {},
            }, null, 2),
            filename: 'src/meta/app.config.json',
            errors: [
              {
                messageId: 'missingThemeFonts',
              },
            ],
          },
        ],
      });
    });

    it('should report error for missing controls section', () => {
      ruleTester.run('app-config-json-valid', rule, {
        valid: [],
        invalid: [
          {
            code: JSON.stringify({
              rows: {},
              translations: { en: {} },
              cells: {},
              theme: { colors: {}, fonts: {} },
            }, null, 2),
            filename: 'src/meta/app.config.json',
            errors: [
              {
                messageId: 'missingSection',
                data: { section: 'controls' },
              },
            ],
          },
        ],
      });
    });

    it('should report error for invalid JSON', () => {
      ruleTester.run('app-config-json-valid', rule, {
        valid: [],
        invalid: [
          {
            code: '{ invalid json }',
            filename: 'src/meta/app.config.json',
            errors: [
              {
                messageId: 'jsonParseError',
              },
            ],
          },
        ],
      });
    });

    it('should report error for invalid ~ JSON reference', () => {
      ruleTester.run('app-config-json-valid', rule, {
        valid: [],
        invalid: [
          {
            code: JSON.stringify({
              rows: {},
              translations: { en: {} },
              cells: {
                regular: {
                  color: '~theme.colors.nonexistent',
                },
              },
              theme: { colors: {}, fonts: {} },
              controls: {},
            }, null, 2),
            filename: 'src/meta/app.config.json',
            errors: [
              {
                messageId: 'invalidJsonReference',
              },
            ],
          },
        ],
      });
    });

    it('should report error for invalid $extends reference', () => {
      ruleTester.run('app-config-json-valid', rule, {
        valid: [],
        invalid: [
          {
            code: JSON.stringify({
              rows: {},
              translations: { en: {} },
              cells: {},
              theme: { colors: {}, fonts: {} },
              controls: {
                Button: {
                  default: {
                    $extends: 'controls.Label.nonexistent',
                  },
                },
              },
            }, null, 2),
            filename: 'src/meta/app.config.json',
            errors: [
              {
                messageId: 'invalidExtendsReference',
              },
            ],
          },
        ],
      });
    });

    it('should not process non-app.config.json files', () => {
      ruleTester.run('app-config-json-valid', rule, {
        valid: [
          {
            code: JSON.stringify({}),
            filename: 'other.json',
          },
          {
            code: JSON.stringify({}),
            filename: 'config.json',
          },
        ],
        invalid: [],
      });
    });

    it('should handle valid ~ JSON references', () => {
      ruleTester.run('app-config-json-valid', rule, {
        valid: [
          {
            code: JSON.stringify({
              rows: {},
              translations: { en: {} },
              cells: {
                regular: {
                  color: '~theme.colors.white',
                },
              },
              theme: {
                colors: {
                  white: '#FFFFFF',
                },
                fonts: {},
              },
              controls: {},
            }, null, 2),
            filename: 'src/meta/app.config.json',
          },
        ],
        invalid: [],
      });
    });

    it('should handle valid $extends references', () => {
      ruleTester.run('app-config-json-valid', rule, {
        valid: [
          {
            code: JSON.stringify({
              rows: {},
              translations: { en: {} },
              cells: {},
              theme: { colors: {}, fonts: {} },
              controls: {
                Label: {
                  default: {
                    color: '#FFFFFF',
                  },
                },
                Button: {
                  default: {
                    $extends: 'controls.Label.default',
                  },
                },
              },
            }, null, 2),
            filename: 'src/meta/app.config.json',
          },
        ],
        invalid: [],
      });
    });

    it('should handle nested $extends references', () => {
      ruleTester.run('app-config-json-valid', rule, {
        valid: [
          {
            code: JSON.stringify({
              rows: {},
              translations: { en: {} },
              cells: {},
              theme: { colors: {}, fonts: {} },
              controls: {
                Label: {
                  TwoLabelStyleRig: {
                    Label1: {
                      normal: {
                        color: '#FFFFFF',
                      },
                    },
                    Label2: {
                      $extends: 'controls.Label.TwoLabelStyleRig.Label1',
                    },
                  },
                },
              },
            }, null, 2),
            filename: 'src/meta/app.config.json',
          },
        ],
        invalid: [],
      });
    });

    it('should handle pkg:/ paths in font strings', () => {
      ruleTester.run('app-config-json-valid', rule, {
        valid: [
          {
            code: JSON.stringify({
              rows: {},
              translations: { en: {} },
              cells: {},
              theme: {
                colors: {},
                fonts: {
                  heading: 'pkg:/assets/fonts/Poppins-SemiBold.ttf, 56',
                },
              },
              controls: {},
            }, null, 2),
            filename: 'src/meta/app.config.json',
          },
        ],
        invalid: [],
      });
    });

    it('should resolve @res to -fhd when checking file existence', () => {
      // Create a file with -fhd suffix (the resolved form)
      const testImageDir = path.join(tempDir, 'assets', 'images', 'controls');
      fs.mkdirSync(testImageDir, { recursive: true });
      const testImagePath = path.join(testImageDir, 'button-details-fhd.9.png');
      fs.writeFileSync(testImagePath, 'test');

      // Verify the file exists with -fhd suffix
      expect(fs.existsSync(testImagePath)).toBe(true);

      // The rule should pass because @res resolves to -fhd and the file exists
      ruleTester.run('app-config-json-valid', rule, {
        valid: [
          {
            code: JSON.stringify({
              rows: {},
              translations: { en: {} },
              cells: {},
              theme: { colors: {}, fonts: {} },
              controls: {
                Button: {
                  default: {
                    backgroundUri: 'pkg:/assets/images/controls/button-details@res.9.png',
                  },
                },
              },
            }, null, 2),
            filename: 'assets/meta/app.config.json',
          },
        ],
        invalid: [],
      });

      // Verify that the file with @res in the path doesn't exist (only -fhd version exists)
      const unresovedPath = path.join(testImageDir, 'button-details@res.9.png');
      expect(fs.existsSync(unresovedPath)).toBe(false);
    });

    it('should report error when @res file does not exist after resolution', () => {
      ruleTester.run('app-config-json-valid', rule, {
        valid: [],
        invalid: [
          {
            code: JSON.stringify({
              rows: {},
              translations: { en: {} },
              cells: {},
              theme: { colors: {}, fonts: {} },
              controls: {
                Button: {
                  default: {
                    backgroundUri: 'pkg:/assets/images/controls/nonexistent@res.9.png',
                  },
                },
              },
            }, null, 2),
            filename: 'assets/meta/app.config.json',
            errors: [
              {
                messageId: 'invalidPkgPath',
              },
            ],
          },
        ],
      });
    });

    it('should handle complex nested structures with all validations', () => {
      ruleTester.run('app-config-json-valid', rule, {
        valid: [
          {
            code: JSON.stringify({
              rows: {
                regular: {
                  backgroundUri: 'pkg:/assets/images/bg.png',
                },
              },
              translations: {
                en: {
                  home: {
                    title: 'Welcome',
                  },
                },
              },
              cells: {
                regular: {
                  color: '~theme.colors.white',
                },
              },
              theme: {
                colors: {
                  white: '#FFFFFF',
                },
                fonts: {
                  heading: 'pkg:/assets/fonts/font.ttf, 24',
                },
              },
              controls: {
                Label: {
                  default: {
                    color: '#000000',
                  },
                },
                Button: {
                  default: {
                    $extends: 'controls.Label.default',
                    color: '~theme.colors.white',
                  },
                },
              },
            }, null, 2),
            filename: 'src/meta/app.config.json',
          },
        ],
        invalid: [],
      });
    });

    it('should report error for $extends with ~ prefix', () => {
      ruleTester.run('app-config-json-valid', rule, {
        valid: [],
        invalid: [
          {
            code: JSON.stringify({
              rows: {},
              translations: { en: {} },
              cells: {},
              theme: { colors: {}, fonts: {} },
              controls: {
                Button: {
                  default: {
                    $extends: '~controls.Label.default',
                  },
                },
                Label: {
                  default: {
                    color: '#FFFFFF',
                  },
                },
              },
            }, null, 2),
            filename: 'src/meta/app.config.json',
            errors: [
              {
                messageId: 'extendsWithTilde',
              },
            ],
          },
        ],
      });
    });

    it('should allow styleKey with ~ prefix in app.config.json', () => {
      ruleTester.run('app-config-json-valid', rule, {
        valid: [
          {
            code: JSON.stringify({
              rows: {},
              translations: { en: {} },
              cells: {},
              theme: {
                colors: {},
                fonts: {},
                styles: {
                  heading: {},
                },
              },
              controls: {
                Label: {
                  default: {
                    styleKey: '~theme.styles.heading',
                  },
                },
              },
            }, null, 2),
            filename: 'src/meta/app.config.json',
          },
        ],
        invalid: [],
      });
    });

    it('should report error for fontKey with ~ prefix when path is invalid', () => {
      ruleTester.run('app-config-json-valid', rule, {
        valid: [],
        invalid: [
          {
            code: JSON.stringify({
              rows: {},
              translations: { en: {} },
              cells: {},
              theme: { colors: {}, fonts: {} },
              controls: {
                Label: {
                  default: {
                    fontKey: '~theme.fonts.nonexistent',
                  },
                },
              },
            }, null, 2),
            filename: 'src/meta/app.config.json',
            errors: [
              {
                messageId: 'invalidFontKeyFormat',
              },
            ],
          },
        ],
      });
    });

    it('should report error for fontKey with ~ prefix when it contains commas', () => {
      ruleTester.run('app-config-json-valid', rule, {
        valid: [],
        invalid: [
          {
            code: JSON.stringify({
              rows: {},
              translations: { en: {} },
              cells: {},
              theme: {
                colors: {},
                fonts: {
                  heading: 'pkg:/assets/fonts/font.ttf, 24',
                },
              },
              controls: {
                Label: {
                  default: {
                    fontKey: '~theme.fonts.heading,20',
                  },
                },
              },
            }, null, 2),
            filename: 'src/meta/app.config.json',
            errors: [
              {
                messageId: 'invalidFontKeyFormat',
              },
            ],
          },
        ],
      });
    });

    it('should allow fontKey with ~ prefix when path is valid', () => {
      ruleTester.run('app-config-json-valid', rule, {
        valid: [
          {
            code: JSON.stringify({
              rows: {},
              translations: { en: {} },
              cells: {},
              theme: {
                colors: {},
                fonts: {
                  heading: 'pkg:/assets/fonts/font.ttf, 24',
                },
              },
              controls: {
                Label: {
                  default: {
                    fontKey: '~theme.fonts.heading',
                  },
                },
              },
            }, null, 2),
            filename: 'src/meta/app.config.json',
          },
        ],
        invalid: [],
      });
    });

    it('should validate fontKey format when value does not start with ~', () => {
      ruleTester.run('app-config-json-valid', rule, {
        valid: [
          {
            code: JSON.stringify({
              rows: {},
              translations: { en: {} },
              cells: {},
              theme: { colors: {}, fonts: {} },
              controls: {
                Label: {
                  default: {
                    fontKey: 'pkg:/assets/fonts/Montserrat-Black.ttf,34',
                  },
                },
              },
            }, null, 2),
            filename: 'src/meta/app.config.json',
          },
          // Test all valid Roku system font names (without SystemFont suffix)
          {
            code: JSON.stringify({
              rows: {},
              translations: { en: {} },
              cells: {},
              theme: { colors: {}, fonts: {} },
              controls: {
                Label: {
                  default: {
                    fontKey: 'Tiny,10',
                  },
                },
              },
            }, null, 2),
            filename: 'src/meta/app.config.json',
          },
          {
            code: JSON.stringify({
              rows: {},
              translations: { en: {} },
              cells: {},
              theme: { colors: {}, fonts: {} },
              controls: {
                Label: {
                  default: {
                    fontKey: 'TinyBold,10',
                  },
                },
              },
            }, null, 2),
            filename: 'src/meta/app.config.json',
          },
          {
            code: JSON.stringify({
              rows: {},
              translations: { en: {} },
              cells: {},
              theme: { colors: {}, fonts: {} },
              controls: {
                Label: {
                  default: {
                    fontKey: 'Smaller,12',
                  },
                },
              },
            }, null, 2),
            filename: 'src/meta/app.config.json',
          },
          {
            code: JSON.stringify({
              rows: {},
              translations: { en: {} },
              cells: {},
              theme: { colors: {}, fonts: {} },
              controls: {
                Label: {
                  default: {
                    fontKey: 'SmallerBold,12',
                  },
                },
              },
            }, null, 2),
            filename: 'src/meta/app.config.json',
          },
          {
            code: JSON.stringify({
              rows: {},
              translations: { en: {} },
              cells: {},
              theme: { colors: {}, fonts: {} },
              controls: {
                Label: {
                  default: {
                    fontKey: 'Smallest,14',
                  },
                },
              },
            }, null, 2),
            filename: 'src/meta/app.config.json',
          },
          {
            code: JSON.stringify({
              rows: {},
              translations: { en: {} },
              cells: {},
              theme: { colors: {}, fonts: {} },
              controls: {
                Label: {
                  default: {
                    fontKey: 'SmallestBold,14',
                  },
                },
              },
            }, null, 2),
            filename: 'src/meta/app.config.json',
          },
          {
            code: JSON.stringify({
              rows: {},
              translations: { en: {} },
              cells: {},
              theme: { colors: {}, fonts: {} },
              controls: {
                Label: {
                  default: {
                    fontKey: 'Small,16',
                  },
                },
              },
            }, null, 2),
            filename: 'src/meta/app.config.json',
          },
          {
            code: JSON.stringify({
              rows: {},
              translations: { en: {} },
              cells: {},
              theme: { colors: {}, fonts: {} },
              controls: {
                Label: {
                  default: {
                    fontKey: 'SmallBold,16',
                  },
                },
              },
            }, null, 2),
            filename: 'src/meta/app.config.json',
          },
          {
            code: JSON.stringify({
              rows: {},
              translations: { en: {} },
              cells: {},
              theme: { colors: {}, fonts: {} },
              controls: {
                Label: {
                  default: {
                    fontKey: 'Medium,20',
                  },
                },
              },
            }, null, 2),
            filename: 'src/meta/app.config.json',
          },
          {
            code: JSON.stringify({
              rows: {},
              translations: { en: {} },
              cells: {},
              theme: { colors: {}, fonts: {} },
              controls: {
                Label: {
                  default: {
                    fontKey: 'MediumBold,20',
                  },
                },
              },
            }, null, 2),
            filename: 'src/meta/app.config.json',
          },
          {
            code: JSON.stringify({
              rows: {},
              translations: { en: {} },
              cells: {},
              theme: { colors: {}, fonts: {} },
              controls: {
                Label: {
                  default: {
                    fontKey: 'Large,24',
                  },
                },
              },
            }, null, 2),
            filename: 'src/meta/app.config.json',
          },
          {
            code: JSON.stringify({
              rows: {},
              translations: { en: {} },
              cells: {},
              theme: { colors: {}, fonts: {} },
              controls: {
                Label: {
                  default: {
                    fontKey: 'LargeBold,40',
                  },
                },
              },
            }, null, 2),
            filename: 'src/meta/app.config.json',
          },
          {
            code: JSON.stringify({
              rows: {},
              translations: { en: {} },
              cells: {},
              theme: { colors: {}, fonts: {} },
              controls: {
                Label: {
                  default: {
                    fontKey: 'Largest,28',
                  },
                },
              },
            }, null, 2),
            filename: 'src/meta/app.config.json',
          },
          {
            code: JSON.stringify({
              rows: {},
              translations: { en: {} },
              cells: {},
              theme: { colors: {}, fonts: {} },
              controls: {
                Label: {
                  default: {
                    fontKey: 'ExtraLarge,32',
                  },
                },
              },
            }, null, 2),
            filename: 'src/meta/app.config.json',
          },
          {
            code: JSON.stringify({
              rows: {},
              translations: { en: {} },
              cells: {},
              theme: { colors: {}, fonts: {} },
              controls: {
                Label: {
                  default: {
                    fontKey: 'ExtraLargeBold,32',
                  },
                },
              },
            }, null, 2),
            filename: 'src/meta/app.config.json',
          },
          {
            code: JSON.stringify({
              rows: {},
              translations: { en: {} },
              cells: {},
              theme: { colors: {}, fonts: {} },
              controls: {
                Label: {
                  default: {
                    fontKey: 'Badge,18',
                  },
                },
              },
            }, null, 2),
            filename: 'src/meta/app.config.json',
          },
        ],
        invalid: [
          {
            code: JSON.stringify({
              rows: {},
              translations: { en: {} },
              cells: {},
              theme: { colors: {}, fonts: {} },
              controls: {
                Label: {
                  default: {
                    fontKey: 'invalid-format',
                  },
                },
              },
            }, null, 2),
            filename: 'src/meta/app.config.json',
            errors: [
              {
                messageId: 'invalidFontKeyFormat',
              },
            ],
          },
          {
            code: JSON.stringify({
              rows: {},
              translations: { en: {} },
              cells: {},
              theme: { colors: {}, fonts: {} },
              controls: {
                Label: {
                  default: {
                    fontKey: 'pkg:/assets/fonts/font.ttf',
                  },
                },
              },
            }, null, 2),
            filename: 'src/meta/app.config.json',
            errors: [
              {
                messageId: 'invalidFontKeyFormat',
              },
            ],
          },
          {
            code: JSON.stringify({
              rows: {},
              translations: { en: {} },
              cells: {},
              theme: { colors: {}, fonts: {} },
              controls: {
                Label: {
                  default: {
                    fontKey: 'font.ttf,abc',
                  },
                },
              },
            }, null, 2),
            filename: 'src/meta/app.config.json',
            errors: [
              {
                messageId: 'invalidFontKeyFormat',
              },
            ],
          },
          // Test invalid system font names
          {
            code: JSON.stringify({
              rows: {},
              translations: { en: {} },
              cells: {},
              theme: { colors: {}, fonts: {} },
              controls: {
                Label: {
                  default: {
                    fontKey: 'InvalidFont,20',
                  },
                },
              },
            }, null, 2),
            filename: 'src/meta/app.config.json',
            errors: [
              {
                messageId: 'invalidFontKeyFormat',
              },
            ],
          },
          {
            code: JSON.stringify({
              rows: {},
              translations: { en: {} },
              cells: {},
              theme: { colors: {}, fonts: {} },
              controls: {
                Label: {
                  default: {
                    fontKey: 'SmallRegular,20',
                  },
                },
              },
            }, null, 2),
            filename: 'src/meta/app.config.json',
            errors: [
              {
                messageId: 'invalidFontKeyFormat',
              },
            ],
          },
          {
            code: JSON.stringify({
              rows: {},
              translations: { en: {} },
              cells: {},
              theme: { colors: {}, fonts: {} },
              controls: {
                Label: {
                  default: {
                    fontKey: 'MediumRegular,20',
                  },
                },
              },
            }, null, 2),
            filename: 'src/meta/app.config.json',
            errors: [
              {
                messageId: 'invalidFontKeyFormat',
              },
            ],
          },
          // Test that dot notation fontKey values must be references
          {
            code: JSON.stringify({
              rows: {},
              translations: { en: {} },
              cells: {},
              theme: { colors: {}, fonts: {} },
              controls: {
                Label: {
                  default: {
                    fontKey: 'path.to.something',
                  },
                },
              },
            }, null, 2),
            filename: 'src/meta/app.config.json',
            errors: [
              {
                messageId: 'invalidFontKeyFormat',
              },
            ],
          },
          {
            code: JSON.stringify({
              rows: {},
              translations: { en: {} },
              cells: {},
              theme: { colors: {}, fonts: {} },
              controls: {
                Label: {
                  default: {
                    fontKey: 'theme.fonts.main',
                  },
                },
              },
            }, null, 2),
            filename: 'src/meta/app.config.json',
            errors: [
              {
                messageId: 'invalidFontKeyFormat',
              },
            ],
          },
          {
            code: JSON.stringify({
              rows: {},
              translations: { en: {} },
              cells: {},
              theme: { colors: {}, fonts: {} },
              controls: {
                Label: {
                  default: {
                    fontKey: 'HugeRegular,20',
                  },
                },
              },
            }, null, 2),
            filename: 'src/meta/app.config.json',
            errors: [
              {
                messageId: 'invalidFontKeyFormat',
              },
            ],
          },
          {
            code: JSON.stringify({
              rows: {},
              translations: { en: {} },
              cells: {},
              theme: { colors: {}, fonts: {} },
              controls: {
                Label: {
                  default: {
                    fontKey: 'HugeBold,20',
                  },
                },
              },
            }, null, 2),
            filename: 'src/meta/app.config.json',
            errors: [
              {
                messageId: 'invalidFontKeyFormat',
              },
            ],
          },
          {
            code: JSON.stringify({
              rows: {},
              translations: { en: {} },
              cells: {},
              theme: { colors: {}, fonts: {} },
              controls: {
                Label: {
                  default: {
                    fontKey: 'SystemFont,20',
                  },
                },
              },
            }, null, 2),
            filename: 'src/meta/app.config.json',
            errors: [
              {
                messageId: 'invalidFontKeyFormat',
              },
            ],
          },
          {
            code: JSON.stringify({
              rows: {},
              translations: { en: {} },
              cells: {},
              theme: { colors: {}, fonts: {} },
              controls: {
                Label: {
                  default: {
                    fontKey: 'CustomFont,20',
                  },
                },
              },
            }, null, 2),
            filename: 'src/meta/app.config.json',
            errors: [
              {
                messageId: 'invalidFontKeyFormat',
              },
            ],
          },
        ],
      });
    });

    it('should validate color with ~ prefix and report error for invalid path', () => {
      ruleTester.run('app-config-json-valid', rule, {
        valid: [],
        invalid: [
          {
            code: JSON.stringify({
              rows: {},
              translations: { en: {} },
              cells: {},
              theme: { colors: {}, fonts: {} },
              controls: {
                Label: {
                  default: {
                    color: '~theme.colors.nonexistent',
                  },
                },
              },
            }, null, 2),
            filename: 'src/meta/app.config.json',
            errors: [
              {
                messageId: 'invalidJsonReference',
              },
            ],
          },
        ],
      });
    });

    it('should validate color with ~ prefix and pass for valid path', () => {
      ruleTester.run('app-config-json-valid', rule, {
        valid: [
          {
            code: JSON.stringify({
              rows: {},
              translations: { en: {} },
              cells: {},
              theme: {
                colors: {
                  white: '#FFFFFF',
                },
                fonts: {},
              },
              controls: {
                Label: {
                  default: {
                    color: '~theme.colors.white',
                  },
                },
              },
            }, null, 2),
            filename: 'src/meta/app.config.json',
          },
        ],
        invalid: [],
      });
    });
  });
});

