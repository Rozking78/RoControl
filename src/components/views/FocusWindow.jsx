import React, { useState } from 'react'
import '../../styles/views/FocusWindow.css'

const TOTAL_PRESETS = 999

function FocusWindow(props) {
  const {
    recordMode,
    encoderValues,
    applyPresetValues,
    setRecordMessage
  } = props

  const [presets, setPresets] = useState(() => {
    const saved = localStorage.getItem('dmx_focus_presets')
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
        name: `Focus ${index + 1}`,
        encoderValues: { ...encoderValues },
        timestamp: Date.now()
      }

      const updated = [...presets]
      updated[index] = newPreset
      setPresets(updated)
      localStorage.setItem('dmx_focus_presets', JSON.stringify(updated))

      if (setRecordMessage) {
        setRecordMessage(`Focus Preset ${index + 1} recorded!`)
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
    localStorage.setItem('dmx_focus_presets', JSON.stringify(updated))
  }

  return (
    <div className="focus-window">
      <div className="focus-grid">
        {presets.map((preset, index) => (
          <div
            key={index}
            className={`focus-slot ${preset ? 'has-data' : 'empty'} ${recordMode ? 'record-target' : ''}`}
            onClick={() => handlePresetClick(index)}
          >
            {preset ? (
              <>
                <div className="focus-number">{index + 1}</div>
                {recordMode && (
                  <button
                    className="focus-delete-btn"
                    onClick={(e) => handleDeletePreset(index, e)}
                  >
                    ✕
                  </button>
                )}
              </>
            ) : (
              <div className="focus-empty-slot">
                <div className="focus-slot-number">{index + 1}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default FocusWindow
