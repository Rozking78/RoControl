import React, { useState } from 'react';
import '../../styles/views/IntensityWindow.css';

const IntensityWindow = (props) => {
  const { encoderValues = {}, setEncoderValue, selectedFixtures = [], recordMode = false } = props;

  // Intensity presets state
  const [presets, setPresets] = useState([
    { name: 'Full', value: 255 },
    { name: '75%', value: 191 },
    { name: '50%', value: 128 },
    { name: '25%', value: 64 },
    { name: '10%', value: 26 },
    { name: 'Blackout', value: 0 },
    null, null, null, null, null, null, null, null, null, null
  ]);

  const currentIntensity = encoderValues.dimmer || 0;

  const handleIntensityChange = (value) => {
    if (setEncoderValue) {
      setEncoderValue('dimmer', value);
    }
  };

  const handleSliderChange = (e) => {
    const value = parseInt(e.target.value);
    handleIntensityChange(value);
  };

  const handleInputChange = (e) => {
    const value = Math.max(0, Math.min(255, parseInt(e.target.value) || 0));
    handleIntensityChange(value);
  };

  const applyPreset = (preset) => {
    if (preset) {
      handleIntensityChange(preset.value);
    }
  };

  const recordPreset = (index) => {
    if (recordMode && currentIntensity !== undefined) {
      const newPresets = [...presets];
      newPresets[index] = {
        name: `Int ${currentIntensity}`,
        value: currentIntensity
      };
      setPresets(newPresets);
    }
  };

  const clearPreset = (index, e) => {
    e.stopPropagation();
    const newPresets = [...presets];
    newPresets[index] = null;
    setPresets(newPresets);
  };

  const percentage = Math.round((currentIntensity / 255) * 100);

  return (
    <div className="intensity-window">
      {/* Main intensity control */}
      <div className="intensity-control-section">
        <div className="intensity-label">Master Intensity</div>

        {/* Visual indicator */}
        <div className="intensity-indicator">
          <div
            className="intensity-bar"
            style={{ height: `${percentage}%` }}
          ></div>
          <div className="intensity-value">{currentIntensity}</div>
          <div className="intensity-percentage">{percentage}%</div>
        </div>

        {/* Slider */}
        <div className="intensity-slider-container">
          <input
            type="range"
            min="0"
            max="255"
            value={currentIntensity}
            onChange={handleSliderChange}
            className="intensity-slider"
            orient="vertical"
          />
        </div>

        {/* Numeric input */}
        <div className="intensity-input-group">
          <label>DMX Value</label>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            max="255"
            value={currentIntensity}
            onChange={handleInputChange}
            className="intensity-input"
          />
        </div>

        {/* Quick percentage buttons */}
        <div className="intensity-quick-buttons">
          <button onClick={() => handleIntensityChange(255)} className="quick-btn">100%</button>
          <button onClick={() => handleIntensityChange(191)} className="quick-btn">75%</button>
          <button onClick={() => handleIntensityChange(128)} className="quick-btn">50%</button>
          <button onClick={() => handleIntensityChange(64)} className="quick-btn">25%</button>
          <button onClick={() => handleIntensityChange(0)} className="quick-btn">0%</button>
        </div>
      </div>

      {/* Presets grid */}
      <div className="intensity-presets-section">
        <div className="presets-header">
          <span>Intensity Presets</span>
          {recordMode && <span className="record-indicator">● REC</span>}
        </div>

        <div className="presets-grid">
          {presets.map((preset, idx) => (
            <div
              key={idx}
              className={`preset-slot ${preset ? 'filled' : 'empty'} ${recordMode ? 'record-mode' : ''}`}
              onClick={() => recordMode ? recordPreset(idx) : applyPreset(preset)}
            >
              {preset ? (
                <>
                  <div className="preset-name">{preset.name}</div>
                  <div className="preset-value">{preset.value}</div>
                  {!recordMode && (
                    <button
                      className="preset-clear"
                      onClick={(e) => clearPreset(idx, e)}
                    >×</button>
                  )}
                </>
              ) : (
                <div className="preset-empty-label">
                  {recordMode ? 'Tap to Record' : 'Empty'}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Info footer */}
      <div className="intensity-footer">
        {selectedFixtures.length > 0 ? (
          <span>{selectedFixtures.length} fixture{selectedFixtures.length !== 1 ? 's' : ''} selected</span>
        ) : (
          <span className="warning">No fixtures selected</span>
        )}
      </div>
    </div>
  );
};

export default IntensityWindow;
