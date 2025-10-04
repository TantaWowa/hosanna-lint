// Invalid: function references outside modules
const myFunc = function() { return 42; };
const arrowFunc = () => { console.log('hello'); };
let funcVar; funcVar = function(x) { return x * 2; };
