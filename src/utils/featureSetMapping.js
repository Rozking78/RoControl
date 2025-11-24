/**
 * Feature Set Number Mappings
 * Maps feature set numbers to their names and vice versa
 */

export const FEATURE_SET_MAP = {
  1: 'intensity',
  2: 'position',
  3: 'color',
  4: 'focus',
  5: 'gobo',
  6: 'beam',
  7: 'videosource',
  8: 'videooutput'
}

export const FEATURE_SET_REVERSE_MAP = {
  'intensity': 1,
  'position': 2,
  'color': 3,
  'focus': 4,
  'gobo': 5,
  'beam': 6,
  'videosource': 7,
  'videooutput': 8
}

/**
 * Get feature set name from number
 * @param {number} num - Feature set number (1-8)
 * @returns {string|null} Feature set name or null if not found
 */
export function getFeatureSetName(num) {
  return FEATURE_SET_MAP[num] || null
}

/**
 * Get feature set number from name
 * @param {string} name - Feature set name
 * @returns {number|null} Feature set number or null if not found
 */
export function getFeatureSetNumber(name) {
  return FEATURE_SET_REVERSE_MAP[name.toLowerCase()] || null
}

/**
 * Parse dot notation preset (e.g., "1.5" -> {featureSet: 1, preset: 5})
 * @param {string} notation - Dot notation string (e.g., "1.5")
 * @returns {Object|null} Parsed object with featureSet and preset numbers
 */
export function parseDotNotation(notation) {
  const match = notation.match(/^(\d+)\.(\d+)$/)
  if (!match) return null

  const featureSetNum = parseInt(match[1])
  const presetNum = parseInt(match[2])

  if (featureSetNum < 1 || featureSetNum > 8) return null
  if (presetNum < 1 || presetNum > 12) return null

  return {
    featureSet: featureSetNum,
    featureSetName: getFeatureSetName(featureSetNum),
    preset: presetNum
  }
}

/**
 * Create dot notation from feature set and preset numbers
 * @param {number|string} featureSet - Feature set number or name
 * @param {number} preset - Preset number (1-12)
 * @returns {string|null} Dot notation string or null if invalid
 */
export function createDotNotation(featureSet, preset) {
  const featureSetNum = typeof featureSet === 'string'
    ? getFeatureSetNumber(featureSet)
    : featureSet

  if (!featureSetNum || featureSetNum < 1 || featureSetNum > 8) return null
  if (preset < 1 || preset > 12) return null

  return `${featureSetNum}.${preset}`
}

export default {
  FEATURE_SET_MAP,
  FEATURE_SET_REVERSE_MAP,
  getFeatureSetName,
  getFeatureSetNumber,
  parseDotNotation,
  createDotNotation
}
