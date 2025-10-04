import noHosannaGeneratedImports from './rules/no-hosanna-generated-imports';
import hosannaImportPrefix from './rules/hosanna-import-prefix';
import noJsonImports from './rules/no-json-imports';
import noAwaitExpression from './rules/no-await-expression';
import noNestedFunctions from './rules/no-nested-functions';
import noInlineClasses from './rules/no-inline-classes';
import noComputedPropertiesInObjects from './rules/no-computed-properties-in-objects';
import noConsoleMethods from './rules/no-console-methods';
import noDateUsage from './rules/no-date-usage';
import noReservedWords from './rules/no-reserved-words';
import noUnsupportedArrayMethods from './rules/no-unsupported-array-methods';
import noUnsupportedStringMethods from './rules/no-unsupported-string-methods';
import noEpsilonUsage from './rules/no-epsilon-usage';
import noNumberIsNaN from './rules/no-number-isnan';
import noUnsupportedSpreadOperator from './rules/no-unsupported-spread-operator';
import noArgumentBinding from './rules/no-argument-binding';
import noNonNullOnCallExpression from './rules/no-non-null-on-call-expression';
import noIsNaNUnreliable from './rules/no-isnan-unreliable';
import noLargeNumericLiterals from './rules/no-large-numeric-literals';
import noFunctionExpressionOnAnonymousObject from './rules/no-function-expression-on-anonymous-object';
import noUnsupportedDeleteOperator from './rules/no-unsupported-delete-operator';
import noRestOperator from './rules/no-rest-operator';
import noIifeUsage from './rules/no-iife-usage';
import noTsModuleDeclarations from './rules/no-ts-module-declarations';
import noFunctionReferenceOutsideModule from './rules/no-function-reference-outside-module';
import noClosureVariableModification from './rules/no-closure-variable-modification';

const plugin = {
  rules: {
    'no-hosanna-generated-imports': noHosannaGeneratedImports,
    'hosanna-import-prefix': hosannaImportPrefix,
    'no-json-imports': noJsonImports,
    'no-await-expression': noAwaitExpression,
    'no-nested-functions': noNestedFunctions,
    'no-inline-classes': noInlineClasses,
    'no-computed-properties-in-objects': noComputedPropertiesInObjects,
    'no-console-methods': noConsoleMethods,
    'no-date-usage': noDateUsage,
    'no-reserved-words': noReservedWords,
    'no-unsupported-array-methods': noUnsupportedArrayMethods,
    'no-unsupported-string-methods': noUnsupportedStringMethods,
    'no-epsilon-usage': noEpsilonUsage,
    'no-number-isnan': noNumberIsNaN,
    'no-unsupported-spread-operator': noUnsupportedSpreadOperator,
    'no-argument-binding': noArgumentBinding,
    'no-non-null-on-call-expression': noNonNullOnCallExpression,
    'no-isnan-unreliable': noIsNaNUnreliable,
    'no-large-numeric-literals': noLargeNumericLiterals,
    'no-function-expression-on-anonymous-object': noFunctionExpressionOnAnonymousObject,
    'no-unsupported-delete-operator': noUnsupportedDeleteOperator,
    'no-rest-operator': noRestOperator,
    'no-iife-usage': noIifeUsage,
    'no-ts-module-declarations': noTsModuleDeclarations,
    'no-function-reference-outside-module': noFunctionReferenceOutsideModule,
    'no-closure-variable-modification': noClosureVariableModification,
  },
};

export default plugin;
