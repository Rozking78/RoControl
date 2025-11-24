import React, { useState } from 'react';
import '../../styles/views/GroupsWindow.css';

const TOTAL_GROUPS = 999;

const GroupsWindow = (props) => {
  const { fixtures = [], selectedFixtures = [], setSelectedFixtures, recordMode = false, setRecordMessage } = props;

  const [groups, setGroups] = useState(() => {
    const saved = localStorage.getItem('dmx_groups')
    if (saved) {
      return JSON.parse(saved)
    }
    return Array(TOTAL_GROUPS).fill(null)
  });

  const handleGroupClick = (index) => {
    const group = groups[index];

    if (recordMode) {
      // Record to this slot
      if (selectedFixtures.length === 0) return;

      // Sort fixtures by X position (left to right) for proper ordering
      const sortedFixtures = [...selectedFixtures].sort((a, b) => {
        const fixtureA = fixtures.find(f => f.id === a);
        const fixtureB = fixtures.find(f => f.id === b);
        return (fixtureA?.position?.x || 0) - (fixtureB?.position?.x || 0);
      });

      const newGroup = {
        name: `Group ${index + 1}`,
        fixtures: sortedFixtures,
        timestamp: Date.now()
      };

      const updated = [...groups];
      updated[index] = newGroup;
      setGroups(updated);
      localStorage.setItem('dmx_groups', JSON.stringify(updated));

      if (setRecordMessage) {
        setRecordMessage(`Group ${index + 1} recorded!`);
      }
    } else if (group) {
      // Recall group
      if (group.fixtures && setSelectedFixtures) {
        setSelectedFixtures(group.fixtures);
      }
    }
  };

  const handleDeleteGroup = (index, e) => {
    e.stopPropagation();
    const updated = [...groups];
    updated[index] = null;
    setGroups(updated);
    localStorage.setItem('dmx_groups', JSON.stringify(updated));
  };

  return (
    <div className="groups-window">
      <div className="groups-grid">
        {groups.map((group, index) => (
          <div
            key={index}
            className={`groups-slot ${group ? 'has-data' : 'empty'} ${recordMode ? 'record-target' : ''}`}
            onClick={() => handleGroupClick(index)}
          >
            {group ? (
              <>
                <div className="groups-number">{index + 1}</div>
                <div className="groups-count">{group.fixtures.length} fix</div>
                {recordMode && (
                  <button
                    className="groups-delete-btn"
                    onClick={(e) => handleDeleteGroup(index, e)}
                  >
                    ✕
                  </button>
                )}
              </>
            ) : (
              <div className="groups-empty-slot">
                <div className="groups-slot-number">{index + 1}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GroupsWindow;
