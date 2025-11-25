import React, { useState, useEffect } from 'react'
import '../styles/SteamDeckSetup.css'

/**
 * Steam Deck Setup Component
 * Configuration panel for Steam Deck detection and settings
 */
function SteamDeckSetup() {
  const [steamDeckDetected, setSteamDeckDetected] = useState(false)
  const [currentMode, setCurrentMode] = useState('unknown')
  const [devicePixelRatio, setDevicePixelRatio] = useState(1)
  const [resolution, setResolution] = useState({ width: 0, height: 0 })
  const [gamepadConnected, setGamepadConnected] = useState(false)
  const [gamepadInfo, setGamepadInfo] = useState(null)

  // Steam Deck settings (stored in localStorage)
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('steamdeck_settings')
    return saved ? JSON.parse(saved) : {
      integrationEnabled: true,
      scalingMode: 'auto', // 'auto', 'desktop', 'gaming', 'custom'
      customScale: 1.0,
      touchpadSensitivity: 1.0,
      buttonMappingProfile: 'default', // 'default', 'custom'
      quickAccessEnabled: true,
      hudEnabled: true,
      vibrationEnabled: true,
      autoDetect: true
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
      // Detect mode based on DPR
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

    // Remove existing Steam Deck classes
    html.classList.remove('steam-deck-desktop', 'steam-deck-gaming')

    switch (settings.scalingMode) {
      case 'desktop':
        html.classList.add('steam-deck-desktop')
        break
      case 'gaming':
        html.classList.add('steam-deck-gaming')
        break
      case 'custom':
        // Apply custom zoom
        html.style.zoom = settings.customScale
        break
      default:
        // Auto - let the detection script handle it
        detectSteamDeck()
    }
  }

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const resetToDefaults = () => {
    const defaultSettings = {
      integrationEnabled: true,
      scalingMode: 'auto',
      customScale: 1.0,
      touchpadSensitivity: 1.0,
      buttonMappingProfile: 'default',
      quickAccessEnabled: true,
      hudEnabled: true,
      vibrationEnabled: true,
      autoDetect: true
    }
    setSettings(defaultSettings)
  }

  const forceRefreshDetection = () => {
    detectSteamDeck()
    detectGamepad()
  }

  return (
    <div className="steamdeck-setup">
      <h3>Steam Deck Configuration</h3>

      {/* Detection Status */}
      <div className="setup-section">
        <h4>Device Detection</h4>
        <div className="detection-status">
          <div className="status-row">
            <span className="status-label">Steam Deck Detected:</span>
            <span className={`status-value ${steamDeckDetected ? 'detected' : 'not-detected'}`}>
              {steamDeckDetected ? '✓ Yes' : '✗ No'}
            </span>
            <button className="refresh-btn" onClick={forceRefreshDetection}>
              Refresh
            </button>
          </div>

          <div className="status-row">
            <span className="status-label">Current Mode:</span>
            <span className="status-value mode-badge">
              {currentMode === 'desktop' && '🖥️ Desktop Mode'}
              {currentMode === 'gaming' && '🎮 Gaming Mode'}
              {currentMode === 'not-steam-deck' && 'Standard Device'}
              {currentMode === 'unknown' && 'Unknown'}
            </span>
          </div>

          <div className="status-row">
            <span className="status-label">Resolution:</span>
            <span className="status-value">{resolution.width} × {resolution.height}</span>
          </div>

          <div className="status-row">
            <span className="status-label">Device Pixel Ratio:</span>
            <span className="status-value">{devicePixelRatio.toFixed(2)}</span>
          </div>

          <div className="status-row">
            <span className="status-label">Gamepad Connected:</span>
            <span className={`status-value ${gamepadConnected ? 'detected' : 'not-detected'}`}>
              {gamepadConnected ? '✓ Yes' : '✗ No'}
            </span>
          </div>

          {gamepadInfo && (
            <div className="gamepad-info">
              <div className="info-detail">ID: {gamepadInfo.id}</div>
              <div className="info-detail">Buttons: {gamepadInfo.buttons} | Axes: {gamepadInfo.axes}</div>
            </div>
          )}
        </div>
      </div>

      {/* Integration Settings */}
      <div className="setup-section">
        <h4>Integration Settings</h4>

        <div className="setting-row">
          <label className="setting-label">
            <input
              type="checkbox"
              checked={settings.integrationEnabled}
              onChange={(e) => handleSettingChange('integrationEnabled', e.target.checked)}
            />
            Enable Steam Deck Integration
          </label>
          <span className="setting-hint">Advanced gamepad controls and button combos</span>
        </div>

        <div className="setting-row">
          <label className="setting-label">
            <input
              type="checkbox"
              checked={settings.quickAccessEnabled}
              onChange={(e) => handleSettingChange('quickAccessEnabled', e.target.checked)}
            />
            Enable Quick Access Buttons (L4, L5, R4, R5)
          </label>
          <span className="setting-hint">Rear paddle buttons for quick window access</span>
        </div>

        <div className="setting-row">
          <label className="setting-label">
            <input
              type="checkbox"
              checked={settings.hudEnabled}
              onChange={(e) => handleSettingChange('hudEnabled', e.target.checked)}
            />
            Show Steam Deck HUD
          </label>
          <span className="setting-hint">Display mode and combo overlay</span>
        </div>

        <div className="setting-row">
          <label className="setting-label">
            <input
              type="checkbox"
              checked={settings.vibrationEnabled}
              onChange={(e) => handleSettingChange('vibrationEnabled', e.target.checked)}
            />
            Enable Haptic Feedback
          </label>
          <span className="setting-hint">Vibration on long-press and actions</span>
        </div>
      </div>

      {/* Display Scaling */}
      <div className="setup-section">
        <h4>Display Scaling</h4>

        <div className="setting-row">
          <label className="setting-label">Scaling Mode:</label>
          <select
            value={settings.scalingMode}
            onChange={(e) => handleSettingChange('scalingMode', e.target.value)}
            className="setting-select"
          >
            <option value="auto">Auto (Detect by DPR)</option>
            <option value="desktop">Force Desktop Mode (0.75x)</option>
            <option value="gaming">Force Gaming Mode (1.15x)</option>
            <option value="custom">Custom Scale</option>
          </select>
        </div>

        {settings.scalingMode === 'custom' && (
          <div className="setting-row">
            <label className="setting-label">Custom Scale Factor:</label>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={settings.customScale}
              onChange={(e) => handleSettingChange('customScale', parseFloat(e.target.value))}
              className="setting-slider"
            />
            <span className="setting-value">{settings.customScale.toFixed(2)}x</span>
          </div>
        )}

        <div className="scaling-info">
          <div className="info-badge info-desktop">
            Desktop Mode: Compensates for OS DPI scaling (0.75x zoom)
          </div>
          <div className="info-badge info-gaming">
            Gaming Mode: Enhanced visibility for larger touch targets (1.15x zoom)
          </div>
        </div>
      </div>

      {/* Touchpad Settings */}
      <div className="setup-section">
        <h4>Touchpad Settings</h4>

        <div className="setting-row">
          <label className="setting-label">Touchpad Sensitivity:</label>
          <input
            type="range"
            min="0.1"
            max="2.0"
            step="0.1"
            value={settings.touchpadSensitivity}
            onChange={(e) => handleSettingChange('touchpadSensitivity', parseFloat(e.target.value))}
            className="setting-slider"
          />
          <span className="setting-value">{settings.touchpadSensitivity.toFixed(1)}x</span>
        </div>
      </div>

      {/* Button Mapping Profile */}
      <div className="setup-section">
        <h4>Button Mapping</h4>

        <div className="setting-row">
          <label className="setting-label">Profile:</label>
          <select
            value={settings.buttonMappingProfile}
            onChange={(e) => handleSettingChange('buttonMappingProfile', e.target.value)}
            className="setting-select"
          >
            <option value="default">Default (MA3/Hog Style)</option>
            <option value="custom">Custom (Configure in Gamepad Setup)</option>
          </select>
        </div>

        <div className="button-mapping-preview">
          <h5>Quick Access (Rear Paddles):</h5>
          <ul>
            <li><strong>L4:</strong> Programmer (Window 9)</li>
            <li><strong>L5:</strong> Cues (Window 20)</li>
            <li><strong>R4:</strong> Executors (Window 21)</li>
            <li><strong>R5:</strong> FlexWindow (Window 40)</li>
          </ul>

          <h5>Button Combos:</h5>
          <ul>
            <li><strong>View + A:</strong> Blackout</li>
            <li><strong>View + B:</strong> Clear</li>
            <li><strong>View + X:</strong> Highlight</li>
            <li><strong>View + Y:</strong> Locate</li>
            <li><strong>Menu + A:</strong> Record Cue</li>
            <li><strong>Menu + D-Up:</strong> Next Cue</li>
            <li><strong>Menu + D-Down:</strong> Previous Cue</li>
          </ul>
        </div>
      </div>

      {/* Actions */}
      <div className="setup-section setup-actions">
        <button className="btn-reset" onClick={resetToDefaults}>
          Reset to Defaults
        </button>
        <button className="btn-test" onClick={forceRefreshDetection}>
          Test Detection
        </button>
      </div>

      {/* Info Panel */}
      {steamDeckDetected && (
        <div className="info-panel">
          <h5>✓ Steam Deck Optimizations Active</h5>
          <p>
            RoControl has detected your Steam Deck and applied optimizations for the best experience.
            Use the controls above to fine-tune settings for your workflow.
          </p>
        </div>
      )}

      {!steamDeckDetected && (
        <div className="info-panel info-warning">
          <h5>ℹ️ Not Running on Steam Deck</h5>
          <p>
            Steam Deck specific features will be disabled. If you believe this is incorrect,
            check your resolution (should be 1280×800) and click "Refresh" above.
          </p>
        </div>
      )}
    </div>
  )
}

export default SteamDeckSetup
