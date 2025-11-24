import React, { useState, useEffect, useRef } from 'react'
import '../styles/GridLayout.css'

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
import VideoFixturePatch from './views/VideoFixturePatch'
import VideoOutputGrid from './views/VideoOutputGrid'

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
  videoFixturePatch: VideoFixturePatch,
  videoOutputGrid: VideoOutputGrid,
  empty: () => <div className="empty-view">Empty</div>
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
  videoFixturePatch: 'Video Patch',
  videoOutputGrid: 'Video Outputs',
  empty: 'Empty'
}

// Default empty freeform layout - blank canvas like MA3
const DEFAULT_LAYOUT = {
  name: 'Default',
  windows: [
    // Start completely empty - users can add windows via right-click anywhere
  ]
}

function GridLayout({ appState, editMode = false, onLayoutChange, externalLayout }) {
  // Use state for the layout so it can be modified in edit mode
  const [layout, setLayout] = useState(() => {
    const saved = localStorage.getItem('dmx_grid_layout')
    if (saved) {
      const parsed = JSON.parse(saved)
      // Ensure it has windows array (backwards compatibility)
      if (!parsed.windows) {
        return DEFAULT_LAYOUT
      }
      return parsed
    }
    return DEFAULT_LAYOUT
  })

  const windows = layout.windows || []
  const [contextMenu, setContextMenu] = useState(null)
  const [draggedWindow, setDraggedWindow] = useState(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [resizingWindow, setResizingWindow] = useState(null)
  const [longPressTimer, setLongPressTimer] = useState(null)
  const [touchStartPos, setTouchStartPos] = useState(null)
  const [longPressActive, setLongPressActive] = useState(false)
  const canvasRef = useRef(null)

  // When externalLayout is provided (view recall), use it
  useEffect(() => {
    if (externalLayout) {
      setLayout(externalLayout)
      localStorage.setItem('dmx_grid_layout', JSON.stringify(externalLayout))
    }
  }, [externalLayout])

  // Notify parent of layout changes
  useEffect(() => {
    if (onLayoutChange) {
      onLayoutChange(layout)
    }
  }, [layout, onLayoutChange])

  // Save layout changes to localStorage
  const saveLayout = (newLayout) => {
    setLayout(newLayout)
    localStorage.setItem('dmx_grid_layout', JSON.stringify(newLayout))
  }

  // Freeform canvas style - fills entire screen
  const canvasStyle = {
    position: 'relative',
    width: '100%',
    height: '100%',
    background: '#0a0a0a',
    overflow: 'hidden'
  }

  const handleCanvasContextMenu = (e) => {
    if (!editMode) return

    e.preventDefault()
    e.stopPropagation()

    // Get click position relative to canvas
    const rect = canvasRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      windowIndex: -1,
      canvasPos: { x: clickX, y: clickY }
    })
  }

  const handleWindowContextMenu = (e, windowIndex) => {
    if (!editMode) return

    e.preventDefault()
    e.stopPropagation()

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      windowIndex
    })
  }

  // Touch long-press support for context menu on canvas
  const handleCanvasTouchStart = (e) => {
    if (!editMode) return

    const touch = e.touches[0]
    setTouchStartPos({ x: touch.clientX, y: touch.clientY, time: Date.now() })
    setLongPressActive(true)

    const timer = setTimeout(() => {
      // Long press detected - show context menu
      const rect = canvasRef.current.getBoundingClientRect()
      const clickX = touch.clientX - rect.left
      const clickY = touch.clientY - rect.top

      setContextMenu({
        x: touch.clientX,
        y: touch.clientY,
        windowIndex: -1,
        canvasPos: { x: clickX, y: clickY }
      })

      // Vibrate to give feedback (if supported)
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }

      setLongPressActive(false)
    }, 500) // 500ms long-press duration

    setLongPressTimer(timer)
  }

  const handleCanvasTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
    setTouchStartPos(null)
    setLongPressActive(false)
  }

  const handleCanvasTouchMove = (e) => {
    // Cancel long-press if finger moves too much
    if (touchStartPos && longPressTimer) {
      const touch = e.touches[0]
      const deltaX = Math.abs(touch.clientX - touchStartPos.x)
      const deltaY = Math.abs(touch.clientY - touchStartPos.y)

      if (deltaX > 10 || deltaY > 10) {
        clearTimeout(longPressTimer)
        setLongPressTimer(null)
        setLongPressActive(false)
      }
    }
  }

  // Touch handlers for window header - supports both drag and context menu
  const handleWindowHeaderTouchStart = (e, windowIndex) => {
    if (!editMode) return
    if (e.target.classList.contains('resize-handle')) return

    const touch = e.touches[0]
    const touchData = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
      windowIndex,
      moved: false
    }
    setTouchStartPos(touchData)

    // Set timer for long-press (context menu)
    const timer = setTimeout(() => {
      if (touchStartPos && !touchStartPos.moved) {
        // Long-press detected - show context menu
        setContextMenu({
          x: touch.clientX,
          y: touch.clientY,
          windowIndex
        })

        if (navigator.vibrate) {
          navigator.vibrate(50)
        }

        // Cancel any potential drag
        setTouchStartPos(null)
      }
    }, 500) // 500ms for long-press

    setLongPressTimer(timer)
  }

  const handleWindowHeaderTouchMove = (e, windowIndex) => {
    if (!editMode || !touchStartPos || !canvasRef.current) return

    e.preventDefault() // Prevent scrolling while dragging
    const touch = e.touches[0]
    const deltaX = Math.abs(touch.clientX - touchStartPos.x)
    const deltaY = Math.abs(touch.clientY - touchStartPos.y)

    // If moved more than threshold, cancel long-press and start dragging
    if (deltaX > 10 || deltaY > 10) {
      if (longPressTimer) {
        clearTimeout(longPressTimer)
        setLongPressTimer(null)
      }

      // Mark as moved and start dragging
      if (touchStartPos && !touchStartPos.moved) {
        setTouchStartPos({ ...touchStartPos, moved: true })

        // Start dragging with correct offset calculation
        const window = windows[windowIndex]
        const rect = canvasRef.current.getBoundingClientRect()
        const touchXRelativeToCanvas = touchStartPos.x - rect.left
        const touchYRelativeToCanvas = touchStartPos.y - rect.top

        setDraggedWindow(windowIndex)
        setDragOffset({
          x: touchXRelativeToCanvas - window.x,
          y: touchYRelativeToCanvas - window.y
        })
      }
    }
  }

  const handleWindowHeaderTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
    setTouchStartPos(null)
  }

  const handleViewChange = (windowIndex, newView) => {
    const newWindows = [...windows]

    // If windowIndex is -1, we're adding a new window
    if (windowIndex === -1 && contextMenu.canvasPos) {
      const { x, y } = contextMenu.canvasPos
      newWindows.push({
        x,
        y,
        width: 400,
        height: 300,
        view: newView,
        id: Date.now() // Unique ID
      })
    } else {
      // Changing existing window
      newWindows[windowIndex] = { ...newWindows[windowIndex], view: newView }
    }

    saveLayout({ ...layout, windows: newWindows })
    setContextMenu(null)
  }

  const handleCloseWindow = (windowIndex) => {
    // Remove the window completely
    const newWindows = windows.filter((_, index) => index !== windowIndex)
    saveLayout({ ...layout, windows: newWindows })
  }

  // Unified pointer handlers for window dragging (mouse + touch)
  const handleWindowPointerDown = (e, windowIndex) => {
    if (!editMode) return
    if (e.target.classList.contains('resize-handle')) return // Don't drag if clicking resize handle

    // Don't start drag immediately on touch - wait to see if it's a long-press
    if (e.type === 'touchstart') {
      return // Long-press handler will be used for context menu
    }

    e.preventDefault()
    e.stopPropagation()

    const window = windows[windowIndex]
    const clientX = e.clientX || (e.touches && e.touches[0].clientX)
    const clientY = e.clientY || (e.touches && e.touches[0].clientY)

    setDraggedWindow(windowIndex)
    setDragOffset({
      x: clientX - window.x,
      y: clientY - window.y
    })
  }

  const handlePointerMove = (e) => {
    if (draggedWindow === null || !canvasRef.current) return

    const clientX = e.clientX || (e.touches && e.touches[0].clientX)
    const clientY = e.clientY || (e.touches && e.touches[0].clientY)

    const rect = canvasRef.current.getBoundingClientRect()
    const newX = clientX - rect.left - dragOffset.x
    const newY = clientY - rect.top - dragOffset.y

    const newWindows = [...windows]
    newWindows[draggedWindow] = {
      ...newWindows[draggedWindow],
      x: Math.max(0, Math.min(rect.width - newWindows[draggedWindow].width, newX)),
      y: Math.max(0, Math.min(rect.height - newWindows[draggedWindow].height, newY))
    }

    saveLayout({ ...layout, windows: newWindows })
  }

  const handlePointerUp = () => {
    setDraggedWindow(null)
    setResizingWindow(null)
  }

  // Listen for pointer events globally when dragging (supports both mouse and touch)
  useEffect(() => {
    if (draggedWindow !== null || resizingWindow !== null) {
      const moveHandler = (e) => {
        if (draggedWindow !== null) {
          handlePointerMove(e)
        } else if (resizingWindow !== null) {
          handleResizeMove(e)
        }
      }

      window.addEventListener('mousemove', moveHandler)
      window.addEventListener('touchmove', moveHandler, { passive: false })
      window.addEventListener('mouseup', handlePointerUp)
      window.addEventListener('touchend', handlePointerUp)

      return () => {
        window.removeEventListener('mousemove', moveHandler)
        window.removeEventListener('touchmove', moveHandler)
        window.removeEventListener('mouseup', handlePointerUp)
        window.removeEventListener('touchend', handlePointerUp)
      }
    }
  }, [draggedWindow, resizingWindow, dragOffset, windows])

  // Resize handler - start resize on pointer down
  const handleResizeStart = (e, windowIndex, edge) => {
    if (!editMode) return
    e.preventDefault()
    e.stopPropagation()

    const clientX = e.clientX || (e.touches && e.touches[0].clientX)
    const clientY = e.clientY || (e.touches && e.touches[0].clientY)

    setResizingWindow({
      index: windowIndex,
      edge,
      startX: clientX,
      startY: clientY,
      startWidth: windows[windowIndex].width,
      startHeight: windows[windowIndex].height
    })
  }

  // Resize handler - during resize drag
  const handleResizeMove = (e) => {
    if (!resizingWindow) return

    const clientX = e.clientX || (e.touches && e.touches[0].clientX)
    const clientY = e.clientY || (e.touches && e.touches[0].clientY)

    const deltaX = clientX - resizingWindow.startX
    const deltaY = clientY - resizingWindow.startY

    const newWindows = [...windows]
    const win = { ...newWindows[resizingWindow.index] }

    switch (resizingWindow.edge) {
      case 'right':
        win.width = Math.max(200, resizingWindow.startWidth + deltaX)
        break
      case 'bottom':
        win.height = Math.max(150, resizingWindow.startHeight + deltaY)
        break
      case 'corner':
        win.width = Math.max(200, resizingWindow.startWidth + deltaX)
        win.height = Math.max(150, resizingWindow.startHeight + deltaY)
        break
    }

    newWindows[resizingWindow.index] = win
    saveLayout({ ...layout, windows: newWindows })
  }

  // Render freeform windows
  const renderWindows = () => {
    return windows.map((win, index) => {
      const ViewComponent = VIEW_COMPONENTS[win.view] || VIEW_COMPONENTS.empty

      const windowStyle = {
        position: 'absolute',
        left: `${win.x}px`,
        top: `${win.y}px`,
        width: `${win.width}px`,
        height: `${win.height}px`,
        display: 'flex',
        flexDirection: 'column',
        background: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: '4px',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
      }

      return (
        <div
          key={win.id || index}
          className={`freeform-window ${editMode ? 'edit-mode' : ''} ${draggedWindow === index ? 'dragging' : ''}`}
          style={windowStyle}
          onContextMenu={(e) => handleWindowContextMenu(e, index)}
        >
          <div
            className="grid-cell-header"
            onMouseDown={(e) => handleWindowPointerDown(e, index)}
            onTouchStart={(e) => handleWindowHeaderTouchStart(e, index)}
            onTouchMove={(e) => handleWindowHeaderTouchMove(e, index)}
            onTouchEnd={handleWindowHeaderTouchEnd}
            style={{ cursor: editMode ? 'move' : 'default', touchAction: editMode ? 'none' : 'auto' }}
          >
            <span className="grid-cell-title">{VIEW_LABELS[win.view]}</span>
            <div className="grid-cell-buttons">
              <button
                className="grid-cell-close-btn"
                onClick={() => handleCloseWindow(index)}
                title="Close this window"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="grid-cell-content">
            <ViewComponent appState={appState} {...appState} />
          </div>

          {/* Resize handles */}
          {editMode && (
            <>
              <div
                className="resize-handle resize-right"
                onMouseDown={(e) => handleResizeStart(e, index, 'right')}
                onTouchStart={(e) => handleResizeStart(e, index, 'right')}
                title="Drag to resize right"
              />
              <div
                className="resize-handle resize-bottom"
                onMouseDown={(e) => handleResizeStart(e, index, 'bottom')}
                onTouchStart={(e) => handleResizeStart(e, index, 'bottom')}
                title="Drag to resize down"
              />
              <div
                className="resize-handle resize-corner"
                onMouseDown={(e) => handleResizeStart(e, index, 'corner')}
                onTouchStart={(e) => handleResizeStart(e, index, 'corner')}
                title="Drag to resize both"
              />
            </>
          )}
        </div>
      )
    })
  }

  return (
    <>
      <div
        ref={canvasRef}
        className={`freeform-canvas ${longPressActive ? 'long-press-active' : ''}`}
        style={canvasStyle}
        onContextMenu={handleCanvasContextMenu}
        onTouchStart={handleCanvasTouchStart}
        onTouchEnd={handleCanvasTouchEnd}
        onTouchMove={handleCanvasTouchMove}
      >
        {windows.length === 0 && editMode && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#444',
            fontSize: '16px',
            textAlign: 'center',
            pointerEvents: 'none'
          }}>
            Right-click or long-press to add a window
          </div>
        )}
        {renderWindows()}

        {/* Long-press visual indicator */}
        {longPressActive && touchStartPos && (
          <div
            className="long-press-indicator"
            style={{
              position: 'absolute',
              left: touchStartPos.x,
              top: touchStartPos.y,
              transform: 'translate(-50%, -50%)',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              border: '3px solid #4a9eff',
              background: 'rgba(74, 158, 255, 0.1)',
              animation: 'longPressPulse 0.5s ease-out',
              pointerEvents: 'none'
            }}
          />
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div
            className="context-menu-overlay"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="context-menu"
            style={{
              position: 'fixed',
              left: contextMenu.x,
              top: contextMenu.y,
              zIndex: 10000
            }}
          >
            <div className="context-menu-header">
              {contextMenu.windowIndex === -1 ? 'Add Window' : 'Change View'}
            </div>
            {Object.entries(VIEW_LABELS)
              .filter(([key]) => key !== 'empty') // Don't show empty option
              .map(([key, label]) => (
                <div
                  key={key}
                  className="context-menu-item"
                  onClick={() => handleViewChange(contextMenu.windowIndex, key)}
                >
                  {label}
                </div>
              ))}
          </div>
        </>
      )}
    </>
  )
}

export default GridLayout
