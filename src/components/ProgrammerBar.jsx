import React, { useEffect, useRef } from 'react'
import '../styles/ProgrammerBar.css'

/**
 * Bottom Programmer Bar - Shows encoder wheels with D-pad navigation
 * Fixed to bottom of screen, displays circular encoders like ProgrammerView
 * Supports D-pad navigation and value adjustment
 */
function ProgrammerBar({ appState }) {
  const encoderListRef = useRef(null)
  const {
    encoderValues = {},
    activeParameters = new Set(),
    selectedFixtures = new Set(),
    fixtures = [],
    recordMode = false,
    availableChannels = [],
    focusedChannel = 0,
    setFocusedChannel,
    setEncoderValue,
    handleClearProgrammer
  } = appState || {}

  // Get channel color based on name
  const getChannelColor = (name) => {
    const nameLower = name.toLowerCase()
    if (nameLower.includes('red')) return '#ff0000'
    if (nameLower.includes('green')) return '#00ff00'
    if (nameLower.includes('blue')) return '#0088ff'
    if (nameLower.includes('white')) return '#ffffff'
    if (nameLower.includes('amber')) return '#ffbf00'
    if (nameLower.includes('uv')) return '#8b00ff'
    if (nameLower.includes('cyan')) return '#00ffff'
    if (nameLower.includes('magenta')) return '#ff00ff'
    if (nameLower.includes('yellow')) return '#ffff00'
    if (nameLower.includes('pan') || nameLower.includes('tilt')) return '#4a9eff'
    if (nameLower.includes('dimmer') || nameLower.includes('intensity')) return '#ffaa00'
    if (nameLower.includes('focus')) return '#00ffff'
    if (nameLower.includes('zoom')) return '#00ffff'
    if (nameLower.includes('gobo')) return '#ff00ff'
    if (nameLower.includes('strobe')) return '#ffff00'
    return '#4a9eff' // Default blue
  }

  const selectedCount = selectedFixtures.size
  const selectedFixtureNames = fixtures
    .filter(f => selectedFixtures.has(f.id))
    .map(f => f.name)
    .slice(0, 3)

  // Auto-scroll focused encoder into view
  useEffect(() => {
    if (encoderListRef.current && focusedChannel !== undefined) {
      const focusedEncoder = encoderListRef.current.querySelector('.encoder.focused')
      if (focusedEncoder) {
        focusedEncoder.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }
  }, [focusedChannel])

  return (
    <div className={`programmer-bar ${recordMode ? 'record-mode' : ''}`}>
      {/* Encoder Wheels - like ProgrammerView */}
      <div className="programmer-section encoders">
        <div className="section-label">
          Programmer
          {availableChannels.length > 0 && (
            <span className="param-count"> ({availableChannels.length})</span>
          )}
          <span className="dpad-hint">◄ D-Pad ► ▲▼ to adjust</span>
        </div>
        <div className="encoder-list" ref={encoderListRef}>
          {selectedCount === 0 ? (
            <div className="no-params">Select fixtures to start</div>
          ) : availableChannels.length === 0 ? (
            <div className="no-params">No common channels found</div>
          ) : (
            availableChannels.map((channel, index) => {
              const channelKey = channel.name.toLowerCase().replace(/\s+/g, '_')
              const value = encoderValues[channelKey] || 0
              const isFocused = index === focusedChannel
              const isActive = activeParameters.has(channelKey)
              const channelColor = getChannelColor(channel.name)

              return (
                <div
                  key={channelKey}
                  className={`encoder ${isFocused ? 'focused' : ''} ${isActive ? 'active' : 'inactive'}`}
                  onClick={() => {
                    if (setFocusedChannel) {
                      setFocusedChannel(index)
                    }
                  }}
                  title={`${channel.name}: ${Math.round(value)} - Click or D-Pad to focus, ▲▼ to adjust`}
                >
                  <div className="encoder-label">
                    {channel.name}
                    {isFocused && <span className="focus-indicator-arrow">◄</span>}
                  </div>
                  <div
                    className="encoder-wheel"
                    style={isFocused ? { borderColor: '#4a9eff', boxShadow: `0 0 12px ${channelColor}80` } : {}}
                  >
                    <div
                      className="encoder-value"
                      style={channelColor ? { color: channelColor } : {}}
                    >
                      {Math.round(value)}
                    </div>
                    <div
                      className="encoder-indicator"
                      style={{
                        transform: `rotate(${(value / 255) * 270 - 135}deg)`,
                        background: channelColor || '#4a9eff'
                      }}
                    />
                  </div>
                  {isActive && <div className="active-dot" style={{ background: channelColor }} />}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Clear Button */}
      {availableChannels.length > 0 && handleClearProgrammer && (
        <div className="programmer-section actions">
          <button
            className="clear-programmer-btn"
            onClick={handleClearProgrammer}
            title="Clear Programmer"
          >
            Clear
          </button>
        </div>
      )}

      {/* Record Mode Indicator */}
      {recordMode && (
        <div className="programmer-section record-indicator">
          <div className="record-badge">
            <span className="record-dot">●</span>
            REC
          </div>
        </div>
      )}
    </div>
  )
}

export default ProgrammerBar
