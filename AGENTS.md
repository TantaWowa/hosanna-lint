# AGENTS.md

## Overview

This repo owns `@tantawowa/hosanna-eslint-plugin`, the ESLint rule package used by Hosanna UI app repos. It is the right place to add editor/lint diagnostics for TypeScript patterns that should not reach the Roku compiler.

## Commands

| Task | Command |
|------|---------|
| Build | `npm run build` |
| Lint | `npm run lint` |
| Test all lint rules | `npm test` |
| Specific rule test | `npx vitest run src/rules/name.test.ts` |

## Toolchain relationship

- `../hosanna-ui` consumes this plugin in its ESLint config.
- `../hosanna-transpiler` owns compiler diagnostics and `hsc`.
- `../hosanna-transpiler/packages/hosanna-supported-apis` owns shared metadata, including `eslint-rule-to-hs-codes.ts`.
- `../hosanna-tools` owns `hst`, generation, debugger, and MCP tooling.

When adding a rule that corresponds to a compiler diagnostic, update the shared mapping in `../hosanna-transpiler/packages/hosanna-supported-apis/src/eslint-rule-to-hs-codes.ts` and add/verify the matching compiler diagnostic in `../hosanna-transpiler`. Use `npm link` or an equivalent local link workflow to validate this plugin inside `../hosanna-ui` before publish.
