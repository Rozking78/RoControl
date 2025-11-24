# Adding DMX Controller to Steam

## Step 1: Build Complete! ✅

The production AppImage is ready at:
```
/home/deck/Downloads/steamdeck-dmx-controller/src-tauri/target/release/bundle/appimage/steam-deck-dmx_0.1.0_amd64.AppImage
```

## Step 2: Add to Steam

1. **Open Steam** (in Desktop mode)
2. Click **Games** → **Add a Non-Steam Game to My Library**
3. Click **Browse...**
4. Navigate to: `/home/deck/Downloads/steamdeck-dmx-controller/src-tauri/target/release/bundle/appimage/`
5. Select **steam-deck-dmx_0.1.0_amd64.AppImage**
6. Click **Add Selected Programs**
7. **Rename it** in your library to "DMX Controller" (optional but recommended)

## Step 3: Configure Controller Settings

**IMPORTANT**: You must disable Steam Input for this app!

1. In Steam **Library**, find **steamdeck-dmx-controller**
2. Right-click → **Properties**
3. Go to **Controller** section
4. Set **Steam Input Per-Game Setting** to: **Disabled**
5. Click **OK**

## Step 4: Optional - Set App Icon

1. Right-click **steamdeck-dmx-controller** in Library
2. Click **Manage** → **Set custom artwork**
3. Use one of the icons from:
   ```
   /home/deck/Downloads/steamdeck-dmx-controller/src-tauri/icons/
   ```

## Step 5: Launch the App

1. **From Desktop Mode**: Just click the app in Steam
2. **From Gaming Mode**:
   - Press **Steam button**
   - Navigate to your Library
   - Find **DMX Controller**
   - Launch it

## Step 6: Enable Gamepad Capture (In-App)

Once the app is running:
1. Go to **Setup** → **Gamepad** tab
2. Toggle **"Capture gamepad exclusively"** to **ON**
3. You should see a success message
4. Now your Steam Deck controls will work directly with the app!

## Troubleshooting

### Controls not working
- Make sure Steam Input is **Disabled** (Step 3)
- Enable "Capture gamepad exclusively" in the app
- You may need to restart the app after changing Steam Input settings

### App won't launch
- Make sure you ran `./install-gamepad-permissions.sh` first
- Check that the binary has execute permissions:
  ```bash
  chmod +x /home/deck/Downloads/steamdeck-dmx-controller/src-tauri/target/release/steamdeck-dmx-controller
  ```

### Permission errors
- Run the install script again:
  ```bash
  cd /home/deck/Downloads/steamdeck-dmx-controller
  ./install-gamepad-permissions.sh
  ```
- Reboot your Steam Deck

## Controls Layout

### D-Pad (Attribute Navigation)
- **D-Pad Left/Right**: Navigate through channels (wraps around)
- **D-Pad Up/Down**: Increase/decrease channel value
- **Hold Up/Down**: Acceleration! (2x at 0.5s, 4x at 1s, 8x at 2s+)

### Triggers & Bumpers (Configurable)
- **Left Trigger (L2)**: Default: Red
- **Right Trigger (R2)**: Default: Dimmer
- **L1**: Default: Green
- **R1**: Default: Blue

### Left Joystick (Configurable)
- **X-Axis**: Default: Pan
- **Y-Axis**: Default: Tilt

### Action Buttons
- **A**: Select first fixture
- **B**: Blackout (all off)
- **X**: Clear selection
- **Y**: Locate (selected fixtures to full white)

### Special
- **Steam Button + A**: Return to Steam

## New Features in This Build

- **Backup Tab**: Save and recall entire show states by name
- **Enhanced D-Pad**: Acceleration when holding, wrap-around navigation
- **Improved Clear**: X button now only clears selection (doesn't reset all values)

Enjoy your DMX lighting controller!
