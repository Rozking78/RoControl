/**
 * Preset Manager - Centralized preset storage and recall
 * Handles color, position, focus, intensity, and gobo presets
 */

const STORAGE_KEY = 'dmx_flex_presets'

// Default presets for each feature set
const DEFAULT_PRESETS = {
  color: [
    { name: 'Red', values: { red: 255, green: 0, blue: 0 } },
    { name: 'Green', values: { red: 0, green: 255, blue: 0 } },
    { name: 'Blue', values: { red: 0, green: 0, blue: 255 } },
    { name: 'White', values: { red: 255, green: 255, blue: 255 } },
    { name: 'Cyan', values: { red: 0, green: 255, blue: 255 } },
    { name: 'Magenta', values: { red: 255, green: 0, blue: 255 } },
    { name: 'Yellow', values: { red: 255, green: 255, blue: 0 } },
    { name: 'Orange', values: { red: 255, green: 128, blue: 0 } },
    null, null, null, null
  ],
  intensity: [
    { name: 'Full', values: { dimmer: 255 } },
    { name: '75%', values: { dimmer: 191 } },
    { name: '50%', values: { dimmer: 128 } },
    { name: '25%', values: { dimmer: 64 } },
    { name: '10%', values: { dimmer: 26 } },
    { name: 'Blackout', values: { dimmer: 0 } },
    null, null, null, null, null, null
  ],
  position: [
    { name: 'Center', values: { pan: 128, tilt: 128 } },
    { name: 'Down Center', values: { pan: 128, tilt: 0 } },
    { name: 'Up Center', values: { pan: 128, tilt: 255 } },
    { name: 'Left Center', values: { pan: 0, tilt: 128 } },
    { name: 'Right Center', values: { pan: 255, tilt: 128 } },
    null, null, null, null, null, null, null
  ],
  focus: [
    { name: 'Tight', values: { focus: 200, zoom: 50 } },
    { name: 'Medium', values: { focus: 128, zoom: 128 } },
    { name: 'Wide', values: { focus: 50, zoom: 200 } },
    null, null, null, null, null, null, null, null, null
  ],
  gobo: [
    { name: 'Open', values: { gobo: 0 } },
    { name: 'Gobo 1', values: { gobo: 32 } },
    { name: 'Gobo 2', values: { gobo: 64 } },
    { name: 'Gobo 3', values: { gobo: 96 } },
    { name: 'Gobo 4', values: { gobo: 128 } },
    null, null, null, null, null, null, null
  ],
  groups: []
}

export class PresetManager {
  constructor() {
    this.presets = this.load()
    this.listeners = []
  }

  /**
   * Load presets from localStorage
   * @returns {Object} Presets object
   */
  load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : { ...DEFAULT_PRESETS }
    } catch (error) {
      console.error('Error loading presets:', error)
      return { ...DEFAULT_PRESETS }
    }
  }

  /**
   * Save presets to localStorage
   */
  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.presets))
      this.notifyListeners()
    } catch (error) {
      console.error('Error saving presets:', error)
    }
  }

  /**
   * Get all presets for a feature set
   * @param {string} featureSet - Feature set name (color, position, etc.)
   * @returns {Array} Array of presets
   */
  getPresets(featureSet) {
    return this.presets[featureSet] || []
  }

  /**
   * Get a single preset
   * @param {string} featureSet - Feature set name
   * @param {number} index - Preset index (0-11)
   * @returns {Object|null} Preset object or null
   */
  getPreset(featureSet, index) {
    const presets = this.presets[featureSet]
    if (!presets || index < 0 || index >= presets.length) {
      return null
    }
    return presets[index]
  }

  /**
   * Store a preset
   * @param {string} featureSet - Feature set name
   * @param {number} index - Preset index (0-11)
   * @param {Object} preset - Preset object with name and values
   */
  storePreset(featureSet, index, preset) {
    if (!this.presets[featureSet]) {
      this.presets[featureSet] = Array(12).fill(null)
    }

    this.presets[featureSet][index] = preset
    this.save()
  }

  /**
   * Clear a preset
   * @param {string} featureSet - Feature set name
   * @param {number} index - Preset index (0-11)
   */
  clearPreset(featureSet, index) {
    if (this.presets[featureSet]) {
      this.presets[featureSet][index] = null
      this.save()
    }
  }

  /**
   * Reset all presets to defaults
   */
  resetToDefaults() {
    this.presets = { ...DEFAULT_PRESETS }
    this.save()
  }

  /**
   * Subscribe to preset changes
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback)
    }
  }

  /**
   * Notify all listeners of changes
   */
  notifyListeners() {
    this.listeners.forEach(callback => callback(this.presets))
  }
}

// Export singleton instance
export const presetManager = new PresetManager()

export default PresetManager
