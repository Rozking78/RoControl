import React, { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/tauri'
import '../styles/ElgatoStreamDeckSetup.css'

/**
 * Elgato Stream Deck Setup Component
 * Configuration panel for Elgato Stream Deck device detection and button assignments
 */
function ElgatoStreamDeckSetup() {
  const [devices, setDevices] = useState([])
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [isScanning, setIsScanning] = useState(false)
  const [brightness, setBrightness] = useState(75)
  const [buttonMappings, setButtonMappings] = useState({})
  const [editingButton, setEditingButton] = useState(null)
  const [error, setError] = useState(null)

  // Available windows for button assignment
  const AVAILABLE_WINDOWS = [
    { id: 4, name: 'Pixel Grid', icon: '🎨' },
    { id: 9, name: 'Programmer', icon: '⚙️' },
    { id: 10, name: 'Color', icon: '🌈' },
    { id: 11, name: 'Intensity', icon: '💡' },
    { id: 12, name: 'Position', icon: '📍' },
    { id: 13, name: 'Focus', icon: '🔍' },
    { id: 14, name: 'Gobo', icon: '🎭' },
    { id: 20, name: 'Cues', icon: '📋' },
    { id: 21, name: 'Executors', icon: '▶️' },
    { id: 22, name: 'Palettes', icon: '🎨' },
    { id: 30, name: 'Fixtures', icon: '💡' },
    { id: 31, name: 'Groups', icon: '👥' },
    { id: 40, name: 'FlexWindow', icon: '🪟' },
    { id: 50, name: 'Quick Actions', icon: '⚡' }
  ]

  // Available commands
  const AVAILABLE_COMMANDS = [
    'Blackout', 'Clear', 'Locate', 'Highlight',
    'Record Cue', 'Update', 'Go Cue', 'Pause',
    'At Full', 'At 50', 'At 0',
    'Select All', 'Clear Selection',
    'Previous Fixture', 'Next Fixture',
    'Undo', 'Redo', 'Save Show'
  ]

  // Scan for Stream Deck devices
  const scanDevices = async () => {
    setIsScanning(true)
    setError(null)
    try {
      const foundDevices = await invoke('scan_streamdeck_devices')
      setDevices(foundDevices)
      if (foundDevices.length > 0 && !selectedDevice) {
        setSelectedDevice(foundDevices[0])
        // Load saved button mappings for this device
        loadButtonMappings(foundDevices[0].serial_number)
      }
    } catch (err) {
      setError(`Failed to scan devices: ${err}`)
      console.error('Stream Deck scan error:', err)
    } finally {
      setIsScanning(false)
    }
  }

  // Connect to device
  const connectDevice = async (serial) => {
    setError(null)
    try {
      await invoke('connect_streamdeck', { serial })
      const device = devices.find(d => d.serial_number === serial)
      setSelectedDevice(device)
      loadButtonMappings(serial)
    } catch (err) {
      setError(`Failed to connect: ${err}`)
      console.error('Stream Deck connect error:', err)
    }
  }

  // Disconnect device
  const disconnectDevice = async (serial) => {
    setError(null)
    try {
      await invoke('disconnect_streamdeck', { serial })
      if (selectedDevice?.serial_number === serial) {
        setSelectedDevice(null)
      }
    } catch (err) {
      setError(`Failed to disconnect: ${err}`)
      console.error('Stream Deck disconnect error:', err)
    }
  }

  // Set brightness
  const handleBrightnessChange = async (value) => {
    setBrightness(value)
    if (selectedDevice) {
      try {
        await invoke('set_streamdeck_brightness', {
          serial: selectedDevice.serial_number,
          brightness: parseInt(value)
        })
      } catch (err) {
        console.error('Brightness change error:', err)
      }
    }
  }

  // Reset device
  const handleReset = async () => {
    if (!selectedDevice) return
    setError(null)
    try {
      await invoke('reset_streamdeck', { serial: selectedDevice.serial_number })
      await invoke('clear_streamdeck_buttons', { serial: selectedDevice.serial_number })
    } catch (err) {
      setError(`Failed to reset: ${err}`)
      console.error('Stream Deck reset error:', err)
    }
  }

  // Load button mappings from localStorage
  const loadButtonMappings = (serial) => {
    const saved = localStorage.getItem(`streamdeck_mappings_${serial}`)
    if (saved) {
      setButtonMappings(JSON.parse(saved))
    } else {
      setButtonMappings({})
    }
  }

  // Save button mappings to localStorage
  const saveButtonMappings = (serial, mappings) => {
    localStorage.setItem(`streamdeck_mappings_${serial}`, JSON.stringify(mappings))
  }

  // Assign button
  const handleButtonAssignment = (buttonId, type, value, label) => {
    if (!selectedDevice) return

    const newMappings = {
      ...buttonMappings,
      [buttonId]: { type, value, label }
    }
    setButtonMappings(newMappings)
    saveButtonMappings(selectedDevice.serial_number, newMappings)
    setEditingButton(null)

    // TODO: Update button image on device
    // In production, this would call a Tauri command to update the button LCD
  }

  // Clear button assignment
  const clearButtonAssignment = (buttonId) => {
    if (!selectedDevice) return

    const newMappings = { ...buttonMappings }
    delete newMappings[buttonId]
    setButtonMappings(newMappings)
    saveButtonMappings(selectedDevice.serial_number, newMappings)

    // Clear button image
    try {
      invoke('clear_streamdeck_buttons', { serial: selectedDevice.serial_number })
    } catch (err) {
      console.error('Clear button error:', err)
    }
  }

  // Scan on mount
  useEffect(() => {
    scanDevices()
  }, [])

  // Generate button grid based on device model
  const renderButtonGrid = () => {
    if (!selectedDevice) return null

    const buttons = []
    for (let i = 0; i < selectedDevice.button_count; i++) {
      const mapping = buttonMappings[i] || { type: 'none', label: 'Unassigned' }
      buttons.push(
        <div key={i} className="streamdeck-button-card">
          <div className="button-number">Button {i + 1}</div>
          <div className="button-assignment">
            {mapping.label || 'Unassigned'}
          </div>
          <div className="button-actions">
            <button
              className="btn-assign-streamdeck"
              onClick={() => setEditingButton(editingButton === i ? null : i)}
            >
              {editingButton === i ? 'Cancel' : 'Assign'}
            </button>
            {mapping.type !== 'none' && (
              <button
                className="btn-clear-streamdeck"
                onClick={() => clearButtonAssignment(i)}
              >
                Clear
              </button>
            )}
          </div>

          {editingButton === i && (
            <div className="button-assignment-dropdown">
              <div className="dropdown-section">
                <strong>Windows:</strong>
                <div className="option-grid">
                  {AVAILABLE_WINDOWS.map(win => (
                    <button
                      key={win.id}
                      className="option-btn"
                      onClick={() => handleButtonAssignment(i, 'window', win.id, win.name)}
                    >
                      {win.icon} {win.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="dropdown-section">
                <strong>Commands:</strong>
                <div className="option-grid">
                  {AVAILABLE_COMMANDS.map(cmd => (
                    <button
                      key={cmd}
                      className="option-btn"
                      onClick={() => handleButtonAssignment(i, 'command', cmd, cmd)}
                    >
                      {cmd}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )
    }

    return (
      <div
        className="streamdeck-button-grid"
        style={{
          gridTemplateColumns: `repeat(${selectedDevice.button_cols}, 1fr)`
        }}
      >
        {buttons}
      </div>
    )
  }

  return (
    <div className="elgato-streamdeck-setup">
      <h3>🎛️ Elgato Stream Deck Configuration</h3>

      {/* Error Display */}
      {error && (
        <div className="error-banner">
          <strong>⚠️ Error:</strong> {error}
        </div>
      )}

      {/* Device Scanner */}
      <div className="setup-section">
        <h4>📡 Device Detection</h4>
        <div className="device-scanner">
          <button
            className="btn-scan"
            onClick={scanDevices}
            disabled={isScanning}
          >
            {isScanning ? '⌛ Scanning...' : '🔄 Scan for Devices'}
          </button>

          <div className="device-count">
            Found {devices.length} Stream Deck{devices.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Device List */}
        {devices.length > 0 && (
          <div className="device-list">
            {devices.map(device => (
              <div key={device.serial_number} className="device-card">
                <div className="device-icon">🎛️</div>
                <div className="device-info">
                  <div className="device-name">{device.model_name}</div>
                  <div className="device-details">
                    Serial: {device.serial_number}<br />
                    Buttons: {device.button_count} ({device.button_rows}×{device.button_cols})
                  </div>
                </div>
                <div className="device-actions">
                  {selectedDevice?.serial_number === device.serial_number ? (
                    <button
                      className="btn-disconnect"
                      onClick={() => disconnectDevice(device.serial_number)}
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      className="btn-connect"
                      onClick={() => connectDevice(device.serial_number)}
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {devices.length === 0 && !isScanning && (
          <div className="no-devices">
            <p>No Stream Deck devices found. Make sure your device is plugged in via USB.</p>
          </div>
        )}
      </div>

      {/* Device Controls */}
      {selectedDevice && (
        <>
          <div className="setup-section">
            <h4>⚙️ Device Settings</h4>

            <div className="device-settings">
              <div className="setting-control">
                <label className="setting-label">
                  Brightness: <strong>{brightness}%</strong>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={brightness}
                  onChange={(e) => handleBrightnessChange(e.target.value)}
                  className="brightness-slider"
                />
              </div>

              <button className="btn-reset-device" onClick={handleReset}>
                🔄 Reset Device
              </button>
            </div>
          </div>

          <div className="setup-section">
            <h4>🎯 Button Assignments</h4>
            <p className="section-hint">
              Assign windows or commands to each Stream Deck button for instant access
            </p>

            {renderButtonGrid()}
          </div>
        </>
      )}

      {/* Info Panel */}
      <div className="info-panel">
        <strong>ℹ️ About Elgato Stream Deck</strong>
        <p>
          The Elgato Stream Deck is a customizable control surface with LCD buttons.
          Each button can be assigned to open windows, execute commands, or trigger macros.
          Button assignments are saved per device and persist between sessions.
        </p>
      </div>
    </div>
  )
}

export default ElgatoStreamDeckSetup
