/**
 * CLI Command Parser for MA3/Hog-style syntax
 *
 * Command Syntax:
 * - WINDOW_ID/OBJECT_ID TARGET_WINDOW_ID/TARGET_OBJECT_ID ENTER
 * - Examples:
 *   - "4/1 10" - Route object 1 from window 4 to window 10
 *   - "9 color" - Switch programmer (window 9) to color feature set
 *   - "fixture 1 thru 10" - Select fixtures 1 through 10
 *   - "1 at 50" - Set selected fixtures to 50%
 *   - "red at 255" - Set red channel to 255
 *   - "1.5" - Recall color preset 5 (feature set 1, preset 5)
 *   - "group 1 preset 1.5" - Apply color preset 5 to group 1
 *   - "clear" - Clear programmer
 *   - "blackout" - Trigger blackout
 *
 * New Keywords (v0.2.0):
 * Clocks: CLOCK/CLK, TOD, TC, TRR, START, STOP, RESET, SUNRISE, SUNSET
 * Groups: GROUP, I/INHIBITIVE, A/ADDITIVE, SC/SCALING, SU/SUBTRACTIVE, MODE, PRIORITY
 * Time: TIME, CUE, EXEC/EXECUTOR
 * Conditionals: IF, AND, OR, NOT, EMPTY, ACTIVE, RUNNING, PROGRAMMER
 * Video/NDI: VIDEO, PLAY, PAUSE, RESUME, NDI, DISCOVER, SOURCE
 * Recording: RECORD, UPDATE
 * History: UNDO/U, REDO/R
 * Operators: =, ==, >, <, >=, <=, !=, <>
 * Actions: GO, AT, FULL, THRU/THROUGH
 */

import { parseDotNotation } from './featureSetMapping.js'

export class CLIParser {
  constructor() {
    this.commandHistory = []
    this.historyIndex = -1

    // Keyword aliases
    this.aliases = {
      'clk': 'clock',
      'tod': 'clock.1',
      'tc': 'clock.2',
      'timecode': 'clock.2',
      'i': 'inhibitive',
      'a': 'additive',
      'sc': 'scaling',
      'su': 'subtractive',
      'exec': 'executor',
      'thru': 'through',
      'bo': 'blackout',
      'c': 'clear',
      'loc': 'locate',
      '==': '=',
      '<>': '!=',
      'u': 'undo',
      'r': 'redo'
    }
  }

  /**
   * Parse a command string into a structured command object
   * @param {string} input - Raw command input
   * @returns {Object} Parsed command object
   */
  parse(input) {
    if (!input || typeof input !== 'string') {
      return { type: 'invalid', raw: input, error: 'Empty command' }
    }

    const trimmed = input.trim().toLowerCase()

    // Add to history
    if (trimmed && this.commandHistory[this.commandHistory.length - 1] !== trimmed) {
      this.commandHistory.push(trimmed)
      if (this.commandHistory.length > 100) {
        this.commandHistory.shift()
      }
    }
    this.historyIndex = this.commandHistory.length

    // Parse different command types

    // Apply aliases
    const normalized = this.normalizeInput(trimmed)

    // System commands
    if (normalized === 'clear') {
      return { type: 'clear', raw: input }
    }

    if (normalized === 'blackout') {
      return { type: 'blackout', raw: input }
    }

    if (normalized === 'locate') {
      return { type: 'locate', raw: input }
    }

    if (normalized === 'undo') {
      return { type: 'undo', raw: input }
    }

    if (normalized === 'redo') {
      return { type: 'redo', raw: input }
    }

    if (normalized.startsWith('help')) {
      return { type: 'help', raw: input }
    }

    // Clock commands
    if (normalized.startsWith('clock') || normalized.startsWith('tod') || normalized.startsWith('tc')) {
      return this.parseClockCommand(normalized, input)
    }

    if (normalized.startsWith('start ') || normalized.startsWith('stop ') || normalized.startsWith('reset ')) {
      return this.parseTimerControl(normalized, input)
    }

    // Group handle commands
    if (normalized.startsWith('group ')) {
      return this.parseGroupCommand(normalized, input)
    }

    // Time commands
    if (normalized.startsWith('time ')) {
      return this.parseTimeCommand(normalized, input)
    }

    // GO commands
    if (normalized.startsWith('go ')) {
      return this.parseGoCommand(normalized, input)
    }

    // Video/NDI commands
    if (normalized.startsWith('video ') || normalized.startsWith('play ') ||
        normalized.startsWith('pause ') || normalized.startsWith('resume ')) {
      return this.parseVideoCommand(normalized, input)
    }

    if (normalized.startsWith('ndi ')) {
      return this.parseNDICommand(normalized, input)
    }

    // IF conditional commands
    if (normalized.includes(' if ')) {
      return this.parseConditionalCommand(normalized, input)
    }

    // Record/Update commands
    if (normalized.startsWith('record ') || normalized.startsWith('update ')) {
      return this.parseRecordCommand(normalized, input)
    }

    // Feature set switching (e.g., "color", "position", "focus")
    const featureSets = ['color', 'position', 'focus', 'intensity', 'gobo', 'beam', 'videosource', 'videooutput']
    if (featureSets.includes(trimmed)) {
      return { type: 'feature_set', feature: trimmed, raw: input }
    }

    // Window routing (e.g., "4/1 10" or "9 color")
    const windowRouteMatch = trimmed.match(/^(\d+)(?:\/(\d+))?\s+(\d+|[a-z]+)(?:\/(\d+))?$/)
    if (windowRouteMatch) {
      return {
        type: 'window_route',
        sourceWindow: parseInt(windowRouteMatch[1]),
        sourceObject: windowRouteMatch[2] ? parseInt(windowRouteMatch[2]) : null,
        targetWindow: windowRouteMatch[3].match(/^\d+$/) ? parseInt(windowRouteMatch[3]) : windowRouteMatch[3],
        targetObject: windowRouteMatch[4] ? parseInt(windowRouteMatch[4]) : null,
        raw: input
      }
    }

    // Fixture selection (e.g., "fixture 1", "1", "1 thru 10", "1+5+10")
    const fixtureMatch = trimmed.match(/^(?:fixture\s+)?(\d+)(?:\s+thru\s+(\d+))?$/)
    if (fixtureMatch) {
      return {
        type: 'select_fixture',
        start: parseInt(fixtureMatch[1]),
        end: fixtureMatch[2] ? parseInt(fixtureMatch[2]) : null,
        raw: input
      }
    }

    // Multiple fixture selection with + (e.g., "1+5+10")
    if (trimmed.match(/^\d+(?:\+\d+)+$/)) {
      const fixtures = trimmed.split('+').map(n => parseInt(n))
      return {
        type: 'select_multiple',
        fixtures,
        raw: input
      }
    }

    // Value assignment (e.g., "at 50", "1 at 100", "red at 255")
    const atMatch = trimmed.match(/^(?:(\d+|[a-z_]+)\s+)?at\s+(\d+)$/)
    if (atMatch) {
      return {
        type: 'set_value',
        target: atMatch[1] || 'intensity',
        value: parseInt(atMatch[2]),
        raw: input
      }
    }

    // Channel assignment (e.g., "red 255", "dimmer 50")
    const channelMatch = trimmed.match(/^([a-z_]+)\s+(\d+)$/)
    if (channelMatch) {
      return {
        type: 'set_channel',
        channel: channelMatch[1],
        value: parseInt(channelMatch[2]),
        raw: input
      }
    }

    // Update command with dot notation (e.g., "update 1.5" for intensity preset 5)
    const updateDotMatch = trimmed.match(/^update\s+(\d+\.\d+)$/)
    if (updateDotMatch) {
      const dotNotation = parseDotNotation(updateDotMatch[1])

      if (dotNotation) {
        return {
          type: 'update_dot',
          featureSet: dotNotation.featureSet,
          featureSetName: dotNotation.featureSetName,
          presetId: dotNotation.preset,
          raw: input
        }
      }
    }

    // Update command with object type (e.g., "update cue 1", "update color 3")
    const updateMatch = trimmed.match(/^update\s+(cue|preset|group|view|color|position|focus|intensity|gobo|videosource|videooutput)\s+(\d+)$/)
    if (updateMatch) {
      return {
        type: 'update',
        objectType: updateMatch[1],
        id: parseInt(updateMatch[2]),
        raw: input
      }
    }

    // Record command with dot notation (e.g., "record 1.5" for color preset 5)
    const recordDotMatch = trimmed.match(/^record\s+(\d+\.\d+)(?:\s+(.+))?$/)
    if (recordDotMatch) {
      const dotNotation = parseDotNotation(recordDotMatch[1])

      if (dotNotation) {
        return {
          type: 'record_dot',
          featureSet: dotNotation.featureSet,
          featureSetName: dotNotation.featureSetName,
          presetId: dotNotation.preset,
          name: recordDotMatch[2] || null,
          raw: input
        }
      }
    }

    // Record command with object type (e.g., "record cue 1", "record color 3")
    const recordMatch = trimmed.match(/^record\s+(cue|preset|group|view|color|position|focus|intensity|gobo|videosource|videooutput)\s+(\d+)(?:\s+(.+))?$/)
    if (recordMatch) {
      return {
        type: 'record',
        objectType: recordMatch[1],
        id: parseInt(recordMatch[2]),
        name: recordMatch[3] || null,
        raw: input
      }
    }

    // Contextual record command (just "record" or "record [name]")
    const recordContextMatch = trimmed.match(/^record(?:\s+(.+))?$/)
    if (recordContextMatch && trimmed !== 'record cue' && trimmed !== 'record preset') {
      return {
        type: 'record_contextual',
        name: recordContextMatch[1] || null,
        raw: input
      }
    }

    // Group preset command (e.g., "group 1 preset 1.5")
    const groupPresetMatch = trimmed.match(/^group\s+(\d+)\s+preset\s+(\d+\.\d+)$/)
    if (groupPresetMatch) {
      const groupNum = parseInt(groupPresetMatch[1])
      const dotNotation = parseDotNotation(groupPresetMatch[2])

      if (dotNotation) {
        return {
          type: 'group_preset',
          groupId: groupNum,
          featureSet: dotNotation.featureSet,
          featureSetName: dotNotation.featureSetName,
          presetId: dotNotation.preset,
          raw: input
        }
      }
    }

    // Dot notation preset recall (e.g., "1.5" for color preset 5)
    const dotNotationMatch = trimmed.match(/^(\d+\.\d+)$/)
    if (dotNotationMatch) {
      const dotNotation = parseDotNotation(dotNotationMatch[1])

      if (dotNotation) {
        return {
          type: 'recall_dot',
          featureSet: dotNotation.featureSet,
          featureSetName: dotNotation.featureSetName,
          presetId: dotNotation.preset,
          raw: input
        }
      }
    }

    // Recall commands (e.g., "cue 1", "preset 5", "color 3", "go")
    const recallMatch = trimmed.match(/^(?:(cue|preset|group|view|color|position|focus|intensity|gobo|videosource|videooutput)\s+)?(\d+|go)$/)
    if (recallMatch && recallMatch[2] !== 'go') {
      return {
        type: 'recall',
        objectType: recallMatch[1] || 'cue',
        id: recallMatch[2] === 'go' ? 'next' : parseInt(recallMatch[2]),
        raw: input
      }
    }

    if (trimmed === 'go') {
      return {
        type: 'go',
        raw: input
      }
    }

    // Time modifier commands (e.g., "time 5", "time 2.5", "time 0")
    const timeMatch = trimmed.match(/^time\s+([\d.]+)$/)
    if (timeMatch) {
      return {
        type: 'time',
        seconds: parseFloat(timeMatch[1]),
        raw: input
      }
    }

    // Fan command with axis modifiers (e.g., "fan", "fan x", "fan y", "fan left x", "fan center y")
    const fanMatch = trimmed.match(/^fan(?:\s+(left|right|outside|center))?(?:\s+(x|y))?$/)
    if (fanMatch) {
      return {
        type: 'fan',
        mode: fanMatch[1] || 'center',  // Default to center
        axis: fanMatch[2] || 'x',        // Default to x axis
        raw: input
      }
    }

    // Encoder commands (e.g., "encoder 1 50", "enc 2 128", "wheel 3 255")
    const encoderMatch = trimmed.match(/^(encoder|enc|wheel)\s+(\d+)\s+([-]?\d+)$/)
    if (encoderMatch) {
      return {
        type: 'encoder',
        encoderId: parseInt(encoderMatch[2]),
        value: parseInt(encoderMatch[3]),
        raw: input
      }
    }

    // Highlight commands (e.g., "highlight", "highlight on", "highlight off", "hilight", "hi")
    const highlightMatch = trimmed.match(/^(highlight|hilight|hi)(?:\s+(on|off))?$/)
    if (highlightMatch) {
      return {
        type: 'highlight',
        state: highlightMatch[2] || 'toggle',  // Default to toggle if no state specified
        raw: input
      }
    }

    // Window commands (e.g., "window 10", "open 10", "close 10", "10")
    const windowOpenMatch = trimmed.match(/^(?:window|open|w)\s+(\d+)$/)
    if (windowOpenMatch) {
      return {
        type: 'window_open',
        windowId: parseInt(windowOpenMatch[1]),
        raw: input
      }
    }

    // Close window command (e.g., "close 10", "close window 10")
    const windowCloseMatch = trimmed.match(/^close\s+(?:window\s+)?(\d+)$/)
    if (windowCloseMatch) {
      return {
        type: 'window_close',
        windowId: parseInt(windowCloseMatch[1]),
        raw: input
      }
    }

    // Video control commands
    // play video1 output1 - Play video input to output
    const playMatch = trimmed.match(/^play\s+(video\d+|video_\d+)\s+(output\d+|output_\d+)$/)
    if (playMatch) {
      return {
        type: 'video_play',
        videoInput: playMatch[1],
        videoOutput: playMatch[2],
        raw: input
      }
    }

    // pause video1 - Pause video playback
    const pauseMatch = trimmed.match(/^pause\s+(video\d+|video_\d+)$/)
    if (pauseMatch) {
      return {
        type: 'video_pause',
        videoInput: pauseMatch[1],
        raw: input
      }
    }

    // stop video1 - Stop video playback
    const stopMatch = trimmed.match(/^stop\s+(video\d+|video_\d+)$/)
    if (stopMatch) {
      return {
        type: 'video_stop',
        videoInput: pauseMatch[1],
        raw: input
      }
    }

    // restart video1 - Restart video from beginning
    const restartMatch = trimmed.match(/^restart\s+(video\d+|video_\d+)$/)
    if (restartMatch) {
      return {
        type: 'video_restart',
        videoInput: restartMatch[1],
        raw: input
      }
    }

    // loop video1 on/off - Enable/disable looping
    const loopMatch = trimmed.match(/^loop\s+(video\d+|video_\d+)\s+(on|off|true|false)$/)
    if (loopMatch) {
      return {
        type: 'video_loop',
        videoInput: loopMatch[1],
        enabled: loopMatch[2] === 'on' || loopMatch[2] === 'true',
        raw: input
      }
    }

    // speed video1 1.5 - Set playback speed
    const speedMatch = trimmed.match(/^speed\s+(video\d+|video_\d+)\s+([\d.]+)$/)
    if (speedMatch) {
      return {
        type: 'video_speed',
        videoInput: speedMatch[1],
        speed: parseFloat(speedMatch[2]),
        raw: input
      }
    }

    // Unknown command
    return {
      type: 'unknown',
      raw: input,
      error: 'Unknown command syntax'
    }
  }

  /**
   * Normalize input by applying aliases
   */
  normalizeInput(input) {
    let result = input
    for (const [alias, replacement] of Object.entries(this.aliases)) {
      const regex = new RegExp(`\\b${alias}\\b`, 'gi')
      result = result.replace(regex, replacement)
    }
    return result
  }

  /**
   * Parse clock commands
   * Examples: clock.1, clock.TOD, clock.video.15.TRR
   */
  parseClockCommand(normalized, raw) {
    const clockMatch = normalized.match(/^clock\.?([a-z0-9.]+)?/)
    if (clockMatch) {
      return {
        type: 'clock_reference',
        clockId: clockMatch[1] || '1',
        raw
      }
    }
    return { type: 'invalid', raw, error: 'Invalid clock syntax' }
  }

  /**
   * Parse timer control commands
   * Examples: START clock.3 AT 00:10:00, STOP clock.3, RESET clock.3
   */
  parseTimerControl(normalized, raw) {
    const startMatch = normalized.match(/^start\s+clock\.?([a-z0-9.]+)(?:\s+at\s+([\d:]+))?/)
    if (startMatch) {
      return {
        type: 'clock_start',
        clockId: startMatch[1],
        time: startMatch[2] || null,
        raw
      }
    }

    const stopMatch = normalized.match(/^stop\s+clock\.?([a-z0-9.]+)/)
    if (stopMatch) {
      return {
        type: 'clock_stop',
        clockId: stopMatch[1],
        raw
      }
    }

    const resetMatch = normalized.match(/^reset\s+clock\.?([a-z0-9.]+)/)
    if (resetMatch) {
      return {
        type: 'clock_reset',
        clockId: resetMatch[1],
        raw
      }
    }

    return { type: 'invalid', raw, error: 'Invalid timer control syntax' }
  }

  /**
   * Parse group handle commands
   * Examples: group 1, group 1 mode A, group 1 priority 75
   */
  parseGroupCommand(normalized, raw) {
    // group 1 mode A/I/SC/SU
    const modeMatch = normalized.match(/^group\s+(\d+)\s+mode\s+(inhibitive|additive|scaling|subtractive)/)
    if (modeMatch) {
      return {
        type: 'group_mode',
        groupId: parseInt(modeMatch[1]),
        mode: modeMatch[2],
        raw
      }
    }

    // group 1 priority 75
    const priorityMatch = normalized.match(/^group\s+(\d+)\s+priority\s+(\d+)/)
    if (priorityMatch) {
      return {
        type: 'group_priority',
        groupId: parseInt(priorityMatch[1]),
        priority: parseInt(priorityMatch[2]),
        raw
      }
    }

    // group 1 intensity 75 (for scaling mode)
    const intensityMatch = normalized.match(/^group\s+(\d+)\s+intensity\s+(\d+)/)
    if (intensityMatch) {
      return {
        type: 'group_intensity',
        groupId: parseInt(intensityMatch[1]),
        intensity: parseInt(intensityMatch[2]),
        raw
      }
    }

    // group 1 (select group)
    const selectMatch = normalized.match(/^group\s+(\d+)$/)
    if (selectMatch) {
      return {
        type: 'select_group',
        groupId: parseInt(selectMatch[1]),
        raw
      }
    }

    return { type: 'invalid', raw, error: 'Invalid group syntax' }
  }

  /**
   * Parse time commands
   * Examples: time 5, time 3 cue 1, time 2.5 exec 1
   */
  parseTimeCommand(normalized, raw) {
    // time 5 cue 3
    const cueTimeMatch = normalized.match(/^time\s+([\d.]+)\s+cue\s+(\d+)/)
    if (cueTimeMatch) {
      return {
        type: 'set_cue_time',
        time: parseFloat(cueTimeMatch[1]),
        cueNumber: parseInt(cueTimeMatch[2]),
        raw
      }
    }

    // time 3 exec 1 or time 3 executor 1
    const execTimeMatch = normalized.match(/^time\s+([\d.]+)\s+executor\s+(\d+)/)
    if (execTimeMatch) {
      return {
        type: 'set_executor_time',
        time: parseFloat(execTimeMatch[1]),
        executorNumber: parseInt(execTimeMatch[2]),
        raw
      }
    }

    // time 5 (set program time)
    const programTimeMatch = normalized.match(/^time\s+([\d.]+)$/)
    if (programTimeMatch) {
      return {
        type: 'set_program_time',
        time: parseFloat(programTimeMatch[1]),
        raw
      }
    }

    return { type: 'invalid', raw, error: 'Invalid time syntax' }
  }

  /**
   * Parse GO commands
   * Examples: GO cue 5, GO exec 1.15, GO cue 5 IF time > 18:00
   */
  parseGoCommand(normalized, raw) {
    // GO cue 5
    const cueMatch = normalized.match(/^go\s+cue\s+(\d+)/)
    if (cueMatch) {
      return {
        type: 'go_cue',
        cueNumber: parseInt(cueMatch[1]),
        raw
      }
    }

    // GO exec 1.15 or GO executor 1.15
    const execMatch = normalized.match(/^go\s+executor\s+(\d+)(?:\.(\d+))?/)
    if (execMatch) {
      return {
        type: 'go_executor',
        executorNumber: parseInt(execMatch[1]),
        position: execMatch[2] ? parseInt(execMatch[2]) : null,
        raw
      }
    }

    return { type: 'invalid', raw, error: 'Invalid GO syntax' }
  }

  /**
   * Parse video commands
   * Examples: play video 15, pause video 15, resume video 15
   */
  parseVideoCommand(normalized, raw) {
    // play video 15
    const playMatch = normalized.match(/^play\s+video\s+(\d+)/)
    if (playMatch) {
      return {
        type: 'video_play',
        videoNumber: parseInt(playMatch[1]),
        raw
      }
    }

    // pause video 15
    const pauseMatch = normalized.match(/^pause\s+video\s+(\d+)/)
    if (pauseMatch) {
      return {
        type: 'video_pause',
        videoNumber: parseInt(pauseMatch[1]),
        raw
      }
    }

    // resume video 15
    const resumeMatch = normalized.match(/^resume\s+video\s+(\d+)/)
    if (resumeMatch) {
      return {
        type: 'video_resume',
        videoNumber: parseInt(resumeMatch[1]),
        raw
      }
    }

    // video 15 source ndi Camera1
    const sourceMatch = normalized.match(/^video\s+(\d+)\s+source\s+(ndi|file)\s+(.+)/)
    if (sourceMatch) {
      return {
        type: 'video_source',
        videoNumber: parseInt(sourceMatch[1]),
        sourceType: sourceMatch[2],
        sourceName: sourceMatch[3],
        raw
      }
    }

    return { type: 'invalid', raw, error: 'Invalid video syntax' }
  }

  /**
   * Parse NDI commands
   * Examples: ndi discover, ndi list
   */
  parseNDICommand(normalized, raw) {
    if (normalized === 'ndi discover') {
      return { type: 'ndi_discover', raw }
    }

    if (normalized === 'ndi list') {
      return { type: 'ndi_list', raw }
    }

    return { type: 'invalid', raw, error: 'Invalid NDI syntax' }
  }

  /**
   * Parse conditional commands
   * Examples: GO cue 5 IF time > 18:00, AT full IF fixture.1.intensity > 0
   */
  parseConditionalCommand(normalized, raw) {
    const parts = normalized.split(' if ')
    if (parts.length !== 2) {
      return { type: 'invalid', raw, error: 'Invalid IF syntax' }
    }

    const baseCommand = this.parse(parts[0])
    const condition = this.parseCondition(parts[1])

    return {
      type: 'conditional',
      baseCommand,
      condition,
      raw
    }
  }

  /**
   * Parse condition expression
   * Examples: time > 18:00, clock.15 TRR=0, programmer NOT EMPTY
   */
  parseCondition(conditionStr) {
    // Clock condition: clock.15 TRR=0
    const clockMatch = conditionStr.match(/^clock\.([a-z0-9.]+)\s+trr\s*([=<>!]+)\s*(.+)/)
    if (clockMatch) {
      return {
        type: 'clock_condition',
        clockId: clockMatch[1],
        operator: clockMatch[2],
        value: clockMatch[3]
      }
    }

    // State condition: programmer EMPTY, blackout ACTIVE
    const stateMatch = conditionStr.match(/^(programmer|blackout|cue\.\d+|executor\.\d+)\s+(empty|active|running|not\s+empty)/)
    if (stateMatch) {
      return {
        type: 'state_condition',
        subject: stateMatch[1],
        state: stateMatch[2].replace(/\s+/g, '_')
      }
    }

    // Comparison condition: time > 18:00, fixture.1.intensity > 128
    const compMatch = conditionStr.match(/^([a-z0-9.]+)\s*([=<>!]+)\s*(.+)/)
    if (compMatch) {
      return {
        type: 'comparison_condition',
        left: compMatch[1],
        operator: compMatch[2],
        right: compMatch[3]
      }
    }

    return { type: 'invalid_condition', raw: conditionStr }
  }

  /**
   * Parse record/update commands
   * Examples: record group 1 exec 1.5, record cue 1, update 3.1
   */
  parseRecordCommand(normalized, raw) {
    const isUpdate = normalized.startsWith('update')

    // record group 1 exec 1.5
    const groupMatch = normalized.match(/^(record|update)\s+group\s+(\d+)\s+executor\s+(\d+)\.(\d+)/)
    if (groupMatch) {
      return {
        type: isUpdate ? 'update_group' : 'record_group',
        groupId: parseInt(groupMatch[2]),
        executorNumber: parseInt(groupMatch[3]),
        position: parseInt(groupMatch[4]),
        raw
      }
    }

    // record cue 1 or update cue 1
    const cueMatch = normalized.match(/^(record|update)\s+cue\s+(\d+)/)
    if (cueMatch) {
      return {
        type: isUpdate ? 'update_cue' : 'record_cue',
        cueNumber: parseInt(cueMatch[2]),
        raw
      }
    }

    // record exec 1 or update exec 1
    const execMatch = normalized.match(/^(record|update)\s+executor\s+(\d+)/)
    if (execMatch) {
      return {
        type: isUpdate ? 'update_executor' : 'record_executor',
        executorNumber: parseInt(execMatch[2]),
        raw
      }
    }

    return { type: 'invalid', raw, error: `Invalid ${isUpdate ? 'update' : 'record'} syntax` }
  }

  /**
   * Get previous command from history
   * @returns {string|null}
   */
  historyUp() {
    if (this.historyIndex > 0) {
      this.historyIndex--
      return this.commandHistory[this.historyIndex]
    }
    return null
  }

  /**
   * Get next command from history
   * @returns {string|null}
   */
  historyDown() {
    if (this.historyIndex < this.commandHistory.length - 1) {
      this.historyIndex++
      return this.commandHistory[this.historyIndex]
    } else if (this.historyIndex === this.commandHistory.length - 1) {
      this.historyIndex = this.commandHistory.length
      return ''
    }
    return null
  }

  /**
   * Get command history
   * @returns {Array<string>}
   */
  getHistory() {
    return [...this.commandHistory]
  }

  /**
   * Clear command history
   */
  clearHistory() {
    this.commandHistory = []
    this.historyIndex = -1
  }

  /**
   * Add a command to history manually
   * @param {string} command - Command to add to history
   */
  addToHistory(command) {
    if (command && this.commandHistory[this.commandHistory.length - 1] !== command) {
      this.commandHistory.push(command)
      if (this.commandHistory.length > 100) {
        this.commandHistory.shift()
      }
    }
    this.historyIndex = this.commandHistory.length
  }
}

export default CLIParser
