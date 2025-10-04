// Invalid: inline class declarations
function createClass() {
  class InlineClass {
    constructor() {}
  }
  return new InlineClass();
}

class Container {
  factory = () => {
    class NestedClass {
      value: number;
    }
    return NestedClass;
  };
}
