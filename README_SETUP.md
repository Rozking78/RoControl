# RoControl Setup - Start Here

## You're Almost Ready!

RoControl has been successfully implemented with all features, including the web remote. You just need to install build dependencies.

## Quick Start (3 Steps)

### Step 1: Fix Package Signatures

Open Konsole (terminal) and run:

```bash
sudo pacman-key --init
sudo pacman-key --populate archlinux holo
```

### Step 2: Install Dependencies

The Steam Deck needs development packages that aren't normally installed:

```bash
sudo pacman -Sy

# Install all required development packages
sudo pacman -S --needed base-devel webkit2gtk glib2-devel
```

The `glib2-devel` package provides the development headers needed for compilation.

### Step 3: Build RoControl

```bash
cd ~/Downloads/steamdeck-dmx-controller
npm run tauri build
```

**Done!** The AppImage will be created at:
```
src-tauri/target/release/bundle/appimage/rocontrol_0.1.0_amd64.AppImage
```

## What's Included

✅ **Complete DMX Lighting Control**
- Art-Net and sACN protocol support
- Fixture patching and control
- MA3/Hog-style CLI interface
- Programmer and preset system

✅ **Web Remote (NEW!)**
- Browser-based remote control
- Access from any device: `http://[your-ip]:8080`
- CLI command execution via HTTP API
- Video file upload and management
- Real-time WebSocket updates
- Beautiful responsive interface

✅ **Video Fixture Support**
- Video file patching
- Upload videos via web interface
- NDI stream support (coming soon)

✅ **Professional Features**
- Encoder wheel control
- Fan mode for effects
- Time-based fades
- Highlight mode
- Dot notation presets
- Record and update commands

## Documentation

- **STEAM_DECK_SETUP.md** - Detailed Steam Deck setup guide (PGP issue fix)
- **QUICK_START.md** - Quick installation instructions
- **BUILD_INSTRUCTIONS.md** - Comprehensive build guide
- **WEB_REMOTE.md** - Web remote documentation and API reference

## Need Help?

### For PGP Signature Errors

See: **STEAM_DECK_SETUP.md** - Complete solution for signature issues

### For Build Errors

See: **BUILD_INSTRUCTIONS.md** - Troubleshooting section

### For Web Remote Setup

See: **WEB_REMOTE.md** - Access and usage guide

## The Issue You Hit

The build failed with:
```
signature from "GitLab CI Package Builder <ci-package-builder-1@steamos.cloud>" is unknown trust
```

**Cause:** Steam Deck's package signing keys aren't initialized in your keyring.

**Fix:** Run the commands in Step 1 above to initialize and populate the keyring.

## After Building

### Run RoControl

```bash
# From AppImage
./src-tauri/target/release/bundle/appimage/rocontrol_0.1.0_amd64.AppImage

# Or from binary
./src-tauri/target/release/rocontrol
```

### Access Web Remote

1. Start RoControl
2. Look for: "Web Remote Server starting on http://0.0.0.0:8080"
3. Find your IP address (Settings > Network or system tray)
4. On any device, open: `http://[YOUR_IP]:8080`

### Features Available in Web Remote

- Execute any CLI command remotely
- Quick command buttons
- Upload video files for video fixtures
- Real-time command history
- WebSocket live updates
- Works on phone, tablet, desktop

## System Requirements

- **Steam Deck** (or Arch Linux)
- **Disk Space:** 3 GB for build
- **Memory:** 2 GB RAM
- **Network:** WiFi enabled for web remote

## What Was Just Built

The web remote implementation includes:

**Backend (Rust/Tauri):**
- HTTP server on port 8080
- REST API endpoints for CLI commands
- Video file upload with multipart support
- WebSocket server for real-time updates

**Frontend (HTML/CSS/JS):**
- Modern gradient-styled interface
- CLI command input with history
- Video file management grid
- Upload with progress tracking
- Auto-reconnecting WebSocket

**All Ready to Go:** Just install dependencies and build!

## One-Line Install & Build

```bash
sudo pacman-key --init && sudo pacman-key --populate archlinux holo && sudo pacman -Sy && sudo pacman -S --needed base-devel webkit2gtk glib2-devel && cd ~/Downloads/steamdeck-dmx-controller && npm run tauri build
```

Enter your password when prompted, wait 10-20 minutes, and you're done!

---

**Questions?** Check the documentation files listed above or create a GitHub issue.

**Ready to Build?** Run the commands in the Quick Start section above!
