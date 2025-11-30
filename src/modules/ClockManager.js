/**
 * ClockManager Module - Time-based references for automation and sync
 *
 * Clock Types:
 * - Time of Day (clock.1 or clock.TOD)
 * - Timecode (clock.2 or clock.TC)
 * - Video Time (clock.video.N)
 * - Video Time Remaining (clock.video.N.TRR)
 * - Countdown Timers (clock.3+)
 * - Sunrise/Sunset (clock.sunrise, clock.sunset)
 */

import { eventBus, Events } from './EventBus.js';

class Clock {
  constructor(id, type, options = {}) {
    this.id = id;
    this.type = type; // 'tod', 'timecode', 'video', 'countdown', 'sunrise', 'sunset'
    this.name = options.name || `Clock ${id}`;

    // Time value
    this.value = null;         // Current value (format depends on type)
    this.milliseconds = 0;     // Current value in milliseconds

    // Configuration
    this.offset = options.offset || 0;
    this.format = options.format || 'HH:MM:SS';
    this.running = false;
    this.startTime = null;

    // Type-specific
    this.duration = options.duration || 0;        // For countdown
    this.videoId = options.videoId || null;       // For video clocks
    this.location = options.location || null;     // For sunrise/sunset {lat, lon}
    this.frameRate = options.frameRate || 30;     // For timecode
  }

  /**
   * Start the clock
   */
  start() {
    this.running = true;
    this.startTime = Date.now();
  }

  /**
   * Stop the clock
   */
  stop() {
    this.running = false;
  }

  /**
   * Reset the clock
   */
  reset() {
    if (this.type === 'countdown') {
      this.milliseconds = this.duration;
    } else {
      this.milliseconds = 0;
    }
    this.startTime = null;
    this.updateValue();
  }

  /**
   * Update clock value based on type
   */
  update() {
    switch (this.type) {
      case 'tod':
        this.updateTimeOfDay();
        break;
      case 'countdown':
        this.updateCountdown();
        break;
      case 'timecode':
        // Updated externally via setTimecode()
        break;
      case 'video':
        // Updated externally via setVideoTime()
        break;
      case 'sunrise':
      case 'sunset':
        this.updateSolarTime();
        break;
    }
  }

  /**
   * Update time of day
   */
  updateTimeOfDay() {
    const now = new Date();
    this.milliseconds = now.getTime() % (24 * 60 * 60 * 1000);
    this.value = this.formatTime(now.getHours(), now.getMinutes(), now.getSeconds(), 0);
  }

  /**
   * Update countdown timer
   */
  updateCountdown() {
    if (!this.running) return;

    const elapsed = Date.now() - this.startTime;
    this.milliseconds = Math.max(0, this.duration - elapsed);

    const totalSeconds = Math.floor(this.milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const ms = Math.floor((this.milliseconds % 1000) / 10);

    this.value = this.formatTime(hours, minutes, seconds, ms);

    // Fire TRR zero event
    if (this.milliseconds === 0) {
      this.running = false;
      eventBus.emit(Events.CLOCK_TRR_ZERO, {
        clockId: this.id,
        type: 'countdown'
      });
    }
  }

  /**
   * Update solar time (sunrise/sunset)
   */
  updateSolarTime() {
    if (!this.location) return;

    // Simplified solar calculation
    // In production, use a proper library like SunCalc
    const now = new Date();
    const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);

    const sunriseHour = 6 + Math.sin(dayOfYear / 365 * 2 * Math.PI) * 2;
    const sunsetHour = 18 + Math.sin(dayOfYear / 365 * 2 * Math.PI) * 2;

    let hours, minutes;
    if (this.type === 'sunrise') {
      hours = Math.floor(sunriseHour);
      minutes = Math.floor((sunriseHour % 1) * 60);
    } else {
      hours = Math.floor(sunsetHour);
      minutes = Math.floor((sunsetHour % 1) * 60);
    }

    this.value = this.formatTime(hours, minutes, 0, 0);
    this.milliseconds = (hours * 3600 + minutes * 60) * 1000;
  }

  /**
   * Set timecode value
   * @param {string} timecode - Format: HH:MM:SS:FF
   */
  setTimecode(timecode) {
    const parts = timecode.split(':');
    if (parts.length >= 4) {
      const hours = parseInt(parts[0]) || 0;
      const minutes = parseInt(parts[1]) || 0;
      const seconds = parseInt(parts[2]) || 0;
      const frames = parseInt(parts[3]) || 0;

      this.milliseconds = (hours * 3600 + minutes * 60 + seconds) * 1000 +
                          (frames / this.frameRate) * 1000;
      this.value = timecode;

      eventBus.emit(Events.TIMECODE_RECEIVED, {
        clockId: this.id,
        timecode,
        milliseconds: this.milliseconds
      });
    }
  }

  /**
   * Set video time
   * @param {number} currentTime - Current position in seconds
   * @param {number} duration - Total duration in seconds
   * @param {boolean} isTRR - Is this a time remaining clock
   */
  setVideoTime(currentTime, duration, isTRR = false) {
    if (isTRR) {
      const remaining = Math.max(0, duration - currentTime);
      this.milliseconds = remaining * 1000;

      // Check for TRR zero
      if (remaining <= 0.1) {
        eventBus.emit(Events.CLOCK_TRR_ZERO, {
          clockId: this.id,
          videoId: this.videoId,
          type: 'video'
        });
      }
    } else {
      this.milliseconds = currentTime * 1000;
    }

    const totalSeconds = Math.floor(this.milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const ms = Math.floor((this.milliseconds % 1000) / 10);

    this.value = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  }

  /**
   * Format time string
   */
  formatTime(hours, minutes, seconds, ms = 0) {
    const h = hours.toString().padStart(2, '0');
    const m = minutes.toString().padStart(2, '0');
    const s = seconds.toString().padStart(2, '0');

    if (this.format === 'HH:MM:SS:FF') {
      const f = ms.toString().padStart(2, '0');
      return `${h}:${m}:${s}:${f}`;
    } else if (this.format === 'MM:SS.mm') {
      const totalMinutes = hours * 60 + minutes;
      return `${totalMinutes.toString().padStart(2, '0')}:${s}.${ms.toString().padStart(2, '0')}`;
    }

    return `${h}:${m}:${s}`;
  }

  /**
   * Get formatted value
   */
  getFormattedValue() {
    return this.value || '---';
  }

  /**
   * Compare value for conditions
   * @param {string} operator - =, >, <, >=, <=, !=
   * @param {string|number} expected - Expected value
   */
  compare(operator, expected) {
    const expectedMs = typeof expected === 'number' ? expected * 1000 : this.parseTimeToMs(expected);

    switch (operator) {
      case '=':
      case '==':
        return Math.abs(this.milliseconds - expectedMs) < 100; // 100ms tolerance
      case '>':
        return this.milliseconds > expectedMs;
      case '<':
        return this.milliseconds < expectedMs;
      case '>=':
        return this.milliseconds >= expectedMs;
      case '<=':
        return this.milliseconds <= expectedMs;
      case '!=':
      case '<>':
        return Math.abs(this.milliseconds - expectedMs) >= 100;
      default:
        return false;
    }
  }

  /**
   * Parse time string to milliseconds
   */
  parseTimeToMs(timeStr) {
    const parts = timeStr.split(':');
    if (parts.length === 3) {
      const [h, m, s] = parts.map(p => parseFloat(p) || 0);
      return (h * 3600 + m * 60 + s) * 1000;
    } else if (parts.length === 2) {
      const [m, s] = parts.map(p => parseFloat(p) || 0);
      return (m * 60 + s) * 1000;
    }
    return parseFloat(timeStr) * 1000 || 0;
  }

  /**
   * Export to JSON
   */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      name: this.name,
      value: this.value,
      milliseconds: this.milliseconds,
      running: this.running,
      duration: this.duration,
      videoId: this.videoId,
      format: this.format
    };
  }
}

/**
 * ClockManager - Manages multiple clocks
 */
class ClockManager {
  constructor() {
    this.clocks = new Map();
    this._updateInterval = null;
    this._tickRate = 100; // Update every 100ms
  }

  /**
   * Initialize with default clocks
   */
  initialize() {
    // Clock 1 - Time of Day
    this.create({
      id: 1,
      type: 'tod',
      name: 'Time of Day',
      format: 'HH:MM:SS'
    });

    // Clock 2 - Timecode
    this.create({
      id: 2,
      type: 'timecode',
      name: 'Timecode',
      format: 'HH:MM:SS:FF'
    });

    // Aliases
    this.clocks.set('TOD', this.clocks.get(1));
    this.clocks.set('TC', this.clocks.get(2));
    this.clocks.set('timecode', this.clocks.get(2));

    // Start update loop
    this.start();
  }

  /**
   * Create a new clock
   * @param {Object} options
   * @returns {Clock}
   */
  create(options) {
    const clock = new Clock(options.id, options.type, options);
    this.clocks.set(options.id, clock);
    return clock;
  }

  /**
   * Create a video clock pair (current time + TRR)
   * @param {number|string} videoId
   */
  createVideoClocks(videoId) {
    const clockId = `video.${videoId}`;
    const trrId = `video.${videoId}.TRR`;

    const clock = this.create({
      id: clockId,
      type: 'video',
      name: `Video ${videoId}`,
      videoId,
      format: 'MM:SS.mm'
    });

    const trrClock = this.create({
      id: trrId,
      type: 'video',
      name: `Video ${videoId} TRR`,
      videoId,
      format: 'MM:SS.mm'
    });

    return { clock, trrClock };
  }

  /**
   * Create a countdown timer
   * @param {number} duration - Duration in seconds
   * @param {string} name - Optional name
   */
  createCountdown(duration, name = null) {
    // Find next available ID starting at 3
    let nextId = 3;
    while (this.clocks.has(nextId)) {
      nextId++;
    }

    const clock = this.create({
      id: nextId,
      type: 'countdown',
      name: name || `Countdown ${nextId}`,
      duration: duration * 1000,
      format: 'HH:MM:SS'
    });

    clock.reset();
    return clock;
  }

  /**
   * Get a clock by ID
   * @param {number|string} id
   */
  get(id) {
    return this.clocks.get(id) || this.clocks.get(String(id)) || null;
  }

  /**
   * Get all clocks (excluding aliases)
   */
  getAll() {
    const seen = new Set();
    return Array.from(this.clocks.values()).filter(clock => {
      if (seen.has(clock.id)) return false;
      seen.add(clock.id);
      return true;
    });
  }

  /**
   * Update video clock times
   * @param {number|string} videoId
   * @param {number} currentTime
   * @param {number} duration
   */
  updateVideoTime(videoId, currentTime, duration) {
    const clock = this.get(`video.${videoId}`);
    const trrClock = this.get(`video.${videoId}.TRR`);

    if (clock) {
      clock.setVideoTime(currentTime, duration, false);
    }
    if (trrClock) {
      trrClock.setVideoTime(currentTime, duration, true);
    }
  }

  /**
   * Set external timecode
   * @param {string} timecode
   */
  setTimecode(timecode) {
    const clock = this.get(2);
    if (clock) {
      clock.setTimecode(timecode);
    }
  }

  /**
   * Start a countdown timer
   * @param {number|string} id
   */
  startCountdown(id) {
    const clock = this.get(id);
    if (clock && clock.type === 'countdown') {
      clock.start();
      return true;
    }
    return false;
  }

  /**
   * Stop a countdown timer
   * @param {number|string} id
   */
  stopCountdown(id) {
    const clock = this.get(id);
    if (clock && clock.type === 'countdown') {
      clock.stop();
      return true;
    }
    return false;
  }

  /**
   * Reset a countdown timer
   * @param {number|string} id
   */
  resetCountdown(id) {
    const clock = this.get(id);
    if (clock && clock.type === 'countdown') {
      clock.reset();
      return true;
    }
    return false;
  }

  /**
   * Evaluate a clock condition
   * @param {string} clockId
   * @param {string} operator
   * @param {string|number} value
   */
  evaluateCondition(clockId, operator, value) {
    const clock = this.get(clockId);
    if (!clock) return false;
    return clock.compare(operator, value);
  }

  /**
   * Start update loop
   */
  start() {
    if (this._updateInterval) return;

    this._updateInterval = setInterval(() => {
      this.clocks.forEach(clock => {
        clock.update();
      });

      eventBus.emit(Events.CLOCK_TICK, {
        timestamp: Date.now(),
        clocks: this.getAllStates()
      });
    }, this._tickRate);
  }

  /**
   * Stop update loop
   */
  stop() {
    if (this._updateInterval) {
      clearInterval(this._updateInterval);
      this._updateInterval = null;
    }
  }

  /**
   * Get all clock states
   */
  getAllStates() {
    return this.getAll().map(clock => clock.toJSON());
  }

  /**
   * Remove a clock
   * @param {number|string} id
   */
  remove(id) {
    return this.clocks.delete(id);
  }

  /**
   * Cleanup
   */
  destroy() {
    this.stop();
    this.clocks.clear();
  }
}

// Export singleton
const clockManager = new ClockManager();

export { Clock, ClockManager, clockManager };
