import { Rule } from 'eslint';
import {
  CollectionViewRowSettingsFields,
  CollectionViewFocusSettingsFields,
  CollectionViewHeaderSettingsFields,
  getValidFieldNamesForSubType,
  getFieldDefinition,
  SceneGraphGroupFields,
} from '../utils/app-config-schema';
import {
  getContextAtPath,
  getSubTypeFromNode,
  getSubTypeFromCellBaseView,
} from '../utils/app-config-context';

/**
 * Find the position of a key in JSON text
 */
function findKeyPosition(
  text: string,
  jsonPath: string,
  key: string,
  usedPositions: Set<string>
): { line: number; column: number } | null {
  const lines = text.split('\n');
  const searchKey = JSON.stringify(key);

  // Parse jsonPath to get parent context
  const pathParts = jsonPath.split('.');
  const parentKey = pathParts.length > 1 ? pathParts[pathParts.length - 2] : null;

  // Search for the key with parent context
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let searchStart = 0;

    while (true) {
      const keyIndex = line.indexOf(searchKey, searchStart);
      if (keyIndex === -1) break;

      // Check if parent key appears before this match (for better context matching)
      const beforeMatch = line.substring(0, keyIndex);
      const hasParentContext = !parentKey || beforeMatch.includes(JSON.stringify(parentKey));

      if (hasParentContext) {
        const positionKey = `${i + 1}:${keyIndex}`;
        if (!usedPositions.has(positionKey)) {
          usedPositions.add(positionKey);
          return { line: i + 1, column: keyIndex + 1 };
        }
      }

      searchStart = keyIndex + 1;
    }
  }

  // Fallback: find any unused occurrence
  for (let i = 0; i < lines.length; i++) {
    const keyIndex = lines[i].indexOf(searchKey);
    if (keyIndex !== -1) {
      const positionKey = `${i + 1}:${keyIndex}`;
      if (!usedPositions.has(positionKey)) {
        usedPositions.add(positionKey);
        return { line: i + 1, column: keyIndex + 1 };
      }
    }
  }

  return null;
}

/**
 * Find the position of a value in JSON text
 */
function findValuePosition(
  text: string,
  jsonPath: string,
  value: any,
  usedPositions: Set<string>,
  key?: string
): { line: number; column: number } | null {
  const lines = text.split('\n');
  const searchValue = typeof value === 'string' ? JSON.stringify(value) : String(value);

  if (key) {
    const searchKey = JSON.stringify(key);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const keyIndex = line.indexOf(searchKey);
      if (keyIndex !== -1) {
        const afterKey = line.substring(keyIndex + searchKey.length);
        const colonIndex = afterKey.indexOf(':');
        if (colonIndex !== -1) {
          const valueStart = afterKey.substring(colonIndex + 1).trim();
          if (valueStart.startsWith(searchValue) || valueStart === searchValue) {
            const valueIndex = line.indexOf(searchValue, keyIndex);
            if (valueIndex !== -1) {
              const positionKey = `${i + 1}:${valueIndex}`;
              if (!usedPositions.has(positionKey)) {
                usedPositions.add(positionKey);
                return { line: i + 1, column: valueIndex + 1 };
              }
            }
          }
        }
      }
    }
  }

  // Fallback: find any unused occurrence
  for (let i = 0; i < lines.length; i++) {
    const index = lines[i].indexOf(searchValue);
    if (index !== -1) {
      const positionKey = `${i + 1}:${index}`;
      if (!usedPositions.has(positionKey)) {
        usedPositions.add(positionKey);
        return { line: i + 1, column: index + 1 };
      }
    }
  }

  return null;
}

/**
 * Validate property value type
 */
function validateValueType(
  value: any,
  fieldDef: { type: string; enumValues?: string[]; tupleTypes?: string[]; arrayItemType?: string }
): { valid: boolean; error?: string } {
  const { type, enumValues, tupleTypes, arrayItemType } = fieldDef;

  // Handle null/undefined - these are generally allowed for optional fields
  if (value === null || value === undefined) {
    return { valid: true };
  }

  // Type checking
  if (type === 'string') {
    if (typeof value !== 'string') {
      return { valid: false, error: `Expected string, got ${typeof value}` };
    }
    // Check enum values
    if (enumValues && !enumValues.includes(value)) {
      return {
        valid: false,
        error: `Invalid enum value "${value}". Allowed values: ${enumValues.join(', ')}`,
      };
    }
  } else if (type === 'number') {
    if (typeof value !== 'number') {
      return { valid: false, error: `Expected number, got ${typeof value}` };
    }
  } else if (type === 'boolean') {
    if (typeof value !== 'boolean') {
      return { valid: false, error: `Expected boolean, got ${typeof value}` };
    }
  } else if (type === 'array') {
    if (!Array.isArray(value)) {
      return { valid: false, error: `Expected array, got ${typeof value}` };
    }
    // Validate tuple types
    if (tupleTypes) {
      if (value.length !== tupleTypes.length) {
        return {
          valid: false,
          error: `Expected array of length ${tupleTypes.length}, got ${value.length}`,
        };
      }
      for (let i = 0; i < value.length; i++) {
        const expectedType = tupleTypes[i];
        if (expectedType === 'number' && typeof value[i] !== 'number') {
          return { valid: false, error: `Array element ${i} should be number, got ${typeof value[i]}` };
        }
        if (expectedType === 'string' && typeof value[i] !== 'string') {
          return { valid: false, error: `Array element ${i} should be string, got ${typeof value[i]}` };
        }
      }
    }
    // Validate array item type
    if (arrayItemType) {
      for (let i = 0; i < value.length; i++) {
        if (arrayItemType === 'string' && typeof value[i] !== 'string') {
          return { valid: false, error: `Array element ${i} should be string, got ${typeof value[i]}` };
        }
        if (arrayItemType === 'number' && typeof value[i] !== 'number') {
          return { valid: false, error: `Array element ${i} should be number, got ${typeof value[i]}` };
        }
      }
    }
  } else if (type === 'object') {
    if (typeof value !== 'object' || Array.isArray(value)) {
      return { valid: false, error: `Expected object, got ${typeof value}` };
    }
  }

  return { valid: true };
}

/**
 * Validate a property in rows/cells context
 */
function validateProperty(
  key: string,
  value: any,
  jsonPath: string,
  context: ReturnType<typeof getContextAtPath>,
  text: string,
  usedKeyPositions: Set<string>,
  usedValuePositions: Set<string>,
  ruleContext: Rule.RuleContext,
  node: Rule.Node,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fullConfig?: any
): void {
  let validKeys: Set<string>;
  let fieldDef: { type: string; enumValues?: string[]; tupleTypes?: string[]; arrayItemType?: string } | undefined;

  if (!context) {
    return;
  }

  // Determine which schema to use based on context
  if (context.type === 'rows') {
    validKeys = new Set(CollectionViewRowSettingsFields.map(f => f.name));
    fieldDef = CollectionViewRowSettingsFields.find(f => f.name === key);
  } else if (context.type === 'row.focusSettings') {
    validKeys = new Set(CollectionViewFocusSettingsFields.map(f => f.name));
    fieldDef = CollectionViewFocusSettingsFields.find(f => f.name === key);
  } else if (context.type === 'row.headerSettings') {
    validKeys = new Set(CollectionViewHeaderSettingsFields.map(f => f.name));
    fieldDef = CollectionViewHeaderSettingsFields.find(f => f.name === key);
  } else if (context.type === 'cells') {
    // Cells can have similar properties to rows, but also support ViewFragment style
    // For now, allow row settings fields plus view fragment fields
    validKeys = new Set([
      ...CollectionViewRowSettingsFields.map(f => f.name),
      'views',
      'id',
      'width',
      'height',
      'isResolutionApplied',
      '$supportsDataMap',
      'dataMap',
      'callbacks',
    ]);
    fieldDef = CollectionViewRowSettingsFields.find(f => f.name === key);
  } else if (context.type === 'cell.views.base') {
    // This is a scenegraph node - need to get subType first
    const subType = getSubTypeFromNode(value);
    if (subType) {
      validKeys = getValidFieldNamesForSubType(subType);
      fieldDef = getFieldDefinition(subType, key);
    } else {
      // If no subType, check common fields
      validKeys = new Set(['id', 'subType']);
      if (key === 'id' || key === 'subType') {
        fieldDef = { type: 'string' };
      }
    }
  } else if (context.type === 'cell.stateOverride') {
    // State overrides can contain any fields from the base view
    // Get the subType from the base view
    if (fullConfig && context.cellKey && context.viewId) {
      const subType = getSubTypeFromCellBaseView(fullConfig, context.cellKey, context.viewId);
      if (subType) {
        validKeys = getValidFieldNamesForSubType(subType);
        fieldDef = getFieldDefinition(subType, key);
      } else {
        // Fallback to common fields if subType not found
        validKeys = new Set([
          ...SceneGraphGroupFields.map(f => f.name),
          'width',
          'height',
          'uri',
          'text',
          'color',
          'fontKey',
          'horizAlign',
          'vertAlign',
          'wrap',
          'maxLines',
          'blendColor',
          'loadSync',
          'loadDisplayMode',
          'maskUri',
          'maskBitmapWidth',
          'maskBitmapHeight',
          'maskOffset',
          'maskSize',
        ]);
      }
    } else {
      // Fallback if we don't have full config
      validKeys = new Set([
        ...SceneGraphGroupFields.map(f => f.name),
        'width',
        'height',
        'uri',
        'text',
        'color',
        'fontKey',
        'horizAlign',
        'vertAlign',
        'wrap',
        'maxLines',
        'blendColor',
        'loadSync',
        'loadDisplayMode',
        'maskUri',
        'maskBitmapWidth',
        'maskBitmapHeight',
        'maskOffset',
        'maskSize',
      ]);
    }
  } else {
    return;
  }

  // Check if key is valid
  if (!validKeys.has(key)) {
    const position = findKeyPosition(text, jsonPath, key, usedKeyPositions);
    if (position) {
      ruleContext.report({
        node,
        loc: {
          start: { line: position.line, column: position.column },
          end: { line: position.line, column: position.column + key.length },
        },
        messageId: 'invalidPropertyKey',
        data: {
          key,
          context: context.type,
          validKeys: Array.from(validKeys).slice(0, 10).join(', '),
        },
      });
    }
    return;
  }

  // Validate value type if we have a field definition
  if (fieldDef) {
    const validation = validateValueType(value, fieldDef);
    if (!validation.valid) {
      const position = findValuePosition(text, jsonPath, value, usedValuePositions, key);
      if (position) {
        ruleContext.report({
          node,
          loc: {
            start: { line: position.line, column: position.column },
            end: {
              line: position.line,
              column: position.column + (typeof value === 'string' ? value.length : String(value).length),
            },
          },
          messageId: 'invalidPropertyValue',
          data: {
            key,
            error: validation.error || 'Invalid value',
          },
        });
      }
    }
  }
}

/**
 * Traverse and validate rows/cells objects
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function traverseAndValidate(
  obj: any,
  currentPath: string,
  text: string,
  usedKeyPositions: Set<string>,
  usedValuePositions: Set<string>,
  ruleContext: Rule.RuleContext,
  node: Rule.Node,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fullConfig: any
): void {
  if (obj === null || obj === undefined) {
    return;
  }

  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      const itemPath = currentPath ? `${currentPath}[${index}]` : `[${index}]`;
      const context = getContextAtPath(itemPath);
      
      // If this is a views.base array item, validate it as a scenegraph node
      if (context?.type === 'cell.views.base') {
        const subType = getSubTypeFromNode(item);
        if (subType) {
          // Validate required fields
          if (!item.id) {
            const position = findKeyPosition(text, itemPath, 'id', usedKeyPositions);
            if (position) {
              ruleContext.report({
                node,
                loc: { start: { line: position.line, column: position.column }, end: { line: position.line, column: position.column + 2 } },
                messageId: 'missingRequiredField',
                data: { field: 'id', context: 'scenegraph node' },
              });
            }
          }
          if (!item.subType) {
            const position = findKeyPosition(text, itemPath, 'subType', usedKeyPositions);
            if (position) {
              ruleContext.report({
                node,
                loc: { start: { line: position.line, column: position.column }, end: { line: position.line, column: position.column + 7 } },
                messageId: 'missingRequiredField',
                data: { field: 'subType', context: 'scenegraph node' },
              });
            }
          }
          
            // Validate all properties
            if (typeof item === 'object') {
              for (const [key, value] of Object.entries(item)) {
                validateProperty(key, value, itemPath, context, text, usedKeyPositions, usedValuePositions, ruleContext, node, fullConfig);
              }
            }
        }
      }
      
      // Recursively traverse nested structures
      if (typeof item === 'object') {
        traverseAndValidate(item, itemPath, text, usedKeyPositions, usedValuePositions, ruleContext, node, fullConfig);
      }
    });
    return;
  }

  if (typeof obj === 'object') {
    const context = getContextAtPath(currentPath);
    
    for (const [key, value] of Object.entries(obj)) {
      const newPath = currentPath ? `${currentPath}.${key}` : key;
      
      // Skip $extends - it's handled by another rule
      if (key === '$extends') {
        continue;
      }
      
      // Validate the property
      validateProperty(key, value, newPath, context, text, usedKeyPositions, usedValuePositions, ruleContext, node, fullConfig);
      
      // Recursively traverse nested objects/arrays
      if (typeof value === 'object' && value !== null) {
        traverseAndValidate(value, newPath, text, usedKeyPositions, usedValuePositions, ruleContext, node, fullConfig);
      }
    }
  }
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Validate property keys and values in rows and cells objects within app.config.json',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: undefined,
    schema: [],
    messages: {
      invalidPropertyKey: 'Invalid property key "{{key}}" in {{context}} context. Valid keys include: {{validKeys}}...',
      invalidPropertyValue: 'Invalid value for property "{{key}}": {{error}}',
      missingRequiredField: 'Missing required field "{{field}}" in {{context}}',
      invalidSubType: 'Invalid subType "{{subType}}". Must be one of: Poster, Rectangle, Group, Label, MaskGroup',
      invalidViewIdReference: 'State override references invalid viewId "{{viewId}}"',
    },
  },
  create: function (context) {
    // Only process app.config.json files
    const filename = context.filename || '';
    if (!filename.includes('assets/meta/app.config.json') && !filename.endsWith('app.config.json')) {
      return {};
    }

    return {
      Program: function (node) {
        const sourceCode = context.sourceCode;
        const text = sourceCode.text;

        // Parse JSON
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let jsonObj: any;
        try {
          jsonObj = JSON.parse(text);
        } catch {
          // JSON parse errors are handled by app-config-json-valid rule
          return;
        }

        // Only validate if rows and cells exist
        if (!jsonObj.rows || typeof jsonObj.rows !== 'object') {
          return;
        }
        if (!jsonObj.cells || typeof jsonObj.cells !== 'object') {
          return;
        }

        const usedKeyPositions = new Set<string>();
        const usedValuePositions = new Set<string>();

        // Validate rows
        traverseAndValidate(jsonObj.rows, 'rows', text, usedKeyPositions, usedValuePositions, context, node as unknown as Rule.Node, jsonObj);

        // Validate cells
        traverseAndValidate(jsonObj.cells, 'cells', text, usedKeyPositions, usedValuePositions, context, node as unknown as Rule.Node, jsonObj);

        // Validate state override viewId references
        if (jsonObj.cells && typeof jsonObj.cells === 'object') {
          for (const [cellKey, cellValue] of Object.entries(jsonObj.cells)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const cell = cellValue as any;
            if (cell?.views) {
              const baseViews = cell.views.base;
              if (Array.isArray(baseViews)) {
                const baseViewIds = new Set(baseViews.map((v: any) => v?.id).filter(Boolean));
                
                // Check state overrides
                for (const state of ['normal', 'focused', 'disabled', 'selected']) {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const stateOverrides = (cell.views as any)[state];
                  if (stateOverrides && typeof stateOverrides === 'object') {
                    for (const [viewId] of Object.entries(stateOverrides)) {
                      if (!baseViewIds.has(viewId)) {
                        const jsonPath = `cells.${cellKey}.views.${state}.${viewId}`;
                        const position = findKeyPosition(text, jsonPath, viewId, usedKeyPositions);
                        if (position) {
                          context.report({
                            node,
                            loc: {
                              start: { line: position.line, column: position.column },
                              end: { line: position.line, column: position.column + viewId.length },
                            },
                            messageId: 'invalidViewIdReference',
                            data: { viewId },
                          });
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
    };
  },
};

export default rule;
