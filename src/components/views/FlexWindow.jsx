import React, { useState, useEffect } from 'react';
import '../../styles/views/FlexWindow.css';

// Feature set definitions - maps feature sets to their parameters
const FEATURE_SETS = {
  color: {
    label: 'Color',
    icon: '🎨',
    params: ['red', 'green', 'blue', 'white', 'amber', 'uv', 'cyan', 'magenta', 'yellow']
  },
  intensity: {
    label: 'Intensity',
    icon: '💡',
    params: ['dimmer', 'strobe']
  },
  position: {
    label: 'Position',
    icon: '🎯',
    params: ['pan', 'pan_fine', 'tilt', 'tilt_fine']
  },
  focus: {
    label: 'Focus',
    icon: '🔍',
    params: ['focus', 'zoom', 'iris', 'frost']
  },
  gobo: {
    label: 'Gobo',
    icon: '⚙️',
    params: ['gobo', 'gobo_rotation', 'prism', 'prism_rotation']
  },
  groups: {
    label: 'Groups',
    icon: '👥',
    params: [] // Special case - handles fixture groups
  }
};

const FlexWindow = ({ appState = {} }) => {
  const {
    activeFeatureSet = 'color',
    recordMode = false,
    activeParameters = new Set(),
    encoderValues = {},
    onRecordPreset,
    setEncoderValue
  } = appState;

  // Preset storage per feature set
  const [presetsByFeatureSet, setPresetsByFeatureSet] = useState(() => {
    const saved = localStorage.getItem('dmx_flex_presets');
    return saved ? JSON.parse(saved) : {
      color: [
        { name: 'Red', values: { red: 255, green: 0, blue: 0 } },
        { name: 'Green', values: { red: 0, green: 255, blue: 0 } },
        { name: 'Blue', values: { red: 0, green: 0, blue: 255 } },
        { name: 'White', values: { red: 255, green: 255, blue: 255 } },
        null, null, null, null, null, null, null, null
      ],
      intensity: [
        { name: 'Full', values: { dimmer: 255 } },
        { name: '75%', values: { dimmer: 191 } },
        { name: '50%', values: { dimmer: 128 } },
        { name: '25%', values: { dimmer: 64 } },
        null, null, null, null, null, null, null, null
      ],
      position: [
        { name: 'Center', values: { pan: 128, tilt: 128 } },
        { name: 'Down', values: { pan: 128, tilt: 0 } },
        { name: 'Up', values: { pan: 128, tilt: 255 } },
        null, null, null, null, null, null, null, null, null
      ],
      focus: [
        { name: 'Tight', values: { focus: 200, zoom: 50 } },
        { name: 'Medium', values: { focus: 128, zoom: 128 } },
        { name: 'Wide', values: { focus: 50, zoom: 200 } },
        null, null, null, null, null, null, null, null, null
      ],
      gobo: [
        { name: 'Open', values: { gobo: 0 } },
        { name: 'Gobo 1', values: { gobo: 32 } },
        { name: 'Gobo 2', values: { gobo: 64 } },
        null, null, null, null, null, null, null, null, null
      ],
      groups: []
    };
  });

  // Save presets to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('dmx_flex_presets', JSON.stringify(presetsByFeatureSet));
  }, [presetsByFeatureSet]);

  const currentPresets = presetsByFeatureSet[activeFeatureSet] || [];
  const featureSetInfo = FEATURE_SETS[activeFeatureSet] || FEATURE_SETS.color;

  console.log('FlexWindow render:', {
    activeFeatureSet,
    currentPresetsLength: currentPresets.length,
    featureSetInfo,
    presetsByFeatureSet
  });

  const applyPreset = (preset) => {
    if (!preset || !preset.values) return;

    // Apply all values from the preset
    if (appState.applyPresetValues) {
      appState.applyPresetValues(preset.values);
    }
  };

  const recordPreset = (index) => {
    if (!recordMode) return;

    // Get the feature set's parameters
    const featureParams = FEATURE_SETS[activeFeatureSet]?.params || [];

    // Build preset values from ONLY active parameters that belong to this feature set
    const presetValues = {};
    let hasActiveParams = false;

    featureParams.forEach(param => {
      // Check BOTH conditions:
      // 1. Parameter belongs to this feature set
      // 2. Parameter is currently active (has been modified)
      if (activeParameters.has(param) && encoderValues[param] !== undefined) {
        presetValues[param] = encoderValues[param];
        hasActiveParams = true;
      }
    });

    // Only record if there are active parameters
    if (!hasActiveParams) {
      console.warn('No active parameters to record for feature set:', activeFeatureSet);
      return;
    }

    // Create the new preset
    const newPreset = {
      name: `${featureSetInfo.label} ${index + 1}`,
      values: presetValues
    };

    // Update presets for this feature set
    const newPresets = [...currentPresets];
    newPresets[index] = newPreset;

    setPresetsByFeatureSet({
      ...presetsByFeatureSet,
      [activeFeatureSet]: newPresets
    });

    // Callback to parent if provided
    if (onRecordPreset) {
      onRecordPreset(activeFeatureSet, index, newPreset);
    }
  };

  const clearPreset = (index, e) => {
    e.stopPropagation();

    const newPresets = [...currentPresets];
    newPresets[index] = null;

    setPresetsByFeatureSet({
      ...presetsByFeatureSet,
      [activeFeatureSet]: newPresets
    });
  };

  const getPresetValueSummary = (preset) => {
    if (!preset || !preset.values) return '';

    const values = Object.entries(preset.values)
      .map(([key, val]) => `${key.charAt(0).toUpperCase()}:${val}`)
      .join(' ');

    return values;
  };

  return (
    <div className="flex-window">
      <div className="flex-window-header">
        <div className="feature-indicator">
          <span className="feature-icon">{featureSetInfo.icon}</span>
          <span className="feature-label">{featureSetInfo.label} Presets</span>
        </div>
        {recordMode && (
          <div className="record-indicator-badge">
            <span className="record-dot">●</span> RECORDING
          </div>
        )}
      </div>

      <div className="flex-window-info">
        {recordMode ? (
          <p className="record-hint">
            Tap a preset slot to record current {featureSetInfo.label.toLowerCase()} values
          </p>
        ) : (
          <p className="recall-hint">
            Tap a preset to recall {featureSetInfo.label.toLowerCase()} values
          </p>
        )}
      </div>

      <div className="flex-presets-grid">
        {currentPresets.map((preset, idx) => (
          <div
            key={idx}
            className={`flex-preset-slot ${preset ? 'filled' : 'empty'} ${recordMode ? 'record-mode' : ''}`}
            onClick={() => recordMode ? recordPreset(idx) : applyPreset(preset)}
          >
            {preset ? (
              <>
                <div className="flex-preset-name">{preset.name}</div>
                <div className="flex-preset-values">{getPresetValueSummary(preset)}</div>
                {!recordMode && (
                  <button
                    className="flex-preset-clear"
                    onClick={(e) => clearPreset(idx, e)}
                    title="Clear preset"
                  >
                    ×
                  </button>
                )}
              </>
            ) : (
              <div className="flex-preset-empty">
                {recordMode ? (
                  <>
                    <span className="empty-icon">+</span>
                    <span>Record</span>
                  </>
                ) : (
                  <span className="empty-text">Empty</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {activeParameters.size > 0 && (
        <div className="flex-window-footer">
          <div className="active-params-display">
            Active: {Array.from(activeParameters).join(', ')}
          </div>
        </div>
      )}
    </div>
  );
};

export default FlexWindow;
export { FEATURE_SETS };
