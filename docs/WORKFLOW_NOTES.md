# RoControl Workflow & Development Notes

This document contains workflow notes, future feature considerations, and development guidelines for RoControl.

## Future Feature Considerations

### Dual Programmer Operation Mode

**Concept:** Allow two programmers to operate simultaneously, enabling more complex show programming and live operation scenarios.

**Potential Use Cases:**
- Two operators working on different fixture groups simultaneously
- One operator programming while another operates the show
- A/B comparison of different programming approaches
- Training scenarios where instructor and student work in parallel

**Technical Considerations:**
- **Isolation:** Each programmer needs its own state (selected fixtures, active values, feature set)
- **Merge Strategy:** Define how values from both programmers combine in output
  - Priority-based (Programmer 1 overrides Programmer 2 or vice versa)
  - HTP (Highest Takes Precedence) for intensity
  - LTP (Latest Takes Precedence) for position/color
- **UI Requirements:**
  - Split-screen or tabbed programmer view
  - Visual indicators showing which programmer is active
  - Ability to switch between programmers quickly (Steam Deck L4/R4 buttons?)
- **Record Behavior:**
  - Each programmer can record to separate cues/executors
  - Option to merge both programmers into a single cue
- **Conflict Resolution:**
  - What happens when both programmers select the same fixture?
  - Options: Lock fixtures to one programmer, allow shared control, or show warning

**Implementation Notes:**
- Start with basic dual state management
- Add merge logic incrementally
- Test with simple scenarios before complex multi-operator workflows
- Consider backwards compatibility with single-programmer mode

**Priority:** Medium - useful for advanced users but not critical for v1.0

---

## Group Handle System

### Auto-Assignment of Group Handle Fixture Numbers

**Specification:**
- Group handles are automatically assigned fixture numbers starting at **4001**
- This allows group handles to appear in the fixture patch table alongside regular fixtures
- Group handles are editable in the fixture patch table
- Fixture numbers 1-4000 are reserved for physical/video fixtures
- Fixture numbers 4001+ are reserved for group handles

**Behavior:**
- When a group handle is created: `record group 1 exec 1.x`
  - System assigns fixture number 4001 to this group handle
  - Group handle appears in fixture patch window
  - Group handle can be selected like a regular fixture: `fixture 4001`
  - Next group handle gets 4002, and so on

**Group Handle Modes:**
- **Inhibitive (Default):** Group handle reduces/blocks output of contained fixtures
- **Additive:** Group handle adds to existing output
- **Scaling:** Group handle scales existing output by percentage
- **Subtractive:** Group handle subtracts from existing output

**Implementation Tasks:**
- [ ] Add `group_handles` collection to app state (start at 4001)
- [ ] Modify `record group` command to auto-assign fixture numbers
- [ ] Add group handles to fixture patch table with "(Group)" indicator
- [ ] Implement group handle selection via fixture commands
- [ ] Add mode selector for group handles (inhibitive/additive/scaling/subtractive)
- [ ] Implement output merge logic for each mode
- [ ] Make group handle fixture numbers editable in patch table

---

## Command Enhancements

### IF Command Support

**Purpose:** Conditional execution based on time, state, or other conditions

**Syntax Examples:**
```
GO exec 1.15 IF clock.15 TRR=0
GO cue 5 IF time > 18:00
RECORD preset 3.1 IF programmer NOT EMPTY
AT full IF fixture.1.intensity > 0
```

**Condition Types:**
- **Time-based:** `time > 18:00`, `time < sunrise`, `timecode = 01:23:45:00`
- **Clock-based:** `clock.15 TRR=0` (time remaining = 0)
- **State-based:** `programmer EMPTY`, `programmer NOT EMPTY`, `blackout ACTIVE`
- **Fixture-based:** `fixture.1.intensity > 128`, `fixture.5.red = 255`
- **Cue-based:** `cue.5 RUNNING`, `exec.3 ACTIVE`

**Implementation:**
- Parse IF conditions in CLI parser
- Evaluate conditions before executing commands
- Support logical operators: AND, OR, NOT
- Add condition result to command history

---

## Recording Behavior Updates

### Default Record Behavior

**Current Behavior:** (To be confirmed)

**New Behavior:**

1. **When Programmer Has Active Fixtures/Values:**
   ```
   record exec 1.x [ENTER]
   ```
   - Creates a **cue** in executor 1 at next available cue number
   - Cue contains all active programmer values
   - Programmer is automatically cleared after record (optional setting)

2. **When Programmer is Empty:**
   ```
   record group x exec 1.x [ENTER]
   ```
   - Creates a **group handle** in executor 1 at position x
   - Group handle is assigned fixture number 4001+ (auto-increment)
   - Group handle appears in fixture window
   - Group handle mode defaults to "inhibitive"

**Examples:**
```bash
# Programmer has fixtures 1-10 at full intensity
record exec 1 [ENTER]
# Result: Creates cue 1.1 in executor 1

# Programmer has color values for fixtures 1-5
record exec 2 [ENTER]
# Result: Creates cue 2.1 in executor 2

# Programmer is empty
record group 1 exec 1.5 [ENTER]
# Result: Creates group handle 1, assigned fixture number 4001
#         Stored in executor 1 at position 5
#         Group appears in fixture window
```

---

## Time Features

### Program Time Button

**Purpose:** Set default fade time for programmer operations

**Behavior:**
- Button/input field in programmer bar
- User sets time in seconds (e.g., 3.5, 10, 0.5)
- All subsequent programmer changes use this time
- Does NOT affect cue times or executor times
- Visual indicator shows current program time

**Implementation:**
- Add `programTime` state (default 0)
- Add time input/buttons to programmer UI
- Apply `programTime` to DMX output fades
- Display program time in programmer bar: "Prog Time: 3.0s"

---

### Cue/Executor Time Button

**Purpose:** Set fade time for individual cues or executors

**Behavior:**
- Separate time setting for cues/executors
- Overrides program time when cue is executed
- Can be set per-cue or per-executor
- Saved with cue data

**Syntax:**
```bash
time 5 cue 3        # Set cue 3 fade time to 5 seconds
time 2.5 exec 1     # Set executor 1 fade time to 2.5 seconds
time 0 exec 2.5     # Set cue 5 in executor 2 to snap (0 seconds)
```

**UI:**
- Time column in cue list
- Time input in executor panel
- Quick time buttons: [0s] [1s] [3s] [5s] [10s]

---

## Clocks Feature

### Overview

Clocks provide time-based references for automation, conditional execution, and synchronized playback.

### Clock Types

1. **Time of Day**
   - Current system time
   - Reference: `clock.1` or `clock.TOD`
   - Format: HH:MM:SS

2. **Time of Sunset/Sunrise**
   - Calculated based on location and date
   - Reference: `clock.sunset`, `clock.sunrise`
   - Requires GPS coordinates or manual location entry

3. **Timecode**
   - External timecode sync (LTC, MTC, MIDI)
   - Reference: `clock.timecode` or `clock.2`
   - Format: HH:MM:SS:FF (hours:minutes:seconds:frames)

4. **Current Video Time**
   - Playback position of video fixture
   - Reference: `clock.video.1` (for video fixture 1)
   - Format: MM:SS.mmm (minutes:seconds.milliseconds)

5. **Current Video Time Remaining (TRR)**
   - Time until video fixture ends
   - Reference: `clock.video.1.TRR`
   - Format: MM:SS.mmm

6. **Countdown Timers**
   - User-defined countdown clocks
   - Reference: `clock.countdown.1`
   - Can be started, stopped, reset via CLI

### Clock Feature Set Numbering

Clocks are assigned feature set numbers for CLI reference:

- **clock.1** - Time of Day
- **clock.2** - Timecode
- **clock.3** - Countdown Timer 1
- **clock.4** - Countdown Timer 2
- **clock.sunrise** - Sunrise time
- **clock.sunset** - Sunset time
- **clock.video.N** - Video N current time
- **clock.video.N.TRR** - Video N time remaining

### CLI Examples

```bash
# Reference clock in IF command
GO exec 1.15 IF clock.15 TRR=0
# Execute cue 15 in executor 1 when video fixture 15 has 0 time remaining

# Set cue to trigger at specific time
GO cue 5 IF clock.1 = 18:30:00
# Execute cue 5 when time of day is 6:30 PM

# Sync to timecode
GO exec 2 IF clock.timecode = 01:23:45:15
# Execute executor 2 when timecode hits 1h 23m 45s 15f

# Countdown timer
START clock.3 AT 00:10:00
# Start countdown timer 3 at 10 minutes

GO cue 10 IF clock.3 TRR = 0
# Execute cue 10 when countdown timer 3 reaches zero
```

### Clock Save Window

**Purpose:** Configure and save clock settings

**Features:**
- List of all active clocks
- Clock type selection
- Clock properties:
  - Name/label
  - Source (system, external, manual)
  - Format
  - Offset/correction
- Location settings for sunrise/sunset
- Timecode source selection
- Video fixture mapping
- Save/load clock configurations

**UI Layout:**
```
┌─ Clocks Configuration ──────────────────────────┐
│                                                  │
│ Clock 1 - Time of Day          [Edit] [Delete]  │
│   Source: System Time                            │
│   Format: HH:MM:SS                               │
│   Offset: +0:00:00                               │
│                                                  │
│ Clock 15 - Video Fixture 15    [Edit] [Delete]  │
│   Source: Video Fixture 15                       │
│   Type: Time Remaining (TRR)                     │
│   Format: MM:SS.mmm                              │
│                                                  │
│ [+ Add Clock]                  [Save] [Cancel]   │
└──────────────────────────────────────────────────┘
```

---

## Implementation Priority

1. ✅ Steam Deck Integration (COMPLETED)
2. ✅ Web Remote Steam Deck Support (COMPLETED)
3. ✅ NDI Support (COMPLETED)
4. ⏳ Group Handle Auto-Assignment (fixture 4001+)
5. ⏳ Program Time Button
6. ⏳ Cue/Executor Time Button
7. ⏳ Clocks Feature (basic time of day + video TRR)
8. ⏳ Clock Save Window
9. ⏳ IF Command Support
10. ⏳ Updated Record Behavior
11. 🔮 Dual Programmer Mode (future consideration)

---

## Notes

- **Feature Set Numbering:** Maintain consistent numbering across features (1-8 for fixture attributes, 4001+ for groups, clock.X for time sources)
- **CLI Consistency:** All commands should follow MA3/Hog-style syntax
- **Web API:** Ensure all features are accessible via web remote API
- **Save/Load:** All configurations should be saveable in show files
- **Documentation:** Update user docs as features are implemented

---

*Last Updated: 2025-11-22*
