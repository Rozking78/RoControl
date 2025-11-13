import React, { useState, useEffect, useRef } from 'react'
import { invoke } from '@tauri-apps/api/tauri'
import './App.css'

function App() {
  const [fixtures, setFixtures] = useState([])
  const [selectedFixtures, setSelectedFixtures] = useState(new Set())
  const [encoderValues, setEncoderValues] = useState({
    dimmer: 0,
    pan: 128,
    tilt: 128,
    red: 0,
    green: 0,
    blue: 0,
  })
  const [faderValues, setFaderValues] = useState(Array(6).fill(0))
  const [artnetConfig, setArtnetConfig] = useState('2.255.255.255')
  const [isBlackout, setIsBlackout] = useState(false)

  // Initialize with some demo fixtures
  useEffect(() => {
    initializeFixtures()
    setupGamepadListener()
  }, [])

  const initializeFixtures = async () => {
    // Add some demo fixtures
    const demoFixtures = [
      { id: 'fx1', name: 'Wash 1', fixture_type: 'LED PAR', dmx_address: 1, universe: 0, channel_count: 7 },
      { id: 'fx2', name: 'Wash 2', fixture_type: 'LED PAR', dmx_address: 8, universe: 0, channel_count: 7 },
      { id: 'fx3', name: 'Spot 1', fixture_type: 'Moving Head', dmx_address: 15, universe: 0, channel_count: 16 },
      { id: 'fx4', name: 'Spot 2', fixture_type: 'Moving Head', dmx_address: 31, universe: 0, channel_count: 16 },
      { id: 'fx5', name: 'Wash 3', fixture_type: 'LED PAR', dmx_address: 47, universe: 0, channel_count: 7 },
      { id: 'fx6', name: 'Wash 4', fixture_type: 'LED PAR', dmx_address: 54, universe: 0, channel_count: 7 },
    ]

    for (const fixture of demoFixtures) {
      try {
        await invoke('add_fixture', { fixture })
      } catch (error) {
        console.error('Error adding fixture:', error)
      }
    }

    loadFixtures()
  }

  const loadFixtures = async () => {
    try {
      const loadedFixtures = await invoke('get_fixtures')
      setFixtures(loadedFixtures)
    } catch (error) {
      console.error('Error loading fixtures:', error)
    }
  }

  const toggleFixtureSelection = (fixtureId) => {
    const newSelection = new Set(selectedFixtures)
    if (newSelection.has(fixtureId)) {
      newSelection.delete(fixtureId)
    } else {
      newSelection.add(fixtureId)
    }
    setSelectedFixtures(newSelection)
  }

  const setEncoderValue = async (param, value) => {
    setEncoderValues(prev => ({ ...prev, [param]: value }))

    // Map encoder parameters to DMX channels (simplified)
    const channelMap = {
      dimmer: 0,
      red: 1,
      green: 2,
      blue: 3,
      pan: 4,
      tilt: 5,
    }

    // Apply to all selected fixtures
    for (const fixtureId of selectedFixtures) {
      try {
        await invoke('set_fixture_channel', {
          fixtureId,
          channelOffset: channelMap[param],
          value: Math.round(value),
        })
      } catch (error) {
        console.error('Error setting fixture channel:', error)
      }
    }
  }

  const handleBlackout = async () => {
    try {
      await invoke('blackout')
      setIsBlackout(true)
      setTimeout(() => setIsBlackout(false), 300)
    } catch (error) {
      console.error('Error triggering blackout:', error)
    }
  }

  const handleLocate = () => {
    // Set all selected fixtures to full white at 50%
    setEncoderValue('dimmer', 128)
    setEncoderValue('red', 255)
    setEncoderValue('green', 255)
    setEncoderValue('blue', 255)
  }

  const handleClear = () => {
    setSelectedFixtures(new Set())
    setEncoderValues({
      dimmer: 0,
      pan: 128,
      tilt: 128,
      red: 0,
      green: 0,
      blue: 0,
    })
  }

  const applyColorPalette = (color) => {
    setEncoderValue('red', color.r)
    setEncoderValue('green', color.g)
    setEncoderValue('blue', color.b)
  }

  const setupGamepadListener = () => {
    // Steam Deck gamepad support
    let gamepadIndex = null

    const pollGamepad = () => {
      const gamepads = navigator.getGamepads()
      
      for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i]) {
          gamepadIndex = i
          const gamepad = gamepads[i]

          // Right trigger (R2) - Dimmer
          if (gamepad.buttons[7].value > 0.1) {
            setEncoderValue('dimmer', gamepad.buttons[7].value * 255)
          }

          // Left Joystick - Pan/Tilt
          if (Math.abs(gamepad.axes[0]) > 0.1) {
            setEncoderValue('pan', (gamepad.axes[0] + 1) * 127.5)
          }
          if (Math.abs(gamepad.axes[1]) > 0.1) {
            setEncoderValue('tilt', (gamepad.axes[1] + 1) * 127.5)
          }

          // A button - Select fixture 1
          if (gamepad.buttons[0].pressed) {
            toggleFixtureSelection('fx1')
          }

          // B button - Blackout
          if (gamepad.buttons[1].pressed) {
            handleBlackout()
          }

          // X button - Locate
          if (gamepad.buttons[2].pressed) {
            handleLocate()
          }

          // Y button - Clear
          if (gamepad.buttons[3].pressed) {
            handleClear()
          }
        }
      }

      requestAnimationFrame(pollGamepad)
    }

    // Check for gamepad connection
    window.addEventListener('gamepadconnected', (e) => {
      console.log('Gamepad connected:', e.gamepad.id)
      pollGamepad()
    })

    // Start polling if gamepad already connected
    const gamepads = navigator.getGamepads()
    if (gamepads[0]) {
      pollGamepad()
    }
  }

  const colorPalettes = [
    { name: 'Red', r: 255, g: 0, b: 0 },
    { name: 'Green', r: 0, g: 255, b: 0 },
    { name: 'Blue', r: 0, g: 0, b: 255 },
    { name: 'White', r: 255, g: 255, b: 255 },
    { name: 'Cyan', r: 0, g: 255, b: 255 },
    { name: 'Magenta', r: 255, g: 0, b: 255 },
    { name: 'Yellow', r: 255, g: 255, b: 0 },
    { name: 'Orange', r: 255, g: 128, b: 0 },
    { name: 'Pink', r: 255, g: 128, b: 192 },
  ]

  return (
    <div className="app-container">
      {/* Top Bar - MA dot2 style */}
      <div className="top-bar">
        <div className="top-bar-left">
          <div className="top-bar-title">DMX Control</div>
          <button className="top-bar-button" onClick={loadFixtures}>
            Refresh
          </button>
          <button className="top-bar-button">
            Patch
          </button>
          <button className="top-bar-button">
            Setup
          </button>
        </div>
        <div className="top-bar-right">
          <span style={{ fontSize: '12px', color: '#666' }}>
            Art-Net: {artnetConfig}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Left Panel - Fixtures */}
        <div className="fixture-panel">
          <div className="panel-title">Fixtures</div>
          <div className="fixture-grid">
            {fixtures.map((fixture) => (
              <div
                key={fixture.id}
                className={`fixture-item ${selectedFixtures.has(fixture.id) ? 'selected' : ''}`}
                onClick={() => toggleFixtureSelection(fixture.id)}
              >
                <div className="fixture-number">{fixture.id}</div>
                <div className="fixture-name">{fixture.name}</div>
                <div style={{ fontSize: '9px', opacity: 0.6 }}>
                  U{fixture.universe}:{fixture.dmx_address}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center - Programmer */}
        <div className="programmer-section">
          <div className="panel-title">
            Programmer - {selectedFixtures.size} Fixture{selectedFixtures.size !== 1 ? 's' : ''} Selected
          </div>
          <div className="encoder-grid">
            <div className="encoder">
              <div className="encoder-label">Dimmer</div>
              <div 
                className="encoder-wheel"
                onClick={() => {
                  const newVal = (encoderValues.dimmer + 25.5) % 255
                  setEncoderValue('dimmer', newVal)
                }}
              >
                <div className="encoder-value">{Math.round(encoderValues.dimmer)}</div>
                <div 
                  className="encoder-indicator" 
                  style={{ transform: `rotate(${(encoderValues.dimmer / 255) * 270 - 135}deg)` }}
                />
              </div>
            </div>

            <div className="encoder">
              <div className="encoder-label">Red</div>
              <div 
                className="encoder-wheel"
                onClick={() => {
                  const newVal = (encoderValues.red + 25.5) % 255
                  setEncoderValue('red', newVal)
                }}
              >
                <div className="encoder-value" style={{ color: '#ff0000' }}>
                  {Math.round(encoderValues.red)}
                </div>
                <div 
                  className="encoder-indicator" 
                  style={{ 
                    transform: `rotate(${(encoderValues.red / 255) * 270 - 135}deg)`,
                    background: '#ff0000'
                  }}
                />
              </div>
            </div>

            <div className="encoder">
              <div className="encoder-label">Green</div>
              <div 
                className="encoder-wheel"
                onClick={() => {
                  const newVal = (encoderValues.green + 25.5) % 255
                  setEncoderValue('green', newVal)
                }}
              >
                <div className="encoder-value" style={{ color: '#00ff00' }}>
                  {Math.round(encoderValues.green)}
                </div>
                <div 
                  className="encoder-indicator" 
                  style={{ 
                    transform: `rotate(${(encoderValues.green / 255) * 270 - 135}deg)`,
                    background: '#00ff00'
                  }}
                />
              </div>
            </div>

            <div className="encoder">
              <div className="encoder-label">Blue</div>
              <div 
                className="encoder-wheel"
                onClick={() => {
                  const newVal = (encoderValues.blue + 25.5) % 255
                  setEncoderValue('blue', newVal)
                }}
              >
                <div className="encoder-value" style={{ color: '#0088ff' }}>
                  {Math.round(encoderValues.blue)}
                </div>
                <div 
                  className="encoder-indicator" 
                  style={{ 
                    transform: `rotate(${(encoderValues.blue / 255) * 270 - 135}deg)`,
                    background: '#0088ff'
                  }}
                />
              </div>
            </div>

            <div className="encoder">
              <div className="encoder-label">Pan</div>
              <div 
                className="encoder-wheel"
                onClick={() => {
                  const newVal = (encoderValues.pan + 25.5) % 255
                  setEncoderValue('pan', newVal)
                }}
              >
                <div className="encoder-value">{Math.round(encoderValues.pan)}</div>
                <div 
                  className="encoder-indicator" 
                  style={{ transform: `rotate(${(encoderValues.pan / 255) * 270 - 135}deg)` }}
                />
              </div>
            </div>

            <div className="encoder">
              <div className="encoder-label">Tilt</div>
              <div 
                className="encoder-wheel"
                onClick={() => {
                  const newVal = (encoderValues.tilt + 25.5) % 255
                  setEncoderValue('tilt', newVal)
                }}
              >
                <div className="encoder-value">{Math.round(encoderValues.tilt)}</div>
                <div 
                  className="encoder-indicator" 
                  style={{ transform: `rotate(${(encoderValues.tilt / 255) * 270 - 135}deg)` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Palettes */}
        <div className="palette-panel">
          <div className="panel-title">Color Palettes</div>
          <div className="palette-grid">
            {colorPalettes.map((palette) => (
              <div
                key={palette.name}
                className="palette-button"
                onClick={() => applyColorPalette(palette)}
              >
                <div
                  className="palette-color"
                  style={{
                    background: `rgb(${palette.r}, ${palette.g}, ${palette.b})`,
                  }}
                />
                <div className="palette-label">{palette.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom - Executor Faders */}
        <div className="executor-section">
          <div className="executor-faders">
            {faderValues.map((value, index) => (
              <div key={index} className="fader">
                <div
                  className="fader-track"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const y = rect.bottom - e.clientY
                    const percentage = Math.max(0, Math.min(1, y / rect.height))
                    const newFaderValues = [...faderValues]
                    newFaderValues[index] = percentage * 255
                    setFaderValues(newFaderValues)
                  }}
                >
                  <div
                    className="fader-handle"
                    style={{ bottom: `${(value / 255) * 100}%` }}
                  />
                </div>
                <div className="fader-label">
                  Exec {index + 1}
                  <br />
                  {Math.round(value)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="quick-actions">
        <button className="action-button blackout" onClick={handleBlackout}>
          Black
        </button>
        <button className="action-button locate" onClick={handleLocate}>
          Locate
        </button>
        <button className="action-button clear" onClick={handleClear}>
          Clear
        </button>
      </div>

      {/* Gamepad Hints */}
      <div className="gamepad-hint">
        🎮 Steam Deck Controls: L-Stick=Pan/Tilt | R2=Dimmer | B=Blackout | X=Locate | Y=Clear
      </div>
    </div>
  )
}

export default App
