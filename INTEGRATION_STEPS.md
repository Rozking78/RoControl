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
