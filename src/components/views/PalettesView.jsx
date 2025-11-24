import React, { useState, useEffect } from 'react'
import '../../styles/views/PalettesView.css'

const TOTAL_PRESETS = 999

function PalettesView(props) {
  const {
    applyColorPalette,
    recordMode,
    encoderValues,
    applyPresetValues,
    setRecordMessage,
    exitRecordMode
  } = props
  // Initialize 999 empty preset slots
  const [presets, setPresets] = useState(() => {
    const saved = localStorage.getItem('dmx_color_presets')
    if (saved) {
      return JSON.parse(saved)
    }
    // Create 999 empty slots
    return Array(TOTAL_PRESETS).fill(null)
  })

  const handlePresetClick = (index) => {
    const preset = presets[index]

    if (recordMode) {
      // Record to this slot
      const newPreset = {
        name: `Preset ${index + 1}`,
        encoderValues: { ...encoderValues },
        timestamp: Date.now()
      }

      const updated = [...presets]
      updated[index] = newPreset
      setPresets(updated)
      localStorage.setItem('dmx_color_presets', JSON.stringify(updated))

      if (setRecordMessage) {
        setRecordMessage(`Preset ${index + 1} recorded!`)
      }
    } else if (preset) {
      // Recall preset
      if (applyPresetValues) {
        applyPresetValues(preset.encoderValues)
      }
    }
  }

  const handleDeletePreset = (index, e) => {
    e.stopPropagation()
    const updated = [...presets]
    updated[index] = null
    setPresets(updated)
    localStorage.setItem('dmx_color_presets', JSON.stringify(updated))
  }

  const getPresetColor = (preset) => {
    const r = preset.encoderValues?.red || 0
    const g = preset.encoderValues?.green || 0
    const b = preset.encoderValues?.blue || 0
    return `rgb(${r}, ${g}, ${b})`
  }

  return (
    <div className="palettes-view">
      <div className="palette-grid">
        {presets.map((preset, index) => (
          <div
            key={index}
            className={`palette-button ${preset ? 'has-data' : 'empty'} ${recordMode ? 'record-target' : ''}`}
            onClick={() => handlePresetClick(index)}
          >
            {preset ? (
              <>
                <div
                  className="palette-color"
                  style={{
                    background: getPresetColor(preset),
                  }}
                />
                <div className="palette-label">{index + 1}</div>
                {recordMode && (
                  <button
                    className="preset-delete-btn"
                    onClick={(e) => handleDeletePreset(index, e)}
                  >
                    ✕
                  </button>
                )}
              </>
            ) : (
              <div className="palette-empty-slot">
                <div className="palette-number">{index + 1}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default PalettesView
