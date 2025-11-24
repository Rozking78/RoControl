# FlexWindow & Enhanced Programmer Integration Guide

## Overview

This guide explains how to integrate the new FlexWindow, Enhanced Programmer, and Attribute Call Buttons into your DMX Controller application. These components implement the critical workflow features from your requirements.

---

## 🎯 What's New

### 1. **FlexWindow (F30)** ✅
- **Dynamic preset window** that follows the active feature set
- Automatically displays presets for Color, Intensity, Position, Focus, Gobo, or Groups
- Houses the preset recording function
- Implements **selective parameter recording** (only records active params in current feature set)

### 2. **Programmer Pro (Enhanced)** ✅
- Feature set tabs (Color, Intensity, Position, Focus, Gobo, Groups, All)
- Filtered parameter display based on active tab
- Active parameter tracking with visual indicators
- Focused channel highlighting

### 3. **Attribute Call Buttons** ✅
- Quick-access buttons to switch feature sets
- Visual feedback for active attribute
- Large touch-friendly buttons for Steam Deck

---

## 📊 State Management Requirements

To use these components, you need to add the following state to your `App.jsx`:

```javascript
// Add to existing state in App.jsx

const [activeFeatureSet, setActiveFeatureSet] = useState('color');
// Tracks which feature set is active: 'color', 'intensity', 'position', 'focus', 'gobo', 'groups', 'all'

const [activeParameters, setActiveParameters] = useState(new Set());
// Tracks which parameters have been modified (touched) by the user

const [recordMode, setRecordMode] = useState(false);
// Global record mode toggle

const [masterFaderValue, setMasterFaderValue] = useState(255);
// Master intensity fader (0-255)
```

---

## 🔧 Required Functions

Add these helper functions to your `App.jsx`:

```javascript
// Mark a parameter as active when user modifies it
const markParameterActive = (paramKey) => {
  setActiveParameters(prev => new Set([...prev, paramKey]));
};

// Clear active parameters (e.g., after recording or clearing programmer)
const clearActiveParameters = () => {
  setActiveParameters(new Set());
};

// Apply preset values to encoders
const applyPresetValues = (values) => {
  setEncoderValues(prev => ({
    ...prev,
    ...values
  }));

  // Mark these parameters as active
  Object.keys(values).forEach(key => markParameterActive(key));
};

// Toggle record mode
const toggleRecordMode = () => {
  setRecordMode(prev => !prev);
};
```

---

## 🎨 AppState Object

Update your `appState` prop to include all the new state and functions:

```javascript
const appState = {
  // Existing state
  fixtures,
  selectedFixtures,
  setSelectedFixtures,
  encoderValues,
  setEncoderValue,
  faderValues,
  setFaderValues,
  focusedChannel,
  setFocusedChannel,
  availableChannels,
  isBlackout,
  recordedCues,
  setRecordedCues,

  // NEW: Feature set state
  activeFeatureSet,
  setActiveFeatureSet,

  // NEW: Active parameters tracking
  activeParameters,
  markParameterActive,
  clearActiveParameters,

  // NEW: Record mode
  recordMode,
  setRecordMode,
  toggleRecordMode,

  // NEW: Master fader
  masterFaderValue,
  setMasterFaderValue,

  // NEW: Preset functions
  applyPresetValues,

  // ... existing functions
  handlePaletteClick,
  handleClearProgrammer,
  handleLocate,
  handleBlackout,
  handleAddCue,
  handleDeleteCue,
  handleRecallCue
};
```

---

## 🎹 Keyboard Shortcut Integration

Add a record key shortcut (recommended: R key or a gamepad button):

```javascript
useEffect(() => {
  const handleKeyPress = (e) => {
    if (e.key === 'r' || e.key === 'R') {
      toggleRecordMode();
    }

    // Clear programmer (e.g., ESC key)
    if (e.key === 'Escape') {
      clearActiveParameters();
      // Optionally clear encoder values too
    }
  };

  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, []);
```

---

## 🎮 Gamepad Integration

Map a gamepad button to toggle record mode:

```javascript
// In your gamepad polling function
if (gamepad.buttons[6].pressed && !lastRecordButtonState) {
  // Button 6 (or your chosen button) pressed
  toggleRecordMode();
}
lastRecordButtonState = gamepad.buttons[6].pressed;
```

---

## 📱 Master Fader Integration

Add the MasterFader component to your main App render:

```javascript
import MasterFader from './components/MasterFader';

// In your App return statement
return (
  <div className="app">
    {/* Existing UI */}
    <GridLayout layout={currentLayout} appState={appState} />

    {/* NEW: Master Fader */}
    <MasterFader
      value={masterFaderValue}
      onChange={setMasterFaderValue}
    />
  </div>
);
```

---

## 🎬 Typical Workflow

### Recording a Color Preset:

1. User selects fixtures
2. User clicks "Color" in Attribute Buttons (or it's already active)
3. Programmer Pro shows only color parameters (Red, Green, Blue, etc.)
4. User adjusts Red to 255 → `markParameterActive('red')` is called
5. User adjusts Green to 128 → `markParameterActive('green')` is called
6. User presses Record key (R) → `recordMode = true`
7. FlexWindow shows "Tap a preset slot to record"
8. User taps preset slot #5 in FlexWindow
9. **FlexWindow records ONLY**: `{ red: 255, green: 128 }`
   - Blue is NOT recorded (not active)
   - Pan/Tilt are NOT recorded (wrong feature set)
10. Preset is saved to slot #5
11. Record mode auto-disables

### Recalling a Preset:

1. User taps preset #5 in FlexWindow (not in record mode)
2. `applyPresetValues({ red: 255, green: 128 })` is called
3. Encoder values update
4. Parameters are marked as active
5. DMX output updates

---

## 🌐 Available Views in Context Menu

After integration, users can right-click any grid cell and select:

- **Programmer Pro** - Enhanced programmer with feature set tabs
- **FlexWindow** - Dynamic preset window
- **Attributes** - Attribute call buttons
- **Color Window** - Full color picker
- **Intensity** - Intensity control
- **Position** - Pan/Tilt control
- **Focus** - Focus/Zoom control
- **Gobo** - Gobo selection
- **Groups** - Fixture groups

---

## 🎯 Recommended Layout

### **Show Control Layout** (4x4 Grid):
```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│  Fixtures   │ Programmer  │ FlexWindow  │ Attributes  │
│             │    Pro      │             │             │
├─────────────┼─────────────┼─────────────┼─────────────┤
│   Color     │  Position   │   Focus     │    Gobo     │
│   Window    │             │             │             │
├─────────────┼─────────────┼─────────────┼─────────────┤
│ Intensity   │   Groups    │    Cues     │ Quick       │
│             │             │             │ Actions     │
├─────────────┼─────────────┼─────────────┼─────────────┤
│ Executors   │ Executors   │ Executors   │ Executors   │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

---

## 🧪 Testing the Integration

1. **Build the project**: `npm run build`
2. **Start the app**: `npm run tauri dev`
3. **Test Feature Set Switching**:
   - Click different tabs in Programmer Pro
   - Verify FlexWindow header updates
   - Verify only relevant parameters show
4. **Test Parameter Tracking**:
   - Modify a parameter (e.g., Red)
   - Verify blue dot appears on encoder
   - Verify "active" count updates
5. **Test Recording**:
   - Press R to enable record mode
   - Modify Red and Green (not Blue)
   - Tap a FlexWindow preset slot
   - Verify only Red and Green are saved
6. **Test Recall**:
   - Clear programmer (ESC)
   - Tap the saved preset
   - Verify Red and Green restore correctly

---

## ⚠️ Important Notes

### Selective Recording Logic

The preset recording ONLY saves parameters that meet **BOTH** conditions:

1. **Feature Set Match**: Parameter belongs to the active feature set
   - Color set: red, green, blue, white, amber, uv, cyan, magenta, yellow
   - Intensity set: dimmer, strobe
   - Position set: pan, pan_fine, tilt, tilt_fine
   - Focus set: focus, zoom, iris, frost
   - Gobo set: gobo, gobo_rotation, prism, prism_rotation

2. **Active Status**: Parameter is in the `activeParameters` Set
   - Added when user modifies the value
   - Persists until programmer is cleared

**Example**:
- Active feature set: Color
- Modified parameters: red (255), green (128), pan (100)
- **Recorded**: red, green (Color set + active)
- **NOT recorded**: pan (wrong feature set), blue (not active)

---

## 🚀 Next Steps

After integration:

1. Add record mode indicator to Quick Actions view
2. Create View Buttons (6 total) for layout recall
3. Implement View recording with confirmation
4. Add virtual intensity logic (scale RGB by master fader)
5. Implement Art-Net and sACN protocols
6. Add gamepad D-Pad navigation
7. Create on-screen numpad/keyboard

---

## 📄 Feature Set Definitions

Located in `src/components/views/FlexWindow.jsx`:

```javascript
const FEATURE_SETS = {
  color: {
    label: 'Color',
    icon: '🎨',
    params: ['red', 'green', 'blue', 'white', 'amber', 'uv', 'cyan', 'magenta', 'yellow']
  },
  intensity: {
    label: 'Intensity',
    icon: '💡',
    params: ['dimmer', 'strobe']
  },
  position: {
    label: 'Position',
    icon: '🎯',
    params: ['pan', 'pan_fine', 'tilt', 'tilt_fine']
  },
  focus: {
    label: 'Focus',
    icon: '🔍',
    params: ['focus', 'zoom', 'iris', 'frost']
  },
  gobo: {
    label: 'Gobo',
    icon: '⚙️',
    params: ['gobo', 'gobo_rotation', 'prism', 'prism_rotation']
  },
  groups: {
    label: 'Groups',
    icon: '👥',
    params: []
  }
};
```

You can modify this to match your fixture profiles.

---

## 💾 Persistent Storage

FlexWindow automatically saves presets to localStorage:
- Key: `dmx_flex_presets`
- Presets persist across sessions
- Organized by feature set

---

*Integration Guide - FlexWindow & Enhanced Programmer System*
*Build Status: ✅ Verified*
