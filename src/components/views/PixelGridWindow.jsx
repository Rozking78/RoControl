import React, { useState, useRef } from 'react';
import '../../styles/views/PixelGridWindow.css';

const PixelGridWindow = (props) => {
  const { fixtures = [], selectedFixtures = new Set(), setSelectedFixtures } = props;

  const [gridSize, setGridSize] = useState({ rows: 8, cols: 16 });
  const [fixturePositions, setFixturePositions] = useState(() => {
    const saved = localStorage.getItem('dmx_pixel_grid_positions');
    return saved ? JSON.parse(saved) : {};
  });

  const [draggedFixture, setDraggedFixture] = useState(null);
  const [showSaveGroupDialog, setShowSaveGroupDialog] = useState(false);
  const [groupName, setGroupName] = useState('');

  const gridRef = useRef(null);

  // Save positions to localStorage
  React.useEffect(() => {
    localStorage.setItem('dmx_pixel_grid_positions', JSON.stringify(fixturePositions));
  }, [fixturePositions]);

  const handleDragStart = (fixtureId, e) => {
    setDraggedFixture(fixtureId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (row, col, e) => {
    e.preventDefault();

    if (!draggedFixture) return;

    setFixturePositions(prev => ({
      ...prev,
      [draggedFixture]: { row, col }
    }));

    setDraggedFixture(null);
  };

  const handleCellClick = (row, col) => {
    // Find fixture at this position
    const fixtureId = Object.keys(fixturePositions).find(
      id => fixturePositions[id].row === row && fixturePositions[id].col === col
    );

    if (fixtureId && setSelectedFixtures) {
      // Toggle selection
      const newSelection = new Set(selectedFixtures);
      if (newSelection.has(parseInt(fixtureId))) {
        newSelection.delete(parseInt(fixtureId));
      } else {
        newSelection.add(parseInt(fixtureId));
      }
      setSelectedFixtures(newSelection);
    }
  };

  const getFixtureAtPosition = (row, col) => {
    const fixtureId = Object.keys(fixturePositions).find(
      id => fixturePositions[id].row === row && fixturePositions[id].col === col
    );

    if (!fixtureId) return null;

    return fixtures.find(f => f.id === parseInt(fixtureId));
  };

  const clearGrid = () => {
    if (window.confirm('Clear all fixture positions?')) {
      setFixturePositions({});
    }
  };

  const autoArrange = () => {
    const newPositions = {};
    const sortedFixtures = [...fixtures].sort((a, b) => a.id - b.id);

    sortedFixtures.forEach((fixture, index) => {
      const row = Math.floor(index / gridSize.cols);
      const col = index % gridSize.cols;
      newPositions[fixture.id] = { row, col };
    });

    setFixturePositions(newPositions);
  };

  const saveAsGroup = () => {
    // Get all fixtures in the grid, ordered left-to-right, top-to-bottom
    const gridFixtures = Object.entries(fixturePositions)
      .map(([id, pos]) => ({ id: parseInt(id), ...pos }))
      .sort((a, b) => {
        if (a.row === b.row) return a.col - b.col;
        return a.row - b.row;
      })
      .map(item => item.id);

    if (gridFixtures.length === 0) {
      alert('No fixtures in grid to save');
      return;
    }

    setShowSaveGroupDialog(true);
  };

  const confirmSaveGroup = () => {
    const gridFixtures = Object.entries(fixturePositions)
      .map(([id, pos]) => ({ id: parseInt(id), ...pos }))
      .sort((a, b) => {
        if (a.row === b.row) return a.col - b.col;
        return a.row - b.row;
      })
      .map(item => item.id);

    // Callback to parent to save group
    if (appState.createGroup) {
      appState.createGroup(groupName || 'Pixel Grid Layout', gridFixtures);
    }

    setShowSaveGroupDialog(false);
    setGroupName('');
  };

  // Unplaced fixtures
  const placedFixtureIds = new Set(Object.keys(fixturePositions).map(id => parseInt(id)));
  const unplacedFixtures = fixtures.filter(f => !placedFixtureIds.has(f.id));

  return (
    <div className="pixel-grid-window">
      <div className="pixel-grid-header">
        <h3>Pixel Grid Layout</h3>
        <div className="grid-controls">
          <button onClick={autoArrange} className="grid-control-btn" title="Auto arrange fixtures">
            Auto
          </button>
          <button onClick={clearGrid} className="grid-control-btn" title="Clear grid">
            Clear
          </button>
          <button onClick={saveAsGroup} className="grid-control-btn save" title="Save as Group">
            Save Group
          </button>
        </div>
      </div>

      <div className="pixel-grid-info">
        <span>{Object.keys(fixturePositions).length} fixtures placed</span>
        <span>•</span>
        <span>{selectedFixtures.size} selected</span>
      </div>

      {/* Main Grid */}
      <div className="pixel-grid-container">
        <div
          ref={gridRef}
          className="pixel-grid"
          style={{
            gridTemplateRows: `repeat(${gridSize.rows}, 1fr)`,
            gridTemplateColumns: `repeat(${gridSize.cols}, 1fr)`
          }}
        >
          {Array.from({ length: gridSize.rows * gridSize.cols }).map((_, index) => {
            const row = Math.floor(index / gridSize.cols);
            const col = index % gridSize.cols;
            const fixture = getFixtureAtPosition(row, col);
            const isSelected = fixture && selectedFixtures.has(fixture.id);

            return (
              <div
                key={index}
                className={`pixel-cell ${fixture ? 'occupied' : ''} ${isSelected ? 'selected' : ''}`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(row, col, e)}
                onClick={() => handleCellClick(row, col)}
              >
                {fixture && (
                  <div
                    className="fixture-pixel"
                    draggable
                    onDragStart={(e) => handleDragStart(fixture.id, e)}
                    title={`${fixture.name} (ID: ${fixture.id})`}
                  >
                    {fixture.id}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Unplaced Fixtures */}
      {unplacedFixtures.length > 0 && (
        <div className="unplaced-fixtures">
          <div className="unplaced-header">Unplaced Fixtures ({unplacedFixtures.length})</div>
          <div className="unplaced-list">
            {unplacedFixtures.map(fixture => (
              <div
                key={fixture.id}
                className="unplaced-fixture"
                draggable
                onDragStart={(e) => handleDragStart(fixture.id, e)}
                title={`Drag ${fixture.name} to grid`}
              >
                <span className="fixture-id">{fixture.id}</span>
                <span className="fixture-name">{fixture.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save Group Dialog */}
      {showSaveGroupDialog && (
        <div className="save-group-modal">
          <div className="modal-overlay" onClick={() => setShowSaveGroupDialog(false)}></div>
          <div className="modal-content">
            <h3>Save as Group</h3>
            <p>Fixtures will be ordered left-to-right, top-to-bottom for effect running.</p>
            <input
              type="text"
              placeholder="Group Name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="group-name-input"
              autoFocus
            />
            <div className="modal-actions">
              <button className="modal-btn save" onClick={confirmSaveGroup}>
                Save Group
              </button>
              <button className="modal-btn cancel" onClick={() => setShowSaveGroupDialog(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PixelGridWindow;
