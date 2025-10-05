// hs:exclude-from-platform roku
const test = async () => {
  const a = await someFunction(); // This would normally trigger no-await-expression
  return a;
};