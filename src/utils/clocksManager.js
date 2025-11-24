/**
 * Clocks Manager - Time-based references for automation and sync
 *
 * Clock Types:
 * - Time of Day (clock.1 or clock.TOD)
 * - Timecode (clock.2 or clock.timecode)
 * - Sunrise/Sunset (clock.sunrise, clock.sunset)
 * - Video Time (clock.video.N)
 * - Video Time Remaining (clock.video.N.TRR)
 * - Countdown Timers (clock.3+)
 */

export class Clock {
  constructor(id, type, config = {}) {
    this.id = id;
    this.type = type; // 'tod', 'timecode', 'video', 'countdown', 'sunrise', 'sunset'
    this.name = config.name || `Clock ${id}`;
    this.value = null;
    this.offset = config.offset || 0; // milliseconds
    this.format = config.format || 'HH:MM:SS';
    this.running = false;
    this.startTime = null;
    this.duration = config.duration || 0; // for countdown timers
    this.videoFixtureId = config.videoFixtureId || null; // for video clocks
    this.location = config.location || null; // for sunrise/sunset {lat, lon}
  }

  start() {
    this.running = true;
    this.startTime = Date.now();
  }

  stop() {
    this.running = false;
  }

  reset() {
    this.value = this.type === 'countdown' ? this.duration : 0;
    this.startTime = null;
  }

  update() {
    switch (this.type) {
      case 'tod':
        this.updateTimeOfDay();
        break;
      case 'countdown':
        this.updateCountdown();
        break;
      case 'video':
        // Updated externally by video playback manager
        break;
      case 'sunrise':
      case 'sunset':
        this.updateSolarTime();
        break;
      default:
        break;
    }
  }

  updateTimeOfDay() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    this.value = `${hours}:${minutes}:${seconds}`;
  }

  updateCountdown() {
    if (!this.running) return;

    const elapsed = Date.now() - this.startTime;
    const remaining = Math.max(0, this.duration - elapsed);

    this.value = remaining;

    if (remaining === 0) {
      this.running = false;
    }
  }

  updateSolarTime() {
    if (!this.location) return;

    // This is a simplified calculation
    // In production, use a proper solar calculation library
    const now = new Date();
    const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);

    // Approximate sunrise/sunset times
    // This should be replaced with actual solar calculations
    const sunriseHour = 6 + Math.sin(dayOfYear / 365 * 2 * Math.PI) * 2;
    const sunsetHour = 18 + Math.sin(dayOfYear / 365 * 2 * Math.PI) * 2;

    if (this.type === 'sunrise') {
      const hours = Math.floor(sunriseHour).toString().padStart(2, '0');
      const minutes = Math.floor((sunriseHour % 1) * 60).toString().padStart(2, '0');
      this.value = `${hours}:${minutes}:00`;
    } else if (this.type === 'sunset') {
      const hours = Math.floor(sunsetHour).toString().padStart(2, '0');
      const minutes = Math.floor((sunsetHour % 1) * 60).toString().padStart(2, '0');
      this.value = `${hours}:${minutes}:00`;
    }
  }

  getFormattedValue() {
    if (this.value === null) return '---';

    switch (this.type) {
      case 'tod':
      case 'sunrise':
      case 'sunset':
        return this.value;

      case 'countdown':
      case 'video':
        return this.formatMilliseconds(this.value);

      case 'timecode':
        return this.value; // Already formatted externally

      default:
        return String(this.value);
    }
  }

  formatMilliseconds(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((ms % 1000) / 10);

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      name: this.name,
      value: this.value,
      offset: this.offset,
      format: this.format,
      running: this.running,
      duration: this.duration,
      videoFixtureId: this.videoFixtureId,
      location: this.location
    };
  }
}

export class ClocksManager {
  constructor() {
    this.clocks = new Map();
    this.updateInterval = null;
    this.listeners = new Set();

    // Initialize default clocks
    this.initializeDefaultClocks();
  }

  initializeDefaultClocks() {
    // Clock 1 - Time of Day
    this.addClock(new Clock(1, 'tod', {
      name: 'Time of Day',
      format: 'HH:MM:SS'
    }));

    // Clock 2 - Timecode (placeholder)
    this.addClock(new Clock(2, 'timecode', {
      name: 'Timecode',
      format: 'HH:MM:SS:FF'
    }));

    // Named clocks
    this.clocks.set('TOD', this.clocks.get(1));
    this.clocks.set('timecode', this.clocks.get(2));
  }

  addClock(clock) {
    this.clocks.set(clock.id, clock);
    this.notifyListeners('add', clock);
    return clock;
  }

  removeClock(id) {
    const clock = this.clocks.get(id);
    if (clock) {
      this.clocks.delete(id);
      this.notifyListeners('remove', clock);
      return true;
    }
    return false;
  }

  getClock(id) {
    return this.clocks.get(id) || this.clocks.get(String(id));
  }

  getAllClocks() {
    return Array.from(this.clocks.values()).filter(
      (clock, index, self) =>
        index === self.findIndex(c => c.id === clock.id)
    );
  }

  addVideoClock(videoFixtureId) {
    const clockId = `video.${videoFixtureId}`;
    const clock = new Clock(clockId, 'video', {
      name: `Video ${videoFixtureId}`,
      videoFixtureId,
      format: 'MM:SS.mmm'
    });

    // Also add TRR clock
    const trrId = `video.${videoFixtureId}.TRR`;
    const trrClock = new Clock(trrId, 'video', {
      name: `Video ${videoFixtureId} TRR`,
      videoFixtureId,
      format: 'MM:SS.mmm'
    });

    this.addClock(clock);
    this.addClock(trrClock);

    return { clock, trrClock };
  }

  updateVideoClock(videoFixtureId, currentTime, duration) {
    const clock = this.getClock(`video.${videoFixtureId}`);
    const trrClock = this.getClock(`video.${videoFixtureId}.TRR`);

    if (clock) {
      clock.value = currentTime * 1000; // convert to ms
      this.notifyListeners('update', clock);
    }

    if (trrClock) {
      trrClock.value = (duration - currentTime) * 1000; // time remaining in ms
      this.notifyListeners('update', trrClock);
    }
  }

  addCountdownTimer(duration, name = null) {
    // Find next available countdown ID
    let nextId = 3;
    while (this.clocks.has(nextId)) {
      nextId++;
    }

    const clock = new Clock(nextId, 'countdown', {
      name: name || `Countdown ${nextId}`,
      duration: duration * 1000, // convert seconds to ms
      format: 'MM:SS.mmm'
    });

    clock.value = duration * 1000;
    this.addClock(clock);
    return clock;
  }

  addSunriseSunsetClocks(location) {
    const sunriseClock = new Clock('sunrise', 'sunrise', {
      name: 'Sunrise',
      location,
      format: 'HH:MM:SS'
    });

    const sunsetClock = new Clock('sunset', 'sunset', {
      name: 'Sunset',
      location,
      format: 'HH:MM:SS'
    });

    this.addClock(sunriseClock);
    this.addClock(sunsetClock);

    return { sunriseClock, sunsetClock };
  }

  start() {
    if (this.updateInterval) return;

    this.updateInterval = setInterval(() => {
      this.updateAllClocks();
    }, 100); // Update every 100ms
  }

  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  updateAllClocks() {
    this.clocks.forEach(clock => {
      clock.update();
    });
    this.notifyListeners('tick');
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(event, clock = null) {
    this.listeners.forEach(callback => {
      callback(event, clock);
    });
  }

  // Condition evaluation for IF commands
  evaluateCondition(condition) {
    // Parse condition like "clock.15 TRR=0" or "clock.1 = 18:30:00"
    const parts = condition.split(/\s+/);

    if (parts[0].startsWith('clock.')) {
      const clockRef = parts[0].substring(6); // Remove "clock."
      const clock = this.getClock(clockRef);

      if (!clock) return false;

      const operator = parts[1];
      const expectedValue = parts.slice(2).join(' ');

      return this.compareClockValue(clock, operator, expectedValue);
    }

    return false;
  }

  compareClockValue(clock, operator, expectedValue) {
    const currentValue = clock.value;

    switch (operator) {
      case '=':
      case '==':
        return currentValue === expectedValue || clock.getFormattedValue() === expectedValue;

      case '>':
        return parseFloat(currentValue) > parseFloat(expectedValue);

      case '<':
        return parseFloat(currentValue) < parseFloat(expectedValue);

      case '>=':
        return parseFloat(currentValue) >= parseFloat(expectedValue);

      case '<=':
        return parseFloat(currentValue) <= parseFloat(expectedValue);

      case 'TRR=':
        // Special case for time remaining
        return parseFloat(currentValue) === parseFloat(expectedValue) * 1000;

      default:
        return false;
    }
  }

  exportConfig() {
    return {
      clocks: this.getAllClocks().map(clock => clock.toJSON())
    };
  }

  importConfig(config) {
    if (config.clocks) {
      config.clocks.forEach(clockData => {
        const clock = new Clock(clockData.id, clockData.type, clockData);
        clock.value = clockData.value;
        clock.running = clockData.running;
        this.addClock(clock);
      });
    }
  }
}

export default ClocksManager;
