import { wrapRuleWithHsDisable } from './utils/hs-disable';
import noHosannaGeneratedImports from './rules/no-hosanna-generated-imports';
import hosannaImportPrefix from './rules/hosanna-import-prefix';
import noJsonImports from './rules/no-json-imports';
import noAsyncManagerCommandsImport from './rules/no-async-manager-commands-import';
import noAwaitExpression from './rules/no-await-expression';
import noNestedFunctions from './rules/no-nested-functions';
import noInlineClasses from './rules/no-inline-classes';
import computedPropertyInObjectLiteral from './rules/computed-property-in-object-literal';
import noDateUsage from './rules/no-date-usage';
import noReservedWords from './rules/no-reserved-words';
import noUnsupportedArrayMethods from './rules/no-unsupported-array-methods';
import noUnsupportedStringMethods from './rules/no-unsupported-string-methods';
import noEpsilonUsage from './rules/no-epsilon-usage';
import noNaNUsage from './rules/no-nan-usage';
import noNumberIsNaN from './rules/no-number-isnan';
import noUnsafeNumberParsing from './rules/no-unsafe-number-parsing';
import noNonNullOnCallExpression from './rules/no-non-null-on-call-expression';
import noIsNaNEmulated from './rules/no-isnan-emulated';
import noLargeNumericLiterals from './rules/no-large-numeric-literals';
import noFunctionExpressionOnAnonymousObject from './rules/no-function-expression-on-anonymous-object';
import noIifeUsage from './rules/no-iife-usage';
import noTsModuleDeclarations from './rules/no-ts-module-declarations';
import noFunctionReferenceOutsideModule from './rules/no-function-reference-outside-module';
import noClosureVariableModification from './rules/no-closure-variable-modification';
import noExportAliasing from './rules/no-export-aliasing';
import noUnaryOnIllegalType from './rules/no-unary-on-illegal-type';
import noUnionExpressionInNonStatement from './rules/no-union-expression-in-non-statement';
import noCallOnAnonymousFunction from './rules/no-call-on-anonymous-function';
import noImportExtensions from './rules/no-import-extensions';
import noAsyncFunctionPointerInvalidReference from './rules/no-async-function-pointer-invalid-reference';
import appConfigJsonValid from './rules/app-config-json-valid';
import appConfigStyleKeyValid from './rules/app-config-style-key-valid';
import appConfigGetValid from './rules/app-config-get-valid';
import appConfigRowsCellsValid from './rules/app-config-rows-cells-valid';
import noUnsupportedRegexFlags from './rules/no-unsupported-regex-flags';
import noUint8ArrayDeclaration from './rules/no-uint8array-declaration';
import noThisInNonArrowClosure from './rules/no-this-in-non-arrow-closure';
import noConditionalCompilationElse from './rules/no-conditional-compilation-else';
import noJsonStringifySpace from './rules/no-json-stringify-space';
import promiseStaticPolyfilled from './rules/promise-static-polyfilled';
import noUnsupportedPromiseMethods from './rules/no-unsupported-promise-methods';

// Tier 1: Pure AST rules (LOW performance impact)
import noInfinityUsage from './rules/no-infinity-usage';
import noTooManyIfElse from './rules/no-too-many-if-else';
import noTooManySwitchCases from './rules/no-too-many-switch-cases';
import noLogicalExpressionLimit from './rules/no-logical-expression-limit';
import noTooManyNots from './rules/no-too-many-nots';
import noUnsupportedCompoundAssignment from './rules/no-unsupported-compound-assignment';
import noObjectPrototype from './rules/no-object-prototype';
import noBufferApi from './rules/no-buffer-api';
import noCryptoApi from './rules/no-crypto-api';
import noJsonStringifyReplacer from './rules/no-json-stringify-replacer';
import noUnsupportedObjectMethods from './rules/no-unsupported-object-methods';
import noUnsupportedMathMethods from './rules/no-unsupported-math-methods';
import noUnsupportedNumberStaticMethods from './rules/no-unsupported-number-static-methods';
import noInterfaceComputedProperty from './rules/no-interface-computed-property';
import noArgumentBinding from './rules/no-argument-binding';
import noForInOnArray from './rules/no-for-in-on-array';
import noUnsupportedJsonFunctions from './rules/no-unsupported-json-functions';
import noFindNodeMethod from './rules/no-find-node-method';
import noUnsupportedDestructuringContext from './rules/no-unsupported-destructuring-context';

// Tier 2: Type-aware rules (MEDIUM performance impact)
import noForOfOnNonArray from './rules/no-for-of-on-non-array';
import noBasicTypeBinaryComparison from './rules/no-basic-type-binary-comparison';
import noFunctionTypedAsAny from './rules/no-function-typed-as-any';
import noSuboptimalArrayAccess from './rules/no-suboptimal-array-access';
import noStringMethodOnNonString from './rules/no-string-method-on-non-string';
import noNumberMethodOnNonNumber from './rules/no-number-method-on-non-number';
import noStaticMemberAccessWithThis from './rules/no-static-member-access-with-this';
import noTypeofBrsNodeMethod from './rules/no-typeof-brs-node-method';
import noComparisonBrsNodeMethod from './rules/no-comparison-brs-node-method';
import noSgnNodeMutation from './rules/no-sgn-node-mutation';
import noRecursionInLogicalExpression from './rules/no-recursion-in-logical-expression';

// Tier 3: Cross-file / deep analysis rules (HIGH performance impact)
import noCaseInsensitiveClassCollision from './rules/no-case-insensitive-class-collision';
import noDuplicateClassName from './rules/no-duplicate-class-name';
import noGetterSetterMismatch from './rules/no-getter-setter-mismatch';
import noVagueStateFieldUsage from './rules/no-vague-state-field-usage';
import noVagueComputedAccess from './rules/no-vague-computed-access';

const preprocess = (text: string, _filename: string) => {
  const trimmed = text.trimStart();
  if (trimmed.startsWith('// hs:exclude-from-platform')) {
    return [''];
  }
  return [text];
};

const jsonPreprocess = (text: string, _filename: string) => {
  return [text];
};

// Wrap all hosanna rules to respect hs:disable-next-line and /* hs:disable */ directives
function w(name: string, rule: import('eslint').Rule.RuleModule) {
  return wrapRuleWithHsDisable(rule, name);
}

const plugin = {
  rules: {
    // Original rules
    'no-async-manager-commands-import': w('no-async-manager-commands-import', noAsyncManagerCommandsImport),
    'no-hosanna-generated-imports': w('no-hosanna-generated-imports', noHosannaGeneratedImports),
    'hosanna-import-prefix': w('hosanna-import-prefix', hosannaImportPrefix),
    'no-json-imports': w('no-json-imports', noJsonImports),
    'no-await-expression': w('no-await-expression', noAwaitExpression),
    'no-nested-functions': w('no-nested-functions', noNestedFunctions),
    'no-inline-classes': w('no-inline-classes', noInlineClasses),
    'computed-property-in-object-literal': w('computed-property-in-object-literal', computedPropertyInObjectLiteral),
    'no-date-usage': w('no-date-usage', noDateUsage),
    'no-reserved-words': w('no-reserved-words', noReservedWords),
    'no-unsupported-array-methods': w('no-unsupported-array-methods', noUnsupportedArrayMethods),
    'no-unsupported-string-methods': w('no-unsupported-string-methods', noUnsupportedStringMethods),
    'no-epsilon-usage': w('no-epsilon-usage', noEpsilonUsage),
    'no-nan-usage': w('no-nan-usage', noNaNUsage),
    'no-number-isnan': w('no-number-isnan', noNumberIsNaN),
    'no-unsafe-number-parsing': w('no-unsafe-number-parsing', noUnsafeNumberParsing),
    'no-non-null-on-call-expression': w('no-non-null-on-call-expression', noNonNullOnCallExpression),
    'no-isnan-emulated': w('no-isnan-emulated', noIsNaNEmulated),
    'no-large-numeric-literals': w('no-large-numeric-literals', noLargeNumericLiterals),
    'no-function-expression-on-anonymous-object': w('no-function-expression-on-anonymous-object', noFunctionExpressionOnAnonymousObject),
    'no-iife-usage': w('no-iife-usage', noIifeUsage),
    'no-ts-module-declarations': w('no-ts-module-declarations', noTsModuleDeclarations),
    'no-function-reference-outside-module': w('no-function-reference-outside-module', noFunctionReferenceOutsideModule),
    'no-closure-variable-modification': w('no-closure-variable-modification', noClosureVariableModification),
    'no-export-aliasing': w('no-export-aliasing', noExportAliasing),
    'no-unary-on-illegal-type': w('no-unary-on-illegal-type', noUnaryOnIllegalType),
    'no-union-expression-in-non-statement': w('no-union-expression-in-non-statement', noUnionExpressionInNonStatement),
    'no-call-on-anonymous-function': w('no-call-on-anonymous-function', noCallOnAnonymousFunction),
    'no-import-extensions': w('no-import-extensions', noImportExtensions),
    'no-async-function-pointer-invalid-reference': w('no-async-function-pointer-invalid-reference', noAsyncFunctionPointerInvalidReference),
    'app-config-json-valid': appConfigJsonValid,
    'app-config-style-key-valid': appConfigStyleKeyValid,
    'app-config-get-valid': appConfigGetValid,
    'app-config-rows-cells-valid': appConfigRowsCellsValid,
    'no-unsupported-regex-flags': w('no-unsupported-regex-flags', noUnsupportedRegexFlags),
    'no-uint8array-declaration': w('no-uint8array-declaration', noUint8ArrayDeclaration),
    'no-this-in-non-arrow-closure': w('no-this-in-non-arrow-closure', noThisInNonArrowClosure),
    'no-conditional-compilation-else': w('no-conditional-compilation-else', noConditionalCompilationElse),
    'no-json-stringify-space': w('no-json-stringify-space', noJsonStringifySpace),
    'promise-static-polyfilled': w('promise-static-polyfilled', promiseStaticPolyfilled),
    'no-unsupported-promise-methods': w('no-unsupported-promise-methods', noUnsupportedPromiseMethods),

    // Tier 1: Pure AST rules (LOW performance impact)
    'no-infinity-usage': w('no-infinity-usage', noInfinityUsage),
    'no-too-many-if-else': w('no-too-many-if-else', noTooManyIfElse),
    'no-too-many-switch-cases': w('no-too-many-switch-cases', noTooManySwitchCases),
    'no-logical-expression-limit': w('no-logical-expression-limit', noLogicalExpressionLimit),
    'no-too-many-nots': w('no-too-many-nots', noTooManyNots),
    'no-unsupported-compound-assignment': w('no-unsupported-compound-assignment', noUnsupportedCompoundAssignment),
    'no-object-prototype': w('no-object-prototype', noObjectPrototype),
    'no-buffer-api': w('no-buffer-api', noBufferApi),
    'no-crypto-api': w('no-crypto-api', noCryptoApi),
    'no-json-stringify-replacer': w('no-json-stringify-replacer', noJsonStringifyReplacer),
    'no-unsupported-object-methods': w('no-unsupported-object-methods', noUnsupportedObjectMethods),
    'no-unsupported-math-methods': w('no-unsupported-math-methods', noUnsupportedMathMethods),
    'no-unsupported-number-static-methods': w('no-unsupported-number-static-methods', noUnsupportedNumberStaticMethods),
    'no-interface-computed-property': w('no-interface-computed-property', noInterfaceComputedProperty),
    'no-argument-binding': w('no-argument-binding', noArgumentBinding),
    'no-for-in-on-array': w('no-for-in-on-array', noForInOnArray),
    'no-unsupported-json-functions': w('no-unsupported-json-functions', noUnsupportedJsonFunctions),
    'no-find-node-method': w('no-find-node-method', noFindNodeMethod),
    'no-unsupported-destructuring-context': w('no-unsupported-destructuring-context', noUnsupportedDestructuringContext),

    // Tier 2: Type-aware rules (MEDIUM performance impact)
    'no-for-of-on-non-array': w('no-for-of-on-non-array', noForOfOnNonArray),
    'no-basic-type-binary-comparison': w('no-basic-type-binary-comparison', noBasicTypeBinaryComparison),
    'no-function-typed-as-any': w('no-function-typed-as-any', noFunctionTypedAsAny),
    'no-suboptimal-array-access': w('no-suboptimal-array-access', noSuboptimalArrayAccess),
    'no-string-method-on-non-string': w('no-string-method-on-non-string', noStringMethodOnNonString),
    'no-number-method-on-non-number': w('no-number-method-on-non-number', noNumberMethodOnNonNumber),
    'no-static-member-access-with-this': w('no-static-member-access-with-this', noStaticMemberAccessWithThis),
    'no-typeof-brs-node-method': w('no-typeof-brs-node-method', noTypeofBrsNodeMethod),
    'no-comparison-brs-node-method': w('no-comparison-brs-node-method', noComparisonBrsNodeMethod),
    'no-sgn-node-mutation': w('no-sgn-node-mutation', noSgnNodeMutation),
    'no-recursion-in-logical-expression': w('no-recursion-in-logical-expression', noRecursionInLogicalExpression),

    // Tier 3: Cross-file / deep analysis rules (HIGH performance impact)
    'no-case-insensitive-class-collision': w('no-case-insensitive-class-collision', noCaseInsensitiveClassCollision),
    'no-duplicate-class-name': w('no-duplicate-class-name', noDuplicateClassName),
    'no-getter-setter-mismatch': w('no-getter-setter-mismatch', noGetterSetterMismatch),
    'no-vague-state-field-usage': w('no-vague-state-field-usage', noVagueStateFieldUsage),
    'no-vague-computed-access': w('no-vague-computed-access', noVagueComputedAccess),
  },
  configs: {
    recommended: {
      rules: {
        // Original rules
        '@hosanna-eslint/no-async-manager-commands-import': 'error',
        '@hosanna-eslint/no-hosanna-generated-imports': 'error',
        '@hosanna-eslint/hosanna-import-prefix': 'error',
        '@hosanna-eslint/no-json-imports': 'error',
        '@hosanna-eslint/no-await-expression': 'error',
        '@hosanna-eslint/no-nested-functions': 'error',
        '@hosanna-eslint/no-inline-classes': 'error',
        '@hosanna-eslint/computed-property-in-object-literal': 'error',
        '@hosanna-eslint/no-date-usage': 'error',
        '@hosanna-eslint/no-reserved-words': 'error',
        '@hosanna-eslint/no-unsupported-array-methods': 'error',
        '@hosanna-eslint/no-unsupported-string-methods': 'error',
        '@hosanna-eslint/no-epsilon-usage': 'warn',
        '@hosanna-eslint/no-nan-usage': 'error',
        '@hosanna-eslint/no-number-isnan': 'error',
        '@hosanna-eslint/no-unsafe-number-parsing': 'warn',
        '@hosanna-eslint/no-non-null-on-call-expression': 'error',
        '@hosanna-eslint/no-isnan-emulated': 'warn',
        '@hosanna-eslint/no-large-numeric-literals': 'warn',
        '@hosanna-eslint/no-function-expression-on-anonymous-object': 'error',
        '@hosanna-eslint/no-iife-usage': 'error',
        '@hosanna-eslint/no-ts-module-declarations': 'error',
        '@hosanna-eslint/no-function-reference-outside-module': 'error',
        '@hosanna-eslint/no-closure-variable-modification': 'error',
        '@hosanna-eslint/no-export-aliasing': 'error',
        '@hosanna-eslint/no-unary-on-illegal-type': 'error',
        '@hosanna-eslint/no-union-expression-in-non-statement': 'error',
        '@hosanna-eslint/no-call-on-anonymous-function': 'error',
        '@hosanna-eslint/no-import-extensions': 'warn',
        '@hosanna-eslint/no-async-function-pointer-invalid-reference': 'error',
        '@hosanna-eslint/app-config-json-valid': 'error',
        '@hosanna-eslint/app-config-style-key-valid': 'error',
        '@hosanna-eslint/app-config-get-valid': 'error',
        '@hosanna-eslint/app-config-rows-cells-valid': 'error',
        '@hosanna-eslint/no-unsupported-regex-flags': 'warn',
        '@hosanna-eslint/no-uint8array-declaration': 'warn',
        '@hosanna-eslint/no-this-in-non-arrow-closure': 'error',
        '@hosanna-eslint/no-conditional-compilation-else': 'error',
        '@hosanna-eslint/no-json-stringify-space': 'warn',
        '@hosanna-eslint/promise-static-polyfilled': 'warn',
        '@hosanna-eslint/no-unsupported-promise-methods': 'error',

        // Tier 1: Pure AST rules (LOW performance impact)
        '@hosanna-eslint/no-infinity-usage': 'warn',
        '@hosanna-eslint/no-too-many-if-else': 'error',
        '@hosanna-eslint/no-too-many-switch-cases': 'error',
        '@hosanna-eslint/no-logical-expression-limit': 'error',
        '@hosanna-eslint/no-too-many-nots': 'error',
        '@hosanna-eslint/no-unsupported-compound-assignment': 'error',
        '@hosanna-eslint/no-object-prototype': 'error',
        '@hosanna-eslint/no-buffer-api': 'error',
        '@hosanna-eslint/no-crypto-api': 'error',
        '@hosanna-eslint/no-json-stringify-replacer': 'error',
        '@hosanna-eslint/no-unsupported-object-methods': 'error',
        '@hosanna-eslint/no-unsupported-math-methods': 'error',
        '@hosanna-eslint/no-unsupported-number-static-methods': 'error',
        '@hosanna-eslint/no-interface-computed-property': 'error',
        '@hosanna-eslint/no-argument-binding': 'error',
        '@hosanna-eslint/no-for-in-on-array': 'warn',
        '@hosanna-eslint/no-unsupported-json-functions': 'error',
        '@hosanna-eslint/no-find-node-method': 'warn',
        '@hosanna-eslint/no-unsupported-destructuring-context': 'error',

        // Tier 2: Type-aware rules (MEDIUM performance impact)
        '@hosanna-eslint/no-for-of-on-non-array': 'error',
        '@hosanna-eslint/no-basic-type-binary-comparison': 'error',
        '@hosanna-eslint/no-function-typed-as-any': 'error',
        '@hosanna-eslint/no-suboptimal-array-access': 'warn',
        '@hosanna-eslint/no-string-method-on-non-string': 'warn',
        '@hosanna-eslint/no-number-method-on-non-number': 'warn',
        '@hosanna-eslint/no-static-member-access-with-this': 'error',
        '@hosanna-eslint/no-typeof-brs-node-method': 'warn',
        '@hosanna-eslint/no-comparison-brs-node-method': 'warn',
        '@hosanna-eslint/no-sgn-node-mutation': 'warn',
        '@hosanna-eslint/no-recursion-in-logical-expression': 'warn',

        // Tier 3: Cross-file / deep analysis rules (HIGH performance impact)
        '@hosanna-eslint/no-case-insensitive-class-collision': 'error',
        '@hosanna-eslint/no-duplicate-class-name': 'error',
        '@hosanna-eslint/no-getter-setter-mismatch': 'error',
        '@hosanna-eslint/no-vague-state-field-usage': 'warn',
        '@hosanna-eslint/no-vague-computed-access': 'warn',
      },
    },
  },
  processors: {
    'ts': { preprocess },
    'tsx': { preprocess },
    'js': { preprocess },
    'jsx': { preprocess },
    'json': { preprocess: jsonPreprocess },
  },
};

// For CommonJS compatibility with ESLint
module.exports = plugin;
