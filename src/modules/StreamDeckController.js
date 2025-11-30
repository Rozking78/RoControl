/**
 * StreamDeckController Module - Elgato Stream Deck integration
 *
 * Handles Stream Deck device connection, button mapping, and LED feedback
 */

import { eventBus, Events } from './EventBus.js';

// Button colors
const Colors = {
  OFF: { r: 0, g: 0, b: 0 },
  RED: { r: 255, g: 0, b: 0 },
  GREEN: { r: 0, g: 255, b: 0 },
  BLUE: { r: 0, g: 128, b: 255 },
  YELLOW: { r: 255, g: 255, b: 0 },
  ORANGE: { r: 255, g: 128, b: 0 },
  PURPLE: { r: 128, g: 0, b: 255 },
  CYAN: { r: 0, g: 255, b: 255 },
  WHITE: { r: 255, g: 255, b: 255 },
  GRAY: { r: 64, g: 64, b: 64 }
};

// Button types
const ButtonType = {
  PLAY: 'play',
  PAUSE: 'pause',
  STOP: 'stop',
  NEXT: 'next',
  PREVIOUS: 'previous',
  LOOP: 'loop',
  OUTPUT: 'output',
  PLAYLIST: 'playlist',
  CUE: 'cue',
  CUSTOM: 'custom'
};

class StreamDeckButton {
  constructor(row, col, options = {}) {
    this.row = row;
    this.col = col;
    this.index = null; // Set when assigned to deck

    // Button configuration
    this.type = options.type || ButtonType.CUSTOM;
    this.label = options.label || '';
    this.command = options.command || null;
    this.videoId = options.videoId || null;
    this.outputId = options.outputId || null;
    this.playlistId = options.playlistId || null;
    this.cueId = options.cueId || null;

    // Visual state
    this.color = options.color || Colors.GRAY;
    this.activeColor = options.activeColor || Colors.GREEN;
    this.pressedColor = options.pressedColor || Colors.WHITE;
    this.active = false;
    this.pressed = false;

    // Callbacks
    this.onPress = options.onPress || null;
    this.onRelease = options.onRelease || null;
  }

  /**
   * Set button state
   * @param {boolean} active
   */
  setActive(active) {
    this.active = active;
  }

  /**
   * Get current display color
   */
  getCurrentColor() {
    if (this.pressed) return this.pressedColor;
    if (this.active) return this.activeColor;
    return this.color;
  }

  /**
   * Export to JSON
   */
  toJSON() {
    return {
      row: this.row,
      col: this.col,
      index: this.index,
      type: this.type,
      label: this.label,
      command: this.command,
      videoId: this.videoId,
      outputId: this.outputId,
      active: this.active
    };
  }
}

class StreamDeck {
  constructor(id, options = {}) {
    this.id = id;
    this.name = options.name || `Stream Deck ${id}`;
    this.serial = options.serial || null;

    // Device info
    this.rows = options.rows || 3;
    this.cols = options.cols || 5;
    this.buttonCount = this.rows * this.cols;
    this.iconSize = options.iconSize || 72;

    // State
    this.connected = false;
    this.device = null;

    // Button grid
    this.buttons = new Map();
    this._initializeButtons();
  }

  /**
   * Initialize button grid
   */
  _initializeButtons() {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const index = row * this.cols + col;
        const button = new StreamDeckButton(row, col, {
          type: ButtonType.CUSTOM,
          label: `${row + 1},${col + 1}`
        });
        button.index = index;
        this.buttons.set(`${row},${col}`, button);
      }
    }
  }

  /**
   * Connect to device
   * @param {Object} device - Stream Deck device object
   */
  async connect(device) {
    this.device = device;
    this.connected = true;

    // Setup event listeners
    if (device.on) {
      device.on('down', (keyIndex) => this._handleKeyDown(keyIndex));
      device.on('up', (keyIndex) => this._handleKeyUp(keyIndex));
      device.on('error', (error) => this._handleError(error));
    }

    eventBus.emit(Events.DECK_CONNECTED, {
      id: this.id,
      name: this.name,
      serial: this.serial
    });

    // Update all button displays
    await this.updateAllButtons();

    return true;
  }

  /**
   * Disconnect from device
   */
  async disconnect() {
    if (this.device) {
      try {
        await this.device.close();
      } catch (e) {
        // Ignore close errors
      }
      this.device = null;
    }

    this.connected = false;

    eventBus.emit(Events.DECK_DISCONNECTED, {
      id: this.id
    });
  }

  /**
   * Get button at position
   * @param {number} row
   * @param {number} col
   */
  getButton(row, col) {
    return this.buttons.get(`${row},${col}`) || null;
  }

  /**
   * Get button by index
   * @param {number} index
   */
  getButtonByIndex(index) {
    const row = Math.floor(index / this.cols);
    const col = index % this.cols;
    return this.getButton(row, col);
  }

  /**
   * Configure a button
   * @param {number} row
   * @param {number} col
   * @param {Object} config
   */
  configureButton(row, col, config) {
    const button = this.getButton(row, col);
    if (button) {
      Object.assign(button, config);
      this.updateButton(row, col);
      return true;
    }
    return false;
  }

  /**
   * Assign a command to a button
   * @param {number} row
   * @param {number} col
   * @param {string} command - CLI command to execute
   * @param {string} label - Button label
   */
  assignCommand(row, col, command, label = null) {
    return this.configureButton(row, col, {
      type: ButtonType.CUSTOM,
      command,
      label: label || command.substring(0, 10)
    });
  }

  /**
   * Assign video control to a button
   * @param {number} row
   * @param {number} col
   * @param {string} videoId
   * @param {string} action - 'play', 'pause', 'stop', etc.
   */
  assignVideoControl(row, col, videoId, action) {
    const typeMap = {
      play: ButtonType.PLAY,
      pause: ButtonType.PAUSE,
      stop: ButtonType.STOP
    };

    const colorMap = {
      play: Colors.GREEN,
      pause: Colors.YELLOW,
      stop: Colors.RED
    };

    return this.configureButton(row, col, {
      type: typeMap[action] || ButtonType.CUSTOM,
      videoId,
      command: `${action} video${videoId}`,
      label: `${action.toUpperCase()}`,
      color: Colors.GRAY,
      activeColor: colorMap[action] || Colors.GREEN
    });
  }

  /**
   * Update button display
   * @param {number} row
   * @param {number} col
   */
  async updateButton(row, col) {
    if (!this.connected || !this.device) return;

    const button = this.getButton(row, col);
    if (!button) return;

    const color = button.getCurrentColor();

    try {
      // Fill button with color
      if (this.device.fillKeyColor) {
        await this.device.fillKeyColor(button.index, color.r, color.g, color.b);
      }
    } catch (error) {
      console.error(`Failed to update button ${row},${col}:`, error);
    }
  }

  /**
   * Update all button displays
   */
  async updateAllButtons() {
    for (const button of this.buttons.values()) {
      await this.updateButton(button.row, button.col);
    }
  }

  /**
   * Clear all buttons
   */
  async clearAll() {
    if (!this.connected || !this.device) return;

    try {
      if (this.device.clearPanel) {
        await this.device.clearPanel();
      }
    } catch (error) {
      console.error('Failed to clear panel:', error);
    }
  }

  /**
   * Set button brightness
   * @param {number} percent - 0-100
   */
  async setBrightness(percent) {
    if (!this.connected || !this.device) return;

    try {
      if (this.device.setBrightness) {
        await this.device.setBrightness(percent);
      }
    } catch (error) {
      console.error('Failed to set brightness:', error);
    }
  }

  /**
   * Handle key down event
   */
  _handleKeyDown(keyIndex) {
    const button = this.getButtonByIndex(keyIndex);
    if (!button) return;

    button.pressed = true;
    this.updateButton(button.row, button.col);

    eventBus.emit(Events.DECK_KEY_PRESSED, {
      deckId: this.id,
      keyIndex,
      row: button.row,
      col: button.col,
      button: button.toJSON()
    });

    // Execute command if assigned
    if (button.command) {
      eventBus.emit(Events.CLI_COMMAND, {
        command: button.command,
        source: 'streamdeck',
        deckId: this.id,
        keyIndex
      });
    }

    // Call custom handler
    if (button.onPress) {
      button.onPress(button);
    }
  }

  /**
   * Handle key up event
   */
  _handleKeyUp(keyIndex) {
    const button = this.getButtonByIndex(keyIndex);
    if (!button) return;

    button.pressed = false;
    this.updateButton(button.row, button.col);

    eventBus.emit(Events.DECK_KEY_RELEASED, {
      deckId: this.id,
      keyIndex,
      row: button.row,
      col: button.col
    });

    // Call custom handler
    if (button.onRelease) {
      button.onRelease(button);
    }
  }

  /**
   * Handle device error
   */
  _handleError(error) {
    console.error(`Stream Deck ${this.id} error:`, error);
    eventBus.emit(Events.ERROR, {
      module: 'StreamDeck',
      id: this.id,
      error: error.message
    });
  }

  /**
   * Get all button states
   */
  getButtonStates() {
    return Array.from(this.buttons.values()).map(b => b.toJSON());
  }

  /**
   * Export configuration
   */
  exportConfig() {
    return {
      id: this.id,
      name: this.name,
      rows: this.rows,
      cols: this.cols,
      buttons: this.getButtonStates()
    };
  }

  /**
   * Import configuration
   */
  importConfig(config) {
    if (config.buttons) {
      config.buttons.forEach(btnConfig => {
        this.configureButton(btnConfig.row, btnConfig.col, btnConfig);
      });
    }
  }

  /**
   * Cleanup
   */
  async destroy() {
    await this.disconnect();
    this.buttons.clear();
  }
}

/**
 * StreamDeckManager - Manages multiple Stream Deck devices
 */
class StreamDeckManager {
  constructor() {
    this.decks = new Map();
    this.nextId = 1;
    this._discoveryInterval = null;
  }

  /**
   * Initialize manager
   */
  async initialize() {
    // Note: Actual device discovery requires @elgato-stream-deck package
    // This is a placeholder for the interface
    console.log('StreamDeckManager initialized');
  }

  /**
   * Create a new deck instance
   * @param {Object} options
   */
  create(options = {}) {
    const id = options.id || String.fromCharCode(65 + this.nextId - 1); // A, B, C...
    this.nextId++;

    const deck = new StreamDeck(id, options);
    this.decks.set(id, deck);
    return deck;
  }

  /**
   * Get a deck by ID
   * @param {string} id
   */
  get(id) {
    return this.decks.get(id) || this.decks.get(id.toUpperCase()) || null;
  }

  /**
   * Get all decks
   */
  getAll() {
    return Array.from(this.decks.values());
  }

  /**
   * Remove a deck
   * @param {string} id
   */
  async remove(id) {
    const deck = this.get(id);
    if (deck) {
      await deck.destroy();
      this.decks.delete(id);
      return true;
    }
    return false;
  }

  /**
   * Assign command to deck button
   * @param {string} deckId
   * @param {number} row
   * @param {number} col
   * @param {string} command
   * @param {string} label
   */
  assignCommand(deckId, row, col, command, label = null) {
    const deck = this.get(deckId);
    if (deck) {
      return deck.assignCommand(row, col, command, label);
    }
    return false;
  }

  /**
   * Update button state across all decks for a video
   * @param {string} videoId
   * @param {string} state - 'playing', 'paused', 'stopped'
   */
  updateVideoState(videoId, state) {
    this.decks.forEach(deck => {
      deck.buttons.forEach(button => {
        if (button.videoId === videoId) {
          const isActive = (button.type === ButtonType.PLAY && state === 'playing') ||
                          (button.type === ButtonType.PAUSE && state === 'paused') ||
                          (button.type === ButtonType.STOP && state === 'stopped');
          button.setActive(isActive);
          deck.updateButton(button.row, button.col);
        }
      });
    });
  }

  /**
   * Get all deck states
   */
  getAllStates() {
    return this.getAll().map(deck => deck.exportConfig());
  }

  /**
   * Cleanup all decks
   */
  async destroy() {
    for (const deck of this.decks.values()) {
      await deck.destroy();
    }
    this.decks.clear();

    if (this._discoveryInterval) {
      clearInterval(this._discoveryInterval);
    }
  }
}

// Export singleton
const streamDeckManager = new StreamDeckManager();

export {
  Colors,
  ButtonType,
  StreamDeckButton,
  StreamDeck,
  StreamDeckManager,
  streamDeckManager
};
