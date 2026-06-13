import { describe, expect, it } from 'vitest';
import * as ts from 'typescript';
import { findInterfaceDeclaration } from './binary-comparison-type-utils';

function createProgramWithSource(text: string): { program: ts.Program; getSourceFilesCalls: () => number } {
  const sourceFile = ts.createSourceFile('test.ts', text, ts.ScriptTarget.Latest, true);
  let calls = 0;
  const program = {
    getSourceFiles() {
      calls += 1;
      return [sourceFile];
    },
  } as unknown as ts.Program;

  return { program, getSourceFilesCalls: () => calls };
}

describe('binary-comparison-type-utils', () => {
  it('caches interface declaration lookups per program and interface name', () => {
    const { program, getSourceFilesCalls } = createProgramWithSource('interface IHsIdentifiable { _hid: string }');

    const first = findInterfaceDeclaration(program, 'IHsIdentifiable');
    const second = findInterfaceDeclaration(program, 'IHsIdentifiable');

    expect(first).toBeDefined();
    expect(second).toBe(first);
    expect(getSourceFilesCalls()).toBe(1);
  });

  it('caches missing interface lookups per program and interface name', () => {
    const { program, getSourceFilesCalls } = createProgramWithSource('interface Other { value: string }');

    const first = findInterfaceDeclaration(program, 'IHsIdentifiable');
    const second = findInterfaceDeclaration(program, 'IHsIdentifiable');

    expect(first).toBeUndefined();
    expect(second).toBeUndefined();
    expect(getSourceFilesCalls()).toBe(1);
  });
});
