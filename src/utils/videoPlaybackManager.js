/**
 * Video Playback Manager
 * Manages video playback state, routing, and control
 */

export class VideoPlaybackManager {
  constructor() {
    this.playbackStates = new Map() // videoInput -> playback state
    this.routingMap = new Map()     // videoInput -> videoOutput
    this.loadState()
  }

  /**
   * Play video to output
   * @param {string} videoInput - e.g., "video1", "video_1"
   * @param {string} videoOutput - e.g., "output1", "output_1"
   * @returns {Object} Result object
   */
  play(videoInput, videoOutput) {
    const normalizedInput = this.normalizeId(videoInput)
    const normalizedOutput = this.normalizeId(videoOutput)

    // Set routing
    this.routingMap.set(normalizedInput, normalizedOutput)

    // Update playback state
    const state = this.getOrCreateState(normalizedInput)
    state.playing = true
    state.paused = false
    state.output = normalizedOutput
    state.lastPlayTime = Date.now()

    this.saveState()

    return {
      success: true,
      message: `Playing ${videoInput} to ${videoOutput}`
    }
  }

  /**
   * Pause video playback
   * @param {string} videoInput - Video input ID
   * @returns {Object} Result object
   */
  pause(videoInput) {
    const normalizedInput = this.normalizeId(videoInput)
    const state = this.playbackStates.get(normalizedInput)

    if (!state || !state.playing) {
      return {
        success: false,
        message: `${videoInput} is not currently playing`
      }
    }

    state.paused = true
    this.saveState()

    return {
      success: true,
      message: `Paused ${videoInput}`
    }
  }

  /**
   * Stop video playback
   * @param {string} videoInput - Video input ID
   * @returns {Object} Result object
   */
  stop(videoInput) {
    const normalizedInput = this.normalizeId(videoInput)
    const state = this.playbackStates.get(normalizedInput)

    if (!state || !state.playing) {
      return {
        success: false,
        message: `${videoInput} is not currently playing`
      }
    }

    state.playing = false
    state.paused = false
    state.position = 0
    this.routingMap.delete(normalizedInput)
    this.saveState()

    return {
      success: true,
      message: `Stopped ${videoInput}`
    }
  }

  /**
   * Restart video from beginning
   * @param {string} videoInput - Video input ID
   * @returns {Object} Result object
   */
  restart(videoInput) {
    const normalizedInput = this.normalizeId(videoInput)
    const state = this.playbackStates.get(normalizedInput)

    if (!state || !state.playing) {
      return {
        success: false,
        message: `${videoInput} is not currently playing`
      }
    }

    state.position = 0
    state.paused = false
    state.lastPlayTime = Date.now()
    this.saveState()

    return {
      success: true,
      message: `Restarted ${videoInput}`
    }
  }

  /**
   * Set loop mode for video
   * @param {string} videoInput - Video input ID
   * @param {boolean} enabled - Enable/disable looping
   * @returns {Object} Result object
   */
  setLoop(videoInput, enabled) {
    const normalizedInput = this.normalizeId(videoInput)
    const state = this.getOrCreateState(normalizedInput)

    state.loop = enabled
    this.saveState()

    return {
      success: true,
      message: `Loop ${enabled ? 'enabled' : 'disabled'} for ${videoInput}`
    }
  }

  /**
   * Set playback speed
   * @param {string} videoInput - Video input ID
   * @param {number} speed - Playback speed (0.1 - 10.0)
   * @returns {Object} Result object
   */
  setSpeed(videoInput, speed) {
    const normalizedInput = this.normalizeId(videoInput)
    const state = this.getOrCreateState(normalizedInput)

    const clampedSpeed = Math.max(0.1, Math.min(10, speed))
    state.speed = clampedSpeed
    this.saveState()

    return {
      success: true,
      message: `Set ${videoInput} speed to ${clampedSpeed}x`
    }
  }

  /**
   * Route video to different output
   * @param {string} videoInput - Video input ID
   * @param {string} videoOutput - Video output ID
   * @returns {Object} Result object
   */
  route(videoInput, videoOutput) {
    const normalizedInput = this.normalizeId(videoInput)
    const normalizedOutput = this.normalizeId(videoOutput)
    const state = this.playbackStates.get(normalizedInput)

    if (!state || !state.playing) {
      return {
        success: false,
        message: `${videoInput} is not currently playing`
      }
    }

    this.routingMap.set(normalizedInput, normalizedOutput)
    state.output = normalizedOutput
    this.saveState()

    return {
      success: true,
      message: `Routed ${videoInput} to ${videoOutput}`
    }
  }

  /**
   * Get playback state for a video
   * @param {string} videoInput - Video input ID
   * @returns {Object|null} Playback state or null
   */
  getState(videoInput) {
    const normalizedInput = this.normalizeId(videoInput)
    return this.playbackStates.get(normalizedInput) || null
  }

  /**
   * Get output routing for a video
   * @param {string} videoInput - Video input ID
   * @returns {string|null} Output ID or null
   */
  getRouting(videoInput) {
    const normalizedInput = this.normalizeId(videoInput)
    return this.routingMap.get(normalizedInput) || null
  }

  /**
   * Get all active playback states
   * @returns {Array} Array of active playback states
   */
  getActiveStates() {
    const active = []
    for (const [videoInput, state] of this.playbackStates.entries()) {
      if (state.playing) {
        active.push({
          videoInput,
          ...state
        })
      }
    }
    return active
  }

  /**
   * Get or create playback state for a video
   * @private
   */
  getOrCreateState(videoInput) {
    if (!this.playbackStates.has(videoInput)) {
      this.playbackStates.set(videoInput, {
        playing: false,
        paused: false,
        position: 0,
        loop: false,
        speed: 1.0,
        output: null,
        lastPlayTime: null
      })
    }
    return this.playbackStates.get(videoInput)
  }

  /**
   * Normalize video/output ID (e.g., "video1" or "video_1" -> "video_1")
   * @private
   */
  normalizeId(id) {
    if (!id) return id
    // Convert "video1" to "video_1", "output2" to "output_2"
    return id.replace(/^(video|output)(\d+)$/, '$1_$2')
  }

  /**
   * Save state to localStorage
   * @private
   */
  saveState() {
    try {
      const states = {}
      for (const [key, value] of this.playbackStates.entries()) {
        states[key] = value
      }

      const routing = {}
      for (const [key, value] of this.routingMap.entries()) {
        routing[key] = value
      }

      localStorage.setItem('dmx_video_playback_states', JSON.stringify(states))
      localStorage.setItem('dmx_video_routing', JSON.stringify(routing))
    } catch (error) {
      console.error('Failed to save video playback state:', error)
    }
  }

  /**
   * Load state from localStorage
   * @private
   */
  loadState() {
    try {
      const statesJson = localStorage.getItem('dmx_video_playback_states')
      const routingJson = localStorage.getItem('dmx_video_routing')

      if (statesJson) {
        const states = JSON.parse(statesJson)
        for (const [key, value] of Object.entries(states)) {
          this.playbackStates.set(key, value)
        }
      }

      if (routingJson) {
        const routing = JSON.parse(routingJson)
        for (const [key, value] of Object.entries(routing)) {
          this.routingMap.set(key, value)
        }
      }
    } catch (error) {
      console.error('Failed to load video playback state:', error)
    }
  }

  /**
   * Clear all playback states
   */
  clearAll() {
    this.playbackStates.clear()
    this.routingMap.clear()
    this.saveState()
  }
}

export default VideoPlaybackManager
