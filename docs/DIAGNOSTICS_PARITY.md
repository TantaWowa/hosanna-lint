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
| HS-1055 | `hsconfig` JSON errors |
| HS-1087–HS-1090 | Version mismatch, build timeout, excluded import graph, generic transpile failure |

**HS-1011 (general transpilation warning):** Partial ESLint coverage via `no-mixed-conditional-compilation` (mixed build flags + runtime in `if` tests). Logic is kept in sync with `ConditionalCompilation.ts`; pass `buildFlags` / `platform` rule options to mirror `hsconfig`. Other HS-1011 causes remain transpiler-only.

**HS-1115 (native closure/variadic):** Spurious warnings for `.push`/`.unshift` with spread were fixed in the transpiler by always setting `_nativeCallNameWhenSpread` before optional `getInvokedFunctionNode` failure and by unwrapping `TSNonNullExpression` callees (e.g. `arr!.push(...x)`). ESLint still targets `CreateObject`-style patterns only.

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
| HS-1054, HS-1058, HS-1059 | `IHsIdentifiable` / object comparison heuristics beyond basic assignability |
| HS-1078 | `OnNotificationInvalidArgumentCount` — SG node API shape |
| HS-1092 | `EnumMemberNotFound` — symbol resolution edge cases |

## Lint rules and HS codes (parity-focused)

| Rule | HS codes | Notes |
| ---- | -------- | ----- |
| `no-conditional-compilation-else` | HS-1091 | |
| `no-mixed-conditional-compilation` | HS-1011 | In `strict` config; optional `buildFlags` / `platform` |
| `no-case-insensitive-module-collision` | HS-1021 | |
| `no-console-api` | HS-1046 | |
| `no-is-prototype-of-arity` | HS-1049 | |
| `no-unsupported-spread-context` | HS-1093, HS-1005 | |
| `no-unsupported-delete-operator` | HS-1016, HS-1001 | Dot-`delete` with non-identifier property → HS-1001 |
| `no-unsupported-update-non-number` | HS-1026 | |
| `no-ambiguous-array-method-call` | HS-1069 | |
| `no-suboptimal-array-access` | HS-1042, HS-1042_1, HS-1043, HS-1044 | HS-1044: `(x as any\|unknown)[dynamic]` |
| `no-basic-type-binary-comparison` | HS-1019 | Recommended **warn** to match transpiler severity for `===`/`!==` paths it covers; object–object message documents `hs_equal` fallback |
| `no-mixed-brs-node-binary-comparison` | HS-1019 | **Error**: BRS/SG node type compared to a non-node type (transpiler error path); two node types are handled by `no-sgnode-equality-unsafe` (HS-1114) instead |
| `no-vague-state-field-usage` | HS-1073 | Same-file `implements` + `@state` / `@observable` / `@injectobservable` / `@layoutstate` only |
| `no-date-usage` | HS-1082, HS-1052, HS-1083, HS-1084, HS-1099 | HS-1099: enable `reportNewDateAsHs1099` or use plugin `strict` config |

### Plugin `strict` config

Merge with `recommended` for editor/transpiler parity extras:

- `no-date-usage` with `reportNewDateAsHs1099: true` (HS-1099 on `new Date()`).
- `no-mixed-conditional-compilation` at `warn` (HS-1011 subset).

### HS-1099 and editor noise

By default `no-date-usage` does not report `new Date()` (transpiler still emits HS-1099). Enable parity via the rule option or `strict` config; the mapping always lists HS-1099 for `hs:disable` alignment.
