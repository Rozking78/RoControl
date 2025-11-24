import React from 'react'
import '../../styles/views/QuickActionsView.css'

function QuickActionsView({
  handleBlackout,
  handleLocate,
  handleClear,
  handleRecordCue,
  isRecording,
  recordMode,
  enterRecordMode,
  exitRecordMode
}) {
  return (
    <div className="quick-actions-view">
      <button className="action-button blackout" onClick={handleBlackout}>
        Black
      </button>
      <button className="action-button locate" onClick={handleLocate}>
        Locate
      </button>
      <button className="action-button clear" onClick={handleClear}>
        Clear
      </button>
      <button
        className={`action-button record ${recordMode ? 'recording' : ''}`}
        onClick={() => recordMode ? exitRecordMode() : enterRecordMode()}
        title="Toggle Record Mode - then click target to save"
      >
        {recordMode ? '● REC' : '○ Record'}
      </button>
    </div>
  )
}

export default QuickActionsView
