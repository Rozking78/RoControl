import React, { useState, useEffect, useRef } from 'react'
import '../../styles/views/VideoOutputGrid.css'

/**
 * Video Output Grid - Create and manage video outputs
 * Long-press empty squares to create new outputs
 * Configure as Physical output or NDI stream
 * Square label names the NDI stream
 */
function VideoOutputGrid() {
  const [outputs, setOutputs] = useState(() => {
    const saved = localStorage.getItem('dmx_video_outputs')
    return saved ? JSON.parse(saved) : []
  })

  const [selectedOutput, setSelectedOutput] = useState(null)
  const [showConfig, setShowConfig] = useState(false)
  const [longPressTimer, setLongPressTimer] = useState(null)
  const [longPressPosition, setLongPressPosition] = useState(null)

  // Detect available physical outputs (simulated for now)
  const [physicalOutputs, setPhysicalOutputs] = useState([
    { id: 'hdmi1', name: 'HDMI 1', available: true },
    { id: 'hdmi2', name: 'HDMI 2', available: true },
    { id: 'displayport1', name: 'DisplayPort 1', available: false },
    { id: 'usbc1', name: 'USB-C Display', available: true },
  ])

  // Grid size
  const GRID_COLS = 4
  const GRID_ROWS = 3
  const TOTAL_SQUARES = GRID_COLS * GRID_ROWS

  // Save outputs to localStorage
  useEffect(() => {
    localStorage.setItem('dmx_video_outputs', JSON.stringify(outputs))
  }, [outputs])

  // Long press handling for creating new outputs
  const handleSquarePointerDown = (index, e) => {
    // Check if square is empty
    const existingOutput = outputs.find(o => o.gridPosition === index)
    if (existingOutput) return

    e.preventDefault()

    const timer = setTimeout(() => {
      // Long press triggered - create new output
      setLongPressPosition(index)
      createNewOutput(index)
    }, 800) // 800ms long press

    setLongPressTimer(timer)
  }

  const handleSquarePointerUp = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
  }

  const createNewOutput = (position) => {
    const newOutput = {
      id: `output_${Date.now()}`,
      gridPosition: position,
      name: `Output ${position + 1}`,
      type: 'ndi', // 'ndi' or 'physical'
      ndiStreamName: `RoControl Output ${position + 1}`,
      physicalOutput: null,
      enabled: true,
      resolution: '1920x1080',
      fps: 60,
    }

    setOutputs([...outputs, newOutput])
    setSelectedOutput(newOutput)
    setShowConfig(true)
    setLongPressPosition(null)
  }

  const handleOutputClick = (output) => {
    setSelectedOutput(output)
    setShowConfig(true)
  }

  const updateOutput = (updates) => {
    if (!selectedOutput) return

    const updatedOutputs = outputs.map(o =>
      o.id === selectedOutput.id ? { ...o, ...updates } : o
    )

    setOutputs(updatedOutputs)
    setSelectedOutput({ ...selectedOutput, ...updates })
  }

  const deleteOutput = () => {
    if (!selectedOutput) return

    if (confirm(`Delete ${selectedOutput.name}?`)) {
      setOutputs(outputs.filter(o => o.id !== selectedOutput.id))
      setShowConfig(false)
      setSelectedOutput(null)
    }
  }

  const closeConfig = () => {
    setShowConfig(false)
    setSelectedOutput(null)
  }

  // Generate grid squares
  const renderGrid = () => {
    const squares = []

    for (let i = 0; i < TOTAL_SQUARES; i++) {
      const output = outputs.find(o => o.gridPosition === i)

      squares.push(
        <div
          key={i}
          className={`output-square ${output ? 'filled' : 'empty'} ${selectedOutput?.id === output?.id ? 'selected' : ''}`}
          onPointerDown={(e) => handleSquarePointerDown(i, e)}
          onPointerUp={handleSquarePointerUp}
          onPointerLeave={handleSquarePointerUp}
          onClick={() => output && handleOutputClick(output)}
        >
          {output ? (
            <>
              <div className="output-type-badge">
                {output.type === 'ndi' ? '📡' : '🖥️'}
              </div>
              <div className="output-number">{i + 1}</div>
              <div className="output-name">{output.name}</div>
              <div className="output-status">
                {output.enabled ? (
                  <span className="status-active">●</span>
                ) : (
                  <span className="status-inactive">○</span>
                )}
                {output.type === 'ndi' ? 'NDI' : output.physicalOutput}
              </div>
            </>
          ) : (
            <div className="empty-hint">
              Long press
              <br />
              to create
            </div>
          )}
        </div>
      )
    }

    return squares
  }

  return (
    <div className="video-output-grid-view">
      <div className="grid-header">
        <h2>Video Outputs</h2>
        <div className="header-stats">
          {outputs.length} / {TOTAL_SQUARES} outputs
        </div>
      </div>

      <div className="output-grid" style={{
        gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
        gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`
      }}>
        {renderGrid()}
      </div>

      {showConfig && selectedOutput && (
        <div className="output-config-panel">
          <div className="config-header">
            <h3>Configure Output</h3>
            <button className="close-config-btn" onClick={closeConfig}>×</button>
          </div>

          <div className="config-form">
            <div className="form-group">
              <label>Output Name</label>
              <input
                type="text"
                value={selectedOutput.name}
                onChange={(e) => updateOutput({ name: e.target.value })}
                placeholder="e.g., Main Screen, LED Wall"
                className="config-input"
              />
              <div className="field-note">
                For NDI streams, this becomes the stream name
              </div>
            </div>

            <div className="form-group">
              <label>Output Type</label>
              <div className="type-selector">
                <button
                  className={`type-btn ${selectedOutput.type === 'ndi' ? 'active' : ''}`}
                  onClick={() => updateOutput({ type: 'ndi' })}
                >
                  <span className="type-icon">📡</span>
                  <span>NDI Stream</span>
                </button>
                <button
                  className={`type-btn ${selectedOutput.type === 'physical' ? 'active' : ''}`}
                  onClick={() => updateOutput({ type: 'physical' })}
                >
                  <span className="type-icon">🖥️</span>
                  <span>Physical Output</span>
                </button>
              </div>
            </div>

            {selectedOutput.type === 'ndi' && (
              <div className="form-group">
                <label>NDI Stream Name</label>
                <input
                  type="text"
                  value={selectedOutput.ndiStreamName || selectedOutput.name}
                  onChange={(e) => updateOutput({ ndiStreamName: e.target.value })}
                  placeholder="RoControl Output 1"
                  className="config-input"
                />
                <div className="field-note">
                  This name will be visible to NDI receivers on the network
                </div>
              </div>
            )}

            {selectedOutput.type === 'physical' && (
              <div className="form-group">
                <label>Physical Display</label>
                <select
                  value={selectedOutput.physicalOutput || ''}
                  onChange={(e) => updateOutput({ physicalOutput: e.target.value })}
                  className="config-select"
                >
                  <option value="">Select display...</option>
                  {physicalOutputs.map(output => (
                    <option
                      key={output.id}
                      value={output.id}
                      disabled={!output.available}
                    >
                      {output.name} {!output.available && '(In use)'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label>Resolution</label>
              <select
                value={selectedOutput.resolution}
                onChange={(e) => updateOutput({ resolution: e.target.value })}
                className="config-select"
              >
                <option value="1920x1080">1920 × 1080 (Full HD)</option>
                <option value="2560x1440">2560 × 1440 (2K)</option>
                <option value="3840x2160">3840 × 2160 (4K)</option>
                <option value="1280x720">1280 × 720 (HD)</option>
                <option value="1024x768">1024 × 768</option>
              </select>
            </div>

            <div className="form-group">
              <label>Frame Rate</label>
              <select
                value={selectedOutput.fps}
                onChange={(e) => updateOutput({ fps: parseInt(e.target.value) })}
                className="config-select"
              >
                <option value="30">30 FPS</option>
                <option value="60">60 FPS</option>
                <option value="120">120 FPS</option>
              </select>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedOutput.enabled}
                  onChange={(e) => updateOutput({ enabled: e.target.checked })}
                />
                <span>Enable Output</span>
              </label>
            </div>

            <div className="config-actions">
              <button className="delete-btn" onClick={deleteOutput}>
                Delete Output
              </button>
              <button className="apply-btn" onClick={closeConfig}>
                Apply
              </button>
            </div>
          </div>

          <div className="output-info">
            <h4>Output Information</h4>
            <ul>
              <li><strong>Grid Position:</strong> Square {selectedOutput.gridPosition + 1}</li>
              <li><strong>Type:</strong> {selectedOutput.type === 'ndi' ? 'NDI Stream' : 'Physical Display'}</li>
              {selectedOutput.type === 'ndi' && (
                <li><strong>Stream:</strong> {selectedOutput.ndiStreamName || selectedOutput.name}</li>
              )}
              <li><strong>Resolution:</strong> {selectedOutput.resolution}</li>
              <li><strong>FPS:</strong> {selectedOutput.fps}</li>
              <li><strong>Status:</strong> {selectedOutput.enabled ? 'Active' : 'Disabled'}</li>
            </ul>
          </div>
        </div>
      )}

      <div className="grid-footer">
        <div className="footer-info">
          <div className="info-item">
            <span className="info-icon">📡</span>
            <span>NDI Stream - Network output</span>
          </div>
          <div className="info-item">
            <span className="info-icon">🖥️</span>
            <span>Physical - Direct display output</span>
          </div>
        </div>
        <div className="footer-hint">
          Long press an empty square to create a new output
        </div>
      </div>
    </div>
  )
}

export default VideoOutputGrid
