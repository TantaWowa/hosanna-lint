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

Add the plugin to your ESLint configuration:

```javascript
// eslint.config.mjs
import hosannaPlugin from '@tantawowa/hosanna-eslint-plugin';

export default [
  // ... other config
  {
    plugins: {
      '@tantawowa/hosanna': hosannaPlugin,
    },
    rules: {
      '@tantawowa/hosanna/no-hosanna-generated-imports': 'error',
      '@tantawowa/hosanna/hosanna-import-prefix': 'error',
    },
  },
];
```

## Rules

This plugin provides **30 specialized ESLint rules** organized by category to ensure Hosanna UI code quality and platform compatibility.

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

### 🔧 Function/Expression Rules

#### `no-await-expression`
**Error level:** `error`

Disallows `await` expressions since async/await is not supported in Hosanna/BrightScript.

#### `no-iife-usage`
**Error level:** `warn`

Warns about Immediately Invoked Function Expressions that may not work as expected.

**Example violations:**
```typescript
// ❌ Warning - IIFE may not work correctly
(function() { console.log('IIFE'); })();
(() => { console.log('arrow IIFE'); })();
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

#### `no-rest-operator`
**Error level:** `error`

Disallows rest operator (`...`) in parameters and destructuring since it's not supported.

**Example violations:**
```typescript
// ❌ Bad - rest parameters
function test(...args) { }

// ❌ Bad - rest in destructuring
const [a, b, ...rest] = arr;
const { x, y, ...others } = obj;
```

#### `no-unsupported-spread-operator`
**Error level:** `error`

Restricts spread operator usage to supported contexts only.

**Example violations:**
```typescript
// ❌ Bad - spread in function calls
Math.max(...numbers);

// ❌ Bad - spread in arrays/objects
const combined = [1, 2, ...arr];
const merged = { ...obj1, ...obj2 };
```

#### `no-argument-binding`
**Error level:** `error`

Disallows `.bind()` method calls since argument binding is not supported.

**Example violations:**
```typescript
// ❌ Bad - using bind()
const bound = func.bind(obj);
setTimeout(callback.bind(this), 1000);
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

#### `no-isnan-unreliable`
**Error level:** `warn`

Warns about `isNaN()` usage since it's unreliable in BrightScript.

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

#### `no-unsupported-delete-operator`
**Error level:** `error`

Disallows `delete` operator usage since it's not supported in BrightScript.

### 📋 Recommended Configuration

For optimal Hosanna development, we recommend this configuration:

```javascript
// eslint.config.mjs
import hosannaPlugin from '@tantawowa/hosanna-eslint-plugin';

export default [
  // ... other config
  {
    plugins: {
      '@tantawowa/hosanna': hosannaPlugin,
    },
    rules: {
      // Import rules
      '@tantawowa/hosanna/hosanna-import-prefix': 'error',
      '@tantawowa/hosanna/no-hosanna-generated-imports': 'error',
      '@tantawowa/hosanna/no-json-imports': 'error',

      // Critical language features
      '@tantawowa/hosanna/no-await-expression': 'error',
      '@tantawowa/hosanna/no-rest-operator': 'error',
      '@tantawowa/hosanna/no-unsupported-spread-operator': 'error',
      '@tantawowa/hosanna/no-argument-binding': 'error',

      // Function and structure rules
      '@tantawowa/hosanna/no-nested-functions': 'error',
      '@tantawowa/hosanna/no-inline-classes': 'error',
      '@tantawowa/hosanna/no-function-expression-on-anonymous-object': 'error',
      '@tantawowa/hosanna/no-function-reference-outside-module': 'error',
      '@tantawowa/hosanna/no-closure-variable-modification': 'error',

      // API and built-in restrictions
      '@tantawowa/hosanna/no-console-methods': 'error',
      '@tantawowa/hosanna/no-date-usage': 'error',
      '@tantawowa/hosanna/no-unsupported-array-methods': 'error',
      '@tantawowa/hosanna/no-unsupported-string-methods': 'error',

      // Type and syntax rules
      '@tantawowa/hosanna/no-ts-module-declarations': 'error',
      '@tantawowa/hosanna/no-computed-properties-in-objects': 'error',
      '@tantawowa/hosanna/no-reserved-words': 'error',

      // Data and safety rules
      '@tantawowa/hosanna/no-large-numeric-literals': 'warn',
      '@tantawowa/hosanna/no-unsupported-delete-operator': 'error',
      '@tantawowa/hosanna/no-non-null-on-call-expression': 'error',

      // Warnings for potential issues
      '@tantawowa/hosanna/no-iife-usage': 'warn',
      '@tantawowa/hosanna/no-isnan-unreliable': 'warn',
      '@tantawowa/hosanna/no-number-isnan': 'error',
      '@tantawowa/hosanna/no-epsilon-usage': 'error',
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
