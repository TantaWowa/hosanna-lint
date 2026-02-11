# Changelog

## [1.17.1] - 2026-02-11

### Changed
- Changed `no-json-stringify-space` (JsonStringifySpaceNotSupported) from error to warning severity.

## [1.17.0] - 2026-02-11

### Added
- Introduced `no-json-stringify-space` rule to disallow the "space" parameter in `JSON.stringify` calls, as it is not supported on Roku devices, with accompanying tests.
- Added `app-config-rows-cells-valid` rule to validate property keys and values in `rows` and `cells` objects within `app.config.json` files, including comprehensive tests and updated README.

### Fixed
- Corrected package version.

## [1.16.0] - 2026-01-31

### Changed
- Updated the `no-date-usage` rule to allow `new Date()` constructor calls and specific static methods that are automatically converted by the transpiler.
- Enhanced tests for the `no-date-usage` rule to validate supported Date constructor calls and static methods, while maintaining error reporting for unsupported methods.
- Improved error messages in the `no-date-usage` rule to clearly indicate which Date static methods are supported by the transpiler.

## [1.15.0] - 2026-01-29

### Added
- Introduced a new ESLint rule `no-conditional-compilation-else` to disallow else clauses in conditional compilation statements.
- Added comprehensive tests for the new rule to validate functionality across various scenarios.
- Updated the plugin index to include the new rule in the configuration.

### Changed
- Enhanced existing tests to ensure temporary directories are created correctly.

## [1.14.0] - 2026-01-15

### Added
- Added tests for validating `locale.*` prefix handling in `app-config`.
- Enhanced `jsonPathExists` function to support locale resolution in translations.
- Introduced setup and teardown logic for managing temporary directories during tests.

## [1.13.0] - 2026-01-15

### Added
- Introduced a new ESLint rule `no-this-in-non-arrow-closure` to disallow the use of `this` in non-arrow function expressions that may become closures.
- Added comprehensive tests for the new rule to ensure functionality across various scenarios.
- Updated the plugin index to include the new rule in the configuration.

## [1.12.0] - 2025-12-18

### Added
- Introduced `no-uint8array-declaration` ESLint rule to warn against declaring `Uint8Array` due to its mapping to `roByteArray` in native BrightScript.
- Added comprehensive tests for the `no-uint8array-declaration` rule.
- Updated plugin configuration to include the new rule in the index.

## [1.11.0] - 2025-12-11

### Added
- New rule for validating `app.config.json` keys with `app-config-style-key-valid` for styleKey, fontKey, fontStyleKey, settingsKey, cellSettingsKey, and loadingCellStyleKey.
- New rule `app-config-get-valid` to validate `appConfig.get()` calls.
- Shared utility `app-config-loader` for loading/caching configuration.
- New rule to enforce `AsyncFunctionPointer` to accept only exported functions.
- Rule to enforce exported-only targets for fields and bound functions in `async-function-pointer`.
- Rule for `no-unsupported-regex-flags` to warn about unsupported regex flags.
- Added 'm' as a reserved word in BrightScript (equivalent to 'this').

### Changed
- Enhanced `no-function-expression-on-anonymous-object` rule to report method shorthand syntax in addition to function expressions within anonymous objects.
- Updated release workflow to improve branch creation logic by ensuring the main branch is up-to-date and handling existing release branches appropriately.
- Refactored `app-config-json-valid` rule to use the shared `app-config-loader` utility.
- Added `@res` to `-fhd` resolution for `pkg:/` asset paths.

### Fixed
- Fixed `no-async-function-pointer-invalid-reference` to allow exported functions in class methods, improve scope resolution, and update error messages to mention `.bind()` calls are not allowed.
- Fixed `app-config-style-key-valid` to validate direct font specifications in `fontKey`.
- Fixed `app-config-json-valid` to validate `fontKey` against valid Roku system font names.

## [1.10.0] - 2025-12-09

### Added
- New validation rules for `app.config.json`:
  - `app-config-style-key-valid` to validate keys like `styleKey`, `fontKey`, `fontStyleKey`, `settingsKey`, `cellSettingsKey`, and `loadingCellStyleKey`.
  - `app-config-get-valid` to validate `appConfig.get()` calls.
  - Shared `app-config-loader` utility for loading/caching config.
  - Support for `@res` in `-fhd` resolution for `pkg:/` asset paths.
- New rule to enforce `AsyncFunctionPointer` to accept only exported functions.
- New rule to enforce exported-only targets for fields and bound functions in `AsyncFunctionPointer`.
- Added `m` as a reserved word in BrightScript (equivalent to 'this') under `no-reserved-words` rule.
- Comprehensive test cases and updated README documentation for new rules.

### Changed
- Enhanced branch creation logic in release workflow:
  - Ensure `main` branch is checked out and up-to-date before creating a release branch.
  - Add checks for existing remote release branches and handle them by resetting to the latest `main` or creating a new branch.
- Refactored `app-config-json-valid` rule to use the shared `app-config-loader` utility.

### Fixed
- Fixed scope resolution in `no-async-function-pointer-invalid-reference` to walk up the scope chain for nested scopes, allowing exported functions in class methods.
- Updated error message in `no-async-function-pointer-invalid-reference` to mention `.bind()` calls are not allowed.
- Added validation for direct font specifications in `fontKey` under `app-config-style-key-valid`.
- Added validation for `fontKey` against valid Roku system font names in `app-config-json-valid`.

## [1.9.0] - 2025-10-13

### Added
- Added `.cursor/commands/prepare-pr.md` for comprehensive PR validation.

### Changed
- Renamed rule `no-computed-properties-in-objects` to `computed-property-in-object-literal`.

### Removed
- Removed unused npm scripts: `start`, `testFast`, `lint-ide`, and `watch`.

## [1.8.0] - 2025-10-13

### Added
- New `no-async-manager-commands-import` rule to enforce imports of `AsyncManagerCommands` exclusively from `@hs-generated-async/AsyncManagerCommands`, with autofix support for invalid import paths and comprehensive test coverage for various import scenarios.

## [1.7.0] - 2025-10-13

### Fixed
- Corrected import exception logic for `@hs-generated-async` to properly exclude the package and its sub-paths.
- Updated test cases to verify that sub-path imports are allowed.

## [1.6.0] - 2025-10-13

### Added
- Added exception for `@hs-generated-async` imports in the `no-hosanna-generated-imports` rule.
- Added test case to verify `@hs-generated-async` imports are permitted.
- Pinned release workflow in GitHub Actions extension for easier access in VSCode.

### Changed
- Set default version bump to `minor` in the release workflow, allowing runs without specifying a version.

### Fixed
- Fixed TypeScript linting warning by using the proper ESLint `Variable` type.
- Suppressed expected TypeScript errors in test samples.
- Excluded samples from test compilation to prevent build errors.

## [1.5.0] - 2025-10-10

### Added
- New `no-unary-on-illegal-type` rule to detect unary operators on illegal types.
- Support for version bump types ('major', 'minor', 'patch') and specific semver versions in the release workflow.
- Automatic version calculation for bump types in the release workflow.
- Cursor IDE command definitions in configuration.

### Changed
- Enhanced release workflow with improved input validation and clear error messages.
- Updated workflow description to clarify supported version formats.
- Refactored rules to disable any type warnings for AST nodes.
- Improved type safety in rules with proper Node types.

### Fixed
- Fixed false negatives in `no-unary-on-illegal-type` rule where unary operations on `row.layout.prop` weren't flagged.
- Enhanced `no-unary-on-illegal-type` rule to traverse MemberExpression chains and check root identifier types.
- Added scope-based type detection and improved any type handling for both `TSAnyKeyword` and `TSTypeReference` in `no-unary-on-illegal-type` rule.
- Added comprehensive test cases for MemberExpression scenarios in `no-unary-on-illegal-type` rule.

## [1.4.0] - 2025-10-09

### Removed
- Removed the `no-enum-dereferencing` rule and its associated test cases to simplify the codebase.
- Updated plugin configuration to eliminate references to the removed rule.

## [1.3.0] - 2025-10-09

### Added
- New feature to allow large numeric literals when explicitly typed as `roLongInteger`, preventing unnecessary warnings while maintaining safety for untyped large numbers.
- Support for using reserved words as class members (e.g., `if`, `then`, `end`, `sub`), enabling more flexible class design.
- New ESLint rules for export aliasing, import extensions, union expressions, `isNaN` usage, and `Number.NaN` warnings, with comprehensive test cases and documentation.
- Test cases for large numeric literals, for loop increment/decrement, and closure variable modifications to enhance test coverage.
- Recommended ESLint configuration and manual setup options in README for better IDE integration and user experience.
- Nodemon for development watch mode to streamline rule development.

### Changed
- Refactored closure variable modification rule for improved scope handling and clarity.
- Updated `no-large-numeric-literals` rule to suggest fixes instead of reporting problems.
- Enhanced `no-epsilon-usage` rule to use `0.0001` instead of `0.0000001` for BrightScript compatibility, with updated error messages.
- Improved ESLint configuration to include `test-*` files for linting and exclude `__test__` files from TypeScript diagnostics.
- Refactored multiple ESLint rules (`no-computed-properties-in-objects`, `no-non-null-on-call-expression`, `no-nested-functions`, etc.) for better clarity, context detection, and compatibility.
- Updated README to reflect the current number of specialized ESLint rules and added documentation for new rules (`hosanna-import-prefix`, `no-export-aliasing`, `no-import-extensions`).
- Adjusted `no-reserved-words` rule to exclude `component` and modified `no-unsupported-spread-operator` to allow all spread usages as a disabled rule.

### Removed
- Removed unsupported rules: `no-rest-operator`, `no-unsupported-spread-operator`, `no-argument-binding`, and `no-delete-operator` to streamline the ESLint ruleset.
- Eliminated deprecated `.eslintignore` file in favor of ESLint 9+ `ignores` configuration.

### Fixed
- Fixed CI issues with multiple commits to stabilize the build process.
- Resolved linting issues and added more robust linting rules for better code quality.

## [1.2.0] - 2025-10-04

### Added
- New ESLint rules to disallow IIFE usage, function references outside modules, closure variable modification, and TypeScript module declarations, with corresponding test cases.
- ESLint rules to disallow function expressions on anonymous objects, `isNaN` usage, large numeric literals, rest operator, and delete operator, including test cases and updated ESLint configuration.
- ESLint rules to disallow unsupported Hosanna features such as argument binding, `Number.EPSILON`, non-null assertions on call expressions, and unsupported array/string methods, with test cases.
- Configuration files for Vitest and ESLint, including tests for new rules on await expressions, computed properties, console methods, date usage, inline classes, and JSON imports.

### Changed
- Updated VSCode ESLint settings to ignore test files and enhance code action on save configurations.
- Enhanced README with detailed descriptions of new ESLint rules for import/export, function/expression, language features, API restrictions, and type/syntax rules, including violation examples and recommended configurations for Hosanna development.

## [1.1.2] - 2025-10-04

### Added
- Test file to demonstrate current rule behavior for hosanna import prefix.

### Changed
- Enhanced README and tests for hosanna import prefix rule to clarify handling of relative imports.
- Updated examples and test cases to ensure consistent application of the `@hs-src/` prefix for both absolute and relative imports of hosanna packages.

## [1.1.0] - 2025-10-04

### Added
- Added `NPM_CONFIG_PROVENANCE` to CI workflow for semantic-release to enhance package publishing security.

### Removed
- Removed `NPM_CONFIG_PROVENANCE` from npm publish command in CI workflow to streamline the process.

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-10-04

### Added
- Initial release of @tantawowa/hosanna-eslint-plugin
- Custom ESLint rules for enhanced code quality
- Full TypeScript support for type-safe linting
- Comprehensive test suite for rule validation
- CI/CD pipeline for automated builds and deployments
- Automated changelog generation for version tracking

### Rules
- `no-hosanna-generated-imports` rule to prevent imports from generated files
- `hosanna-import-prefix` rule to enforce @hs-src/ prefix for hosanna package imports

## [Unreleased]




















