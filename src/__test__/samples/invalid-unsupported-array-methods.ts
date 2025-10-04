// Invalid: unsupported Array methods
const arr = [1, 2, 3];
arr.find(item => item > 2);
arr.findIndex(item => item > 2);
arr.includes(2);
arr.flat();
