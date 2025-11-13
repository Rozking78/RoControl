# Steam Deck DMX Lighting Controller

A professional DMX lighting controller inspired by MA dot2 and Hog 4 consoles, optimized for Steam Deck with GDTF fixture library support.

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![Platform](https://img.shields.io/badge/platform-SteamOS%20%7C%20Linux%20%7C%20Windows%20%7C%20macOS-green)

## Features

### ✨ Console-Style Interface
- **MA dot2 inspired** encoder wheels and programmer section
- **Hog 4 inspired** multi-touch support and command workflow
- Dark theme optimized for low-light environments
- Touch-optimized for Steam Deck handheld mode

### 🎮 Steam Deck Native Controls
- **Left Joystick**: Pan/Tilt control for moving lights
- **Right Trigger (R2)**: Dimmer control
- **D-Pad**: Navigate fixtures
- **A Button**: Select fixtures
- **B Button**: Blackout
- **X Button**: Locate (50% white)
- **Y Button**: Clear programmer
- **Bumpers**: Page through executors

### 🌐 DMX Protocols
- **Art-Net** - DMX over Ethernet (primary)
- **sACN (E1.31)** - Streaming ACN support (future)
- Support for multiple universes (0-255)
- Real-time DMX output at 44fps

### 📚 GDTF Fixture Library
- Import fixtures from **gdtf-share.com**
- Standard GDTF format support
- Custom fixture builder
- Patch management

### 🎨 Lighting Features
- Color palettes with RGB/CMY control
- Position presets for moving lights
- Executor faders (6 playback faders)
- Live programmer with priority
- Intensity, color, beam, and position control

## Installation

### Prerequisites

**For Development:**
- Node.js 18+ and npm
- Rust 1.70+ (via rustup)
- Tauri CLI

**For SteamOS/Steam Deck:**
- SteamOS 3.0+ (Arch Linux based)
- Network access for Art-Net

### Building from Source

1. **Clone the repository:**
```bash
git clone https://github.com/yourusername/steamdeck-dmx-controller.git
cd steamdeck-dmx-controller
```

2. **Install dependencies:**
```bash
npm install
```

3. **Run in development mode:**
```bash
npm run tauri:dev
```

4. **Build for production:**
```bash
npm run tauri:build
```

The compiled binary will be in `src-tauri/target/release/`

### Installing on Steam Deck

1. **Switch to Desktop Mode** on your Steam Deck

2. **Install the application:**
```bash
# Copy the built binary to your Steam Deck
chmod +x steamdeck-dmx-controller
./steamdeck-dmx-controller
```

3. **Add to Steam as Non-Steam Game:**
   - Open Steam in Desktop Mode
   - Games → Add a Non-Steam Game to My Library
   - Browse to the application binary
   - Configure controller layout if needed

4. **Network Setup for Art-Net:**
   - Connect Steam Deck to your lighting network (WiFi or USB Ethernet)
   - Default broadcast: `2.255.255.255` (Art-Net standard)
   - Configure in app settings if needed

## Quick Start Guide

### 1. Configure Art-Net
- Default broadcast address: `2.255.255.255`
- Ensure your DMX interface/node is on the same network
- Test with a simple fixture first

### 2. Add Fixtures

**Option A: Import GDTF Files**
```
Top Menu → Setup → Import GDTF
```
Browse to downloaded `.gdtf` files from gdtf-share.com

**Option B: Manual Patching**
```
Top Menu → Patch → Add Fixture
- Name: Fixture name
- Type: Select from library
- Universe: 0-255
- Address: 1-512
- Mode: Select DMX mode
```

### 3. Control Fixtures

**Select Fixtures:**
- Click fixtures in the left panel
- Or use D-Pad + A button (Steam Deck)

**Adjust Parameters:**
- Click encoder wheels to increment
- Use touchscreen for precise control
- Steam Deck: Use triggers and joysticks

**Apply Colors:**
- Click color palettes on the right
- Or use encoders for custom RGB

**Save to Executors:**
- Adjust programmer values
- Click empty executor fader
- Name your cue

## DMX Channel Mapping

Standard fixture channel layout (may vary by fixture):

| Channel | Function |
|---------|----------|
| 1       | Dimmer   |
| 2       | Red      |
| 3       | Green    |
| 4       | Blue     |
| 5       | Pan      |
| 6       | Tilt     |
| 7+      | Effects  |

## Architecture

```
┌─────────────────────────────────────┐
│   React Frontend (Vite + Tauri)    │
│   - Console UI (MA dot2/Hog style) │
│   - Gamepad Input Handler          │
│   - Touch Controls                 │
└──────────────┬──────────────────────┘
               │ IPC
┌──────────────▼──────────────────────┐
│   Rust Backend (Tauri Core)        │
│   - DMX Engine                     │
│   - Art-Net Protocol               │
│   - GDTF Parser                    │
│   - Show File Manager              │
└──────────────┬──────────────────────┘
               │ UDP
┌──────────────▼──────────────────────┐
│   Network (Art-Net)                │
│   - UDP Port 6454                  │
│   - Broadcast to 2.255.255.255     │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   DMX Hardware                     │
│   - Art-Net Node                   │
│   - DMX Interface                  │
│   - Lighting Fixtures              │
└────────────────────────────────────┘
```

## GDTF Resources

**Official GDTF Share:**
https://gdtf-share.com

**Download Popular Fixtures:**
- Robe
- Martin
- Clay Paky
- Chauvet
- ADJ
- Elation

**GDTF Documentation:**
https://gdtf-share.com/wiki/

## Roadmap

### Version 0.2 (Next)
- [ ] Full GDTF XML parsing
- [ ] Fixture mode selection
- [ ] Effect engine (chases, waves)
- [ ] Show file save/load

### Version 0.3
- [ ] Multi-universe support (up to 64)
- [ ] Groups and presets
- [ ] Cue list playback
- [ ] Timecode integration

### Version 0.4
- [ ] sACN protocol support
- [ ] MIDI control surface mapping
- [ ] 3D visualizer (basic)
- [ ] Audio-reactive effects

### Version 1.0
- [ ] Advanced effects engine
- [ ] Macro programming
- [ ] Cloud show sync
- [ ] Mobile companion app

## Troubleshooting

### Art-Net Not Working
1. Check network connection
2. Verify broadcast address matches your network
3. Ensure Art-Net node is powered and configured
4. Check firewall settings (UDP port 6454)

### Gamepad Not Detected
1. Ensure Steam Deck controller is active
2. Try Desktop Mode → Gaming Mode switch
3. Check browser gamepad API support

### Fixtures Not Responding
1. Verify DMX addressing
2. Check universe assignment
3. Test with direct DMX channel control
4. Confirm fixture is in correct DMX mode

## Development

### Project Structure
```
steamdeck-dmx-controller/
├── src/                    # React frontend
│   ├── App.jsx            # Main application
│   ├── components/        # UI components
│   └── styles/            # CSS files
├── src-tauri/             # Rust backend
│   ├── src/
│   │   └── main.rs       # Tauri core + DMX engine
│   └── Cargo.toml        # Rust dependencies
└── package.json           # Node dependencies
```

### Tech Stack
- **Frontend**: React 18, Vite
- **Backend**: Rust, Tauri
- **DMX**: artnet_protocol crate
- **Gamepad**: Gamepad API
- **Styling**: Custom CSS (MA/Hog inspired)

### Contributing
Contributions welcome! Areas of interest:
- GDTF parser improvements
- Additional DMX protocols (sACN, DMX512 USB)
- Effect engine development
- UI/UX enhancements
- Documentation

## License

MIT License - See LICENSE file for details

## Credits

Inspired by:
- **MA Lighting dot2** - Encoder workflow and clean UI
- **High End Systems Hog 4** - Command line and programmer concept
- **GDTF Community** - Open fixture format

## Support

- **Issues**: GitHub Issues
- **Discord**: [Join our community]
- **Documentation**: [Wiki](https://github.com/yourusername/steamdeck-dmx-controller/wiki)

## Disclaimer

This is an independent project and is not affiliated with MA Lighting, High End Systems, or any lighting console manufacturer. All trademarks belong to their respective owners.

---

**Made with ❤️ for the Steam Deck and lighting community**
