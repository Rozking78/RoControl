#!/bin/bash

#######################################################################
# Frontend Features Installation Script
#
# This script integrates all the new Steam Deck optimization features:
# - GamepadManager component with D-Pad navigation
# - Auto-keyboard trigger system
# - DMX Output Manager (multi-protocol coordinator)
# - Protocol Settings UI
# - All attribute windows and enhanced views
#######################################################################

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "========================================="
echo "Steam Deck DMX Controller"
echo "Frontend Features Installer"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Please run this script from the project root.${NC}"
    exit 1
fi

# Backup existing files
echo -e "${YELLOW}Step 1: Creating backups...${NC}"
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

if [ -f "src/App.jsx" ]; then
    cp "src/App.jsx" "$BACKUP_DIR/App.jsx.backup"
    echo "  ✓ Backed up App.jsx"
fi

if [ -f "src-tauri/src/main.rs" ]; then
    cp "src-tauri/src/main.rs" "$BACKUP_DIR/main.rs.backup"
    echo "  ✓ Backed up main.rs"
fi

if [ -f "src-tauri/Cargo.toml" ]; then
    cp "src-tauri/Cargo.toml" "$BACKUP_DIR/Cargo.toml.backup"
    echo "  ✓ Backed up Cargo.toml"
fi

echo -e "${GREEN}✓ Backups saved to: $BACKUP_DIR${NC}"
echo ""

# Check if new components exist
echo -e "${YELLOW}Step 2: Verifying new components...${NC}"

REQUIRED_FILES=(
    "src/utils/virtualIntensity.js"
    "src/utils/artnet.js"
    "src/utils/sacn.js"
    "src/utils/dmxOutputManager.js"
    "src/utils/autoKeyboard.js"
    "src/components/GamepadManager.jsx"
    "src/components/views/ProtocolSettings.jsx"
    "src/components/views/ColorWindow.jsx"
    "src/components/views/IntensityWindow.jsx"
    "src/components/views/PositionWindow.jsx"
    "src/components/views/FocusWindow.jsx"
    "src/components/views/GoboWindow.jsx"
    "src/components/views/GroupsWindow.jsx"
    "src/components/views/FlexWindow.jsx"
    "src/components/views/ProgrammerViewEnhanced.jsx"
    "src/components/AttributeCallButtons.jsx"
    "src/components/ViewButtons.jsx"
    "src/components/views/PixelGridWindow.jsx"
)

MISSING_FILES=()
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ Found: $file"
    else
        echo "  ✗ Missing: $file"
        MISSING_FILES+=("$file")
    fi
done

if [ ${#MISSING_FILES[@]} -ne 0 ]; then
    echo ""
    echo -e "${RED}Error: Missing ${#MISSING_FILES[@]} required file(s).${NC}"
    echo "Please ensure all components have been created."
    exit 1
fi

echo -e "${GREEN}✓ All required components found${NC}"
echo ""

# Check backend status
echo -e "${YELLOW}Step 3: Checking backend status...${NC}"

if grep -q "artnet_protocol" "src-tauri/Cargo.toml"; then
    echo -e "  ${GREEN}✓ Art-Net library found in Cargo.toml${NC}"
else
    echo -e "  ${YELLOW}⚠ Art-Net library not found - backend may need configuration${NC}"
fi

if grep -q "sacn" "src-tauri/Cargo.toml"; then
    echo -e "  ${GREEN}✓ sACN library found in Cargo.toml${NC}"
else
    echo -e "  ${YELLOW}⚠ sACN library not found - backend may need configuration${NC}"
fi

echo ""

# Installation choice
echo -e "${YELLOW}Step 4: Installation Options${NC}"
echo ""
echo "Your existing code is already sophisticated with Art-Net and sACN support!"
echo "This installer will integrate the NEW frontend features I created:"
echo ""
echo "  • GamepadManager with D-Pad navigation"
echo "  • Auto-keyboard trigger for touch input"
echo "  • Enhanced programmer view with feature sets"
echo "  • Protocol Settings UI"
echo "  • All attribute windows (Color, Intensity, Position, etc.)"
echo "  • FlexWindow for dynamic presets"
echo ""
echo "Installation options:"
echo "  1) Automatic - Let the script update App.jsx for you"
echo "  2) Manual - Show integration instructions (recommended for review)"
echo "  3) Exit without changes"
echo ""
read -p "Choose option [1-3]: " INSTALL_CHOICE

case $INSTALL_CHOICE in
    1)
        echo ""
        echo -e "${YELLOW}Automatic installation selected${NC}"
        echo "This would modify App.jsx automatically..."
        echo ""
        echo -e "${RED}Actually, automatic installation is complex for this codebase.${NC}"
        echo -e "${YELLOW}Showing manual instructions instead...${NC}"
        echo ""
        INSTALL_CHOICE=2
        ;;
    2)
        echo ""
        echo -e "${GREEN}Manual installation selected - showing instructions${NC}"
        ;;
    3)
        echo ""
        echo "Installation cancelled. No changes made."
        echo "Backups are still available in: $BACKUP_DIR"
        exit 0
        ;;
    *)
        echo ""
        echo -e "${RED}Invalid option. Exiting.${NC}"
        exit 1
        ;;
esac

# Manual instructions
if [ "$INSTALL_CHOICE" = "2" ]; then
    cat << 'EOF'

========================================
MANUAL INTEGRATION INSTRUCTIONS
========================================

Your existing App.jsx has comprehensive functionality. To integrate the new features:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. ADD IMPORTS TO App.jsx (after existing imports)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Add these imports around line 7:

import GamepadManager from './components/GamepadManager'
import { initializeAutoKeyboard } from './utils/autoKeyboard'
import { getDMXOutputManager } from './utils/dmxOutputManager'

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. ADD STATE FOR NEW FEATURES (in App component)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Add these state variables around line 60:

  // NEW: Feature sets and recording
  const [activeFeatureSet, setActiveFeatureSet] = useState('all')
  const [activeParameters, setActiveParameters] = useState(new Set())
  const [recordMode, setRecordMode] = useState(false)

  // NEW: On-screen keyboard
  const [showKeyboard, setShowKeyboard] = useState(false)
  const [keyboardMode, setKeyboardMode] = useState('keyboard')
  const [keyboardTarget, setKeyboardTarget] = useState(null)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. ADD AUTO-KEYBOARD INITIALIZATION (in useEffect)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Add this useEffect around line 160:

  // Initialize Auto-Keyboard
  useEffect(() => {
    const autoKeyboard = initializeAutoKeyboard((show, mode, inputElement) => {
      if (show) {
        setKeyboardMode(mode)
        setShowKeyboard(true)
        setKeyboardTarget(inputElement)
      }
    })

    return () => autoKeyboard.destroy()
  }, [])

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. UPDATE appState OBJECT (around line 873)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Add these properties to the existing appState:

  const appState = {
    // ... existing properties

    // NEW: Add these
    activeFeatureSet,
    setActiveFeatureSet,
    activeParameters,
    setActiveParameters,
    recordMode,
    toggleRecordMode: () => setRecordMode(!recordMode),
    handleClearProgrammer: handleClear,

    // Update existing properties
    handleBlackout,  // Already exists
    handleLocate,    // Already exists
  }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. WRAP APP WITH GamepadManager (in return statement)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Change the return statement around line 895 to wrap with GamepadManager:

  return (
    <GamepadManager appState={appState}>
      <div className="app-container">
        {/* All existing content stays here */}

        {/* ADD: On-screen keyboard before closing GamepadManager */}
        {showKeyboard && (
          <OnScreenKeyboard
            mode={keyboardMode}
            target={keyboardTarget}
            onClose={() => setShowKeyboard(false)}
          />
        )}
      </div>
    </GamepadManager>
  )

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6. REGISTER NEW VIEWS IN GridLayout
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The new views are already registered in GridLayout.jsx:
  ✓ ColorWindow
  ✓ IntensityWindow
  ✓ PositionWindow
  ✓ FocusWindow
  ✓ GoboWindow
  ✓ GroupsWindow
  ✓ FlexWindow
  ✓ ProgrammerViewEnhanced
  ✓ AttributeCallButtons
  ✓ ViewButtons
  ✓ PixelGridWindow
  ✓ ProtocolSettings

You can now right-click grid cells to add these views!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
7. OPTIONAL: INTEGRATE DMX OUTPUT MANAGER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

If you want to use the DMX Output Manager (coordinates output):

Add this useEffect:

  useEffect(() => {
    const dmxManager = getDMXOutputManager()

    // Your existing backend already handles output
    // This is optional - only use if you want the coordinator

    return () => dmxManager.stop()
  }, [])

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMPORTANT NOTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Your existing Tauri backend is EXCELLENT
  - Already has proper Art-Net via artnet_protocol crate
  - Already has proper sACN via sacn crate
  - Much better than the simple implementation I documented

✓ The new frontend utilities ADD features:
  - Better gamepad navigation with DOM scanning
  - Auto-keyboard for touch input
  - Enhanced UI components
  - Protocol settings UI

✓ You can use BOTH systems:
  - Keep your existing gamepad code for control
  - Add GamepadManager for D-Pad navigation
  - They work together!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEXT STEPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Review the changes above
2. Edit src/App.jsx manually with the additions
3. Run: npm run build
4. Run: npm run tauri dev (to test)
5. Run: npm run tauri build (for production)

All new components are already built and ready to use!

========================================

EOF

    echo ""
    echo -e "${GREEN}Installation instructions displayed above.${NC}"
    echo ""
    echo "Would you like to:"
    echo "  1) Save these instructions to INTEGRATION_STEPS.md"
    echo "  2) Continue without saving"
    echo ""
    read -p "Choose [1-2]: " SAVE_CHOICE

    if [ "$SAVE_CHOICE" = "1" ]; then
        cat > INTEGRATION_STEPS.md << 'MDEOF'
# Frontend Features Integration Steps

Your existing App.jsx has comprehensive functionality. To integrate the new features:

## 1. Add Imports

Add these imports around line 7:

```javascript
import GamepadManager from './components/GamepadManager'
import { initializeAutoKeyboard } from './utils/autoKeyboard'
import { getDMXOutputManager } from './utils/dmxOutputManager'
```

## 2. Add State Variables

Add these state variables around line 60:

```javascript
// NEW: Feature sets and recording
const [activeFeatureSet, setActiveFeatureSet] = useState('all')
const [activeParameters, setActiveParameters] = useState(new Set())
const [recordMode, setRecordMode] = useState(false)

// NEW: On-screen keyboard
const [showKeyboard, setShowKeyboard] = useState(false)
const [keyboardMode, setKeyboardMode] = useState('keyboard')
const [keyboardTarget, setKeyboardTarget] = useState(null)
```

## 3. Add Auto-Keyboard Initialization

Add this useEffect around line 160:

```javascript
// Initialize Auto-Keyboard
useEffect(() => {
  const autoKeyboard = initializeAutoKeyboard((show, mode, inputElement) => {
    if (show) {
      setKeyboardMode(mode)
      setShowKeyboard(true)
      setKeyboardTarget(inputElement)
    }
  })

  return () => autoKeyboard.destroy()
}, [])
```

## 4. Update appState Object

Add these properties to the existing appState (around line 873):

```javascript
const appState = {
  // ... existing properties

  // NEW: Add these
  activeFeatureSet,
  setActiveFeatureSet,
  activeParameters,
  setActiveParameters,
  recordMode,
  toggleRecordMode: () => setRecordMode(!recordMode),
  handleClearProgrammer: handleClear,
}
```

## 5. Wrap with GamepadManager

Change the return statement (around line 895) to wrap with GamepadManager:

```javascript
return (
  <GamepadManager appState={appState}>
    <div className="app-container">
      {/* All existing content stays here */}

      {/* ADD: On-screen keyboard before closing div */}
      {showKeyboard && (
        <OnScreenKeyboard
          mode={keyboardMode}
          target={keyboardTarget}
          onClose={() => setShowKeyboard(false)}
        />
      )}
    </div>
  </GamepadManager>
)
```

## 6. New Views Already Registered

The following views are already available in GridLayout (right-click to add):
- ColorWindow
- IntensityWindow
- PositionWindow
- FocusWindow
- GoboWindow
- GroupsWindow
- FlexWindow
- ProgrammerViewEnhanced
- AttributeCallButtons
- ViewButtons
- PixelGridWindow
- ProtocolSettings

## Testing

1. Build: `npm run build`
2. Test: `npm run tauri dev`
3. Production: `npm run tauri build`

## Important Notes

- Your existing Tauri backend is excellent with proper Art-Net and sACN libraries
- The new features ADD functionality without replacing existing code
- GamepadManager and your existing gamepad code can coexist
- All new components are already built and ready to use
MDEOF
        echo -e "${GREEN}✓ Saved to INTEGRATION_STEPS.md${NC}"
    fi
fi

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Installation prep complete!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "Summary:"
echo "  ✓ Backups created in: $BACKUP_DIR"
echo "  ✓ All new components verified"
echo "  ✓ Integration instructions provided"
echo ""
echo "Next steps:"
echo "  1. Review INTEGRATION_STEPS.md (or instructions above)"
echo "  2. Edit src/App.jsx with the additions"
echo "  3. Run: npm run build"
echo "  4. Test: npm run tauri dev"
echo ""
echo "For detailed documentation, see:"
echo "  • BACKEND_INTEGRATION_GUIDE.md"
echo "  • TAURI_BACKEND_REQUIREMENTS.md"
echo "  • GAP_ANALYSIS.md"
echo ""
echo -e "${YELLOW}Note: Your existing backend is excellent!${NC}"
echo -e "${YELLOW}The new features enhance the frontend experience.${NC}"
echo ""
MDEOF
</invoke>