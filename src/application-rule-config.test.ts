import { describe, expect, it } from 'vitest';
import pluginModule from './index';

const plugin = pluginModule as {
  rules: Record<string, { meta?: { fixable?: string; messages?: Record<string, string> } }>;
  configs: { recommended: { rules: Record<string, string> } };
};
const checks = [
  ['require-lifecycle-super', 'error'],
  ['no-side-effects-in-get-views', 'error'],
  ['subscription-cleanup', 'warn'],
  ['focus-target-valid', 'error'],
  ['batch-data-source-updates', 'warn'],
] as const;

describe('application lifecycle, focus and batching preset', () => {
  it.each(checks)('exports and enables %s at %s', (name, severity) => {
    expect(plugin.rules[name]).toBeDefined();
    expect(plugin.configs.recommended.rules[`@hosanna-eslint/${name}`]).toBe(severity);
    expect(plugin.rules[name].meta?.fixable).toBeUndefined();
    expect(Object.keys(plugin.rules[name].meta?.messages ?? {})).not.toHaveLength(0);
  });
});
