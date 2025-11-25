import React, { useState, useEffect } from 'react'
import '../styles/SteamDeckSetup.css'

/**
 * Steam Deck Setup Component
 * Configuration panel for Steam Deck detection and easy button assignments
 */
function SteamDeckSetup() {
  const [steamDeckDetected, setSteamDeckDetected] = useState(false)
  const [currentMode, setCurrentMode] = useState('unknown')
  const [devicePixelRatio, setDevicePixelRatio] = useState(1)
  const [resolution, setResolution] = useState({ width: 0, height: 0 })
  const [gamepadConnected, setGamepadConnected] = useState(false)
  const [gamepadInfo, setGamepadInfo] = useState(null)
  const [editingButton, setEditingButton] = useState(null)

  // Available windows for assignment
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
    'Undo', 'Redo'
  ]

  // Available intensity/parameter controls
  const AVAILABLE_CONTROLS = [
    'Intensity', 'Red', 'Green', 'Blue', 'White',
    'Pan', 'Tilt', 'Focus', 'Zoom', 'Iris'
  ]

  // Steam Deck settings (stored in localStorage)
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('steamdeck_settings')
    return saved ? JSON.parse(saved) : {
      integrationEnabled: true,
      scalingMode: 'auto',
      customScale: 1.0,
      touchpadSensitivity: 1.0,
      quickAccessEnabled: true,
      hudEnabled: true,
      vibrationEnabled: true,
      autoDetect: true,
      // Button assignments
      buttonAssignments: {
        L4: { type: 'window', value: 9, label: 'Programmer' },
        L5: { type: 'window', value: 20, label: 'Cues' },
        R4: { type: 'window', value: 21, label: 'Executors' },
        R5: { type: 'window', value: 40, label: 'FlexWindow' }
      },
      // Touchpad assignments
      leftTouchpad: { type: 'control', value: 'Pan', axis: 'x' },
      rightTouchpad: { type: 'control', value: 'Intensity', axis: 'y' }
    }
  })

  // Detect Steam Deck on mount
  useEffect(() => {
    detectSteamDeck()
    detectGamepad()

    // Poll for gamepad connection
    const gamepadInterval = setInterval(detectGamepad, 1000)

    return () => clearInterval(gamepadInterval)
  }, [])

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('steamdeck_settings', JSON.stringify(settings))

    // Apply scaling if changed
    if (settings.scalingMode !== 'auto') {
      applyCustomScaling()
    }
  }, [settings])

  const detectSteamDeck = () => {
    const width = window.innerWidth
    const height = window.innerHeight
    const dpr = window.devicePixelRatio || 1

    setResolution({ width, height })
    setDevicePixelRatio(dpr)

    // Check if resolution matches Steam Deck (1280x800)
    const isSteamDeck = width === 1280 && height === 800
    setSteamDeckDetected(isSteamDeck)

    if (isSteamDeck) {
      const mode = dpr > 1.25 ? 'desktop' : 'gaming'
      setCurrentMode(mode)
    } else {
      setCurrentMode('not-steam-deck')
    }
  }

  const detectGamepad = () => {
    const gamepads = navigator.getGamepads()
    const gamepad = gamepads[0] || gamepads[1] || gamepads[2] || gamepads[3]

    if (gamepad) {
      setGamepadConnected(true)
      setGamepadInfo({
        id: gamepad.id,
        buttons: gamepad.buttons.length,
        axes: gamepad.axes.length,
        index: gamepad.index
      })
    } else {
      setGamepadConnected(false)
      setGamepadInfo(null)
    }
  }

  const applyCustomScaling = () => {
    const html = document.documentElement

    html.classList.remove('steam-deck-desktop', 'steam-deck-gaming')

    switch (settings.scalingMode) {
      case 'desktop':
        html.classList.add('steam-deck-desktop')
        break
      case 'gaming':
        html.classList.add('steam-deck-gaming')
        break
      case 'custom':
        html.style.zoom = settings.customScale
        break
      default:
        detectSteamDeck()
    }
  }

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleButtonAssignment = (button, type, value, label) => {
    setSettings(prev => ({
      ...prev,
      buttonAssignments: {
        ...prev.buttonAssignments,
        [button]: { type, value, label }
      }
    }))
    setEditingButton(null)
  }

  const handleTouchpadAssignment = (touchpad, control) => {
    setSettings(prev => ({
      ...prev,
      [touchpad]: { type: 'control', value: control, axis: touchpad === 'leftTouchpad' ? 'x' : 'y' }
    }))
  }

  const resetToDefaults = () => {
    const defaultSettings = {
      integrationEnabled: true,
      scalingMode: 'auto',
      customScale: 1.0,
      touchpadSensitivity: 1.0,
      quickAccessEnabled: true,
      hudEnabled: true,
      vibrationEnabled: true,
      autoDetect: true,
      buttonAssignments: {
        L4: { type: 'window', value: 9, label: 'Programmer' },
        L5: { type: 'window', value: 20, label: 'Cues' },
        R4: { type: 'window', value: 21, label: 'Executors' },
        R5: { type: 'window', value: 40, label: 'FlexWindow' }
      },
      leftTouchpad: { type: 'control', value: 'Pan', axis: 'x' },
      rightTouchpad: { type: 'control', value: 'Intensity', axis: 'y' }
    }
    setSettings(defaultSettings)
  }

  const forceRefreshDetection = () => {
    detectSteamDeck()
    detectGamepad()
  }

  const getButtonAssignment = (button) => {
    return settings.buttonAssignments?.[button] || { type: 'none', value: null, label: 'Not Assigned' }
  }

  return (
    <div className="steamdeck-setup">
      <h3>🎮 Steam Deck Configuration</h3>

      {/* Auto Detection Status */}
      <div className="setup-section detection-section">
        <h4>📡 Auto-Detection</h4>
        <div className="detection-status">
          <div className="status-grid">
            <div className="status-card">
              <div className="status-icon">{steamDeckDetected ? '✅' : '❌'}</div>
              <div className="status-info">
                <span className="status-title">Steam Deck</span>
                <span className={`status-subtitle ${steamDeckDetected ? 'detected' : 'not-detected'}`}>
                  {steamDeckDetected ? 'Detected' : 'Not Detected'}
                </span>
              </div>
            </div>

            <div className="status-card">
              <div className="status-icon">{gamepadConnected ? '🎮' : '⚠️'}</div>
              <div className="status-info">
                <span className="status-title">Gamepad</span>
                <span className={`status-subtitle ${gamepadConnected ? 'detected' : 'not-detected'}`}>
                  {gamepadConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>

            <div className="status-card">
              <div className="status-icon">
                {currentMode === 'desktop' && '🖥️'}
                {currentMode === 'gaming' && '🎮'}
                {currentMode === 'not-steam-deck' && '💻'}
              </div>
              <div className="status-info">
                <span className="status-title">Mode</span>
                <span className="status-subtitle">
                  {currentMode === 'desktop' && 'Desktop'}
                  {currentMode === 'gaming' && 'Gaming'}
                  {currentMode === 'not-steam-deck' && 'Standard'}
                </span>
              </div>
            </div>

            <div className="status-card">
              <div className="status-icon">📐</div>
              <div className="status-info">
                <span className="status-title">Resolution</span>
                <span className="status-subtitle">{resolution.width}×{resolution.height}</span>
              </div>
            </div>
          </div>

          <button className="btn-refresh" onClick={forceRefreshDetection}>
            🔄 Refresh Detection
          </button>

          {gamepadInfo && (
            <div className="gamepad-details">
              <strong>Gamepad Info:</strong> {gamepadInfo.id}<br />
              <strong>Buttons:</strong> {gamepadInfo.buttons} | <strong>Axes:</strong> {gamepadInfo.axes}
            </div>
          )}
        </div>
      </div>

      {/* Quick Access Button Assignment */}
      <div className="setup-section">
        <h4>🎯 Quick Access Buttons (Rear Paddles)</h4>
        <p className="section-hint">Assign windows or commands to the back paddle buttons for instant access</p>

        <div className="button-assignment-grid">
          {['L4', 'L5', 'R4', 'R5'].map(button => {
            const assignment = getButtonAssignment(button)
            return (
              <div key={button} className="button-assignment-card">
                <div className="button-header">
                  <span className="button-name">{button}</span>
                  <span className="button-position">
                    {button.startsWith('L') ? 'Left' : 'Right'} {button.endsWith('4') ? 'Top' : 'Bottom'}
                  </span>
                </div>
                <div className="button-current">
                  {assignment.label || 'Not Assigned'}
                </div>
                <button
                  className="btn-assign"
                  onClick={() => setEditingButton(editingButton === button ? null : button)}
                >
                  {editingButton === button ? 'Cancel' : 'Change'}
                </button>

                {editingButton === button && (
                  <div className="assignment-dropdown">
                    <div className="dropdown-section">
                      <strong>Windows:</strong>
                      <div className="option-grid">
                        {AVAILABLE_WINDOWS.map(win => (
                          <button
                            key={win.id}
                            className="option-btn"
                            onClick={() => handleButtonAssignment(button, 'window', win.id, win.name)}
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
                            onClick={() => handleButtonAssignment(button, 'command', cmd, cmd)}
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
          })}
        </div>
      </div>

      {/* Touchpad Assignment */}
      <div className="setup-section">
        <h4>🎮 Touchpad Controls</h4>
        <p className="section-hint">Assign parameters to touchpads for real-time control</p>

        <div className="touchpad-grid">
          <div className="touchpad-card">
            <div className="touchpad-header">
              <span className="touchpad-name">Left Touchpad</span>
              <span className="touchpad-axis">Horizontal (X-axis)</span>
            </div>
            <select
              className="touchpad-select"
              value={settings.leftTouchpad?.value || 'Pan'}
              onChange={(e) => handleTouchpadAssignment('leftTouchpad', e.target.value)}
            >
              {AVAILABLE_CONTROLS.map(control => (
                <option key={control} value={control}>{control}</option>
              ))}
            </select>
          </div>

          <div className="touchpad-card">
            <div className="touchpad-header">
              <span className="touchpad-name">Right Touchpad</span>
              <span className="touchpad-axis">Vertical (Y-axis)</span>
            </div>
            <select
              className="touchpad-select"
              value={settings.rightTouchpad?.value || 'Intensity'}
              onChange={(e) => handleTouchpadAssignment('rightTouchpad', e.target.value)}
            >
              {AVAILABLE_CONTROLS.map(control => (
                <option key={control} value={control}>{control}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="sensitivity-control">
          <label className="setting-label">
            Touchpad Sensitivity: <strong>{settings.touchpadSensitivity.toFixed(1)}x</strong>
          </label>
          <input
            type="range"
            min="0.1"
            max="2.0"
            step="0.1"
            value={settings.touchpadSensitivity}
            onChange={(e) => handleSettingChange('touchpadSensitivity', parseFloat(e.target.value))}
            className="sensitivity-slider"
          />
        </div>
      </div>

      {/* Integration Settings */}
      <div className="setup-section">
        <h4>⚙️ Integration Settings</h4>

        <div className="settings-grid">
          <label className="setting-checkbox">
            <input
              type="checkbox"
              checked={settings.integrationEnabled}
              onChange={(e) => handleSettingChange('integrationEnabled', e.target.checked)}
            />
            <span>Enable Steam Deck Integration</span>
          </label>

          <label className="setting-checkbox">
            <input
              type="checkbox"
              checked={settings.quickAccessEnabled}
              onChange={(e) => handleSettingChange('quickAccessEnabled', e.target.checked)}
            />
            <span>Enable Quick Access Buttons</span>
          </label>

          <label className="setting-checkbox">
            <input
              type="checkbox"
              checked={settings.hudEnabled}
              onChange={(e) => handleSettingChange('hudEnabled', e.target.checked)}
            />
            <span>Show HUD Overlay</span>
          </label>

          <label className="setting-checkbox">
            <input
              type="checkbox"
              checked={settings.vibrationEnabled}
              onChange={(e) => handleSettingChange('vibrationEnabled', e.target.checked)}
            />
            <span>Enable Haptic Feedback</span>
          </label>
        </div>
      </div>

      {/* Display Scaling */}
      <div className="setup-section">
        <h4>📐 Display Scaling</h4>

        <div className="scaling-options">
          <label className="setting-label">Scaling Mode:</label>
          <select
            value={settings.scalingMode}
            onChange={(e) => handleSettingChange('scalingMode', e.target.value)}
            className="scaling-select"
          >
            <option value="auto">🔄 Auto (Detect by DPR)</option>
            <option value="desktop">🖥️ Desktop Mode (0.75x)</option>
            <option value="gaming">🎮 Gaming Mode (1.15x)</option>
            <option value="custom">⚙️ Custom Scale</option>
          </select>

          {settings.scalingMode === 'custom' && (
            <div className="custom-scale-control">
              <label className="setting-label">
                Scale Factor: <strong>{settings.customScale.toFixed(2)}x</strong>
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.05"
                value={settings.customScale}
                onChange={(e) => handleSettingChange('customScale', parseFloat(e.target.value))}
                className="scale-slider"
              />
            </div>
          )}
        </div>

        <div className="scaling-hints">
          <div className="hint-badge hint-auto">
            <strong>Auto:</strong> Automatically adjusts based on device pixel ratio
          </div>
          <div className="hint-badge hint-desktop">
            <strong>Desktop:</strong> 0.75x zoom compensates for OS DPI scaling
          </div>
          <div className="hint-badge hint-gaming">
            <strong>Gaming:</strong> 1.15x zoom for larger touch targets
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="setup-actions">
        <button className="btn-reset" onClick={resetToDefaults}>
          🔄 Reset to Defaults
        </button>
        <button className="btn-test" onClick={forceRefreshDetection}>
          🧪 Test Detection
        </button>
      </div>

      {/* Info Panel */}
      {steamDeckDetected && (
        <div className="info-panel info-success">
          <strong>✅ Steam Deck Optimizations Active</strong>
          <p>
            Your Steam Deck has been detected and optimized settings are active.
            Customize button assignments above for your workflow.
          </p>
        </div>
      )}

      {!steamDeckDetected && (
        <div className="info-panel info-warning">
          <strong>ℹ️ Not Running on Steam Deck</strong>
          <p>
            Steam Deck features will be limited. Expected resolution: 1280×800.
            Current: {resolution.width}×{resolution.height}
          </p>
        </div>
      )}
    </div>
  )
}

export default SteamDeckSetup
