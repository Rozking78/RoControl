# Video Output Grid - NDI & Physical Output Management

## Overview

The **Video Output Grid** is a preset-style window for creating and managing video outputs. It features a grid of squares where you can **long-press empty squares to create new outputs**. Each output can be configured as either a **Physical Display** or an **NDI Stream**, and the square's name becomes the NDI stream label.

## Window Access

### Window ID: 52

```bash
# CLI commands
window 52           # Open Video Outputs window
open 52             # Shorthand
w 52                # Shortest

close 52            # Close window
```

## Grid Layout

### Configuration
- **Grid Size:** 4 columns × 3 rows = **12 output squares**
- **Style:** Preset window aesthetic (like FlexWindow)
- **Interaction:** Long-press to create, click to configure
- **Storage:** Persists to localStorage (`dmx_video_outputs`)

### Visual Design

```
┌────────────────────────────────────┐
│  Video Outputs      9 / 12 outputs │
├────────────────────────────────────┤
│  ┌────┐  ┌────┐  ┌────┐  ┌────┐  │
│  │ 🖥️ │  │ 📡 │  │Long│  │    │  │
│  │  1 │  │  2 │  │press│  │    │  │
│  │Main│  │LED │  │  to │  │    │  │
│  │● ON│  │●NDI│  │make│  │    │  │
│  └────┘  └────┘  └────┘  └────┘  │
│  ┌────┐  ┌────┐  ┌────┐  ┌────┐  │
│  │ 📡 │  │    │  │    │  │    │  │
│  │  5 │  │    │  │    │  │    │  │
│  │Cam1│  │    │  │    │  │    │  │
│  │●NDI│  │    │  │    │  │    │  │
│  └────┘  └────┘  └────┘  └────┘  │
│  ┌────┐  ┌────┐  ┌────┐  ┌────┐  │
│  │    │  │    │  │    │  │    │  │
│  └────┘  └────┘  └────┘  └────┘  │
└────────────────────────────────────┘
```

## Creating Outputs

### Long-Press Interaction

1. **Find empty square** (dashed border)
2. **Long-press** (800ms hold)
3. **Output created** - Configuration panel opens automatically
4. **Configure** - Set name, type, and settings

### Default Output Settings

```javascript
{
  id: "output_1234567890",
  gridPosition: 0,            // 0-11
  name: "Output 1",           // User-editable
  type: "ndi",                // "ndi" or "physical"
  ndiStreamName: "RoControl Output 1",
  physicalOutput: null,       // HDMI, DisplayPort, etc.
  enabled: true,
  resolution: "1920x1080",
  fps: 60
}
```

## Output Types

### 1. NDI Stream (📡)

**Purpose:** Network video output visible to NDI receivers

**Features:**
- Broadcast over local network
- Low latency streaming
- Discoverable by NDI receivers
- Custom stream naming

**Use Cases:**
- LED processors (Brompton, Novastar)
- Media servers (Resolume, Disguise, TouchDesigner)
- Video switchers
- Projection systems
- Recording software (OBS, vMix)

**Stream Naming:**
- Default: Uses output name from grid square
- Custom: Override with specific NDI stream name
- Format: "RoControl - [Output Name]"

**Example:**
```javascript
{
  name: "LED Wall",
  type: "ndi",
  ndiStreamName: "RoControl - LED Wall"
}
```

### 2. Physical Output (🖥️)

**Purpose:** Direct output to connected display hardware

**Features:**
- Direct hardware output
- No network latency
- Full resolution support
- Hardware acceleration

**Detected Outputs:**
- HDMI 1, HDMI 2
- DisplayPort 1, 2
- USB-C Display
- Other connected displays

**Use Cases:**
- Local projection
- LED wall direct connection
- Monitor output
- Hardware testing

**Example:**
```javascript
{
  name: "Main Screen",
  type: "physical",
  physicalOutput: "hdmi1"
}
```

## Configuration Panel

### Opens When:
- Creating new output (long-press)
- Clicking existing output square

### Configuration Options

**1. Output Name**
- User-defined label
- Appears on grid square
- For NDI: becomes stream name (unless overridden)

**2. Output Type**
- 📡 **NDI Stream** - Network broadcast
- 🖥️ **Physical Output** - Hardware connection

**3. NDI Stream Name** (NDI only)
- Custom stream identifier
- Defaults to output name
- Visible to NDI receivers

**4. Physical Display** (Physical only)
- Dropdown of available displays
- Shows availability status
- Grayed out if in use

**5. Resolution**
- 1920×1080 (Full HD)
- 2560×1440 (2K)
- 3840×2160 (4K)
- 1280×720 (HD)
- 1024×768

**6. Frame Rate**
- 30 FPS
- 60 FPS
- 120 FPS

**7. Enable Output**
- Checkbox to activate/deactivate
- Saves resources when disabled

### Configuration Panel UI

```
┌─────────────────────────────┐
│ Configure Output           × │
├─────────────────────────────┤
│ Output Name:                │
│ ┌─────────────────────────┐ │
│ │ Main Screen             │ │
│ └─────────────────────────┘ │
│                             │
│ Output Type:                │
│ ┌─────────┐ ┌─────────┐   │
│ │   📡    │ │   🖥️    │   │
│ │ ■ NDI   │ │Physical │   │
│ └─────────┘ └─────────┘   │
│                             │
│ NDI Stream Name:            │
│ ┌─────────────────────────┐ │
│ │ RoControl - Main Screen │ │
│ └─────────────────────────┘ │
│                             │
│ Resolution: [1920x1080  ▼] │
│ Frame Rate: [60 FPS     ▼] │
│                             │
│ ☑ Enable Output            │
│                             │
│ ┌──────────┐ ┌───────────┐ │
│ │  Delete  │ │   Apply   │ │
│ └──────────┘ └───────────┘ │
└─────────────────────────────┘
```

## Square States

### Empty Square
- **Border:** Dashed, gray (#444)
- **Content:** "Long press to create"
- **Interaction:** Long-press creates output

### Filled Square
- **Border:** Solid, blue (#4a9eff)
- **Background:** Gradient
- **Content:**
  - Type icon (📡 or 🖥️)
  - Grid position number
  - Output name
  - Status indicator (● ON / ○ OFF)
- **Interaction:** Click to configure

### Selected Square
- **Border:** Green (#00ff88)
- **Background:** Green-tinted gradient
- **Shadow:** Green glow
- **State:** Configuration panel open

## Workflow Examples

### Example 1: Create NDI Output for LED Wall

```
1. Open Video Outputs window
   CLI: window 52

2. Long-press empty square (e.g., position 1)

3. Configure in panel:
   - Name: "LED Wall Main"
   - Type: NDI Stream
   - NDI Name: "RoControl - LED Wall Main"
   - Resolution: 1920x1080
   - FPS: 60
   - Enable: ✓

4. Click Apply

5. NDI stream "RoControl - LED Wall Main" now broadcasting
```

### Example 2: Create Physical Output for Projector

```
1. Open Video Outputs window
   CLI: window 52

2. Long-press square position 2

3. Configure:
   - Name: "Front Projector"
   - Type: Physical Output
   - Display: HDMI 2
   - Resolution: 1920x1080
   - FPS: 60
   - Enable: ✓

4. Click Apply

5. Video routed to HDMI 2
```

### Example 3: Multiple NDI Streams for Show

```
1. Create Output 1: "LED Wall"
   - NDI stream for main LED wall

2. Create Output 2: "Side Screens"
   - NDI stream for side displays

3. Create Output 3: "Recording"
   - NDI stream for OBS/vMix capture

4. Create Output 4: "Backup"
   - NDI stream for backup system

5. All streams available on network with custom names
```

## Output Information Display

### Grid Square Display

Each filled square shows:
- **Type badge** - Top-right corner (📡 or 🖥️)
- **Position number** - Large, blue
- **Output name** - Truncated if long
- **Status line** - Active indicator + type/display

### Configuration Panel Info

Bottom section shows:
- Grid Position
- Type (NDI/Physical)
- Stream name (NDI) or Display (Physical)
- Resolution
- FPS
- Status (Active/Disabled)

## Data Persistence

### localStorage Key: `dmx_video_outputs`

```javascript
[
  {
    id: "output_1701234567890",
    gridPosition: 0,
    name: "LED Wall",
    type: "ndi",
    ndiStreamName: "RoControl - LED Wall",
    physicalOutput: null,
    enabled: true,
    resolution: "1920x1080",
    fps: 60
  },
  // ... more outputs
]
```

### Persistence Features
- Saves automatically on changes
- Survives page reload
- Recovers last configuration
- Maximum 12 outputs (grid size)

## Footer Information

```
┌────────────────────────────────────────────────────────┐
│ 📡 NDI Stream - Network output                         │
│ 🖥️ Physical - Direct display output                    │
│                Long press an empty square to create    │
└────────────────────────────────────────────────────────┘
```

## Integration with Video System

### Video Fixture Routing

Video fixtures (from VideoFixturePatch) can be routed to outputs:
- Fixtures provide content
- Outputs broadcast content
- Mapping via channel system

### Canvas Integration

Main Canvas Grid (Window 4) can render to outputs:
- Pixel art from canvas
- Video fixture layers
- Combined compositing
- Real-time output

### Future: Output Assignment

```bash
# CLI commands (future)
route video_1 to output_1    # Route video fixture to output
route canvas to output_2     # Route canvas to output
output 1 enable              # Enable output 1
output 2 disable             # Disable output 2
```

## File Structure

```
src/
├── components/views/
│   └── VideoOutputGrid.jsx      [NEW]
├── styles/views/
│   └── VideoOutputGrid.css      [NEW]
├── utils/
│   └── windowIds.js             [MODIFIED]
└── components/
    └── GridLayout.jsx           [MODIFIED]
```

## CSS Highlights

### Preset Window Aesthetic

```css
/* Like FlexWindow */
.output-square {
  background: #1a1a1a;
  border: 2px solid #333;
  border-radius: 8px;
  /* ... */
}

.output-square.filled {
  background: linear-gradient(135deg, #252525, #1a1a1a);
  border-color: #4a9eff;
}
```

### Configuration Panel

```css
.output-config-panel {
  position: fixed;
  right: 0;
  width: 350px;
  background: #0f0f0f;
  border-left: 2px solid #4a9eff;
}
```

## Build Status

```bash
npm run build
✓ 91 modules transformed
✓ built in 1.90s
✅ SUCCESS
```

## Summary

### What Was Implemented

✅ **Grid Layout** - 4×3 = 12 output squares
✅ **Long-Press Creation** - 800ms hold to create
✅ **Dual Output Types** - NDI streams & Physical displays
✅ **NDI Stream Naming** - Square name = Stream name
✅ **Configuration Panel** - Full settings sidebar
✅ **Physical Output Detection** - List available displays
✅ **Preset Window Style** - Matches FlexWindow aesthetic
✅ **localStorage Persistence** - Saves all outputs
✅ **Touch Optimization** - Steam Deck friendly
✅ **Window Integration** - Window ID 52

### Key Features

- 🎯 **Long-press interaction** - Intuitive output creation
- 📡 **NDI streaming** - Network video broadcast
- 🖥️ **Physical outputs** - Direct hardware connection
- 🏷️ **Custom naming** - Labels become NDI stream names
- 💾 **Persistent** - Saves to localStorage
- 🎨 **Preset style** - Familiar UI pattern
- ⚙️ **Configurable** - Resolution, FPS, enable/disable
- 📊 **Status display** - Active/inactive indicators

**Video Output Grid is fully operational!** 📡🎬