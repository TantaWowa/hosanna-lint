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

### `no-hosanna-generated-imports`

**Error level:** `error`

Prevents direct imports from generated files, including:
- Imports from `@hs-generated/*` packages
- Any imports containing `-generated-struct` in the file path

**Why this matters:**
- Generated files are auto-generated and may change during build processes
- Direct imports can cause circular dependencies or runtime failures
- Ensures proper architectural separation between generated and hand-written code

**Example violations:**
```typescript
// ❌ Bad - direct import from @hs-generated
import { ButtonViewStruct } from '@hs-generated/hosanna-ui/views/controls/Button/Button-generated-struct';

// ❌ Bad - import containing -generated-struct
import { SomeStruct } from './my-generated-struct-file';

// ✅ Good - import from framework APIs instead
import { Button } from '@hs-src/hosanna-ui/views/controls/Button';
```

### `hosanna-import-prefix`

**Error level:** `error`

Requires all imports from hosanna packages to use the `@hs-src/` prefix.

**Why this matters:**
- Ensures consistent import paths across the codebase
- Provides clear separation between source and generated packages
- Helps maintain proper architectural boundaries

**Example violations:**
```typescript
// ❌ Bad - missing @hs-src/ prefix
import { Button } from 'hosanna-ui/views/controls/Button';
import { Bridge } from 'hosanna-bridge';

// ✅ Good - proper @hs-src/ prefix
import { Button } from '@hs-src/hosanna-ui/views/controls/Button';
import { Bridge } from '@hs-src/hosanna-bridge';
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
