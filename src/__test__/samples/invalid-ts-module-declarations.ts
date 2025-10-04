// Invalid: TypeScript module declarations
declare module 'myModule' { export const value: string; }
module MyModule { export const value = 42; }
declare global { const globalValue: string; }
