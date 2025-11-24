import React from 'react';
import '../styles/MasterFader.css';

const MasterFader = ({ value = 255, onChange }) => {
  const percentage = Math.round((value / 255) * 100);

  const handleSliderChange = (e) => {
    if (onChange) {
      onChange(parseInt(e.target.value));
    }
  };

  const handleInputChange = (e) => {
    const newValue = Math.max(0, Math.min(255, parseInt(e.target.value) || 0));
    if (onChange) {
      onChange(newValue);
    }
  };

  const quickLevels = [
    { label: '100%', value: 255 },
    { label: '75%', value: 191 },
    { label: '50%', value: 128 },
    { label: '0%', value: 0 }
  ];

  return (
    <div className="master-fader">
      <div className="master-fader-header">
        <span className="master-fader-title">MASTER</span>
        <div className="master-fader-value">{percentage}%</div>
      </div>

      <div className="master-fader-slider-container">
        <input
          type="range"
          min="0"
          max="255"
          value={value}
          onChange={handleSliderChange}
          className="master-fader-slider"
          orient="vertical"
        />
        <div
          className="master-fader-track-fill"
          style={{ height: `${percentage}%` }}
        ></div>
      </div>

      <div className="master-fader-numeric">
        <input
          type="number"
          inputMode="numeric"
          min="0"
          max="255"
          value={value}
          onChange={handleInputChange}
          className="master-fader-input"
        />
      </div>

      <div className="master-fader-quick-levels">
        {quickLevels.map((level, idx) => (
          <button
            key={idx}
            className="quick-level-btn"
            onClick={() => onChange && onChange(level.value)}
          >
            {level.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MasterFader;
