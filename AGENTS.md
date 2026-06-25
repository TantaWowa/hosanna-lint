# AGENTS.md

## Git Branch Naming

Agents may create sensible, semantic feature branch names when a task needs a
branch or worktree. Do not include `codex`, `codex/`, `codex-`, or any other
automatic agent prefix in branch names.

## Overview

This repo owns `@tantawowa/hosanna-eslint-plugin`, the ESLint rule package used by Hosanna UI app repos. It is the right place to add editor/lint diagnostics for TypeScript patterns that should not reach the Roku compiler.

## Commands

| Task | Command |
|------|---------|
| Build | `npm run build` |
| Lint | `npm run lint` |
| Test all lint rules | `npm test` |
| Specific rule test | `npx vitest run src/rules/name.test.ts` |

## Pull request readiness workflow

When the user asks an agent to make, create, open, publish, or prepare a PR, the agent must first run the local validation sequence:

1. `npm run lint`
2. `npm run build`
3. `npm test`

If any command fails, fix the issue or report the blocker before creating the PR.

For lint rule changes that affect Hosanna TypeScript accepted by app repos, also validate the consumer path in `../hosanna-ui`: link or otherwise use the local plugin there, run `npm run lint`, run `npm run roku:build`, and then use the `pr-brightscript-map-check` skill in `../hosanna-ui` when the change could affect TypeScript that reaches generated BrightScript. Do this before committing, pushing, or opening the PR.

## Toolchain relationship

- `../hosanna-ui` consumes this plugin in its ESLint config.
- `../hosanna-transpiler` owns compiler diagnostics and `hsc`.
- `../hosanna-transpiler/packages/hosanna-supported-apis` owns shared metadata, including `eslint-rule-to-hs-codes.ts`.
- `../hosanna-tools` owns `hst`, generation, debugger, and MCP tooling.

When adding a rule that corresponds to a compiler diagnostic, update the shared mapping in `../hosanna-transpiler/packages/hosanna-supported-apis/src/eslint-rule-to-hs-codes.ts` and add/verify the matching compiler diagnostic in `../hosanna-transpiler`. Use `npm link` or an equivalent local link workflow to validate this plugin inside `../hosanna-ui` before publish.
