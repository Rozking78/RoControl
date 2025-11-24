# Encoder and Highlight Commands

## Encoder Commands

### Overview

The `encoder` command allows direct control of encoder wheels via CLI, mapping to the same encoders shown in the Programmer Bar. This enables precise parameter control and scripting of encoder movements.

### Command Syntax

```bash
encoder [N] [value]
enc [N] [value]      # Short form
wheel [N] [value]    # Alternative
```

**Parameters:**
- `N` - Encoder number (1-12)
- `value` - Encoder value (-255 to 255)
  - Positive values: Absolute setting
  - Negative values: Relative adjustment (future)

### Encoder Mapping

Encoders map to parameters based on the active feature set:

#### Intensity Mode (Feature Set 1)
```
encoder 1 - Dimmer
encoder 2 - Strobe
encoder 3 - Shutter
```

#### Position Mode (Feature Set 2)
```
encoder 1 - Pan
encoder 2 - Tilt
encoder 3 - Pan Fine
encoder 4 - Tilt Fine
```

#### Color Mode (Feature Set 3)
```
encoder 1 - Red
encoder 2 - Green
encoder 3 - Blue
encoder 4 - White
encoder 5 - Amber
encoder 6 - UV
```

#### Focus Mode (Feature Set 4)
```
encoder 1 - Focus
encoder 2 - Zoom
encoder 3 - Iris
encoder 4 - Edge
```

#### Gobo Mode (Feature Set 5)
```
encoder 1 - Gobo Wheel 1
encoder 2 - Gobo Rotation 1
encoder 3 - Gobo Wheel 2
encoder 4 - Gobo Rotation 2
```

#### VideoSource Mode (Feature Set 7)
```
encoder 1 - Source Select
encoder 2 - Input Brightness
encoder 3 - Input Contrast
encoder 4 - Input Saturation
```

#### VideoOutput Mode (Feature Set 8)
```
encoder 1 - Output Select
encoder 2 - Output Routing
encoder 3 - Output Effects
```

### Basic Usage

```bash
# Select fixtures first
fixture 1 thru 10

# Switch to color mode
color

# Set red encoder to 255
encoder 1 255

# Set green encoder to 128
encoder 2 128

# Set blue encoder to 50
encoder 3 50
```

### Examples

#### Quick Color Mixing

```bash
fixture 1 thru 5
color
encoder 1 255    # Red full
encoder 2 128    # Green half
encoder 3 0      # Blue off
```

#### Position Programming

```bash
fixture 1 thru 10
position
encoder 1 128    # Pan center
encoder 2 180    # Tilt up
```

#### Intensity Control

```bash
fixture 1 thru 20
intensity
encoder 1 200    # Dimmer to 200
```

### Short Form

```bash
# Standard form
encoder 1 255

# Short form (same result)
enc 1 255

# Alternative (same result)
wheel 1 255
```

### Workflow Integration

#### With Fan

```bash
fixture 1 thru 10
fan center
color
enc 1 255        # Fanned red
```

#### With Time

```bash
fixture 1 thru 5
time 5
color
enc 1 255        # Fades to red over 5 seconds
```

#### Recording Presets

```bash
fixture 1 thru 8
color
enc 1 255
enc 2 128
enc 3 50
record 3.5 "Purple Mix"
```

### Advanced Techniques

#### Layered Encoding

```bash
color
enc 1 255        # Red
enc 2 128        # Add green

position
enc 1 128        # Pan
enc 2 180        # Tilt

# Both color and position are in programmer
record cue 1
```

#### Encoder Automation

```bash
# Script encoder movements
fixture 1 thru 10
color
enc 1 0
time 10
enc 1 255        # Slow fade red up
```

---

## Highlight Commands

### Overview

The `highlight` command activates Highlight Mode, which makes selected fixtures visible at full intensity while programming. This is essential for identifying which fixtures are selected without affecting your programming values.

### Command Syntax

```bash
highlight         # Toggle highlight on/off
hi                # Short form toggle
hilight           # Alternative spelling

highlight on      # Explicitly turn on
highlight off     # Explicitly turn off
hi on             # Short form on
hi off            # Short form off
```

### What is Highlight Mode?

**Highlight Mode** temporarily overrides selected fixtures to:
- Full intensity (typically 255)
- Open shutter
- White color (or locate color)
- Center position (optional)

**Important:** Highlight does NOT affect your programmer values. It's a visual aid only.

### Basic Usage

```bash
# Select fixtures
fixture 1 thru 5

# Toggle highlight to see which are selected
highlight

# Turn off highlight
highlight off
```

### Workflow Examples

#### Finding Fixtures

```bash
# Select fixtures
1 thru 10

# Turn on highlight to see them
hi on

# Verify selection
# ... fixtures light up

# Turn off highlight
hi off

# Continue programming
color
red at 255
```

#### Programming with Highlight

```bash
# Select fixtures
fixture 1 thru 5

# Highlight to confirm selection
hi on

# Program values (highlight still on)
color
enc 1 200
enc 2 150
enc 3 100

# Turn off highlight to see programmed colors
hi off
```

#### Quick Selection Verification

```bash
# Select complex group
1+5+9+12+15

# Quick highlight check
hi

# Confirmed, turn off
hi

# Continue programming
```

### Highlight + Fan

```bash
# Select fixtures in grid
fixture 1 thru 16

# Highlight to see them
hi on

# Setup fan
fan center

# Program with fan (highlight still on)
at 255

# Turn off highlight to see fan effect
hi off
```

### Highlight + Time

```bash
# Select fixtures
fixture 1 thru 10

# Highlight on
hi on

# Set fade time
time 5

# Program change
at 200

# Highlight stays on during fade
# Turn off to see final result
hi off
```

### Highlight States

| Command | Action | Result |
|---------|--------|--------|
| `highlight` | Toggle | On→Off or Off→On |
| `hi` | Toggle | On→Off or Off→On |
| `highlight on` | Explicit On | Highlight activated |
| `highlight off` | Explicit Off | Highlight deactivated |
| `hi on` | Explicit On | Highlight activated |
| `hi off` | Explicit Off | Highlight deactivated |

### Use Cases

#### 1. Fixture Identification

```bash
# Which fixtures are in group 1?
group 1
hi              # See them light up
hi              # Turn off
```

#### 2. Complex Selections

```bash
# Verify complex selection
1 thru 5 + 10 thru 15 + 20
hi on           # Confirm
hi off          # Continue
```

#### 3. Programming Verification

```bash
# Before programming
fixture 1 thru 10
hi              # Verify selection

# Program
color
enc 1 255

# Check result
hi off          # See actual colors
```

#### 4. Live Show Operation

```bash
# Quick fixture check during show
fixture 5
hi              # Flash to verify
hi              # Off
```

### Best Practices

1. **Use Highlight Before Programming**: Always verify your selection
2. **Toggle for Quick Check**: Use `hi` to quickly flash fixtures
3. **Turn Off to See Results**: Disable highlight to see actual programming
4. **Combine with Locate**: Use with `locate` for full fixture check
5. **Use During Teaching**: Great for showing which fixtures are selected

### Highlight vs Locate

| Feature | Highlight | Locate |
|---------|-----------|--------|
| Purpose | Show selection | Reset fixture position |
| Intensity | Full | Full |
| Color | White | White |
| Position | Unchanged | Center |
| Affects Programmer | No | No |
| Duration | Until toggled off | Instant |

### Technical Details

**Highlight Behavior:**
- Does NOT write to programmer
- Temporary visual override only
- Survives feature set changes
- Works with all selection methods
- Can be toggled during fades

**Typical Highlight Values:**
- Intensity: 255 (full)
- Shutter: Open
- Color: White (255,255,255)
- Position: Current (unchanged)

### Command Aliases

All these do the same thing:

```bash
highlight       # Full command
hilight         # Alternative spelling
hi              # Short form

highlight on    # Explicit on
hilight on      # Alternative
hi on           # Short form
```

### Keyboard Shortcuts Integration

Many consoles map highlight to a physical key. In RoControl:

```bash
# CLI command
hi

# Could be mapped to keyboard shortcut
# e.g., H key or Shift+H
```

### Summary

**Encoders:**
- Direct encoder wheel control via CLI
- Supports all 12 encoder positions
- Context-aware based on active feature set
- Integrates with fan, time, and recording

**Highlight:**
- Visual selection confirmation
- Toggle or explicit on/off
- Does not affect programmer values
- Essential for live programming workflow
- Multiple command aliases for speed

Both commands enhance the professional programming workflow and enable faster, more accurate show creation!
