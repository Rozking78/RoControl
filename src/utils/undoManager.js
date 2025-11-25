/**
 * Undo/Redo Manager
 * Manages state history for undoable actions in RoControl
 */

export class UndoManager {
  constructor(maxHistorySize = 50) {
    this.history = [] // Stack of state snapshots
    this.currentIndex = -1 // Current position in history
    this.maxHistorySize = maxHistorySize
  }

  /**
   * Push a new state snapshot to the history
   * @param {Object} snapshot - State snapshot with action description
   */
  pushState(snapshot) {
    // Remove any "future" states if we've undone
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1)
    }

    // Add new snapshot
    this.history.push({
      ...snapshot,
      timestamp: Date.now()
    })

    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift()
    } else {
      this.currentIndex++
    }
  }

  /**
   * Undo last action
   * @returns {Object|null} Previous state snapshot or null if nothing to undo
   */
  undo() {
    if (this.currentIndex > 0) {
      this.currentIndex--
      return this.history[this.currentIndex]
    }
    return null
  }

  /**
   * Redo last undone action
   * @returns {Object|null} Next state snapshot or null if nothing to redo
   */
  redo() {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++
      return this.history[this.currentIndex]
    }
    return null
  }

  /**
   * Check if undo is available
   * @returns {boolean}
   */
  canUndo() {
    return this.currentIndex > 0
  }

  /**
   * Check if redo is available
   * @returns {boolean}
   */
  canRedo() {
    return this.currentIndex < this.history.length - 1
  }

  /**
   * Get current state info
   * @returns {Object}
   */
  getCurrentState() {
    if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
      return this.history[this.currentIndex]
    }
    return null
  }

  /**
   * Get description of last undoable action
   * @returns {string|null}
   */
  getUndoDescription() {
    if (this.canUndo()) {
      const prevState = this.history[this.currentIndex - 1]
      return prevState?.description || 'Unknown action'
    }
    return null
  }

  /**
   * Get description of next redoable action
   * @returns {string|null}
   */
  getRedoDescription() {
    if (this.canRedo()) {
      const nextState = this.history[this.currentIndex + 1]
      return nextState?.description || 'Unknown action'
    }
    return null
  }

  /**
   * Clear all history
   */
  clear() {
    this.history = []
    this.currentIndex = -1
  }

  /**
   * Get history size
   * @returns {number}
   */
  size() {
    return this.history.length
  }
}

/**
 * Create a state snapshot for common RoControl actions
 */
export function createSnapshot(description, state) {
  return {
    description,
    selectedFixtures: new Set(state.selectedFixtures),
    encoderValues: { ...state.encoderValues },
    activeFeatureSet: state.activeFeatureSet,
    recordedCues: state.recordedCues ? [...state.recordedCues] : [],
    isBlackout: state.isBlackout,
    programTime: state.programTime,
    masterFaderValue: state.masterFaderValue,
    highlightActive: state.highlightActive || false,
    // Add other relevant state as needed
  }
}

/**
 * Apply a state snapshot to restore previous state
 * @param {Object} snapshot - State snapshot to apply
 * @param {Object} setters - Object containing state setter functions
 */
export function applySnapshot(snapshot, setters) {
  const {
    setSelectedFixtures,
    setEncoderValues,
    setActiveFeatureSet,
    setRecordedCues,
    setIsBlackout,
    setProgramTime,
    setMasterFaderValue,
    setHighlightActive
  } = setters

  if (snapshot.selectedFixtures && setSelectedFixtures) {
    setSelectedFixtures(new Set(snapshot.selectedFixtures))
  }

  if (snapshot.encoderValues && setEncoderValues) {
    setEncoderValues({ ...snapshot.encoderValues })
  }

  if (snapshot.activeFeatureSet && setActiveFeatureSet) {
    setActiveFeatureSet(snapshot.activeFeatureSet)
  }

  if (snapshot.recordedCues && setRecordedCues) {
    setRecordedCues([...snapshot.recordedCues])
  }

  if (snapshot.isBlackout !== undefined && setIsBlackout) {
    setIsBlackout(snapshot.isBlackout)
  }

  if (snapshot.programTime !== undefined && setProgramTime) {
    setProgramTime(snapshot.programTime)
  }

  if (snapshot.masterFaderValue !== undefined && setMasterFaderValue) {
    setMasterFaderValue(snapshot.masterFaderValue)
  }

  if (snapshot.highlightActive !== undefined && setHighlightActive) {
    setHighlightActive(snapshot.highlightActive)
  }
}

export default UndoManager
