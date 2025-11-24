import React, { useState } from 'react';
import '../../styles/views/ProgrammerViewEnhanced.css';
import { FEATURE_SETS } from './FlexWindow';

function ProgrammerViewEnhanced({
  selectedFixtures,
  availableChannels,
  encoderValues,
  focusedChannel,
  setEncoderValue,
  setFocusedChannel,
  activeFeatureSet = 'color',
  setActiveFeatureSet,
  activeParameters = new Set(),
  markParameterActive
}) {
  const getChannelColor = (name) => {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('red')) return '#ff0000';
    if (nameLower.includes('green')) return '#00ff00';
    if (nameLower.includes('blue')) return '#0088ff';
    if (nameLower.includes('white')) return '#ffffff';
    if (nameLower.includes('amber')) return '#ffbf00';
    if (nameLower.includes('uv')) return '#8b00ff';
    if (nameLower.includes('cyan')) return '#00ffff';
    if (nameLower.includes('magenta')) return '#ff00ff';
    if (nameLower.includes('yellow')) return '#ffff00';
    return null;
  };

  // Filter channels by active feature set
  const getFilteredChannels = () => {
    if (!activeFeatureSet || activeFeatureSet === 'all') {
      return availableChannels;
    }

    const featureParams = FEATURE_SETS[activeFeatureSet]?.params || [];

    return availableChannels.filter(channel => {
      const channelKey = channel.name.toLowerCase().replace(/\s+/g, '_');
      return featureParams.includes(channelKey);
    });
  };

  const filteredChannels = getFilteredChannels();

  const handleEncoderChange = (channelKey, newValue) => {
    setEncoderValue(channelKey, newValue);

    // Mark this parameter as active
    if (markParameterActive) {
      markParameterActive(channelKey);
    }
  };

  return (
    <div className="programmer-view-enhanced">
      {/* Feature Set Tabs */}
      <div className="feature-tabs">
        {Object.entries(FEATURE_SETS).map(([key, featureSet]) => (
          <button
            key={key}
            className={`feature-tab ${activeFeatureSet === key ? 'active' : ''}`}
            onClick={() => setActiveFeatureSet && setActiveFeatureSet(key)}
          >
            <span className="tab-icon">{featureSet.icon}</span>
            <span className="tab-label">{featureSet.label}</span>
          </button>
        ))}
        <button
          className={`feature-tab ${activeFeatureSet === 'all' ? 'active' : ''}`}
          onClick={() => setActiveFeatureSet && setActiveFeatureSet('all')}
        >
          <span className="tab-icon">📋</span>
          <span className="tab-label">All</span>
        </button>
      </div>

      {/* Programmer Header */}
      <div className="programmer-header">
        <span className="fixture-count">
          {selectedFixtures.size} Fixture{selectedFixtures.size !== 1 ? 's' : ''} Selected
        </span>
        {activeParameters.size > 0 && (
          <span className="active-count">
            {activeParameters.size} active param{activeParameters.size !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Encoder Grid */}
      <div className="encoder-grid">
        {selectedFixtures.size === 0 ? (
          <div className="programmer-empty">
            Select fixtures to see available controls
          </div>
        ) : filteredChannels.length === 0 ? (
          <div className="programmer-empty">
            No {activeFeatureSet !== 'all' ? FEATURE_SETS[activeFeatureSet]?.label.toLowerCase() : ''} channels available
          </div>
        ) : (
          filteredChannels.map((channel, index) => {
            const channelKey = channel.name.toLowerCase().replace(/\s+/g, '_');
            const value = encoderValues[channelKey] || 0;
            const isFocused = index === focusedChannel;
            const isActive = activeParameters.has(channelKey);
            const channelColor = getChannelColor(channel.name);

            return (
              <div
                key={channelKey}
                className={`encoder ${isFocused ? 'focused' : ''} ${isActive ? 'active' : ''}`}
              >
                <div className="encoder-label">
                  {channel.name}
                  {isFocused && <span className="focus-indicator">◄</span>}
                  {isActive && <span className="active-indicator">●</span>}
                </div>
                <div
                  className="encoder-wheel"
                  onClick={() => {
                    setFocusedChannel(index);
                    const newVal = Math.round((value + 25.5) % 256);
                    handleEncoderChange(channelKey, newVal);
                  }}
                >
                  <div
                    className="encoder-value"
                    style={channelColor ? { color: channelColor } : {}}
                  >
                    {Math.round(value)}
                  </div>
                  <div
                    className="encoder-indicator"
                    style={{
                      transform: `rotate(${(value / 255) * 270 - 135}deg)`,
                      ...(channelColor ? { background: channelColor } : {})
                    }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default ProgrammerViewEnhanced;
