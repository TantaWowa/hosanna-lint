# Changelog

## [0.2.0] - 2025-10-04

### Added
- Added `NPM_CONFIG_PROVENANCE` to CI workflow for semantic-release.

### Changed
- Updated `CHANGELOG` for version 1.0.0 release with details on custom ESLint rules, TypeScript support, and CI/CD integration.
- Adjusted `package.json` to use `npx` for changelog generation commands.

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


