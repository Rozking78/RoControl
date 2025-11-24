# RoControl AppImage for SteamOS - Installation Guide

## What is this?

**RoControl-x86_64.AppImage** is a single portable file that contains the entire RoControl DMX lighting controller app. No installation needed - just download and run!

**File:** `RoControl-x86_64.AppImage`
**Size:** 2.9 MB
**Platform:** Steam Deck / SteamOS / Linux x86_64

---

## Quick Start (3 Steps)

### 1. Download the AppImage
Copy `RoControl-x86_64.AppImage` to your Steam Deck (e.g., to `/home/deck/Applications/`)

### 2. Make it Executable
```bash
chmod +x RoControl-x86_64.AppImage
```

### 3. Run it!
```bash
./RoControl-x86_64.AppImage
```

That's it! The app will launch immediately.

---

## Installation Methods

### Method 1: Desktop Mode (Recommended for Testing)

1. **Switch to Desktop Mode** on your Steam Deck (Power button → Switch to Desktop)

2. **Open Konsole** (terminal)

3. **Create Applications folder** (if it doesn't exist):
   ```bash
   mkdir -p ~/Applications
   ```

4. **Copy the AppImage**:
   ```bash
   cp /path/to/RoControl-x86_64.AppImage ~/Applications/
   ```

5. **Make it executable**:
   ```bash
   chmod +x ~/Applications/RoControl-x86_64.AppImage
   ```

6. **Run it**:
   ```bash
   ~/Applications/RoControl-x86_64.AppImage
   ```

### Method 2: Add to Steam (Gaming Mode)

To launch RoControl from Gaming Mode:

1. **In Desktop Mode**, open Steam

2. **Games → Add a Non-Steam Game to My Library**

3. **Click "Browse..."** and navigate to `/home/deck/Applications/`

4. **Select** `RoControl-x86_64.AppImage`

5. **Add Selected Programs**

6. **Right-click the game** in Steam library → **Properties**

7. **Configure Launch Options** (optional):
   - **Controller:** Enable Steam Input for gamepad
   - **Compatibility:** Usually not needed (native Linux app)

8. **Switch to Gaming Mode** and launch from library!

### Method 3: Desktop Shortcut

Create a desktop shortcut for easy access:

1. **Create desktop file**:
   ```bash
   cat > ~/.local/share/applications/rocontrol.desktop <<EOF
   [Desktop Entry]
   Name=RoControl
   Exec=/home/deck/Applications/RoControl-x86_64.AppImage
   Icon=/home/deck/Applications/rocontrol.png
   Type=Application
   Categories=Utility;AudioVideo;X-Lighting;
   Comment=Professional DMX Lighting Controller
   Terminal=false
   EOF
   ```

2. **Make it executable**:
   ```bash
   chmod +x ~/.local/share/applications/rocontrol.desktop
   ```

3. **Update desktop database**:
   ```bash
   update-desktop-database ~/.local/share/applications/
   ```

Now RoControl appears in your application menu!

---

## Usage on Steam Deck

### Controls

**Touch:**
- All UI elements are touch-optimized (44px minimum targets)
- Tap encoder wheels to focus them
- Drag master fader slider

**Gamepad:**
- **D-Pad Left/Right:** Navigate between encoder wheels
- **D-Pad Up/Down:** Adjust focused encoder value
- **Triggers/Bumpers:** Control intensity/colors (configurable)
- **Left Stick:** Pan/Tilt control (moving heads)

**Keyboard:**
- Steam keyboard automatically appears for text inputs
- Press Steam button + X to open keyboard manually

### Display Settings

The app is optimized for Steam Deck's **1280x800 resolution**:
- Full-screen recommended
- 16:10 aspect ratio
- Touch-friendly interface

---

## Troubleshooting

### AppImage won't run
```bash
# Make sure it's executable
chmod +x RoControl-x86_64.AppImage

# Run from terminal to see errors
./RoControl-x86_64.AppImage
```

### Missing dependencies (FUSE)
If you see "FUSE not found" error:
```bash
# Install FUSE (in Desktop Mode)
sudo steamos-readonly disable
sudo pacman -S fuse2
sudo steamos-readonly enable
```

### Gamepad not detected
- Check Settings → Gamepad
- Ensure gamepad is connected
- Try reconnecting the controller

### DMX output not working
- Connect Art-Net or sACN compatible DMX interface
- Configure network in Setup → Network
- Check firewall settings allow UDP (Art-Net: 6454, sACN: 5568)

---

## Features

✅ **Touch-Optimized UI**
- 100px tall programmer bar with encoder wheels
- 80px Master Fader on right
- Large touch targets throughout

✅ **Gamepad Navigation**
- Full D-pad control of parameters
- Encoder wheels navigable with D-Pad Left/Right
- Value adjustment with D-Pad Up/Down

✅ **DMX Protocols**
- Art-Net output
- sACN (E1.31) output
- 512 channels per universe

✅ **Fixture Library**
- LED PAR fixtures
- Moving Head lights
- Generic dimmers
- Custom fixture profiles

✅ **Programmer**
- Record cues and presets
- Color picker window
- Position control for movers
- All parameters accessible from bottom bar

---

## File Locations

**AppImage Location:**
```
~/Applications/RoControl-x86_64.AppImage
```

**User Data:**
```
~/.local/share/steamdeck-dmx/
```

**Configuration:**
```
~/.config/rocontrol/
```

**Logs:**
```
~/.local/share/steamdeck-dmx/logs/
```

---

## Updating

To update to a new version:

1. Download new `RoControl-x86_64.AppImage`
2. Replace old file:
   ```bash
   mv ~/Applications/RoControl-x86_64.AppImage ~/Applications/RoControl-x86_64.AppImage.old
   cp /path/to/new/RoControl-x86_64.AppImage ~/Applications/
   chmod +x ~/Applications/RoControl-x86_64.AppImage
   ```
3. Your settings and shows are preserved!

---

## Uninstalling

To remove RoControl:

```bash
# Remove AppImage
rm ~/Applications/RoControl-x86_64.AppImage

# Remove user data (optional - this deletes your shows!)
rm -rf ~/.local/share/steamdeck-dmx/
rm -rf ~/.config/rocontrol/

# Remove desktop entry (if created)
rm ~/.local/share/applications/rocontrol.desktop
```

---

## Building from Source

If you want to build the AppImage yourself:

```bash
cd ~/Downloads/steamdeck-dmx-controller

# Build production binary
npm run tauri build

# Download appimagetool
wget https://github.com/AppImage/AppImageKit/releases/download/continuous/appimagetool-x86_64.AppImage
chmod +x appimagetool-x86_64.AppImage

# Build AppImage (structure already set up)
ARCH=x86_64 ./appimagetool-x86_64.AppImage AppDir RoControl-x86_64.AppImage
```

---

## Support & Documentation

**Full Documentation:**
- `README.md` - Project overview
- `STEAM_INSTALLATION.md` - Detailed Steam Deck setup
- `TOUCH_OPTIMIZATION_COMPLETE.md` - Touch controls guide
- `PROGRAMMER_BAR_ENCODER_WHEELS.md` - Programmer bar guide

**Getting Help:**
- Check documentation files in project folder
- Review `TESTING_REPORT.md` for known issues

**Version:** 0.1.0
**Build Date:** November 20, 2025
**Platform:** SteamOS 3.x / Linux x86_64

---

## What's New (v0.1.0)

### Programmer Bar Enhancements
- ✅ Full encoder wheels display (like ProgrammerView)
- ✅ D-pad navigation ready (Left/Right to select, Up/Down to adjust)
- ✅ Extends full width to Master Fader
- ✅ Shows all parameters in horizontal scrolling row
- ✅ Touch-optimized 44px encoder wheels
- ✅ Color-coded rotating indicators

### Master Fader Improvements
- ✅ Thinner design (80px → 70px on Steam Deck)
- ✅ Hard border - nothing can overlap
- ✅ Positioned above programmer bar
- ✅ 100% value always visible

### Layout Optimization
- ✅ GridLayout accounts for taller programmer bar
- ✅ Windows no longer covered by bottom bar
- ✅ Maximum screen space utilization
- ✅ Clean, professional layout

---

## Tips & Tricks

**For Live Shows:**
1. Create Quick Views (buttons 1-4) for different scenes
2. Use Record Mode to save cues
3. Master Fader controls overall intensity
4. D-pad allows hands-free parameter control

**For Setup:**
1. Patch fixtures in Setup → Patch
2. Configure network in Setup → Network
3. Map gamepad buttons in Setup → Gamepad
4. Test DMX output before the show!

**For Best Performance:**
1. Close other apps in Gaming Mode
2. Use wired network for DMX output
3. Keep master fader at 100% for full range
4. Save your work frequently (Record Mode)

---

Enjoy controlling DMX lights from your Steam Deck! 🎮✨
