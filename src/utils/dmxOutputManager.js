/**
 * DMX Output Manager
 *
 * Coordinates DMX output across all enabled protocols
 * Handles Art-Net, sACN, and virtual intensity application
 */

import { buildMultiUniverseDMX } from './virtualIntensity';
import { sendArtNetUniverses } from './artnet';
import { sendSACNUniverses } from './sacn';

/**
 * DMX Output Manager Class
 */
export class DMXOutputManager {
  constructor() {
    this.isRunning = false;
    this.outputInterval = null;
    this.frameRate = 44; // ~44 Hz (standard DMX refresh rate)
    this.lastOutputTime = 0;
  }

  /**
   * Start continuous DMX output
   * @param {Object} config - Output configuration
   */
  start(config) {
    if (this.isRunning) return;

    this.isRunning = true;
    this.outputInterval = setInterval(() => {
      this.sendFrame(config);
    }, 1000 / this.frameRate);

    console.log('DMX Output Manager started');
  }

  /**
   * Stop DMX output
   */
  stop() {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.outputInterval) {
      clearInterval(this.outputInterval);
      this.outputInterval = null;
    }

    console.log('DMX Output Manager stopped');
  }

  /**
   * Send a single DMX frame
   * @param {Object} config - Configuration object
   */
  async sendFrame(config) {
    const {
      fixtures = [],
      encoderValues = {},
      masterFaderValue = 255,
      artnetConfig,
      sacnConfig,
      isBlackout = false
    } = config;

    // Don't send if no protocols enabled
    if (!artnetConfig?.enabled && !sacnConfig?.enabled) {
      return;
    }

    try {
      // Apply blackout
      const effectiveMasterValue = isBlackout ? 0 : masterFaderValue;

      // Build DMX universes with virtual intensity applied
      const universes = buildMultiUniverseDMX(
        fixtures,
        encoderValues,
        effectiveMasterValue
      );

      // Send via enabled protocols
      const promises = [];

      if (artnetConfig?.enabled) {
        promises.push(sendArtNetUniverses(artnetConfig, universes));
      }

      if (sacnConfig?.enabled) {
        promises.push(sendSACNUniverses(sacnConfig, universes));
      }

      await Promise.all(promises);

      this.lastOutputTime = Date.now();
    } catch (error) {
      console.error('Error sending DMX frame:', error);
    }
  }

  /**
   * Send a single frame immediately (for testing)
   * @param {Object} config - Configuration object
   */
  async sendSingleFrame(config) {
    await this.sendFrame(config);
  }

  /**
   * Check if output is running
   */
  isOutputRunning() {
    return this.isRunning;
  }

  /**
   * Set frame rate
   * @param {number} fps - Frames per second (1-44)
   */
  setFrameRate(fps) {
    this.frameRate = Math.max(1, Math.min(44, fps));

    // Restart if running
    if (this.isRunning) {
      const config = this.lastConfig;
      this.stop();
      this.start(config);
    }
  }

  /**
   * Get output statistics
   */
  getStats() {
    return {
      isRunning: this.isRunning,
      frameRate: this.frameRate,
      lastOutputTime: this.lastOutputTime,
      timeSinceLastOutput: Date.now() - this.lastOutputTime
    };
  }
}

// Global singleton instance
let dmxOutputManagerInstance = null;

/**
 * Get global DMX output manager instance
 */
export function getDMXOutputManager() {
  if (!dmxOutputManagerInstance) {
    dmxOutputManagerInstance = new DMXOutputManager();
  }
  return dmxOutputManagerInstance;
}

/**
 * Initialize DMX output with configuration
 * @param {Object} config - Initial configuration
 */
export function initializeDMXOutput(config) {
  const manager = getDMXOutputManager();
  manager.start(config);
  return manager;
}

/**
 * Update DMX output configuration
 * @param {Object} config - Updated configuration
 */
export function updateDMXOutput(config) {
  const manager = getDMXOutputManager();
  if (manager.isOutputRunning()) {
    // Send immediate frame with new config
    manager.sendSingleFrame(config);
  }
}

/**
 * Stop all DMX output
 */
export function stopDMXOutput() {
  const manager = getDMXOutputManager();
  manager.stop();
}
