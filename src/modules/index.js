/**
 * RocKontrol Media Server - Module Index
 *
 * Central export point for all modules
 */

// Core event system
export { EventBus, eventBus, Events } from './EventBus.js';

// Video playback
export { VideoPlayer, VideoPlayerManager, videoPlayerManager } from './VideoPlayer.js';

// NDI output
export { NDIOutput, NDISourceDiscovery, NDIOutputManager, ndiOutputManager } from './NDIOutput.js';

// Playlist management
export { Playlist, PlaylistManager, playlistManager } from './PlaylistManager.js';

// Clock/timing system
export { Clock, ClockManager, clockManager } from './ClockManager.js';

// Stream Deck control
export {
  Colors,
  ButtonType,
  StreamDeckButton,
  StreamDeck,
  StreamDeckManager,
  streamDeckManager
} from './StreamDeckController.js';

// WebSocket communication
export { WebSocketClient, WebSocketManager, webSocketManager } from './WebSocketManager.js';

// CLI command parsing
export { CLIDispatcher, cliDispatcher } from './CLIDispatcher.js';

// Video Switcher (Live Production)
export {
  TransitionType,
  WipePattern,
  SourceType,
  InputSource,
  OutputDestination,
  VideoSwitcher,
  SwitcherManager,
  switcherManager
} from './VideoSwitcher.js';

/**
 * Initialize all modules with configuration
 * @param {Object} config - Configuration object
 */
export function initializeModules(config = {}) {
  // Initialize clock manager
  const { clockManager: cm } = require('./ClockManager.js');
  cm.initialize();

  // Initialize playlist manager
  if (config.playlistDir) {
    const { playlistManager: pm } = require('./PlaylistManager.js');
    pm.initialize(config.playlistDir);
  }

  // Initialize NDI manager
  if (config.ndi) {
    const { ndiOutputManager: nm } = require('./NDIOutput.js');
    nm.initialize({
      senderBinPath: config.ndi.senderBinPath,
      discoverBinPath: config.ndi.discoverBinPath
    });
  }

  // Initialize Stream Deck manager
  const { streamDeckManager: sm } = require('./StreamDeckController.js');
  sm.initialize();

  console.log('All modules initialized');
}
