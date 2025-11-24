# Window Routing & CLI Control

## Overview

The **Window Routing System** enables full CLI control of all windows in RoControl, following MA3/Hog-style console paradigms. Windows can be opened, closed, and managed entirely through command-line interface.

## Window ID Mapping

### Standard Window IDs

| ID | Window Type | Description |
|----|-------------|-------------|
| **4** | Main Canvas Grid | Primary pixel editor and data source |
| **5** | Protocol Settings | Network/DMX configuration (Media Server placeholder) |
| **9** | Programmer | Main programmer window (fixed bottom) |
| **10** | Color | Color attribute window |
| **11** | Intensity | Intensity/dimmer attribute window |
| **12** | Position | Pan/tilt position window |
| **13** | Focus | Focus/zoom attribute window |
| **14** | Gobo | Gobo/effects attribute window |
| **20** | Cues | Cue list window |
| **21** | Executors | Executor buttons window |
| **22** | Palettes | Color palettes window |
| **30** | Fixtures | Fixture list/patch window |
| **31** | Groups | Fixture groups window |
| **32** | Channel Grid | Channel grid view |
| **40** | FlexWindow | Contextual presets window (F30) |
| **41** | Attributes | Attribute call buttons |
| **42** | View Buttons | View recall buttons |
| **50** | Quick Actions | Quick action buttons |
| **51** | Protocol Settings | Protocol configuration (alt reference) |

### Window Categories

**Canvas/Grid:**
- 4: Main Canvas Grid

**Programmer:**
- 9: Programmer (Enhanced)
- 1: Programmer (Simple - legacy)

**Attributes:**
- 10: Color
- 11: Intensity
- 12: Position
- 13: Focus
- 14: Gobo

**Show Control:**
- 20: Cues
- 21: Executors
- 22: Palettes

**Fixtures:**
- 30: Fixtures
- 31: Groups
- 32: Channel Grid

**Presets:**
- 40: FlexWindow
- 41: Attributes
- 42: View Buttons

**Utility:**
- 50: Quick Actions
- 51: Protocol Settings

## CLI Commands

### Opening Windows

```bash
# Standard syntax
window 10              # Open Color window
open 10                # Open Color window (shorthand)
w 10                   # Open Color window (shortest)

# All attribute windows
window 10              # Color
window 11              # Intensity
window 12              # Position
window 13              # Focus
window 14              # Gobo

# Show control windows
window 20              # Cues
window 21              # Executors
window 22              # Palettes

# Fixture windows
window 30              # Fixtures
window 31              # Groups
window 32              # Channel Grid

# Preset windows
window 40              # FlexWindow
window 41              # Attribute Buttons
window 42              # View Recall

# Utility
window 50              # Quick Actions
window 4               # Main Canvas Grid
```

### Closing Windows

```bash
# Standard syntax
close 10               # Close Color window
close window 10        # Close Color window (verbose)

# Close any window by ID
close 11               # Close Intensity
close 12               # Close Position
close 20               # Close Cues
close 40               # Close FlexWindow
```

### Quick Window IDs

For windows with ID > 50, you can use just the number:
```bash
51                     # Opens Protocol Settings
```

**Note:** Numbers 1-50 may conflict with fixture IDs, so use `window` prefix for clarity.

## Command Behavior

### Opening Windows

1. **Validates window ID** - Checks if ID is valid
2. **Checks if already open** - Prevents duplicates
3. **Calculates position** - Cascading placement (30px offset per window)
4. **Creates window** - Standard size: 400x300
5. **Returns feedback** - Success/error message

**Success Response:**
```
Opened Color
Opened Intensity
Opened FlexWindow
```

**Error Responses:**
```
Invalid window ID: 99
Color is already open
```

### Closing Windows

1. **Validates window ID** - Checks if ID is valid
2. **Finds window** - Looks for matching view type
3. **Removes window** - Deletes from layout
4. **Returns feedback** - Success/error message

**Success Response:**
```
Closed Color
Closed Position
```

**Error Responses:**
```
Invalid window ID: 99
Color is not open
```

## Workflow Examples

### Example 1: Open Attribute Windows

```bash
# Open all attribute windows for programming
window 10              # Color
window 11              # Intensity
window 12              # Position

# Set values via attribute windows (GUI)
# Then close when done
close 10
close 11
close 12
```

### Example 2: Quick Show Setup

```bash
# Open essential windows for show programming
window 40              # FlexWindow (presets)
window 20              # Cues
window 30              # Fixtures

# Work with show
# ...

# Clean up
close 40
close 20
close 30
```

### Example 3: Full Programming Environment

```bash
# Open comprehensive programming setup
window 10              # Color
window 11              # Intensity
window 12              # Position
window 13              # Focus
window 40              # FlexWindow
window 20              # Cues

# Program your show...
```

## Window Positioning

### Cascade Algorithm

Windows are automatically positioned with cascading offsets:

```javascript
offsetX = (windowCount * 30) % 300
offsetY = (windowCount * 30) % 200
x = 50 + offsetX
y = 50 + offsetY
```

**First window:** (50, 50)
**Second window:** (80, 80)
**Third window:** (110, 110)
**Etc.**

### Default Size

All windows start at:
- **Width:** 400px
- **Height:** 300px

Users can resize/reposition in edit mode.

## Integration with Other Features

### Programmer Integration

The Programmer (Window 9) is **fixed to the bottom** and cannot be moved:
- Always visible
- Cannot be closed via CLI
- Special positioning

### FlexWindow Integration

FlexWindow (Window 40) contextually displays presets:
- Switches content based on active feature set
- Integrates with preset recall commands
- Can be opened/closed via CLI

### Layout Persistence

Window positions and states are saved to `localStorage`:
- Survives page reload
- Saved in `dmx_grid_layout` key
- Includes all window positions and sizes

## Technical Implementation

### File Structure

```
src/
├── utils/
│   ├── windowIds.js           # Window ID mapping and utilities
│   ├── cliParser.js            # Updated with window commands
│   └── cliDispatcher.js        # Updated with window handlers
└── App.jsx                     # Window management functions added
```

### Window ID Utilities

**windowIds.js** provides:

```javascript
import {
  getViewFromId,      // Get view type from ID
  getIdFromView,      // Get ID from view type
  getLabelFromId,     // Get display label
  isValidWindowId,    // Check if ID is valid
  getAttributeWindowIds,  // Get all attribute IDs
  getWindowsByCategory    // Get IDs by category
} from './utils/windowIds'

// Examples
getViewFromId(10)           // → 'colorWindow'
getIdFromView('colorWindow') // → 10
getLabelFromId(10)          // → 'Color'
isValidWindowId(10)         // → true
```

### App.jsx Functions

```javascript
handleOpenWindow(windowId)
  - Validates ID
  - Checks for duplicates
  - Calculates position
  - Adds to layout
  - Returns {success, windowName}

handleCloseWindow(windowId)
  - Validates ID
  - Finds window
  - Removes from layout
  - Returns {success, windowName}
```

## Future Enhancements

### 1. Window Focus

```bash
focus 10               # Bring Color window to front
```

### 2. Window Sizing

```bash
window 10 size 600 400 # Set Color window size
```

### 3. Window Positioning

```bash
window 10 pos 100 100  # Set Color window position
```

### 4. Window Presets

```bash
layout 1               # Recall saved window layout
```

### 5. Window Routing (MA3-style)

```bash
4/1 10                 # Route canvas object 1 to Color window
10 9                   # Route Color to Programmer
```

## Command Reference

### Window Commands Summary

| Command | Aliases | Example | Description |
|---------|---------|---------|-------------|
| `window <id>` | `open`, `w` | `window 10` | Open window by ID |
| `close <id>` | - | `close 10` | Close window by ID |
| `<id>` | - | `51` | Open window (ID > 50 only) |

### Window ID Quick Reference

```bash
# Attributes
10 = Color
11 = Intensity
12 = Position
13 = Focus
14 = Gobo

# Show Control
20 = Cues
21 = Executors
22 = Palettes

# Fixtures
30 = Fixtures
31 = Groups

# Presets
40 = FlexWindow

# Main
4 = Canvas Grid
9 = Programmer
```

## Error Handling

### Invalid ID

```bash
CMD> window 99
✗ Invalid window ID: 99
```

### Already Open

```bash
CMD> window 10
✓ Opened Color

CMD> window 10
✗ Color is already open
```

### Not Open

```bash
CMD> close 10
✗ Color is not open
```

## Summary

### What Was Implemented

✅ **Window ID Mapping** - 20+ windows with numeric IDs
✅ **CLI Commands** - `window`, `open`, `close`
✅ **Window Management** - Open/close functions
✅ **Position Algorithm** - Cascading placement
✅ **Validation** - ID checking and duplicate prevention
✅ **Feedback** - Clear success/error messages
✅ **Documentation** - Complete command reference

### Build Status

```bash
npm run build
✓ 87 modules transformed
✓ built in 1.85s
✅ SUCCESS
```

### Integration

The window routing system is **fully integrated** with:
- CLI backbone
- GridLayout window management
- Layout persistence
- App state management

**Windows can now be controlled entirely via CLI commands!** 🎉
