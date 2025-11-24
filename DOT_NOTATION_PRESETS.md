# Dot Notation Preset System

## Overview

The CLI now supports a hierarchical preset system using dot notation, following professional lighting console paradigms. Each feature set has a number (1-8), and presets can be referenced using `[featureset].[preset]` syntax.

## Feature Set Numbers

| Number | Feature Set  | Description                    |
|--------|-------------|--------------------------------|
| 1      | intensity   | Intensity control (Dimmer)     |
| 2      | position    | Position control (Pan/Tilt)    |
| 3      | color       | Color control (RGB, etc.)      |
| 4      | focus       | Focus control (Focus/Zoom/Iris)|
| 5      | gobo        | Gobo wheel selection           |
| 6      | beam        | Beam shaping attributes        |
| 7      | videosource | Video source selection         |
| 8      | videooutput | Video output routing           |

## Command Syntax

### Dot Notation Commands

**Recall Preset:**
```
1.5          - Recall intensity preset 5
2.3          - Recall position preset 3
3.1          - Recall color preset 1
7.1          - Recall video source preset 1
```

**Record Preset:**
```
record 1.5           - Record intensity preset 5
record 2.3 "Left"    - Record position preset 3 with name "Left"
record 3.5 "Red"     - Record color preset 5 with name "Red"
record 7.1 "Camera1" - Record video source preset 1 with name "Camera1"
```

**Group Preset Application:**
```
group 1 preset 1.5  - Apply intensity preset 5 to group 1
group 2 preset 2.3  - Apply position preset 3 to group 2
group 1 preset 3.1  - Apply color preset 1 to group 1
group 1 preset 7.1  - Apply video source preset 1 to group 1
```

### Legacy Text-Based Commands (Still Supported)

**Feature Set Switching:**
```
color       - Switch to color feature set
videosource - Switch to video source feature set
```

**Text-Based Recall:**
```
intensity 5  - Recall intensity preset 5 (same as 1.5)
position 3   - Recall position preset 3 (same as 2.3)
color 5      - Recall color preset 5 (same as 3.5)
```

**Text-Based Record:**
```
record intensity 5 - Record intensity preset 5 (same as record 1.5)
record position 3  - Record position preset 3 (same as record 2.3)
record color 5     - Record color preset 5 (same as record 3.5)
```

**Contextual Record:**
```
record           - Record contextually (cue by default, or hints user if in preset mode)
record "MyName"  - Record cue with name
```

## Examples

### Complete Workflow

```bash
# Select fixtures
fixture 1 thru 10

# Set color values
red at 255
green at 128
blue at 50

# Record as color preset 5 using dot notation
record 3.5 "Warm Amber"

# Set position
pan at 200
tilt at 150

# Record as position preset 3
record 2.3 "Stage Left"

# Clear programmer
clear

# Recall later using dot notation
fixture 1 thru 10
3.5         # Recall color preset 5
2.3         # Recall position preset 3
1.10        # Recall intensity preset 10
```

### Group Operations

```bash
# Create group 1 with fixtures 1-5
fixture 1 thru 5
record group 1

# Apply color preset to group
group 1 preset 3.1  # Apply color preset 1 to group 1

# Apply position preset to group
group 1 preset 2.5  # Apply position preset 5 to group 1
```

### Video Routing with Dot Notation

```bash
# Record video source configurations
videosource             # Switch to video source mode
record 7.1 "Camera 1"   # Record camera 1 configuration
record 7.2 "Camera 2"   # Record camera 2 configuration

# Record video output configurations
videooutput             # Switch to video output mode
record 8.1 "Main Screen" # Record main screen configuration
record 8.2 "Preview"     # Record preview configuration

# Recall video configurations
7.1         # Activate camera 1
8.1         # Route to main screen
```

## Implementation Details

### Files Created

**src/utils/featureSetMapping.js**
- Feature set number mappings
- Dot notation parsing utilities
- Conversion functions

### Files Modified

**src/utils/cliParser.js**
- Added dot notation parsing (`1.5`, `2.3`, etc.)
- Added group preset command parsing (`group 1 preset 1.5`)
- Added dot notation record commands (`store 1.5`)
- Imports featureSetMapping utilities

**src/utils/cliDispatcher.js**
- Added `handleRecallDot()` - Handle dot notation recall
- Added `handleRecordDot()` - Handle dot notation record
- Added `handleGroupPreset()` - Handle group preset application
- Updated help text with dot notation syntax

### Command Types Added

| Type               | Example              | Description                    |
|-------------------|----------------------|--------------------------------|
| recall_dot        | `1.5`                | Recall preset using dot notation|
| record_dot        | `record 1.5`         | Record preset using dot notation|
| record_contextual | `record`             | Contextual record command       |
| group_preset      | `group 1 preset 1.5` | Apply preset to group          |

## Advantages of Dot Notation

1. **Faster Input**: `3.5` is quicker than `color 5`
2. **Single Command**: `record` works contextually
3. **Muscle Memory**: Consistent with MA3/Hog paradigms
4. **Precise**: No ambiguity about which feature set
5. **Scalable**: Easy to reference any preset without typing full names
6. **Professional**: Industry-standard syntax

## Backward Compatibility

All existing text-based commands continue to work:
- `color 5` still works (equivalent to `3.5`)
- `record color 5` still works (equivalent to `record 3.5`)
- Feature set names (`color`, `videosource`, etc.) still work for switching

## Contextual Record

The `record` command now works contextually:
- Just type `record` and it will determine what to record based on your current state
- If you have fixtures selected with an active feature set, it guides you to record a preset
- Otherwise, it records a cue
- You can always be explicit: `record 1.5`, `record cue 1`, etc.

## Preset Number Ranges

All feature sets support 12 presets (1-12):
- Valid: `1.1` through `1.12` (intensity presets 1-12)
- Valid: `2.1` through `2.12` (position presets 1-12)
- Valid: `3.1` through `3.12` (color presets 1-12)
- Valid: `7.1` through `7.12` (video source presets 1-12)
- Invalid: `1.13` (out of range)
- Invalid: `9.1` (invalid feature set)

## CLI Help

Type `help` to see the updated command reference:

```
CLI Commands:
- fixture [N] | [N] thru [M] - Select fixtures
- [N]+[M]+... - Select multiple fixtures
- at [value] - Set intensity (0-255)
- [channel] at [value] - Set channel value
- [channel] [value] - Set channel value (shorthand)
- clear | c - Clear programmer
- blackout | bo - Trigger blackout
- locate | loc - Locate selected fixtures

Feature Sets (1-8):
1=intensity, 2=position, 3=color, 4=focus, 5=gobo, 6=beam, 7=videosource, 8=videooutput
- [featureset] - Switch feature set (e.g., color, videosource)
- [N].[P] - Recall preset (e.g., 1.5 = intensity preset 5, 3.1 = color preset 1)
- record [N].[P] - Record preset (e.g., record 3.5 for color preset 5)
- record [featureset] [N] - Record preset (e.g., record color 1)
- group [G] preset [N].[P] - Apply preset to group (e.g., group 1 preset 3.5)

Legacy Commands:
- [featureset] [N] - Recall preset (e.g., color 1)

Cues & Recording:
- record - Contextual record (cue or preset based on state)
- record cue [N] - Record specific cue
- cue [N] | go - Recall cue

Windows:
- window [N] | open [N] - Open window
- close [N] - Close window

Video Control:
- play video[N] output[N] - Play video to output
- pause/stop/restart video[N] - Control video playback

Help:
- help - Show this help
```

## Build Status

```bash
npm run build
✓ 93 modules transformed
✓ built in 1.93s
✅ SUCCESS - No errors
```

## Next Steps

1. Add default presets for VideoSource and VideoOutput feature sets
2. Create preset windows UI for each feature set
3. Add visual indicators showing feature set numbers in UI
4. Implement group management system
5. Add preset naming/labeling in UI
