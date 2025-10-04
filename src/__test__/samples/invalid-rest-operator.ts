// Invalid: rest operator usage
function test(...args) {}
const [a, b, ...rest] = arr;
const { x, y, ...others } = obj;
