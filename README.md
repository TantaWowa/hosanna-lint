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

## Rules

This plugin provides **32 specialized ESLint rules** organized by category to ensure Hosanna UI code quality and platform compatibility.

### 📦 Import/Export Rules

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

#### `no-hosanna-generated-imports`
**Error level:** `error`

Prevents direct imports from generated files to avoid circular dependencies and runtime failures.

**Example violations:**
```typescript
// ❌ Bad - direct import from generated files
import { ButtonViewStruct } from '@hs-generated/hosanna-ui/views/controls/Button/Button-generated-struct';

// ✅ Good - import from framework APIs instead
import { Button } from '@hs-src/hosanna-ui/views/controls/Button';
```

#### `no-json-imports`
**Error level:** `error`

Disallows JSON imports as they are not supported in Hosanna/BrightScript and can severely impact performance.

**Auto-fix:** Suggests `JSON.parse(ReadAsciiFile(...))` pattern.

#### `no-export-aliasing`
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

#### `no-import-extensions`
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

#### `no-await-expression`
**Error level:** `error`

Disallows `await` expressions since async/await is not supported in Hosanna/BrightScript.

#### `no-call-on-anonymous-function`
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

#### `no-iife-usage`
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

#### `no-nested-functions`
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

#### `no-function-expression-on-anonymous-object`
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

#### `no-function-reference-outside-module`
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

#### `no-async-function-pointer-invalid-reference`
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

#### `app-config-json-valid`
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

#### `app-config-style-key-valid`
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

#### `app-config-get-valid`
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

#### `no-closure-variable-modification`
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

#### `no-union-expression-in-non-statement`
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

#### `no-non-null-on-call-expression`
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

#### `no-console-methods`
**Error level:** `error`

Disallows console method calls since they're not supported in BrightScript.

**Auto-fix:** Removes console calls.

**Example violations:**
```typescript
// ❌ Bad - console methods
console.log('debug message');
console.error('error');
```

#### `no-unsupported-array-methods`
**Error level:** `error`

Disallows unsupported Array prototype methods like `find`, `includes`, `flat`, etc.

**Example violations:**
```typescript
// ❌ Bad - unsupported methods
arr.find(item => item > 2);
arr.includes(5);
arr.flat();
```

#### `no-unsupported-string-methods`
**Error level:** `error`

Disallows unsupported String static methods.

#### `no-date-usage`
**Error level:** `error`

Disallows Date constructor and static methods since Date objects are not supported.

**Auto-fix:** Suggests `HsDate` replacement.

#### `no-epsilon-usage`
**Error level:** `error`

Disallows `Number.EPSILON` usage.

**Auto-fix:** Replaces with `0.0000001`.

#### `no-number-isnan`
**Error level:** `error`

Disallows `Number.isNaN()` usage.

**Auto-fix:** Replaces with global `isNaN()`.

#### `no-isnan-emulated`
**Error level:** `warn`

Warns about `isNaN()` usage since it's emulated on BrightScript and may be unreliable.

### 📝 Type/Syntax Rules

#### `no-ts-module-declarations`
**Error level:** `error`

Disallows TypeScript module declarations and blocks since they're not supported.

**Example violations:**
```typescript
// ❌ Bad - module declarations
declare module 'myModule' { export const value: string; }
module MyModule { export const value = 42; }
```

#### `no-inline-classes`
**Error level:** `error`

Disallows class declarations inside functions since classes must be at module level.

#### `no-computed-properties-in-objects`
**Error level:** `error`

Restricts computed property keys in object literals to enums and literals only.

#### `no-reserved-words`
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

#### `no-large-numeric-literals`
**Error level:** `warn`

Warns about numeric literals exceeding Roku's safe integer limit (2147483647).

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
