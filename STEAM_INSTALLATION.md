# RoControl - Steam Installation Guide

## ✅ Build Complete!

Your production build is ready to add to Steam!

**Binary Location:** `/home/deck/Downloads/steamdeck-dmx-controller/src-tauri/target/release/ro-control`
**Binary Size:** 7.3 MB
**Version:** 0.1.0

---

## 🎮 Add to Steam (Method 1 - Recommended)

### Step 1: Add Non-Steam Game

1. **Switch to Desktop Mode** (if not already)
2. **Open Steam**
3. Click **Games** → **Add a Non-Steam Game to My Library**
4. Click **Browse...**
5. Navigate to: `/home/deck/Downloads/steamdeck-dmx-controller/`
6. Select **`launch-rocontrol.sh`**
7. Click **Open**, then **Add Selected Programs**

### Step 2: Configure Steam Settings

1. **Right-click** on "launch-rocontrol.sh" in Steam Library
2. Click **Properties**
3. Change the name to **`RoControl`**
4. Set **Launch Options** (optional):
   ```
   WEBKIT_DISABLE_COMPOSITING_MODE=1 %command%
   ```

### Step 3: Set Custom Artwork (Optional)

1. In Properties, click **Set Custom Artwork**
2. Use the icon at: `src-tauri/icons/icon.png`

### Step 4: Configure Controller

1. In Properties, click **Controller** → **Edit Layout**
2. Select **Browse Community Layouts** or use default **Gamepad** template
3. Recommended: Use the **Gamepad** template for best compatibility

---

## 🎮 Add to Steam (Method 2 - Direct Binary)

If you prefer to add the binary directly:

1. Follow Step 1 above, but select **`src-tauri/target/release/ro-control`** instead
2. Continue with Steps 2-4

---

## 🚀 Launch from Gaming Mode

1. **Switch to Gaming Mode**
2. Find **RoControl** in your **Library** → **Non-Steam** section
3. Click to launch!

---

## ⚙️ Default Controls (Built-in Gamepad Support)

### Triggers & Bumpers
- **L2 (Left Trigger)** → Red (or configured channel)
- **R2 (Right Trigger)** → Dimmer (or configured channel)
- **L1 (Left Bumper)** → Green (or configured channel)
- **R1 (Right Bumper)** → Blue (or configured channel)

### Left Stick
- **X-Axis** → Pan (or configured channel)
- **Y-Axis** → Tilt (or configured channel)

### D-Pad (NEW!)
- **D-Pad Left/Right** → Navigate through parameter chips
- **D-Pad Up/Down** → Adjust focused parameter value
- **Hold for acceleration** → Faster value changes

### Face Buttons (Configurable)
- **A Button** → Select First Fixture (default)
- **B Button** → Blackout (default)
- **X Button** → Clear Selection (default)
- **Y Button** → Locate (default)

**To customize:** Open Setup → Gamepad tab in the app

---

## 🖱️ Touch & Mouse Controls

### Edit Mode
- **Click "Edit" button** (top bar) to enable window editing
- **Right-click or long-press** on empty space → Add new window
- **Drag window headers** → Move windows
- **Drag resize handles** → Resize windows (blue edges/corner)
- **Right-click window** → Change view type

### Programmer Bar (NEW!)
- **Click parameter chips** → Focus that parameter
- **D-Pad Up/Down** → Adjust focused value
- Chips show in ProgrammerView window with live updates

---

## 📡 Network Configuration

### First Launch Setup
1. Launch RoControl
2. Click **Setup** → **Network** tab
3. Configure:
   - **Protocol:** Art-Net or sACN
   - **Broadcast Address:** `2.255.255.255` (default Art-Net)
   - **Network Interface:** Select your WiFi/Ethernet adapter
4. Click **Apply Network Configuration**

### Recommended Settings for Steam Deck WiFi
- **Protocol:** Art-Net
- **Broadcast:** `2.255.255.255`
- **Interface:** Select `wlan0` (or your WiFi interface)

---

## 🔧 Troubleshooting

### App Won't Launch
1. Check build log: `cat build.log`
2. Verify binary exists: `ls -lh src-tauri/target/release/ro-control`
3. Rebuild if needed: `npm run tauri:build`

### WebKit Errors
If you see WebKit/rendering errors, add to Steam Launch Options:
```
WEBKIT_DISABLE_COMPOSITING_MODE=1 WEBKIT_DISABLE_DMABUF_RENDERER=1 %command%
```

### Gamepad Not Working
1. Make sure you're using **Gamepad** template in Steam Controller config
2. Check that no other controller layout is interfering
3. The app uses native browser Gamepad API - works automatically with Steam Input

### Network/DMX Not Sending
1. Verify network interface is selected in Setup → Network
2. Check firewall isn't blocking UDP port 6454 (Art-Net) or 5568 (sACN)
3. Test with `sudo pacman -S wireshark-cli && tshark -i wlan0 udp port 6454`

---

## 📁 Project Structure

```
steamdeck-dmx-controller/
├── src-tauri/target/release/
│   └── ro-control              # Main binary (7.3 MB)
├── launch-rocontrol.sh          # Steam launcher script ⭐
├── rocontrol.desktop            # Desktop entry file
├── src-tauri/icons/             # App icons
│   ├── 128x128.png
│   └── icon.png
└── STEAM_INSTALLATION.md        # This file
```

---

## 🎯 Features Included in This Build

✅ **Touch-optimized UI** - Works perfectly on Steam Deck screen
✅ **Gamepad Integration** - Full Steam Deck controls support
✅ **D-Pad Navigation** - Navigate and adjust parameters
✅ **Window Management** - Drag, resize, add/remove windows
✅ **Art-Net & sACN** - Professional DMX protocols
✅ **Fixture Library** - Tree Par, LED PAR, Moving Head, Dimmer
✅ **Record Mode** - Save views, cues, and presets
✅ **Quick Views** - Save and recall window layouts
✅ **Programmer Bar** - Live parameter display and control
✅ **Auto-Keyboard** - On-screen keyboard for touch input
✅ **Network Selection** - Choose specific WiFi/Ethernet interface

---

## 🚀 Quick Start After Adding to Steam

1. **Launch RoControl** from Gaming Mode
2. Click **Setup** → **Patch** → Add your fixtures
3. Click **Setup** → **Network** → Configure Art-Net
4. Click **Edit** button → Right-click to add windows
5. Add **FixturesView**, **ProgrammerView**, **PalettesView**, etc.
6. Select fixtures and start controlling!

---

## 📝 Version Info

- **App Name:** RoControl
- **Version:** 0.1.0
- **Build Date:** 2025-11-19
- **Platform:** SteamOS 3.x (Arch Linux)
- **Binary:** ro-control (7.3 MB, optimized release)

---

## 💡 Pro Tips

1. **Save your layout:** Use Quick View buttons (1-4) to save window layouts
2. **Use Record Mode:** Press 'R' or click Rec button to save views/cues
3. **D-Pad efficiency:** Hold D-Pad Up/Down longer for faster value changes
4. **Multi-select:** Click multiple fixtures while holding Ctrl (with mouse)
5. **Gamepad remap:** Customize all gamepad buttons in Setup → Gamepad

---

Enjoy your professional DMX lighting controller on Steam Deck! 🎭✨
