import * as fs from 'fs';
import * as path from 'path';
import { JsonObject, resolveAppConfig, resolveAppConfigInput } from './app-config-resolver';

export interface StyleAppConfigs {
  configs: JsonObject[];
  inputs: string[];
  unresolved: boolean;
}

type Fingerprint = string | undefined;
type CacheEntry = { selection: StyleAppConfigs; files: Map<string, Fingerprint> };
const cache = new Map<string, CacheEntry>();

function fingerprint(file: string): Fingerprint {
  try {
    const stat = fs.statSync(file);
    return `${stat.mtimeMs}:${stat.ctimeMs}:${stat.size}`;
  } catch {
    return undefined;
  }
}

function object(value: unknown): JsonObject | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonObject : undefined;
}

function selector(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

/** Collect declared alternatives, not a synthetic config merging different apps. */
function declaredInputs(run: JsonObject): string[] {
  const inputs = new Set<string>();
  function visit(value: unknown): void {
    const scope = object(value);
    if (!scope) return;
    const compiler = object(scope.appConfigCompiler);
    const input = compiler?.enabled !== false ? selector(compiler?.input) : undefined;
    const selected = input ?? selector(scope.appConfig);
    if (selected) inputs.add(selected);
    for (const key of ['platforms', 'environments']) {
      for (const child of Object.values(object(scope[key]) ?? {})) visit(child);
    }
  }
  visit(run.defaults);
  for (const app of Object.values(object(run.apps) ?? {})) visit(app);
  return [...inputs];
}

/**
 * Without an explicit per-file selection, a shared-source lint can prove only
 * that a path is absent from every project-declared candidate. It cannot infer
 * which app/platform executes that source, or validate all brand combinations.
 */
export function getStyleAppConfigs(cwd: string, explicitInputs?: string[]): StyleAppConfigs {
  const root = path.resolve(cwd);
  const key = JSON.stringify([root, explicitInputs]);
  const cached = cache.get(key);
  if (cached && [...cached.files].every(([file, value]) => fingerprint(file) === value)) return cached.selection;

  const dependencies = new Set<string>();
  let inputs = explicitInputs;
  if (!inputs) {
    const runFile = path.join(root, '.hosanna-tools', 'run.json');
    dependencies.add(runFile);
    if (fs.existsSync(runFile)) {
      try {
        const run = object(JSON.parse(fs.readFileSync(runFile, 'utf8')));
        if (!run || (run.schemaVersion !== undefined && run.schemaVersion !== 1)) {
          return { configs: [], inputs: [], unresolved: true };
        }
        inputs = declaredInputs(run);
      } catch {
        return { configs: [], inputs: [], unresolved: true };
      }
    }
  }
  const selectedFiles = [...new Set((inputs?.length ? inputs : ['assets/meta/app.config.json'])
    .map(input => resolveAppConfigInput(root, input)))];
  const selection: StyleAppConfigs = {
    configs: [],
    inputs: selectedFiles.map(file => path.relative(root, file).replace(/\\/g, '/')),
    unresolved: false,
  };
  for (const selectedFile of selectedFiles) {
    try {
      const resolved = resolveAppConfig(root, selectedFile);
      selection.configs.push(resolved.config);
      for (const dependency of resolved.dependencyFiles) dependencies.add(dependency);
    } catch {
      selection.unresolved = true;
    }
  }
  // Failed inheritance may depend on a missing parent. Retry next time rather
  // than caching an incomplete dependency set and hiding a newly created file.
  if (!selection.unresolved) {
    cache.set(key, { selection, files: new Map([...dependencies].map(file => [file, fingerprint(file)])) });
  }
  return selection;
}
