/**
 * NDIOutput Module - NDI streaming output management
 *
 * Handles NDI source discovery, output creation, and frame transmission
 */

import { eventBus, Events } from './EventBus.js';
import { spawn } from 'child_process';
import path from 'path';

class NDIOutput {
  constructor(id, options = {}) {
    this.id = id;
    this.name = options.name || `NDI Output ${id}`;
    this.sourceName = options.sourceName || `RocKontrol-${id}`;

    // Output state
    this.state = {
      connected: false,
      streaming: false,
      frameCount: 0,
      fps: 0,
      resolution: options.resolution || { width: 1920, height: 1080 },
      frameRate: options.frameRate || 30
    };

    // Native process
    this._process = null;
    this._binPath = options.binPath || null;

    // Stats
    this._lastFrameTime = null;
    this._framesSent = 0;
  }

  /**
   * Initialize the NDI output
   * @param {string} binPath - Path to native NDI sender binary
   */
  async initialize(binPath) {
    this._binPath = binPath || this._binPath;

    if (!this._binPath) {
      throw new Error('NDI sender binary path not specified');
    }

    this.state.connected = true;

    eventBus.emit(Events.NDI_CONNECTED, {
      id: this.id,
      name: this.sourceName
    });

    return true;
  }

  /**
   * Start streaming
   * @param {string} videoPath - Path to video file
   * @param {Object} options - Streaming options
   */
  async startStream(videoPath, options = {}) {
    if (this._process) {
      await this.stopStream();
    }

    const args = [
      '--source', this.sourceName,
      '--file', videoPath,
      '--width', options.width || this.state.resolution.width,
      '--height', options.height || this.state.resolution.height,
      '--fps', options.fps || this.state.frameRate
    ];

    if (options.loop) {
      args.push('--loop');
    }

    try {
      this._process = spawn(this._binPath, args);
      this.state.streaming = true;

      this._process.stdout.on('data', (data) => {
        const output = data.toString();
        // Parse frame sent messages
        if (output.includes('Frame sent')) {
          this._framesSent++;
          this.state.frameCount = this._framesSent;
          this._updateFPS();

          eventBus.emit(Events.NDI_FRAME_SENT, {
            id: this.id,
            frameCount: this._framesSent
          });
        }
      });

      this._process.stderr.on('data', (data) => {
        console.error(`NDI ${this.id} error:`, data.toString());
        eventBus.emit(Events.NDI_ERROR, {
          id: this.id,
          error: data.toString()
        });
      });

      this._process.on('close', (code) => {
        this.state.streaming = false;
        this._process = null;

        if (code !== 0) {
          eventBus.emit(Events.NDI_ERROR, {
            id: this.id,
            error: `Process exited with code ${code}`
          });
        }
      });

      eventBus.emit(Events.STATE_CHANGED, {
        module: 'NDIOutput',
        id: this.id,
        action: 'startStream',
        videoPath
      });

      return true;
    } catch (error) {
      eventBus.emit(Events.NDI_ERROR, {
        id: this.id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Stop streaming
   */
  async stopStream() {
    if (this._process) {
      this._process.kill('SIGTERM');
      this._process = null;
    }

    this.state.streaming = false;
    this._framesSent = 0;

    eventBus.emit(Events.STATE_CHANGED, {
      module: 'NDIOutput',
      id: this.id,
      action: 'stopStream'
    });

    return true;
  }

  /**
   * Set resolution
   * @param {number} width
   * @param {number} height
   */
  setResolution(width, height) {
    this.state.resolution = { width, height };
    return true;
  }

  /**
   * Set frame rate
   * @param {number} fps
   */
  setFrameRate(fps) {
    this.state.frameRate = fps;
    return true;
  }

  /**
   * Get current state
   */
  getState() {
    return {
      id: this.id,
      name: this.name,
      sourceName: this.sourceName,
      ...this.state
    };
  }

  /**
   * Update FPS calculation
   */
  _updateFPS() {
    const now = Date.now();
    if (this._lastFrameTime) {
      const delta = now - this._lastFrameTime;
      this.state.fps = Math.round(1000 / delta);
    }
    this._lastFrameTime = now;
  }

  /**
   * Cleanup
   */
  async destroy() {
    await this.stopStream();
    this.state.connected = false;

    eventBus.emit(Events.NDI_DISCONNECTED, {
      id: this.id
    });
  }
}

/**
 * NDISourceDiscovery - Discover NDI sources on the network
 */
class NDISourceDiscovery {
  constructor(binPath = null) {
    this._binPath = binPath;
    this._sources = [];
    this._discoveryProcess = null;
  }

  /**
   * Discover NDI sources
   * @param {number} timeout - Discovery timeout in milliseconds
   * @returns {Promise<Array>} List of discovered sources
   */
  async discover(timeout = 5000) {
    return new Promise((resolve, reject) => {
      if (!this._binPath) {
        reject(new Error('NDI discover binary path not specified'));
        return;
      }

      const sources = [];

      try {
        this._discoveryProcess = spawn(this._binPath, [], {
          timeout
        });

        this._discoveryProcess.stdout.on('data', (data) => {
          const lines = data.toString().split('\n');
          lines.forEach(line => {
            if (line.trim() && !line.startsWith('Discovering')) {
              sources.push({
                name: line.trim(),
                type: 'ndi',
                discoveredAt: Date.now()
              });
            }
          });
        });

        this._discoveryProcess.on('close', () => {
          this._sources = sources;
          eventBus.emit(Events.NDI_SOURCES_UPDATED, { sources });
          resolve(sources);
        });

        // Timeout handler
        setTimeout(() => {
          if (this._discoveryProcess) {
            this._discoveryProcess.kill();
          }
        }, timeout);

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get cached sources
   */
  getSources() {
    return [...this._sources];
  }

  /**
   * Stop discovery
   */
  stop() {
    if (this._discoveryProcess) {
      this._discoveryProcess.kill();
      this._discoveryProcess = null;
    }
  }
}

/**
 * NDIOutputManager - Manages multiple NDI outputs
 */
class NDIOutputManager {
  constructor() {
    this.outputs = new Map();
    this.discovery = null;
    this.nextId = 1;
  }

  /**
   * Initialize manager
   * @param {Object} config - Configuration with binary paths
   */
  initialize(config = {}) {
    this.senderBinPath = config.senderBinPath || null;
    this.discoverBinPath = config.discoverBinPath || null;

    if (this.discoverBinPath) {
      this.discovery = new NDISourceDiscovery(this.discoverBinPath);
    }
  }

  /**
   * Create a new NDI output
   * @param {Object} options
   * @returns {NDIOutput}
   */
  create(options = {}) {
    const id = options.id || this.nextId++;
    const output = new NDIOutput(id, {
      ...options,
      binPath: this.senderBinPath
    });
    this.outputs.set(id, output);
    return output;
  }

  /**
   * Get an output by ID
   * @param {number|string} id
   * @returns {NDIOutput|null}
   */
  get(id) {
    return this.outputs.get(id) || this.outputs.get(parseInt(id)) || null;
  }

  /**
   * Get all outputs
   * @returns {NDIOutput[]}
   */
  getAll() {
    return Array.from(this.outputs.values());
  }

  /**
   * Remove an output
   * @param {number|string} id
   */
  async remove(id) {
    const output = this.get(id);
    if (output) {
      await output.destroy();
      this.outputs.delete(id);
      return true;
    }
    return false;
  }

  /**
   * Discover NDI sources
   * @param {number} timeout
   */
  async discoverSources(timeout = 5000) {
    if (!this.discovery) {
      throw new Error('Discovery not initialized');
    }
    return this.discovery.discover(timeout);
  }

  /**
   * Get all states
   */
  getAllStates() {
    return this.getAll().map(o => o.getState());
  }

  /**
   * Stop all outputs
   */
  async stopAll() {
    for (const output of this.outputs.values()) {
      await output.stopStream();
    }
  }

  /**
   * Cleanup
   */
  async destroy() {
    for (const output of this.outputs.values()) {
      await output.destroy();
    }
    this.outputs.clear();

    if (this.discovery) {
      this.discovery.stop();
    }
  }
}

// Export singleton manager
const ndiOutputManager = new NDIOutputManager();

export { NDIOutput, NDISourceDiscovery, NDIOutputManager, ndiOutputManager };
