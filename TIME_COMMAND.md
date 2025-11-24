# Time Command

## Overview

The `time` command sets the fade/transition time for all subsequent changes. This controls how quickly values change when you make adjustments or recall presets/cues.

## Command Syntax

```bash
time [seconds]
```

**Parameter:**
- `seconds` - Fade time in seconds (0 to 3600)
  - Supports decimals (e.g., 2.5, 0.5)
  - `0` = SNAP (instant change, no fade)

## Examples

### Basic Usage

```bash
time 5        # Set 5 second fade
time 2.5      # Set 2.5 second fade
time 0.5      # Set 500ms fade
time 0        # Set SNAP (instant, no fade)
time 10       # Set 10 second fade
time 120      # Set 2 minute fade
```

### With Value Changes

```bash
# Set fade time, then change intensity
time 3
at 200        # Fades to 200 over 3 seconds

# Quick snap change
time 0
at 0          # Snaps to 0 instantly

# Smooth long fade
time 10
at 255        # Fades to 255 over 10 seconds
```

### With Preset Recall

```bash
# Smooth color transition
time 5
3.1           # Recalls color preset 1 with 5 second fade

# Instant position change
time 0
2.5           # Snaps to position preset 5 instantly

# Slow intensity fade
time 8
1.10          # Fades to intensity preset 10 over 8 seconds
```

### With Cue Playback

```bash
# Theatrical fade for cue
time 5
cue 1         # Executes cue 1 with 5 second fade

# Quick cue snap
time 0
cue 2         # Snaps to cue 2 instantly

# Slow crossfade
time 15
go            # Advances to next cue with 15 second crossfade
```

## Use Cases

### Theatrical Lighting

```bash
# Scene 1: House lights up
time 3
1.12          # Full intensity over 3 seconds

# Scene 2: Dramatic blackout
time 0
blackout      # Instant blackout

# Scene 3: Sunrise effect
time 30
3.5           # Warm amber fades in over 30 seconds
```

### Concert Lighting

```bash
# Quick snap between looks
time 0
3.1           # Red
3.2           # Blue
3.3           # Green

# Smooth color wash
time 2
3.4           # Fades between colors every 2 seconds
```

### Video Production

```bash
# Smooth position move during take
time 5
2.3           # Camera moves smoothly

# Instant cut
time 0
7.1           # Switch video source instantly
```

## Time Ranges

| Input | Display | Use Case |
|-------|---------|----------|
| `0` | SNAP (0s) | Instant changes, cuts, snaps |
| `0.1` | 100ms | Very fast changes |
| `0.5` | 500ms | Quick transitions |
| `1` | 1.0s | Fast fades |
| `2.5` | 2.5s | Medium fades |
| `5` | 5.0s | Standard theatrical fade |
| `10` | 10.0s | Slow fade |
| `30` | 30.0s | Very slow fade |
| `60` | 1m 0.0s | 1 minute fade |
| `120` | 2m 0.0s | 2 minute fade |
| `3600` | 60m 0.0s | Maximum (1 hour) |

## Display Format

The system automatically formats the time display:

- **Milliseconds** (< 1 second): `500ms`
- **Seconds** (1-59s): `5.0s`
- **Minutes + Seconds** (≥ 60s): `2m 30.0s`
- **SNAP** (0s): `SNAP (0s)`

## Workflow Examples

### Building a Show

```bash
# Preset 1: Quick snap to base look
time 0
3.1           # Red base
record cue 1

# Preset 2: Fade to warm look
time 5
3.5           # Warm amber
record cue 2

# Preset 3: Slow fade to cool look
time 10
3.8           # Cool blue
record cue 3
```

### Live Programming

```bash
# Working mode: instant changes
time 0
fixture 1 thru 10
at 255
red at 200

# Preview mode: see the fade
time 3
green at 150  # Watch it fade in

# Save with current time
record 3.9
```

### Time Stacking

```bash
# Each command uses current time setting
time 5

# All these fade over 5 seconds:
at 200
red 255
pan at 128
tilt at 200

# Change time for next operations
time 0
blue 255      # This snaps instantly
```

## Persistent State

The fade time remains active until changed:

```bash
time 5        # Set 5 second fade

# All subsequent changes use 5 seconds:
at 200
3.1
cue 1
2.5

time 0        # Change to snap
# Now all changes are instant
at 0
blackout
```

## Advanced Techniques

### Split Times (Future Enhancement)

In advanced systems, you can set separate fade/delay times:

```bash
time 5 / 2    # 5 second fade with 2 second delay (future)
time 3 / 0    # 3 second fade, no delay (future)
```

Currently, the system uses a single fade time for all changes.

### Per-Channel Times (Future Enhancement)

```bash
intensity time 2    # Intensity fades in 2s (future)
color time 5        # Color fades in 5s (future)
position time 3     # Position fades in 3s (future)
```

Currently, the time applies globally to all channels.

## Best Practices

1. **Set Time Before Changes**: Always set time before making adjustments
2. **Use 0 for Programming**: Work in snap mode while building looks
3. **Use Fades for Playback**: Enable fades when running the show
4. **Match Time to Content**: Fast for music, slow for theatrical
5. **Reset to Default**: Return to a standard time (e.g., `time 3`) after special effects

## Command Combinations

```bash
# Quick workflow: Snap programming, smooth playback
time 0
fixture 1 thru 10
at 255
3.5
record cue 1

# Now play it back with fade
time 5
cue 1         # Smooth 5-second fade

# Stack multiple time changes
time 10
1.5           # Slow intensity fade
time 2
3.3           # Quick color change
time 0
2.1           # Snap position
```

## Error Handling

**Invalid Range:**
```bash
time -1       # Error: negative time
time 4000     # Error: exceeds maximum (3600s)
```

**Invalid Format:**
```bash
time abc      # Error: not a number
time          # Error: missing parameter
```

## Technical Details

- **Range**: 0 to 3600 seconds (0 to 1 hour)
- **Precision**: Supports decimal values (0.1, 2.5, etc.)
- **Scope**: Affects all subsequent changes
- **Persistence**: Remains active until changed
- **Default**: System default (typically 0 or 3 seconds)

## Summary

The `time` command is essential for:
- Controlling fade/transition speed
- Creating smooth theatrical effects
- Instant cuts and snaps
- Professional show programming
- Live performance control

Use `time 0` for programming, use fades for playback!
