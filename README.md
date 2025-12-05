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

This plugin provides **29 specialized ESLint rules** organized by category to ensure Hosanna UI code quality and platform compatibility.

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
