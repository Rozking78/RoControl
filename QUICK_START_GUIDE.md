# Quick Start Guide - Steam Deck DMX Controller

## 🚀 Getting Started

### Building the Application
```bash
npm run build
```

### Running the Application
```bash
npm run tauri dev
```

---

## 🎹 Keyboard Shortcuts (Recommended Implementation)

| Key | Action |
|-----|--------|
| **R** | Toggle Record Mode |
| **ESC** | Clear Programmer / Active Parameters |
| **Space** | Blackout (if implemented) |
| **L** | Locate (full brightness) |

---

## 🎮 Basic Workflow

### 1. Select Fixtures
- Open **Fixtures** view
- Click fixtures to select
- Multiple selection supported

### 2. Control Parameters

**Option A: Use Programmer Pro**
- Click feature set tab (Color, Intensity, Position, etc.)
- Adjust encoder wheels by clicking
- Values automatically marked as "active" (● indicator)

**Option B: Use Attribute Windows**
- Open specific window (Color Window, Position, etc.)
- Use sliders, pickers, or inputs
- Changes sync to Programmer

### 3. Record a Preset

1. **Enter Record Mode**: Press **R** key
2. **Select Feature Set**: Ensure correct tab is active (e.g., Color)
3. **Modify Parameters**: Adjust values (Red, Green, Blue, etc.)
4. **Open FlexWindow**: View shows presets for active feature set
5. **Tap Preset Slot**: Click empty or filled slot in FlexWindow
6. **Preset Saved!** Only active parameters in feature set are recorded

### 4. Recall a Preset

1. **Ensure Record Mode is OFF** (press R if red indicator shows)
2. **Open FlexWindow**: Shows presets for active feature set
3. **Tap Preset**: Click filled preset slot
4. **Values Applied** to selected fixtures

### 5. Save a View

1. **Set up your layout**: Arrange windows, adjust parameters
2. **Enter Record Mode**: Press **R**
3. **Click View Button**: One of the 6 view buttons (1-6)
4. **Confirm if needed**: Overwrite dialog appears if view exists
5. **View Saved!** Complete state stored

### 6. Recall a View

1. **Ensure Record Mode is OFF**
2. **Click View Button**: Tap one of the 6 view buttons
3. **Layout Restored**: Grid, values, selections all recalled

---

## 🎨 Available Windows

### **Essential Controls**
- **Fixtures** - Select and manage fixtures
- **Programmer Pro** - Main parameter control with tabs
- **FlexWindow** - Dynamic preset window
- **Attributes** - Quick feature set switching
- **View Recall** - 6-slot layout memory

### **Attribute Windows**
- **Color Window** - HSV color picker
- **Intensity** - Dimmer control + presets
- **Position** - Pan/Tilt 2D control
- **Focus** - Focus/Zoom control
- **Gobo** - Gobo and prism selection
- **Groups** - Fixture group management
- **Pixel Grid** - Visual fixture layout

### **Playback**
- **Executors** - 6 vertical faders
- **Cues** - Recorded cue list
- **Quick Actions** - Blackout, Locate, Clear, Record

### **Legacy**
- **Programmer** (original) - Simple encoder view
- **Color Palettes** - Quick color buttons
- **Channel Grid** - Direct DMX control

---

## 📱 Touch Controls (Steam Deck)

### Opening Windows
1. **Right-click** any grid cell
2. **Select view** from context menu
3. **Window appears** in that cell

### Using On-Screen Keyboard
1. **Left-click** any input field (DMX address, group name, etc.)
2. **Keyboard auto-appears** (when implemented)
3. **Enter value** using touch
4. **Tap Enter** to confirm

### Master Fader
- **Located**: Bottom-right corner (floating)
- **Drag slider** to adjust global intensity
- **Quick buttons** for instant levels (100%, 75%, 50%, 0%)
- **Affects all output** (DMX, Art-Net, sACN when implemented)

---

## 🎯 Pixel Grid Workflow

### Creating a Fixture Layout

1. **Open Pixel Grid** window
2. **Drag fixtures** from "Unplaced Fixtures" panel to grid
3. **Arrange visually** - drag fixtures within grid
4. **Click fixtures** in grid to select them
5. **Save as Group**: Click "Save Group" button
6. **Enter name**: Type group name
7. **Confirm**: Group saved with left-to-right, top-to-bottom ordering

### Auto-Arrange
- **Click "Auto"** button in Pixel Grid
- Fixtures automatically arranged by ID
- Useful for quick setup

---

## 💾 Data Persistence

### What's Saved Automatically:
- ✅ FlexWindow presets (per feature set)
- ✅ View Button layouts (all 6 views)
- ✅ Pixel Grid fixture positions
- ✅ Groups Window groups
- ✅ Current layout configuration
- ✅ DMX patch and fixtures

### Where Data is Stored:
- **Browser localStorage** (persists across sessions)
- **Tauri app data directory** (when running native app)

### Clearing Data:
```javascript
// In browser console
localStorage.clear();
```

---

## 🎨 Feature Sets Explained

| Feature Set | Parameters Included |
|-------------|---------------------|
| **Color** | red, green, blue, white, amber, uv, cyan, magenta, yellow |
| **Intensity** | dimmer, strobe |
| **Position** | pan, pan_fine, tilt, tilt_fine |
| **Focus** | focus, zoom, iris, frost |
| **Gobo** | gobo, gobo_rotation, prism, prism_rotation |
| **Groups** | (special - fixture selections) |
| **All** | Shows all available parameters |

---

## 🔧 Selective Recording Logic

### How It Works:

**Preset records a parameter ONLY if BOTH are true:**

1. ✅ Parameter is in the active feature set
2. ✅ Parameter has been modified (marked active)

### Example:

**Active Feature Set:** Color
**Modified Parameters:** Red (255), Green (128), Pan (100)

**What gets recorded:**
- ✅ Red: 255 (in Color set + active)
- ✅ Green: 128 (in Color set + active)
- ❌ Pan: 100 (NOT in Color set)
- ❌ Blue (in Color set but NOT active)

**Result:** Preset contains only `{ red: 255, green: 128 }`

---

## 🎮 Recommended Setup for Steam Deck

### Optimal Layout (4×4):
```
┌────────────┬─────────────┬────────────┬────────────┐
│  Fixtures  │  Programmer │ FlexWindow │ Attributes │
│            │     Pro     │            │            │
├────────────┼─────────────┼────────────┼────────────┤
│   Color    │  Position   │   Focus    │   Gobo     │
│  Window    │             │            │            │
├────────────┼─────────────┼────────────┼────────────┤
│ Intensity  │   Groups    │    Cues    │    View    │
│            │             │            │   Recall   │
├────────────┼─────────────┼────────────┼────────────┤
│ Executors  │  Executors  │ Executors  │ Executors  │
└────────────┴─────────────┴────────────┴────────────┘
```

### Key Bindings (Recommended):
- **R Trigger**: Record Mode Toggle
- **L Trigger**: Blackout
- **D-Pad Up/Down**: Navigate parameters
- **D-Pad Left/Right**: Change feature set
- **A Button**: Select/Confirm
- **B Button**: Cancel/Back

---

## 🆘 Troubleshooting

### "No fixtures selected" warning
- **Solution**: Open Fixtures view and click fixtures to select

### Preset doesn't save all parameters
- **Expected behavior**: Only active parameters in feature set are saved
- **Solution**: Ensure you've modified the parameters you want to record

### FlexWindow shows wrong presets
- **Check**: Active feature set tab in Programmer Pro
- **Solution**: Click correct feature set tab (Color, Intensity, etc.)

### Master Fader not visible
- **Check**: Master Fader should be floating in bottom-right
- **Note**: Requires integration with App.jsx (see integration guide)

### Build errors
```bash
# Clear node modules and rebuild
rm -rf node_modules
npm install
npm run build
```

---

## 📚 Additional Documentation

- **IMPLEMENTATION_STATUS.md** - Complete feature list
- **FLEXWINDOW_INTEGRATION_GUIDE.md** - Integration with App.jsx
- **FINAL_IMPLEMENTATION_SUMMARY.md** - Full project summary

---

## 🎯 Next Steps

1. **Integrate state management** (see FLEXWINDOW_INTEGRATION_GUIDE.md)
2. **Add keyboard shortcuts** (R for record, ESC for clear)
3. **Implement Master Fader backend** (virtual intensity logic)
4. **Add Art-Net/sACN protocols** (for network output)
5. **Integrate gamepad** (Steam Deck controls)

---

*Quick Start Guide - Version 1.0*
*For Steam Deck DMX Controller*
