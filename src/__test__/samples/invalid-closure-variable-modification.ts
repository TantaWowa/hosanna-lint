// Invalid: closure variable modification
let counter = 0;
function increment() {
  counter = counter + 1; // Modifying closure variable
}

let value = 42;
const func = () => {
  value = value * 2; // Modifying closure variable
};

let count = 0;
function increment() {
  count++; // Modifying closure variable
}
