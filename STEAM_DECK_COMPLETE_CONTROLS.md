# Steam Deck Complete Control Layout

## Missing Controls in Current Implementation

The Steam Deck has significantly more controls than a standard Xbox controller. Here's what's currently **NOT** implemented:

### **Missing Physical Controls:**

1. **Back Buttons (L4/R4)**
   - L4 (Left back paddle)
   - R4 (Right back paddle)
   - **Button indices**: 10, 11 (typically)

2. **Back Buttons (L5/R5)**
   - L5 (Left additional back paddle)
   - R5 (Right additional back paddle)
   - **Button indices**: May vary by Steam Input configuration

3. **Stick Click Buttons**
   - **Button 10** - Left Stick Click (L3)
   - **Button 11** - Right Stick Click (R3)

4. **Steam/Quick Access Buttons**
   - Steam button (button index varies)
   - Quick Access button (... button)
   - May be reserved by SteamOS

5. **Right Trackpad**
   - Touch detection
   - Click detection
   - Axis inputs for X/Y position

6. **Left Trackpad**
   - Touch detection
   - Click detection
   - Axis inputs for X/Y position

7. **Gyroscope**
   - 3-axis rotation data
   - Tilt sensing
   - Motion controls

8. **Right Analog Stick** (partially missing)
   - Currently detected (Axis 2, 3) but **not mapped to any actions**

## Steam Deck Hardware Specification

### **Complete Button Layout:**

| Button | Standard Index | Steam Deck Name | Current Status |
|--------|---------------|-----------------|----------------|
| A | 0 | A (Cross) | ✅ Implemented |
| B | 1 | B (Circle) | ✅ Implemented |
| X | 2 | X (Square) | ✅ Implemented |
| Y | 3 | Y (Triangle) | ✅ Implemented |
| L1 | 4 | Left Bumper | ✅ Implemented |
| R1 | 5 | Right Bumper | ✅ Implemented |
| L2 | 6 | Left Trigger | ✅ Implemented |
| R2 | 7 | Right Trigger | ✅ Implemented |
| Select | 8 | View/Back | ✅ Detected, not mapped |
| Start | 9 | Menu | ✅ Detected, not mapped |
| L3 | 10 | Left Stick Click | ❌ Missing |
| R3 | 11 | Right Stick Click | ❌ Missing |
| D-Up | 12 | D-Pad Up | ✅ Implemented |
| D-Down | 13 | D-Pad Down | ✅ Implemented |
| D-Left | 14 | D-Pad Left | ✅ Implemented |
| D-Right | 15 | D-Pad Right | ✅ Implemented |
| L4 | varies | Left Back Paddle | ❌ Missing |
| R4 | varies | Right Back Paddle | ❌ Missing |
| L5 | varies | Left Back Paddle 2 | ❌ Missing |
| R5 | varies | Right Back Paddle 2 | ❌ Missing |

### **Complete Axis Layout:**

| Axis | Input | Current Status |
|------|-------|----------------|
| 0 | Left Stick X | ✅ Implemented (Pan) |
| 1 | Left Stick Y | ✅ Implemented (Tilt) |
| 2 | Right Stick X | ❌ Not mapped |
| 3 | Right Stick Y | ❌ Not mapped |
| 4 | Left Trackpad X | ❌ Missing |
| 5 | Left Trackpad Y | ❌ Missing |
| 6 | Right Trackpad X | ❌ Missing |
| 7 | Right Trackpad Y | ❌ Missing |
| 8 | Gyro X (Roll) | ❌ Missing |
| 9 | D-Pad Y (alt) | ✅ Partially used |
| 10+ | Gyro/Motion data | ❌ Missing |

## Recommended Implementation Priority

### **High Priority (Essential Controls):**

1. **L3/R3 Stick Clicks (Buttons 10, 11)**
   - Common on all controllers
   - Easy to implement
   - Useful for quick actions

2. **Right Analog Stick (Axes 2, 3)**
   - Already detected, just needs mapping
   - Could control different parameter sets
   - Dual-stick control paradigm

3. **Select/Start Buttons (Buttons 8, 9)**
   - Currently detected but not mapped
   - Could open menus, toggle modes

### **Medium Priority (Steam Deck Specific):**

4. **Back Paddles L4/R4**
   - Steam Deck exclusive feature
   - Perfect for frequently used functions
   - Ergonomic for handheld use

5. **Trackpads (Left & Right)**
   - Unique Steam Deck feature
   - Could provide touchpad-style control
   - Useful for fine adjustments

### **Low Priority (Advanced):**

6. **Gyroscope/Motion Controls**
   - Advanced feature
   - Could enable tilt-based control
   - Requires calibration

7. **L5/R5 Additional Paddles**
   - Extra Steam Deck paddles
   - Less commonly used
   - Configuration dependent

## Proposed New Mappings

### **Stick Click Buttons (L3/R3):**
- **L3**: Toggle between parameter sets (Color → Position → Focus)
- **R3**: Toggle blackout
- Or make fully configurable like A/B/X/Y

### **Right Analog Stick:**
- **Right X**: Fine tune parameter adjustment
- **Right Y**: Master fader control
- Or map to different channel types (Gobo, Prism, etc.)

### **Select/Start:**
- **Select (Button 8)**: Open quick menu / window selector
- **Start (Button 9)**: Open setup / main menu

### **Back Paddles (L4/R4):**
- **L4**: Previous fixture
- **R4**: Next fixture
- Or: Quick cue recall (L4 = Cue 1, R4 = Cue 2)

### **Trackpads:**
- **Left Trackpad**: Navigate UI windows (like mouse)
- **Right Trackpad**: Color picker / parameter grid navigation

### **Gyroscope:**
- **Tilt Left/Right**: Adjust pan
- **Tilt Forward/Back**: Adjust tilt
- **Shake**: Strobe effect trigger

## Implementation Files to Modify

1. **`src/App.jsx`**
   - Add L3/R3 button detection (lines 700-930)
   - Add right stick mapping (axes 2-3)
   - Add Select/Start button actions
   - Add back paddle detection

2. **`src/components/GamepadManager.jsx`**
   - Update gamepad debug display to show all buttons
   - Add trackpad visualization
   - Add gyro data display

3. **Setup Modal Gamepad Tab**
   - Add mapping options for L3/R3
   - Add right stick channel mapping
   - Add back paddle configuration
   - Add Select/Start action mapping

## Button Index Discovery

The actual button indices for Steam Deck-specific controls may vary based on:
- Steam Input configuration
- Controller mode (Gamepad vs Desktop)
- Firmware version

**Recommended approach:**
1. Add comprehensive gamepad debug logging
2. Test each physical button to discover its index
3. Document actual indices found on Steam Deck hardware
4. Make mappings configurable for flexibility

## Next Steps

Would you like me to:
1. **Implement L3/R3 stick click buttons** (easiest, universal)
2. **Add right stick mapping** (already detected, needs UI)
3. **Add Select/Start button mappings** (quick wins)
4. **Implement all missing buttons** (comprehensive update)
5. **Create button discovery tool** (test all inputs)

Choose your priority and I'll implement immediately!
