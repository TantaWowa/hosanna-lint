import { Rule } from 'eslint';
import * as fs from 'fs';
import { resolveAppConfig, resolveAppConfigInput } from './app-config-resolver';

interface AppConfigCache {
  config: Record<string, unknown> | null;
  fileNotFound: boolean;
  fileFingerprints: Map<string, FileFingerprint | null>;
}

interface FileFingerprint {
  mtimeMs: number;
  ctimeMs: number;
  size: number;
}

// Cache per resolved app config path so every linted file in the same project
// reuses one parsed config, while editor sessions still see file changes.
const configCache = new Map<string, AppConfigCache>();

function getFileFingerprint(filePath: string): FileFingerprint | null {
  try {
    const stat = fs.statSync(filePath);
    return { mtimeMs: stat.mtimeMs, ctimeMs: stat.ctimeMs, size: stat.size };
  } catch {
    return null;
  }
}

function captureFileFingerprints(filePaths: string[]): Map<string, FileFingerprint | null> {
  const fingerprints = new Map<string, FileFingerprint | null>();
  for (const filePath of filePaths) {
    fingerprints.set(filePath, getFileFingerprint(filePath));
  }
  return fingerprints;
}

function sameFileFingerprint(a: FileFingerprint | null, b: FileFingerprint | null): boolean {
  if (a === null || b === null) {
    return a === b;
  }
  return a.mtimeMs === b.mtimeMs && a.ctimeMs === b.ctimeMs && a.size === b.size;
}

function isCacheFresh(cache: AppConfigCache): boolean {
  for (const [filePath, cachedFingerprint] of cache.fileFingerprints) {
    if (!sameFileFingerprint(getFileFingerprint(filePath), cachedFingerprint)) {
      return false;
    }
  }
  return true;
}

/**
 * Load app.config.json from assets/meta/app.config.json relative to project root
 * Returns null if file doesn't exist or can't be parsed
 */
export function getAppConfig(context: Rule.RuleContext): Record<string, unknown> | null {
  const cwd = context.getCwd();
  const selectedFile = resolveAppConfigInput(cwd);
  const cache = configCache.get(selectedFile);
  if (cache && isCacheFresh(cache)) {
    return cache.config;
  }

  try {
    const resolved = resolveAppConfig(cwd);
    const dependencyFiles = Array.from(new Set([resolved.selectedFile, ...resolved.dependencyFiles]));
    const nextCache = {
      config: resolved.config,
      fileNotFound: false,
      fileFingerprints: captureFileFingerprints(dependencyFiles),
    };

    configCache.set(selectedFile, nextCache);
    return nextCache.config;
  } catch (_error) {
    const nextCache = {
      config: null,
      fileNotFound: true,
      fileFingerprints: captureFileFingerprints([selectedFile]),
    };
    configCache.set(selectedFile, nextCache);
    return null;
  }
}

/**
 * Get JSON value by dot-notation path
 * @param config - The JSON object to traverse
 * @param pathStr - Dot-notation path (e.g., "theme.colors.primary")
 * @returns The value at the path, or undefined if not found
 */
export function getJsonValueByPath(config: Record<string, unknown> | null | undefined, pathStr: string): unknown {
  if (!config || typeof config !== 'object') {
    return undefined;
  }

  // Empty path returns the config itself
  if (pathStr === '') {
    return config;
  }

  const parts = pathStr.split('.');
  let current: unknown = config;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
    if (current === undefined) {
      return undefined;
    }
  }
  return current;
}

/**
 * Check if a JSON path exists in the config
 * @param config - The JSON object to check
 * @param pathStr - Dot-notation path (e.g., "theme.colors.primary")
 * @returns true if the path exists, false otherwise
 */
export function jsonPathExists(config: Record<string, unknown> | null | undefined, pathStr: string): boolean {
  // Handle locale.* prefix - it resolves to translations.<locale>.*
  // Check all available locales in translations section
  // It's enough if the path exists in any locale
  if (pathStr.startsWith('locale.')) {
    const restOfPath = pathStr.substring('locale.'.length);
    const translations = config?.translations;
    
    if (translations && typeof translations === 'object') {
      // Check if the path exists in any locale
      for (const locale in translations) {
        const localePath = `translations.${locale}.${restOfPath}`;
        if (getJsonValueByPath(config, localePath) !== undefined) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  return getJsonValueByPath(config, pathStr) !== undefined;
}
