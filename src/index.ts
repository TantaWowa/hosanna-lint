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
  },
};

export default plugin;
