# Installing RoControl on Steam Deck

This guide shows you how to install pre-built RoControl releases on your Steam Deck without needing to compile anything.

## Quick Install (Recommended)

### Method 1: AppImage (Easiest - No Installation Required)

1. **Download the AppImage** from the [Releases page](https://github.com/Rozking78/RoControl/releases)
   - Look for the latest release
   - Download `rocontrol_*_amd64.AppImage`

2. **Make it executable**
   ```bash
   chmod +x rocontrol_*.AppImage
   ```

3. **Run it**
   ```bash
   ./rocontrol_*.AppImage
   ```

**Advantages:**
- ✅ No installation needed
- ✅ No root/sudo required
- ✅ Won't conflict with SteamOS libraries
- ✅ Portable - keep it anywhere
- ✅ Easy to update - just replace the file

### Method 2: Debian Package (System Integration)

1. **Download the .deb package** from the [Releases page](https://github.com/Rozking78/RoControl/releases)
   - Download `rocontrol_*_amd64.deb`

2. **Disable read-only filesystem** (Steam Deck only)
   ```bash
   sudo steamos-readonly disable
   ```

3. **Install the package**
   ```bash
   sudo dpkg -i rocontrol_*.deb
   ```

4. **Re-enable read-only** (Steam Deck only)
   ```bash
   sudo steamos-readonly enable
   ```

5. **Launch**
   - From Desktop Mode: Find "RoControl" in your application menu
   - From terminal: `rocontrol`

**Note:** System updates may remove the installation. AppImage is recommended for Steam Deck.

## Adding to Steam

You can add RoControl to your Steam library for easy access in Gaming Mode:

1. **Open Steam in Desktop Mode**
2. **Click "Games" → "Add a Non-Steam Game to My Library"**
3. **Browse** and select:
   - For AppImage: Select your `.AppImage` file
   - For .deb install: Browse to `/usr/bin/rocontrol`
4. **Configure** (optional):
   - Right-click the game → Properties
   - Change name to "RoControl - DMX Lighting"
   - Set launch options if needed
   - Add custom artwork

## First Launch Setup

When you first run RoControl:

1. **Go to Setup** (gear icon in bottom-right)
2. **Configure Network**:
   - Set Art-Net broadcast address (usually `2.255.255.255`)
   - Or configure sACN/E1.31
3. **Configure Controllers**:
   - **Steam Deck tab**: Configure built-in controls
   - **Elgato Stream Deck tab**: Connect your Stream Deck (if you have one)
4. **Patch Fixtures**: Add your DMX lights

## Hardware Setup

### USB Devices

RoControl supports:
- **DMX USB Interfaces** (Art-Net/sACN over network)
- **Elgato Stream Deck** (USB HID - plug and play)

To use USB devices on Steam Deck:
1. Connect via USB-C hub or dock
2. Grant permissions if prompted
3. Devices appear automatically in Setup

### Network Setup

For wireless DMX control:
1. **Connect Steam Deck to WiFi**
2. **Connect lighting system** to same network
3. **In RoControl Setup**:
   - Note your IP address (shown in Network tab)
   - Set broadcast address or specific IPs
   - Test with a simple fixture

## Performance Tips for Steam Deck

1. **Desktop Mode vs Gaming Mode**:
   - Desktop Mode: Full functionality, best for programming
   - Gaming Mode: Touch-optimized, gamepad control

2. **Power Settings**:
   - Keep Steam Deck plugged in for shows
   - Disable screen dimming/sleep in settings

3. **Network Performance**:
   - Use 5GHz WiFi for better latency
   - Or connect via Ethernet through USB-C dock

## Updating RoControl

### AppImage:
1. Download new `.AppImage` from releases
2. Replace old file
3. Done!

### .deb Package:
1. Download new `.deb`
2. Disable read-only: `sudo steamos-readonly disable`
3. Install: `sudo dpkg -i rocontrol_*.deb`
4. Enable read-only: `sudo steamos-readonly enable`

## Troubleshooting

### "Permission denied" error
```bash
chmod +x rocontrol_*.AppImage
```

### Can't find downloaded file
Default download location: `~/Downloads`
```bash
cd ~/Downloads
ls -la rocontrol*
```

### AppImage won't run
Try installing FUSE:
```bash
sudo steamos-readonly disable
sudo pacman -S fuse2
sudo steamos-readonly enable
```

### Network not working
1. Check firewall settings
2. Verify correct broadcast address
3. Test with another DMX app to verify hardware

### USB devices not detected
1. Check `lsusb` to see if device is connected
2. Try different USB port
3. Check USB hub is powered

## Getting Help

- **Issues**: [GitHub Issues](https://github.com/Rozking78/RoControl/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Rozking78/RoControl/discussions)

## System Requirements

- **OS**: SteamOS 3.0+ (or any Linux distro)
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 100MB for app
- **Network**: WiFi or Ethernet for DMX control
- **USB**: USB-C for peripherals (Stream Deck, DMX interfaces)

## What Works on Steam Deck

✅ **Native Steam Deck Controls**
- D-pad, buttons, joysticks
- Back paddles (L4/L5, R4/R5)
- Touchpads
- Gyro controls

✅ **Elgato Stream Deck**
- All models supported
- Button detection
- Brightness control
- Custom button assignments

✅ **Touch Screen**
- Full touch interface
- Gesture support
- On-screen keyboard

✅ **Network Protocols**
- Art-Net
- sACN/E1.31
- Multicast & Unicast

## Advanced: Building from Source

If you need the absolute latest code or want to customize:

1. **Switch to Desktop Mode**
2. **Disable read-only**:
   ```bash
   sudo steamos-readonly disable
   ```

3. **Install build dependencies**:
   ```bash
   sudo pacman -S base-devel webkit2gtk libsoup libayatana-appindicator
   ```

4. **Install Rust**:
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   source $HOME/.cargo/env
   ```

5. **Install Node.js**:
   ```bash
   sudo pacman -S nodejs npm
   ```

6. **Clone and build**:
   ```bash
   git clone https://github.com/Rozking78/RoControl.git
   cd RoControl
   npm install
   npm run tauri build
   ```

7. **Re-enable read-only**:
   ```bash
   sudo steamos-readonly enable
   ```

Built files will be in `src-tauri/target/release/bundle/`

---

**Enjoy controlling your lights from your Steam Deck! 🎮💡**
