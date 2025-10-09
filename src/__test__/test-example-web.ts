// hs:exclude-from-platform web
const test = async () => {
  const a = await someFunction(); // This would normally trigger no-await-expression
  return a;
};
