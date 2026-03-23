/**
 * File-level exclusion: only true when hs:exclude-from-platform roku appears
 * in the comment-only prefix (before any executable code). Line-level directives
 * (after code starts) are handled separately (see hs-disable.ts), matching BabelProgram.isSkippingNode.
 */
export function hasExcludeFromPlatformRokuDirective(content: string): boolean {
  const lines = content.split(/\r?\n/);
  const directiveRegex = /hs:exclude-from-platform\s+roku/i;
  let inBlockComment = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (inBlockComment) {
      if (directiveRegex.test(line)) return true;
      if (trimmed.includes('*/')) inBlockComment = false;
      continue;
    }
    if (trimmed.startsWith('/*')) {
      if (directiveRegex.test(line)) return true;
      inBlockComment = !trimmed.includes('*/');
      continue;
    }
    if (trimmed === '' || trimmed.startsWith('//')) {
      if (directiveRegex.test(line)) return true;
      continue;
    }

    const beforeLineComment = line.split('//')[0];
    const codePart = beforeLineComment.replace(/\/\*[\s\S]*?\*\//g, '').trim();
    if (codePart && codePart !== '*' && !codePart.startsWith('*')) {
      return false;
    }
    if (directiveRegex.test(line)) return true;
  }
  return false;
}
