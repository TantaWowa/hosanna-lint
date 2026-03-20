# Agent prompt: shared metadata (hosanna-lint → hosanna-compiler)

Copy everything below the line into a new chat for an agent working in a **single workspace that contains both `hosanna-lint` and `hosanna-compiler`**.

---

## Context

Hosanna targets Roku/BrightScript via a TypeScript-like compiler and an ESLint plugin (`hosanna-lint`). Both enforce **which APIs are supported** (strings, arrays, promises, `Object.*`, etc.) using **allowlists** or equivalent logic.

Today those lists live **separately** in each project. The **compiler** uses full **type information** and reliably reports diagnostics such as:

- **HS-1109** — `StringInstanceMethodNotSupported` (e.g. `localeCompare` not supported on Roku)
- Related families: array instance/static (**HS-1110** / **HS-1047**), string static (**HS-1048**), promise methods (**HS-1101** / **HS-1102**), unsupported `Object` statics (**HS-1050** / **HS-1051**), `Object.prototype` (**HS-1077**), etc.

The **linter** implements overlapping rules (e.g. `@hosanna-eslint/no-unsupported-string-methods` with messages labeled HS-1048/1109) but often uses **heuristic** “is this probably a string/array?” checks (`isLikelyString` / `isLikelyArray` on identifiers and simple initializers). So **ESLint can stay green while the compiler still errors**—for example `someExpr.localeCompare(...)` when `someExpr` is typed as `string` but is not a “likely string” AST pattern.

**Goal:** Reduce drift and maintenance cost by centralizing API support metadata in **`@tantawowa/hosanna-supported-apis`** on npm. Both **hosanna-lint** and **hosanna-compiler** depend on that package so **one publish updates both** lint rules and compiler diagnostics.

## Requirements

1. **Identify** in `hosanna-compiler` every place that encodes “supported string/array/promise/object methods” (or equivalent) for Roku/Hosanna, including code tied to `StringInstanceMethodNotSupported`, `ArrayInstanceMethodNotSupported`, `PromiseStaticMethodNotSupported`, etc., and HS codes in `DiagnosticMessages` / diagnostic enums.

2. **Identify** in `hosanna-lint` the corresponding ESLint rules (e.g. `src/rules/no-unsupported-string-methods.ts`, `no-unsupported-array-methods.ts`, `no-unsupported-promise-methods.ts`, `no-unsupported-object-methods.ts`) and the **HS code mapping** in `src/utils/hs-disable.ts`.

3. **Maintain** the canonical data in **`@tantawowa/hosanna-supported-apis`** (source may live in the compiler repo or a separate repo; publish to npm for consumers).
   - Export plain data structures: `Set`s, readonly arrays, or frozen objects—whatever both TS projects can consume without pulling in ESLint.
   - Include **comments or docstrings** that reference HS diagnostic codes where helpful.
   - Keep names stable and obvious (`SUPPORTED_STRING_INSTANCE_METHODS`, etc.).

4. **`hosanna-lint` rules** import from `@tantawowa/hosanna-supported-apis` (replace any inlined duplicates).

5. **`hosanna-compiler`** depends on the same npm package. Compiler checks should **derive** allow/deny logic from the shared module, not duplicate lists.

6. **Verification**
   - Run existing tests in both projects.
   - Add or adjust tests so a deliberate mismatch would fail (e.g. snapshot or “metadata must match compiler expectation” test in one place).
   - Confirm `hs:disable` tokens in `hs-disable.ts` still align with emitted HS codes.

## Non-goals (unless explicitly requested)

- Fully replacing heuristic `isLikelyString` with type-aware ESLint in this task—**sharing lists does not fix false negatives** from heuristics; call that out as a **follow-up** (type-aware rules or expanded heuristics).

## Success criteria

- **Single source of truth** for supported/unsupported API sets lives under **hosanna-lint**.
- **Compiler and linter both consume it**; no duplicated method name tables in both codebases.
- **Documentation** in the monorepo README or a short `docs/` note explaining how to add a newly supported method (one place to edit).

---

End of prompt.
