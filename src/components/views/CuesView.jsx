import React, { useState } from 'react'
import '../../styles/views/CuesView.css'

const TOTAL_CUES = 999

function CuesView(props) {
  const {
    recordMode,
    setRecordMessage,
    exitRecordMode,
    encoderValues,
    selectedFixtures,
    faderValues,
    setSelectedFixtures,
    setEncoderValues,
    setFaderValues
  } = props
  const [cues, setCues] = useState(() => {
    const saved = localStorage.getItem('dmx_cues')
    if (saved) {
      return JSON.parse(saved)
    }
    // Create 999 empty slots
    return Array(TOTAL_CUES).fill(null)
  })

  const handleCueClick = (index) => {
    const cue = cues[index]

    if (recordMode) {
      // Record to this slot
      const newCue = {
        name: `Cue ${index + 1}`,
        selectedFixtures: Array.from(selectedFixtures || []),
        encoderValues: { ...encoderValues },
        faderValues: [...(faderValues || [])],
        timestamp: Date.now()
      }

      const updated = [...cues]
      updated[index] = newCue
      setCues(updated)
      localStorage.setItem('dmx_cues', JSON.stringify(updated))

      if (setRecordMessage) {
        setRecordMessage(`Cue ${index + 1} recorded!`)
      }
    } else if (cue) {
      // Recall cue
      if (setSelectedFixtures && cue.selectedFixtures) {
        setSelectedFixtures(new Set(cue.selectedFixtures))
      }
      if (setEncoderValues && cue.encoderValues) {
        setEncoderValues(cue.encoderValues)
      }
      if (setFaderValues && cue.faderValues) {
        setFaderValues(cue.faderValues)
      }
    }
  }

  const handleDeleteCue = (index, e) => {
    e.stopPropagation()
    const updated = [...cues]
    updated[index] = null
    setCues(updated)
    localStorage.setItem('dmx_cues', JSON.stringify(updated))
  }

  return (
    <div className="cues-view">
      <div className="cues-grid">
        {cues.map((cue, index) => (
          <div
            key={index}
            className={`cue-slot ${cue ? 'has-data' : 'empty'} ${recordMode ? 'record-target' : ''}`}
            onClick={() => handleCueClick(index)}
          >
            {cue ? (
              <>
                <div className="cue-number">{index + 1}</div>
                <div className="cue-name">{cue.name}</div>
                <div className="cue-fixture-count">{cue.selectedFixtures?.length || 0}</div>
                {recordMode && (
                  <button
                    className="cue-delete-btn"
                    onClick={(e) => handleDeleteCue(index, e)}
                  >
                    ✕
                  </button>
                )}
              </>
            ) : (
              <div className="cue-empty-slot">
                <div className="cue-slot-number">{index + 1}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default CuesView
