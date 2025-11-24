import React, { useState } from 'react';
import '../styles/CueExecutorTimeControl.css';

/**
 * CueExecutorTimeControl - Cue/Executor time button and input
 *
 * Allows user to set fade time for individual cues or executors
 */

const CueExecutorTimeControl = ({
  cueExecutorTime,
  setCueExecutorTime,
  targetType = 'cue', // 'cue' or 'executor'
  targetNumber = null
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempTime, setTempTime] = useState(cueExecutorTime || 0);

  // Quick time presets
  const QUICK_TIMES = [0, 1, 2, 3, 5, 10];

  const handleQuickTime = (time) => {
    setCueExecutorTime(time, targetType, targetNumber);
    setTempTime(time);
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    setTempTime(cueExecutorTime || 0);
  };

  const handleConfirmEdit = () => {
    setCueExecutorTime(parseFloat(tempTime) || 0, targetType, targetNumber);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setTempTime(cueExecutorTime || 0);
    setIsEditing(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleConfirmEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const getLabel = () => {
    if (targetNumber !== null) {
      return `${targetType === 'cue' ? 'Cue' : 'Exec'} ${targetNumber} Time:`;
    }
    return `${targetType === 'cue' ? 'Cue' : 'Executor'} Time:`;
  };

  return (
    <div className="cue-executor-time-control">
      <div className="cue-executor-time-label">
        {getLabel()}
      </div>

      {isEditing ? (
        <div className="cue-executor-time-edit">
          <input
            type="number"
            step="0.1"
            min="0"
            max="999"
            value={tempTime}
            onChange={(e) => setTempTime(e.target.value)}
            onKeyDown={handleKeyPress}
            onBlur={handleConfirmEdit}
            autoFocus
            className="cue-executor-time-input"
          />
          <span className="cue-executor-time-unit">s</span>
        </div>
      ) : (
        <div
          className={`cue-executor-time-display ${targetType}`}
          onClick={handleStartEdit}
          title={`Click to edit ${targetType} time`}
        >
          <span className="cue-executor-time-value">
            {cueExecutorTime !== null && cueExecutorTime !== undefined
              ? cueExecutorTime.toFixed(1)
              : '---'}
          </span>
          <span className="cue-executor-time-unit">s</span>
        </div>
      )}

      <div className="cue-executor-time-presets">
        {QUICK_TIMES.map(time => (
          <button
            key={time}
            className={`preset-btn ${cueExecutorTime === time ? 'active' : ''}`}
            onClick={() => handleQuickTime(time)}
            title={`Set ${targetType} time to ${time} seconds`}
          >
            {time}s
          </button>
        ))}
      </div>

      {cueExecutorTime === 0 && (
        <div className="snap-indicator" title="Snap (instant change)">
          SNAP
        </div>
      )}
    </div>
  );
};

export default CueExecutorTimeControl;
