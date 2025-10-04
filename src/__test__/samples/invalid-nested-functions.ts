// Invalid: nested function declarations
function outer() {
  function inner() {
    return 42;
  }
  return inner();
}

class MyClass {
  method() {
    function helper() {
      return this.value;
    }
    return helper();
  }
}
