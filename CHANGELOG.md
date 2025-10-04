# Changelog

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




