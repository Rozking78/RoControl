# Quick Start Guide

Get RocKontrol Media Server running in 5 minutes!

## Prerequisites Check

Before starting, ensure you have:

- ✅ macOS (for video decoding via AVFoundation)
- ✅ Node.js 18+ (`node --version`)
- ✅ NDI SDK installed at `/Library/NDI SDK for Apple`
- ✅ (Optional) Elgato Stream Deck connected via USB

## Option 1: Double-Click Launcher (Easiest)

1. **Double-click** `start_server.command` in Finder
2. Follow the prompts to configure host/port
3. Web UI will open automatically at http://localhost:4455

That's it! The server is running.

## Option 2: Terminal

```bash
cd "/Users/roswellking/RocKontrol Media Server"

# Install dependencies
npm install

# Build native sender
make

# Start server
npm start
```

Open http://localhost:4455 in your browser.

## First Steps

### 1. Test the Server

Open the web UI and you should see:
- Empty stream list
- Empty video library
- Playlist section

### 2. Start a Test Pattern

**Via Web UI:**
1. Select "Test Pattern" mode
2. Choose "SMPTE Bars"
3. Click "Start Stream"

**Via API:**
```bash
curl -X POST http://localhost:4455/api/streams \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","mode":"pattern","pattern":"smpte"}'
```

**Check your NDI receiver** - you should see "Test" as an available NDI source broadcasting SMPTE color bars!

### 3. Upload a Video

**Via Web UI:**
1. Click "Upload Video"
2. Select a video file (MP4, MOV, AVI, MKV)
3. Wait for upload to complete
4. File appears in video library

**Via API:**
```bash
curl -X POST http://localhost:4455/api/videos/upload \
  -F "video=@/path/to/your/video.mp4"
```

### 4. Stream a Video

1. In the web UI, select "Video File" mode
2. Choose your uploaded video from the dropdown
3. Click "Start Stream"
4. Check your NDI receiver - the video should be streaming!

### 5. Try Edge Blending

For multi-projector setups:

1. Expand "Edge Blending" section
2. Adjust sliders (e.g., 20% left edge, 20% right edge)
3. Start a test pattern to see the blending effect
4. Use this to overlap projector edges seamlessly

## Stream Deck Control (Optional)

If you have an Elgato Stream Deck:

```bash
cd streamdeck-controller
npm install
npm start
```

Your Stream Deck buttons will now control the media server:
- **Top row:** Test patterns (SMPTE, Grid, Gradient, Checkerboard, STOP ALL)
- **Middle row:** Quick-launch your first 4 videos
- **Bottom row:** Settings and resolution control

Press any button to start streaming. Press again to stop. Active streams have green borders!

## Common Use Cases

### Scenario: Live Event with Test Patterns

1. Start server: `npm start`
2. Start Stream Deck controller (optional)
3. Press SMPTE button before event for camera alignment
4. Switch to Grid pattern for projector alignment
5. Press video button to start content
6. Press STOP ALL when done

### Scenario: Multi-Projector Blend

```bash
# Left projector (20% right blend)
curl -X POST http://localhost:4455/api/streams \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Left",
    "mode":"video",
    "file":"/path/to/video.mp4",
    "blend":{"right":0.2}
  }'

# Right projector (20% left blend)
curl -X POST http://localhost:4455/api/streams \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Right",
    "mode":"video",
    "file":"/path/to/video.mp4",
    "blend":{"left":0.2}
  }'
```

Point your NDI receivers to "Left" and "Right" streams respectively.

### Scenario: Remote Control from Another Device

1. Start server with: `HOST=0.0.0.0 npm start`
2. Find your Mac's IP: `ifconfig | grep "inet "`
3. On another device, open: `http://YOUR_IP:4455`
4. Control streams from phone/tablet!

## Directory Structure

```
RocKontrol Media Server/
├── start_server.command     ← Double-click to start
├── bin/media_sender          ← Native NDI broadcaster (auto-built)
├── media/videos/             ← Your uploaded videos go here
├── logs/                     ← Stream logs saved here
└── streamdeck-controller/    ← Stream Deck integration
```

## Stopping the Server

- **GUI launcher:** Press Ctrl+C in terminal
- **Terminal:** Press Ctrl+C
- **Streams will stop automatically** when server stops

## Next Steps

- Read `README.md` for full API documentation
- Check `streamdeck-controller/README.md` for Stream Deck details
- Explore edge blending for multi-projector shows
- Create playlists for automated playback
- Integrate with RoControl for lighting sync

## Troubleshooting

**"Command not found: node"**
- Install Node.js from https://nodejs.org or use `nvm`

**"NDI stream not appearing"**
- Check NDI SDK is installed: `ls /Library/NDI\ SDK\ for\ Apple/`
- Ensure devices are on same network
- Check firewall settings (allow mDNS port 5353)

**"Port 4455 already in use"**
- Find process: `lsof -i :4455`
- Kill it: `kill <PID>`
- Or use different port: `PORT=4456 npm start`

**"Permission denied" for start_server.command**
- Make executable: `chmod +x start_server.command`

## Support

- Check logs in `logs/` directory
- Server logs show in terminal
- Stream-specific logs: `logs/stream_*.log`

## What's Next?

This media server is designed to be integrated into the main **RoControl** application for unified lighting + video control. For now, use it as a standalone NDI server with:

- Professional test patterns
- Multi-stream video playback
- Edge blending for projector arrays
- Stream Deck hardware control
- REST API for automation

Enjoy!

---

🎬 **RocKontrol Media Server** - Professional NDI streaming made easy
