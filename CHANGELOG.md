# Changelog

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







