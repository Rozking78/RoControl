/**
 * CLIDispatcher Module - Command parsing and routing
 *
 * Parses MA3/Hog-style CLI commands and routes them to appropriate handlers
 */

import { eventBus, Events } from './EventBus.js';
import { videoPlayerManager } from './VideoPlayer.js';
import { ndiOutputManager } from './NDIOutput.js';
import { playlistManager } from './PlaylistManager.js';
import { clockManager } from './ClockManager.js';
import { switcherManager, TransitionType } from './VideoSwitcher.js';

class CLIDispatcher {
  constructor() {
    this.commandHistory = [];
    this.historyIndex = -1;
    this.maxHistory = 100;

    // Command aliases
    this.aliases = {
      'v': 'video',
      'o': 'output',
      'p': 'play',
      's': 'stop',
      'pa': 'pause',
      'l': 'loop',
      'pl': 'playlist',
      'c': 'clock',
      'clk': 'clock',
      'trr': 'timeremaining',
      // Switcher aliases
      'pgm': 'program',
      'pvw': 'preview',
      'prv': 'preview',
      'ftb': 'fadetoblack',
      'diss': 'dissolve',
      'trans': 'transition',
      'in': 'input'
    };

    // Listen for CLI commands from other sources
    eventBus.on(Events.CLI_COMMAND, ({ command, source, clientId }) => {
      const result = this.execute(command);
      eventBus.emit(Events.CLI_RESPONSE, {
        command,
        source,
        clientId,
        ...result
      });
    });
  }

  /**
   * Execute a command string
   * @param {string} input - Command string
   * @returns {Object} Result object
   */
  execute(input) {
    if (!input || typeof input !== 'string') {
      return { success: false, message: 'Empty command' };
    }

    const trimmed = input.trim().toLowerCase();

    // Add to history
    if (trimmed && this.commandHistory[this.commandHistory.length - 1] !== trimmed) {
      this.commandHistory.push(trimmed);
      if (this.commandHistory.length > this.maxHistory) {
        this.commandHistory.shift();
      }
    }
    this.historyIndex = this.commandHistory.length;

    // Normalize aliases
    const normalized = this._normalizeAliases(trimmed);

    // Parse and route command
    try {
      return this._routeCommand(normalized);
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Normalize command aliases
   */
  _normalizeAliases(input) {
    let result = input;
    for (const [alias, replacement] of Object.entries(this.aliases)) {
      const regex = new RegExp(`\\b${alias}\\b`, 'g');
      result = result.replace(regex, replacement);
    }
    return result;
  }

  /**
   * Route command to appropriate handler
   */
  _routeCommand(command) {
    // Help
    if (command === 'help' || command === '?') {
      return this._handleHelp();
    }

    // Video commands: play video1 output1
    const playMatch = command.match(/^play\s+(video_?\d+)\s+(output_?\d+)$/);
    if (playMatch) {
      return this._handleVideoPlay(playMatch[1], playMatch[2]);
    }

    // Play without output: play video1
    const playSimpleMatch = command.match(/^play\s+(video_?\d+)$/);
    if (playSimpleMatch) {
      return this._handleVideoPlay(playSimpleMatch[1], null);
    }

    // Pause: pause video1
    const pauseMatch = command.match(/^pause\s+(video_?\d+)$/);
    if (pauseMatch) {
      return this._handleVideoPause(pauseMatch[1]);
    }

    // Stop: stop video1
    const stopMatch = command.match(/^stop\s+(video_?\d+)$/);
    if (stopMatch) {
      return this._handleVideoStop(stopMatch[1]);
    }

    // Restart: restart video1
    const restartMatch = command.match(/^restart\s+(video_?\d+)$/);
    if (restartMatch) {
      return this._handleVideoRestart(restartMatch[1]);
    }

    // Loop: loop video1 on/off
    const loopMatch = command.match(/^loop\s+(video_?\d+)\s+(on|off|true|false)$/);
    if (loopMatch) {
      const enabled = loopMatch[2] === 'on' || loopMatch[2] === 'true';
      return this._handleVideoLoop(loopMatch[1], enabled);
    }

    // Speed: speed video1 1.5
    const speedMatch = command.match(/^speed\s+(video_?\d+)\s+([\d.]+)$/);
    if (speedMatch) {
      return this._handleVideoSpeed(speedMatch[1], parseFloat(speedMatch[2]));
    }

    // Route: route video1 output2
    const routeMatch = command.match(/^route\s+(video_?\d+)\s+(output_?\d+)$/);
    if (routeMatch) {
      return this._handleVideoRoute(routeMatch[1], routeMatch[2]);
    }

    // Seek: goto video1 00:01:30
    const seekMatch = command.match(/^goto\s+(video_?\d+)\s+([\d:.]+)$/);
    if (seekMatch) {
      return this._handleVideoSeek(seekMatch[1], seekMatch[2]);
    }

    // Playlist commands
    const playlistPlayMatch = command.match(/^playlist\s+(\d+)\s+play$/);
    if (playlistPlayMatch) {
      return this._handlePlaylistPlay(parseInt(playlistPlayMatch[1]));
    }

    const playlistNextMatch = command.match(/^playlist\s+(\d+)\s+next$/);
    if (playlistNextMatch) {
      return this._handlePlaylistNext(parseInt(playlistNextMatch[1]));
    }

    const playlistPrevMatch = command.match(/^playlist\s+(\d+)\s+(prev|previous)$/);
    if (playlistPrevMatch) {
      return this._handlePlaylistPrevious(parseInt(playlistPrevMatch[1]));
    }

    // Clock commands
    const clockStartMatch = command.match(/^clock\.?(\d+)\s+start(?:\s+at\s+([\d:]+))?$/);
    if (clockStartMatch) {
      return this._handleClockStart(clockStartMatch[1], clockStartMatch[2]);
    }

    const clockStopMatch = command.match(/^clock\.?(\d+)\s+stop$/);
    if (clockStopMatch) {
      return this._handleClockStop(clockStopMatch[1]);
    }

    const clockResetMatch = command.match(/^clock\.?(\d+)\s+reset$/);
    if (clockResetMatch) {
      return this._handleClockReset(clockResetMatch[1]);
    }

    // NDI discover
    if (command === 'ndi discover' || command === 'ndi list') {
      return this._handleNDIDiscover();
    }

    // Status commands
    if (command === 'status') {
      return this._handleStatus();
    }

    if (command === 'videos' || command === 'list videos') {
      return this._handleListVideos();
    }

    if (command === 'outputs' || command === 'list outputs') {
      return this._handleListOutputs();
    }

    if (command === 'clocks' || command === 'list clocks') {
      return this._handleListClocks();
    }

    // ==================== SWITCHER COMMANDS ====================

    // CUT - instant switch
    if (command === 'cut') {
      return this._handleSwitcherCut();
    }

    // AUTO/TAKE - transition
    if (command === 'auto' || command === 'take') {
      return this._handleSwitcherAuto();
    }

    // FTB - Fade to Black
    if (command === 'fadetoblack' || command === 'ftb') {
      return this._handleSwitcherFTB();
    }

    // Preview input: preview 1, pvw 2
    const previewMatch = command.match(/^preview\s+(\d+)$/);
    if (previewMatch) {
      return this._handleSwitcherPreview(parseInt(previewMatch[1]));
    }

    // Program input: program 1, pgm 2
    const programMatch = command.match(/^program\s+(\d+)$/);
    if (programMatch) {
      return this._handleSwitcherProgram(parseInt(programMatch[1]));
    }

    // Load input: input 1 /path/to/video.mp4
    const inputLoadMatch = command.match(/^input\s+(\d+)\s+(.+)$/);
    if (inputLoadMatch) {
      return this._handleSwitcherLoadInput(parseInt(inputLoadMatch[1]), inputLoadMatch[2]);
    }

    // Transition type: transition cut, transition dissolve
    const transitionTypeMatch = command.match(/^transition\s+(cut|dissolve|fade|wipe|dip)$/);
    if (transitionTypeMatch) {
      return this._handleSwitcherTransitionType(transitionTypeMatch[1]);
    }

    // Transition duration: transition time 1000
    const transitionTimeMatch = command.match(/^transition\s+time\s+(\d+)$/);
    if (transitionTimeMatch) {
      return this._handleSwitcherTransitionTime(parseInt(transitionTimeMatch[1]));
    }

    // T-bar position: tbar 0.5
    const tbarMatch = command.match(/^tbar\s+([\d.]+)$/);
    if (tbarMatch) {
      return this._handleSwitcherTBar(parseFloat(tbarMatch[1]));
    }

    // Route input to output: route input 1 output 2
    const routeInputMatch = command.match(/^route\s+input\s+(\d+)\s+output\s+(\d+)$/);
    if (routeInputMatch) {
      return this._handleSwitcherRoute(parseInt(routeInputMatch[1]), parseInt(routeInputMatch[2]));
    }

    // Switcher status
    if (command === 'switcher' || command === 'switcher status') {
      return this._handleSwitcherStatus();
    }

    // Quick switch: just a number sets preview and cuts
    const quickSwitchMatch = command.match(/^(\d)$/);
    if (quickSwitchMatch) {
      return this._handleQuickSwitch(parseInt(quickSwitchMatch[1]));
    }

    // Unknown command
    return { success: false, message: `Unknown command: ${command}` };
  }

  // Video handlers

  _handleVideoPlay(videoId, outputId) {
    const id = this._parseId(videoId);
    let player = videoPlayerManager.get(id);

    if (!player) {
      player = videoPlayerManager.create({ id });
    }

    const success = player.play(outputId);
    return {
      success,
      message: success ? `Playing video${id}${outputId ? ` to ${outputId}` : ''}` : 'Failed to play video'
    };
  }

  _handleVideoPause(videoId) {
    const id = this._parseId(videoId);
    const player = videoPlayerManager.get(id);

    if (!player) {
      return { success: false, message: `Video ${id} not found` };
    }

    const success = player.pause();
    return {
      success,
      message: success ? `Paused video${id}` : `Video ${id} is not playing`
    };
  }

  _handleVideoStop(videoId) {
    const id = this._parseId(videoId);
    const player = videoPlayerManager.get(id);

    if (!player) {
      return { success: false, message: `Video ${id} not found` };
    }

    const success = player.stop();
    return {
      success,
      message: success ? `Stopped video${id}` : 'Failed to stop video'
    };
  }

  _handleVideoRestart(videoId) {
    const id = this._parseId(videoId);
    const player = videoPlayerManager.get(id);

    if (!player) {
      return { success: false, message: `Video ${id} not found` };
    }

    const success = player.restart();
    return {
      success,
      message: success ? `Restarted video${id}` : 'Failed to restart video'
    };
  }

  _handleVideoLoop(videoId, enabled) {
    const id = this._parseId(videoId);
    const player = videoPlayerManager.get(id);

    if (!player) {
      return { success: false, message: `Video ${id} not found` };
    }

    player.setLoop(enabled);
    return {
      success: true,
      message: `Loop ${enabled ? 'enabled' : 'disabled'} for video${id}`
    };
  }

  _handleVideoSpeed(videoId, speed) {
    const id = this._parseId(videoId);
    const player = videoPlayerManager.get(id);

    if (!player) {
      return { success: false, message: `Video ${id} not found` };
    }

    player.setSpeed(speed);
    return {
      success: true,
      message: `Set video${id} speed to ${speed}x`
    };
  }

  _handleVideoRoute(videoId, outputId) {
    const id = this._parseId(videoId);
    const player = videoPlayerManager.get(id);

    if (!player) {
      return { success: false, message: `Video ${id} not found` };
    }

    if (!player.state.playing) {
      return { success: false, message: `Video ${id} is not playing` };
    }

    player.routeTo(outputId);
    return {
      success: true,
      message: `Routed video${id} to ${outputId}`
    };
  }

  _handleVideoSeek(videoId, timeStr) {
    const id = this._parseId(videoId);
    const player = videoPlayerManager.get(id);

    if (!player) {
      return { success: false, message: `Video ${id} not found` };
    }

    const seconds = this._parseTime(timeStr);
    player.seek(seconds);
    return {
      success: true,
      message: `Seeked video${id} to ${player.formatTime(seconds)}`
    };
  }

  // Playlist handlers

  _handlePlaylistPlay(playlistId) {
    const playlist = playlistManager.get(playlistId);

    if (!playlist) {
      return { success: false, message: `Playlist ${playlistId} not found` };
    }

    const item = playlist.getCurrentItem();
    if (!item) {
      return { success: false, message: `Playlist ${playlistId} is empty` };
    }

    playlistManager.setActive(playlistId);
    return {
      success: true,
      message: `Playing playlist ${playlistId}: ${item.name}`
    };
  }

  _handlePlaylistNext(playlistId) {
    const playlist = playlistManager.get(playlistId);

    if (!playlist) {
      return { success: false, message: `Playlist ${playlistId} not found` };
    }

    const item = playlist.next();
    if (!item) {
      return { success: false, message: `End of playlist ${playlistId}` };
    }

    return {
      success: true,
      message: `Next: ${item.name}`
    };
  }

  _handlePlaylistPrevious(playlistId) {
    const playlist = playlistManager.get(playlistId);

    if (!playlist) {
      return { success: false, message: `Playlist ${playlistId} not found` };
    }

    const item = playlist.previous();
    if (!item) {
      return { success: false, message: `Beginning of playlist ${playlistId}` };
    }

    return {
      success: true,
      message: `Previous: ${item.name}`
    };
  }

  // Clock handlers

  _handleClockStart(clockId, atTime) {
    const success = clockManager.startCountdown(clockId);
    return {
      success,
      message: success ? `Started clock ${clockId}` : `Clock ${clockId} not found or not a countdown`
    };
  }

  _handleClockStop(clockId) {
    const success = clockManager.stopCountdown(clockId);
    return {
      success,
      message: success ? `Stopped clock ${clockId}` : `Clock ${clockId} not found`
    };
  }

  _handleClockReset(clockId) {
    const success = clockManager.resetCountdown(clockId);
    return {
      success,
      message: success ? `Reset clock ${clockId}` : `Clock ${clockId} not found`
    };
  }

  // NDI handlers

  async _handleNDIDiscover() {
    try {
      const sources = await ndiOutputManager.discoverSources(5000);
      return {
        success: true,
        message: `Found ${sources.length} NDI source(s)`,
        data: sources
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Status handlers

  _handleStatus() {
    const videos = videoPlayerManager.getAllStates();
    const outputs = ndiOutputManager.getAllStates();
    const clocks = clockManager.getAllStates();
    const playlists = playlistManager.getAllStates();

    return {
      success: true,
      message: 'System status',
      data: {
        videos,
        outputs,
        clocks,
        playlists
      }
    };
  }

  _handleListVideos() {
    const videos = videoPlayerManager.getAllStates();
    const list = videos.map(v => `video${v.id}: ${v.playing ? 'playing' : v.paused ? 'paused' : 'stopped'}`);
    return {
      success: true,
      message: videos.length ? list.join('\n') : 'No videos',
      data: videos
    };
  }

  _handleListOutputs() {
    const outputs = ndiOutputManager.getAllStates();
    const list = outputs.map(o => `output${o.id}: ${o.streaming ? 'streaming' : 'idle'}`);
    return {
      success: true,
      message: outputs.length ? list.join('\n') : 'No outputs',
      data: outputs
    };
  }

  _handleListClocks() {
    const clocks = clockManager.getAllStates();
    const list = clocks.map(c => `clock.${c.id}: ${c.value || '---'}`);
    return {
      success: true,
      message: list.join('\n'),
      data: clocks
    };
  }

  // ==================== SWITCHER HANDLERS ====================

  _handleSwitcherCut() {
    const switcher = switcherManager.get();
    if (!switcher) {
      switcherManager.initialize();
    }
    return switcherManager.get().cut();
  }

  _handleSwitcherAuto() {
    const switcher = switcherManager.get();
    if (!switcher) {
      switcherManager.initialize();
    }
    return switcherManager.get().auto();
  }

  _handleSwitcherFTB() {
    const switcher = switcherManager.get();
    if (!switcher) {
      switcherManager.initialize();
    }
    return switcherManager.get().fadeToBlack();
  }

  _handleSwitcherPreview(inputId) {
    const switcher = switcherManager.get();
    if (!switcher) {
      switcherManager.initialize();
    }
    return switcherManager.get().preview(inputId);
  }

  _handleSwitcherProgram(inputId) {
    const switcher = switcherManager.get();
    if (!switcher) {
      switcherManager.initialize();
    }
    return switcherManager.get().program(inputId);
  }

  _handleSwitcherLoadInput(inputId, source) {
    const switcher = switcherManager.get();
    if (!switcher) {
      switcherManager.initialize();
    }
    return switcherManager.get().loadInput(inputId, source.trim());
  }

  _handleSwitcherTransitionType(type) {
    const switcher = switcherManager.get();
    if (!switcher) {
      switcherManager.initialize();
    }
    return switcherManager.get().setTransitionType(type);
  }

  _handleSwitcherTransitionTime(ms) {
    const switcher = switcherManager.get();
    if (!switcher) {
      switcherManager.initialize();
    }
    return switcherManager.get().setTransitionDuration(ms);
  }

  _handleSwitcherTBar(position) {
    const switcher = switcherManager.get();
    if (!switcher) {
      switcherManager.initialize();
    }
    return switcherManager.get().setTBar(position);
  }

  _handleSwitcherRoute(inputId, outputId) {
    const switcher = switcherManager.get();
    if (!switcher) {
      switcherManager.initialize();
    }
    return switcherManager.get().routeToOutput(inputId, outputId);
  }

  _handleSwitcherStatus() {
    const switcher = switcherManager.get();
    if (!switcher) {
      switcherManager.initialize();
    }
    const state = switcherManager.get().getState();
    const lines = [
      `Switcher: ${state.name}`,
      `Program: Input ${state.program}`,
      `Preview: Input ${state.preview}`,
      `Transition: ${state.transitionType} (${state.transitionDuration}ms)`,
      `FTB: ${state.ftbActive ? 'ACTIVE' : 'Off'}`,
      `Inputs: ${state.inputs.filter(i => i.connected).length} connected`
    ];
    return {
      success: true,
      message: lines.join('\n'),
      data: state
    };
  }

  _handleQuickSwitch(inputId) {
    const switcher = switcherManager.get();
    if (!switcher) {
      switcherManager.initialize();
    }
    // Set preview and cut
    switcherManager.get().preview(inputId);
    return switcherManager.get().cut();
  }

  _handleHelp() {
    const help = `
RocKontrol Media Server Commands
================================

VIDEO SWITCHER (Live Production):
  cut                     Instant switch PVW to PGM
  auto / take             Transition PVW to PGM
  preview 1 / pvw 1       Set input 1 to preview
  program 1 / pgm 1       Set input 1 to program
  1-8                     Quick switch to input
  input 1 /path/video.mp4 Load video into input slot
  transition dissolve     Set transition type
  transition time 1000    Set transition duration (ms)
  tbar 0.5                Manual T-bar control
  ftb                     Fade to Black toggle
  route input 1 output 2  Direct route input to output
  switcher                Show switcher status

Video Control:
  play video1 output1     Start playback to output
  pause video1            Pause playback
  stop video1             Stop and reset
  restart video1          Restart from beginning
  loop video1 on/off      Toggle looping
  speed video1 1.5        Set playback speed
  route video1 output2    Route to different output
  goto video1 00:01:30    Seek to timestamp

Playlist Control:
  playlist 1 play         Play playlist
  playlist 1 next         Next item
  playlist 1 prev         Previous item

Clock Control:
  clock.3 start           Start countdown
  clock.3 stop            Stop countdown
  clock.3 reset           Reset countdown

NDI:
  ndi discover            Find NDI sources

Status:
  status                  Show system status
  videos                  List video players
  outputs                 List NDI outputs
  clocks                  List clocks
  help                    Show this help
`;
    return {
      success: true,
      message: help.trim()
    };
  }

  // Utility methods

  _parseId(idStr) {
    const match = idStr.match(/(\d+)/);
    return match ? parseInt(match[1]) : 1;
  }

  _parseTime(timeStr) {
    const parts = timeStr.split(':');
    if (parts.length === 3) {
      const [h, m, s] = parts.map(p => parseFloat(p) || 0);
      return h * 3600 + m * 60 + s;
    } else if (parts.length === 2) {
      const [m, s] = parts.map(p => parseFloat(p) || 0);
      return m * 60 + s;
    }
    return parseFloat(timeStr) || 0;
  }

  // History navigation

  historyUp() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      return this.commandHistory[this.historyIndex];
    }
    return null;
  }

  historyDown() {
    if (this.historyIndex < this.commandHistory.length - 1) {
      this.historyIndex++;
      return this.commandHistory[this.historyIndex];
    }
    this.historyIndex = this.commandHistory.length;
    return '';
  }

  getHistory() {
    return [...this.commandHistory];
  }
}

// Export singleton
const cliDispatcher = new CLIDispatcher();

export { CLIDispatcher, cliDispatcher };
