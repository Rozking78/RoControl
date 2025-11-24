# RoControl - Project Information

## Repository Information

**GitHub Repository:** https://github.com/Rozking78/RoControl
**Owner:** Rozking78
**Project Name:** RoControl
**Local Path:** `/home/deck/Downloads/steamdeck-dmx-controller`

## Quick Clone Commands

**SSH (Recommended):**
```bash
git clone git@github.com:Rozking78/RoControl.git
cd RoControl
```

**HTTPS:**
```bash
git clone https://github.com/Rozking78/RoControl.git
cd RoControl
```

## Project Overview

RoControl is a professional-grade DMX lighting control system built specifically for Steam Deck, featuring:
- MA3/Hog-style CLI interface
- Native Steam Deck gamepad controls
- Web remote control (port 8080)
- Art-Net, sACN, and NDI protocol support
- Full touch-optimized UI

## Tech Stack

- **Frontend:** React + Vite
- **Backend:** Rust + Tauri
- **Protocols:** Art-Net, sACN (E1.31), NDI
- **Platform:** Steam Deck (Arch Linux)

## Development Setup

### 1. Install Dependencies
```bash
sudo ./install-deps-simple.sh
```

### 2. Build Project
```bash
./build.sh
```

### 3. Run Application
```bash
./src-tauri/target/release/rocontrol
```

Or run the AppImage:
```bash
/home/deck/Applications/RoControl-x86_64.AppImage
```

### 4. Development Mode
```bash
npm run tauri dev
```

## Key Features Implemented

### Core System ✅
- ✅ MA3/Hog-style CLI with command parsing
- ✅ Fixture patching and management
- ✅ Programmer with encoder control
- ✅ Preset system (60 slots across 5 feature sets)
- ✅ Cue and executor system
- ✅ Group management

### Windows (27 Total) ✅
- ✅ Fixtures, Programmer, Programmer Pro
- ✅ Color Palettes, Executors, Quick Actions
- ✅ Channel Grid, Cues, Cue Grid
- ✅ Group Grid, Groups Window
- ✅ Color Window, Intensity, Position, Focus, Gobo
- ✅ FlexWindow, Attributes, View Recall
- ✅ Pixel Grid, Protocol Settings
- ✅ Video Patch, Video Outputs
- ✅ Clocks Configuration
- ✅ Program Time, Cue/Executor Time
- ✅ Group Handles

### Advanced Features ✅
- ✅ Steam Deck Integration (L4/L5/R4/R5 shortcuts)
- ✅ Web Remote with REST API + WebSocket
- ✅ NDI Support with auto-discovery
- ✅ Clocks System (TOD, Timecode, Countdown, Video TRR, Sunrise/Sunset)
- ✅ Time-based fades and transitions
- ✅ Highlight mode for fixture selection
- ✅ Fan mode for grid-based effects

## Pending Features

### High Priority
1. ⏳ Group Handles (fixture 4001+) - Auto-assign fixture numbers
2. ⏳ IF Command Support - Conditional execution
3. ⏳ Enhanced Record Behavior - Auto-create cues vs groups
4. ⏳ Art-Net Protocol - Full implementation
5. ⏳ sACN Protocol - Full implementation

### Medium Priority
6. ⏳ Virtual Intensity Logic - Scale RGB by master fader
7. ⏳ On-Screen Keyboard - Contextual input
8. ⏳ Video Inputs Window (F26)
9. ⏳ Video Outputs Window (F27)

### Low Priority
10. 🔮 Dual Programmer Mode - Two operators simultaneously

## Project Structure

```
steamdeck-dmx-controller/
├── src/                      # React frontend
│   ├── components/           # UI components
│   │   ├── views/           # Window components
│   │   ├── CLI.jsx          # Command-line interface
│   │   ├── GridLayout.jsx   # Window management
│   │   └── ...
│   ├── utils/               # Utilities
│   │   ├── cliParser.js     # CLI command parser
│   │   ├── cliDispatcher.js # Command routing
│   │   ├── clocksManager.js # Clock management
│   │   └── ...
│   └── styles/              # CSS files
├── src-tauri/               # Rust backend
│   ├── src/
│   │   ├── main.rs          # Tauri main
│   │   ├── web_server.rs    # Web remote server
│   │   ├── ndi_support.rs   # NDI integration
│   │   └── ...
│   └── Cargo.toml           # Rust dependencies
├── build.sh                 # Build script
└── install-deps-simple.sh   # Dependency installer
```

## Important Directories

- **AppImage Location:** `/home/deck/Applications/RoControl-x86_64.AppImage`
- **Project Root:** `/home/deck/Downloads/steamdeck-dmx-controller`
- **Build Output:** `src-tauri/target/release/rocontrol`

## Web Remote Access

Once running, access the web remote from any device on your network:
```
http://[your-steam-deck-ip]:8080
```

## Documentation Files

- `README.md` - Quick start guide
- `WORKFLOW_NOTES.md` - Development roadmap
- `NEW_FEATURES_SUMMARY.md` - Latest features (v0.2.0)
- `CLI_INTEGRATION.md` - CLI documentation
- `BUILD_INSTRUCTIONS.md` - Detailed build guide
- `STEAM_DECK_SETUP.md` - Steam Deck specific setup

## Build Status

**Last Successful Build:** 2025-11-24
**Build Output:** 109 modules transformed ✓
**Bundle Size:** ~331 KB (gzipped: ~93 KB)

## Git Information

**Current Branch:** main
**Latest Commit:** feat: Add all missing windows to GridLayout selection menu
**Total Commits:** 7

## Contact & Support

- **Repository:** https://github.com/Rozking78/RoControl
- **Issues:** https://github.com/Rozking78/RoControl/issues

---

*Last Updated: 2025-11-24*
*Built with Claude Code*
