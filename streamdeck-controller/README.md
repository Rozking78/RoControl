# RocKontrol Stream Deck Controller

Native Stream Deck controller for RocKontrol Media Server that works directly with the hardware via HID - **no Elgato app required**!

## Features

- **Direct Hardware Access** - Communicates with Stream Deck via USB HID (no Elgato software needed)
- **One-Touch Controls** - Start/stop NDI streams with a single button press
- **Live Status** - Buttons light up green when streams are active
- **Test Patterns** - Quick access to SMPTE, Grid, Gradient, and Checkerboard patterns
- **Video Library** - First 4 videos from your library available as quick-launch buttons
- **Resolution Switching** - Toggle between 1080p, 720p, and 4K output
- **Real-time Updates** - Stream status updates every second

## Button Layout

### Row 1: Test Patterns & Emergency Stop
- **Button 0:** SMPTE Bars (color bars)
- **Button 1:** Test Grid (alignment grid with crosshairs)
- **Button 2:** Gradient (moving gradient pattern)
- **Button 3:** Checkerboard (alternating squares)
- **Button 4:** **STOP ALL** (emergency stop - kills all streams)

### Row 2: Video Quick Launch
- **Buttons 5-8:** First 4 videos from library (auto-populated)
- **Button 9:** Refresh (reload video library and status)

### Row 3: Settings & Info
- **Button 10:** Server Status (shows active stream count)
- **Button 11:** 1080p (set output resolution)
- **Button 12:** 720p (set output resolution)
- **Button 13:** 4K (set output resolution)
- **Button 14:** Open Web UI (launches browser)

## Installation

```bash
cd "/Users/roswellking/RocKontrol Media Server/streamdeck-controller"
npm install
```

**Note:** The `canvas` package requires native compilation. You may need:
```bash
# macOS
brew install pkg-config cairo pango libpng jpeg giflib librsvg
```

## Usage

### Start the Controller

```bash
npm start
```

The controller will:
1. Detect connected Stream Deck devices
2. Connect to media server at http://localhost:4455
3. Load video library
4. Display controls on Stream Deck buttons

### Button Behavior

**Pattern/Video Buttons:**
- **First press:** Start streaming
- **Second press:** Stop streaming
- **Green border:** Stream is active

**Resolution Buttons:**
- Press to select resolution for new streams
- Selected resolution has green border
- Doesn't affect already-running streams

**Action Buttons:**
- **Stop All:** Stops all active streams immediately
- **Refresh:** Reloads video library and stream status
- **Open UI:** Opens web interface in browser

## Configuration

Set media server URL via environment variable:

```bash
API_BASE=http://192.168.1.100:4455 npm start
```

## Supported Devices

Works with all Stream Deck models:
- Stream Deck (Original) - 15 keys
- Stream Deck Mini - 6 keys
- Stream Deck XL - 32 keys
- Stream Deck MK.2 - 15 keys
- Stream Deck Plus - 8 keys + 4 dials
- Stream Deck Pedal

The button layout automatically adapts to the connected device.

## Troubleshooting

### "No Stream Deck devices found"

1. Check USB connection
2. Try a different USB port
3. Unplug and replug the Stream Deck
4. Close Elgato Stream Deck software if running

### "Failed to connect to media server"

1. Ensure media server is running: `npm start` in main directory
2. Check server is on port 4455
3. Verify API_BASE URL is correct

### Permission errors (Linux)

Add udev rules for Stream Deck:

```bash
sudo sh -c 'echo "SUBSYSTEM==\"usb\", ATTRS{idVendor}==\"0fd9\", MODE=\"0666\"" > /etc/udev/rules.d/50-elgato.rules'
sudo udevadm control --reload-rules
```

### Canvas build errors

Install native dependencies:

**macOS:**
```bash
brew install pkg-config cairo pango libpng jpeg giflib librsvg
```

**Linux:**
```bash
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
```

## Development

Run with auto-reload:

```bash
npm run dev
```

### Customizing Button Layout

Edit `BUTTONS` object in `index.js`:

```javascript
const BUTTONS = {
    0: { type: 'pattern', name: 'My Pattern', pattern: 'smpte', color: '#FF0000' },
    1: { type: 'video', slot: 0, color: '#00FF00' },
    // ... etc
};
```

Button types:
- `pattern` - Test pattern (gradient, grid, smpte, checkerboard)
- `video` - Video from library (slot 0-3)
- `action` - Special action (stop_all, refresh, open_ui)
- `resolution` - Output resolution selector
- `info` - Status display

## Integration

The controller talks to the media server via REST API:

- `GET /api/streams` - List active streams
- `GET /api/videos` - List video library
- `POST /api/streams` - Start stream
- `DELETE /api/streams/:id` - Stop stream
- `DELETE /api/streams` - Stop all streams

See main README for full API documentation.

## Tips

1. **Quick Pattern Testing:** Use row 1 for instant test patterns during setup
2. **Emergency Stop:** Button 4 (STOP ALL) immediately kills all streams
3. **Video Rotation:** Only first 4 videos shown - press Refresh after adding new videos
4. **Resolution Switching:** Set resolution before starting streams - can't change while running
5. **Multiple Decks:** Controller supports one device - run multiple instances for multiple decks

## Future Enhancements

- [ ] Playlist support
- [ ] Cue points and timing
- [ ] Edge blend controls
- [ ] Stream Deck+ dial support for brightness/blend controls
- [ ] Custom button icons
- [ ] Multi-page layouts for larger libraries

---

**RocKontrol Stream Deck Controller** - Direct hardware control, no middleware required.
