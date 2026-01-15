import { Rule } from 'eslint';
import * as fs from 'fs';
import * as path from 'path';

interface AppConfigCache {
  config: any | null;
  loaded: boolean;
  fileNotFound: boolean;
}

// Cache per ESLint context
const configCache = new WeakMap<Rule.RuleContext, AppConfigCache>();

/**
 * Get or create cache for the given context
 */
function getCache(context: Rule.RuleContext): AppConfigCache {
  let cache = configCache.get(context);
  if (!cache) {
    cache = {
      config: null,
      loaded: false,
      fileNotFound: false,
    };
    configCache.set(context, cache);
  }
  return cache;
}

/**
 * Load app.config.json from assets/meta/app.config.json relative to project root
 * Returns null if file doesn't exist or can't be parsed
 */
export function getAppConfig(context: Rule.RuleContext): any | null {
  const cache = getCache(context);

  // Return cached config if already loaded
  if (cache.loaded) {
    return cache.config;
  }

  // Mark as loaded to prevent infinite loops
  cache.loaded = true;

  try {
    const projectRoot = context.getCwd();
    const configPath = path.join(projectRoot, 'assets', 'meta', 'app.config.json');

    // Check if file exists
    if (!fs.existsSync(configPath)) {
      cache.fileNotFound = true;
      cache.config = null;
      return null;
    }

    // Read and parse JSON
    const fileContent = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(fileContent);

    cache.config = config;
    cache.fileNotFound = false;
    return config;
  } catch (_error) {
    // If there's an error reading or parsing, return null
    cache.config = null;
    cache.fileNotFound = true;
    return null;
  }
}

/**
 * Get JSON value by dot-notation path
 * @param config - The JSON object to traverse
 * @param pathStr - Dot-notation path (e.g., "theme.colors.primary")
 * @returns The value at the path, or undefined if not found
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getJsonValueByPath(config: any, pathStr: string): any {
  if (!config || typeof config !== 'object') {
    return undefined;
  }

  // Empty path returns the config itself
  if (pathStr === '') {
    return config;
  }

  const parts = pathStr.split('.');
  let current = config;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = current[part];
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function jsonPathExists(config: any, pathStr: string): boolean {
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

