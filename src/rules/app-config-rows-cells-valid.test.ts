import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';
import rule from './app-config-rows-cells-valid';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser,
  },
});

describe('app-config-rows-cells-valid', () => {
  describe('valid configurations', () => {
    it('should pass valid row configuration', () => {
      ruleTester.run('app-config-rows-cells-valid', rule, {
        valid: [
          {
            code: JSON.stringify({
              rows: {
                someRow: {
                  height: 100,
                  spacing: 10,
                  cellSize: [200, 150],
                  focusStrategy: 'focusOnPreviousItem',
                },
              },
              cells: {},
              translations: { en: {} },
              theme: { colors: {}, fonts: {} },
              controls: {},
            }, null, 2),
            filename: 'app.config.json',
          },
        ],
        invalid: [],
      });
    });

    it('should pass valid cell configuration with views.base', () => {
      ruleTester.run('app-config-rows-cells-valid', rule, {
        valid: [
          {
            code: JSON.stringify({
              rows: {},
              cells: {
                someCell: {
                  views: {
                    base: [
                      {
                        id: 'poster',
                        subType: 'Poster',
                        width: 384,
                        height: 216,
                        uri: '${data.imageUrl}',
                        opacity: 1.0,
                        visible: true,
                        translation: [0, 0],
                        scale: [1.0, 1.0],
                        rotation: 0,
                        scaleRotateCenter: [0, 0],
                      },
                      {
                        id: 'label',
                        subType: 'Label',
                        width: 384,
                        height: 36,
                        text: '${data.title}',
                        color: '~theme.colors.white',
                        fontKey: '~theme.fonts.text-regular-20',
                        horizAlign: 'left',
                        vertAlign: 'top',
                        wrap: true,
                        maxLines: 2,
                        ellipsizeOnBoundary: true,
                        ellipsisText: '...',
                        opacity: 1.0,
                        visible: true,
                        translation: [0, 180],
                        scale: [1.0, 1.0],
                        rotation: 0,
                        scaleRotateCenter: [0, 0],
                      },
                    ],
                    normal: {
                      poster: {
                        opacity: 0.8,
                      },
                    },
                    focused: {
                      poster: {
                        opacity: 1.0,
                        scale: [1.05, 1.05],
                      },
                    },
                  },
                },
              },
              translations: { en: {} },
              theme: { colors: {}, fonts: {} },
              controls: {},
            }, null, 2),
            filename: 'app.config.json',
          },
        ],
        invalid: [],
      });
    });

    it('should pass valid focusSettings configuration', () => {
      ruleTester.run('app-config-rows-cells-valid', rule, {
        valid: [
          {
            code: JSON.stringify({
              rows: {
                someRow: {
                  focusSettings: {
                    horizAnimSettings: 'floating',
                    vertAnimSettings: 'fixed',
                    canLongPress: true,
                    hideFocusIndicator: false,
                    indicatorImageUri: 'pkg:/assets/images/focus.png',
                    indicatorBlendColor: '#ffffff',
                    feedbackOffsets: [4, 4, -4, -4],
                    focusedScale: 1.05,
                  },
                },
              },
              cells: {},
              translations: { en: {} },
              theme: { colors: {}, fonts: {} },
              controls: {},
            }, null, 2),
            filename: 'app.config.json',
          },
        ],
        invalid: [],
      });
    });

    it('should pass valid headerSettings configuration', () => {
      ruleTester.run('app-config-rows-cells-valid', rule, {
        valid: [
          {
            code: JSON.stringify({
              rows: {
                someRow: {
                  headerSettings: {
                    headerAppearance: 'onTop',
                    headerClass: '',
                    positionOffset: [0, 0],
                    height: 51,
                    labelOffset: [255, 0],
                    fontKey: '~theme.fonts.text-medium-24',
                    textColor: '#FFFFFF',
                    backgroundColor: '#000000',
                    backgroundOpacity: 0.8,
                    backgroundVisible: true,
                    headerComponent: '',
                  },
                },
              },
              cells: {},
              translations: { en: {} },
              theme: { colors: {}, fonts: {} },
              controls: {},
            }, null, 2),
            filename: 'app.config.json',
          },
        ],
        invalid: [],
      });
    });
  });

  describe('invalid configurations', () => {
    it('should report error for invalid property key in rows', () => {
      ruleTester.run('app-config-rows-cells-valid', rule, {
        valid: [],
        invalid: [
          {
            code: JSON.stringify({
              rows: {
                someRow: {
                  invalidKey: 'value',
                  height: 100,
                },
              },
              cells: {},
              translations: { en: {} },
              theme: { colors: {}, fonts: {} },
              controls: {},
            }, null, 2),
            filename: 'app.config.json',
            errors: [
              {
                messageId: 'invalidPropertyKey',
                data: {
                  key: 'invalidKey',
                  context: 'rows',
                },
              },
            ],
          },
        ],
      });
    });

    it('should report error for invalid enum value in focusStrategy', () => {
      ruleTester.run('app-config-rows-cells-valid', rule, {
        valid: [],
        invalid: [
          {
            code: JSON.stringify({
              rows: {
                someRow: {
                  focusStrategy: 'invalidStrategy',
                },
              },
              cells: {},
              translations: { en: {} },
              theme: { colors: {}, fonts: {} },
              controls: {},
            }, null, 2),
            filename: 'app.config.json',
            errors: [
              {
                messageId: 'invalidPropertyValue',
                data: {
                  key: 'focusStrategy',
                },
              },
            ],
          },
        ],
      });
    });

    it('should report error for invalid type in height (should be number)', () => {
      ruleTester.run('app-config-rows-cells-valid', rule, {
        valid: [],
        invalid: [
          {
            code: JSON.stringify({
              rows: {
                someRow: {
                  height: 'not-a-number',
                },
              },
              cells: {},
              translations: { en: {} },
              theme: { colors: {}, fonts: {} },
              controls: {},
            }, null, 2),
            filename: 'app.config.json',
            errors: [
              {
                messageId: 'invalidPropertyValue',
                data: {
                  key: 'height',
                },
              },
            ],
          },
        ],
      });
    });

    it('should report error for invalid property key in focusSettings', () => {
      ruleTester.run('app-config-rows-cells-valid', rule, {
        valid: [],
        invalid: [
          {
            code: JSON.stringify({
              rows: {
                someRow: {
                  focusSettings: {
                    invalidKey: 'value',
                    horizAnimSettings: 'floating',
                  },
                },
              },
              cells: {},
              translations: { en: {} },
              theme: { colors: {}, fonts: {} },
              controls: {},
            }, null, 2),
            filename: 'app.config.json',
            errors: [
              {
                messageId: 'invalidPropertyKey',
                data: {
                  key: 'invalidKey',
                  context: 'row.focusSettings',
                },
              },
            ],
          },
        ],
      });
    });

    it('should report error for invalid enum value in horizAnimSettings', () => {
      ruleTester.run('app-config-rows-cells-valid', rule, {
        valid: [],
        invalid: [
          {
            code: JSON.stringify({
              rows: {
                someRow: {
                  focusSettings: {
                    horizAnimSettings: 'invalid',
                  },
                },
              },
              cells: {},
              translations: { en: {} },
              theme: { colors: {}, fonts: {} },
              controls: {},
            }, null, 2),
            filename: 'app.config.json',
            errors: [
              {
                messageId: 'invalidPropertyValue',
                data: {
                  key: 'horizAnimSettings',
                },
              },
            ],
          },
        ],
      });
    });

    it('should report error for invalid property key in headerSettings', () => {
      ruleTester.run('app-config-rows-cells-valid', rule, {
        valid: [],
        invalid: [
          {
            code: JSON.stringify({
              rows: {
                someRow: {
                  headerSettings: {
                    invalidKey: 'value',
                    headerAppearance: 'onTop',
                  },
                },
              },
              cells: {},
              translations: { en: {} },
              theme: { colors: {}, fonts: {} },
              controls: {},
            }, null, 2),
            filename: 'app.config.json',
            errors: [
              {
                messageId: 'invalidPropertyKey',
                data: {
                  key: 'invalidKey',
                  context: 'row.headerSettings',
                },
              },
            ],
          },
        ],
      });
    });

    it('should report error for invalid enum value in headerAppearance', () => {
      ruleTester.run('app-config-rows-cells-valid', rule, {
        valid: [],
        invalid: [
          {
            code: JSON.stringify({
              rows: {
                someRow: {
                  headerSettings: {
                    headerAppearance: 'invalid',
                  },
                },
              },
              cells: {},
              translations: { en: {} },
              theme: { colors: {}, fonts: {} },
              controls: {},
            }, null, 2),
            filename: 'app.config.json',
            errors: [
              {
                messageId: 'invalidPropertyValue',
                data: {
                  key: 'headerAppearance',
                },
              },
            ],
          },
        ],
      });
    });

    it('should report error for missing required id in scenegraph node', () => {
      ruleTester.run('app-config-rows-cells-valid', rule, {
        valid: [],
        invalid: [
          {
            code: JSON.stringify({
              rows: {},
              cells: {
                someCell: {
                  views: {
                    base: [
                      {
                        subType: 'Poster',
                        width: 384,
                        height: 216,
                      },
                    ],
                  },
                },
              },
              translations: { en: {} },
              theme: { colors: {}, fonts: {} },
              controls: {},
            }, null, 2),
            filename: 'app.config.json',
            errors: [
              {
                messageId: 'missingRequiredField',
                data: {
                  field: 'id',
                  context: 'scenegraph node',
                },
              },
            ],
          },
        ],
      });
    });

    it('should report error for missing required subType in scenegraph node', () => {
      ruleTester.run('app-config-rows-cells-valid', rule, {
        valid: [],
        invalid: [
          {
            code: JSON.stringify({
              rows: {},
              cells: {
                someCell: {
                  views: {
                    base: [
                      {
                        id: 'poster',
                        width: 384,
                        height: 216,
                      },
                    ],
                  },
                },
              },
              translations: { en: {} },
              theme: { colors: {}, fonts: {} },
              controls: {},
            }, null, 2),
            filename: 'app.config.json',
            errors: [
              {
                messageId: 'missingRequiredField',
                data: {
                  field: 'subType',
                  context: 'scenegraph node',
                },
              },
            ],
          },
        ],
      });
    });

    it('should report error for invalid property key in scenegraph node', () => {
      ruleTester.run('app-config-rows-cells-valid', rule, {
        valid: [],
        invalid: [
          {
            code: JSON.stringify({
              rows: {},
              cells: {
                someCell: {
                  views: {
                    base: [
                      {
                        id: 'poster',
                        subType: 'Poster',
                        invalidKey: 'value',
                        width: 384,
                        height: 216,
                      },
                    ],
                  },
                },
              },
              translations: { en: {} },
              theme: { colors: {}, fonts: {} },
              controls: {},
            }, null, 2),
            filename: 'app.config.json',
            errors: [
              {
                messageId: 'invalidPropertyKey',
                data: {
                  key: 'invalidKey',
                  context: 'cell.views.base',
                },
              },
            ],
          },
        ],
      });
    });

    it('should report error for invalid enum value in Label horizAlign', () => {
      ruleTester.run('app-config-rows-cells-valid', rule, {
        valid: [],
        invalid: [
          {
            code: JSON.stringify({
              rows: {},
              cells: {
                someCell: {
                  views: {
                    base: [
                      {
                        id: 'label',
                        subType: 'Label',
                        width: 384,
                        height: 36,
                        text: 'Hello',
                        color: '#FFFFFF',
                        horizAlign: 'invalid',
                        vertAlign: 'top',
                        wrap: true,
                        maxLines: 2,
                        ellipsizeOnBoundary: true,
                        ellipsisText: '...',
                        opacity: 1.0,
                        visible: true,
                        translation: [0, 0],
                        scale: [1.0, 1.0],
                        rotation: 0,
                        scaleRotateCenter: [0, 0],
                      },
                    ],
                  },
                },
              },
              translations: { en: {} },
              theme: { colors: {}, fonts: {} },
              controls: {},
            }, null, 2),
            filename: 'app.config.json',
            errors: [
              {
                messageId: 'invalidPropertyValue',
                data: {
                  key: 'horizAlign',
                },
              },
            ],
          },
        ],
      });
    });

    it('should report error for invalid viewId reference in state override', () => {
      ruleTester.run('app-config-rows-cells-valid', rule, {
        valid: [],
        invalid: [
          {
            code: JSON.stringify({
              rows: {},
              cells: {
                someCell: {
                  views: {
                    base: [
                      {
                        id: 'poster',
                        subType: 'Poster',
                        width: 384,
                        height: 216,
                      },
                    ],
                    focused: {
                      nonexistentViewId: {
                        opacity: 1.0,
                      },
                    },
                  },
                },
              },
              translations: { en: {} },
              theme: { colors: {}, fonts: {} },
              controls: {},
            }, null, 2),
            filename: 'app.config.json',
            errors: [
              {
                messageId: 'invalidViewIdReference',
                data: {
                  viewId: 'nonexistentViewId',
                },
              },
            ],
          },
        ],
      });
    });

    it('should report error for invalid array length in cellSize', () => {
      ruleTester.run('app-config-rows-cells-valid', rule, {
        valid: [],
        invalid: [
          {
            code: JSON.stringify({
              rows: {
                someRow: {
                  cellSize: [200],
                },
              },
              cells: {},
              translations: { en: {} },
              theme: { colors: {}, fonts: {} },
              controls: {},
            }, null, 2),
            filename: 'app.config.json',
            errors: [
              {
                messageId: 'invalidPropertyValue',
                data: {
                  key: 'cellSize',
                },
              },
            ],
          },
        ],
      });
    });

    it('should report error for invalid array element type in cellSize', () => {
      ruleTester.run('app-config-rows-cells-valid', rule, {
        valid: [],
        invalid: [
          {
            code: JSON.stringify({
              rows: {
                someRow: {
                  cellSize: ['not-a-number', 150],
                },
              },
              cells: {},
              translations: { en: {} },
              theme: { colors: {}, fonts: {} },
              controls: {},
            }, null, 2),
            filename: 'app.config.json',
            errors: [
              {
                messageId: 'invalidPropertyValue',
                data: {
                  key: 'cellSize',
                },
              },
            ],
          },
        ],
      });
    });
  });

  describe('edge cases', () => {
    it('should not validate non-app.config.json files', () => {
      ruleTester.run('app-config-rows-cells-valid', rule, {
        valid: [
          {
            code: JSON.stringify({
              rows: {
                someRow: {
                  invalidKey: 'value',
                },
              },
            }),
            filename: 'other.json',
          },
        ],
        invalid: [],
      });
    });

    it('should handle empty rows and cells', () => {
      ruleTester.run('app-config-rows-cells-valid', rule, {
        valid: [
          {
            code: JSON.stringify({
              rows: {},
              cells: {},
              translations: { en: {} },
              theme: { colors: {}, fonts: {} },
              controls: {},
            }, null, 2),
            filename: 'app.config.json',
          },
        ],
        invalid: [],
      });
    });

    it('should handle missing rows or cells sections gracefully', () => {
      ruleTester.run('app-config-rows-cells-valid', rule, {
        valid: [
          {
            code: JSON.stringify({
              translations: { en: {} },
              theme: { colors: {}, fonts: {} },
              controls: {},
            }, null, 2),
            filename: 'app.config.json',
          },
        ],
        invalid: [],
      });
    });
  });
});
