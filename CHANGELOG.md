# Changelog

## [1.26.0] - 2026-03-24

### Added
- Introduced `no-ihs-identifiable-binary-comparison` rule to prevent direct comparisons of `IHsIdentifiable` values, improving type safety and diagnostics.
- Added new ESLint rules for mixed conditional compilation and mixed BRS node comparisons, with enhanced diagnostics and tests.
- Implemented additional ESLint rules for improved diagnostics, accompanied by corresponding test cases.

### Changed
- Updated `@tantawowa/hosanna-supported-apis` to version 1.3.0 and enhanced the `no-console-api` rule to support additional console methods.
- Adjusted `@tantawowa/hosanna-supported-apis` path to use a local package reference and updated version specification to allow minor updates.

### Fixed
- Enhanced `no-suboptimal-array-access` rule to clarify outermost type assertions, improve diagnostics, and added test cases for dynamic key access.

## [1.25.0] - 2026-03-23

### Added
- Added `@tantawowa/hosanna-supported-apis` as a dependency and updated rules to utilize its methods.
- Added documentation for shared metadata synchronization between `hosanna-lint` and `hosanna-compiler`.
- Introduced new rules: `no-closure-captures-variable-before-assignment` and `no-native-function-closure-or-variadic-invocation`, along with corresponding tests.

## [1.24.0] - 2026-03-09

### Changed
- Refactored `computed-property-in-object-literal` rule to emit warnings instead of errors, with updated tests.

## [1.23.0] - 2026-03-05

### Added
- Enhanced `no-ternary-iife-slow-path` rule with additional test cases for property references.
- Introduced `no-sgnode-equality-unsafe` rule with tests to warn against unsafe equality checks on SGNode instances.
- Added `no-ternary-iife-slow-path` and `no-nullish-coalescing-iife-slow-path` rules with corresponding tests.

### Fixed
- Removed unnecessary whitespace and improved type safety with explicit `any` annotations in utils.
- Updated type assertions and error handling in various rules for improved type safety.

## [1.22.0] - 2026-03-03

### Added
- New rule `no-sgn-node-mutation` to prevent direct mutation of `ISGNNode` properties, including accompanying tests.

### Fixed
- Updated test for `@res` resolution to use `process.chdir` for proper detection of temporary files.
- Corrected formatting or content issues in the changelog.

## [1.21.0] - 2026-02-28

### Added
- Rules: argument binding, basic type binary comparison, buffer API, crypto API, duplicate class names, find node method.

### Fixed
- Release script: use `sed` instead of `head -n -1` for macOS compatibility.

## [1.20.0] - 2026-02-26

### Added
- New rule `no-unsafe-number-parsing` with accompanying tests.

## [1.18.0] - 2026-02-21

### Added
- Linting for promise static functions.

## [1.17.1] - 2026-02-11

### Changed
- `no-json-stringify-space` from error to warning severity.

## [1.17.0] - 2026-02-11

### Added
- `no-json-stringify-space` rule to disallow the "space" parameter in `JSON.stringify` (not supported on Roku).
- `app-config-rows-cells-valid` rule to validate `rows` and `cells` in app.config.json.

## [1.16.0] - 2026-01-31

### Changed
- Updated `no-date-usage` rule to allow `new Date()` constructor and specific static methods converted by the transpiler, with improved tests and error messages.

## [1.15.0] - 2026-01-29

### Added
- `no-conditional-compilation-else` rule to disallow else clauses in conditional compilation statements.

## [1.14.0] - 2026-01-15

### Added
- Tests for `locale.*` prefix handling in app-config validation.
- `jsonPathExists` support for locale resolution in translations.

## [1.13.0] - 2026-01-15

### Added
- `no-this-in-non-arrow-closure` rule to disallow `this` in non-arrow function expressions that may become closures.

## [1.12.0] - 2025-12-18

### Added
- `no-uint8array-declaration` rule to warn against `Uint8Array` (maps to `roByteArray` in BrightScript).

## [1.11.0] - 2025-12-11

### Added
- New rule `no-unsupported-regex-flags` to warn about unsupported regex flags on Roku.

### Changed
- Enhanced `no-function-expression-on-anonymous-object` rule to report method shorthand syntax in addition to function expressions within anonymous objects.

## [1.10.0] - 2025-12-09

### Added
- `app-config-style-key-valid` rule to validate styleKey, fontKey, fontStyleKey, settingsKey, cellSettingsKey, loadingCellStyleKey in app.config.json.
- `app-config-get-valid` rule to validate `appConfig.get()` calls.
- Shared `app-config-loader` utility for loading/caching config.
- Rules to enforce `AsyncFunctionPointer` accepts only exported functions.
- Support for `@res` in `-fhd` resolution for `pkg:/` asset paths.
- Added `m` as reserved word in BrightScript (equivalent to 'this').

### Changed
- Enhanced release workflow branch creation logic.
- Refactored `app-config-json-valid` to use shared `app-config-loader`.

### Fixed
- `no-async-function-pointer-invalid-reference`: allow exported functions in class methods, improve scope resolution, update error messages.
- `app-config-style-key-valid`: validate direct font specifications in fontKey.
- `app-config-json-valid`: validate fontKey against valid Roku system font names.

## [1.9.0] - 2025-10-13

### Added
- `.cursor/commands/prepare-pr.md` for PR validation.

### Changed
- Renamed `no-computed-properties-in-objects` to `computed-property-in-object-literal`.

### Removed
- Unused npm scripts: `start`, `testFast`, `lint-ide`, `watch`.

## [1.8.0] - 2025-10-13

### Added
- `no-async-manager-commands-import` rule to enforce `AsyncManagerCommands` imports from `@hs-generated-async/AsyncManagerCommands` only, with autofix.

## [1.7.0] - 2025-10-13

### Fixed
- Import exception for `@hs-generated-async` to properly exclude package and sub-paths.

## [1.6.0] - 2025-10-13

### Added
- Exception for `@hs-generated-async` imports in `no-hosanna-generated-imports` rule.
- Pinned release workflow in GitHub Actions extension.

### Changed
- Set default version bump to `minor` in release workflow.

### Fixed
- TypeScript linting: proper ESLint `Variable` type, suppress expected errors in test samples, exclude samples from compilation.

## [1.5.0] - 2025-10-10

### Added
- `no-unary-on-illegal-type` rule to detect unary operators on illegal types.
- Release workflow: version bump types ('major', 'minor', 'patch') and specific semver versions.
- Cursor IDE command definitions.

### Changed
- Refactored rules to disable any type warnings for AST nodes.
- Improved type safety in rules with proper Node types.

### Fixed
- `no-unary-on-illegal-type`: traverse MemberExpression chains, scope-based type detection for MemberExpression scenarios.

## [1.4.0] - 2025-10-09

### Removed
- `no-enum-dereferencing` rule and associated tests.

## [1.3.0] - 2025-10-09

### Added
- Allow large numeric literals when explicitly typed as `roLongInteger`.
- Support reserved words as class members (e.g., `if`, `then`, `end`, `sub`).
- New rules: `no-export-aliasing`, `no-import-extensions`, union expressions, `no-isnan-emulated`, `Number.NaN` warning.
- Recommended ESLint configuration and manual setup options in README.
- Nodemon for development watch mode.

### Changed
- Refactored closure variable modification rule.
- `no-large-numeric-literals`: suggest fixes instead of reporting.
- `no-epsilon-usage`: use `0.0001` for BrightScript compatibility.
- Refactored `no-computed-properties-in-objects`, `no-non-null-on-call-expression`, `no-nested-functions`.
- `no-reserved-words`: exclude `component`.

### Removed
- Removed `no-rest-operator`, `no-unsupported-spread-operator`, `no-argument-binding`, `no-delete-operator`.
- Removed deprecated `.eslintignore` in favor of ESLint 9+ `ignores`.

## [1.2.0] - 2025-10-04

### Added
- Rules: no-iife-usage, no-function-reference-outside-module, no-closure-variable-modification, no-ts-module-declarations.
- Rules: no-function-expression-on-anonymous-object, no-large-numeric-literals, no-rest-operator, no-delete-operator.
- Rules: no-argument-binding, no-epsilon-usage, no-non-null-on-call-expression, no-unsupported-array-methods, no-unsupported-string-methods.
- Vitest and ESLint configuration with tests for await, computed properties, console, date, inline classes, JSON imports.

### Changed
- VSCode ESLint settings to ignore test files and enhance code action on save.
- README with rule descriptions and recommended configurations.

## [1.1.2] - 2025-10-04

### Changed
- Enhanced README and tests for `hosanna-import-prefix` rule: clarify relative import handling, consistent `@hs-src/` prefix for absolute and relative imports.

## [1.1.0] - 2025-10-04

### Removed
- Removed `NPM_CONFIG_PROVENANCE` from npm publish command in CI workflow.

## [1.0.0] - 2025-10-04

### Added
- Initial release of @tantawowa/hosanna-eslint-plugin.
- Rules: `no-hosanna-generated-imports`, `hosanna-import-prefix`.
- TypeScript support, test suite, CI/CD pipeline.

## [0.2.0]

### Added
- `NPM_CONFIG_PROVENANCE` in CI workflow for package publishing security.

## [0.1.1]

### Changed
- Release automation.

## [0.1.0]

### Added
- Initial commit of @tantawowa/hosanna-eslint-plugin.

---

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]




























