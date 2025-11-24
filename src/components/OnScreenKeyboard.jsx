import React, { useState, useEffect } from 'react';
import '../styles/OnScreenKeyboard.css';

const OnScreenKeyboard = ({ onInput, onClose, mode = 'numpad', target }) => {
  const [value, setValue] = useState('');

  // Initialize with target's current value
  useEffect(() => {
    if (target && target.value !== undefined) {
      setValue(target.value.toString());
    }
  }, [target]);

  const handleKeyPress = (key) => {
    if (key === 'backspace') {
      setValue(prev => prev.slice(0, -1));
    } else if (key === 'clear') {
      setValue('');
    } else if (key === 'enter') {
      // Call onInput callback - parent component will handle updating the input
      if (onInput) {
        onInput(value);
      }

      if (onClose) {
        onClose();
      }
    } else if (key === 'cancel') {
      if (onClose) {
        onClose();
      }
    } else {
      setValue(prev => prev + key);
    }
  };

  const numpadKeys = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
    ['0', '.', 'backspace']
  ];

  const keyboardKeys = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm', 'backspace']
  ];

  const keys = mode === 'numpad' ? numpadKeys : keyboardKeys;

  const getKeyLabel = (key) => {
    if (key === 'backspace') return '⌫';
    if (key === 'clear') return 'CLR';
    if (key === 'enter') return '✓';
    if (key === 'cancel') return '✕';
    return key;
  };

  const getKeyClass = (key) => {
    if (key === 'backspace') return 'backspace';
    if (key === 'clear') return 'clear';
    if (key === 'enter') return 'enter';
    if (key === 'cancel') return 'cancel';
    return '';
  };

  return (
    <div className="onscreen-keyboard-overlay">
      <div className="onscreen-keyboard">
        <div className="keyboard-header">
          <div className="keyboard-title">
            {mode === 'numpad' ? 'Number Pad' : 'Keyboard'}
          </div>
          <button
            className="keyboard-close"
            onClick={() => onClose && onClose()}
          >
            ✕
          </button>
        </div>

        <div className="keyboard-display">
          <input
            type="text"
            value={value}
            readOnly
            className="keyboard-input"
            placeholder="Enter value..."
          />
        </div>

        <div className={`keyboard-keys ${mode}`}>
          {keys.map((row, rowIndex) => (
            <div key={rowIndex} className="keyboard-row">
              {row.map((key, keyIndex) => (
                <button
                  key={keyIndex}
                  className={`keyboard-key ${getKeyClass(key)}`}
                  onClick={() => handleKeyPress(key)}
                >
                  {getKeyLabel(key)}
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className="keyboard-actions">
          <button
            className="keyboard-action-btn clear"
            onClick={() => handleKeyPress('clear')}
          >
            Clear
          </button>
          <button
            className="keyboard-action-btn cancel"
            onClick={() => handleKeyPress('cancel')}
          >
            Cancel
          </button>
          <button
            className="keyboard-action-btn enter"
            onClick={() => handleKeyPress('enter')}
          >
            Enter
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnScreenKeyboard;
