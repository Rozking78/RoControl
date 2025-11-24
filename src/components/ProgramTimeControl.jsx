import React, { useState } from 'react';
import '../styles/ProgramTimeControl.css';

/**
 * ProgramTimeControl - Program time button and input
 *
 * Allows user to set default fade time for programmer operations
 */

const ProgramTimeControl = ({ programTime, setProgramTime }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempTime, setTempTime] = useState(programTime || 0);

  // Quick time presets
  const QUICK_TIMES = [0, 0.5, 1, 3, 5, 10];

  const handleQuickTime = (time) => {
    setProgramTime(time);
    setTempTime(time);
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    setTempTime(programTime || 0);
  };

  const handleConfirmEdit = () => {
    setProgramTime(parseFloat(tempTime) || 0);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setTempTime(programTime || 0);
    setIsEditing(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleConfirmEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <div className="program-time-control">
      <div className="program-time-label">
        Program Time:
      </div>

      {isEditing ? (
        <div className="program-time-edit">
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
            className="program-time-input"
          />
          <span className="program-time-unit">s</span>
        </div>
      ) : (
        <div
          className="program-time-display"
          onClick={handleStartEdit}
          title="Click to edit program time"
        >
          <span className="program-time-value">{programTime?.toFixed(1) || '0.0'}</span>
          <span className="program-time-unit">s</span>
        </div>
      )}

      <div className="program-time-presets">
        {QUICK_TIMES.map(time => (
          <button
            key={time}
            className={`preset-btn ${programTime === time ? 'active' : ''}`}
            onClick={() => handleQuickTime(time)}
            title={`Set program time to ${time} seconds`}
          >
            {time}s
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProgramTimeControl;
