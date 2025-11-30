/**
 * WebSocketManager Module - WebSocket server for real-time communication
 *
 * Handles client connections, message routing, and state synchronization
 */

import { eventBus, Events } from './EventBus.js';

class WebSocketClient {
  constructor(id, socket, options = {}) {
    this.id = id;
    this.socket = socket;
    this.name = options.name || `Client ${id}`;
    this.connectedAt = Date.now();
    this.lastActivity = Date.now();

    // Subscriptions
    this.subscriptions = new Set(['state']); // Default subscriptions

    // State
    this.isAlive = true;
  }

  /**
   * Send a message to this client
   * @param {string} type - Message type
   * @param {Object} data - Message data
   */
  send(type, data = {}) {
    if (this.socket.readyState === 1) { // OPEN
      try {
        this.socket.send(JSON.stringify({
          type,
          data,
          timestamp: Date.now()
        }));
        return true;
      } catch (error) {
        console.error(`Failed to send to client ${this.id}:`, error);
        return false;
      }
    }
    return false;
  }

  /**
   * Subscribe to event types
   * @param {string[]} events
   */
  subscribe(events) {
    events.forEach(event => this.subscriptions.add(event));
  }

  /**
   * Unsubscribe from event types
   * @param {string[]} events
   */
  unsubscribe(events) {
    events.forEach(event => this.subscriptions.delete(event));
  }

  /**
   * Check if subscribed to event
   * @param {string} event
   */
  isSubscribed(event) {
    return this.subscriptions.has(event) || this.subscriptions.has('*');
  }

  /**
   * Update activity timestamp
   */
  touch() {
    this.lastActivity = Date.now();
    this.isAlive = true;
  }

  /**
   * Get client info
   */
  getInfo() {
    return {
      id: this.id,
      name: this.name,
      connectedAt: this.connectedAt,
      lastActivity: this.lastActivity,
      subscriptions: Array.from(this.subscriptions)
    };
  }
}

class WebSocketManager {
  constructor() {
    this.wss = null;
    this.clients = new Map();
    this.nextClientId = 1;

    // Configuration
    this.pingInterval = 30000; // 30 seconds
    this._pingTimer = null;

    // Message handlers
    this.handlers = new Map();
    this._registerDefaultHandlers();
  }

  /**
   * Initialize WebSocket server
   * @param {Object} server - HTTP server instance
   * @param {Object} WebSocket - WebSocket class (ws package)
   */
  initialize(server, WebSocket) {
    const { WebSocketServer } = WebSocket;

    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', (socket, request) => {
      this._handleConnection(socket, request);
    });

    // Start ping interval
    this._startPingInterval();

    // Subscribe to events for broadcasting
    this._subscribeToEvents();

    console.log('WebSocketManager initialized');
    return this;
  }

  /**
   * Register default message handlers
   */
  _registerDefaultHandlers() {
    // Ping/pong
    this.registerHandler('ping', (client, data) => {
      client.send('pong', { serverTime: Date.now() });
    });

    // Subscribe to events
    this.registerHandler('subscribe', (client, data) => {
      if (data.events) {
        client.subscribe(data.events);
        client.send('subscribed', { events: data.events });
      }
    });

    // Unsubscribe from events
    this.registerHandler('unsubscribe', (client, data) => {
      if (data.events) {
        client.unsubscribe(data.events);
        client.send('unsubscribed', { events: data.events });
      }
    });

    // CLI command
    this.registerHandler('command', (client, data) => {
      if (data.command) {
        eventBus.emit(Events.CLI_COMMAND, {
          command: data.command,
          source: 'websocket',
          clientId: client.id
        });
      }
    });

    // Get state
    this.registerHandler('getState', (client, data) => {
      eventBus.emit('request:state', {
        clientId: client.id,
        callback: (state) => {
          client.send('state', state);
        }
      });
    });

    // Set client name
    this.registerHandler('setName', (client, data) => {
      if (data.name) {
        client.name = data.name;
        client.send('nameSet', { name: data.name });
      }
    });
  }

  /**
   * Subscribe to EventBus events for broadcasting
   */
  _subscribeToEvents() {
    // Video events
    eventBus.on(Events.VIDEO_PLAY, (data) => this.broadcast('video:play', data, 'video'));
    eventBus.on(Events.VIDEO_PAUSE, (data) => this.broadcast('video:pause', data, 'video'));
    eventBus.on(Events.VIDEO_STOP, (data) => this.broadcast('video:stop', data, 'video'));
    eventBus.on(Events.VIDEO_PROGRESS, (data) => this.broadcast('video:progress', data, 'video'));
    eventBus.on(Events.VIDEO_ENDED, (data) => this.broadcast('video:ended', data, 'video'));

    // Playlist events
    eventBus.on(Events.PLAYLIST_ITEM_CHANGED, (data) => this.broadcast('playlist:changed', data, 'playlist'));
    eventBus.on(Events.PLAYLIST_ENDED, (data) => this.broadcast('playlist:ended', data, 'playlist'));

    // Clock events
    eventBus.on(Events.CLOCK_TICK, (data) => this.broadcast('clock:tick', data, 'clock'));
    eventBus.on(Events.CLOCK_TRR_ZERO, (data) => this.broadcast('clock:trr_zero', data, 'clock'));

    // State changes
    eventBus.on(Events.STATE_CHANGED, (data) => this.broadcast('state:changed', data, 'state'));

    // CLI responses
    eventBus.on(Events.CLI_RESPONSE, (data) => {
      if (data.clientId) {
        const client = this.clients.get(data.clientId);
        if (client) {
          client.send('command:response', data);
        }
      }
    });
  }

  /**
   * Handle new connection
   */
  _handleConnection(socket, request) {
    const clientId = this.nextClientId++;
    const client = new WebSocketClient(clientId, socket, {
      name: `Client ${clientId}`
    });

    this.clients.set(clientId, client);

    console.log(`WebSocket client ${clientId} connected`);

    eventBus.emit(Events.WS_CLIENT_CONNECTED, {
      clientId,
      clientCount: this.clients.size
    });

    // Send welcome message
    client.send('connected', {
      clientId,
      serverTime: Date.now(),
      message: 'Connected to RocKontrol Media Server'
    });

    // Socket event handlers
    socket.on('message', (data) => {
      this._handleMessage(client, data);
    });

    socket.on('close', () => {
      this._handleDisconnect(client);
    });

    socket.on('error', (error) => {
      console.error(`Client ${clientId} error:`, error);
    });

    socket.on('pong', () => {
      client.isAlive = true;
    });
  }

  /**
   * Handle incoming message
   */
  _handleMessage(client, rawData) {
    client.touch();

    try {
      const message = JSON.parse(rawData.toString());
      const { type, data } = message;

      eventBus.emit(Events.WS_MESSAGE_RECEIVED, {
        clientId: client.id,
        type,
        data
      });

      // Find and execute handler
      const handler = this.handlers.get(type);
      if (handler) {
        handler(client, data || {});
      } else {
        client.send('error', { message: `Unknown message type: ${type}` });
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
      client.send('error', { message: 'Invalid message format' });
    }
  }

  /**
   * Handle client disconnect
   */
  _handleDisconnect(client) {
    console.log(`WebSocket client ${client.id} disconnected`);

    this.clients.delete(client.id);

    eventBus.emit(Events.WS_CLIENT_DISCONNECTED, {
      clientId: client.id,
      clientCount: this.clients.size
    });
  }

  /**
   * Register a message handler
   * @param {string} type - Message type
   * @param {Function} handler - Handler function (client, data) => void
   */
  registerHandler(type, handler) {
    this.handlers.set(type, handler);
  }

  /**
   * Broadcast message to all clients
   * @param {string} type - Message type
   * @param {Object} data - Message data
   * @param {string} subscription - Required subscription (optional)
   */
  broadcast(type, data = {}, subscription = null) {
    this.clients.forEach(client => {
      if (!subscription || client.isSubscribed(subscription)) {
        client.send(type, data);
      }
    });
  }

  /**
   * Send message to specific client
   * @param {number} clientId
   * @param {string} type
   * @param {Object} data
   */
  sendTo(clientId, type, data = {}) {
    const client = this.clients.get(clientId);
    if (client) {
      return client.send(type, data);
    }
    return false;
  }

  /**
   * Get all connected clients
   */
  getClients() {
    return Array.from(this.clients.values()).map(c => c.getInfo());
  }

  /**
   * Get client count
   */
  getClientCount() {
    return this.clients.size;
  }

  /**
   * Start ping interval for connection health
   */
  _startPingInterval() {
    this._pingTimer = setInterval(() => {
      this.clients.forEach((client, id) => {
        if (!client.isAlive) {
          console.log(`Client ${id} not responding, terminating`);
          client.socket.terminate();
          this.clients.delete(id);
          return;
        }

        client.isAlive = false;
        client.socket.ping();
      });
    }, this.pingInterval);
  }

  /**
   * Stop ping interval
   */
  _stopPingInterval() {
    if (this._pingTimer) {
      clearInterval(this._pingTimer);
      this._pingTimer = null;
    }
  }

  /**
   * Close all connections
   */
  closeAll() {
    this.clients.forEach(client => {
      client.send('server:shutdown', { message: 'Server shutting down' });
      client.socket.close();
    });
    this.clients.clear();
  }

  /**
   * Cleanup
   */
  destroy() {
    this._stopPingInterval();
    this.closeAll();

    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
  }
}

// Export singleton
const webSocketManager = new WebSocketManager();

export { WebSocketClient, WebSocketManager, webSocketManager };
