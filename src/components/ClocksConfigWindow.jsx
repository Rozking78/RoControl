import React, { useState, useEffect } from 'react';
import '../styles/ClocksConfigWindow.css';

/**
 * ClocksConfigWindow - Configure and manage clocks
 *
 * Allows users to:
 * - View all active clocks
 * - Add new clocks (countdown, video, sunrise/sunset)
 * - Edit clock properties
 * - Remove clocks
 * - Save/load clock configurations
 */

const ClocksConfigWindow = ({ clocksManager, onClose }) => {
  const [clocks, setClocks] = useState([]);
  const [editingClock, setEditingClock] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    if (!clocksManager) return;

    // Load clocks
    updateClocksList();

    // Subscribe to clock updates
    const unsubscribe = clocksManager.subscribe((event, clock) => {
      if (event === 'add' || event === 'remove') {
        updateClocksList();
      }
    });

    return () => unsubscribe();
  }, [clocksManager]);

  const updateClocksList = () => {
    if (clocksManager) {
      setClocks(clocksManager.getAllClocks());
    }
  };

  const handleAddClock = (type, config) => {
    if (!clocksManager) return;

    switch (type) {
      case 'countdown':
        clocksManager.addCountdownTimer(config.duration, config.name);
        break;
      case 'sunrise':
      case 'sunset':
        clocksManager.addSunriseSunsetClocks(config.location);
        break;
      default:
        break;
    }

    setShowAddDialog(false);
    updateClocksList();
  };

  const handleRemoveClock = (clockId) => {
    if (clocksManager && confirm(`Remove clock ${clockId}?`)) {
      clocksManager.removeClock(clockId);
      updateClocksList();
    }
  };

  const handleEditClock = (clock) => {
    setEditingClock(clock);
  };

  const handleSaveEdit = () => {
    // Save changes to editing clock
    setEditingClock(null);
    updateClocksList();
  };

  const handleExportConfig = () => {
    if (!clocksManager) return;

    const config = clocksManager.exportConfig();
    const json = JSON.stringify(config, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clocks-config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getClockTypeIcon = (type) => {
    switch (type) {
      case 'tod': return '🕐';
      case 'timecode': return '⏱️';
      case 'countdown': return '⏳';
      case 'video': return '🎬';
      case 'sunrise': return '🌅';
      case 'sunset': return '🌇';
      default: return '🕐';
    }
  };

  const getClockTypeName = (type) => {
    switch (type) {
      case 'tod': return 'Time of Day';
      case 'timecode': return 'Timecode';
      case 'countdown': return 'Countdown Timer';
      case 'video': return 'Video Time';
      case 'sunrise': return 'Sunrise';
      case 'sunset': return 'Sunset';
      default: return type;
    }
  };

  return (
    <div className="clocks-config-window">
      <div className="window-header">
        <h2>Clocks Configuration</h2>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="window-content">
        <div className="clocks-list">
          {clocks.length === 0 ? (
            <div className="empty-state">
              <p>No clocks configured</p>
              <button onClick={() => setShowAddDialog(true)}>+ Add Clock</button>
            </div>
          ) : (
            clocks.map(clock => (
              <div key={clock.id} className={`clock-item ${clock.running ? 'running' : ''}`}>
                <div className="clock-icon">
                  {getClockTypeIcon(clock.type)}
                </div>

                <div className="clock-info">
                  <div className="clock-name">{clock.name}</div>
                  <div className="clock-details">
                    <span className="clock-id">Clock {clock.id}</span>
                    <span className="clock-type">{getClockTypeName(clock.type)}</span>
                  </div>
                </div>

                <div className="clock-value">
                  {clock.getFormattedValue()}
                </div>

                <div className="clock-actions">
                  {clock.type === 'countdown' && (
                    <>
                      {clock.running ? (
                        <button
                          className="action-btn stop"
                          onClick={() => clock.stop()}
                          title="Stop"
                        >
                          ⏸
                        </button>
                      ) : (
                        <button
                          className="action-btn start"
                          onClick={() => clock.start()}
                          title="Start"
                        >
                          ▶
                        </button>
                      )}
                      <button
                        className="action-btn reset"
                        onClick={() => clock.reset()}
                        title="Reset"
                      >
                        ↻
                      </button>
                    </>
                  )}

                  <button
                    className="action-btn edit"
                    onClick={() => handleEditClock(clock)}
                    title="Edit"
                  >
                    ✎
                  </button>

                  {clock.id !== 1 && clock.id !== 2 && (
                    <button
                      className="action-btn delete"
                      onClick={() => handleRemoveClock(clock.id)}
                      title="Remove"
                    >
                      🗑
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="window-footer">
        <button className="primary-btn" onClick={() => setShowAddDialog(true)}>
          + Add Clock
        </button>
        <button className="secondary-btn" onClick={handleExportConfig}>
          Export Config
        </button>
        <button className="secondary-btn" onClick={onClose}>
          Close
        </button>
      </div>

      {showAddDialog && (
        <AddClockDialog
          onAdd={handleAddClock}
          onCancel={() => setShowAddDialog(false)}
        />
      )}

      {editingClock && (
        <EditClockDialog
          clock={editingClock}
          onSave={handleSaveEdit}
          onCancel={() => setEditingClock(null)}
        />
      )}
    </div>
  );
};

const AddClockDialog = ({ onAdd, onCancel }) => {
  const [clockType, setClockType] = useState('countdown');
  const [config, setConfig] = useState({
    name: '',
    duration: 60,
    location: { lat: 0, lon: 0 }
  });

  const handleAdd = () => {
    onAdd(clockType, config);
  };

  return (
    <div className="dialog-overlay">
      <div className="dialog">
        <h3>Add Clock</h3>

        <div className="form-group">
          <label>Clock Type:</label>
          <select value={clockType} onChange={e => setClockType(e.target.value)}>
            <option value="countdown">Countdown Timer</option>
            <option value="sunrise">Sunrise/Sunset</option>
          </select>
        </div>

        {clockType === 'countdown' && (
          <>
            <div className="form-group">
              <label>Name:</label>
              <input
                type="text"
                value={config.name}
                onChange={e => setConfig({ ...config, name: e.target.value })}
                placeholder="Countdown Timer"
              />
            </div>
            <div className="form-group">
              <label>Duration (seconds):</label>
              <input
                type="number"
                value={config.duration}
                onChange={e => setConfig({ ...config, duration: parseFloat(e.target.value) })}
                min="0"
              />
            </div>
          </>
        )}

        {clockType === 'sunrise' && (
          <>
            <div className="form-group">
              <label>Latitude:</label>
              <input
                type="number"
                step="0.0001"
                value={config.location.lat}
                onChange={e => setConfig({
                  ...config,
                  location: { ...config.location, lat: parseFloat(e.target.value) }
                })}
              />
            </div>
            <div className="form-group">
              <label>Longitude:</label>
              <input
                type="number"
                step="0.0001"
                value={config.location.lon}
                onChange={e => setConfig({
                  ...config,
                  location: { ...config.location, lon: parseFloat(e.target.value) }
                })}
              />
            </div>
          </>
        )}

        <div className="dialog-actions">
          <button className="primary-btn" onClick={handleAdd}>Add</button>
          <button className="secondary-btn" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

const EditClockDialog = ({ clock, onSave, onCancel }) => {
  const [name, setName] = useState(clock.name);
  const [offset, setOffset] = useState(clock.offset / 1000);

  const handleSave = () => {
    clock.name = name;
    clock.offset = offset * 1000;
    onSave();
  };

  return (
    <div className="dialog-overlay">
      <div className="dialog">
        <h3>Edit Clock</h3>

        <div className="form-group">
          <label>Name:</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Offset (seconds):</label>
          <input
            type="number"
            step="0.1"
            value={offset}
            onChange={e => setOffset(parseFloat(e.target.value))}
          />
        </div>

        <div className="dialog-actions">
          <button className="primary-btn" onClick={handleSave}>Save</button>
          <button className="secondary-btn" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default ClocksConfigWindow;
