import noHosannaGeneratedImports from './rules/no-hosanna-generated-imports';
import hosannaImportPrefix from './rules/hosanna-import-prefix';
import noJsonImports from './rules/no-json-imports';
import noAwaitExpression from './rules/no-await-expression';
import noNestedFunctions from './rules/no-nested-functions';
import noInlineClasses from './rules/no-inline-classes';
import noComputedPropertiesInObjects from './rules/no-computed-properties-in-objects';
import noConsoleMethods from './rules/no-console-methods';
import noDateUsage from './rules/no-date-usage';

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
  },
};

export default plugin;
