# Update Command

## Overview

The `update` command modifies a previously recorded object (cue or preset) with **only the values that have explicitly changed in the programmer**. This is different from `record`, which replaces the entire object.

## Key Difference: Update vs Record

**Record** - Replaces entire object:
- Records ALL current values in programmer
- Overwrites the entire preset/cue
- Example: `record 3.5` saves all color values

**Update** - Merges changes only:
- Updates ONLY the values that have changed in the programmer
- Leaves unchanged values intact
- Example: `update 3.5` only modifies the color channels you've adjusted

## Command Syntax

### Dot Notation Update

```bash
update 1.5    # Update intensity preset 5 with only programmer changes
update 2.3    # Update position preset 3 with only programmer changes
update 3.1    # Update color preset 1 with only programmer changes
```

### Text-Based Update

```bash
update cue 1           # Update cue 1 with only programmer changes
update intensity 5     # Update intensity preset 5 (same as update 1.5)
update position 3      # Update position preset 3 (same as update 2.3)
update color 1         # Update color preset 1 (same as update 3.1)
update focus 2         # Update focus preset 2 (same as update 4.2)
update gobo 3          # Update gobo preset 3 (same as update 5.3)
update videosource 1   # Update video source preset 1 (same as update 7.1)
update videooutput 2   # Update video output preset 2 (same as update 8.2)
```

## Use Cases

### Example 1: Adjusting Intensity Only

**Scenario:** You have a color preset with red=255, green=128, blue=0. You want to keep the color but adjust intensity.

```bash
# Recall existing color preset
3.5

# Adjust only intensity in programmer
at 150

# Update preset with only intensity change
update 3.5
```

**Result:** Color preset 5 now has the same RGB values but with intensity=150.

### Example 2: Tweaking Position

**Scenario:** You have a position preset with pan=200, tilt=100. You want to adjust only the tilt.

```bash
# Recall existing position preset
2.3

# Adjust only tilt in programmer
tilt at 150

# Update preset with only tilt change
update 2.3
```

**Result:** Position preset 3 now has pan=200 (unchanged), tilt=150 (updated).

### Example 3: Adding Color to Existing Cue

**Scenario:** You have a cue with position and intensity data. You want to add color without changing the existing values.

```bash
# Recall existing cue
cue 1

# Add only color values in programmer
red at 255
green at 128

# Update cue with only color changes
update cue 1
```

**Result:** Cue 1 now has original position + intensity, plus the new color values.

## Workflow Examples

### Building a Preset Gradually

```bash
# Step 1: Record initial color
fixture 1 thru 10
red at 255
record 3.1 "Red Base"

# Step 2: Later, add green component
3.1              # Recall red preset
green at 128     # Add green in programmer
update 3.1       # Update preset with green addition

# Step 3: Later, add blue component
3.1              # Recall current preset (red + green)
blue at 64       # Add blue in programmer
update 3.1       # Update preset with blue addition

# Result: Preset 3.1 now has red=255, green=128, blue=64
```

### Fine-Tuning a Cue

```bash
# Record initial cue
fixture 1 thru 10
1.5              # Recall intensity preset 5
2.3              # Recall position preset 3
3.1              # Recall color preset 1
record cue 1

# Later, adjust just the intensity
cue 1            # Recall cue
at 180           # Adjust intensity
update cue 1     # Update cue with new intensity only

# Later, adjust just one color
cue 1            # Recall cue
red at 200       # Adjust red channel
update cue 1     # Update cue with new red value only
```

## Technical Behavior

### What Gets Updated

The `update` command only modifies channels that:
1. Have explicit values in the programmer
2. Are flagged as "dirty" or "touched" by the user

### What Stays Unchanged

The `update` command preserves:
1. Channels not touched in the programmer
2. Original preset/cue name
3. Timing information (if any)
4. Other metadata

### Feature Set Context

When updating presets:
- Automatically switches to the appropriate feature set
- Only updates channels within that feature set
- Example: `update 3.5` switches to color mode and updates only color channels

## Command Reference

| Command | Description | Example |
|---------|-------------|---------|
| `update 1.5` | Update intensity preset 5 | Only changed intensity values |
| `update 2.3` | Update position preset 3 | Only changed pan/tilt values |
| `update 3.1` | Update color preset 1 | Only changed RGB values |
| `update 4.2` | Update focus preset 2 | Only changed focus/zoom/iris |
| `update cue 1` | Update cue 1 | Only changed values across all channels |
| `update color 5` | Update color preset 5 | Same as `update 3.5` |

## Best Practices

1. **Use Update for Refinements**: When tweaking existing presets/cues
2. **Use Record for New Creation**: When creating something from scratch
3. **Check Before Updating**: Recall the preset first to see what you're changing
4. **Update Incrementally**: Build complex looks by updating step-by-step
5. **Clear Between Updates**: Use `clear` to ensure only intended changes are applied

## Comparison Table

| Operation | Command | What Happens |
|-----------|---------|--------------|
| Create new | `record 3.5` | Saves all programmer values to preset |
| Replace all | `record 3.5` | Overwrites entire preset with programmer |
| Merge changes | `update 3.5` | Updates only changed values in preset |
| Recall | `3.5` | Loads preset into programmer |

## Error Handling

**Preset/Cue Doesn't Exist:**
```bash
update 3.12    # Error if preset 3.12 hasn't been recorded
```
Message: "Cannot update: color preset 12 doesn't exist. Use 'record' to create it."

**No Changes in Programmer:**
```bash
3.5           # Recall preset
update 3.5    # Error if nothing changed
```
Message: "No changes to update. Programmer has no modified values."

## Summary

The `update` command is essential for:
- Fine-tuning existing presets
- Adding attributes to cues incrementally
- Building complex looks step-by-step
- Maintaining consistency while making targeted adjustments

Use `record` to create or replace, use `update` to refine and merge!
