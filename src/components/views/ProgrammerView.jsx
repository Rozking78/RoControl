import React, { useEffect, useRef } from 'react'
import '../../styles/views/ProgrammerView.css'

function ProgrammerView({ appState }) {
  const parameterListRef = useRef(null)
  const {
    selectedFixtures = new Set(),
    availableChannels = [],
    encoderValues = {},
    focusedChannel = 0,
    setEncoderValue,
    setFocusedChannel,
    fixtures = [],
    activeParameters = new Set(),
    recordMode = false,
    handleClearProgrammer
  } = appState || {}

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
    return null
  }

  // Get icon for parameter
  const getParamIcon = (name) => {
    const nameLower = name.toLowerCase()
    if (nameLower.includes('dimmer') || nameLower.includes('intensity')) return '💡'
    if (nameLower.includes('red')) return '🔴'
    if (nameLower.includes('green')) return '🟢'
    if (nameLower.includes('blue')) return '🔵'
    if (nameLower.includes('white')) return '⚪'
    if (nameLower.includes('amber')) return '🟠'
    if (nameLower.includes('uv')) return '🟣'
    if (nameLower.includes('pan')) return '↔'
    if (nameLower.includes('tilt')) return '↕'
    if (nameLower.includes('focus')) return '🔍'
    if (nameLower.includes('zoom')) return '🔎'
    if (nameLower.includes('gobo')) return '⚙'
    if (nameLower.includes('strobe')) return '⚡'
    return '●'
  }

  // Get all active parameters
  const getActiveParams = () => {
    const params = []
    availableChannels.forEach((channel, index) => {
      const channelKey = channel.name.toLowerCase().replace(/\s+/g, '_')
      const value = encoderValues[channelKey]
      if (value !== undefined && value !== null) {
        params.push({
          key: channelKey,
          name: channel.name,
          value,
          color: getChannelColor(channel.name),
          icon: getParamIcon(channel.name),
          isActive: activeParameters.has(channelKey),
          isFocused: index === focusedChannel, // Track if this is the focused channel
          channelIndex: index
        })
      }
    })
    return params
  }

  const activeParams = getActiveParams()
  const selectedCount = selectedFixtures.size
  const selectedFixtureNames = fixtures
    .filter(f => selectedFixtures.has(f.id))
    .map(f => f.name)
    .slice(0, 3)

  // Handle clicking a parameter chip to focus it
  const handleParamClick = (channelIndex) => {
    if (setFocusedChannel) {
      setFocusedChannel(channelIndex)
    }
  }

  // Auto-scroll focused chip into view
  useEffect(() => {
    if (parameterListRef.current && focusedChannel !== undefined) {
      const focusedChip = parameterListRef.current.querySelector('.parameter-chip.focused')
      if (focusedChip) {
        focusedChip.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }
  }, [focusedChannel])

  return (
    <div className="programmer-view">
      {/* Programmer Info Bar - matches bottom bar style */}
      <div className={`programmer-info-bar ${recordMode ? 'record-mode' : ''}`}>
        {/* Fixture Selection Info */}
        <div className="prog-section fixture-info">
          <div className="section-label">Selection</div>
          <div className="fixture-count">
            {selectedCount > 0 ? (
              <>
                <span className="count-badge">{selectedCount}</span>
                <span className="fixture-names">
                  {selectedFixtureNames.join(', ')}
                  {selectedCount > 3 && ` +${selectedCount - 3} more`}
                </span>
              </>
            ) : (
              <span className="no-selection">No fixtures selected</span>
            )}
          </div>
        </div>

        {/* Active Parameters */}
        <div className="prog-section parameters">
          <div className="section-label">Active (D-Pad ◄►)</div>
          <div className="parameter-list" ref={parameterListRef}>
            {activeParams.length > 0 ? (
              activeParams.map((param) => (
                <div
                  key={param.key}
                  className={`parameter-chip ${param.isActive ? 'active' : 'inactive'} ${param.isFocused ? 'focused' : ''}`}
                  style={{ borderColor: param.isFocused ? '#4a9eff' : (param.color || '#333') }}
                  onClick={() => handleParamClick(param.channelIndex)}
                  title={`${param.name}: ${Math.round(param.value)} - Click to focus, D-Pad ↑↓ to adjust`}
                >
                  <span className="param-icon">{param.icon}</span>
                  <span className="param-label">{param.name}</span>
                  <span className="param-value">{Math.round(param.value)}</span>
                  {param.isFocused && <div className="focus-indicator-chip">◄</div>}
                  {param.isActive && !param.isFocused && <div className="active-indicator" style={{ background: param.color }} />}
                </div>
              ))
            ) : (
              <div className="no-params">Programmer empty</div>
            )}
          </div>
        </div>

        {/* Clear Button */}
        {activeParams.length > 0 && handleClearProgrammer && (
          <div className="prog-section actions">
            <button
              className="clear-programmer-btn"
              onClick={handleClearProgrammer}
              title="Clear Programmer"
            >
              Clear
            </button>
          </div>
        )}

        {/* Record Indicator */}
        {recordMode && (
          <div className="prog-section record-indicator">
            <div className="record-badge">
              <span className="record-dot">●</span>
              REC
            </div>
          </div>
        )}
      </div>

      {/* Encoder Grid */}
      <div className="encoder-grid">
        {selectedFixtures.size === 0 ? (
          <div className="programmer-empty">
            Select fixtures to see available controls
          </div>
        ) : availableChannels.length === 0 ? (
          <div className="programmer-empty">
            No common channels found
          </div>
        ) : (
          availableChannels.map((channel, index) => {
            const channelKey = channel.name.toLowerCase().replace(/\s+/g, '_')
            const value = encoderValues[channelKey] || 0
            const isFocused = index === focusedChannel
            const channelColor = getChannelColor(channel.name)

            return (
              <div
                key={channelKey}
                className="encoder"
                style={isFocused ? {
                  outline: '2px solid #4a9eff',
                  outlineOffset: '2px',
                  borderRadius: '4px',
                  background: 'rgba(74, 158, 255, 0.1)'
                } : {}}
              >
                <div className="encoder-label">
                  {channel.name}
                  {isFocused && <span className="focus-indicator">◄</span>}
                </div>
                <div
                  className="encoder-wheel"
                  onClick={() => {
                    setFocusedChannel(index)
                    const newVal = (value + 25.5) % 255
                    setEncoderValue(channelKey, newVal)
                  }}
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
                      ...(channelColor ? { background: channelColor } : {})
                    }}
                  />
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default ProgrammerView
