import { describe, it, expect } from 'vitest';
import { hasExcludeFromPlatformRokuDirective } from './excludeFromPlatformRoku';

describe('hasExcludeFromPlatformRokuDirective', () => {
  describe('file-level (directive in comment-only prefix)', () => {
    it('returns true when directive is first line', () => {
      const content = `// hs:exclude-from-platform roku
function foo() {}
`;
      expect(hasExcludeFromPlatformRokuDirective(content)).toBe(true);
    });

    it('returns true when directive is after other comments', () => {
      const content = `// hs:no-module
// some lint thing
// hs:exclude-from-platform roku
function foo() {}
`;
      expect(hasExcludeFromPlatformRokuDirective(content)).toBe(true);
    });

    it('returns true when directive is inside multi-line comment block', () => {
      const content = `/*
 * hs:exclude-from-platform roku
 * more comments
 */
function foo() {}
`;
      expect(hasExcludeFromPlatformRokuDirective(content)).toBe(true);
    });

    it('returns false for exclude-from-platform web in prefix (Roku lint must still run)', () => {
      const content = `// hs:exclude-from-platform web
const x = 1;
`;
      expect(hasExcludeFromPlatformRokuDirective(content)).toBe(false);
    });
  });

  describe('line-level (directive after code - NOT file-level)', () => {
    it('returns false when directive is inside function body', () => {
      const content = `// hs:no-module
function _main() {
  let v = 0;
  // hs:exclude-from-platform roku
  v = 1;
}
`;
      expect(hasExcludeFromPlatformRokuDirective(content)).toBe(false);
    });

    it('returns false when directive is after first code line', () => {
      const content = `const x = 1;
// hs:exclude-from-platform roku
const y = 2;
`;
      expect(hasExcludeFromPlatformRokuDirective(content)).toBe(false);
    });
  });
});
