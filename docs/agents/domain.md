# Domain Docs

This repository uses a single domain context.

## Before exploring

Read these when they exist:

- `CONTEXT.md` at the repository root for the domain glossary and model.
- Relevant decisions under `docs/adr/`.

Proceed silently when either location is absent. The `$domain-modeling`, `$grill-with-docs`, and `$improve-codebase-architecture` skills create or update domain material only when the work resolves real terminology or architectural decisions.

## Use the shared language

Use terms exactly as `CONTEXT.md` defines them in tickets, plans, code, tests, and explanations. When a needed concept is missing, first check whether the repository already uses another term; otherwise record the gap for domain modeling.

Surface conflicts with an existing ADR explicitly. Do not silently override a recorded decision.
