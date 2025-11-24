/**
 * Group Grid Window
 * MA3/Hog-style group management with grid layout
 * Record groups via CLI: record group 1, store group 5, etc.
 * Groups store fixture selections for quick recall
 */

import React, { useState, useEffect } from 'react'
import '../../styles/views/GroupGrid.css'

function GroupGrid({ appState }) {
  const [groups, setGroups] = useState([])
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [showConfig, setShowConfig] = useState(false)
  const [editingGroup, setEditingGroup] = useState(null)

  // Grid configuration: 10 columns × 6 rows = 60 group slots
  const GRID_COLS = 10
  const GRID_ROWS = 6
  const TOTAL_GROUPS = GRID_COLS * GRID_ROWS

  // Load groups from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('dmx_groups_grid')
    if (saved) {
      try {
        setGroups(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load groups:', e)
      }
    }
  }, [])

  // Save groups to localStorage
  const saveGroups = (newGroups) => {
    setGroups(newGroups)
    localStorage.setItem('dmx_groups_grid', JSON.stringify(newGroups))
  }

  // Get group at specific position
  const getGroupAt = (position) => {
    return groups.find(g => g.gridPosition === position)
  }

  // Record group at position (called from CLI or UI)
  const recordGroup = (position, name = null) => {
    const { selectedFixtures, fixtures } = appState

    if (!selectedFixtures || selectedFixtures.size === 0) {
      return { success: false, message: 'No fixtures selected' }
    }

    const groupName = name || `Group ${position + 1}`

    // Get fixture details for display
    const fixtureDetails = []
    if (fixtures) {
      selectedFixtures.forEach(fixtureId => {
        const fixture = fixtures.find(f => f.id === fixtureId)
        if (fixture) {
          fixtureDetails.push({
            id: fixture.id,
            name: fixture.name,
            type: fixture.fixture_type
          })
        }
      })
    }

    const newGroup = {
      id: `group_${Date.now()}`,
      gridPosition: position,
      name: groupName,
      timestamp: Date.now(),
      selectedFixtures: Array.from(selectedFixtures),
      fixtureDetails: fixtureDetails,
      color: getRandomColor() // Visual color indicator
    }

    // Remove existing group at this position
    const filtered = groups.filter(g => g.gridPosition !== position)
    const updated = [...filtered, newGroup]
    saveGroups(updated)

    return { success: true, message: `Recorded ${groupName}` }
  }

  // Get random color for group visual indicator
  const getRandomColor = () => {
    const colors = [
      '#4a9eff', // Blue
      '#00ff88', // Green
      '#ff4a9e', // Pink
      '#ffa500', // Orange
      '#ff4444', // Red
      '#44ffff', // Cyan
      '#ff88ff', // Magenta
      '#ffff44', // Yellow
      '#9944ff', // Purple
      '#44ff44'  // Lime
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  // Recall group (select fixtures in group)
  const recallGroup = (group) => {
    const { setSelectedFixtures } = appState

    if (!group) return

    // Restore fixture selection
    if (setSelectedFixtures) {
      setSelectedFixtures(new Set(group.selectedFixtures))
    }
  }

  // Delete group
  const deleteGroup = (position) => {
    const updated = groups.filter(g => g.gridPosition !== position)
    saveGroups(updated)
    setShowConfig(false)
    setEditingGroup(null)
  }

  // Handle square click
  const handleSquareClick = (position) => {
    const group = getGroupAt(position)
    if (group) {
      recallGroup(group)
      setSelectedGroup(position)
    }
  }

  // Handle square long-press (record)
  const [longPressTimer, setLongPressTimer] = useState(null)
  const [longPressPosition, setLongPressPosition] = useState(null)

  const handleSquarePointerDown = (position, e) => {
    e.preventDefault()

    const timer = setTimeout(() => {
      setLongPressPosition(position)
      const result = recordGroup(position)
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
    const group = getGroupAt(position)
    if (group) {
      setEditingGroup(group)
      setShowConfig(true)
    }
  }

  // Expose recordGroup to window for CLI access
  useEffect(() => {
    window.recordGroupAt = recordGroup
    return () => {
      delete window.recordGroupAt
    }
  }, [groups, appState])

  // Render grid
  const renderGrid = () => {
    const squares = []
    for (let i = 0; i < TOTAL_GROUPS; i++) {
      const group = getGroupAt(i)
      const isSelected = selectedGroup === i
      const isRecording = longPressPosition === i

      squares.push(
        <div
          key={i}
          className={`group-square ${group ? 'filled' : 'empty'} ${isSelected ? 'selected' : ''} ${isRecording ? 'recording' : ''}`}
          style={group ? {
            borderColor: group.color,
            background: `linear-gradient(135deg, ${group.color}22, #1a1a1a)`
          } : {}}
          onClick={() => handleSquareClick(i)}
          onPointerDown={(e) => handleSquarePointerDown(i, e)}
          onPointerUp={handleSquarePointerUp}
          onPointerLeave={handleSquarePointerUp}
          onContextMenu={(e) => handleSquareRightClick(i, e)}
        >
          {group ? (
            <div className="group-content">
              <div className="group-icon" style={{ color: group.color }}>👥</div>
              <div className="group-number">{i + 1}</div>
              <div className="group-name">{group.name}</div>
              <div className="group-info">
                {group.selectedFixtures.length} fixtures
              </div>
            </div>
          ) : (
            <div className="group-empty-hint">
              <div className="group-number">{i + 1}</div>
              <div className="group-hint">Long press to record</div>
            </div>
          )}
        </div>
      )
    }
    return squares
  }

  return (
    <div className="group-grid-container">
      <div className="group-grid-header">
        <h3>Groups</h3>
        <div className="group-grid-info">
          {groups.length} / {TOTAL_GROUPS} groups
        </div>
      </div>

      <div className="group-grid" style={{ gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)` }}>
        {renderGrid()}
      </div>

      {showConfig && editingGroup && (
        <div className="group-config-panel">
          <div className="config-header">
            <h4>Group {editingGroup.gridPosition + 1}</h4>
            <button className="close-btn" onClick={() => setShowConfig(false)}>×</button>
          </div>

          <div className="config-body">
            <div className="config-field">
              <label>Name:</label>
              <input
                type="text"
                value={editingGroup.name}
                onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })}
                onBlur={() => {
                  const updated = groups.map(g =>
                    g.id === editingGroup.id ? editingGroup : g
                  )
                  saveGroups(updated)
                }}
              />
            </div>

            <div className="config-field">
              <label>Position:</label>
              <div className="config-value">{editingGroup.gridPosition + 1}</div>
            </div>

            <div className="config-field">
              <label>Color:</label>
              <input
                type="color"
                value={editingGroup.color}
                onChange={(e) => {
                  const updated = groups.map(g =>
                    g.id === editingGroup.id ? { ...g, color: e.target.value } : g
                  )
                  saveGroups(updated)
                  setEditingGroup({ ...editingGroup, color: e.target.value })
                }}
              />
            </div>

            <div className="config-field">
              <label>Fixtures ({editingGroup.selectedFixtures.length}):</label>
              <div className="fixture-list">
                {editingGroup.fixtureDetails && editingGroup.fixtureDetails.length > 0 ? (
                  editingGroup.fixtureDetails.map((fx, idx) => (
                    <div key={idx} className="fixture-item">
                      <span className="fixture-name">{fx.name}</span>
                      <span className="fixture-type">{fx.type}</span>
                    </div>
                  ))
                ) : (
                  <div className="no-fixtures">
                    {editingGroup.selectedFixtures.length} fixtures (details not available)
                  </div>
                )}
              </div>
            </div>

            <div className="config-field">
              <label>Created:</label>
              <div className="config-value">
                {new Date(editingGroup.timestamp).toLocaleString()}
              </div>
            </div>

            <div className="config-actions">
              <button
                className="btn-recall"
                onClick={() => {
                  recallGroup(editingGroup)
                  setShowConfig(false)
                }}
              >
                Recall
              </button>
              <button
                className="btn-update"
                onClick={() => {
                  recordGroup(editingGroup.gridPosition, editingGroup.name)
                  setShowConfig(false)
                }}
              >
                Update
              </button>
              <button
                className="btn-delete"
                onClick={() => deleteGroup(editingGroup.gridPosition)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="group-grid-footer">
        <span>💡 Click to select group • Long press to record • Right-click to edit</span>
      </div>
    </div>
  )
}

export default GroupGrid
