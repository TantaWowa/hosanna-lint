// Invalid: await expressions
const result = await Promise.resolve(42);

async function example() {
  const data = await fetchData();
  return data;
}
