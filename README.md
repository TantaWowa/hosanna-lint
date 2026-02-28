# @tantawowa/hosanna-eslint-plugin

A custom ESLint plugin for Hosanna UI that enforces coding conventions and architectural patterns essential for optimal performance on Roku and other platforms.

## Purpose

This plugin provides specialized linting rules that help maintain code quality and performance characteristics specific to the Hosanna UI framework. It enforces patterns that:

- Ensure optimal performance on Roku devices
- Provide transpile guardrails to prevent platform-specific issues
- Maintain architectural consistency across Hosanna UI projects
- Prevent direct imports of generated code that could cause runtime issues

## Installation

```bash
npm install @tantawowa/hosanna-eslint-plugin --save-dev
```

## Usage

### Recommended Configuration

For the best experience, use the recommended configuration which enables all rules with appropriate severity levels:

```javascript
// eslint.config.mjs
import hosannaPlugin from '@tantawowa/hosanna-eslint-plugin';

export default [
  // ... other config
  hosannaPlugin.configs.recommended,
];
```

### Manual Configuration

Alternatively, you can manually configure individual rules:

```javascript
// eslint.config.mjs
import hosannaPlugin from '@tantawowa/hosanna-eslint-plugin';

export default [
  // ... other config
  {
    plugins: {
      '@hosanna-eslint': hosannaPlugin,
    },
    rules: {
      '@hosanna-eslint/no-hosanna-generated-imports': 'error',
      '@hosanna-eslint/hosanna-import-prefix': 'error',
      // ... add other rules as needed
    },
  },
];
```

**Note:** New rules are automatically included in the recommended configuration, so you only need to update your ESLint config when you want to change severity levels or disable specific rules.

### Type-Aware Rules

Some rules (e.g. `no-unsafe-number-parsing`) use TypeScript type information when available for more precise detection. To enable type-awareness, configure your ESLint setup with `parserOptions.project` or `parserOptions.projectService` so the TypeScript parser can provide type information. Without this, the rules fall back to AST-only analysis.

### IDE / Editor Integration

To see ESLint diagnostics (including `no-unsafe-number-parsing` / HS-1105) in the editor:

1. **Install the ESLint extension** (e.g. "ESLint" by Microsoft in VS Code / Cursor).
2. **Ensure your project uses the plugin**:

```javascript
// eslint.config.mjs (flat config)
import hosannaPlugin from '@tantawowa/hosanna-eslint-plugin';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: { '@hosanna-eslint': hosannaPlugin },
    rules: { ...hosannaPlugin.configs.recommended.rules },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  }
);
```

3. **Monorepo / local development**: If using the plugin via `workspace:*` or `link:`, run `npm run build` in the plugin package so the consuming project uses the latest build.

## Rules

This plugin provides **67 specialized ESLint rules** organized by category to ensure Hosanna UI code quality and platform compatibility.

### Performance Impact Key

Each rule is tagged with its performance impact:

- **LOW** - Pure AST traversal, negligible overhead (<1ms per file)
- **MEDIUM** - Requires TypeScript type checker via parserServices (~50-200ms added per file when type-checking is enabled; shared across all type-aware rules)
- **HIGH** - Cross-file analysis, may add seconds to large projects

**Note:** MEDIUM rules share the type-checker cost. If you already use any type-aware rule, adding more MEDIUM rules has minimal marginal cost.

### 📦 Import/Export Rules

#### `hosanna-import-prefix` [LOW]
**Error level:** `error`

Requires all imports from hosanna packages to use the `@hs-src/` prefix, including relative imports.

**Example violations:**
```typescript
// ❌ Bad - missing @hs-src/ prefix
import { Button } from 'hosanna-ui/views/controls/Button';

// ✅ Good - proper @hs-src/ prefix
import { Button } from '@hs-src/hosanna-ui/views/controls/Button';
```

#### `hosanna-import-prefix`
**Error level:** `error`

Requires all imports from hosanna packages to use the `@hs-src/` prefix, including relative imports.

**Example violations:**
```typescript
// ❌ Bad - missing @hs-src/ prefix
import { Button } from 'hosanna-ui/views/controls/Button';

// ✅ Good - proper @hs-src/ prefix
import { Button } from '@hs-src/hosanna-ui/views/controls/Button';
```

#### `no-hosanna-generated-imports` [LOW]
**Error level:** `error`

Prevents direct imports from generated files to avoid circular dependencies and runtime failures.

**Example violations:**
```typescript
// ❌ Bad - direct import from generated files
import { ButtonViewStruct } from '@hs-generated/hosanna-ui/views/controls/Button/Button-generated-struct';

// ✅ Good - import from framework APIs instead
import { Button } from '@hs-src/hosanna-ui/views/controls/Button';
```

#### `no-json-imports` [LOW]
**Error level:** `error`

Disallows JSON imports as they are not supported in Hosanna/BrightScript and can severely impact performance.

**Auto-fix:** Suggests `JSON.parse(ReadAsciiFile(...))` pattern.

#### `no-export-aliasing` [LOW]
**Error level:** `error`

Disallows export aliasing (`export =`) as it is not supported in Hosanna.

**Example violations:**
```typescript
// ❌ Bad - export aliasing
export = myFunction;
const myClass = class {}; export = myClass;

// ✅ Good - use named exports
export { myFunction };
export default myFunction;
```

#### `no-import-extensions` [LOW]
**Error level:** `warn`

Disallows `.js` and `.ts` extensions in import paths.

**Auto-fix:** Removes the file extension.

**Example violations:**
```typescript
// ❌ Bad - includes file extension
import { foo } from './utils/helper.js';
import config from '../config/config.ts';

// ✅ Good - no file extensions
import { foo } from './utils/helper';
import config from '../config/config';
```

### 🔧 Function/Expression Rules

#### `no-await-expression` [LOW]
**Error level:** `error`

Disallows `await` expressions since async/await is not supported in Hosanna/BrightScript.

#### `promise-static-polyfilled` [LOW]
**Error level:** `warn`

Warns when using Promise static methods (`resolve`, `reject`, `all`, `race`, `allSettled`, `any`) or `new Promise()` — these are polyfilled by HsPromise in Hosanna/Roku. Use `HsPromise` from `@hs-src/hosanna-bridge-lib/Promises` for clarity.

#### `no-unsupported-promise-methods` [LOW]
**Error level:** `error`

Disallows unsupported Promise static and instance methods. HsPromise only supports: static — `resolve`, `reject`, `all`, `race`, `allSettled`, `any`; instance — `then`, `catch`, `finally`. For example, `Promise.withResolvers()` is not supported.

#### `no-call-on-anonymous-function` [LOW]
**Error level:** `error`

Disallows calls on anonymous function expressions as they may lack type information.

**Example violations:**
```typescript
// ❌ Bad - direct call on anonymous function
(function() { return 42; })();
(function(x) { return x * 2; })(5);

// ✅ Good - assign to variable first or use arrow functions
const myFunc = function() { return 42; };
myFunc();
```

#### `no-iife-usage` [LOW]
**Error level:** `error`

Disallows Immediately Invoked Function Expressions as they are not supported in Hosanna.

**Example violations:**
```typescript
// ❌ Bad - IIFE not supported
(function() { console.log('IIFE'); })();
(() => { console.log('arrow IIFE'); })();

// ✅ Good - assign to variable first
const myFunc = () => { console.log('not IIFE'); };
myFunc();
```

#### `no-nested-functions` [LOW]
**Error level:** `error`

Disallows nested function declarations to maintain clean code structure.

**Example violations:**
```typescript
// ❌ Bad - nested function
function outer() {
  function inner() { // Not allowed
    return 42;
  }
}

// ✅ Good - module-level functions
function outer() { return 42; }
function inner() { return 24; }
```

#### `no-function-expression-on-anonymous-object` [LOW]
**Error level:** `error`

Disallows function expressions in object literals (anonymous objects).

**Example violations:**
```typescript
// ❌ Bad - function expression in object literal
const obj = {
  method: function() { return 42; }
};

// ✅ Good - use arrow functions or method syntax
const obj = {
  method: () => 42,
  method2() { return 42; }
};
```

#### `no-function-reference-outside-module` [LOW]
**Error level:** `error`

Detects function references assigned to variables outside modules or classes.

**Example violations:**
```typescript
// ❌ Bad - function reference at top level
const myFunc = function() { return 42; };

// ✅ Good - inside class or use arrow function
class MyClass {
  myFunc = () => 42;
}
```

#### `no-async-function-pointer-invalid-reference` [LOW]
**Error level:** `error`

Ensures `AsyncFunctionPointer` type only accepts exported function declarations. Disallows class methods, anonymous functions, arrow functions, and inline functions.

**Example violations:**
```typescript
// ❌ Bad - arrow function
const fn: AsyncFunctionPointer = () => {};

// ❌ Bad - function expression
const fn: AsyncFunctionPointer = function() {};

// ❌ Bad - class method
class MyClass {
  method() {}
}
const instance = new MyClass();
const fn: AsyncFunctionPointer = instance.method;

// ❌ Bad - non-exported function
function handler() {}
const fn: AsyncFunctionPointer = handler;
```

**Example valid usage:**
```typescript
// ✅ Good - exported function declaration
export function handler() {}
const fn: AsyncFunctionPointer = handler;

// ✅ Good - exported default function
export default function handler() {}
const fn: AsyncFunctionPointer = handler;

// ✅ Good - named export
function handler() {}
export { handler };
const fn: AsyncFunctionPointer = handler;
```

### 📄 Configuration File Rules

#### `app-config-json-valid` [LOW]
**Error level:** `error`

Validates `app.config.json` files (located at `assets/meta/app.config.json`) to ensure proper structure, file path validity, and JSON reference correctness.

**Validations performed:**
- Checks for required sections: `rows`, `translations`, `cells`, `theme`, `controls`
- Ensures `translations` contains at least `"en"` key
- Ensures `theme` contains `colors` and `fonts` objects
- Validates all `pkg:/assets/...` paths exist in the project's `assets` folder
- Validates all `~path.to.json` references exist in the JSON structure
- Validates all `$extends` references point to valid JSON paths

**Example violations:**
```json
{
  // ❌ Bad - missing rows section
  "translations": { "en": {} },
  "cells": {},
  "theme": { "colors": {}, "fonts": {} },
  "controls": {}
}
```

```json
{
  "rows": {},
  // ❌ Bad - missing "en" in translations
  "translations": { "es": {} },
  "cells": {},
  "theme": { "colors": {}, "fonts": {} },
  "controls": {}
}
```

```json
{
  "rows": {},
  "translations": { "en": {} },
  "cells": {},
  "theme": {
    "colors": {},
    // ❌ Bad - missing fonts in theme
  },
  "controls": {}
}
```

```json
{
  "theme": {
    "fonts": {
      // ❌ Bad - file doesn't exist
      "heading": "pkg:/assets/fonts/nonexistent.ttf, 24"
    }
  }
}
```

```json
{
  "controls": {
    "Button": {
      "default": {
        // ❌ Bad - reference doesn't exist
        "color": "~theme.colors.nonexistent"
      }
    }
  }
}
```

```json
{
  "controls": {
    "Button": {
      "default": {
        // ❌ Bad - $extends path doesn't exist
        "$extends": "controls.Label.nonexistent"
      }
    }
  }
}
```

**Example valid usage:**
```json
{
  "rows": {},
  "translations": {
    "en": {
      "home": { "title": "Welcome" }
    }
  },
  "cells": {},
  "theme": {
    "colors": {
      "white": "#FFFFFF"
    },
    "fonts": {
      "heading": "pkg:/assets/fonts/Poppins-SemiBold.ttf, 24"
    }
  },
  "controls": {
    "Label": {
      "default": {
        "color": "~theme.colors.white",
        "fontKey": "~theme.fonts.heading"
      }
    },
    "Button": {
      "default": {
        "$extends": "controls.Label.default",
        "backgroundColor": "#000000"
      }
    }
  }
}
```

#### `app-config-style-key-valid` [LOW]
**Error level:** `error`

Validates that style key properties (`styleKey`, `fontKey`, `fontStyleKey`, `settingsKey`, `cellSettingsKey`, `loadingCellStyleKey`) reference valid paths in `app.config.json`. Works with object literals, assignment expressions, and complex expressions (ternary, null coalescing, logical OR).

**Validations performed:**
- Validates `styleKey`, `fontKey`, `fontStyleKey`, `settingsKey`, `cellSettingsKey`, and `loadingCellStyleKey` properties in object literals
- Validates these properties in assignment expressions (e.g., `obj.styleKey = "path"`)
- Extracts and validates string literals from ternary operators, null coalescing (`??`), and logical OR (`||`) expressions
- Checks that referenced paths exist in `app.config.json` using dot-notation (e.g., `"theme.colors.primary"`)

**Example violations:**
```typescript
// ❌ Bad - invalid path in object literal
const obj = {
  styleKey: "theme.colors.invalid"
};

// ❌ Bad - invalid path in assignment
obj.styleKey = "invalid.path";

// ❌ Bad - invalid path in ternary operator
obj.styleKey = condition ? "theme.colors.primary" : "invalid.path";

// ❌ Bad - invalid path in null coalescing
obj.styleKey = value ?? "invalid.path";

// ❌ Bad - invalid path in logical OR
obj.styleKey = value || "invalid.path";
```

**Example valid usage:**
```typescript
// ✅ Good - valid path in object literal
const obj = {
  styleKey: "theme.colors.primary",
  fontKey: "theme.fonts.main",
  fontStyleKey: "theme.fonts.main",
  settingsKey: "styles.default"
};

// ✅ Good - valid path in assignment
obj.styleKey = "theme.colors.secondary";

// ✅ Good - valid paths in ternary operator
obj.styleKey = condition ? "theme.colors.primary" : "theme.colors.secondary";

// ✅ Good - valid path in null coalescing
obj.styleKey = value ?? "theme.colors.primary";

// ✅ Good - valid path in logical OR
obj.styleKey = value || "theme.colors.primary";
```

#### `app-config-get-valid` [LOW]
**Error level:** `error`

Validates that `appConfig.get()` and `appConfig.get<Type>()` calls reference valid paths in `app.config.json`.

**Validations performed:**
- Validates `appConfig.get("path.to.key")` calls
- Validates `appConfig.get<Type>("path.to.key")` calls with type parameters
- Validates `obj.appConfig.get("path.to.key")` calls (member expressions)
- Validates simple template literals (without expressions)
- Skips validation for non-string literal arguments (variables, function calls, etc.)

**Example violations:**
```typescript
// ❌ Bad - invalid path in appConfig.get()
const color = appConfig.get("theme.colors.invalid");

// ❌ Bad - invalid path in appConfig.get<Type>()
const font = appConfig.get<string>("theme.fonts.invalid");

// ❌ Bad - invalid path in member expression
const style = someObj.appConfig.get("invalid.path");
```

**Example valid usage:**
```typescript
// ✅ Good - valid path in appConfig.get()
const color = appConfig.get("theme.colors.primary");

// ✅ Good - valid path in appConfig.get<Type>()
const font = appConfig.get<string>("theme.fonts.main");

// ✅ Good - valid path in member expression
const style = someObj.appConfig.get("styles.default");

// ✅ Good - skipped for non-string literals (no validation)
const dynamicKey = appConfig.get(someVariable);
const computedKey = appConfig.get(`theme.colors.${key}`); // Template with expressions skipped
```

#### `app-config-rows-cells-valid` [LOW]
**Error level:** `error`

Validates property keys and values in `rows` and `cells` objects within `app.config.json` files. This rule ensures that:

- Property keys in `rows` and `cells` objects are valid according to the CollectionView API schema
- Property values match their expected types (string, number, boolean, array, object)
- Enum values are valid (e.g., `focusStrategy`, `headerAppearance`, `horizAnimSettings`)
- Nested structures (`focusSettings`, `headerSettings`) are validated
- Scenegraph nodes in `views.base` arrays have valid properties based on their `subType`
- State overrides (`normal`, `focused`, `disabled`, `selected`) reference valid `viewId`s
- Required fields are present (e.g., `id` and `subType` in scenegraph nodes)

**Validations performed:**
- Validates all properties in `rows` objects against `ICollectionViewRowSettings` schema
- Validates all properties in `cells` objects (including ViewFragment style properties)
- Validates nested `focusSettings` properties against `ICollectionViewFocusSettings` schema
- Validates nested `headerSettings` properties against `ICollectionViewHeaderSettings` schema
- Validates scenegraph nodes in `cells.*.views.base` arrays (Poster, Rectangle, Group, Label, MaskGroup)
- Validates state override properties match their base view schemas
- Checks that state override `viewId`s exist in the corresponding `views.base` array

**Example violations:**
```json
{
  "rows": {
    "someRow": {
      // ❌ Bad - invalid property key
      "invalidKey": "value",
      
      // ❌ Bad - invalid enum value
      "focusStrategy": "invalidStrategy",
      
      // ❌ Bad - wrong type (should be number)
      "height": "not-a-number",
      
      "focusSettings": {
        // ❌ Bad - invalid property key in focusSettings
        "invalidKey": "value",
        
        // ❌ Bad - invalid enum value
        "horizAnimSettings": "invalid"
      },
      
      "headerSettings": {
        // ❌ Bad - invalid enum value
        "headerAppearance": "invalid"
      }
    }
  },
  "cells": {
    "someCell": {
      "views": {
        "base": [
          {
            // ❌ Bad - missing required id field
            "subType": "Poster",
            "width": 384
          },
          {
            "id": "label",
            // ❌ Bad - missing required subType field
            "width": 384,
            "height": 36
          },
          {
            "id": "poster",
            "subType": "Poster",
            // ❌ Bad - invalid property key for Poster
            "invalidKey": "value"
          },
          {
            "id": "label",
            "subType": "Label",
            // ❌ Bad - invalid enum value
            "horizAlign": "invalid"
          }
        ],
        "focused": {
          // ❌ Bad - viewId doesn't exist in views.base
          "nonexistentViewId": {
            "opacity": 1.0
          }
        }
      }
    }
  }
}
```

**Example valid usage:**
```json
{
  "rows": {
    "someRow": {
      "height": 100,
      "spacing": 10,
      "cellSize": [200, 150],
      "focusStrategy": "focusOnPreviousItem",
      "focusSettings": {
        "horizAnimSettings": "floating",
        "vertAnimSettings": "fixed",
        "canLongPress": true,
        "hideFocusIndicator": false,
        "indicatorImageUri": "pkg:/assets/images/focus.png",
        "indicatorBlendColor": "#ffffff",
        "feedbackOffsets": [4, 4, -4, -4],
        "focusedScale": 1.05
      },
      "headerSettings": {
        "headerAppearance": "onTop",
        "height": 51,
        "fontKey": "~theme.fonts.text-medium-24",
        "textColor": "#FFFFFF",
        "backgroundColor": "#000000",
        "backgroundOpacity": 0.8,
        "backgroundVisible": true
      }
    }
  },
  "cells": {
    "someCell": {
      "views": {
        "base": [
          {
            "id": "poster",
            "subType": "Poster",
            "width": 384,
            "height": 216,
            "uri": "${data.imageUrl}",
            "opacity": 1.0,
            "visible": true,
            "translation": [0, 0],
            "scale": [1.0, 1.0],
            "rotation": 0,
            "scaleRotateCenter": [0, 0]
          },
          {
            "id": "label",
            "subType": "Label",
            "width": 384,
            "height": 36,
            "text": "${data.title}",
            "color": "~theme.colors.white",
            "fontKey": "~theme.fonts.text-regular-20",
            "horizAlign": "left",
            "vertAlign": "top",
            "wrap": true,
            "maxLines": 2,
            "ellipsizeOnBoundary": true,
            "ellipsisText": "...",
            "opacity": 1.0,
            "visible": true,
            "translation": [0, 180],
            "scale": [1.0, 1.0],
            "rotation": 0,
            "scaleRotateCenter": [0, 0]
          }
        ],
        "normal": {
          "poster": {
            "opacity": 0.8
          }
        },
        "focused": {
          "poster": {
            "opacity": 1.0,
            "scale": [1.05, 1.05]
          },
          "label": {
            "fontKey": "~theme.fonts.text-bold-24",
            "color": "~theme.colors.red"
          }
        }
      }
    }
  }
}
```

#### `no-closure-variable-modification` [LOW]
**Error level:** `error`

Detects modification of closure variables within nested functions.

**Example violations:**
```typescript
// ❌ Bad - modifying closure variable
let counter = 0;
function increment() {
  counter = counter + 1; // Modifies closure variable
}
```

### 🛠️ Language Feature Rules

#### `no-union-expression-in-non-statement` [LOW]
**Error level:** `error`

Restricts `++` and `--` operators to only be used as statements or on property access expressions.

**Example violations:**
```typescript
// ❌ Bad - increment/decrement in expressions
let x = y++;
const result = count--;
func(x++);

// ✅ Good - use as statements or on properties
x++;
y--;
this.value++;
obj.counter--;
```

#### `no-non-null-on-call-expression` [LOW]
**Error level:** `error`

Disallows non-null operator (`!`) on call expressions.

**Auto-fix:** Suggests optional chaining (`?.`).

**Example violations:**
```typescript
// ❌ Bad - non-null on call
const result = getValue()!;

// ✅ Good - use optional chaining
const result = getValue()?.defaultValue;
```

### 🔌 API/Built-in Rules

#### `no-console-methods` [LOW]
**Error level:** `error`

Disallows console method calls since they're not supported in BrightScript.

**Auto-fix:** Removes console calls.

**Example violations:**
```typescript
// ❌ Bad - console methods
console.log('debug message');
console.error('error');
```

#### `no-unsupported-array-methods` [LOW]
**Error level:** `error`

Disallows unsupported Array prototype methods like `find`, `includes`, `flat`, etc.

**Example violations:**
```typescript
// ❌ Bad - unsupported methods
arr.find(item => item > 2);
arr.includes(5);
arr.flat();
```

#### `no-unsupported-string-methods` [LOW]
**Error level:** `error`

Disallows unsupported String static methods.

#### `no-date-usage` [LOW]
**Error level:** `error`

Disallows Date constructor and static methods since Date objects are not supported.

**Auto-fix:** Suggests `HsDate` replacement.

#### `no-epsilon-usage` [LOW]
**Error level:** `error`

Disallows `Number.EPSILON` usage.

**Auto-fix:** Replaces with `0.0000001`.

#### `no-number-isnan` [LOW]
**Error level:** `error`

Disallows `Number.isNaN()` usage.

**Auto-fix:** Replaces with global `isNaN()`.

#### `no-isnan-emulated` [LOW]
**Error level:** `warn`

Warns about `isNaN()` usage since it's emulated on BrightScript and may be unreliable.

### 📝 Type/Syntax Rules

#### `no-ts-module-declarations` [LOW]
**Error level:** `error`

Disallows TypeScript module declarations and blocks since they're not supported.

**Example violations:**
```typescript
// ❌ Bad - module declarations
declare module 'myModule' { export const value: string; }
module MyModule { export const value = 42; }
```

#### `no-inline-classes` [LOW]
**Error level:** `error`

Disallows class declarations inside functions since classes must be at module level.

#### `no-computed-properties-in-objects` [LOW]
**Error level:** `error`

Restricts computed property keys in object literals to enums and literals only.

#### `no-reserved-words` [LOW]
**Error level:** `error`

Disallows BrightScript reserved words as variable or function names.

**Example violations:**
```typescript
// ❌ Bad - using reserved words
const if = 42;
function end() { return 'done'; }
let function = 'test';
```

### 🔒 Data/Safety Rules

#### `no-unsafe-number-parsing` [MEDIUM]
**Error level:** `warn` | **HS-1105**

Flags `Number()`, `parseInt()`, `parseFloat()`, and `.toFixed()` calls without NaN handling. Uses TypeScript type info when available for precision.

#### `no-large-numeric-literals` [LOW]
**Error level:** `warn` | **HS-1075**

Warns about numeric literals exceeding Roku's safe integer limit (2147483647).

### 🆕 BrightScript Limits Rules

#### `no-infinity-usage` [LOW]
**Error level:** `warn` | **HS-1038**

Infinity is not supported in BrightScript and is transpiled as MAXINT (2147483647).

```typescript
// ❌ Bad
const x = Infinity;
const y = Number.POSITIVE_INFINITY;

// ✅ Good
const x = 2147483647;
```

#### `no-too-many-if-else` [LOW]
**Error level:** `error` | **HS-1002**

BrightScript only supports up to 250 if-else clauses in a chain.

#### `no-too-many-switch-cases` [LOW]
**Error level:** `error` | **HS-1003**

BrightScript only supports up to 255 switch cases.

#### `no-logical-expression-limit` [LOW]
**Error level:** `error` | **HS-1036**

BrightScript only allows up to 32 operands in a logical expression. Split into variables or use if statements.

#### `no-too-many-nots` [LOW]
**Error level:** `error` | **HS-1060**

More than 3 sequential `!` operators is not supported in BrightScript.

```typescript
// ❌ Bad
const x = !!!!value;

// ✅ Good
const x = !!!value;
```

#### `no-unsupported-compound-assignment` [LOW]
**Error level:** `error` | **HS-1039**

BrightScript only supports `=`, `+=`, `-=`, `*=`, `/=` assignment operators.

```typescript
// ❌ Bad
x ||= 1;
x &&= true;
x ??= 'default';
x **= 2;
x %= 3;

// ✅ Good
x += 1;
x -= 1;
x *= 2;
x /= 2;
```

### 🆕 API Restriction Rules

#### `no-object-prototype` [LOW]
**Error level:** `error` | **HS-1077**

Object.prototype functions and fields are not supported in BrightScript.

```typescript
// ❌ Bad
Object.prototype.hasOwnProperty.call(obj, 'key');

// ✅ Good
obj.hasOwnProperty('key');
```

#### `no-buffer-api` [LOW]
**Error level:** `error` | **HS-1085**

Node.js Buffer API is not supported. Use HsCrypto instead.

```typescript
// ❌ Bad
Buffer.from('hello');
new Buffer('data');

// ✅ Good
HsCrypto.base64Encode('hello');
```

#### `no-crypto-api` [LOW]
**Error level:** `error` | **HS-1086**

Web/Node crypto API is not supported. Use HsCrypto instead.

```typescript
// ❌ Bad
crypto.getRandomValues(arr);
window.crypto.subtle.digest('SHA-256', data);

// ✅ Good
HsCrypto.getRandomValues(arr);
HsCrypto.sha256(data);
```

#### `no-json-stringify-replacer` [LOW]
**Error level:** `error` | **HS-1096**

The "replacer" parameter of JSON.stringify is not supported on Roku devices.

```typescript
// ❌ Bad
JSON.stringify(obj, replacer);
JSON.stringify(obj, (key, value) => value);

// ✅ Good
JSON.stringify(obj);
JSON.stringify(obj, null);
```

#### `no-unsupported-object-methods` [LOW]
**Error level:** `error` | **HS-1050/1051**

Unsupported Object static methods. Supported: `keys`, `values`, `entries`, `assign`, `defineProperty`, `defineProperties`, `getOwnPropertyNames`.

```typescript
// ❌ Bad
Object.create(null);
Object.freeze(obj);
Object.is(a, b);

// ✅ Good
Object.keys(obj);
Object.assign({}, obj);
```

#### `no-unsupported-math-methods` [LOW]
**Error level:** `error` | **HS-1108**

Flags unsupported Math methods. All standard trig, rounding, and utility methods are supported.

#### `no-unsupported-number-static-methods` [LOW]
**Error level:** `error` | **HS-1064**

Unsupported Number static methods. Supported: `isFinite`, `isInteger`, `isNaN`, `isSafeInteger`, `parseFloat`, `parseInt`, `toString`.

#### `no-unsupported-json-functions` [LOW]
**Error level:** `error` | **HS-1045**

Only `JSON.parse` and `JSON.stringify` are supported.

#### `no-interface-computed-property` [LOW]
**Error level:** `error` | **HS-1080**

Computed property names are not allowed in interface declarations.

```typescript
// ❌ Bad
interface IExample { [MyEnum.Key]: string; }

// ✅ Good
interface IExample { myField: string; }
```

#### `no-argument-binding` [LOW]
**Error level:** `error` | **HS-1071**

`.bind()` with argument binding (more than 1 argument) is not supported. Only `.bind(thisArg)` is allowed.

```typescript
// ❌ Bad
fn.bind(this, 1, 2);

// ✅ Good
fn.bind(this);
```

#### `no-for-in-on-array` [LOW]
**Error level:** `warn` | **HS-1033**

`for...in` is discouraged in BrightScript. Use `for...of` for values or a numeric `for` loop for indices.

#### `no-find-node-method` [LOW]
**Error level:** `warn` | **HS-1076**

Avoid using `.findNode()` directly. Import and use the `findNode` utility from utils to avoid Roku SceneGraph bugs.

#### `no-unsupported-destructuring-context` [LOW]
**Error level:** `error` | **HS-1040/1041**

Destructuring is only supported in function parameters and variable declarations.

```typescript
// ❌ Bad
({ a, b } = obj);

// ✅ Good
const { a, b } = obj;
function foo({ a, b }) {}
```

### 🆕 Type-Aware Rules (require TypeScript type checker)

#### `no-for-of-on-non-array` [MEDIUM]
**Error level:** `error` | **HS-1014**

BrightScript only supports `for...of` on arrays. Flags iteration over Map, Set, and other non-array iterables.

#### `no-basic-type-binary-comparison` [MEDIUM]
**Error level:** `error` | **HS-1019**

Only basic types (string, number, boolean) are supported for binary comparisons in BrightScript. Comparing objects requires IHsIdentifiable or field comparison.

#### `no-function-typed-as-any` [MEDIUM]
**Error level:** `error` | **HS-1034**

Function parameters typed as `any` generate unsafe transpiler output. Provide specific types.

```typescript
// ❌ Bad
function foo(cb: any) {}

// ✅ Good
function foo(cb: () => void) {}
```

#### `no-suboptimal-array-access` [MEDIUM]
**Error level:** `warn` | **HS-1042/1043/1044**

Warns about member access patterns that cause runtime type coercion (e.g., accessing arrays with string keys, objects with numeric keys).

#### `no-string-method-on-non-string` [MEDIUM]
**Error level:** `warn` | **HS-1106**

Warns when calling string methods on a non-string type.

#### `no-number-method-on-non-number` [MEDIUM]
**Error level:** `warn` | **HS-1107**

Warns when calling number methods (e.g., `.toFixed()`) on a non-number type.

#### `no-static-member-access-with-this` [LOW]
**Error level:** `error` | **HS-1056**

Disallows accessing static class members via `this`. Use `ClassName.staticMember` instead.

```typescript
// ❌ Bad
class Foo {
  static bar = 1;
  method() { this.bar; }
}

// ✅ Good
class Foo {
  static bar = 1;
  method() { Foo.bar; }
}
```

#### `no-typeof-brs-node-method` [MEDIUM]
**Error level:** `warn` | **HS-1103**

`typeof` on a method of ISGROSGNode or IBrsNode can crash at runtime on Roku.

#### `no-comparison-brs-node-method` [MEDIUM]
**Error level:** `warn` | **HS-1104**

Comparing a method of ISGROSGNode or IBrsNode can crash at runtime on Roku.

#### `no-recursion-in-logical-expression` [LOW]
**Error level:** `warn` | **HS-1037**

Warns about function calls in short-circuit logical assignments that could cause recursion.

```typescript
// ❌ Warn
x = x || getValue();

// ✅ Good
x = x || defaultValue;
```

### 🆕 Class/Interface Analysis Rules

#### `no-case-insensitive-class-collision` [LOW]
**Error level:** `error` | **HS-1020**

BrightScript class methods and fields must be case-insensitively unique.

```typescript
// ❌ Bad
class Foo {
  getValue() {}
  GetValue() {} // Collision!
}
```

#### `no-duplicate-class-name` [HIGH]
**Error level:** `error` | **HS-1063**

Class names must be unique across the whole project (BrightScript limitation).

#### `no-getter-setter-mismatch` [MEDIUM]
**Error level:** `error` | **HS-1057**

Class members and their interface definitions must have the same kind (getter/setter vs property).

#### `no-vague-state-field-usage` [HIGH]
**Error level:** `warn` | **HS-1073**

Warns about accessing state/observable/annotated fields through interfaces, which may cause performance issues or crashes in setters/getters.

#### `no-vague-computed-access` [HIGH]
**Error level:** `warn` | **HS-1081**

Warns about computed property access (`obj[key]`) on types that have getters/setters/annotated fields.

### 📋 Recommended Configuration

For optimal Hosanna development, we recommend this configuration:

```javascript
// eslint.config.mjs
import hosannaPlugin from '@tantawowa/hosanna-eslint-plugin';

export default [
  // ... other config
  {
    plugins: {
      '@hosanna-eslint': hosannaPlugin,
    },
    rules: {
      // Import/Export rules
      '@hosanna-eslint/hosanna-import-prefix': 'error',
      '@hosanna-eslint/no-hosanna-generated-imports': 'error',
      '@hosanna-eslint/no-json-imports': 'error',
      '@hosanna-eslint/no-export-aliasing': 'error',
      '@hosanna-eslint/no-import-extensions': 'warn',

      // Function/Expression rules
      '@hosanna-eslint/no-await-expression': 'error',
      '@hosanna-eslint/promise-static-polyfilled': 'warn',
      '@hosanna-eslint/no-unsupported-promise-methods': 'error',
      '@hosanna-eslint/no-call-on-anonymous-function': 'error',
      '@hosanna-eslint/no-iife-usage': 'error',
      '@hosanna-eslint/no-nested-functions': 'error',
      '@hosanna-eslint/no-function-expression-on-anonymous-object': 'error',
      '@hosanna-eslint/no-function-reference-outside-module': 'error',
      '@hosanna-eslint/no-closure-variable-modification': 'error',
      '@hosanna-eslint/no-async-function-pointer-invalid-reference': 'error',

      // Configuration File rules
      '@hosanna-eslint/app-config-json-valid': 'error',
      '@hosanna-eslint/app-config-style-key-valid': 'error',
      '@hosanna-eslint/app-config-get-valid': 'error',
      '@hosanna-eslint/app-config-rows-cells-valid': 'error',

      // Language Feature rules
      '@hosanna-eslint/no-union-expression-in-non-statement': 'error',
      '@hosanna-eslint/no-non-null-on-call-expression': 'error',

      // API/Built-in rules
      '@hosanna-eslint/no-console-methods': 'error',
      '@hosanna-eslint/no-unsupported-array-methods': 'error',
      '@hosanna-eslint/no-unsupported-string-methods': 'error',
      '@hosanna-eslint/no-date-usage': 'error',
      '@hosanna-eslint/no-epsilon-usage': 'warn',
      '@hosanna-eslint/no-nan-usage': 'error',
      '@hosanna-eslint/no-number-isnan': 'error',
      '@hosanna-eslint/no-isnan-emulated': 'warn',

      // Type/Syntax rules
      '@hosanna-eslint/no-ts-module-declarations': 'error',
      '@hosanna-eslint/no-inline-classes': 'error',
      '@hosanna-eslint/no-computed-properties-in-objects': 'error',
      '@hosanna-eslint/no-reserved-words': 'error',

      // Data/Safety rules
      '@hosanna-eslint/no-large-numeric-literals': 'warn',
    },
  },
];
```

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

### Linting

```bash
npm run lint
npm run lint-fix  # Auto-fix issues
```

### Changelog

Generate changelog for the current changes:

```bash
npm run changelog
```

Preview changelog without writing:

```bash
npm run changelog:dry
```

### Adding New Rules

When adding new rules to this plugin:

1. Create a new rule file in `src/rules/`
2. Add comprehensive tests in `src/rules/*.test.ts`
3. Export the rule from `src/index.ts`
4. Update this README with documentation
5. Ensure the rule provides clear, actionable error messages

## Platform Considerations

Hosanna UI targets multiple platforms (web, Roku, Apple TV, Android) with different performance characteristics and constraints. This plugin helps enforce patterns that work optimally across all supported platforms, particularly focusing on:

- **Roku Performance:** Preventing patterns that cause memory leaks or slow rendering
- **Transpile Safety:** Guarding against code that might not transpile correctly to BrightScript
- **Cross-Platform Compatibility:** Ensuring code works consistently across all target platforms
