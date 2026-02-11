/**
 * Schema definitions for app.config.json validation
 * Based on CollectionView API and ViewFragment Style specifications
 */

export interface FieldDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  enumValues?: string[];
  required: boolean;
  description: string;
  // For arrays, specify the item type
  arrayItemType?: 'string' | 'number' | 'object';
  // For arrays of tuples (e.g., [number, number])
  tupleTypes?: string[];
}

/**
 * CollectionView Row Settings fields
 */
export const CollectionViewRowSettingsFields: FieldDefinition[] = [
  { name: 'rowType', type: 'string', required: false, description: 'Type of the row (e.g., "horizontal", "vertical")' },
  { name: 'customViewType', type: 'string', required: false, description: 'Class name of custom view to use' },
  { name: 'height', type: 'number', required: false, description: 'Height of the row in pixels' },
  { name: 'contentOffset', type: 'array', required: false, description: 'X, Y offset for content within the row', tupleTypes: ['number', 'number'] },
  { name: 'spacing', type: 'number', required: false, description: 'Space between items in pixels' },
  { name: 'cellSize', type: 'array', required: false, description: 'Width, Height of each cell', tupleTypes: ['number', 'number'] },
  { name: 'screenPosition', type: 'array', required: false, description: 'X, Y position on screen for focused row', tupleTypes: ['number', 'number'] },
  { name: 'cellSettingsKey', type: 'string', required: false, description: 'Key for cell settings in style config' },
  { name: 'loadingCellStyleKey', type: 'string', required: false, description: 'Key for loading cell style' },
  { name: 'headerSettings', type: 'object', required: false, description: 'Header configuration' },
  { name: 'focusSettings', type: 'object', required: false, description: 'Focus indicator configuration' },
  { name: 'numCols', type: 'number', required: false, description: 'Number of columns in the row' },
  { name: 'sectionHeader', type: 'boolean', required: false, description: 'Whether row is a section header' },
  { name: 'sectionName', type: 'string', required: false, description: 'Name of the section' },
  { name: 'parentSectionName', type: 'string', required: false, description: 'Name of parent section' },
  { name: 'tabGroupName', type: 'string', required: false, description: 'Name of tab group' },
  { name: 'parentTabGroupName', type: 'string', required: false, description: 'Name of parent tab group' },
  { name: 'tabGroupSelector', type: 'boolean', required: false, description: 'Whether row is a tab group selector' },
  { name: 'defaultSelectedTab', type: 'string', required: false, description: 'Default selected tab name' },
  { name: 'selectTriggers', type: 'array', required: false, description: 'DSL triggers for selection', arrayItemType: 'string' },
  { name: 'supportsDynamicWidth', type: 'boolean', required: false, description: 'Whether row supports dynamic width' },
  { name: 'isVariableWidth', type: 'boolean', required: false, description: 'Whether cells have variable widths (HorizontalRow only)' },
  { name: 'clippingRect', type: 'array', required: false, description: 'Clipping rectangle [x, y, width, height]', tupleTypes: ['number', 'number', 'number', 'number'] },
  { name: 'showSelectedStyles', type: 'boolean', required: false, description: 'Whether to apply selected styles' },
  { name: 'showFocusFootprint', type: 'boolean', required: false, description: 'Whether to show focus footprint' },
  { name: 'focusStrategy', type: 'string', required: false, description: 'Focus strategy enum value', enumValues: ['focusOnPreviousItem', 'focusOnClosestItem', 'focusOnSelectedItem'] },
  { name: 'epgStartTimeInSeconds', type: 'number', required: false, description: 'EPG start time in seconds' },
  { name: 'viewportWidth', type: 'number', required: false, description: 'Width of viewport for this row' },
  { name: 'canPeekInto', type: 'boolean', required: false, description: 'Whether to peek into the row' },
  { name: 'peekAheadHeight', type: 'number', required: false, description: 'Height to peek ahead in pixels' },
];

/**
 * CollectionView Focus Settings fields
 */
export const CollectionViewFocusSettingsFields: FieldDefinition[] = [
  { name: 'horizAnimSettings', type: 'string', required: false, description: 'Horizontal animation style', enumValues: ['floating', 'fixed'] },
  { name: 'canLongPress', type: 'boolean', required: false, description: 'Whether long press is enabled' },
  { name: 'vertAnimSettings', type: 'string', required: false, description: 'Vertical animation style', enumValues: ['fixed'] },
  { name: 'hideFocusIndicator', type: 'boolean', required: false, description: 'Whether to hide focus indicator' },
  { name: 'indicatorImageUri', type: 'string', required: false, description: 'URI for focus indicator image' },
  { name: 'indicatorBlendColor', type: 'string', required: false, description: 'Blend color for focus indicator (hex color)' },
  { name: 'feedbackOffsets', type: 'array', required: false, description: 'Feedback offsets [left, top, right, bottom]', tupleTypes: ['number', 'number', 'number', 'number'] },
  { name: 'focusedScale', type: 'number', required: false, description: 'Scale factor when focused (e.g., 1.05)' },
];

/**
 * CollectionView Header Settings fields
 */
export const CollectionViewHeaderSettingsFields: FieldDefinition[] = [
  { name: 'headerAppearance', type: 'string', required: false, description: 'Header appearance style', enumValues: ['none', 'onTop', 'underneath'] },
  { name: 'headerClass', type: 'string', required: false, description: 'Header class name' },
  { name: 'positionOffset', type: 'array', required: false, description: 'X, Y position offset', tupleTypes: ['number', 'number'] },
  { name: 'height', type: 'number', required: false, description: 'Header height in pixels' },
  { name: 'labelOffset', type: 'array', required: false, description: 'X, Y offset for label within header', tupleTypes: ['number', 'number'] },
  { name: 'fontKey', type: 'string', required: false, description: 'Font key reference' },
  { name: 'textColor', type: 'string', required: false, description: 'Text color (hex or theme reference)' },
  { name: 'backgroundColor', type: 'string', required: false, description: 'Background color (hex or theme reference)' },
  { name: 'backgroundOpacity', type: 'number', required: false, description: 'Background opacity (0.0 to 1.0)' },
  { name: 'backgroundVisible', type: 'boolean', required: false, description: 'Whether background is visible' },
  { name: 'headerComponent', type: 'string', required: false, description: 'Component key for component-based headers' },
];

/**
 * Common SceneGraph Group fields (inherited by all scenegraph nodes)
 */
export const SceneGraphGroupFields: FieldDefinition[] = [
  { name: 'opacity', type: 'number', required: true, description: 'Opacity (0.0 to 1.0)' },
  { name: 'visible', type: 'boolean', required: true, description: 'Visibility flag' },
  { name: 'translation', type: 'array', required: true, description: 'X, Y translation', tupleTypes: ['number', 'number'] },
  { name: 'scale', type: 'array', required: true, description: 'X, Y scale factors', tupleTypes: ['number', 'number'] },
  { name: 'rotation', type: 'number', required: true, description: 'Rotation angle in radians' },
  { name: 'scaleRotateCenter', type: 'array', required: true, description: 'Center point for scale/rotate', tupleTypes: ['number', 'number'] },
  { name: 'clippingRect', type: 'array', required: false, description: 'Clipping rectangle [x, y, width, height]', tupleTypes: ['number', 'number', 'number', 'number'] },
  { name: 'childRenderOrder', type: 'string', required: false, description: 'Child render order' },
  { name: 'enableRenderTracking', type: 'boolean', required: false, description: 'Enable render tracking' },
  { name: 'inheritParentOpacity', type: 'boolean', required: false, description: 'Inherit parent opacity' },
  { name: 'inheritParentTransform', type: 'boolean', required: false, description: 'Inherit parent transform' },
  { name: 'muteAudioGuide', type: 'boolean', required: false, description: 'Mute audio guide' },
  { name: 'renderPass', type: 'number', required: false, description: 'Render pass number' },
  { name: 'renderTracking', type: 'string', required: false, description: 'Render tracking identifier' },
];

/**
 * Common SceneGraph Node fields (base fields)
 */
export const SceneGraphNodeFields: FieldDefinition[] = [
  { name: 'id', type: 'string', required: true, description: 'Unique node identifier' },
  { name: 'subType', type: 'string', required: true, description: 'Node subtype', enumValues: ['Poster', 'Rectangle', 'Group', 'Label', 'MaskGroup'] },
  { name: 'focusable', type: 'boolean', required: false, description: 'Whether node can receive focus' },
  { name: 'change', type: 'object', required: false, description: 'Change tracking object' },
];

/**
 * Poster-specific fields
 */
export const PosterFields: FieldDefinition[] = [
  { name: 'width', type: 'string', required: false, description: 'Poster width in pixels (number or string)' },
  { name: 'height', type: 'string', required: false, description: 'Poster height in pixels (number or string)' },
  { name: 'uri', type: 'string', required: false, description: 'Image URI (supports ${data.field} binding)' },
  { name: 'loadSync', type: 'boolean', required: false, description: 'Load image synchronously' },
  { name: 'loadDisplayMode', type: 'string', required: false, description: 'Image scaling mode', enumValues: ['noScale', 'scaleToFit', 'scaleToFill', 'scaleToZoom', 'limitSize'] },
  { name: 'loadWidth', type: 'string', required: false, description: 'Load width hint (number or string)' },
  { name: 'loadHeight', type: 'string', required: false, description: 'Load height hint (number or string)' },
  { name: 'loadStatus', type: 'string', required: false, description: 'Read-only load status', enumValues: ['none', 'loading', 'ready', 'failed'] },
  { name: 'bitmapWidth', type: 'number', required: false, description: 'Read-only bitmap width' },
  { name: 'bitmapHeight', type: 'number', required: false, description: 'Read-only bitmap height' },
  { name: 'bitmapMargins', type: 'object', required: false, description: 'Read-only bitmap margins' },
  { name: 'blendColor', type: 'string', required: false, description: 'Blend color (hex)' },
  { name: 'failedBitmapUri', type: 'string', required: false, description: 'URI for failed load bitmap' },
  { name: 'failedBitmapOpacity', type: 'number', required: false, description: 'Opacity for failed bitmap' },
  { name: 'loadingBitmapUri', type: 'string', required: false, description: 'URI for loading bitmap' },
  { name: 'loadingBitmapOpacity', type: 'number', required: false, description: 'Opacity for loading bitmap' },
  { name: 'audioGuideText', type: 'string', required: false, description: 'Audio guide text' },
];

/**
 * Rectangle-specific fields
 */
export const RectangleFields: FieldDefinition[] = [
  { name: 'width', type: 'string', required: true, description: 'Rectangle width in pixels (number or string)' },
  { name: 'height', type: 'string', required: true, description: 'Rectangle height in pixels (number or string)' },
  { name: 'color', type: 'string', required: true, description: 'Fill color (hex or theme reference)' },
  { name: 'blendingEnabled', type: 'boolean', required: true, description: 'Enable color blending' },
];

/**
 * Group-specific fields (inherits Group fields, no additional fields)
 */
export const GroupFields: FieldDefinition[] = [
  // Groups inherit all Group fields, no additional fields
];

/**
 * Label-specific fields
 */
export const LabelFields: FieldDefinition[] = [
  { name: 'width', type: 'string', required: true, description: 'Label width in pixels (number or string)' },
  { name: 'height', type: 'string', required: true, description: 'Label height in pixels (number or string)' },
  { name: 'text', type: 'string', required: true, description: 'Label text (supports ${data.field} binding)' },
  { name: 'color', type: 'string', required: true, description: 'Text color (hex or theme reference)' },
  { name: 'font', type: 'string', required: false, description: 'Font specification (deprecated, use fontKey)' },
  { name: 'fontKey', type: 'string', required: false, description: 'Font key reference' },
  { name: 'horizAlign', type: 'string', required: true, description: 'Horizontal alignment', enumValues: ['left', 'center', 'right'] },
  { name: 'vertAlign', type: 'string', required: true, description: 'Vertical alignment', enumValues: ['top', 'center', 'bottom'] },
  { name: 'wrap', type: 'boolean', required: true, description: 'Enable text wrapping' },
  { name: 'maxLines', type: 'number', required: true, description: 'Maximum number of lines' },
  { name: 'numLines', type: 'number', required: false, description: 'Read-only number of lines' },
  { name: 'ellipsizeOnBoundary', type: 'boolean', required: true, description: 'Ellipsize on word boundary' },
  { name: 'ellipsisText', type: 'string', required: true, description: 'Ellipsis text (e.g., "...")' },
  { name: 'isTextEllipsized', type: 'boolean', required: false, description: 'Read-only ellipsized flag' },
  { name: 'displayPartialLines', type: 'boolean', required: false, description: 'Display partial lines' },
  { name: 'leadingEllipsis', type: 'boolean', required: false, description: 'Show ellipsis at start' },
  { name: 'lineSpacing', type: 'number', required: false, description: 'Line spacing in pixels' },
  { name: 'truncateOnDelimiter', type: 'string', required: false, description: 'Delimiter for truncation' },
  { name: 'wordBreakChars', type: 'string', required: false, description: 'Characters that break words' },
  { name: 'monospacedDigits', type: 'boolean', required: false, description: 'Use monospaced digits' },
];

/**
 * MaskGroup-specific fields
 */
export const MaskGroupFields: FieldDefinition[] = [
  { name: 'maskUri', type: 'string', required: false, description: 'URI for mask bitmap' },
  { name: 'maskBitmapWidth', type: 'number', required: false, description: 'Mask bitmap width' },
  { name: 'maskBitmapHeight', type: 'number', required: false, description: 'Mask bitmap height' },
  { name: 'maskOffset', type: 'array', required: false, description: 'Mask offset [x, y]', tupleTypes: ['number', 'number'] },
  { name: 'maskSize', type: 'array', required: false, description: 'Mask size [width, height]', tupleTypes: ['number', 'number'] },
];

/**
 * ViewFragment Style fields (for cells)
 */
export const ViewFragmentStyleFields: FieldDefinition[] = [
  { name: 'isResolutionApplied', type: 'boolean', required: false, description: 'Whether resolution scaling has been applied' },
  { name: '$supportsDataMap', type: 'boolean', required: false, description: 'Whether fragment supports data mapping' },
  { name: 'id', type: 'string', required: false, description: 'Unique identifier for the fragment style' },
  { name: 'width', type: 'number', required: false, description: 'Fragment width' },
  { name: 'height', type: 'number', required: false, description: 'Fragment height' },
  { name: 'views', type: 'object', required: false, description: 'View definitions' },
  { name: 'dataMap', type: 'object', required: false, description: 'Data mapping configuration' },
  { name: 'callbacks', type: 'object', required: false, description: 'Callback handler names' },
];

/**
 * Get fields for a given scenegraph subType
 */
export function getFieldsForSubType(subType: string): FieldDefinition[] {
  const baseFields = [...SceneGraphNodeFields, ...SceneGraphGroupFields];
  
  switch (subType) {
    case 'Poster':
      return [...baseFields, ...PosterFields];
    case 'Rectangle':
      return [...baseFields, ...RectangleFields];
    case 'Group':
      return [...baseFields, ...GroupFields];
    case 'Label':
      return [...baseFields, ...LabelFields];
    case 'MaskGroup':
      return [...baseFields, ...MaskGroupFields];
    default:
      return baseFields;
  }
}

/**
 * Get all valid field names for a given subType
 */
export function getValidFieldNamesForSubType(subType: string): Set<string> {
  const fields = getFieldsForSubType(subType);
  return new Set(fields.map(f => f.name));
}

/**
 * Get field definition by name and subType
 */
export function getFieldDefinition(subType: string, fieldName: string): FieldDefinition | undefined {
  const fields = getFieldsForSubType(subType);
  return fields.find(f => f.name === fieldName);
}

/**
 * Check if a field name is valid for a given subType
 */
export function isValidFieldName(subType: string, fieldName: string): boolean {
  const validNames = getValidFieldNamesForSubType(subType);
  return validNames.has(fieldName);
}
