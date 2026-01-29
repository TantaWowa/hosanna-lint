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
import noUnsupportedRegexFlags from './rules/no-unsupported-regex-flags';
import noUint8ArrayDeclaration from './rules/no-uint8array-declaration';
import noThisInNonArrowClosure from './rules/no-this-in-non-arrow-closure';
import noConditionalCompilationElse from './rules/no-conditional-compilation-else';

const preprocess = (text: string, _filename: string) => {
  // Check if file starts with the exclude comment for any platform
  const trimmed = text.trimStart();
  if (trimmed.startsWith('// hs:exclude-from-platform')) {
    // Return empty array to skip processing this file
    return [''];
  }
  // Return the original text for normal processing
  return [text];
};

const jsonPreprocess = (text: string, _filename: string) => {
  // For JSON files, convert to a virtual JavaScript file that ESLint can process
  // We'll create a simple program node that contains the JSON text
  // The rule will parse the JSON from the source text
  return [text];
};

const plugin = {
  rules: {
    'no-async-manager-commands-import': noAsyncManagerCommandsImport,
    'no-hosanna-generated-imports': noHosannaGeneratedImports,
    'hosanna-import-prefix': hosannaImportPrefix,
    'no-json-imports': noJsonImports,
    'no-await-expression': noAwaitExpression,
    'no-nested-functions': noNestedFunctions,
    'no-inline-classes': noInlineClasses,
    'computed-property-in-object-literal': computedPropertyInObjectLiteral,
    'no-date-usage': noDateUsage,
    'no-reserved-words': noReservedWords,
    'no-unsupported-array-methods': noUnsupportedArrayMethods,
    'no-unsupported-string-methods': noUnsupportedStringMethods,
    'no-epsilon-usage': noEpsilonUsage,
    'no-nan-usage': noNaNUsage,
    'no-number-isnan': noNumberIsNaN,
    'no-non-null-on-call-expression': noNonNullOnCallExpression,
    'no-isnan-emulated': noIsNaNEmulated,
    'no-large-numeric-literals': noLargeNumericLiterals,
    'no-function-expression-on-anonymous-object': noFunctionExpressionOnAnonymousObject,
    'no-iife-usage': noIifeUsage,
    'no-ts-module-declarations': noTsModuleDeclarations,
    'no-function-reference-outside-module': noFunctionReferenceOutsideModule,
    'no-closure-variable-modification': noClosureVariableModification,
    'no-export-aliasing': noExportAliasing,
    'no-unary-on-illegal-type': noUnaryOnIllegalType,
    'no-union-expression-in-non-statement': noUnionExpressionInNonStatement,
    'no-call-on-anonymous-function': noCallOnAnonymousFunction,
    'no-import-extensions': noImportExtensions,
    'no-async-function-pointer-invalid-reference': noAsyncFunctionPointerInvalidReference,
    'app-config-json-valid': appConfigJsonValid,
    'app-config-style-key-valid': appConfigStyleKeyValid,
    'app-config-get-valid': appConfigGetValid,
    'no-unsupported-regex-flags': noUnsupportedRegexFlags,
    'no-uint8array-declaration': noUint8ArrayDeclaration,
    'no-this-in-non-arrow-closure': noThisInNonArrowClosure,
    'no-conditional-compilation-else': noConditionalCompilationElse,
  },
  configs: {
    recommended: {
      rules: {
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
        '@hosanna-eslint/no-unsupported-regex-flags': 'warn',
        '@hosanna-eslint/no-uint8array-declaration': 'warn',
        '@hosanna-eslint/no-this-in-non-arrow-closure': 'error',
        '@hosanna-eslint/no-conditional-compilation-else': 'error',
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
