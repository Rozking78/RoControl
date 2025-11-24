# Final Installation Steps - Steam Deck DMX Controller

## ✅ Progress So Far

- ✓ Frontend integration complete
- ✓ GCC compiler installed
- ✗ WebKit2GTK libraries needed

---

## 🚀 Next Step: Install WebKit

Tauri (the app framework) needs WebKit2GTK to create the GUI window.

### Run This Command:

```bash
./install-webkit.sh
```

**What it installs:**
- webkit2gtk - Web rendering engine
- gtk3 - GUI toolkit
- libsoup - HTTP library
- javascriptcoregtk - JavaScript engine
- Various dependencies

**Download size:** ~150-200 MB  
**Time:** 5-10 minutes

---

## Manual Installation (Alternative)

If the script fails, run these commands:

```bash
# 1. Make writable
sudo steamos-readonly disable

# 2. Temporarily disable signatures
sudo cp /etc/pacman.conf /etc/pacman.conf.backup
sudo sed -i 's/^SigLevel.*/SigLevel = Never/g' /etc/pacman.conf

# 3. Install WebKit
sudo pacman -Sy
sudo pacman -S --needed webkit2gtk gtk3 libsoup javascriptcoregtk

# 4. Restore config
sudo mv /etc/pacman.conf.backup /etc/pacman.conf

# 5. Verify
pkg-config --exists webkit2gtk-4.0 && echo "✓ Installed!"
```

---

## After Installation

Once WebKit is installed, build the app:

```bash
npm run tauri dev
```

You should see:
1. Frontend compiling (Vite) ✓
2. Backend compiling (Rust) ✓
3. App window launching ✓
4. All new features working! ✓

---

## 🎮 What You'll Get

After successful build, the app will have:

### UI Features
- Master Fader (floating control)
- GamePad navigation with D-Pad
- Auto on-screen keyboard
- Color Window with HSV picker
- Intensity, Position, Focus, Gobo windows
- FlexWindow (dynamic presets)
- Programmer Pro with feature sets
- Pixel Grid for fixture layout
- View Recall (6-slot memory)

### Gamepad Controls
- D-Pad: Navigate UI
- A: Select/Activate
- B: Back/Cancel  
- X: Clear programmer
- Y: Locate fixtures
- LB: Toggle blackout
- RB: Toggle record mode

---

## Troubleshooting

### "Package not found"
```bash
sudo pacman -Sy  # Update database
```

### "Signature errors"
Script handles this automatically, or press Y to continue

### "Out of space"
```bash
sudo pacman -Sc  # Clean package cache
```

---

## Quick Commands Reference

```bash
# Install WebKit
./install-webkit.sh

# Build dev mode
npm run tauri dev

# Build production
npm run tauri build

# Check WebKit installed
pkg-config --modversion webkit2gtk-4.0
```

---

**Ready?** Run: `./install-webkit.sh`

Then: `npm run tauri dev`
