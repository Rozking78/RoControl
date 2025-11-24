import React, { useEffect, useRef, useState } from 'react';
import '../styles/GamepadManager.css';

/**
 * GamepadManager - Handle Steam Deck gamepad input
 *
 * Features:
 * - D-Pad navigation with wraparound
 * - Button mapping
 * - Dedicated record key
 * - Analog stick support
 */

const GamepadManager = ({ appState, children }) => {
  const {
    recordMode,
    toggleRecordMode,
    setFocusedChannel,
    focusedChannel,
    availableChannels = [],
    handleBlackout,
    handleLocate,
    handleClearProgrammer,
    activeFeatureSet,
    setActiveFeatureSet
  } = appState;

  const [connectedGamepad, setConnectedGamepad] = useState(null);
  const [navigableElements, setNavigableElements] = useState([]);
  const [currentElementIndex, setCurrentElementIndex] = useState(0);

  const lastButtonStates = useRef({});
  const dpadRepeatTimer = useRef(null);
  const animationFrameId = useRef(null);

  // Gamepad button mapping (Steam Deck / Xbox controller layout)
  const BUTTON_MAP = {
    0: 'A',        // A button - Select/Confirm
    1: 'B',        // B button - Back/Cancel
    2: 'X',        // X button - Clear programmer
    3: 'Y',        // Y button - Locate
    4: 'LB',       // Left bumper
    5: 'RB',       // Right bumper - Record toggle
    6: 'LT',       // Left trigger
    7: 'RT',       // Right trigger
    8: 'Select',   // Select/View button
    9: 'Start',    // Start/Menu button
    12: 'DUp',     // D-Pad Up
    13: 'DDown',   // D-Pad Down
    14: 'DLeft',   // D-Pad Left
    15: 'DRight'   // D-Pad Right
  };

  const FEATURE_SETS = ['color', 'intensity', 'position', 'focus', 'gobo', 'groups', 'all'];

  // Scan DOM for navigable elements
  const scanNavigableElements = () => {
    const selectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '.encoder',
      '.preset-slot',
      '.view-button',
      '.attribute-call-btn'
    ];

    const elements = Array.from(document.querySelectorAll(selectors.join(', ')))
      .filter(el => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0; // Visible elements only
      });

    setNavigableElements(elements);
    return elements;
  };

  // Navigate to element
  const navigateToElement = (index, elements = navigableElements) => {
    if (elements.length === 0) return;

    // Wraparound
    let wrappedIndex = index % elements.length;
    if (wrappedIndex < 0) wrappedIndex = elements.length + wrappedIndex;

    setCurrentElementIndex(wrappedIndex);

    const element = elements[wrappedIndex];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('gamepad-focused');

      // Remove focus from other elements
      elements.forEach((el, i) => {
        if (i !== wrappedIndex) {
          el.classList.remove('gamepad-focused');
        }
      });
    }
  };

  // D-Pad navigation
  const handleDPadNavigation = (direction) => {
    const elements = scanNavigableElements();
    if (elements.length === 0) return;

    const currentElement = elements[currentElementIndex];
    if (!currentElement) {
      navigateToElement(0, elements);
      return;
    }

    const currentRect = currentElement.getBoundingClientRect();
    const currentX = currentRect.left + currentRect.width / 2;
    const currentY = currentRect.top + currentRect.height / 2;

    let bestElement = null;
    let bestDistance = Infinity;
    let bestIndex = -1;

    elements.forEach((element, index) => {
      if (index === currentElementIndex) return;

      const rect = element.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      const dx = x - currentX;
      const dy = y - currentY;

      // Check if element is in the right direction
      let inDirection = false;
      if (direction === 'up' && dy < -10) inDirection = true;
      if (direction === 'down' && dy > 10) inDirection = true;
      if (direction === 'left' && dx < -10) inDirection = true;
      if (direction === 'right' && dx > 10) inDirection = true;

      if (inDirection) {
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestElement = element;
          bestIndex = index;
        }
      }
    });

    if (bestIndex !== -1) {
      navigateToElement(bestIndex, elements);
    } else {
      // Wraparound: jump to opposite side
      if (direction === 'up') navigateToElement(elements.length - 1, elements);
      if (direction === 'down') navigateToElement(0, elements);
      if (direction === 'left') navigateToElement(currentElementIndex - 1, elements);
      if (direction === 'right') navigateToElement(currentElementIndex + 1, elements);
    }
  };

  // Activate current element
  const activateCurrentElement = () => {
    const element = navigableElements[currentElementIndex];
    if (!element) return;

    if (element.tagName === 'BUTTON') {
      element.click();
    } else if (element.tagName === 'INPUT') {
      element.focus();
    } else if (element.classList.contains('encoder')) {
      element.click();
    } else {
      element.click();
    }
  };

  // Handle button press
  const handleButtonPress = (buttonIndex) => {
    const button = BUTTON_MAP[buttonIndex];

    switch (button) {
      case 'A':
        activateCurrentElement();
        break;

      case 'B':
        // Back/Cancel - could close modals or go back
        break;

      case 'X':
        if (handleClearProgrammer) handleClearProgrammer();
        break;

      case 'Y':
        if (handleLocate) handleLocate();
        break;

      case 'RB':
        // Right bumper - Record toggle
        if (toggleRecordMode) toggleRecordMode();
        break;

      case 'LB':
        // Left bumper - Blackout toggle
        if (handleBlackout) handleBlackout();
        break;

      case 'DUp':
        handleDPadNavigation('up');
        break;

      case 'DDown':
        handleDPadNavigation('down');
        break;

      case 'DLeft':
        handleDPadNavigation('left');
        break;

      case 'DRight':
        handleDPadNavigation('right');
        break;

      default:
        break;
    }
  };

  // Cycle through feature sets with shoulder buttons
  const cycleFeatureSet = (direction) => {
    if (!setActiveFeatureSet) return;

    const currentIndex = FEATURE_SETS.indexOf(activeFeatureSet);
    let newIndex;

    if (direction === 'next') {
      newIndex = (currentIndex + 1) % FEATURE_SETS.length;
    } else {
      newIndex = (currentIndex - 1 + FEATURE_SETS.length) % FEATURE_SETS.length;
    }

    setActiveFeatureSet(FEATURE_SETS[newIndex]);
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

    // Check button presses
    gamepad.buttons.forEach((button, index) => {
      const wasPressed = lastButtonStates.current[index];
      const isPressed = button.pressed;

      // Button just pressed (rising edge)
      if (isPressed && !wasPressed) {
        handleButtonPress(index);
      }

      lastButtonStates.current[index] = isPressed;
    });

    // Analog sticks (for future use - parameter adjustment)
    // const leftStickX = gamepad.axes[0];
    // const leftStickY = gamepad.axes[1];
    // const rightStickX = gamepad.axes[2];
    // const rightStickY = gamepad.axes[3];

    animationFrameId.current = requestAnimationFrame(pollGamepad);
  };

  // Initialize gamepad polling
  useEffect(() => {
    // Start polling
    animationFrameId.current = requestAnimationFrame(pollGamepad);

    // Scan navigable elements on mount and periodically
    scanNavigableElements();
    const scanInterval = setInterval(scanNavigableElements, 1000);

    // Cleanup
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      clearInterval(scanInterval);
      if (dpadRepeatTimer.current) {
        clearTimeout(dpadRepeatTimer.current);
      }
    };
  }, []);

  // Update navigable elements when children change
  useEffect(() => {
    const observer = new MutationObserver(() => {
      scanNavigableElements();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => observer.disconnect();
  }, []);

  return (
    <>
      {children}

      {/* Gamepad Status Indicator */}
      {connectedGamepad && (
        <div className="gamepad-status-indicator">
          <span className="gamepad-icon">🎮</span>
          <span className="gamepad-name">{connectedGamepad.id.substring(0, 20)}</span>
        </div>
      )}
    </>
  );
};

export default GamepadManager;
