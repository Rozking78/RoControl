/**
 * VideoPlayer Module - Video playback control and state management
 *
 * Handles video loading, playback, seeking, and state for multiple video sources
 */

import { eventBus, Events } from './EventBus.js';

class VideoPlayer {
  constructor(id, options = {}) {
    this.id = id;
    this.name = options.name || `Video ${id}`;
    this.source = options.source || null;
    this.sourceType = options.sourceType || 'file'; // 'file' | 'ndi'

    // Playback state
    this.state = {
      playing: false,
      paused: false,
      position: 0,        // Current position in seconds
      duration: 0,        // Total duration in seconds
      loop: options.loop || false,
      speed: options.speed || 1.0,
      volume: options.volume || 1.0,
      muted: options.muted || false
    };

    // Output routing
    this.output = options.output || null;
    this.layer = options.layer || 0;
    this.opacity = options.opacity || 100;

    // Internal
    this._progressInterval = null;
    this._startTime = null;
  }

  /**
   * Load a video source
   * @param {string} source - Video file path or NDI source name
   * @param {string} sourceType - 'file' or 'ndi'
   */
  load(source, sourceType = 'file') {
    this.source = source;
    this.sourceType = sourceType;
    this.state.position = 0;
    this.state.playing = false;
    this.state.paused = false;

    eventBus.emit(Events.STATE_CHANGED, {
      module: 'VideoPlayer',
      id: this.id,
      action: 'load',
      source,
      sourceType
    });

    return this;
  }

  /**
   * Start playback
   * @param {string} output - Optional output to route to
   */
  play(output = null) {
    if (!this.source) {
      eventBus.emit(Events.VIDEO_ERROR, {
        id: this.id,
        error: 'No source loaded'
      });
      return false;
    }

    if (output) {
      this.output = output;
    }

    this.state.playing = true;
    this.state.paused = false;
    this._startTime = Date.now() - (this.state.position * 1000);

    // Start progress updates
    this._startProgressUpdates();

    eventBus.emit(Events.VIDEO_PLAY, {
      id: this.id,
      source: this.source,
      output: this.output,
      position: this.state.position
    });

    return true;
  }

  /**
   * Pause playback
   */
  pause() {
    if (!this.state.playing) return false;

    this.state.playing = false;
    this.state.paused = true;
    this._stopProgressUpdates();

    eventBus.emit(Events.VIDEO_PAUSE, {
      id: this.id,
      position: this.state.position
    });

    return true;
  }

  /**
   * Stop playback and reset position
   */
  stop() {
    this.state.playing = false;
    this.state.paused = false;
    this.state.position = 0;
    this._stopProgressUpdates();

    eventBus.emit(Events.VIDEO_STOP, {
      id: this.id
    });

    return true;
  }

  /**
   * Restart from beginning
   */
  restart() {
    this.state.position = 0;
    this._startTime = Date.now();

    if (!this.state.playing) {
      this.play();
    }

    eventBus.emit(Events.VIDEO_SEEK, {
      id: this.id,
      position: 0
    });

    return true;
  }

  /**
   * Seek to position
   * @param {number} position - Position in seconds
   */
  seek(position) {
    this.state.position = Math.max(0, Math.min(position, this.state.duration));
    this._startTime = Date.now() - (this.state.position * 1000);

    eventBus.emit(Events.VIDEO_SEEK, {
      id: this.id,
      position: this.state.position
    });

    return true;
  }

  /**
   * Set loop mode
   * @param {boolean} enabled
   */
  setLoop(enabled) {
    this.state.loop = enabled;

    eventBus.emit(Events.VIDEO_LOOP, {
      id: this.id,
      loop: enabled
    });

    return true;
  }

  /**
   * Set playback speed
   * @param {number} speed - Speed multiplier (0.1 to 10.0)
   */
  setSpeed(speed) {
    this.state.speed = Math.max(0.1, Math.min(10.0, speed));

    eventBus.emit(Events.VIDEO_SPEED, {
      id: this.id,
      speed: this.state.speed
    });

    return true;
  }

  /**
   * Set volume
   * @param {number} volume - Volume level (0.0 to 1.0)
   */
  setVolume(volume) {
    this.state.volume = Math.max(0, Math.min(1, volume));
    return true;
  }

  /**
   * Toggle mute
   */
  toggleMute() {
    this.state.muted = !this.state.muted;
    return this.state.muted;
  }

  /**
   * Route to output
   * @param {string} output - Output ID
   */
  routeTo(output) {
    this.output = output;

    eventBus.emit(Events.STATE_CHANGED, {
      module: 'VideoPlayer',
      id: this.id,
      action: 'route',
      output
    });

    return true;
  }

  /**
   * Set layer
   * @param {number} layer - Layer number
   */
  setLayer(layer) {
    this.layer = layer;
    return true;
  }

  /**
   * Set opacity
   * @param {number} opacity - Opacity percentage (0-100)
   */
  setOpacity(opacity) {
    this.opacity = Math.max(0, Math.min(100, opacity));
    return true;
  }

  /**
   * Get time remaining (TRR)
   * @returns {number} Time remaining in seconds
   */
  getTimeRemaining() {
    return Math.max(0, this.state.duration - this.state.position);
  }

  /**
   * Get formatted time string
   * @param {number} seconds
   * @returns {string} Formatted time (MM:SS.mm)
   */
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  }

  /**
   * Get current state
   * @returns {Object} Player state
   */
  getState() {
    return {
      id: this.id,
      name: this.name,
      source: this.source,
      sourceType: this.sourceType,
      output: this.output,
      layer: this.layer,
      opacity: this.opacity,
      ...this.state,
      timeRemaining: this.getTimeRemaining(),
      formattedPosition: this.formatTime(this.state.position),
      formattedDuration: this.formatTime(this.state.duration),
      formattedTRR: this.formatTime(this.getTimeRemaining())
    };
  }

  /**
   * Export to JSON
   */
  toJSON() {
    return this.getState();
  }

  // Internal methods

  _startProgressUpdates() {
    this._stopProgressUpdates();

    this._progressInterval = setInterval(() => {
      if (this.state.playing && !this.state.paused) {
        const elapsed = (Date.now() - this._startTime) / 1000 * this.state.speed;
        this.state.position = elapsed;

        // Check for end of video
        if (this.state.duration > 0 && this.state.position >= this.state.duration) {
          if (this.state.loop) {
            this.restart();
          } else {
            this.stop();
            eventBus.emit(Events.VIDEO_ENDED, { id: this.id });
          }
          return;
        }

        // Check for TRR zero
        if (this.getTimeRemaining() <= 0.1 && this.state.duration > 0) {
          eventBus.emit(Events.CLOCK_TRR_ZERO, {
            videoId: this.id,
            clockId: `video.${this.id}.TRR`
          });
        }

        eventBus.emit(Events.VIDEO_PROGRESS, {
          id: this.id,
          position: this.state.position,
          duration: this.state.duration,
          timeRemaining: this.getTimeRemaining()
        });
      }
    }, 100); // Update every 100ms
  }

  _stopProgressUpdates() {
    if (this._progressInterval) {
      clearInterval(this._progressInterval);
      this._progressInterval = null;
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    this._stopProgressUpdates();
    this.stop();
  }
}

/**
 * VideoPlayerManager - Manages multiple video players
 */
class VideoPlayerManager {
  constructor() {
    this.players = new Map();
    this.nextId = 1;
  }

  /**
   * Create a new video player
   * @param {Object} options - Player options
   * @returns {VideoPlayer}
   */
  create(options = {}) {
    const id = options.id || this.nextId++;
    const player = new VideoPlayer(id, options);
    this.players.set(id, player);
    return player;
  }

  /**
   * Get a player by ID
   * @param {number|string} id
   * @returns {VideoPlayer|null}
   */
  get(id) {
    return this.players.get(id) || this.players.get(parseInt(id)) || null;
  }

  /**
   * Get all players
   * @returns {VideoPlayer[]}
   */
  getAll() {
    return Array.from(this.players.values());
  }

  /**
   * Remove a player
   * @param {number|string} id
   */
  remove(id) {
    const player = this.get(id);
    if (player) {
      player.destroy();
      this.players.delete(id);
      return true;
    }
    return false;
  }

  /**
   * Get all states
   * @returns {Object[]}
   */
  getAllStates() {
    return this.getAll().map(p => p.getState());
  }

  /**
   * Stop all players
   */
  stopAll() {
    this.players.forEach(player => player.stop());
  }

  /**
   * Cleanup all players
   */
  destroy() {
    this.players.forEach(player => player.destroy());
    this.players.clear();
  }
}

// Export singleton manager
const videoPlayerManager = new VideoPlayerManager();

export { VideoPlayer, VideoPlayerManager, videoPlayerManager };
