import React, { useState, useEffect } from 'react';
import '../styles/GroupHandleEditor.css';
import { GroupHandleMode } from '../utils/groupHandleManager';

/**
 * GroupHandleEditor - Edit group handle properties
 *
 * Allows editing of:
 * - Name
 * - Mode (inhibitive, additive, scaling, subtractive)
 * - Fixtures in group
 * - Priority
 * - Intensity (for scaling mode)
 */

const GroupHandleEditor = ({ groupHandle, groupHandleManager, fixtures, onClose, onSave }) => {
  const [name, setName] = useState(groupHandle?.name || '');
  const [mode, setMode] = useState(groupHandle?.mode || GroupHandleMode.INHIBITIVE);
  const [selectedFixtures, setSelectedFixtures] = useState(groupHandle?.fixtures || []);
  const [priority, setPriority] = useState(groupHandle?.priority || 50);
  const [intensity, setIntensity] = useState(groupHandle?.intensity || 100);

  const handleSave = () => {
    if (groupHandle) {
      groupHandle.name = name;
      groupHandle.mode = mode;
      groupHandle.fixtures = selectedFixtures;
      groupHandle.priority = priority;
      groupHandle.intensity = intensity;

      if (onSave) {
        onSave(groupHandle);
      }
    }
    onClose();
  };

  const toggleFixture = (fixtureId) => {
    if (selectedFixtures.includes(fixtureId)) {
      setSelectedFixtures(selectedFixtures.filter(id => id !== fixtureId));
    } else {
      setSelectedFixtures([...selectedFixtures, fixtureId]);
    }
  };

  const getModeDescription = (modeValue) => {
    switch (modeValue) {
      case GroupHandleMode.INHIBITIVE:
        return 'Reduces/blocks output - takes minimum value';
      case GroupHandleMode.ADDITIVE:
        return 'Adds to existing output - sums values';
      case GroupHandleMode.SCALING:
        return 'Scales output by intensity percentage';
      case GroupHandleMode.SUBTRACTIVE:
        return 'Subtracts from existing output';
      default:
        return '';
    }
  };

  const getModeIcon = (modeValue) => {
    switch (modeValue) {
      case GroupHandleMode.INHIBITIVE: return '🛑';
      case GroupHandleMode.ADDITIVE: return '➕';
      case GroupHandleMode.SCALING: return '📊';
      case GroupHandleMode.SUBTRACTIVE: return '➖';
      default: return '';
    }
  };

  return (
    <div className="group-handle-editor-overlay">
      <div className="group-handle-editor">
        <div className="editor-header">
          <h2>
            Edit Group Handle
            <span className="fixture-number">Fixture {groupHandle?.fixtureNumber}</span>
          </h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="editor-content">
          {/* Name */}
          <div className="form-group">
            <label>Name:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Group 1"
              className="name-input"
            />
          </div>

          {/* Mode Selection */}
          <div className="form-group">
            <label>Mode:</label>
            <div className="mode-selector">
              {Object.values(GroupHandleMode).map(modeValue => (
                <div
                  key={modeValue}
                  className={`mode-option ${mode === modeValue ? 'selected' : ''}`}
                  onClick={() => setMode(modeValue)}
                >
                  <div className="mode-icon">{getModeIcon(modeValue)}</div>
                  <div className="mode-name">{modeValue}</div>
                  <div className="mode-desc">{getModeDescription(modeValue)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Intensity (only for scaling mode) */}
          {mode === GroupHandleMode.SCALING && (
            <div className="form-group">
              <label>Intensity (%):</label>
              <div className="intensity-control">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={intensity}
                  onChange={(e) => setIntensity(parseInt(e.target.value))}
                  className="intensity-slider"
                />
                <span className="intensity-value">{intensity}%</span>
              </div>
            </div>
          )}

          {/* Priority */}
          <div className="form-group">
            <label>Priority:</label>
            <div className="priority-control">
              <input
                type="range"
                min="0"
                max="100"
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value))}
                className="priority-slider"
              />
              <span className="priority-value">{priority}</span>
              <span className="priority-hint">Higher = applies later</span>
            </div>
          </div>

          {/* Fixture Selection */}
          <div className="form-group fixtures-section">
            <label>Fixtures in Group:</label>
            <div className="fixtures-list">
              {fixtures
                .filter(f => !f.isGroupHandle)
                .map(fixture => (
                  <div
                    key={fixture.id}
                    className={`fixture-item ${selectedFixtures.includes(fixture.id) ? 'selected' : ''}`}
                    onClick={() => toggleFixture(fixture.id)}
                  >
                    <span className="fixture-checkbox">
                      {selectedFixtures.includes(fixture.id) ? '☑' : '☐'}
                    </span>
                    <span className="fixture-id">{fixture.id}</span>
                    <span className="fixture-name">{fixture.name}</span>
                  </div>
                ))}
            </div>
            <div className="fixtures-count">
              {selectedFixtures.length} fixture{selectedFixtures.length !== 1 ? 's' : ''} selected
            </div>
          </div>
        </div>

        <div className="editor-footer">
          <button className="primary-btn" onClick={handleSave}>
            Save Changes
          </button>
          <button className="secondary-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupHandleEditor;
