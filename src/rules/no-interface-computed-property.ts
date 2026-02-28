import { Rule } from 'eslint';

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'HS-1080: Disallow computed property names in interface declarations. Use actual string/enum values to declare interface fields.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      interfaceComputedPropertyNotAllowed:
        'HS-1080: Computed property names are not allowed in interface declarations. Use the actual value to declare the field. e.g. interface IExample { myField: string } instead of interface IExample { [MyEnum.MyField]: string }.',
    },
  },
  create: function (context) {
    return {
      TSPropertySignature: function (node) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tsNode = node as any;
        if (tsNode.computed && tsNode.parent?.type === 'TSInterfaceBody') {
          context.report({ node, messageId: 'interfaceComputedPropertyNotAllowed' });
        }
      },
    };
  },
};

export default rule;
