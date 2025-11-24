# Video Fixtures - File & NDI Patch System

## Overview

**Video Fixtures** are a special fixture type in RoControl that allows patching video sources (files or NDI streams) as controllable fixtures. Unlike traditional DMX fixtures, video fixtures have **channel numbers but no DMX addresses** since they output to video protocols (NDI) rather than lighting protocols.

## Concept

Video fixtures bridge the gap between lighting control and media server control, allowing you to:
- Patch video files or NDI streams as "fixtures"
- Control them via channels (intensity, position, effects)
- Output to NDI for projection mapping, LED walls, or media servers
- Integrate video content into your lighting show workflow

## Key Differences from DMX Fixtures

| Feature | DMX Fixture | Video Fixture |
|---------|-------------|---------------|
| **Address** | Universe + DMX Address (1-512) | No DMX address |
| **Channel** | DMX Channel Number | Virtual Channel Number |
| **Output** | Art-Net / sACN / DMX | NDI Video Stream |
| **Source** | GDTF Profile | Video File or NDI Input |
| **Control** | DMX Values (0-255) | Video Parameters (playback, effects) |

## Fixture Structure

### Rust Backend (Fixture Struct)

```rust
struct Fixture {
    id: String,
    name: String,
    fixture_type: String,
    dmx_address: u16,          // 0 for video fixtures
    universe: u8,               // 0 for video fixtures
    channel_count: u16,
    gdtf_file: Option<String>,

    // Video fixture fields
    is_video: Option<bool>,           // true for video fixtures
    video_source_type: Option<String>, // "file" or "ndi"
    video_source_path: Option<String>, // File path or NDI stream name
}
```

### Frontend Fixture Object

```javascript
{
  id: "video_1234567890",
  name: "Video 1",
  fixture_type: "video",
  channel_number: 1,
  is_video: true,
  video_source_type: "file",  // or "ndi"
  video_source_path: "/path/to/video.mp4",  // or "NDI Source Name"
  dmx_address: 0,  // No DMX address
  universe: 0,      // No universe
  channel_count: 1
}
```

## Video Source Types

### 1. File Sources

**Supported Formats:**
- MP4
- MOV
- AVI
- MKV
- Other common video formats

**Use Cases:**
- Pre-rendered content
- Background loops
- Static media playback
- Synchronized video cues

**Example:**
```javascript
{
  video_source_type: "file",
  video_source_path: "/media/show/intro_video.mp4"
}
```

### 2. NDI Sources

**NDI (Network Device Interface):**
- Live video streams over network
- Real-time input from cameras, media servers, or other devices
- Low-latency streaming
- Discoverable sources

**Use Cases:**
- Live camera feeds
- Real-time content from media servers
- Interactive video
- Multi-source switching

**Example:**
```javascript
{
  video_source_type: "ndi",
  video_source_path: "Camera 1 (192.168.1.100)"
}
```

## Patching Video Fixtures

### Via GUI (Video Patch Window)

1. **Open Video Patch Window**
   ```bash
   # CLI command
   window 33
   ```

2. **Fill in Fixture Details**
   - **Fixture Name**: e.g., "Video 1", "Background Loop", "Camera Feed"
   - **Channel Number**: Virtual channel (1-512+)
   - **Source Type**: File or NDI

3. **Select Source**
   - **For File**: Browse or enter file path
   - **For NDI**: Select from discovered NDI streams

4. **Add Fixture**
   - Click "Add Video Fixture"
   - Fixture appears in Fixtures view with purple gradient

### Via CLI (Future)

```bash
# Add file-based video fixture
patch video 1 file "/media/video1.mp4"

# Add NDI-based video fixture
patch video 2 ndi "Camera 1"
```

## Visual Identification

### In Fixtures View

Video fixtures are visually distinct:

**Icon:** 🎬 (Film camera emoji)
**Color:** Purple gradient background
**Border:** Purple (#9a4aff)
**Source Indicator:**
- 📁 FILE - For file sources
- 📡 NDI - For NDI streams
- 🎬 VIDEO - Generic (if type not specified)

**Example Display:**
```
┌──────────┐
│  🎬      │
│    1     │  ← Channel number
│ Video 1  │  ← Name
│ 📁 FILE  │  ← Source type
└──────────┘
```

### Selected State

When selected:
- Brighter purple gradient
- Purple glow shadow
- Border becomes #9a4aff

## Control Channels

Video fixtures expose virtual channels for control:

### Standard Channels

| Channel | Parameter | Range | Description |
|---------|-----------|-------|-------------|
| 1 | Intensity | 0-255 | Video opacity/brightness |
| 2 | Position X | 0-255 | Horizontal position |
| 3 | Position Y | 0-255 | Vertical position |
| 4 | Scale | 0-255 | Video scale/zoom |
| 5 | Rotation | 0-255 | Video rotation (0-360°) |
| 6 | Playback | 0-255 | Play/pause/speed |
| 7 | Effect | 0-255 | Video effect selection |

### Control Examples

```bash
# CLI commands (future)
fixture video_1
intensity at 255     # Full brightness
position_x at 128    # Center horizontal
position_y at 128    # Center vertical
scale at 200         # 2x zoom
```

## Output System

### NDI Output

Video fixtures output to NDI for consumption by:
- LED processors (Brompton, Novastar)
- Media servers (Resolume, Disguise, TouchDesigner)
- Video switchers
- Projection mapping systems
- Recording/streaming software

**NDI Output Names:**
```
RoControl - Video 1
RoControl - Video 2
RoControl - Camera Feed
```

### Canvas Integration

Video fixtures can also render to the Main Canvas Grid (Window 4):
- Each video fixture gets a layer
- Controlled via CLI/Programmer
- Composited with other canvas elements
- Output as combined NDI stream

## Workflow Examples

### Example 1: Background Video Loop

```bash
# 1. Open Video Patch window
window 33

# 2. In GUI:
#    - Name: "Background Loop"
#    - Channel: 1
#    - Type: File
#    - Path: /media/backgrounds/stars.mp4

# 3. Control via CLI
fixture video_1
intensity at 128
scale at 150
```

### Example 2: Live Camera Feed

```bash
# 1. Open Video Patch window
window 33

# 2. In GUI:
#    - Name: "Stage Camera"
#    - Channel: 2
#    - Type: NDI
#    - Stream: "Camera 1 (192.168.1.50)"

# 3. Control positioning
fixture video_2
position_x at 200
position_y at 100
intensity at 255
```

### Example 3: Multi-Source Show

```bash
# Patch multiple video sources
window 33

# Video 1: Intro (File)
# Video 2: Loop (File)
# Video 3: Camera (NDI)
# Video 4: Graphics (NDI from Resolume)

# Create cue with all videos
fixture video_1 thru video_4
intensity at 0
record cue 1 "Video Setup"

# Fade in intro
fixture video_1
intensity at 255
time 3
record cue 2 "Intro Fade In"
```

## Window System Integration

### Window ID: 33

```bash
# Open Video Patch window
window 33
open 33
w 33

# Close Video Patch window
close 33
```

### Window Features

- **Touch-optimized** - Large buttons for Steam Deck
- **File browser** - Select video files
- **NDI discovery** - List available NDI streams
- **Real-time preview** - See source before patching (future)
- **Source validation** - Check if file/stream exists

## File Structure

```
src/
├── components/
│   └── views/
│       ├── VideoFixturePatch.jsx    [NEW] - Video patch UI
│       └── FixturesView.jsx         [MODIFIED] - Display video fixtures
├── styles/
│   └── views/
│       ├── VideoFixturePatch.css    [NEW] - Patch window styling
│       └── FixturesView.css         [MODIFIED] - Video fixture styling
├── utils/
│   └── windowIds.js                 [MODIFIED] - Added Window 33
└── components/
    └── GridLayout.jsx               [MODIFIED] - Added VideoFixturePatch

src-tauri/
└── src/
    └── main.rs                      [MODIFIED] - Updated Fixture struct
```

## CSS Styling

### Video Fixture Colors

```css
.fixture-item.video-fixture {
  background: linear-gradient(135deg, #2a1a3a, #1a2a3a);
  border-color: #9a4aff;
}

.fixture-item.video-fixture:hover {
  background: linear-gradient(135deg, #3a2a4a, #2a3a4a);
  border-color: #aa5aff;
}

.fixture-item.video-fixture.selected {
  background: linear-gradient(135deg, #4a3a6a, #3a4a6a);
  border-color: #9a4aff;
  box-shadow: 0 0 12px rgba(154, 74, 255, 0.5);
}
```

### Source Type Indicator

```css
.video-source {
  color: #9a4aff;
  font-weight: 600;
}
```

## Future Enhancements

### Phase 1
1. **File Browser Integration** - Native Tauri file picker
2. **NDI Discovery** - Automatic NDI source detection
3. **Source Preview** - Thumbnail preview before patching
4. **Validation** - Check file exists / NDI stream available

### Phase 2
5. **Timeline Control** - Scrub through video timeline
6. **Effects Library** - Built-in video effects
7. **Multi-layer Compositing** - Layer multiple videos
8. **Alpha Channel Support** - Transparency/keying

### Phase 3
9. **Video Effects** - Blur, color correction, transforms
10. **Playback Controls** - Loop, speed, reverse
11. **Cue Integration** - Video cues in cue list
12. **NDI Record** - Record NDI output to file

## CLI Command Reference (Future)

```bash
# Patching
patch video <channel> file <path>
patch video <channel> ndi <stream>

# Control
video <channel> intensity <value>
video <channel> position <x> <y>
video <channel> scale <value>
video <channel> rotation <value>

# Playback
video <channel> play
video <channel> pause
video <channel> stop
video <channel> loop on/off

# Effects
video <channel> effect <id>
video <channel> blur <amount>
video <channel> brightness <value>
```

## Build Status

```bash
npm run build
✓ 89 modules transformed
✓ built in 1.80s
✅ SUCCESS
```

## Summary

### What Was Implemented

✅ **Video Fixture Type** - New fixture type for video sources
✅ **Rust Backend Support** - Extended Fixture struct
✅ **File Sources** - Support for video file patching
✅ **NDI Sources** - Support for NDI stream patching
✅ **Video Patch Window** - GUI for adding video fixtures
✅ **Visual Distinction** - Purple gradient styling
✅ **Channel Numbers** - No DMX addresses required
✅ **Window Integration** - Window ID 33
✅ **FixturesView Updates** - Display video fixtures with icons

### Key Features

- 🎬 **Film icon** for video fixtures
- 💜 **Purple theme** for visual distinction
- 📁 **File browser** for video selection
- 📡 **NDI picker** for stream selection
- 🔢 **Channel numbers** instead of DMX addresses
- ✨ **Touch-optimized** interface

**Video fixtures are now patchable in RoControl!** 🎉
