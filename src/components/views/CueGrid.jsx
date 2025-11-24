/**
 * Cue Grid Window
 * MA3/Hog-style cue list with grid layout
 * Record cues via CLI: record cue 1, store cue 5, etc.
 */

import React, { useState, useEffect } from 'react'
import '../../styles/views/CueGrid.css'

function CueGrid({ appState }) {
  const [cues, setCues] = useState([])
  const [selectedCue, setSelectedCue] = useState(null)
  const [showConfig, setShowConfig] = useState(false)
  const [editingCue, setEditingCue] = useState(null)

  // Grid configuration: 10 columns × 10 rows = 100 cue slots
  const GRID_COLS = 10
  const GRID_ROWS = 10
  const TOTAL_CUES = GRID_COLS * GRID_ROWS

  // Load cues from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('dmx_cues_grid')
    if (saved) {
      try {
        setCues(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load cues:', e)
      }
    }
  }, [])

  // Save cues to localStorage
  const saveCues = (newCues) => {
    setCues(newCues)
    localStorage.setItem('dmx_cues_grid', JSON.stringify(newCues))
  }

  // Get cue at specific position
  const getCueAt = (position) => {
    return cues.find(c => c.gridPosition === position)
  }

  // Record cue at position (called from CLI or UI)
  const recordCue = (position, name = null) => {
    const { selectedFixtures, encoderValues, faderValues } = appState

    if (!selectedFixtures || selectedFixtures.size === 0) {
      return { success: false, message: 'No fixtures selected' }
    }

    const cueName = name || `Cue ${position + 1}`

    const newCue = {
      id: `cue_${Date.now()}`,
      gridPosition: position,
      name: cueName,
      timestamp: Date.now(),
      selectedFixtures: Array.from(selectedFixtures),
      encoderValues: { ...encoderValues },
      faderValues: faderValues ? [...faderValues] : []
    }

    // Remove existing cue at this position
    const filtered = cues.filter(c => c.gridPosition !== position)
    const updated = [...filtered, newCue]
    saveCues(updated)

    return { success: true, message: `Recorded ${cueName}` }
  }

  // Recall cue
  const recallCue = (cue) => {
    const { setSelectedFixtures, setEncoderValues, setFaderValues, setEncoderValue } = appState

    if (!cue) return

    // Restore fixture selection
    if (setSelectedFixtures) {
      setSelectedFixtures(new Set(cue.selectedFixtures))
    }

    // Restore encoder values
    if (setEncoderValues) {
      setEncoderValues(cue.encoderValues)
    } else if (setEncoderValue) {
      Object.entries(cue.encoderValues).forEach(([key, value]) => {
        setEncoderValue(key, value)
      })
    }

    // Restore fader values
    if (setFaderValues && cue.faderValues) {
      setFaderValues(cue.faderValues)
    }
  }

  // Delete cue
  const deleteCue = (position) => {
    const updated = cues.filter(c => c.gridPosition !== position)
    saveCues(updated)
    setShowConfig(false)
    setEditingCue(null)
  }

  // Handle square click
  const handleSquareClick = (position) => {
    const cue = getCueAt(position)
    if (cue) {
      recallCue(cue)
      setSelectedCue(position)
    }
  }

  // Handle square long-press (record)
  const [longPressTimer, setLongPressTimer] = useState(null)
  const [longPressPosition, setLongPressPosition] = useState(null)

  const handleSquarePointerDown = (position, e) => {
    e.preventDefault()

    const timer = setTimeout(() => {
      setLongPressPosition(position)
      const result = recordCue(position)
      if (result.success) {
        // Visual feedback
        const square = e.currentTarget
        square.style.transform = 'scale(0.95)'
        setTimeout(() => {
          square.style.transform = 'scale(1)'
        }, 100)
      }
    }, 800) // 800ms long press

    setLongPressTimer(timer)
  }

  const handleSquarePointerUp = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
    setLongPressPosition(null)
  }

  // Right-click to configure
  const handleSquareRightClick = (position, e) => {
    e.preventDefault()
    const cue = getCueAt(position)
    if (cue) {
      setEditingCue(cue)
      setShowConfig(true)
    }
  }

  // Expose recordCue to window for CLI access
  useEffect(() => {
    window.recordCueAt = recordCue
    return () => {
      delete window.recordCueAt
    }
  }, [cues, appState])

  // Render grid
  const renderGrid = () => {
    const squares = []
    for (let i = 0; i < TOTAL_CUES; i++) {
      const cue = getCueAt(i)
      const isSelected = selectedCue === i
      const isRecording = longPressPosition === i

      squares.push(
        <div
          key={i}
          className={`cue-square ${cue ? 'filled' : 'empty'} ${isSelected ? 'selected' : ''} ${isRecording ? 'recording' : ''}`}
          onClick={() => handleSquareClick(i)}
          onPointerDown={(e) => handleSquarePointerDown(i, e)}
          onPointerUp={handleSquarePointerUp}
          onPointerLeave={handleSquarePointerUp}
          onContextMenu={(e) => handleSquareRightClick(i, e)}
        >
          {cue ? (
            <div className="cue-content">
              <div className="cue-number">{i + 1}</div>
              <div className="cue-name">{cue.name}</div>
              <div className="cue-info">
                {cue.selectedFixtures.length} fx
              </div>
            </div>
          ) : (
            <div className="cue-empty-hint">
              <div className="cue-number">{i + 1}</div>
              <div className="cue-hint">Long press to record</div>
            </div>
          )}
        </div>
      )
    }
    return squares
  }

  return (
    <div className="cue-grid-container">
      <div className="cue-grid-header">
        <h3>Cue List</h3>
        <div className="cue-grid-info">
          {cues.length} / {TOTAL_CUES} cues
        </div>
      </div>

      <div className="cue-grid" style={{ gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)` }}>
        {renderGrid()}
      </div>

      {showConfig && editingCue && (
        <div className="cue-config-panel">
          <div className="config-header">
            <h4>Cue {editingCue.gridPosition + 1}</h4>
            <button className="close-btn" onClick={() => setShowConfig(false)}>×</button>
          </div>

          <div className="config-body">
            <div className="config-field">
              <label>Name:</label>
              <input
                type="text"
                value={editingCue.name}
                onChange={(e) => setEditingCue({ ...editingCue, name: e.target.value })}
                onBlur={() => {
                  const updated = cues.map(c =>
                    c.id === editingCue.id ? editingCue : c
                  )
                  saveCues(updated)
                }}
              />
            </div>

            <div className="config-field">
              <label>Position:</label>
              <div className="config-value">{editingCue.gridPosition + 1}</div>
            </div>

            <div className="config-field">
              <label>Fixtures:</label>
              <div className="config-value">{editingCue.selectedFixtures.length}</div>
            </div>

            <div className="config-field">
              <label>Recorded:</label>
              <div className="config-value">
                {new Date(editingCue.timestamp).toLocaleString()}
              </div>
            </div>

            <div className="config-actions">
              <button
                className="btn-recall"
                onClick={() => {
                  recallCue(editingCue)
                  setShowConfig(false)
                }}
              >
                Recall
              </button>
              <button
                className="btn-update"
                onClick={() => {
                  recordCue(editingCue.gridPosition, editingCue.name)
                  setShowConfig(false)
                }}
              >
                Update
              </button>
              <button
                className="btn-delete"
                onClick={() => deleteCue(editingCue.gridPosition)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="cue-grid-footer">
        <span>💡 Click to recall • Long press to record • Right-click to edit</span>
      </div>
    </div>
  )
}

export default CueGrid
