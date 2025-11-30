/**
 * EventBus - Central event system for module communication
 *
 * Allows decoupled communication between modules using pub/sub pattern
 */

class EventBus {
  constructor() {
    this.listeners = new Map();
    this.history = [];
    this.maxHistory = 100;
  }

  /**
   * Subscribe to an event
   * @param {string} event - Event name
   * @param {Function} callback - Handler function
   * @returns {Function} Unsubscribe function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  /**
   * Subscribe to an event once
   * @param {string} event - Event name
   * @param {Function} callback - Handler function
   */
  once(event, callback) {
    const wrapper = (...args) => {
      this.off(event, wrapper);
      callback(...args);
    };
    this.on(event, wrapper);
  }

  /**
   * Unsubscribe from an event
   * @param {string} event - Event name
   * @param {Function} callback - Handler function
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  /**
   * Emit an event
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data = null) {
    // Add to history
    this.history.push({
      event,
      data,
      timestamp: Date.now()
    });

    // Trim history
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    // Notify listeners
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`EventBus error in ${event}:`, error);
        }
      });
    }

    // Also emit wildcard
    if (this.listeners.has('*')) {
      this.listeners.get('*').forEach(callback => {
        try {
          callback({ event, data });
        } catch (error) {
          console.error(`EventBus wildcard error:`, error);
        }
      });
    }
  }

  /**
   * Get event history
   * @param {string} event - Optional event filter
   * @returns {Array} Event history
   */
  getHistory(event = null) {
    if (event) {
      return this.history.filter(h => h.event === event);
    }
    return [...this.history];
  }

  /**
   * Clear all listeners
   */
  clear() {
    this.listeners.clear();
  }
}

// Singleton instance
const eventBus = new EventBus();

// Event constants
const Events = {
  // Video events
  VIDEO_PLAY: 'video:play',
  VIDEO_PAUSE: 'video:pause',
  VIDEO_STOP: 'video:stop',
  VIDEO_SEEK: 'video:seek',
  VIDEO_LOOP: 'video:loop',
  VIDEO_SPEED: 'video:speed',
  VIDEO_ENDED: 'video:ended',
  VIDEO_ERROR: 'video:error',
  VIDEO_PROGRESS: 'video:progress',

  // NDI events
  NDI_CONNECTED: 'ndi:connected',
  NDI_DISCONNECTED: 'ndi:disconnected',
  NDI_FRAME_SENT: 'ndi:frame_sent',
  NDI_ERROR: 'ndi:error',
  NDI_SOURCES_UPDATED: 'ndi:sources_updated',

  // Playlist events
  PLAYLIST_LOADED: 'playlist:loaded',
  PLAYLIST_ITEM_CHANGED: 'playlist:item_changed',
  PLAYLIST_ENDED: 'playlist:ended',

  // Clock events
  CLOCK_TICK: 'clock:tick',
  CLOCK_TRR_ZERO: 'clock:trr_zero',
  TIMECODE_RECEIVED: 'clock:timecode',

  // Stream Deck events
  DECK_CONNECTED: 'deck:connected',
  DECK_DISCONNECTED: 'deck:disconnected',
  DECK_KEY_PRESSED: 'deck:key_pressed',
  DECK_KEY_RELEASED: 'deck:key_released',

  // WebSocket events
  WS_CLIENT_CONNECTED: 'ws:client_connected',
  WS_CLIENT_DISCONNECTED: 'ws:client_disconnected',
  WS_MESSAGE_RECEIVED: 'ws:message_received',

  // CLI events
  CLI_COMMAND: 'cli:command',
  CLI_RESPONSE: 'cli:response',

  // System events
  STATE_CHANGED: 'state:changed',
  ERROR: 'error',
  LOG: 'log'
};

export { EventBus, eventBus, Events };
