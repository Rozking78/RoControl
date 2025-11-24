import React, { useState } from 'react'
import '../../styles/views/ColorWindow.css'

const TOTAL_PRESETS = 999

function ColorWindow(props) {
  const {
    recordMode,
    encoderValues,
    applyPresetValues,
    setRecordMessage
  } = props

  const [presets, setPresets] = useState(() => {
    const saved = localStorage.getItem('dmx_color_window_presets')
    if (saved) {
      return JSON.parse(saved)
    }
    return Array(TOTAL_PRESETS).fill(null)
  })

  const handlePresetClick = (index) => {
    const preset = presets[index]

    if (recordMode) {
      // Record to this slot
      const newPreset = {
        name: `Color ${index + 1}`,
        encoderValues: { ...encoderValues },
        timestamp: Date.now()
      }

      const updated = [...presets]
      updated[index] = newPreset
      setPresets(updated)
      localStorage.setItem('dmx_color_window_presets', JSON.stringify(updated))

      if (setRecordMessage) {
        setRecordMessage(`Color Preset ${index + 1} recorded!`)
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
    localStorage.setItem('dmx_color_window_presets', JSON.stringify(updated))
  }

  const getPresetColor = (preset) => {
    const r = preset.encoderValues?.red || 0
    const g = preset.encoderValues?.green || 0
    const b = preset.encoderValues?.blue || 0
    return `rgb(${r}, ${g}, ${b})`
  }

  return (
    <div className="color-window">
      <div className="color-grid">
        {presets.map((preset, index) => (
          <div
            key={index}
            className={`color-slot ${preset ? 'has-data' : 'empty'} ${recordMode ? 'record-target' : ''}`}
            onClick={() => handlePresetClick(index)}
          >
            {preset ? (
              <>
                <div
                  className="color-preview"
                  style={{ background: getPresetColor(preset) }}
                />
                <div className="color-number">{index + 1}</div>
                {recordMode && (
                  <button
                    className="color-delete-btn"
                    onClick={(e) => handleDeletePreset(index, e)}
                  >
                    ✕
                  </button>
                )}
              </>
            ) : (
              <div className="color-empty-slot">
                <div className="color-slot-number">{index + 1}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default ColorWindow
