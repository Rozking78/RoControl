import React, { useState } from 'react'
import '../styles/LayoutConfig.css'

const VIEW_OPTIONS = [
  { value: 'fixtures', label: 'Fixtures' },
  { value: 'programmer', label: 'Programmer' },
  { value: 'palettes', label: 'Color Palettes' },
  { value: 'executors', label: 'Executors' },
  { value: 'quickActions', label: 'Quick Actions' },
  { value: 'channelGrid', label: 'Channel Grid' },
  { value: 'cues', label: 'Cues' },
  { value: 'empty', label: 'Empty' }
]

function LayoutConfig({ layout, onSave, onClose, savedLayouts, onLoadLayout, onDeleteLayout }) {
  const [editedLayout, setEditedLayout] = useState(JSON.parse(JSON.stringify(layout)))
  const [editingCell, setEditingCell] = useState(null)
  const [layoutName, setLayoutName] = useState(layout.name || '')

  const updateCell = (index, updates) => {
    const newCells = [...editedLayout.cells]
    newCells[index] = { ...newCells[index], ...updates }
    setEditedLayout({ ...editedLayout, cells: newCells })
  }

  const addCell = () => {
    const newCells = [...editedLayout.cells, {
      row: 0,
      col: 0,
      rowSpan: 1,
      colSpan: 1,
      view: 'empty'
    }]
    setEditedLayout({ ...editedLayout, cells: newCells })
  }

  const removeCell = (index) => {
    const newCells = editedLayout.cells.filter((_, i) => i !== index)
    setEditedLayout({ ...editedLayout, cells: newCells })
  }

  const updateGridSize = (field, value) => {
    setEditedLayout({ ...editedLayout, [field]: Math.max(1, Math.min(10, parseInt(value) || 1)) })
  }

  const handleSave = () => {
    onSave({ ...editedLayout, name: layoutName })
    onClose()
  }

  return (
    <div className="layout-config-modal">
      <div className="layout-config-content">
        <div className="layout-config-header">
          <h2>Configure Layout</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="layout-config-body">
          {/* Layout Name and Grid Size */}
          <div className="config-section">
            <h3>Layout Settings</h3>
            <div className="config-grid">
              <div className="config-group">
                <label>Layout Name:</label>
                <input
                  type="text"
                  value={layoutName}
                  onChange={(e) => setLayoutName(e.target.value)}
                  placeholder="My Custom Layout"
                />
              </div>
              <div className="config-group">
                <label>Grid Rows:</label>
                <input
                  type="number"
                  value={editedLayout.rows}
                  onChange={(e) => updateGridSize('rows', e.target.value)}
                  min="1"
                  max="10"
                />
              </div>
              <div className="config-group">
                <label>Grid Columns:</label>
                <input
                  type="number"
                  value={editedLayout.cols}
                  onChange={(e) => updateGridSize('cols', e.target.value)}
                  min="1"
                  max="10"
                />
              </div>
            </div>
          </div>

          {/* Cell Configuration */}
          <div className="config-section">
            <div className="section-header">
              <h3>Cells ({editedLayout.cells.length})</h3>
              <button className="btn-add" onClick={addCell}>+ Add Cell</button>
            </div>

            <div className="cells-list">
              {editedLayout.cells.map((cell, index) => (
                <div key={index} className="cell-config-item">
                  <div className="cell-config-header">
                    <span className="cell-number">Cell {index + 1}</span>
                    <button className="btn-remove" onClick={() => removeCell(index)}>Remove</button>
                  </div>

                  <div className="cell-config-grid">
                    <div className="config-group">
                      <label>View Type:</label>
                      <select
                        value={cell.view}
                        onChange={(e) => updateCell(index, { view: e.target.value })}
                      >
                        {VIEW_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="config-group">
                      <label>Row:</label>
                      <input
                        type="number"
                        value={cell.row}
                        onChange={(e) => updateCell(index, { row: parseInt(e.target.value) || 0 })}
                        min="0"
                        max={editedLayout.rows - 1}
                      />
                    </div>

                    <div className="config-group">
                      <label>Column:</label>
                      <input
                        type="number"
                        value={cell.col}
                        onChange={(e) => updateCell(index, { col: parseInt(e.target.value) || 0 })}
                        min="0"
                        max={editedLayout.cols - 1}
                      />
                    </div>

                    <div className="config-group">
                      <label>Row Span:</label>
                      <input
                        type="number"
                        value={cell.rowSpan}
                        onChange={(e) => updateCell(index, { rowSpan: parseInt(e.target.value) || 1 })}
                        min="1"
                        max={editedLayout.rows}
                      />
                    </div>

                    <div className="config-group">
                      <label>Col Span:</label>
                      <input
                        type="number"
                        value={cell.colSpan}
                        onChange={(e) => updateCell(index, { colSpan: parseInt(e.target.value) || 1 })}
                        min="1"
                        max={editedLayout.cols}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Saved Layouts */}
          {savedLayouts && savedLayouts.length > 0 && (
            <div className="config-section">
              <h3>Saved Layouts</h3>
              <div className="saved-layouts-list">
                {savedLayouts.map((savedLayout, index) => (
                  <div key={index} className="saved-layout-item">
                    <div className="saved-layout-info">
                      <strong>{savedLayout.name}</strong>
                      <small>{savedLayout.rows}x{savedLayout.cols} grid • {savedLayout.cells.length} cells</small>
                    </div>
                    <div className="saved-layout-actions">
                      <button
                        className="btn-load"
                        onClick={() => {
                          setEditedLayout(JSON.parse(JSON.stringify(savedLayout)))
                          setLayoutName(savedLayout.name)
                        }}
                      >
                        Load
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => onDeleteLayout(savedLayout.name)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="layout-config-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-save" onClick={handleSave}>Save & Apply</button>
        </div>
      </div>
    </div>
  )
}

export default LayoutConfig
