import React, { useState, useEffect } from 'react'
import '../../styles/views/ExecutorsView.css'

const TOTAL_EXECUTORS = 999

function ExecutorsView(props) {
  const {
    faderValues,
    setFaderValues,
    recordMode,
    encoderValues,
    selectedFixtures,
    applyPresetValues,
    setSelectedFixtures,
    setRecordMessage,
    exitRecordMode
  } = props
  const [executorData, setExecutorData] = useState(() => {
    const saved = localStorage.getItem('dmx_executor_data')
    if (saved) {
      return JSON.parse(saved)
    }
    // Create 999 empty slots
    return Array(TOTAL_EXECUTORS).fill(null)
  })

  const handleExecutorClick = (index) => {
    if (recordMode) {
      // Record current programmer state to this executor
      const data = {
        encoderValues: { ...encoderValues },
        selectedFixtures: Array.from(selectedFixtures || []),
        timestamp: Date.now()
      }
      const newData = [...executorData]
      newData[index] = data
      setExecutorData(newData)
      localStorage.setItem('dmx_executor_data', JSON.stringify(newData))
      if (setRecordMessage) {
        setRecordMessage(`Executor ${index + 1} recorded!`)
      }
    } else if (executorData[index] && applyPresetValues) {
      // Fire executor - apply its stored values
      applyPresetValues(executorData[index].encoderValues)
      if (setSelectedFixtures && executorData[index].selectedFixtures) {
        setSelectedFixtures(new Set(executorData[index].selectedFixtures))
      }
    }
  }

  const handleFaderChange = (index, e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const y = rect.bottom - e.clientY
    const percentage = Math.max(0, Math.min(1, y / rect.height))
    const newFaderValues = [...faderValues]
    newFaderValues[index] = percentage * 255
    setFaderValues(newFaderValues)
  }

  const clearExecutor = (index, e) => {
    e.stopPropagation()
    const newData = [...executorData]
    newData[index] = null
    setExecutorData(newData)
    localStorage.setItem('dmx_executor_data', JSON.stringify(newData))
  }

  return (
    <div className="executors-view">
      <div className="executors-grid">
        {executorData.map((data, index) => (
          <div
            key={index}
            className={`executor-slot ${data ? 'has-data' : 'empty'} ${recordMode ? 'record-target' : ''}`}
            onClick={() => handleExecutorClick(index)}
          >
            {data ? (
              <>
                <div className="executor-number">{index + 1}</div>
                <div className="executor-go-label">GO</div>
                {recordMode && (
                  <button
                    className="executor-delete-btn"
                    onClick={(e) => clearExecutor(index, e)}
                  >
                    ✕
                  </button>
                )}
              </>
            ) : (
              <div className="executor-empty-slot">
                <div className="executor-slot-number">{index + 1}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default ExecutorsView
