import * as fs from 'fs';
import * as path from 'path';

export type JsonObject = Record<string, unknown>;

export interface ResolvedAppConfig {
  config: JsonObject;
  selectedFile: string;
  dependencyFiles: string[];
}

export function isAppConfigFileName(filename: string): boolean {
  const normalized = filename.replace(/\\/g, '/');
  return /(^|\/)app\.config(?:\.[^/]+)?\.json$/.test(normalized);
}

export function resolveAppConfigInput(cwd: string, input?: string): string {
  const root = path.resolve(cwd);
  const selector = input?.trim();
  if (!selector) {
    return path.join(root, 'assets', 'meta', 'app.config.json');
  }
  if (path.isAbsolute(selector)) {
    return path.normalize(selector);
  }
  if (selector.includes('/') || selector.includes('\\')) {
    return path.resolve(root, selector);
  }
  if (selector.startsWith('app.config.') && selector.endsWith('.json')) {
    return path.join(root, 'assets', 'meta', selector);
  }
  if (selector.endsWith('.json')) {
    return path.join(root, 'assets', 'meta', selector);
  }
  return path.join(root, 'assets', 'meta', `app.config.${selector}.json`);
}

export function resolveAppConfig(cwd: string, input?: string): ResolvedAppConfig {
  const selectedFile = resolveAppConfigInput(cwd, input);
  return resolveAppConfigFromFile(selectedFile);
}

export function resolveAppConfigFromFile(filePath: string): ResolvedAppConfig {
  const dependencyFiles: string[] = [];
  const selectedFile = path.normalize(filePath);
  const config = resolveAppConfigFile(selectedFile, [], dependencyFiles);
  return { config, selectedFile, dependencyFiles };
}

export function resolveAppConfigFromParsedFile(filePath: string, parsedConfig: JsonObject): ResolvedAppConfig {
  const dependencyFiles: string[] = [];
  const selectedFile = path.normalize(filePath);
  const config = resolveAppConfigFile(selectedFile, [], dependencyFiles, parsedConfig);
  return { config, selectedFile, dependencyFiles };
}

function resolveAppConfigFile(filePath: string, stack: string[], dependencies: string[], parsedOverride?: JsonObject): JsonObject {
  const normalizedFilePath = path.normalize(filePath);
  if (stack.includes(normalizedFilePath)) {
    throw new Error(`Circular app config inheritance detected: ${[...stack, normalizedFilePath].join(' -> ')}`);
  }
  if (!parsedOverride && !fs.existsSync(normalizedFilePath)) {
    throw new Error(`App config file not found: ${normalizedFilePath}`);
  }

  let parsed: unknown;
  try {
    parsed = parsedOverride ?? JSON.parse(fs.readFileSync(normalizedFilePath, 'utf-8'));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse app config ${normalizedFilePath}: ${message}`);
  }
  if (!isPlainObject(parsed)) {
    throw new Error(`App config must be a JSON object: ${normalizedFilePath}`);
  }

  validateExtendFileUsage(parsed, normalizedFilePath);
  const child = omitExtendFile(parsed);
  const extendFile = parsed.$extendFile;
  let resolved = child;
  if (extendFile !== undefined) {
    const parent = resolveAppConfigFile(resolveExtendFilePath(extendFile, normalizedFilePath), [...stack, normalizedFilePath], dependencies);
    resolved = deepMerge(parent, child) as JsonObject;
  }

  if (!dependencies.includes(normalizedFilePath)) {
    dependencies.push(normalizedFilePath);
  }
  return resolved;
}

export function validateExtendFileUsage(value: unknown, filePath: string, jsonPath = '$'): void {
  if (!value || typeof value !== 'object') {
    return;
  }
  const record = value as JsonObject;
  if (Object.prototype.hasOwnProperty.call(record, '$extendFile')) {
    if (jsonPath !== '$') {
      throw new Error(`$extendFile is only allowed at the root of ${filePath}; found at ${jsonPath}`);
    }
    if (typeof record.$extendFile !== 'string') {
      throw new Error(`$extendFile in ${filePath} must be a string`);
    }
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => validateExtendFileUsage(item, filePath, `${jsonPath}.${index}`));
    return;
  }
  for (const key of Object.keys(record)) {
    if (key !== '$extendFile') {
      validateExtendFileUsage(record[key], filePath, `${jsonPath}.${key}`);
    }
  }
}

function resolveExtendFilePath(extendFile: unknown, declaringFilePath: string): string {
  if (typeof extendFile !== 'string') {
    throw new Error(`$extendFile in ${declaringFilePath} must be a string`);
  }
  if (path.isAbsolute(extendFile)) {
    return path.normalize(extendFile);
  }
  return path.normalize(path.resolve(path.dirname(declaringFilePath), extendFile));
}

function omitExtendFile(config: JsonObject): JsonObject {
  const result: JsonObject = {};
  for (const key of Object.keys(config)) {
    if (key !== '$extendFile') {
      result[key] = config[key];
    }
  }
  return result;
}

function deepMerge(parent: unknown, child: unknown): unknown {
  if (isPlainObject(parent) && isPlainObject(child)) {
    const merged: JsonObject = { ...parent };
    for (const key of Object.keys(child)) {
      merged[key] = deepMerge(merged[key], child[key]);
    }
    return merged;
  }
  if (Array.isArray(child)) {
    return child.slice();
  }
  return child;
}

function isPlainObject(value: unknown): value is JsonObject {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
