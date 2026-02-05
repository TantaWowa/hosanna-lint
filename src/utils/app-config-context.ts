/**
 * Context detection utilities for app.config.json validation
 * Determines the current context within the JSON structure
 */

export type AppConfigContext =
  | { type: 'rows'; rowKey?: string }
  | { type: 'cells'; cellKey?: string }
  | { type: 'row.focusSettings'; rowKey?: string }
  | { type: 'row.headerSettings'; rowKey?: string }
  | { type: 'cell.views.base'; cellKey?: string; index?: number }
  | { type: 'cell.stateOverride'; cellKey?: string; state: 'normal' | 'focused' | 'disabled' | 'selected'; viewId?: string }
  | { type: 'cell.views'; cellKey?: string }
  | null;

/**
 * Parse a JSON path string (e.g., "rows.someRow.focusSettings.horizAnimSettings")
 * and return the context
 */
export function getContextAtPath(jsonPath: string): AppConfigContext {
  if (!jsonPath) {
    return null;
  }

  const parts = jsonPath.split('.');

  // Check if we're in rows context
  if (parts[0] === 'rows') {
    if (parts.length === 1) {
      return { type: 'rows' };
    }
    
    const rowKey = parts[1];
    
    if (parts.length === 2) {
      return { type: 'rows', rowKey };
    }
    
    if (parts[2] === 'focusSettings') {
      return { type: 'row.focusSettings', rowKey };
    }
    
    if (parts[2] === 'headerSettings') {
      return { type: 'row.headerSettings', rowKey };
    }
    
    // Still in rows context, deeper nesting
    return { type: 'rows', rowKey };
  }

  // Check if we're in cells context
  if (parts[0] === 'cells') {
    if (parts.length === 1) {
      return { type: 'cells' };
    }
    
    const cellKey = parts[1];
    
    if (parts.length === 2) {
      return { type: 'cells', cellKey };
    }
    
    if (parts[2] === 'views') {
      if (parts.length === 3) {
        return { type: 'cell.views', cellKey };
      }
      
      if (parts[3] === 'base') {
        // Could be cells.someCell.views.base or cells.someCell.views.base[0]
        const baseIndex = parts[4] ? parseInt(parts[4].replace(/\[|\]/g, ''), 10) : undefined;
        return { type: 'cell.views.base', cellKey, index: isNaN(baseIndex as number) ? undefined : baseIndex };
      }
      
      // Check for state overrides: cells.someCell.views.normal.viewId
      if (parts[3] === 'normal' || parts[3] === 'focused' || parts[3] === 'disabled' || parts[3] === 'selected') {
        const state = parts[3] as 'normal' | 'focused' | 'disabled' | 'selected';
        const viewId = parts.length > 4 ? parts[4] : undefined;
        return { type: 'cell.stateOverride', cellKey, state, viewId };
      }
    }
    
    // Still in cells context, deeper nesting
    return { type: 'cells', cellKey };
  }

  return null;
}

/**
 * Check if a JSON path is within rows context
 */
export function isInRowsContext(jsonPath: string): boolean {
  const context = getContextAtPath(jsonPath);
  return context !== null && (
    context.type === 'rows' ||
    context.type === 'row.focusSettings' ||
    context.type === 'row.headerSettings'
  );
}

/**
 * Check if a JSON path is within cells context
 */
export function isInCellsContext(jsonPath: string): boolean {
  const context = getContextAtPath(jsonPath);
  return context !== null && (
    context.type === 'cells' ||
    context.type === 'cell.views' ||
    context.type === 'cell.views.base' ||
    context.type === 'cell.stateOverride'
  );
}

/**
 * Extract subType from a scenegraph node
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSubTypeFromNode(node: any): string | null {
  if (!node || typeof node !== 'object') {
    return null;
  }
  
  if (typeof node.subType === 'string') {
    return node.subType;
  }
  
  return null;
}

/**
 * Extract subType from views.base array item
 * Path format: cells.someCell.views.base[0]
 */
export function getSubTypeFromBaseView(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: any,
  cellKey: string,
  index: number
): string | null {
  try {
    const baseViews = config?.cells?.[cellKey]?.views?.base;
    if (Array.isArray(baseViews) && baseViews[index]) {
      return getSubTypeFromNode(baseViews[index]);
    }
  } catch {
    // Ignore errors
  }
  
  return null;
}

/**
 * Extract subType from cell base view (for state overrides)
 */
export function getSubTypeFromCellBaseView(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: any,
  cellKey: string,
  viewId: string
): string | null {
  try {
    const baseViews = config?.cells?.[cellKey]?.views?.base;
    if (Array.isArray(baseViews)) {
      const view = baseViews.find((v: any) => v?.id === viewId);
      return getSubTypeFromNode(view);
    }
  } catch {
    // Ignore errors
  }
  
  return null;
}

/**
 * Get the row key from a JSON path
 */
export function getRowKeyFromPath(jsonPath: string): string | null {
  const context = getContextAtPath(jsonPath);
  if (context && ('rowKey' in context)) {
    return context.rowKey || null;
  }
  return null;
}

/**
 * Get the cell key from a JSON path
 */
export function getCellKeyFromPath(jsonPath: string): string | null {
  const context = getContextAtPath(jsonPath);
  if (context && ('cellKey' in context)) {
    return context.cellKey || null;
  }
  return null;
}
