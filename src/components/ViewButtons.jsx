import React, { useState } from 'react';
import '../styles/ViewButtons.css';

const ViewButtons = ({ appState }) => {
  const {
    currentLayout,
    setCurrentLayout,
    recordMode = false,
    encoderValues = {},
    selectedFixtures = new Set(),
    activeFeatureSet = 'color',
    activeParameters = new Set()
  } = appState;

  const [savedViews, setSavedViews] = useState(() => {
    const saved = localStorage.getItem('dmx_saved_views');
    return saved ? JSON.parse(saved) : [
      { name: 'View 1', layout: null, state: null },
      { name: 'View 2', layout: null, state: null },
      { name: 'View 3', layout: null, state: null },
      { name: 'View 4', layout: null, state: null },
      { name: 'View 5', layout: null, state: null },
      { name: 'View 6', layout: null, state: null }
    ];
  });

  const [confirmOverwrite, setConfirmOverwrite] = useState(null);
  const [editingName, setEditingName] = useState(null);
  const [viewName, setViewName] = useState('');

  // Save views to localStorage whenever they change
  React.useEffect(() => {
    localStorage.setItem('dmx_saved_views', JSON.stringify(savedViews));
  }, [savedViews]);

  const recallView = (index) => {
    const view = savedViews[index];
    if (!view || !view.layout) return;

    // Restore layout
    if (setCurrentLayout && view.layout) {
      setCurrentLayout(view.layout);
    }

    // Restore encoder values
    if (appState.setEncoderValues && view.state?.encoderValues) {
      appState.setEncoderValues(view.state.encoderValues);
    }

    // Restore selected fixtures
    if (appState.setSelectedFixtures && view.state?.selectedFixtures) {
      appState.setSelectedFixtures(new Set(view.state.selectedFixtures));
    }

    // Restore active feature set
    if (appState.setActiveFeatureSet && view.state?.activeFeatureSet) {
      appState.setActiveFeatureSet(view.state.activeFeatureSet);
    }

    // Restore active parameters
    if (appState.setActiveParameters && view.state?.activeParameters) {
      appState.setActiveParameters(new Set(view.state.activeParameters));
    }
  };

  const startRecordView = (index) => {
    if (!recordMode) return;

    const view = savedViews[index];

    // If view exists, show confirmation
    if (view.layout) {
      setConfirmOverwrite(index);
    } else {
      // Record immediately if empty
      recordView(index);
    }
  };

  const recordView = (index) => {
    const newViews = [...savedViews];

    // Capture complete state
    const viewState = {
      layout: currentLayout,
      state: {
        encoderValues: { ...encoderValues },
        selectedFixtures: Array.from(selectedFixtures),
        activeFeatureSet,
        activeParameters: Array.from(activeParameters)
      }
    };

    newViews[index] = {
      name: newViews[index].name,
      ...viewState
    };

    setSavedViews(newViews);
    setConfirmOverwrite(null);
  };

  const clearView = (index, e) => {
    e.stopPropagation();

    const newViews = [...savedViews];
    newViews[index] = {
      name: `View ${index + 1}`,
      layout: null,
      state: null
    };

    setSavedViews(newViews);
  };

  const startEditName = (index, e) => {
    e.stopPropagation();
    setEditingName(index);
    setViewName(savedViews[index].name);
  };

  const saveViewName = (index) => {
    const newViews = [...savedViews];
    newViews[index].name = viewName || `View ${index + 1}`;
    setSavedViews(newViews);
    setEditingName(null);
    setViewName('');
  };

  const cancelEdit = () => {
    setEditingName(null);
    setViewName('');
  };

  return (
    <div className="view-buttons-container">
      <div className="view-buttons-header">
        <h3>View Recall</h3>
        {recordMode && (
          <div className="view-record-indicator">
            <span className="record-dot">●</span> REC
          </div>
        )}
      </div>

      <div className="view-buttons-info">
        {recordMode ? (
          <p className="hint record-hint">Tap a view button to save current layout and state</p>
        ) : (
          <p className="hint">Tap a view button to recall saved layout</p>
        )}
      </div>

      <div className="view-buttons-grid">
        {savedViews.map((view, index) => (
          <div key={index} className="view-button-wrapper">
            <button
              className={`view-button ${view.layout ? 'filled' : 'empty'} ${recordMode ? 'record-mode' : ''}`}
              onClick={() => recordMode ? startRecordView(index) : recallView(index)}
            >
              {editingName === index ? (
                <div className="view-name-edit" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={viewName}
                    onChange={(e) => setViewName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && saveViewName(index)}
                    className="view-name-input"
                    autoFocus
                  />
                  <div className="view-edit-actions">
                    <button onClick={() => saveViewName(index)} className="save-btn">✓</button>
                    <button onClick={cancelEdit} className="cancel-btn">✕</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="view-number">{index + 1}</div>
                  <div className="view-name">{view.name}</div>
                  {view.layout && (
                    <div className="view-layout-info">
                      {view.layout.rows}×{view.layout.cols} grid
                    </div>
                  )}
                  {!view.layout && recordMode && (
                    <div className="view-empty-label">Tap to Save</div>
                  )}
                  {!view.layout && !recordMode && (
                    <div className="view-empty-label">Empty</div>
                  )}
                </>
              )}
            </button>

            {view.layout && !recordMode && (
              <div className="view-actions">
                <button
                  className="view-action-btn edit"
                  onClick={(e) => startEditName(index, e)}
                  title="Rename view"
                >
                  ✎
                </button>
                <button
                  className="view-action-btn delete"
                  onClick={(e) => clearView(index, e)}
                  title="Clear view"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Confirmation Modal */}
      {confirmOverwrite !== null && (
        <div className="view-confirm-modal">
          <div className="modal-overlay" onClick={() => setConfirmOverwrite(null)}></div>
          <div className="modal-content">
            <h3>Overwrite View?</h3>
            <p>
              View "{savedViews[confirmOverwrite].name}" already contains a saved layout.
              <br />
              Do you want to overwrite it?
            </p>
            <div className="modal-actions">
              <button
                className="modal-btn confirm"
                onClick={() => recordView(confirmOverwrite)}
              >
                Yes, Overwrite
              </button>
              <button
                className="modal-btn cancel"
                onClick={() => setConfirmOverwrite(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="view-buttons-footer">
        <div className="view-tip">
          💡 Press Record (R) + View Button to save complete layout state
        </div>
      </div>
    </div>
  );
};

export default ViewButtons;
