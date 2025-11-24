import React, { useState } from 'react'
import '../../styles/views/PositionWindow.css'

const TOTAL_PRESETS = 999

function PositionWindow(props) {
  const {
    recordMode,
    encoderValues,
    applyPresetValues,
    setRecordMessage
  } = props

  const [presets, setPresets] = useState(() => {
    const saved = localStorage.getItem('dmx_position_presets')
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
        name: `Position ${index + 1}`,
        encoderValues: { ...encoderValues },
        timestamp: Date.now()
      }

      const updated = [...presets]
      updated[index] = newPreset
      setPresets(updated)
      localStorage.setItem('dmx_position_presets', JSON.stringify(updated))

      if (setRecordMessage) {
        setRecordMessage(`Position Preset ${index + 1} recorded!`)
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
    localStorage.setItem('dmx_position_presets', JSON.stringify(updated))
  }

  return (
    <div className="position-window">
      <div className="position-grid">
        {presets.map((preset, index) => (
          <div
            key={index}
            className={`position-slot ${preset ? 'has-data' : 'empty'} ${recordMode ? 'record-target' : ''}`}
            onClick={() => handlePresetClick(index)}
          >
            {preset ? (
              <>
                <div className="position-number">{index + 1}</div>
                {recordMode && (
                  <button
                    className="position-delete-btn"
                    onClick={(e) => handleDeletePreset(index, e)}
                  >
                    ✕
                  </button>
                )}
              </>
            ) : (
              <div className="position-empty-slot">
                <div className="position-slot-number">{index + 1}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default PositionWindow
