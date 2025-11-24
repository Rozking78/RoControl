/**
 * Window ID Mapping - MA3/Hog-style window numbering
 * Maps numeric IDs to window types for CLI routing
 */

export const WINDOW_IDS = {
  // Main Canvas & Grid
  4: 'pixelGrid',          // Main Canvas Grid Window (ID 4 - per spec)

  // Programmer & Control
  9: 'programmerEnhanced',  // Programmer Window (ID 9 - per spec, fixed to bottom)

  // Attribute Windows
  10: 'colorWindow',        // Color Attribute Window (ID 10 - per spec)
  11: 'intensityWindow',    // Intensity Attribute Window
  12: 'positionWindow',     // Position Attribute Window
  13: 'focusWindow',        // Focus Attribute Window
  14: 'goboWindow',         // Gobo Attribute Window

  // Media & Content
  5: 'protocolSettings',    // Media Server (ID 5 - per spec, repurposed as Protocol Settings)

  // Show Control
  20: 'cues',               // Cues Window
  21: 'executors',          // Executors Window
  22: 'palettes',           // Palettes Window

  // Fixture Management
  30: 'fixtures',           // Fixtures View
  31: 'groupsWindow',       // Groups Window
  32: 'channelGrid',        // Channel Grid View
  33: 'videoFixturePatch',  // Video Fixture Patch

  // Presets & Features
  40: 'flexWindow',         // FlexWindow (F30) - Contextual Presets
  41: 'attributeButtons',   // Attribute Call Buttons
  42: 'viewButtons',        // View Recall Buttons

  // Utility
  50: 'quickActions',       // Quick Actions
  51: 'protocolSettings',   // Protocol Settings (duplicate reference)
  52: 'videoOutputGrid',    // Video Output Grid

  // Legacy/Alternative
  1: 'programmer',          // Legacy Programmer (simple version)
}

// Reverse mapping: viewType -> window ID
export const VIEW_TO_ID = {}
Object.entries(WINDOW_IDS).forEach(([id, viewType]) => {
  if (!VIEW_TO_ID[viewType]) {
    VIEW_TO_ID[viewType] = parseInt(id)
  }
})

// Window labels for display
export const WINDOW_LABELS = {
  pixelGrid: 'Main Canvas Grid',
  programmerEnhanced: 'Programmer',
  programmer: 'Programmer (Simple)',
  colorWindow: 'Color',
  intensityWindow: 'Intensity',
  positionWindow: 'Position',
  focusWindow: 'Focus',
  goboWindow: 'Gobo',
  protocolSettings: 'Protocol Settings',
  cues: 'Cues',
  executors: 'Executors',
  palettes: 'Palettes',
  fixtures: 'Fixtures',
  groupsWindow: 'Groups',
  channelGrid: 'Channel Grid',
  videoFixturePatch: 'Video Patch',
  flexWindow: 'FlexWindow',
  attributeButtons: 'Attributes',
  viewButtons: 'View Recall',
  quickActions: 'Quick Actions',
  videoOutputGrid: 'Video Outputs',
}

/**
 * Get view type from window ID
 * @param {number} id - Window ID
 * @returns {string|null} View type or null if not found
 */
export function getViewFromId(id) {
  return WINDOW_IDS[id] || null
}

/**
 * Get window ID from view type
 * @param {string} viewType - View type
 * @returns {number|null} Window ID or null if not found
 */
export function getIdFromView(viewType) {
  return VIEW_TO_ID[viewType] || null
}

/**
 * Get window label from ID
 * @param {number} id - Window ID
 * @returns {string} Window label
 */
export function getLabelFromId(id) {
  const viewType = getViewFromId(id)
  return viewType ? WINDOW_LABELS[viewType] || viewType : 'Unknown'
}

/**
 * Check if window ID exists
 * @param {number} id - Window ID
 * @returns {boolean} True if ID is valid
 */
export function isValidWindowId(id) {
  return WINDOW_IDS.hasOwnProperty(id)
}

/**
 * Get all attribute window IDs
 * @returns {Array<number>} Array of attribute window IDs
 */
export function getAttributeWindowIds() {
  return [10, 11, 12, 13, 14]
}

/**
 * Get all window IDs grouped by category
 * @returns {Object} Window IDs grouped by category
 */
export function getWindowsByCategory() {
  return {
    canvas: [4],
    programmer: [9, 1],
    attributes: [10, 11, 12, 13, 14],
    showControl: [20, 21, 22],
    fixtures: [30, 31, 32],
    presets: [40, 41, 42],
    utility: [50, 51]
  }
}

export default {
  WINDOW_IDS,
  VIEW_TO_ID,
  WINDOW_LABELS,
  getViewFromId,
  getIdFromView,
  getLabelFromId,
  isValidWindowId,
  getAttributeWindowIds,
  getWindowsByCategory
}
