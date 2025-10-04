// Invalid: computed properties in objects
const obj1 = { [variable]: 'value' };
const obj2 = { [someFunction()]: 'value' };
const obj3 = { [a + b]: 'value' };

// Valid cases (should not trigger)
const validObj = {
  ['literal']: 'allowed',
  [123]: 'number allowed',
  [MyEnum.VALUE]: 'enum allowed',
};

enum MyEnum {
  VALUE = 'test'
}
