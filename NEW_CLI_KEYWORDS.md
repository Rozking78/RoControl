# New CLI Keywords & Modifiers for Approval

Based on analysis of new features, here are the CLI keywords and modifiers that need to be implemented:

---

## 📋 Clock Keywords

### 1. **CLOCK** or **CLK**
Reference a clock object
```bash
clock.1          # Time of Day
clock.2          # Timecode
clock.15         # Countdown timer 15 or video fixture 15
```

### 2. **TOD** (Time of Day)
Alias for clock.1
```bash
clock.TOD = 18:30:00
```

### 3. **TC** (Timecode)
Alias for clock.2 / clock.timecode
```bash
clock.TC = 01:23:45:15
IF clock.TC > 00:00:00:00
```

### 4. **TRR** (Time Remaining)
Time remaining modifier for clocks/videos
```bash
clock.15 TRR=0           # When video fixture 15 has 0 time remaining
clock.video.5.TRR        # Video 5 time remaining
```

### 5. **START** (Start clock/timer)
Start a countdown timer or clock
```bash
START clock.3 AT 00:10:00    # Start 10 minute countdown
START clock.5                # Start clock 5
```

### 6. **STOP** (Stop clock/timer)
Stop a running clock/timer
```bash
STOP clock.3
```

### 7. **RESET** (Reset clock/timer)
Reset a clock/timer to initial value
```bash
RESET clock.3
```

### 8. **SUNRISE**
Reference sunrise clock
```bash
clock.sunrise
IF time > sunrise
```

### 9. **SUNSET**
Reference sunset clock
```bash
clock.sunset
IF time < sunset
```

---

## 📋 Group Handle Keywords

### 10. **GROUP**
Reference or create a group handle
```bash
group 1                      # Select group 1 (fixture 4001)
record group 1 exec 1.5      # Create group handle 1
```

### 11. **I** or **INHIBITIVE**
Set group handle to inhibitive mode (default)
```bash
group 1 mode I
group 1 mode inhibitive
```

### 12. **A** or **ADDITIVE**
Set group handle to additive mode
```bash
group 1 mode A
group 1 mode additive
```

### 13. **SC** or **SCALING**
Set group handle to scaling mode
```bash
group 1 mode SC
group 1 mode scaling
group 1 intensity 75         # Scale to 75%
```

### 14. **SU** or **SUBTRACTIVE**
Set group handle to subtractive mode
```bash
group 1 mode SU
group 1 mode subtractive
```

### 15. **MODE**
Set or query group handle mode
```bash
group 1 mode A               # Set to additive
group 1 mode?                # Query current mode
```

### 16. **PRIORITY**
Set group handle priority (0-100)
```bash
group 1 priority 75
```

---

## 📋 Time Command Keywords

### 17. **TIME**
Set fade time for programmer/cue/executor
```bash
time 5                       # Set program time to 5 seconds
time 3 cue 1                 # Set cue 1 time to 3 seconds
time 2.5 exec 1              # Set executor 1 time to 2.5 seconds
time 0 cue 5                 # Snap (instant) for cue 5
```

### 18. **CUE**
Reference a cue
```bash
time 5 cue 3
GO cue 5
IF cue.5 RUNNING
```

### 19. **EXEC** or **EXECUTOR**
Reference an executor
```bash
time 3 exec 1
GO exec 1.15
IF exec.3 ACTIVE
```

---

## 📋 Conditional Keywords (IF Commands)

### 20. **IF**
Conditional execution
```bash
GO cue 5 IF time > 18:00
AT full IF fixture.1.intensity > 0
```

### 21. **AND**
Logical AND operator
```bash
GO cue 5 IF time > 18:00 AND time < 22:00
```

### 22. **OR**
Logical OR operator
```bash
GO cue 10 IF blackout ACTIVE OR programmer EMPTY
```

### 23. **NOT**
Logical NOT operator
```bash
RECORD preset 3.1 IF programmer NOT EMPTY
```

### 24. **EMPTY**
Check if programmer/selection is empty
```bash
IF programmer EMPTY
IF selection NOT EMPTY
```

### 25. **ACTIVE**
Check if something is active/running
```bash
IF blackout ACTIVE
IF exec.3 ACTIVE
```

### 26. **RUNNING**
Check if cue/executor is running
```bash
IF cue.5 RUNNING
IF exec.2 RUNNING
```

---

## 📋 State Query Keywords

### 27. **PROGRAMMER**
Reference programmer state
```bash
IF programmer EMPTY
IF programmer NOT EMPTY
clear programmer
```

### 28. **BLACKOUT**
Blackout state/command
```bash
blackout                     # Toggle blackout
IF blackout ACTIVE
```

---

## 📋 Video Keywords

### 29. **VIDEO**
Reference video fixture or clock
```bash
video 15                     # Select video fixture 15
clock.video.15               # Video 15 current time
clock.video.15.TRR           # Video 15 time remaining
```

### 30. **PLAY**
Play video fixture
```bash
PLAY video 15
```

### 31. **PAUSE**
Pause video fixture
```bash
PAUSE video 15
```

### 32. **RESUME**
Resume video playback
```bash
RESUME video 15
RESUME exec 1
```

---

## 📋 NDI Keywords

### 33. **NDI**
Reference NDI source
```bash
video 15 source ndi Camera1
ndi discover
ndi list
```

### 34. **DISCOVER**
Start NDI discovery
```bash
ndi discover
```

### 35. **SOURCE**
Set video source
```bash
video 15 source ndi Camera1
video 15 source file video.mp4
```

---

## 📋 Record Behavior Keywords

### 36. **RECORD**
Record to preset/cue/group
```bash
record 3.1                   # Record to preset (feature set 3, slot 1)
record cue 1                 # Record to cue 1
record exec 1                # Record to executor 1 (creates cue)
record group 1 exec 1.5      # Create group handle 1 in exec 1, slot 5
```

### 37. **UPDATE**
Update existing preset/cue (merge)
```bash
update 3.1                   # Update color preset 1
update cue 5
```

---

## 📋 Comparison Operators

### 38. **=** or **==**
Equals
```bash
IF clock.1 = 18:30:00
IF fixture.1.red == 255
```

### 39. **>**
Greater than
```bash
IF time > 18:00
IF fixture.1.intensity > 128
```

### 40. **<**
Less than
```bash
IF time < sunrise
IF clock.3 TRR < 00:01:00
```

### 41. **>=**
Greater than or equal
```bash
IF fixture.5.pan >= 128
```

### 42. **<=**
Less than or equal
```bash
IF fixture.5.tilt <= 64
```

### 43. **!=** or **<>**
Not equal
```bash
IF cue.5 != RUNNING
IF clock.1 <> 12:00:00
```

---

## 📋 Action Keywords

### 44. **GO**
Execute/trigger cue or executor
```bash
GO cue 5
GO exec 1.15
GO cue 10 IF clock.3 TRR=0
```

### 45. **AT**
Set parameter value
```bash
at 255                       # Set dimmer to 255
red at 128
at full                      # Set to maximum
at 0                         # Set to zero
```

### 46. **FULL**
Maximum value (255)
```bash
at full
intensity at full
```

### 47. **THRU** or **THROUGH**
Range selection
```bash
1 thru 10                    # Fixtures 1-10
fixture 5 thru 20
```

---

## 📊 Summary by Category

### Clocks (9 keywords):
1. CLOCK / CLK
2. TOD
3. TC
4. TRR
5. START
6. STOP
7. RESET
8. SUNRISE
9. SUNSET

### Group Handles (7 keywords):
10. GROUP
11. I / INHIBITIVE
12. A / ADDITIVE
13. SC / SCALING
14. SU / SUBTRACTIVE
15. MODE
16. PRIORITY

### Time Commands (3 keywords):
17. TIME
18. CUE
19. EXEC / EXECUTOR

### Conditionals (8 keywords):
20. IF
21. AND
22. OR
23. NOT
24. EMPTY
25. ACTIVE
26. RUNNING
27. PROGRAMMER

### Video/NDI (7 keywords):
28. VIDEO
29. PLAY
30. PAUSE
31. RESUME
32. NDI
33. DISCOVER
34. SOURCE

### Recording (2 keywords):
35. RECORD
36. UPDATE

### Operators (6 keywords):
37. = / ==
38. >
39. <
40. >=
41. <=
42. != / <>

### Actions (4 keywords):
43. GO
44. AT
45. FULL
46. THRU / THROUGH

---

## 🎯 Total New Keywords: 47

Please approve by number which keywords you want implemented!

Example response:
- "All" (approve all 47)
- "1-16" (approve clocks and group handles only)
- "1,2,3,10,11,12" (approve specific keywords)
- "All except 20-26" (approve all except conditionals)

---

## 📝 Notes

- Keywords marked with "/" indicate aliases (e.g., "I / INHIBITIVE")
- Some keywords already exist (RECORD, AT, THRU) but need enhancement
- Operators (=, >, <, etc.) are symbols, not word keywords
- Case-insensitive parsing recommended for all keywords
