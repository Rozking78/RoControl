# Fan Command

## Overview

The `fan` command creates offset spreads for parameters and times across selected fixtures based on their grid positions. This creates smooth gradients, waves, and dynamic effects across multiple fixtures.

## Command Syntax

```bash
fan [mode] [axis]
```

**Modes:**
- `center` (default) - Center offset, values spread outward from center
- `left` - Left offset, values increase from left to right
- `right` - Right offset, values increase from right to left
- `outside` - Outside in, values decrease toward center

**Axes:**
- `x` (default) - Horizontal axis (left-right)
- `y` - Vertical axis (top-bottom)

## Fan Modes Explained

### Center (Default)
Values spread outward from the center fixture(s).

```
Grid Position:  1    2    3    4    5
Center Fan:    Low  Med  High Med  Low
Example:       100  150  200  150  100
```

Center fixtures get the highest value, outer fixtures get lower values.

### Left
Values increase from left to right.

```
Grid Position:  1    2    3    4    5
Left Fan:      Low  ↑    ↑    ↑   High
Example:       100  125  150  175  200
```

Leftmost fixtures get the lowest value, rightmost get the highest.

### Right
Values increase from right to left.

```
Grid Position:  1    2    3    4    5
Right Fan:     High ↓    ↓    ↓   Low
Example:       200  175  150  125  100
```

Rightmost fixtures get the lowest value, leftmost get the highest.

### Outside
Values decrease toward the center (inverse of center).

```
Grid Position:  1    2    3    4    5
Outside Fan:   High Med  Low  Med  High
Example:       200  150  100  150  200
```

Outer fixtures get the highest value, center fixtures get lower values.

## Basic Usage

### Setting Fan Mode and Axis

```bash
fan              # Enable center fan on x axis (default)
fan center       # Explicit center fan on x axis
fan center x     # Explicit center fan on x axis
fan center y     # Center fan on y axis (vertical)
fan left         # Left to right fan on x axis
fan left y       # Top to bottom fan on y axis
fan right        # Right to left fan on x axis
fan right y      # Bottom to top fan on y axis
fan outside      # Outside to inside fan on x axis
fan outside y    # Outside to inside fan on y axis
```

### X Axis (Horizontal - Default)

```
Grid (X axis):
1  2  3  4  5

fan left x:    100 → 125 → 150 → 175 → 200
fan right x:   200 → 175 → 150 → 125 → 100
fan center x:  100 → 150 → 200 → 150 → 100
```

### Y Axis (Vertical)

```
Grid (Y axis):
1
2
3
4
5

fan left y:    100 ↓ 125 ↓ 150 ↓ 175 ↓ 200
fan right y:   200 ↓ 175 ↓ 150 ↓ 125 ↓ 100
fan center y:  100 ↓ 150 ↓ 200 ↓ 150 ↓ 100
```

### With Parameter Values

```bash
# Select fixtures in a grid
fixture 1 thru 10

# Enable fan mode
fan center

# Set intensity - fanned across fixtures
at 200
# Result: Center fixtures at 200, outer fixtures at lower values

# Set color - fanned across fixtures
red at 255
# Result: Center fixtures at full red, outer fixtures at lower red
```

## Use Cases

### 1. Intensity Waves

**Horizontal (X Axis):**
```bash
# Select 10 fixtures in a row
fixture 1 thru 10

# Center peak intensity (horizontal)
fan center x
at 255
# Result: Center bright, edges dim (left-right)

# Left to right sweep
fan left x
at 255
# Result: Gradual increase left to right

# Outside glow (horizontal)
fan outside x
at 255
# Result: Left and right edges bright, center dim
```

**Vertical (Y Axis):**
```bash
# Select fixtures in a column
fixture 1 thru 10

# Center peak intensity (vertical)
fan center y
at 255
# Result: Center bright, top and bottom dim

# Top to bottom sweep
fan left y
at 255
# Result: Gradual increase top to bottom

# Outside glow (vertical)
fan outside y
at 255
# Result: Top and bottom bright, center dim
```

### 2. Color Gradients

```bash
# Select fixtures
fixture 1 thru 8

# Rainbow effect - left to right
fan left

# Red increases left to right
red at 255

# Switch to right mode for blue
fan right
blue at 255

# Result: Red on left, blue on right, purple in middle
```

### 3. Position Spreads

```bash
# Select fixtures
fixture 1 thru 12

# Fan tilt positions
fan center
tilt at 128

# Result: Center fixtures pointing center,
# outer fixtures tilted outward
```

### 4. Time Offsets (Chase Effects)

```bash
# Select fixtures
fixture 1 thru 10

# Enable left fan for time
fan left

# Set base fade time
time 5

# Change intensity
at 255

# Result: Each fixture fades to 255,
# starting from left, creating a wave effect
```

## Advanced Techniques

### Layered Fans with Different Axes

```bash
# Select fixtures in a grid
fixture 1 thru 9  # 3x3 grid

# Horizontal center intensity
fan center x
at 200

# Vertical left color gradient
fan left y
red at 255

# Horizontal outside position spread
fan outside x
pan at 180

# Result: Complex multi-dimensional fan effect
# Intensity: horizontal center peak
# Color: vertical gradient top to bottom
# Position: horizontal outside spread
```

### Cross-Axis Effects

```bash
# Create a cross pattern
fixture 1 thru 16  # 4x4 grid

# Horizontal fan
fan center x
at 255

# Then vertical fan on different parameter
fan center y
red at 255

# Result: Cross-shaped brightness and color pattern
```

### Dynamic Direction Changes

```bash
# Build up left
fan left
at 255
record cue 1

# Build up right
fan right
at 255
record cue 2

# Center peak
fan center
at 255
record cue 3

# Play sequence for wave effect
cue 1
cue 2
cue 3
```

### Fan with Groups

```bash
# Group 1: Front row
fixture 1 thru 5
record group 1

# Group 2: Back row
fixture 6 thru 10
record group 2

# Fan front row left
group 1
fan left
at 200

# Fan back row right
group 2
fan right
at 200

# Result: Crossing wave pattern
```

## Grid-Based Fan Calculation

The fan uses the Grid Tool's fixture layout to determine positions based on the selected axis.

### X Axis Fan (Horizontal)

```
Grid Example (3x3):
1  2  3
4  5  6
7  8  9

fan center x (at 255):
150 200 150
150 200 150
150 200 150

fan left x (at 255):
100 150 200
100 150 200
100 150 200

fan outside x (at 255):
200 150 200
200 150 200
200 150 200
```

### Y Axis Fan (Vertical)

```
Grid Example (3x3):
1  2  3
4  5  6
7  8  9

fan center y (at 255):
150 150 150
200 200 200
150 150 150

fan left y (at 255):
100 100 100
150 150 150
200 200 200

fan outside y (at 255):
200 200 200
150 150 150
200 200 200
```

## Fan Algorithm

### Center Mode
1. Find center fixture(s) in grid
2. Calculate distance from center for each fixture
3. Apply value inversely proportional to distance
4. Center = full value, edges = reduced value

### Left Mode
1. Find leftmost fixture in grid
2. Calculate horizontal position for each fixture
3. Apply value proportional to position
4. Left = minimum value, right = maximum value

### Right Mode
1. Find rightmost fixture in grid
2. Calculate horizontal position for each fixture
3. Apply value inversely proportional to position
4. Right = minimum value, left = maximum value

### Outside Mode
1. Find center fixture(s) in grid
2. Calculate distance from center for each fixture
3. Apply value proportional to distance
4. Center = minimum value, edges = maximum value

## Parameter Fan Examples

### Intensity Fan

```bash
fixture 1 thru 10
fan center
at 255

# Fixture:  1    2    3    4    5    6    7    8    9   10
# Value:   100  150  180  220  255  255  220  180  150  100
```

### Color Fan (RGB)

```bash
fixture 1 thru 5
fan left

red at 255     # Red increases left to right
blue at 255    # Blue same gradient
# Result: Purple gradient

fan right
green at 255   # Green decreases left to right
# Result: Complex color mix
```

### Position Fan (Pan/Tilt)

```bash
fixture 1 thru 6
fan center

pan at 128     # Pan spread from center
tilt at 180    # Tilt spread from center
# Result: Fixtures point outward from center
```

## Time Fan Examples

### Wave Chase

```bash
fixture 1 thru 10
fan left
time 5

# Each fixture's changes start progressively later
at 255
# Result: Wave of light traveling left to right
```

### Ripple Effect

```bash
fixture 1 thru 9  # 3x3 grid
fan center
time 3

at 200
# Result: Ripple from center outward
```

### Outside In Chase

```bash
fixture 1 thru 8
fan outside
time 2

at 255
# Result: Outer fixtures change first, center last
```

## Workflow Examples

### Building a Show Look

```bash
# Step 1: Base intensity
fixture 1 thru 12
fan center
at 180
record 1.1

# Step 2: Color wash
fan left
3.5  # Warm color preset
record 3.1

# Step 3: Position spread
fan outside
2.3  # Position preset
record 2.1

# Combine in cue
clear
1.1
3.1
2.1
record cue 1
```

### Interactive Effects

```bash
# Enable left fan
fan left

# Real-time parameter adjustment creates gradient
red at 255      # Gradient appears
green at 128    # Adds to gradient
at 200          # Intensity gradient

# Change direction live
fan right       # Reverses gradient
fan center      # Changes to peak
```

## Best Practices

1. **Set Fan Before Values**: Always enable fan mode before setting parameters
2. **Use Grid Tool**: Arrange fixtures in Grid Tool for proper fan calculation
3. **Combine with Time**: Use fan with time for chase effects
4. **Layer Multiple Fans**: Use different fan modes for different parameters
5. **Record Fan States**: Save fan configurations in presets/cues

## Common Patterns

### Intensity Peak

```bash
fan center
at 255
```

### Color Sweep

```bash
fan left
red at 255
```

### Position Spread

```bash
fan outside
pan at 128
tilt at 180
```

### Time Chase

```bash
fan left
time 3
at 200
```

## Command Combinations

### Single Axis Complex Fan

```bash
# Complex multi-layer fan on X axis
fixture 1 thru 10

fan center x
at 200          # Horizontal center peak intensity

fan left x
red at 255      # Left to right red gradient

fan right x
blue at 255     # Right to left blue gradient

fan outside x
time 2          # Outside in time offset (horizontal)

# Result: Center purple peak,
# red on left, blue on right,
# time-offset ripple effect (horizontal)
```

### Multi-Axis Complex Fan

```bash
# Different fans on different axes
fixture 1 thru 16  # 4x4 grid

fan center x
at 200          # Horizontal center peak

fan center y
red at 255      # Vertical center peak for red

fan left x
green at 255    # Horizontal left-right green gradient

fan left y
blue at 255     # Vertical top-bottom blue gradient

# Result: Cross-shaped intensity,
# red vertical center, green horizontal gradient,
# blue vertical gradient - complex color mixing
```

## Technical Details

- **Grid Dependency**: Requires Grid Tool layout for position calculation
- **Value Range**: Fan applies to 0-255 parameter values
- **Time Range**: Fan applies to 0-3600 second time values
- **Persistence**: Fan mode remains active until changed
- **Scope**: Applies to all selected fixtures

## Error Handling

**No Fixtures Selected:**
```bash
fan center
at 255
# Error: No fixtures selected
```

**No Grid Layout:**
```bash
fixture 1 thru 10
fan center
# Warning: Grid layout not found, using linear fallback
```

## Limitations

- Requires fixtures arranged in Grid Tool
- Works best with fixtures in geometric patterns
- Complex grid shapes may produce unexpected results
- Fan calculation is 2D (grid-based), not 3D

## Future Enhancements

- **3D Fan**: Fan based on 3D fixture positions
- **Custom Curves**: Exponential, logarithmic fan curves
- **Fan Amount**: Adjustable fan strength (0-100%)
- **Multi-Axis**: Separate X and Y fan modes

## Summary

The `fan` command is essential for:
- Creating smooth gradients across fixtures
- Building wave and chase effects
- Spreading positions and colors
- Time-offset animations
- Professional multi-fixture looks

Use fan modes to create dynamic, flowing effects across your rig!
