/**
 * VideoSwitcher Module - Live video switching for broadcast production
 *
 * Features:
 * - Multiple input sources (video files, NDI streams)
 * - Program (PGM) and Preview (PVW) buses
 * - Cut and transition effects (dissolve, wipe, fade)
 * - Multiple output destinations
 * - Hotkey/Stream Deck integration
 * - Auto-transition timing
 */

import { eventBus, Events } from './EventBus.js';

// Transition types
const TransitionType = {
  CUT: 'cut',           // Instant switch
  DISSOLVE: 'dissolve', // Crossfade
  FADE: 'fade',         // Fade through black
  WIPE: 'wipe',         // Wipe transition
  DIP: 'dip'            // Dip to color
};

// Wipe patterns
const WipePattern = {
  LEFT_TO_RIGHT: 'left_to_right',
  RIGHT_TO_LEFT: 'right_to_left',
  TOP_TO_BOTTOM: 'top_to_bottom',
  BOTTOM_TO_TOP: 'bottom_to_top',
  CIRCLE_IN: 'circle_in',
  CIRCLE_OUT: 'circle_out',
  DIAGONAL: 'diagonal'
};

// Input source types
const SourceType = {
  VIDEO_FILE: 'video_file',
  NDI: 'ndi',
  COLOR: 'color',        // Color bars, black, etc.
  STILL: 'still',        // Still image
  MEDIA_PLAYER: 'media_player'
};

/**
 * InputSource - Represents a video input source
 */
class InputSource {
  constructor(id, options = {}) {
    this.id = id;
    this.name = options.name || `Input ${id}`;
    this.type = options.type || SourceType.VIDEO_FILE;
    this.source = options.source || null;  // File path or NDI source name

    // State
    this.active = false;
    this.connected = false;
    this.hasSignal = false;

    // Video properties
    this.resolution = options.resolution || { width: 1920, height: 1080 };
    this.frameRate = options.frameRate || 30;

    // For video files
    this.playing = false;
    this.position = 0;
    this.duration = 0;
    this.loop = options.loop || true;

    // Thumbnail/preview
    this.thumbnail = null;
  }

  /**
   * Load source
   */
  load(source, type = SourceType.VIDEO_FILE) {
    this.source = source;
    this.type = type;
    this.connected = true;
    this.hasSignal = true;

    eventBus.emit('switcher:input_loaded', {
      inputId: this.id,
      source,
      type
    });

    return this;
  }

  /**
   * Start playback (for video files)
   */
  play() {
    if (this.type === SourceType.VIDEO_FILE || this.type === SourceType.MEDIA_PLAYER) {
      this.playing = true;
    }
  }

  /**
   * Pause playback
   */
  pause() {
    this.playing = false;
  }

  /**
   * Get state
   */
  getState() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      source: this.source,
      active: this.active,
      connected: this.connected,
      hasSignal: this.hasSignal,
      playing: this.playing,
      position: this.position,
      duration: this.duration,
      loop: this.loop
    };
  }
}

/**
 * OutputDestination - Represents an output destination
 */
class OutputDestination {
  constructor(id, options = {}) {
    this.id = id;
    this.name = options.name || `Output ${id}`;
    this.type = options.type || 'ndi';  // 'ndi', 'hdmi', 'sdi', 'record'

    // What's routed to this output
    this.sourceInput = null;  // Input ID currently routed
    this.bus = 'program';     // 'program', 'preview', 'aux', 'clean'

    // State
    this.active = true;
    this.streaming = false;

    // Output properties
    this.resolution = options.resolution || { width: 1920, height: 1080 };
    this.frameRate = options.frameRate || 30;
  }

  /**
   * Route an input to this output
   */
  routeInput(inputId) {
    this.sourceInput = inputId;
    this.streaming = true;

    eventBus.emit('switcher:output_routed', {
      outputId: this.id,
      inputId
    });
  }

  /**
   * Route a bus to this output
   */
  routeBus(bus) {
    this.bus = bus;
    this.sourceInput = null;

    eventBus.emit('switcher:output_bus_changed', {
      outputId: this.id,
      bus
    });
  }

  /**
   * Get state
   */
  getState() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      sourceInput: this.sourceInput,
      bus: this.bus,
      active: this.active,
      streaming: this.streaming
    };
  }
}

/**
 * VideoSwitcher - Main switcher class
 */
class VideoSwitcher {
  constructor(options = {}) {
    this.name = options.name || 'RocKontrol Switcher';

    // Input sources
    this.inputs = new Map();
    this.maxInputs = options.maxInputs || 8;

    // Output destinations
    this.outputs = new Map();
    this.maxOutputs = options.maxOutputs || 4;

    // Program/Preview buses
    this.programInput = null;   // Input ID on program (live)
    this.previewInput = null;   // Input ID on preview (next)

    // Transition settings
    this.transitionType = options.transitionType || TransitionType.CUT;
    this.transitionDuration = options.transitionDuration || 1000; // ms
    this.wipePattern = options.wipePattern || WipePattern.LEFT_TO_RIGHT;
    this.dipColor = options.dipColor || { r: 0, g: 0, b: 0 }; // Black

    // Transition state
    this.inTransition = false;
    this.transitionProgress = 0;
    this._transitionTimer = null;

    // T-bar position (0 = preview, 1 = program)
    this.tbarPosition = 1;

    // Auto-transition
    this.autoTransitionEnabled = false;
    this.autoTransitionTime = 500; // ms

    // FTB (Fade to Black)
    this.ftbActive = false;
    this.ftbDuration = 1000;

    // Initialize default inputs
    this._initializeDefaults();
  }

  /**
   * Initialize default inputs and outputs
   */
  _initializeDefaults() {
    // Create 8 input slots
    for (let i = 1; i <= this.maxInputs; i++) {
      this.inputs.set(i, new InputSource(i, { name: `Input ${i}` }));
    }

    // Create special inputs
    this.inputs.set('black', new InputSource('black', {
      name: 'Black',
      type: SourceType.COLOR,
      source: { r: 0, g: 0, b: 0 }
    }));

    this.inputs.set('bars', new InputSource('bars', {
      name: 'Color Bars',
      type: SourceType.COLOR,
      source: 'color_bars'
    }));

    // Create default outputs
    for (let i = 1; i <= this.maxOutputs; i++) {
      const output = new OutputDestination(i, { name: `Output ${i}` });
      output.routeBus('program');
      this.outputs.set(i, output);
    }

    // Set initial program to black
    this.programInput = 'black';
    this.previewInput = 1;
  }

  // ==================== INPUT MANAGEMENT ====================

  /**
   * Load a source into an input slot
   * @param {number} inputId - Input slot (1-8)
   * @param {string} source - File path or NDI source name
   * @param {string} type - Source type
   * @param {Object} options - Additional options
   */
  loadInput(inputId, source, type = SourceType.VIDEO_FILE, options = {}) {
    const input = this.inputs.get(inputId);
    if (!input) {
      return { success: false, message: `Input ${inputId} not found` };
    }

    input.load(source, type);
    if (options.name) input.name = options.name;
    if (options.loop !== undefined) input.loop = options.loop;

    // Auto-play video files
    if (type === SourceType.VIDEO_FILE) {
      input.play();
    }

    eventBus.emit('switcher:input_changed', {
      inputId,
      input: input.getState()
    });

    return { success: true, message: `Loaded ${source} into input ${inputId}` };
  }

  /**
   * Get input by ID
   */
  getInput(inputId) {
    return this.inputs.get(inputId) || this.inputs.get(parseInt(inputId));
  }

  /**
   * Get all inputs
   */
  getAllInputs() {
    return Array.from(this.inputs.values()).map(i => i.getState());
  }

  // ==================== SWITCHING OPERATIONS ====================

  /**
   * Set preview input (next source to go live)
   * @param {number|string} inputId - Input to put on preview
   */
  preview(inputId) {
    const input = this.getInput(inputId);
    if (!input) {
      return { success: false, message: `Input ${inputId} not found` };
    }

    this.previewInput = inputId;

    eventBus.emit('switcher:preview_changed', {
      inputId,
      input: input.getState()
    });

    return { success: true, message: `Preview: Input ${inputId}` };
  }

  /**
   * CUT - Instant switch preview to program
   */
  cut() {
    if (this.inTransition) {
      return { success: false, message: 'Transition in progress' };
    }

    const prevProgram = this.programInput;
    this.programInput = this.previewInput;
    this.previewInput = prevProgram;

    this._updateOutputs();

    eventBus.emit('switcher:cut', {
      program: this.programInput,
      preview: this.previewInput
    });

    return { success: true, message: `CUT to input ${this.programInput}` };
  }

  /**
   * AUTO - Automatic transition from preview to program
   */
  auto() {
    if (this.inTransition) {
      return { success: false, message: 'Transition already in progress' };
    }

    return this._startTransition();
  }

  /**
   * Take - Same as auto (common alias)
   */
  take() {
    return this.auto();
  }

  /**
   * Start a transition
   */
  _startTransition() {
    this.inTransition = true;
    this.transitionProgress = 0;

    const startTime = Date.now();
    const duration = this.transitionDuration;
    const fromInput = this.programInput;
    const toInput = this.previewInput;

    eventBus.emit('switcher:transition_start', {
      type: this.transitionType,
      from: fromInput,
      to: toInput,
      duration
    });

    // Animate transition
    this._transitionTimer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      this.transitionProgress = Math.min(1, elapsed / duration);
      this.tbarPosition = 1 - this.transitionProgress;

      eventBus.emit('switcher:transition_progress', {
        progress: this.transitionProgress,
        tbar: this.tbarPosition
      });

      // Transition complete
      if (this.transitionProgress >= 1) {
        this._completeTransition(fromInput, toInput);
      }
    }, 16); // ~60fps

    return { success: true, message: `Transitioning to input ${toInput}` };
  }

  /**
   * Complete a transition
   */
  _completeTransition(fromInput, toInput) {
    clearInterval(this._transitionTimer);
    this._transitionTimer = null;

    this.programInput = toInput;
    this.previewInput = fromInput;
    this.inTransition = false;
    this.transitionProgress = 0;
    this.tbarPosition = 1;

    this._updateOutputs();

    eventBus.emit('switcher:transition_complete', {
      program: this.programInput,
      preview: this.previewInput
    });
  }

  /**
   * T-Bar control - manual transition control
   * @param {number} position - 0 (preview) to 1 (program)
   */
  setTBar(position) {
    this.tbarPosition = Math.max(0, Math.min(1, position));

    // If T-bar reaches either end, complete the switch
    if (this.tbarPosition <= 0) {
      // Switched to preview
      const temp = this.programInput;
      this.programInput = this.previewInput;
      this.previewInput = temp;
      this.tbarPosition = 1;
      this._updateOutputs();

      eventBus.emit('switcher:tbar_switch', {
        program: this.programInput,
        preview: this.previewInput
      });
    }

    eventBus.emit('switcher:tbar_moved', {
      position: this.tbarPosition
    });

    return { success: true, tbar: this.tbarPosition };
  }

  /**
   * Direct program switch (bypass preview)
   * @param {number|string} inputId
   */
  program(inputId) {
    const input = this.getInput(inputId);
    if (!input) {
      return { success: false, message: `Input ${inputId} not found` };
    }

    // Swap current program to preview
    this.previewInput = this.programInput;
    this.programInput = inputId;

    this._updateOutputs();

    eventBus.emit('switcher:program_changed', {
      program: this.programInput,
      preview: this.previewInput
    });

    return { success: true, message: `Program: Input ${inputId}` };
  }

  // ==================== TRANSITION SETTINGS ====================

  /**
   * Set transition type
   */
  setTransitionType(type) {
    if (Object.values(TransitionType).includes(type)) {
      this.transitionType = type;
      eventBus.emit('switcher:transition_type_changed', { type });
      return { success: true, message: `Transition type: ${type}` };
    }
    return { success: false, message: `Invalid transition type: ${type}` };
  }

  /**
   * Set transition duration
   * @param {number} ms - Duration in milliseconds
   */
  setTransitionDuration(ms) {
    this.transitionDuration = Math.max(0, Math.min(10000, ms));
    eventBus.emit('switcher:transition_duration_changed', { duration: this.transitionDuration });
    return { success: true, message: `Transition duration: ${this.transitionDuration}ms` };
  }

  /**
   * Set wipe pattern
   */
  setWipePattern(pattern) {
    if (Object.values(WipePattern).includes(pattern)) {
      this.wipePattern = pattern;
      return { success: true, message: `Wipe pattern: ${pattern}` };
    }
    return { success: false, message: `Invalid wipe pattern: ${pattern}` };
  }

  // ==================== OUTPUT MANAGEMENT ====================

  /**
   * Update all outputs based on current program
   */
  _updateOutputs() {
    this.outputs.forEach(output => {
      if (output.bus === 'program') {
        output.sourceInput = this.programInput;
      } else if (output.bus === 'preview') {
        output.sourceInput = this.previewInput;
      }
    });

    eventBus.emit('switcher:outputs_updated', {
      program: this.programInput,
      outputs: this.getAllOutputs()
    });
  }

  /**
   * Route input directly to output (bypass PGM/PVW)
   */
  routeToOutput(inputId, outputId) {
    const output = this.outputs.get(outputId);
    if (!output) {
      return { success: false, message: `Output ${outputId} not found` };
    }

    output.routeInput(inputId);
    return { success: true, message: `Routed input ${inputId} to output ${outputId}` };
  }

  /**
   * Set output bus
   */
  setOutputBus(outputId, bus) {
    const output = this.outputs.get(outputId);
    if (!output) {
      return { success: false, message: `Output ${outputId} not found` };
    }

    output.routeBus(bus);
    this._updateOutputs();
    return { success: true, message: `Output ${outputId} set to ${bus}` };
  }

  /**
   * Get all outputs
   */
  getAllOutputs() {
    return Array.from(this.outputs.values()).map(o => o.getState());
  }

  // ==================== SPECIAL FUNCTIONS ====================

  /**
   * Fade to Black (FTB)
   */
  fadeToBlack() {
    if (this.ftbActive) {
      // Fade back from black
      this.ftbActive = false;
      eventBus.emit('switcher:ftb', { active: false });
      return { success: true, message: 'Fading up from black' };
    }

    this.ftbActive = true;
    eventBus.emit('switcher:ftb', { active: true });
    return { success: true, message: 'Fade to black' };
  }

  /**
   * Get current switcher state
   */
  getState() {
    return {
      name: this.name,
      program: this.programInput,
      preview: this.previewInput,
      programInput: this.getInput(this.programInput)?.getState(),
      previewInput: this.getInput(this.previewInput)?.getState(),
      inTransition: this.inTransition,
      transitionProgress: this.transitionProgress,
      transitionType: this.transitionType,
      transitionDuration: this.transitionDuration,
      tbarPosition: this.tbarPosition,
      ftbActive: this.ftbActive,
      inputs: this.getAllInputs(),
      outputs: this.getAllOutputs()
    };
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this._transitionTimer) {
      clearInterval(this._transitionTimer);
    }
    this.inputs.clear();
    this.outputs.clear();
  }
}

/**
 * SwitcherManager - Manages video switcher instance
 */
class SwitcherManager {
  constructor() {
    this.switcher = null;
  }

  /**
   * Initialize switcher
   */
  initialize(options = {}) {
    this.switcher = new VideoSwitcher(options);
    return this.switcher;
  }

  /**
   * Get switcher instance
   */
  get() {
    return this.switcher;
  }

  /**
   * Destroy switcher
   */
  destroy() {
    if (this.switcher) {
      this.switcher.destroy();
      this.switcher = null;
    }
  }
}

// Export singleton
const switcherManager = new SwitcherManager();

export {
  TransitionType,
  WipePattern,
  SourceType,
  InputSource,
  OutputDestination,
  VideoSwitcher,
  SwitcherManager,
  switcherManager
};
