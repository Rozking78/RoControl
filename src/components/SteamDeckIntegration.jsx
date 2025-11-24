import React, { useEffect, useRef, useState } from 'react';
import '../styles/SteamDeckIntegration.css';

/**
 * SteamDeckIntegration - Native Steam Deck control integration
 *
 * Features:
 * - Window navigation (4, 9, 10-14, 20-22, 30-33, 40-42, 50-52)
 * - Cue execution and playback
 * - Command shortcuts via button combos
 * - Executor control via Steam Deck buttons
 * - Touchpad gestures for parameter control
 * - Quick access to commonly used functions
 */

const SteamDeckIntegration = ({ appState }) => {
  const {
    setCurrentView,
    executeCommand,
    executors = [],
    cues = [],
    activeWindow,
    setActiveWindow
  } = appState;

  const [connectedGamepad, setConnectedGamepad] = useState(null);
  const [buttonCombo, setButtonCombo] = useState([]);
  const [lastButtonStates, setLastButtonStates] = useState({});
  const [steamDeckMode, setSteamDeckMode] = useState('navigate'); // navigate, cue, executor, command

  const animationFrameId = useRef(null);
  const comboTimeout = useRef(null);

  // Steam Deck Button Mapping (extends base gamepad)
  const STEAMDECK_BUTTONS = {
    // Face buttons
    0: 'A',
    1: 'B',
    2: 'X',
    3: 'Y',

    // Bumpers & Triggers
    4: 'LB',
    5: 'RB',
    6: 'LT',
    7: 'RT',

    // System buttons
    8: 'View',      // Left menu button
    9: 'Menu',      // Right menu button (Three dots)
    10: 'L3',       // Left stick press
    11: 'R3',       // Right stick press

    // D-Pad
    12: 'DUp',
    13: 'DDown',
    14: 'DLeft',
    15: 'DRight',

    // Steam Deck specific
    16: 'Steam',    // Steam button
    17: 'QuickAccess', // ... button (Quick Access)

    // Back buttons (L4, L5, R4, R5)
    18: 'L4',
    19: 'L5',
    20: 'R4',
    21: 'R5'
  };

  // Window navigation mapping
  const WINDOW_MAP = {
    4: 'pixelGrid',          // Main Canvas Grid
    9: 'programmerEnhanced',  // Programmer
    10: 'colorWindow',        // Color
    11: 'intensityWindow',    // Intensity
    12: 'positionWindow',     // Position
    13: 'focusWindow',        // Focus
    14: 'goboWindow',         // Gobo
    20: 'cues',              // Cues
    21: 'executors',         // Executors
    22: 'palettes',          // Palettes
    30: 'fixtures',          // Fixtures
    31: 'groupsWindow',      // Groups
    32: 'channelGrid',       // Channel Grid
    33: 'videoFixturePatch', // Video Patch
    40: 'flexWindow',        // FlexWindow
    41: 'attributeButtons',  // Attributes
    42: 'viewButtons',       // View Recall
    50: 'quickActions',      // Quick Actions
    51: 'protocolSettings',  // Protocol
    52: 'videoOutputGrid'    // Video Outputs
  };

  // Quick window access via back buttons
  const QUICK_WINDOW_ACCESS = {
    'L4': 9,   // Programmer
    'L5': 20,  // Cues
    'R4': 21,  // Executors
    'R5': 40   // FlexWindow
  };

  // Command shortcuts via button combos
  const COMMAND_SHORTCUTS = {
    'View+A': 'blackout',
    'View+B': 'clear',
    'View+X': 'highlight',
    'View+Y': 'locate',
    'Menu+A': 'record cue',
    'Menu+B': 'update',
    'Menu+X': 'delete',
    'Menu+Y': 'copy',
    'View+DUp': 'intensity at full',
    'View+DDown': 'intensity at 0',
    'View+DLeft': 'prev',
    'View+DRight': 'next',
    'Menu+DUp': 'go+ cue',
    'Menu+DDown': 'go- cue',
    'Menu+LB': 'pause',
    'Menu+RB': 'resume'
  };

  // Execute window navigation
  const navigateToWindow = (windowId) => {
    const viewType = WINDOW_MAP[windowId];
    if (viewType && setCurrentView) {
      setCurrentView(viewType);
      setActiveWindow(windowId);
    }
  };

  // Execute cue by number
  const executeCue = (cueNumber) => {
    if (executeCommand) {
      executeCommand(`go cue ${cueNumber}`);
    }
  };

  // Execute executor by number
  const executeExecutor = (executorNumber, action = 'go') => {
    if (executeCommand) {
      executeCommand(`${action} exec ${executorNumber}`);
    }
  };

  // Handle button combinations
  const handleButtonCombo = (combo) => {
    const comboKey = combo.sort().join('+');
    const command = COMMAND_SHORTCUTS[comboKey];

    if (command) {
      if (executeCommand) {
        executeCommand(command);
      }
      return true;
    }
    return false;
  };

  // Handle single button press based on mode
  const handleButtonPress = (button) => {
    // Quick window access (back buttons)
    if (QUICK_WINDOW_ACCESS[button]) {
      navigateToWindow(QUICK_WINDOW_ACCESS[button]);
      return;
    }

    switch (steamDeckMode) {
      case 'navigate':
        handleNavigateMode(button);
        break;
      case 'cue':
        handleCueMode(button);
        break;
      case 'executor':
        handleExecutorMode(button);
        break;
      case 'command':
        handleCommandMode(button);
        break;
      default:
        handleNavigateMode(button);
    }
  };

  // Navigate mode - window navigation
  const handleNavigateMode = (button) => {
    switch (button) {
      case 'DUp':
      case 'DDown':
      case 'DLeft':
      case 'DRight':
        // Navigate between windows in grid
        navigateWindowGrid(button);
        break;
      case 'A':
        // Confirm/Enter current window
        break;
      case 'B':
        // Back to main grid
        navigateToWindow(4);
        break;
      case 'View':
        setSteamDeckMode('command');
        break;
      case 'Menu':
        setSteamDeckMode('cue');
        break;
      case 'LT':
        setSteamDeckMode('executor');
        break;
      case 'RT':
        setSteamDeckMode('navigate');
        break;
    }
  };

  // Cue mode - cue execution
  const handleCueMode = (button) => {
    switch (button) {
      case 'DUp':
        executeCue('next');
        break;
      case 'DDown':
        executeCue('prev');
        break;
      case 'A':
        if (executeCommand) executeCommand('go cue');
        break;
      case 'B':
        setSteamDeckMode('navigate');
        break;
      case 'X':
        if (executeCommand) executeCommand('pause cue');
        break;
      case 'Y':
        if (executeCommand) executeCommand('resume cue');
        break;
      case 'RB':
        if (executeCommand) executeCommand('record cue');
        break;
    }
  };

  // Executor mode - executor control
  const handleExecutorMode = (button) => {
    switch (button) {
      case 'DUp':
      case 'DDown':
      case 'DLeft':
      case 'DRight':
        // Navigate executors
        break;
      case 'A':
        // Execute selected executor
        if (executeCommand) executeCommand('go exec');
        break;
      case 'B':
        setSteamDeckMode('navigate');
        break;
      case 'X':
        if (executeCommand) executeCommand('pause exec');
        break;
      case 'Y':
        if (executeCommand) executeCommand('stop exec');
        break;
    }
  };

  // Command mode - quick commands
  const handleCommandMode = (button) => {
    switch (button) {
      case 'A':
        if (executeCommand) executeCommand('blackout');
        break;
      case 'B':
        setSteamDeckMode('navigate');
        break;
      case 'X':
        if (executeCommand) executeCommand('highlight');
        break;
      case 'Y':
        if (executeCommand) executeCommand('locate');
        break;
      case 'DUp':
        if (executeCommand) executeCommand('intensity at full');
        break;
      case 'DDown':
        if (executeCommand) executeCommand('intensity at 0');
        break;
    }
  };

  // Navigate window grid with D-Pad
  const navigateWindowGrid = (direction) => {
    const windowIds = Object.keys(WINDOW_MAP).map(Number).sort((a, b) => a - b);
    const currentIndex = windowIds.indexOf(activeWindow || 4);

    let newIndex = currentIndex;
    switch (direction) {
      case 'DUp':
        newIndex = Math.max(0, currentIndex - 1);
        break;
      case 'DDown':
        newIndex = Math.min(windowIds.length - 1, currentIndex + 1);
        break;
      case 'DLeft':
        newIndex = Math.max(0, currentIndex - 5);
        break;
      case 'DRight':
        newIndex = Math.min(windowIds.length - 1, currentIndex + 5);
        break;
    }

    if (newIndex !== currentIndex) {
      navigateToWindow(windowIds[newIndex]);
    }
  };

  // Touchpad support for parameter control (using axes)
  const handleTouchpadInput = (axes) => {
    // Left touchpad (axes 0, 1) - parameter adjustment
    const leftX = axes[0];
    const leftY = axes[1];

    // Right touchpad (axes 2, 3) - fine adjustment
    const rightX = axes[2];
    const rightY = axes[3];

    // Implement parameter control based on touchpad movement
    // This can be used for encoder control, fader control, etc.
  };

  // Poll gamepad state
  const pollGamepad = () => {
    const gamepads = navigator.getGamepads();
    const gamepad = gamepads[0] || gamepads[1] || gamepads[2] || gamepads[3];

    if (!gamepad) {
      setConnectedGamepad(null);
      animationFrameId.current = requestAnimationFrame(pollGamepad);
      return;
    }

    setConnectedGamepad(gamepad);

    // Track currently pressed buttons for combos
    const currentlyPressed = [];

    // Check button presses
    gamepad.buttons.forEach((button, index) => {
      const wasPressed = lastButtonStates[index];
      const isPressed = button.pressed;

      if (isPressed) {
        const buttonName = STEAMDECK_BUTTONS[index];
        if (buttonName) {
          currentlyPressed.push(buttonName);
        }
      }

      // Button just pressed (rising edge)
      if (isPressed && !wasPressed) {
        const buttonName = STEAMDECK_BUTTONS[index];
        if (buttonName) {
          setButtonCombo(prev => [...prev, buttonName]);

          // Set timeout to clear combo after 500ms
          if (comboTimeout.current) clearTimeout(comboTimeout.current);
          comboTimeout.current = setTimeout(() => {
            setButtonCombo([]);
          }, 500);
        }
      }

      lastButtonStates[index] = isPressed;
    });

    // Check for button combos (2 or more buttons pressed simultaneously)
    if (currentlyPressed.length >= 2) {
      if (!handleButtonCombo(currentlyPressed)) {
        // If no combo matched, handle individual buttons
        currentlyPressed.forEach(btn => handleButtonPress(btn));
      }
    } else if (currentlyPressed.length === 1) {
      // Single button press
      const wasPressed = Object.values(lastButtonStates).some(state => state);
      if (wasPressed && currentlyPressed.length === 1) {
        // Only handle if this is a fresh press, not continuation
        const index = gamepad.buttons.findIndex((btn, i) =>
          btn.pressed && STEAMDECK_BUTTONS[i] === currentlyPressed[0]
        );
        if (index >= 0 && !lastButtonStates[index]) {
          handleButtonPress(currentlyPressed[0]);
        }
      }
    }

    setLastButtonStates({ ...lastButtonStates });

    // Handle touchpad/analog stick input
    if (gamepad.axes.length >= 4) {
      handleTouchpadInput(gamepad.axes);
    }

    animationFrameId.current = requestAnimationFrame(pollGamepad);
  };

  // Initialize
  useEffect(() => {
    console.log('[SteamDeck] Integration initialized');
    animationFrameId.current = requestAnimationFrame(pollGamepad);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (comboTimeout.current) {
        clearTimeout(comboTimeout.current);
      }
    };
  }, []);

  return (
    <div className="steamdeck-integration">
      {/* Steam Deck Status HUD */}
      {connectedGamepad && (
        <div className="steamdeck-hud">
          <div className="steamdeck-status">
            <span className="steamdeck-icon">🎮</span>
            <span className="steamdeck-label">Steam Deck</span>
          </div>

          <div className="steamdeck-mode">
            <span className="mode-label">Mode:</span>
            <span className={`mode-value mode-${steamDeckMode}`}>
              {steamDeckMode.toUpperCase()}
            </span>
          </div>

          {activeWindow && (
            <div className="steamdeck-window">
              <span className="window-label">Window:</span>
              <span className="window-value">{activeWindow}</span>
            </div>
          )}

          {buttonCombo.length > 0 && (
            <div className="steamdeck-combo">
              <span className="combo-label">Combo:</span>
              <span className="combo-value">{buttonCombo.join('+')}</span>
            </div>
          )}
        </div>
      )}

      {/* Button mapping overlay (toggleable) */}
      <div className="steamdeck-help" style={{ display: 'none' }}>
        <h3>Steam Deck Controls</h3>
        <div className="help-section">
          <h4>Quick Access (Back Buttons)</h4>
          <ul>
            <li>L4 - Programmer (Window 9)</li>
            <li>L5 - Cues (Window 20)</li>
            <li>R4 - Executors (Window 21)</li>
            <li>R5 - FlexWindow (Window 40)</li>
          </ul>
        </div>
        <div className="help-section">
          <h4>Navigation Mode</h4>
          <ul>
            <li>D-Pad - Navigate windows</li>
            <li>A - Confirm/Enter</li>
            <li>B - Back to main</li>
            <li>View - Command mode</li>
            <li>Menu - Cue mode</li>
            <li>LT - Executor mode</li>
          </ul>
        </div>
        <div className="help-section">
          <h4>Cue Mode</h4>
          <ul>
            <li>D-Up/Down - Next/Prev cue</li>
            <li>A - Go cue</li>
            <li>X - Pause</li>
            <li>Y - Resume</li>
            <li>RB - Record</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SteamDeckIntegration;
