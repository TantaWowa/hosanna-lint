# HS diagnostics: ESLint parity and limits

Single source for ESLint rule → HS code mapping: `@tantawowa/hosanna-supported-apis` (`ESLINT_RULE_TO_HS_CODES`). The transpiler consumes the same mapping via `eslintMappings` / `hs:disable` resolution.

## Transpiler-only diagnostics (no ESLint target)

These are produced during parse, I/O, project configuration, or whole-program transpile. They are not practical to model as TypeScript ESLint rules in the editor:

| Codes | Typical cause |
| ----- | ------------- |
| HS-1000 | Generic parser message |
| HS-1007 | Missing file |
| HS-1009 | BRS runtime error |
| HS-1010, HS-1010_1, HS-1010_2 | `hs:` directive / malformed directive |
| HS-1011 | General transpilation warning |
| HS-1055 | `hsconfig` JSON errors |
| HS-1087–HS-1090 | Version mismatch, build timeout, excluded import graph, generic transpile failure |

## Deferred / heuristic parity (high divergence risk)

The transpiler uses deep emit and type state for these. ESLint rules would duplicate large logic or produce false positives/negatives unless logic is shared or driven by golden fixtures:

| Codes | Notes |
| ----- | ----- |
| HS-1004 | `CaseFoundWithoutSwitch` — not emitted on valid ESTree; reserved for legacy/alternate paths |
| HS-1005 | `UnexpectedSpreadOperator` — no current emit path (prefer HS-1093) |
| HS-1006 | `RestOperatorNotSupported` — no current emit path in transpiler |
| HS-1068, HS-1074 | Binary expression support — type/emit specific |
| HS-1079 | Array/rest patterns in closures |
| HS-1111 | `VagueStructGetterAccess` — struct / ViewStruct specifics |
| HS-1028 | `StructFunctionCall` |
| HS-1054, HS-1058, HS-1059 | `IHsIdentifiable` / object comparison heuristics |
| HS-1078 | `OnNotificationInvalidArgumentCount` — SG node API shape |
| HS-1092 | `EnumMemberNotFound` — symbol resolution edge cases |

## Lint rules added for parity (this effort)

| Rule | HS codes |
| ---- | -------- |
| `no-conditional-compilation-else` | HS-1091 |
| `no-case-insensitive-module-collision` | HS-1021 |
| `no-console-api` | HS-1046 |
| `no-is-prototype-of-arity` | HS-1049 |
| `no-unsupported-spread-context` | HS-1093, HS-1005 |
| `no-unsupported-delete-operator` | HS-1016 |
| `no-unsupported-update-non-number` | HS-1026 |
| `no-ambiguous-array-method-call` | HS-1069 |
| `no-date-usage` (extended) | HS-1082, HS-1052, HS-1083, HS-1084, HS-1099* |

\*HS-1099 (`DateConvertedToHsDate`) is emitted by the transpiler for supported `Date` usage; the lint rule does not surface it on every supported call to avoid editor noise. The code remains in the mapping so `hs:disable` / tooling can align with transpiler diagnostics when needed.
