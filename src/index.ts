import noHosannaGeneratedImports from './rules/no-hosanna-generated-imports';
import hosannaImportPrefix from './rules/hosanna-import-prefix';

const plugin = {
  rules: {
    'no-hosanna-generated-imports': noHosannaGeneratedImports,
    'hosanna-import-prefix': hosannaImportPrefix,
  },
};

export default plugin;
