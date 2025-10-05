// This file should be processed normally
const test = async () => {
  const a = await someFunction(); // This should trigger no-await-expression
  return a;
};
