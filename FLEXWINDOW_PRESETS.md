# FlexWindow Preset System (F30)

## Overview

The **FlexWindow** is a critical contextual parameter system that dynamically displays presets based on the active Feature Set Tab in the Programmer. It serves as the primary method for storing and recalling parameter values in RoControl.

## Architecture

### Component Structure

```
src/
├── components/
│   └── views/
│       ├── FlexWindow.jsx              # Main FlexWindow component
│       └── ProgrammerViewEnhanced.jsx  # Programmer with feature tabs
├── utils/
│   └── presetManager.js                # Centralized preset management
└── styles/
    └── views/
        └── FlexWindow.css              # FlexWindow styling
```

### Contextual Behavior

The FlexWindow **automatically switches** its displayed presets based on the active feature set:

| Active Feature Set | FlexWindow Displays |
|-------------------|---------------------|
| Color | Color Presets (Red, Green, Blue, White, etc.) |
| Position | Position Presets (Center, Down, Up, Left, Right) |
| Focus | Focus Presets (Tight, Medium, Wide) |
| Intensity | Intensity Presets (Full, 75%, 50%, 25%, etc.) |
| Gobo | Gobo Presets (Open, Gobo 1-4) |

## Feature Sets

### Defined Feature Sets

```javascript
{
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
  }
}
```

## Using FlexWindow

### Visual Interface

The FlexWindow displays:
- **Header** - Shows current feature set with icon
- **Record indicator** - Shows when in record mode
- **Preset grid** - 12 preset slots (3x4 or 4x3)
- **Active parameters** - Shows which parameters are active in footer

### Recording Presets (GUI)

1. **Select fixtures**
2. **Adjust parameters** (e.g., set red=255, green=0, blue=0)
3. **Press Record button** (R key or top bar)
4. **Click empty preset slot** in FlexWindow
5. Preset is stored with current parameter values

### Recalling Presets (GUI)

1. **Select fixtures**
2. **Click filled preset slot**
3. Values are applied to selected fixtures

## CLI Commands for FlexWindow

### Preset Recording

```bash
# Record current color values to color preset 1
store color 1

# Record with custom name
store color 1 "Warm White"

# Record position preset
store position 5

# Record intensity preset
store intensity 3 "Worklight"

# Record focus preset
store focus 2

# Record gobo preset
store gobo 4
```

**Note:** The active feature set automatically switches to match the preset type being stored.

### Preset Recall

```bash
# Recall color preset 1
color 1

# Recall position preset 5
position 5

# Recall intensity preset 3
intensity 3

# Recall focus preset 2
focus 2

# Recall gobo preset 4
gobo 4
```

**Shorthand notation:**
- `color 1` = Recall color preset #1
- No need to type "recall" or "preset"

### Feature Set Switching

```bash
# Switch to color feature set (shows color presets)
color

# Switch to position feature set
position

# Switch to focus feature set
focus

# Switch to intensity feature set
intensity

# Switch to gobo feature set
gobo
```

## Default Presets

### Color Presets (1-8 pre-populated)

| Slot | Name | Values |
|------|------|--------|
| 1 | Red | R:255 G:0 B:0 |
| 2 | Green | R:0 G:255 B:0 |
| 3 | Blue | R:0 G:0 B:255 |
| 4 | White | R:255 G:255 B:255 |
| 5 | Cyan | R:0 G:255 B:255 |
| 6 | Magenta | R:255 G:0 B:255 |
| 7 | Yellow | R:255 G:255 B:0 |
| 8 | Orange | R:255 G:128 B:0 |
| 9-12 | Empty | - |

### Intensity Presets (1-6 pre-populated)

| Slot | Name | Value |
|------|------|-------|
| 1 | Full | Dimmer:255 |
| 2 | 75% | Dimmer:191 |
| 3 | 50% | Dimmer:128 |
| 4 | 25% | Dimmer:64 |
| 5 | 10% | Dimmer:26 |
| 6 | Blackout | Dimmer:0 |
| 7-12 | Empty | - |

### Position Presets (1-5 pre-populated)

| Slot | Name | Values |
|------|------|--------|
| 1 | Center | Pan:128 Tilt:128 |
| 2 | Down Center | Pan:128 Tilt:0 |
| 3 | Up Center | Pan:128 Tilt:255 |
| 4 | Left Center | Pan:0 Tilt:128 |
| 5 | Right Center | Pan:255 Tilt:128 |
| 6-12 | Empty | - |

### Focus Presets (1-3 pre-populated)

| Slot | Name | Values |
|------|------|--------|
| 1 | Tight | Focus:200 Zoom:50 |
| 2 | Medium | Focus:128 Zoom:128 |
| 3 | Wide | Focus:50 Zoom:200 |
| 4-12 | Empty | - |

### Gobo Presets (1-5 pre-populated)

| Slot | Name | Value |
|------|------|-------|
| 1 | Open | Gobo:0 |
| 2 | Gobo 1 | Gobo:32 |
| 3 | Gobo 2 | Gobo:64 |
| 4 | Gobo 3 | Gobo:96 |
| 5 | Gobo 4 | Gobo:128 |
| 6-12 | Empty | - |

## Workflow Examples

### Example 1: Creating a Color Look

```bash
# Select fixtures
fixture 1 thru 10

# Set color values
red at 180
green at 100
blue at 50

# Switch to color mode (if not already)
color

# Record to preset slot 9
store color 9 "Warm Amber"

# Clear programmer
clear

# Recall later
fixture 1 thru 10
color 9
```

### Example 2: Position Programming

```bash
# Select moving heads
fixture 11 thru 20

# Set position
pan at 200
tilt at 150

# Store position preset
store position 6 "Stage Left"

# Later recall
fixture 11 thru 20
position 6
```

### Example 3: Multi-Feature Programming

```bash
# Select fixtures
fixture 1 thru 5

# Set color
red at 255
blue at 128
store color 10

# Set position
pan at 100
tilt at 200
store position 7

# Set intensity
dimmer at 200
store intensity 8

# Recall all three
fixture 1 thru 5
color 10
position 7
intensity 8
```

## Data Storage

### localStorage Structure

Presets are stored in `localStorage` under key `dmx_flex_presets`:

```javascript
{
  "color": [
    { "name": "Red", "values": { "red": 255, "green": 0, "blue": 0 } },
    { "name": "Green", "values": { "red": 0, "green": 255, "blue": 0 } },
    // ...
    null,  // Empty slot
    null
  ],
  "position": [...],
  "focus": [...],
  "intensity": [...],
  "gobo": [...]
}
```

### Preset Manager API

The `PresetManager` class provides centralized preset management:

```javascript
import { presetManager } from './utils/presetManager'

// Get all presets for a feature set
const colorPresets = presetManager.getPresets('color')

// Get a single preset
const preset = presetManager.getPreset('color', 0)  // Get first color preset

// Store a preset
presetManager.storePreset('color', 8, {
  name: 'Custom Blue',
  values: { red: 0, green: 50, blue: 255 }
})

// Clear a preset
presetManager.clearPreset('color', 8)

// Reset to defaults
presetManager.resetToDefaults()

// Subscribe to changes
const unsubscribe = presetManager.subscribe((presets) => {
  console.log('Presets updated:', presets)
})
```

## Integration with CLI

The CLI automatically:
1. **Switches feature sets** when recording/recalling presets
2. **Validates preset slots** (1-12)
3. **Provides feedback** on success/failure
4. **Maintains context** of current feature set

### Command Flow

```
User Input: "store color 5"
    ↓
CLI Parser: { type: 'record', objectType: 'color', id: 5 }
    ↓
CLI Dispatcher: switches to color mode, records preset
    ↓
Preset Manager: stores to localStorage
    ↓
FlexWindow: updates display
    ↓
Feedback: "Recording color preset 5"
```

## Visual Design

### Touch Optimization
- **Large preset slots** - 80px minimum height
- **Clear touch targets** - Adequate spacing between slots
- **Visual feedback** - Hover/active states
- **Record mode indicator** - Red border when recording

### Color Coding
- **Blue borders** - Active/filled presets (#4a9eff)
- **Red accents** - Record mode (#ff4444)
- **Gray dashed** - Empty slots (#444)
- **Color-coded values** - Parameter-specific colors

## Future Enhancements

1. **Preset Import/Export**
   - Export presets to JSON
   - Share between devices
   - Preset libraries

2. **Preset Copying**
   - Copy preset to another slot
   - Duplicate across feature sets

3. **Preset Merging**
   - Combine multiple presets
   - Selective parameter overlay

4. **Preset Fades**
   - Time-based transitions
   - `color 1 time 3` (fade over 3 seconds)

5. **Preset Metadata**
   - Tags/categories
   - Thumbnails/colors
   - Usage statistics

## Summary

The FlexWindow preset system provides:

✅ **Contextual display** - Shows relevant presets for active feature set
✅ **12 preset slots** per feature set (60 total)
✅ **CLI integration** - Full command-line control
✅ **Touch-optimized** - Steam Deck friendly
✅ **Persistent storage** - localStorage backed
✅ **Default presets** - Pre-populated with common values
✅ **Visual feedback** - Record mode indicators
✅ **Fast recall** - Single click or command

**FlexWindow (F30) is fully operational and integrated with the CLI backbone!**
