import React, { useState, useRef, useEffect } from 'react'
import '../styles/FreeformLayout.css'

// Individual view components
import FixturesView from './views/FixturesView'
import ProgrammerView from './views/ProgrammerView'
import PalettesView from './views/PalettesView'
import ExecutorsView from './views/ExecutorsView'
import QuickActionsView from './views/QuickActionsView'
import ChannelGridView from './views/ChannelGridView'
import CuesView from './views/CuesView'
import ColorWindow from './views/ColorWindow'
import IntensityWindow from './views/IntensityWindow'
import PositionWindow from './views/PositionWindow'
import FocusWindow from './views/FocusWindow'
import GoboWindow from './views/GoboWindow'
import GroupsWindow from './views/GroupsWindow'
import FlexWindow from './views/FlexWindow'
import ProgrammerViewEnhanced from './views/ProgrammerViewEnhanced'
import AttributeCallButtons from './AttributeCallButtons'
import ViewButtons from './ViewButtons'
import PixelGridWindow from './views/PixelGridWindow'
import ProtocolSettings from './views/ProtocolSettings'

const VIEW_COMPONENTS = {
  fixtures: FixturesView,
  programmer: ProgrammerView,
  programmerEnhanced: ProgrammerViewEnhanced,
  palettes: PalettesView,
  executors: ExecutorsView,
  quickActions: QuickActionsView,
  channelGrid: ChannelGridView,
  cues: CuesView,
  colorWindow: ColorWindow,
  intensityWindow: IntensityWindow,
  positionWindow: PositionWindow,
  focusWindow: FocusWindow,
  goboWindow: GoboWindow,
  groupsWindow: GroupsWindow,
  flexWindow: FlexWindow,
  attributeButtons: AttributeCallButtons,
  viewButtons: ViewButtons,
  pixelGrid: PixelGridWindow,
  protocolSettings: ProtocolSettings,
}

const VIEW_LABELS = {
  fixtures: 'Fixtures',
  programmer: 'Programmer',
  programmerEnhanced: 'Programmer Pro',
  palettes: 'Color Palettes',
  executors: 'Executors',
  quickActions: 'Quick Actions',
  channelGrid: 'Channel Grid',
  cues: 'Cues',
  colorWindow: 'Color Window',
  intensityWindow: 'Intensity',
  positionWindow: 'Position',
  focusWindow: 'Focus',
  goboWindow: 'Gobo',
  groupsWindow: 'Groups',
  flexWindow: 'FlexWindow',
  attributeButtons: 'Attributes',
  viewButtons: 'View Recall',
  pixelGrid: 'Pixel Grid',
  protocolSettings: 'Protocol Settings',
}

function FreeformLayout({ appState, windows, onWindowsChange }) {
  const [contextMenu, setContextMenu] = useState(null)
  const [draggingWindow, setDraggingWindow] = useState(null)
  const [resizingWindow, setResizingWindow] = useState(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const containerRef = useRef(null)

  const handleContextMenu = (e) => {
    // Only show menu if clicking on the background
    if (e.target === containerRef.current || e.target.classList.contains('freeform-background')) {
      e.preventDefault()
      setContextMenu({
        x: e.clientX,
        y: e.clientY
      })
    }
  }

  const createWindow = (viewType) => {
    const newWindow = {
      id: Date.now(),
      view: viewType,
      x: contextMenu.x - 150,
      y: contextMenu.y - 100,
      width: 300,
      height: 250,
      zIndex: windows.length + 1
    }
    onWindowsChange([...windows, newWindow])
    setContextMenu(null)
  }

  const closeWindow = (windowId) => {
    onWindowsChange(windows.filter(w => w.id !== windowId))
  }

  const bringToFront = (windowId) => {
    const maxZ = Math.max(...windows.map(w => w.zIndex))
    onWindowsChange(windows.map(w =>
      w.id === windowId ? { ...w, zIndex: maxZ + 1 } : w
    ))
  }

  const handleMouseDown = (e, windowId, action) => {
    e.preventDefault()
    e.stopPropagation()
    bringToFront(windowId)

    const window = windows.find(w => w.id === windowId)
    if (!window) return

    if (action === 'drag') {
      setDraggingWindow(windowId)
      setDragOffset({
        x: e.clientX - window.x,
        y: e.clientY - window.y
      })
    } else if (action === 'resize') {
      setResizingWindow(windowId)
      setDragOffset({
        x: e.clientX,
        y: e.clientY,
        startWidth: window.width,
        startHeight: window.height
      })
    }
  }

  const handleMouseMove = (e) => {
    if (draggingWindow !== null) {
      const newX = Math.max(0, e.clientX - dragOffset.x)
      const newY = Math.max(0, e.clientY - dragOffset.y)
      onWindowsChange(windows.map(w =>
        w.id === draggingWindow ? { ...w, x: newX, y: newY } : w
      ))
    } else if (resizingWindow !== null) {
      const dx = e.clientX - dragOffset.x
      const dy = e.clientY - dragOffset.y
      const newWidth = Math.max(200, dragOffset.startWidth + dx)
      const newHeight = Math.max(150, dragOffset.startHeight + dy)
      onWindowsChange(windows.map(w =>
        w.id === resizingWindow ? { ...w, width: newWidth, height: newHeight } : w
      ))
    }
  }

  const handleMouseUp = () => {
    setDraggingWindow(null)
    setResizingWindow(null)
  }

  useEffect(() => {
    if (draggingWindow !== null || resizingWindow !== null) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [draggingWindow, resizingWindow, dragOffset])

  return (
    <div
      ref={containerRef}
      className="freeform-layout"
      onContextMenu={handleContextMenu}
    >
      <div className="freeform-background" />

      {/* Floating Windows */}
      {windows.map((window) => {
        const ViewComponent = VIEW_COMPONENTS[window.view]
        if (!ViewComponent) return null

        return (
          <div
            key={window.id}
            className={`freeform-window ${draggingWindow === window.id ? 'dragging' : ''}`}
            style={{
              left: window.x,
              top: window.y,
              width: window.width,
              height: window.height,
              zIndex: window.zIndex
            }}
          >
            <div
              className="freeform-window-header"
              onMouseDown={(e) => handleMouseDown(e, window.id, 'drag')}
            >
              <span className="freeform-window-title">
                {VIEW_LABELS[window.view]}
              </span>
              <button
                className="freeform-window-close"
                onClick={() => closeWindow(window.id)}
              >
                ✕
              </button>
            </div>
            <div className="freeform-window-content">
              <ViewComponent {...appState} />
            </div>
            <div
              className="freeform-resize-handle"
              onMouseDown={(e) => handleMouseDown(e, window.id, 'resize')}
            />
          </div>
        )
      })}

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div
            className="freeform-menu-overlay"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="freeform-context-menu"
            style={{
              left: contextMenu.x,
              top: contextMenu.y
            }}
          >
            <div className="freeform-menu-header">Create Window</div>
            {Object.entries(VIEW_LABELS).map(([key, label]) => (
              <div
                key={key}
                className="freeform-menu-item"
                onClick={() => createWindow(key)}
              >
                {label}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Instructions */}
      {windows.length === 0 && (
        <div className="freeform-instructions">
          <div className="freeform-instructions-content">
            <h3>Freeform Layout Mode</h3>
            <p>Right-click anywhere to create a window</p>
            <p>Drag window headers to move</p>
            <p>Drag bottom-right corner to resize</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default FreeformLayout
