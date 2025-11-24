# Backend Integration Guide

## Overview

This guide shows how to integrate all backend utilities (DMX Output Manager, Auto-Keyboard, GamepadManager, and Protocol Helpers) into App.jsx.

## Prerequisites

All frontend utilities are complete:
- ✅ `src/utils/virtualIntensity.js` - Virtual intensity for LED fixtures
- ✅ `src/utils/artnet.js` - Art-Net protocol helper
- ✅ `src/utils/sacn.js` - sACN protocol helper
- ✅ `src/utils/dmxOutputManager.js` - Coordinates multi-protocol output
- ✅ `src/utils/autoKeyboard.js` - Auto-triggers on-screen keyboard
- ✅ `src/components/GamepadManager.jsx` - Gamepad input handling
- ✅ `src/components/views/ProtocolSettings.jsx` - Protocol configuration UI

**Required:** Tauri backend commands for actual UDP transmission (see TAURI_BACKEND_REQUIREMENTS.md)

---

## Integration Steps

### 1. Import Required Utilities

Add these imports to `src/App.jsx`:

```javascript
// Protocol and DMX utilities
import { getDMXOutputManager } from './utils/dmxOutputManager';
import { ArtNetConfig } from './utils/artnet';
import { SACNConfig } from './utils/sacn';
import { initializeAutoKeyboard } from './utils/autoKeyboard';
import GamepadManager from './components/GamepadManager';
```

### 2. Add State Management

Add these state variables to App component:

```javascript
function App() {
  // Existing state...
  const [encoderValues, setEncoderValues] = useState({});
  const [fixtures, setFixtures] = useState([]);

  // NEW: Protocol configuration
  const [artnetConfig, setArtnetConfig] = useState(null);
  const [sacnConfig, setSacnConfig] = useState(null);

  // NEW: Master fader and blackout
  const [masterFaderValue, setMasterFaderValue] = useState(255);
  const [isBlackout, setIsBlackout] = useState(false);

  // NEW: Feature set and active parameters
  const [activeFeatureSet, setActiveFeatureSet] = useState('all');
  const [activeParameters, setActiveParameters] = useState(new Set());

  // NEW: Record mode
  const [recordMode, setRecordMode] = useState(false);

  // ... rest of component
}
```

### 3. Initialize DMX Output Manager

Add initialization effect:

```javascript
useEffect(() => {
  const dmxManager = getDMXOutputManager();

  // Start continuous output when protocols are configured
  if (artnetConfig?.enabled || sacnConfig?.enabled) {
    dmxManager.start({
      fixtures,
      encoderValues,
      masterFaderValue,
      artnetConfig,
      sacnConfig,
      isBlackout
    });
  } else {
    dmxManager.stop();
  }

  // Cleanup on unmount
  return () => {
    dmxManager.stop();
  };
}, [fixtures, encoderValues, masterFaderValue, artnetConfig, sacnConfig, isBlackout]);
```

### 4. Initialize Auto-Keyboard

Add auto-keyboard initialization:

```javascript
useEffect(() => {
  // Initialize auto-keyboard with OnScreenKeyboard callback
  const autoKeyboard = initializeAutoKeyboard((show, mode, inputElement) => {
    if (show) {
      // Show on-screen keyboard in specified mode
      setKeyboardMode(mode); // 'numpad' or 'keyboard'
      setShowKeyboard(true);
      setKeyboardTarget(inputElement);
    }
  });

  // Cleanup
  return () => {
    autoKeyboard.destroy();
  };
}, []);
```

### 5. Wrap App with GamepadManager

Modify your render to wrap content with GamepadManager:

```javascript
return (
  <GamepadManager appState={{
    recordMode,
    toggleRecordMode: () => setRecordMode(!recordMode),
    focusedChannel,
    setFocusedChannel,
    availableChannels: Object.keys(encoderValues),
    handleBlackout: () => setIsBlackout(!isBlackout),
    handleLocate: () => handleLocateFixtures(),
    handleClearProgrammer: () => setEncoderValues({}),
    activeFeatureSet,
    setActiveFeatureSet
  }}>
    <div className="App">
      {/* Existing app content */}

      {/* Master Fader */}
      <MasterFader
        value={masterFaderValue}
        onChange={setMasterFaderValue}
      />

      {/* On-Screen Keyboard */}
      {showKeyboard && (
        <OnScreenKeyboard
          mode={keyboardMode}
          target={keyboardTarget}
          onClose={() => setShowKeyboard(false)}
        />
      )}
    </div>
  </GamepadManager>
);
```

### 6. Connect Protocol Settings

Protocol configuration should update state:

```javascript
const handleProtocolUpdate = (type, config) => {
  if (type === 'artnet') {
    setArtnetConfig(config);
  } else if (type === 'sacn') {
    setSacnConfig(config);
  }
};

// Pass to ProtocolSettings view
<ProtocolSettings
  artnetConfig={artnetConfig}
  sacnConfig={sacnConfig}
  onArtNetChange={handleProtocolUpdate}
  onSACNChange={handleProtocolUpdate}
/>
```

---

## Feature Integration Examples

### Virtual Intensity Example

Fixtures without dimmer channels automatically scale RGB by master fader:

```javascript
import { applyVirtualIntensity } from './utils/virtualIntensity';

// For a fixture without dimmer
const { red, green, blue } = applyVirtualIntensity(
  255,  // red value
  128,  // green value
  64,   // blue value
  masterFaderValue,  // 0-255
  false  // hasDimmerChannel = false
);

// Result: RGB values scaled by master fader percentage
```

### Art-Net Transmission Example

```javascript
import { ArtNetConfig, sendArtNetUniverse } from './utils/artnet';

// Configure Art-Net
const artnetConfig = new ArtNetConfig({
  enabled: true,
  ipAddress: '2.255.255.255',  // broadcast
  mode: 'broadcast',
  universeStart: 0,
  universeRange: 4
});

// Send universe (requires Tauri backend)
const dmxData = new Uint8Array(512);
// ... fill dmxData
await sendArtNetUniverse(artnetConfig, 0, dmxData);
```

### sACN Transmission Example

```javascript
import { SACNConfig, sendSACNUniverse } from './utils/sacn';

// Configure sACN
const sacnConfig = new SACNConfig({
  enabled: true,
  mode: 'multicast',
  universeStart: 1,
  universeRange: 4,
  priority: 100,
  sourceName: 'Steam Deck DMX'
});

// Send universe (requires Tauri backend)
await sendSACNUniverse(sacnConfig, 1, dmxData);
```

### Gamepad Button Mapping

GamepadManager automatically handles:

- **A Button:** Activate focused element
- **B Button:** Back/Cancel
- **X Button:** Clear programmer
- **Y Button:** Locate selected fixtures
- **Left Bumper (LB):** Toggle blackout
- **Right Bumper (RB):** Toggle record mode
- **D-Pad:** Navigate UI elements with wraparound

### Auto-Keyboard Behavior

Auto-keyboard automatically shows when:
- User focuses any `<input type="text">`, `<input type="number">`, `<textarea>`
- Device is touch-enabled (Steam Deck)
- Input is not disabled/readonly

**Numpad Mode:** Shows for `type="number"`, `type="tel"`, or `inputMode="numeric"`
**Full Keyboard Mode:** Shows for text inputs and textareas

Opt-out: Add class `no-auto-keyboard` to any input

---

## Complete App.jsx Example

```javascript
import React, { useState, useEffect } from 'react';
import './App.css';

// Layouts and components
import GridLayout from './components/GridLayout';
import MasterFader from './components/MasterFader';
import OnScreenKeyboard from './components/OnScreenKeyboard';

// Backend utilities
import { getDMXOutputManager } from './utils/dmxOutputManager';
import { ArtNetConfig } from './utils/artnet';
import { SACNConfig } from './utils/sacn';
import { initializeAutoKeyboard } from './utils/autoKeyboard';
import GamepadManager from './components/GamepadManager';

function App() {
  // Layout and UI state
  const [currentLayout, setCurrentLayout] = useState(/* ... */);
  const [editMode, setEditMode] = useState(false);

  // DMX and fixture state
  const [fixtures, setFixtures] = useState([]);
  const [encoderValues, setEncoderValues] = useState({});
  const [focusedChannel, setFocusedChannel] = useState(null);

  // Protocol configuration
  const [artnetConfig, setArtnetConfig] = useState(null);
  const [sacnConfig, setSacnConfig] = useState(null);

  // Global controls
  const [masterFaderValue, setMasterFaderValue] = useState(255);
  const [isBlackout, setIsBlackout] = useState(false);

  // Feature sets and recording
  const [activeFeatureSet, setActiveFeatureSet] = useState('all');
  const [activeParameters, setActiveParameters] = useState(new Set());
  const [recordMode, setRecordMode] = useState(false);

  // On-screen keyboard
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [keyboardMode, setKeyboardMode] = useState('keyboard');
  const [keyboardTarget, setKeyboardTarget] = useState(null);

  // Initialize DMX Output Manager
  useEffect(() => {
    const dmxManager = getDMXOutputManager();

    if (artnetConfig?.enabled || sacnConfig?.enabled) {
      dmxManager.start({
        fixtures,
        encoderValues,
        masterFaderValue,
        artnetConfig,
        sacnConfig,
        isBlackout
      });
    } else {
      dmxManager.stop();
    }

    return () => dmxManager.stop();
  }, [fixtures, encoderValues, masterFaderValue, artnetConfig, sacnConfig, isBlackout]);

  // Initialize Auto-Keyboard
  useEffect(() => {
    const autoKeyboard = initializeAutoKeyboard((show, mode, inputElement) => {
      if (show) {
        setKeyboardMode(mode);
        setShowKeyboard(true);
        setKeyboardTarget(inputElement);
      }
    });

    return () => autoKeyboard.destroy();
  }, []);

  // Protocol update handlers
  const handleArtNetUpdate = (config) => setArtnetConfig(config);
  const handleSACNUpdate = (config) => setSacnConfig(config);

  // Fixture control handlers
  const handleLocateFixtures = () => {
    // Flash selected fixtures
    console.log('Locate fixtures');
  };

  const handleClearProgrammer = () => {
    setEncoderValues({});
    setActiveParameters(new Set());
  };

  // Prepare app state for child components
  const appState = {
    fixtures,
    encoderValues,
    setEncoderValues,
    focusedChannel,
    setFocusedChannel,
    activeFeatureSet,
    setActiveFeatureSet,
    activeParameters,
    setActiveParameters,
    recordMode,
    toggleRecordMode: () => setRecordMode(!recordMode),
    masterFaderValue,
    isBlackout,
    handleBlackout: () => setIsBlackout(!isBlackout),
    handleLocate: handleLocateFixtures,
    handleClearProgrammer,
    artnetConfig,
    sacnConfig,
    onArtNetChange: handleArtNetUpdate,
    onSACNChange: handleSACNUpdate
  };

  return (
    <GamepadManager appState={appState}>
      <div className="App">
        <header className="App-header">
          <h1>Steam Deck DMX Controller</h1>
          <button onClick={() => setEditMode(!editMode)}>
            {editMode ? 'Exit Edit Mode' : 'Edit Layout'}
          </button>
        </header>

        <main className="App-main">
          <GridLayout
            layout={currentLayout}
            appState={appState}
            editMode={editMode}
            onLayoutChange={setCurrentLayout}
          />
        </main>

        {/* Master Fader */}
        <MasterFader
          value={masterFaderValue}
          onChange={setMasterFaderValue}
          isBlackout={isBlackout}
        />

        {/* On-Screen Keyboard */}
        {showKeyboard && (
          <OnScreenKeyboard
            mode={keyboardMode}
            target={keyboardTarget}
            onClose={() => setShowKeyboard(false)}
          />
        )}
      </div>
    </GamepadManager>
  );
}

export default App;
```

---

## Testing Checklist

### Frontend Testing (No Backend Required)
- ✅ All components build without errors
- ✅ GamepadManager displays connection indicator
- ✅ D-Pad navigation highlights elements
- ✅ Auto-keyboard shows on input focus
- ✅ Protocol Settings UI allows configuration
- ✅ Master Fader updates state

### Backend Testing (Requires Tauri Implementation)
- ⏳ Art-Net packets sent via UDP
- ⏳ sACN packets sent via UDP
- ⏳ DMX output runs at 44Hz
- ⏳ Virtual intensity scales RGB correctly
- ⏳ Blackout zeros all output
- ⏳ Master fader affects all protocols

### Steam Deck Hardware Testing
- ⏳ Gamepad buttons recognized
- ⏳ D-Pad navigation smooth
- ⏳ On-screen keyboard appears automatically
- ⏳ Touch input works correctly
- ⏳ Performance at 1280x800 resolution

---

## Next Steps

1. **Implement Tauri Backend** (see TAURI_BACKEND_REQUIREMENTS.md)
2. **Test Protocol Output** with DMX/Art-Net monitoring tools
3. **Deploy to Steam Deck** for hardware testing
4. **Implement Video Windows** (F26, F27)
5. **Implement Web Remote API**

---

## Troubleshooting

### Auto-Keyboard Not Showing
- Check if device is touch-enabled: `navigator.maxTouchPoints > 0`
- Ensure input doesn't have `no-auto-keyboard` class
- Verify OnScreenKeyboard is rendered when `showKeyboard` is true

### Gamepad Not Detected
- Check browser console for gamepad connection logs
- Verify gamepad is connected before app loads
- Try disconnecting/reconnecting gamepad

### DMX Output Not Working
- Verify Tauri backend commands are implemented
- Check browser console for `window.__TAURI__` availability
- Ensure at least one protocol is enabled in settings
- Verify universe ranges don't exceed limits (Art-Net: 0-32767, sACN: 1-63999)

### Performance Issues
- Reduce DMX frame rate if needed (default 44Hz)
- Limit number of active fixtures
- Disable unused protocols

---

## File Locations

```
src/
├── utils/
│   ├── virtualIntensity.js      # Virtual intensity logic
│   ├── artnet.js                # Art-Net protocol
│   ├── sacn.js                  # sACN protocol
│   ├── dmxOutputManager.js      # Multi-protocol coordinator
│   └── autoKeyboard.js          # Auto-keyboard trigger
├── components/
│   ├── GamepadManager.jsx       # Gamepad input wrapper
│   ├── MasterFader.jsx          # Global intensity control
│   ├── OnScreenKeyboard.jsx     # Touch keyboard
│   └── views/
│       └── ProtocolSettings.jsx # Protocol configuration UI
└── styles/
    └── GamepadManager.css       # Gamepad focus styling
```
