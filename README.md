# RoControl - Professional DMX Lighting Controller

A professional-grade DMX lighting control system built for Steam Deck, featuring an MA3/Hog-style CLI interface and web remote control.

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
cd ~/Downloads/steamdeck-dmx-controller
sudo ./install-deps-simple.sh
```

### Step 2: Build

```bash
./build.sh
```

### Step 3: Run

```bash
./src-tauri/target/release/rocontrol
```

### Step 4: Access Web Remote

Open on any device: `http://[your-steam-deck-ip]:8080`

## 📚 Documentation

- **INSTALL_NOW.md** - Installation instructions (START HERE!)
- **START_HERE.md** - Quick start guide
- **NEW_FEATURES_SUMMARY.md** - Latest features and updates
- **WORKFLOW_NOTES.md** - Development roadmap and future features
- **WEB_REMOTE.md** - Web remote documentation
- **BUILD_INSTRUCTIONS.md** - Detailed build guide
- **STEAM_DECK_SETUP.md** - Steam Deck specific setup

## ✨ Features

### Core Lighting Control
- Art-Net and sACN protocol support
- MA3/Hog-style command line interface
- Fixture patching and control
- Programmer with encoder control
- Preset and cue system with dot notation
- Fan mode for grid-based effects
- Time-based fades and transitions
- Highlight mode for fixture selection

### Web Remote (NEW!)
- Browser-based remote control
- Access from any device on your network
- Execute CLI commands via REST API
- Upload and manage video files
- Real-time WebSocket updates
- Responsive mobile-friendly interface
- Quick command buttons
- Command history panel

### Native Steam Deck Integration (NEW!)
- Full gamepad control with window navigation
- Quick access buttons (L4/L5/R4/R5 back buttons)
- Button combinations for common commands
- Multiple operation modes (Navigate, Cue, Executor, Command)
- Real-time HUD with mode indicators
- Web remote Steam Deck control API

### Video Fixtures & NDI Support (NEW!)
- Video file patching
- Upload via web interface
- **Full NDI support with automatic discovery**
- Manual NDI source management
- NDI connection testing
- Video parameter control
- Video time tracking and time remaining (TRR)

### Time & Clocks System (NEW!)
- **Program Time Control** - Set default fade time for programmer
- **Cue/Executor Time Control** - Individual fade times per cue/executor
- **Comprehensive Clocks System:**
  - Time of Day (clock.1 or clock.TOD)
  - Timecode sync (clock.2 or clock.timecode)
  - Countdown timers (clock.3+)
  - Video playback time (clock.video.N)
  - Video time remaining (clock.video.N.TRR)
  - Sunrise/Sunset times (clock.sunrise, clock.sunset)
- **Clock Configuration Window** - Manage and save clock settings
- **IF Command Support** - Conditional execution based on clock states

### Feature Sets
1. **Intensity** - Dimmer, strobe, shutter
2. **Position** - Pan, tilt, fine control
3. **Color** - RGB, white, amber, UV
4. **Focus** - Focus, zoom, iris, edge
5. **Gobo** - Gobo wheels and rotation
6. **Beam** - Prism, frost, effects
7. **VideoSource** - Source select and input control
8. **VideoOutput** - Output routing and effects
9. **Clocks** - Time-based automation and references

## 🎮 CLI Commands

### Fixture Selection
```bash
fixture 1              # Select fixture 1
1 thru 10              # Select fixtures 1-10
1 + 5 + 9              # Select specific fixtures
group 1                # Select group 1
```

### Parameter Control
```bash
at 255                 # Set dimmer to 255
at 50 thru 100         # Fan dimmer from 50 to 100
red at 255             # Set red to 255
encoder 1 255          # Set encoder 1 to 255
```

### Feature Sets
```bash
intensity              # Switch to intensity
position               # Switch to position
color                  # Switch to color
```

### Recording
```bash
record 3.1             # Record to color preset 1
record cue 1           # Record to cue 1
update 3.1             # Update color preset 1 (merge)
```

### Special Commands
```bash
highlight              # Toggle highlight mode
fan center             # Fan from center
fan left x             # Fan from left on X axis
time 5                 # Set fade time to 5 seconds
blackout               # Blackout all fixtures
clear                  # Clear programmer
```

## 🌐 Web Remote API

### REST Endpoints

**Execute Command:**
```bash
POST /api/command
Content-Type: application/json

{
  "command": "fixture 1 at 255"
}
```

**List Videos:**
```bash
GET /api/videos
```

**Upload Video:**
```bash
POST /api/video/upload
Content-Type: multipart/form-data

file: [video file]
```

**System Status:**
```bash
GET /api/status
```

### WebSocket

```javascript
const ws = new WebSocket('ws://[ip]:8080/ws');
ws.onmessage = (event) => {
  console.log('Update:', event.data);
};
```

## 🛠️ Development

### Run in Dev Mode
```bash
npm run tauri dev
```

### Build for Production
```bash
npm run tauri build
```

### Clean Build
```bash
cd src-tauri
cargo clean
cd ..
npm run build
npm run tauri build
```

## 📦 System Requirements

- **Platform:** Steam Deck (or Arch Linux)
- **Disk Space:** 3 GB for build
- **Memory:** 2 GB RAM
- **Network:** WiFi for web remote

## 🔧 Troubleshooting

### Build fails with "libsoup-2.4 not found"
```bash
sudo ./install-deps-simple.sh
```

### "base-devel not installed"
```bash
sudo pacman -S --needed base-devel glib2-devel webkit2gtk
```

### Web remote not accessible
- Check firewall: `sudo ufw allow 8080/tcp`
- Verify IP address: `ip addr show`
- Ensure RoControl is running

### Out of disk space
```bash
cd src-tauri && cargo clean
```

## 📖 Full Command Reference

See the following documentation files for complete command reference:
- `ENCODER_HIGHLIGHT_COMMANDS.md` - Encoder and highlight commands
- `FAN_COMMAND.md` - Fan mode documentation
- `TIME_COMMAND.md` - Time command documentation
- `UPDATE_COMMAND.md` - Update vs record
- `DOT_NOTATION_PRESETS.md` - Preset system

## 🤝 Contributing

This is a professional lighting control system. Contributions welcome!

## 📝 License

See LICENSE file for details.

## 🎯 Getting Help

1. Check `INSTALL_NOW.md` for installation issues
2. Check `START_HERE.md` for quick start
3. Check `WEB_REMOTE.md` for web remote setup
4. Create an issue on GitHub

## 🎉 What's New - Version 0.2.0

### Latest Features (2025-11-22)
- ✨ **Native Steam Deck Integration** - Full gamepad control with back button shortcuts
- ✨ **NDI Support** - Automatic NDI discovery and manual source management
- ✨ **Program Time Control** - Set default fade times with quick presets
- ✨ **Cue/Executor Time Control** - Individual fade times per cue/executor
- ✨ **Comprehensive Clocks System** - Time of day, countdown, video time, sunrise/sunset
- ✨ **Clock Configuration Window** - Manage and save all clock settings
- ✨ **IF Command Support** - Conditional execution based on clock states
- ✨ **Web Remote Steam Deck API** - Control via web remote with full Steam Deck emulation
- ✨ Web remote with REST API
- ✨ Video file upload and management
- ✨ WebSocket real-time updates
- ✨ Mobile-responsive interface
- ✨ Quick command buttons
- ✨ Encoder wheel control
- ✨ Highlight mode
- ✨ Fan mode for effects
- ✨ Time-based fades

### Coming Soon
- Group Handles (fixture 4001+) with inhibitive/additive/scaling modes
- Enhanced record behavior (auto-create cues vs groups)
- Dual programmer operation mode

See **NEW_FEATURES_SUMMARY.md** for complete details!

---

**Built with:** Rust, Tauri, React, Vite, Axum
**Protocols:** Art-Net, sACN (E1.31), NDI
**Platform:** Steam Deck, Linux

Access your lighting console from anywhere with the web remote at `http://[your-ip]:8080`
