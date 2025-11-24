/**
 * CLI Command Dispatcher
 * Routes parsed commands to appropriate handlers
 */

export class CLIDispatcher {
  constructor(appState, appActions) {
    this.appState = appState
    this.appActions = appActions
  }

  /**
   * Execute a parsed command
   * @param {Object} command - Parsed command from CLIParser
   * @returns {Object} Result object with success status and message
   */
  execute(command) {
    if (!command) {
      return { success: false, message: 'No command provided' }
    }

    try {
      switch (command.type) {
        case 'clear':
          return this.handleClear()

        case 'blackout':
          return this.handleBlackout()

        case 'locate':
          return this.handleLocate()

        case 'help':
          return this.handleHelp()

        case 'feature_set':
          return this.handleFeatureSet(command)

        case 'select_fixture':
          return this.handleSelectFixture(command)

        case 'select_multiple':
          return this.handleSelectMultiple(command)

        case 'set_value':
          return this.handleSetValue(command)

        case 'set_channel':
          return this.handleSetChannel(command)

        case 'record':
          return this.handleRecord(command)

        case 'recall':
          return this.handleRecall(command)

        case 'recall_dot':
          return this.handleRecallDot(command)

        case 'record_dot':
          return this.handleRecordDot(command)

        case 'record_contextual':
          return this.handleRecordContextual(command)

        case 'update':
          return this.handleUpdate(command)

        case 'update_dot':
          return this.handleUpdateDot(command)

        case 'group_preset':
          return this.handleGroupPreset(command)

        case 'go':
          return this.handleGo(command)

        case 'time':
          return this.handleTime(command)

        case 'fan':
          return this.handleFan(command)

        case 'encoder':
          return this.handleEncoder(command)

        case 'highlight':
          return this.handleHighlight(command)

        case 'window_route':
          return this.handleWindowRoute(command)

        case 'window_open':
          return this.handleWindowOpen(command)

        case 'window_close':
          return this.handleWindowClose(command)

        case 'video_play':
          return this.handleVideoPlay(command)

        case 'video_pause':
          return this.handleVideoPause(command)

        case 'video_stop':
          return this.handleVideoStop(command)

        case 'video_restart':
          return this.handleVideoRestart(command)

        case 'video_loop':
          return this.handleVideoLoop(command)

        case 'video_speed':
          return this.handleVideoSpeed(command)

        case 'unknown':
          return { success: false, message: `Unknown command: ${command.raw}` }

        case 'invalid':
          return { success: false, message: command.error || 'Invalid command' }

        default:
          return { success: false, message: `Unhandled command type: ${command.type}` }
      }
    } catch (error) {
      console.error('CLI command execution error:', error)
      return { success: false, message: `Error: ${error.message}` }
    }
  }

  // Command Handlers

  handleClear() {
    const { handleClear } = this.appActions
    if (handleClear) {
      handleClear()
      return { success: true, message: 'Programmer cleared' }
    }
    return { success: false, message: 'Clear action not available' }
  }

  handleBlackout() {
    const { handleBlackout } = this.appActions
    if (handleBlackout) {
      handleBlackout()
      return { success: true, message: 'Blackout triggered' }
    }
    return { success: false, message: 'Blackout action not available' }
  }

  handleLocate() {
    const { handleLocate } = this.appActions
    if (handleLocate) {
      handleLocate()
      return { success: true, message: 'Locate activated' }
    }
    return { success: false, message: 'Locate action not available' }
  }

  handleHelp() {
    const helpText = `
CLI Commands:
- fixture [N] | [N] thru [M] - Select fixtures
- [N]+[M]+... - Select multiple fixtures
- at [value] - Set intensity (0-255)
- [channel] at [value] - Set channel value
- [channel] [value] - Set channel value (shorthand)
- clear | c - Clear programmer
- blackout | bo - Trigger blackout
- locate | loc - Locate selected fixtures
- time [seconds] - Set fade time (e.g., time 5, time 0 for snap)
- fan [mode] [axis] - Set fan mode and axis (default: center x)
  Modes: center, left, right, outside | Axes: x (default), y
- encoder [N] [value] | enc [N] [value] - Set encoder value (1-12, -255 to 255)
- highlight | hi - Toggle highlight mode
- highlight on/off - Explicitly set highlight mode

Feature Sets (1-8):
1=intensity, 2=position, 3=color, 4=focus, 5=gobo, 6=beam, 7=videosource, 8=videooutput
- [featureset] - Switch feature set (e.g., color, videosource)
- [N].[P] - Recall preset (e.g., 1.5 = intensity preset 5, 3.1 = color preset 1)
- record [N].[P] - Record preset (e.g., record 3.5 for color preset 5)
- record [featureset] [N] - Record preset (e.g., record color 1)
- group [G] preset [N].[P] - Apply preset to group (e.g., group 1 preset 3.5)

Legacy Commands:
- [featureset] [N] - Recall preset (e.g., color 1)

Cues & Recording:
- record - Contextual record (cue or preset based on state)
- record cue [N] - Record specific cue
- update cue [N] - Update cue with programmer changes only
- update [N].[P] - Update preset with programmer changes only
- cue [N] | go - Recall cue

Windows:
- window [N] | open [N] - Open window
- close [N] - Close window

Video Control:
- play video[N] output[N] - Play video to output
- pause/stop/restart video[N] - Control video playback

Help:
- help - Show this help
    `.trim()

    console.log(helpText)
    return { success: true, message: 'Help displayed in console' }
  }

  handleFeatureSet(command) {
    const { setActiveFeatureSet } = this.appActions
    if (setActiveFeatureSet) {
      setActiveFeatureSet(command.feature)
      return { success: true, message: `Switched to ${command.feature} feature set` }
    }
    return { success: false, message: 'Feature set switching not available' }
  }

  handleSelectFixture(command) {
    const { fixtures = [], setSelectedFixtures } = this.appActions
    const { start, end } = command

    if (!fixtures || fixtures.length === 0) {
      return { success: false, message: 'No fixtures available' }
    }

    // Find fixtures by ID (assuming IDs might be like "fx1", "fx2", etc., or just "1", "2")
    const getFixtureById = (num) => {
      return fixtures.find(f =>
        f.id === num.toString() ||
        f.id === `fx${num}` ||
        f.id === `fixture${num}` ||
        f.id.endsWith(num.toString())
      )
    }

    let selected = new Set()

    if (end !== null) {
      // Range selection
      for (let i = start; i <= end; i++) {
        const fixture = getFixtureById(i)
        if (fixture) {
          selected.add(fixture.id)
        }
      }
      if (selected.size === 0) {
        return { success: false, message: `No fixtures found in range ${start}-${end}` }
      }
      setSelectedFixtures(selected)
      return { success: true, message: `Selected ${selected.size} fixtures (${start} thru ${end})` }
    } else {
      // Single fixture
      const fixture = getFixtureById(start)
      if (!fixture) {
        return { success: false, message: `Fixture ${start} not found` }
      }
      selected.add(fixture.id)
      setSelectedFixtures(selected)
      return { success: true, message: `Selected fixture ${fixture.name}` }
    }
  }

  handleSelectMultiple(command) {
    const { fixtures = [], setSelectedFixtures } = this.appActions
    const { fixtures: fixtureNumbers } = command

    if (!fixtures || fixtures.length === 0) {
      return { success: false, message: 'No fixtures available' }
    }

    const getFixtureById = (num) => {
      return fixtures.find(f =>
        f.id === num.toString() ||
        f.id === `fx${num}` ||
        f.id === `fixture${num}` ||
        f.id.endsWith(num.toString())
      )
    }

    const selected = new Set()
    fixtureNumbers.forEach(num => {
      const fixture = getFixtureById(num)
      if (fixture) {
        selected.add(fixture.id)
      }
    })

    if (selected.size === 0) {
      return { success: false, message: 'No matching fixtures found' }
    }

    setSelectedFixtures(selected)
    return { success: true, message: `Selected ${selected.size} fixtures` }
  }

  handleSetValue(command) {
    const { selectedFixtures = new Set(), setEncoderValue, availableChannels = [] } = this.appActions
    const { target, value } = command

    if (selectedFixtures.size === 0) {
      return { success: false, message: 'No fixtures selected' }
    }

    // Clamp value to 0-255
    const clampedValue = Math.max(0, Math.min(255, value))

    // If target is a number, treat as intensity
    if (!isNaN(target) || target === 'intensity') {
      // Find intensity/dimmer channel
      const intensityChannel = availableChannels.find(ch =>
        ch.name.toLowerCase().includes('dimmer') ||
        ch.name.toLowerCase().includes('intensity')
      )

      if (intensityChannel) {
        const channelKey = intensityChannel.name.toLowerCase().replace(/\s+/g, '_')
        setEncoderValue(channelKey, clampedValue)
        return { success: true, message: `Set ${intensityChannel.name} to ${clampedValue}` }
      }

      return { success: false, message: 'No intensity channel found' }
    }

    // Otherwise, find the channel by name
    return this.handleSetChannel({ channel: target, value: clampedValue })
  }

  handleSetChannel(command) {
    const { selectedFixtures = new Set(), setEncoderValue, availableChannels = [] } = this.appActions
    const { channel, value } = command

    if (selectedFixtures.size === 0) {
      return { success: false, message: 'No fixtures selected' }
    }

    // Clamp value to 0-255
    const clampedValue = Math.max(0, Math.min(255, value))

    // Find channel by name (case-insensitive partial match)
    const targetChannel = availableChannels.find(ch =>
      ch.name.toLowerCase().includes(channel.toLowerCase()) ||
      ch.name.toLowerCase().replace(/\s+/g, '_').includes(channel.toLowerCase())
    )

    if (!targetChannel) {
      return { success: false, message: `Channel "${channel}" not found` }
    }

    const channelKey = targetChannel.name.toLowerCase().replace(/\s+/g, '_')
    setEncoderValue(channelKey, clampedValue)
    return { success: true, message: `Set ${targetChannel.name} to ${clampedValue}` }
  }

  handleRecord(command) {
    const { handleRecordCue, recordPreset, activeFeatureSet, setActiveFeatureSet } = this.appActions
    const { objectType, id, name } = command

    // Handle cue recording
    if (objectType === 'cue') {
      if (handleRecordCue) {
        handleRecordCue()
        return { success: true, message: `Recording cue ${id}${name ? ` "${name}"` : ''}` }
      }
      return { success: false, message: 'Record cue action not available' }
    }

    // Handle preset recording (color, position, focus, intensity, gobo, videosource, videooutput)
    const featureSets = ['color', 'position', 'focus', 'intensity', 'gobo', 'videosource', 'videooutput']
    if (featureSets.includes(objectType)) {
      // Switch to the feature set if not already active
      if (setActiveFeatureSet && activeFeatureSet !== objectType) {
        setActiveFeatureSet(objectType)
      }

      if (recordPreset) {
        // Adjust for 0-indexed array (user enters 1-12, we use 0-11)
        const index = id - 1
        recordPreset(objectType, index, name)
        return { success: true, message: `Recording ${objectType} preset ${id}${name ? ` "${name}"` : ''}` }
      }

      return { success: false, message: 'Record preset action not available' }
    }

    return { success: false, message: `Recording ${objectType} not yet implemented` }
  }

  handleRecall(command) {
    const { recordedCues = [], handleRecallCue, recallPreset, activeFeatureSet, setActiveFeatureSet } = this.appActions
    const { objectType, id } = command

    // Handle cue recall
    if (objectType === 'cue') {
      const cue = recordedCues.find((c, idx) => idx + 1 === id || c.name === `Cue ${id}`)
      if (!cue) {
        return { success: false, message: `Cue ${id} not found` }
      }
      if (handleRecallCue) {
        handleRecallCue(cue)
        return { success: true, message: `Recalled ${cue.name}` }
      }
      return { success: false, message: 'Recall cue action not available' }
    }

    // Handle preset recall (color, position, focus, intensity, gobo, videosource, videooutput)
    const featureSets = ['color', 'position', 'focus', 'intensity', 'gobo', 'videosource', 'videooutput']
    if (featureSets.includes(objectType)) {
      // Switch to the feature set if not already active
      if (setActiveFeatureSet && activeFeatureSet !== objectType) {
        setActiveFeatureSet(objectType)
      }

      if (recallPreset) {
        // Adjust for 0-indexed array (user enters 1-12, we use 0-11)
        const index = id - 1
        const success = recallPreset(objectType, index)
        if (success) {
          return { success: true, message: `Recalled ${objectType} preset ${id}` }
        } else {
          return { success: false, message: `${objectType} preset ${id} is empty` }
        }
      }

      return { success: false, message: 'Recall preset action not available' }
    }

    return { success: false, message: `Recalling ${objectType} not yet implemented` }
  }

  handleRecallDot(command) {
    const { recallPreset, activeFeatureSet, setActiveFeatureSet } = this.appActions
    const { featureSet, featureSetName, presetId } = command

    if (!featureSetName) {
      return { success: false, message: `Invalid feature set number: ${featureSet}` }
    }

    // Switch to the feature set if not already active
    if (setActiveFeatureSet && activeFeatureSet !== featureSetName) {
      setActiveFeatureSet(featureSetName)
    }

    if (recallPreset) {
      // Adjust for 0-indexed array (user enters 1-12, we use 0-11)
      const index = presetId - 1
      const success = recallPreset(featureSetName, index)
      if (success) {
        return { success: true, message: `Recalled ${featureSetName} preset ${presetId} (${featureSet}.${presetId})` }
      } else {
        return { success: false, message: `${featureSetName} preset ${presetId} is empty` }
      }
    }

    return { success: false, message: 'Recall preset action not available' }
  }

  handleRecordDot(command) {
    const { recordPreset, activeFeatureSet, setActiveFeatureSet } = this.appActions
    const { featureSet, featureSetName, presetId, name } = command

    if (!featureSetName) {
      return { success: false, message: `Invalid feature set number: ${featureSet}` }
    }

    // Switch to the feature set if not already active
    if (setActiveFeatureSet && activeFeatureSet !== featureSetName) {
      setActiveFeatureSet(featureSetName)
    }

    if (recordPreset) {
      // Adjust for 0-indexed array (user enters 1-12, we use 0-11)
      const index = presetId - 1
      recordPreset(featureSetName, index, name)
      return { success: true, message: `Recording ${featureSetName} preset ${presetId} (${featureSet}.${presetId})${name ? ` "${name}"` : ''}` }
    }

    return { success: false, message: 'Record preset action not available' }
  }

  handleRecordContextual(command) {
    const { handleRecordCue, recordPreset, activeFeatureSet, selectedFixtures = new Set(), recordMode } = this.appActions
    const { name } = command

    // Determine what to record based on context
    // Priority: 1) Active feature set with fixtures selected -> preset
    //           2) Record mode active -> cue
    //           3) Fixtures selected but no feature set -> cue

    if (activeFeatureSet && selectedFixtures.size > 0) {
      // Record preset in active feature set
      const featureSets = ['color', 'position', 'focus', 'intensity', 'gobo', 'beam', 'videosource', 'videooutput']
      if (featureSets.includes(activeFeatureSet)) {
        if (recordPreset) {
          // Find next available preset slot or use slot 1
          // For now, we'll prompt user to specify which preset slot
          return {
            success: false,
            message: `To record ${activeFeatureSet} preset, use: record [N].[P] or record ${activeFeatureSet} [N]`
          }
        }
      }
    }

    // Default to recording a cue
    if (handleRecordCue) {
      handleRecordCue(name)
      return { success: true, message: `Recording cue${name ? ` "${name}"` : ''}` }
    }

    return { success: false, message: 'No context available for recording. Specify: record cue [N], record [featureset] [N], or record [N].[P]' }
  }

  handleUpdate(command) {
    const { handleUpdateCue, updatePreset, activeFeatureSet, setActiveFeatureSet } = this.appActions
    const { objectType, id } = command

    // Handle cue updating
    if (objectType === 'cue') {
      if (handleUpdateCue) {
        handleUpdateCue(id)
        return { success: true, message: `Updating cue ${id} with programmer changes` }
      }
      return { success: false, message: 'Update cue action not available' }
    }

    // Handle preset updating (intensity, position, color, focus, gobo, videosource, videooutput)
    const featureSets = ['intensity', 'position', 'color', 'focus', 'gobo', 'beam', 'videosource', 'videooutput']
    if (featureSets.includes(objectType)) {
      // Switch to the feature set if not already active
      if (setActiveFeatureSet && activeFeatureSet !== objectType) {
        setActiveFeatureSet(objectType)
      }

      if (updatePreset) {
        // Adjust for 0-indexed array (user enters 1-12, we use 0-11)
        const index = id - 1
        updatePreset(objectType, index)
        return { success: true, message: `Updating ${objectType} preset ${id} with programmer changes` }
      }

      return { success: false, message: 'Update preset action not available' }
    }

    return { success: false, message: `Updating ${objectType} not yet implemented` }
  }

  handleUpdateDot(command) {
    const { updatePreset, activeFeatureSet, setActiveFeatureSet } = this.appActions
    const { featureSet, featureSetName, presetId } = command

    if (!featureSetName) {
      return { success: false, message: `Invalid feature set number: ${featureSet}` }
    }

    // Switch to the feature set if not already active
    if (setActiveFeatureSet && activeFeatureSet !== featureSetName) {
      setActiveFeatureSet(featureSetName)
    }

    if (updatePreset) {
      // Adjust for 0-indexed array (user enters 1-12, we use 0-11)
      const index = presetId - 1
      updatePreset(featureSetName, index)
      return { success: true, message: `Updating ${featureSetName} preset ${presetId} (${featureSet}.${presetId}) with programmer changes` }
    }

    return { success: false, message: 'Update preset action not available' }
  }

  handleGroupPreset(command) {
    const { recallPreset, groups = [], setActiveFeatureSet } = this.appActions
    const { groupId, featureSet, featureSetName, presetId } = command

    if (!featureSetName) {
      return { success: false, message: `Invalid feature set number: ${featureSet}` }
    }

    // Verify group exists
    const group = groups.find(g => g.id === groupId || g.id === `group${groupId}`)
    if (!group) {
      return { success: false, message: `Group ${groupId} not found` }
    }

    // Switch to the feature set
    if (setActiveFeatureSet) {
      setActiveFeatureSet(featureSetName)
    }

    if (recallPreset) {
      // Adjust for 0-indexed array (user enters 1-12, we use 0-11)
      const index = presetId - 1
      const success = recallPreset(featureSetName, index)
      if (success) {
        return { success: true, message: `Applied ${featureSetName} preset ${presetId} to group ${groupId}` }
      } else {
        return { success: false, message: `${featureSetName} preset ${presetId} is empty` }
      }
    }

    return { success: false, message: 'Group preset action not available' }
  }

  handleGo() {
    // Go to next cue (future implementation)
    return { success: false, message: 'Go command not yet implemented' }
  }

  handleTime(command) {
    const { setFadeTime } = this.appActions
    const { seconds } = command

    // Validate time range (0 to 3600 seconds / 1 hour)
    if (seconds < 0 || seconds > 3600) {
      return { success: false, message: 'Time must be between 0 and 3600 seconds' }
    }

    if (setFadeTime) {
      setFadeTime(seconds)

      // Format message based on time value
      let message
      if (seconds === 0) {
        message = 'Fade time set to SNAP (0s)'
      } else if (seconds < 1) {
        message = `Fade time set to ${(seconds * 1000).toFixed(0)}ms`
      } else if (seconds >= 60) {
        const minutes = Math.floor(seconds / 60)
        const secs = seconds % 60
        message = `Fade time set to ${minutes}m ${secs.toFixed(1)}s`
      } else {
        message = `Fade time set to ${seconds.toFixed(1)}s`
      }

      return { success: true, message }
    }

    return { success: false, message: 'Fade time control not available' }
  }

  handleFan(command) {
    const { setFanMode, setFanAxis } = this.appActions
    const { mode, axis } = command

    // Validate mode
    const validModes = ['center', 'left', 'right', 'outside']
    if (!validModes.includes(mode)) {
      return { success: false, message: `Invalid fan mode: ${mode}. Use: center, left, right, or outside` }
    }

    // Validate axis
    const validAxes = ['x', 'y']
    if (!validAxes.includes(axis)) {
      return { success: false, message: `Invalid fan axis: ${axis}. Use: x or y` }
    }

    if (setFanMode && setFanAxis) {
      setFanMode(mode)
      setFanAxis(axis)

      // Mode descriptions
      const modeDescriptions = {
        center: 'values spread outward from center',
        left: 'values increase from left to right',
        right: 'values increase from right to left',
        outside: 'values decrease toward center'
      }

      // Axis descriptions
      const axisDescriptions = {
        x: 'horizontal (left-right)',
        y: 'vertical (top-bottom)'
      }

      return {
        success: true,
        message: `Fan: ${mode.toUpperCase()} on ${axis.toUpperCase()} axis (${axisDescriptions[axis]}) - ${modeDescriptions[mode]}`
      }
    }

    return { success: false, message: 'Fan mode control not available' }
  }

  handleEncoder(command) {
    const { setEncoderValue, activeFeatureSet, selectedFixtures = new Set() } = this.appActions
    const { encoderId, value } = command

    // Validate encoder ID (1-12 typically)
    if (encoderId < 1 || encoderId > 12) {
      return { success: false, message: 'Encoder ID must be between 1 and 12' }
    }

    // Check if fixtures are selected
    if (selectedFixtures.size === 0) {
      return { success: false, message: 'No fixtures selected. Select fixtures first.' }
    }

    if (setEncoderValue) {
      // Clamp value to -255 to 255 range (allowing negative for relative adjustments)
      const clampedValue = Math.max(-255, Math.min(255, value))

      setEncoderValue(encoderId, clampedValue)

      return {
        success: true,
        message: `Encoder ${encoderId} set to ${clampedValue}${activeFeatureSet ? ` (${activeFeatureSet} mode)` : ''}`
      }
    }

    return { success: false, message: 'Encoder control not available' }
  }

  handleHighlight(command) {
    const { toggleHighlight, setHighlight, highlightActive = false } = this.appActions
    const { state } = command

    if (state === 'toggle') {
      // Toggle highlight on/off
      if (toggleHighlight) {
        toggleHighlight()
        const newState = !highlightActive
        return {
          success: true,
          message: `Highlight ${newState ? 'ON' : 'OFF'}`
        }
      }
    } else {
      // Explicit on/off
      const enabled = state === 'on'
      if (setHighlight) {
        setHighlight(enabled)
        return {
          success: true,
          message: `Highlight ${enabled ? 'ON' : 'OFF'}`
        }
      }
    }

    return { success: false, message: 'Highlight control not available' }
  }

  handleWindowRoute(command) {
    // Window routing (future implementation for multi-window control)
    const { sourceWindow, sourceObject, targetWindow, targetObject } = command
    return {
      success: false,
      message: `Window routing ${sourceWindow}/${sourceObject || '*'} → ${targetWindow}/${targetObject || '*'} not yet implemented`
    }
  }

  handleWindowOpen(command) {
    const { openWindow } = this.appActions
    const { windowId } = command

    if (!openWindow) {
      return { success: false, message: 'Window open action not available' }
    }

    const result = openWindow(windowId)
    if (result.success) {
      return { success: true, message: `Opened ${result.windowName || `window ${windowId}`}` }
    } else {
      return { success: false, message: result.message || `Could not open window ${windowId}` }
    }
  }

  handleWindowClose(command) {
    const { closeWindow } = this.appActions
    const { windowId } = command

    if (!closeWindow) {
      return { success: false, message: 'Window close action not available' }
    }

    const result = closeWindow(windowId)
    if (result.success) {
      return { success: true, message: `Closed ${result.windowName || `window ${windowId}`}` }
    } else {
      return { success: false, message: result.message || `Could not close window ${windowId}` }
    }
  }

  // Video Control Handlers

  handleVideoPlay(command) {
    const { videoPlay } = this.appActions
    const { videoInput, videoOutput } = command

    if (!videoPlay) {
      return { success: false, message: 'Video playback control not available' }
    }

    const result = videoPlay(videoInput, videoOutput)
    if (result && result.success) {
      return { success: true, message: `Playing ${videoInput} to ${videoOutput}` }
    } else {
      return { success: false, message: result?.message || `Could not play ${videoInput} to ${videoOutput}` }
    }
  }

  handleVideoPause(command) {
    const { videoPause } = this.appActions
    const { videoInput } = command

    if (!videoPause) {
      return { success: false, message: 'Video pause control not available' }
    }

    const result = videoPause(videoInput)
    if (result && result.success) {
      return { success: true, message: `Paused ${videoInput}` }
    } else {
      return { success: false, message: result?.message || `Could not pause ${videoInput}` }
    }
  }

  handleVideoStop(command) {
    const { videoStop } = this.appActions
    const { videoInput } = command

    if (!videoStop) {
      return { success: false, message: 'Video stop control not available' }
    }

    const result = videoStop(videoInput)
    if (result && result.success) {
      return { success: true, message: `Stopped ${videoInput}` }
    } else {
      return { success: false, message: result?.message || `Could not stop ${videoInput}` }
    }
  }

  handleVideoRestart(command) {
    const { videoRestart } = this.appActions
    const { videoInput } = command

    if (!videoRestart) {
      return { success: false, message: 'Video restart control not available' }
    }

    const result = videoRestart(videoInput)
    if (result && result.success) {
      return { success: true, message: `Restarted ${videoInput}` }
    } else {
      return { success: false, message: result?.message || `Could not restart ${videoInput}` }
    }
  }

  handleVideoLoop(command) {
    const { videoLoop } = this.appActions
    const { videoInput, enabled } = command

    if (!videoLoop) {
      return { success: false, message: 'Video loop control not available' }
    }

    const result = videoLoop(videoInput, enabled)
    if (result && result.success) {
      return { success: true, message: `Loop ${enabled ? 'enabled' : 'disabled'} for ${videoInput}` }
    } else {
      return { success: false, message: result?.message || `Could not set loop for ${videoInput}` }
    }
  }

  handleVideoSpeed(command) {
    const { videoSpeed } = this.appActions
    const { videoInput, speed } = command

    if (!videoSpeed) {
      return { success: false, message: 'Video speed control not available' }
    }

    // Clamp speed to reasonable range
    const clampedSpeed = Math.max(0.1, Math.min(10, speed))

    const result = videoSpeed(videoInput, clampedSpeed)
    if (result && result.success) {
      return { success: true, message: `Set ${videoInput} speed to ${clampedSpeed}x` }
    } else {
      return { success: false, message: result?.message || `Could not set speed for ${videoInput}` }
    }
  }
}

export default CLIDispatcher
