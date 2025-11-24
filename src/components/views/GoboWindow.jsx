import React, { useState } from 'react'
import '../../styles/views/GoboWindow.css'

const TOTAL_PRESETS = 999

function GoboWindow(props) {
  const {
    recordMode,
    encoderValues,
    applyPresetValues,
    setRecordMessage
  } = props

  const [presets, setPresets] = useState(() => {
    const saved = localStorage.getItem('dmx_gobo_presets')
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
        name: `Gobo ${index + 1}`,
        encoderValues: { ...encoderValues },
        timestamp: Date.now()
      }

      const updated = [...presets]
      updated[index] = newPreset
      setPresets(updated)
      localStorage.setItem('dmx_gobo_presets', JSON.stringify(updated))

      if (setRecordMessage) {
        setRecordMessage(`Gobo Preset ${index + 1} recorded!`)
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
    localStorage.setItem('dmx_gobo_presets', JSON.stringify(updated))
  }

  return (
    <div className="gobo-window">
      <div className="gobo-grid">
        {presets.map((preset, index) => (
          <div
            key={index}
            className={`gobo-slot ${preset ? 'has-data' : 'empty'} ${recordMode ? 'record-target' : ''}`}
            onClick={() => handlePresetClick(index)}
          >
            {preset ? (
              <>
                <div className="gobo-number">{index + 1}</div>
                {recordMode && (
                  <button
                    className="gobo-delete-btn"
                    onClick={(e) => handleDeletePreset(index, e)}
                  >
                    ✕
                  </button>
                )}
              </>
            ) : (
              <div className="gobo-empty-slot">
                <div className="gobo-slot-number">{index + 1}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default GoboWindow
