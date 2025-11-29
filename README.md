# RocKontrol Media Server

A professional NDI media server with multi-stream support, web UI, REST API, and Stream Deck integration.

## Features

### Core Capabilities
- **Multi-Stream NDI Output** - Run multiple concurrent NDI streams simultaneously
- **Video Playback** - Stream video files (MP4, MOV, AVI, MKV, M4V) via NDI
- **NDI Source Routing** - Receive and retransmit existing NDI streams (route/rename/add effects)
- **Test Patterns** - Generate test patterns (Gradient, Grid, SMPTE Bars, Checkerboard)
- **Screen Edge Blending** - Built-in edge feathering for multi-projector setups
- **Playback Controls** - Play, pause, loop, and cue video files
- **Video Library Management** - Upload, organize, and manage video files
- **Playlist Support** - Create and manage playlists
- **REST API** - Full programmatic control via HTTP API
- **WebSocket** - Real-time status updates
- **Web UI** - Browser-based control interface

### Output Options
- Multiple resolutions: 1080p, 720p, 1440p, 4K
- Configurable frame rates (1-120 fps)
- BGRA color space (NDI standard)
- Progressive scan

### Professional Features
- **Edge Blending** - Configurable left/right/top/bottom edge feathering (0-100%)
- **Test Grid** - Alignment grid with crosshairs for projector setup
- **SMPTE Bars** - Industry-standard color bars
- **Logging** - Per-stream log files in `logs/` directory

## Quick Start

### Prerequisites
- macOS (uses AVFoundation for video decoding)
- Node.js 18+
- NDI SDK installed at `/Library/NDI SDK for Apple`

### Installation

```bash
cd "/Users/roswellking/RocKontrol Media Server"

# Install dependencies
npm install

# Build native NDI sender
make

# Start server
npm start
```

The server will start on `http://0.0.0.0:4455` (configurable via `HOST` and `PORT` environment variables).

Open http://localhost:4455 in your browser to access the web UI.

## Usage

### Web UI

The web interface provides:
- **Stream Control** - Start/stop NDI streams
- **Video Library** - Upload and manage video files
- **Playlists** - Create and organize playlists
- **Live Monitoring** - Real-time stream status

### REST API

Base URL: `http://localhost:4455/api`

#### Streams

**List all streams**
```bash
GET /api/streams
```

**Get specific stream**
```bash
GET /api/streams/:id
```

**Start a new stream**
```bash
POST /api/streams
Content-Type: application/json

{
  "name": "My NDI Stream",
  "mode": "video",           // "video", "pattern", or "grid"
  "file": "/path/to/video.mp4",  // required for video mode
  "pattern": "smpte",        // required for pattern/grid mode
  "width": 1920,
  "height": 1080,
  "fps": 30,
  "loop": true,
  "blend": {
    "left": 0.1,    // 0.0 to 1.0 (10% feather)
    "right": 0.1,
    "top": 0,
    "bottom": 0
  }
}
```

**Stop a stream**
```bash
DELETE /api/streams/:id
```

**Stop all streams**
```bash
DELETE /api/streams
```

#### Video Library

**List videos**
```bash
GET /api/videos
```

**Upload video**
```bash
POST /api/videos/upload
Content-Type: multipart/form-data

video: <file>
```

**Delete video**
```bash
DELETE /api/videos/:filename
```

#### Playlists

**List playlists**
```bash
GET /api/playlists
```

**Get playlist**
```bash
GET /api/playlists/:name
```

**Create/update playlist**
```bash
POST /api/playlists
Content-Type: application/json

{
  "name": "My Playlist",
  "items": [
    { "file": "/path/to/video1.mp4", "duration": 30 },
    { "file": "/path/to/video2.mp4", "duration": 45 }
  ]
}
```

**Delete playlist**
```bash
DELETE /api/playlists/:name
```

### Native Sender CLI

You can also run the native sender directly:

```bash
# Video file
./bin/media_sender \
  --name "My Stream" \
  --mode video \
  --file /path/to/video.mp4 \
  --width 1920 \
  --height 1080 \
  --fps 30 \
  --loop

# Test pattern
./bin/media_sender \
  --name "SMPTE Bars" \
  --mode pattern \
  --pattern smpte \
  --width 1920 \
  --height 1080 \
  --fps 30

# NDI source routing (receive and retransmit)
./bin/media_sender \
  --name "Camera 1 Output" \
  --mode ndi_source \
  --ndi-source "CAMERA-1 (Machine Name)"

# With edge blending
./bin/media_sender \
  --name "Blended Output" \
  --mode pattern \
  --pattern grid \
  --blend-left 0.2 \
  --blend-right 0.2
```

Available patterns: `gradient`, `grid`, `smpte`, `checkerboard`

## Project Structure

```
RocKontrol Media Server/
├── bin/                    # Compiled binaries
│   └── media_sender       # Native NDI sender
├── src/
│   ├── native/
│   │   └── media_sender.mm  # C++/Objective-C NDI sender
│   ├── server.js           # Node.js REST API server
│   └── tray.js            # System tray app (TODO)
├── public/                 # Web UI
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── media/
│   ├── videos/            # Uploaded video files
│   └── playlists/         # Playlist JSON files
├── logs/                  # Per-stream log files
├── config/                # Configuration files
├── Makefile               # Build configuration
├── package.json           # Node.js dependencies
└── README.md
```

## Examples

### Start SMPTE Test Bars

```bash
curl -X POST http://localhost:4455/api/streams \
  -H "Content-Type: application/json" \
  -d '{
    "name": "SMPTE Bars",
    "mode": "pattern",
    "pattern": "smpte",
    "width": 1920,
    "height": 1080,
    "fps": 30
  }'
```

### Stream a Video File

```bash
curl -X POST http://localhost:4455/api/streams \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Video",
    "mode": "video",
    "file": "/Users/roswellking/RocKontrol Media Server/media/videos/my-video.mp4",
    "width": 1920,
    "height": 1080,
    "fps": 30,
    "loop": true
  }'
```

### Route/Rename NDI Source

Receive an existing NDI stream and retransmit it (useful for routing, renaming, or adding edge blending):

```bash
curl -X POST http://localhost:4455/api/streams \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Camera 1 Output",
    "mode": "ndi_source",
    "ndi_source": "CAMERA-1 (Machine Name)"
  }'
```

Add edge blending to an NDI source:

```bash
curl -X POST http://localhost:4455/api/streams \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Left Projector Feed",
    "mode": "ndi_source",
    "ndi_source": "Main Camera",
    "blend": { "right": 0.2 }
  }'
```

### Multi-Projector Setup with Edge Blending

For a 2-projector horizontal blend:

**Left Projector**
```bash
curl -X POST http://localhost:4455/api/streams \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Left Projector",
    "mode": "video",
    "file": "/path/to/video.mp4",
    "blend": { "right": 0.15 }
  }'
```

**Right Projector**
```bash
curl -X POST http://localhost:4455/api/streams \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Right Projector",
    "mode": "video",
    "file": "/path/to/video.mp4",
    "blend": { "left": 0.15 }
  }'
```

## WebSocket Events

Connect to `ws://localhost:4455` to receive real-time updates:

```javascript
const ws = new WebSocket('ws://localhost:4455');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  switch (data.type) {
    case 'streams_update':
      console.log('Current streams:', data.streams);
      break;
    case 'stream_started':
      console.log('Stream started:', data.stream);
      break;
    case 'stream_stopped':
      console.log('Stream stopped:', data.id);
      break;
  }
};
```

## Development

### Build

```bash
make              # Build native sender
make clean        # Clean build artifacts
```

### Run in Development Mode

```bash
HOST=0.0.0.0 PORT=4455 npm run dev
```

### Environment Variables

- `HOST` - Server bind address (default: `0.0.0.0`)
- `PORT` - Server port (default: `4455`)

## Logs

Stream logs are saved to `logs/{stream_id}.log` with timestamps:

```
2025-11-29T17:58:46.952Z [stdout] Initializing NDI...
2025-11-29T17:58:46.952Z [stdout] Streaming smpte test pattern as "SMPTE Test Bars" at 1920x1080 @ 30 fps
```

## Integration

### Stream Deck

Stream Deck plugin coming soon. Will provide:
- One-button stream start/stop
- Quick access to test patterns
- Live stream status indicators

### RoControl

This media server will be integrated into the main RoControl application, providing:
- Unified video + lighting control
- NDI source selection for video fixtures
- Synchronization with lighting cues

## Troubleshooting

### NDI stream not appearing

1. Check that NDI SDK is installed at `/Library/NDI SDK for Apple`
2. Verify the stream is running: `curl http://localhost:4455/api/streams`
3. Check stream logs in `logs/` directory
4. Ensure firewall allows NDI traffic (port 5353 mDNS, dynamic TCP ports)
5. Verify devices are on the same network

### Port already in use

If port 4455 is occupied:
```bash
# Find process using port
lsof -i :4455

# Kill process
kill <PID>

# Or use a different port
PORT=4456 npm start
```

### Video file not playing

- Ensure file path is absolute
- Supported formats: MP4, MOV, AVI, MKV, M4V
- Check that the file is readable by the server
- Review stream logs for AVFoundation errors

## License

MIT

## Credits

Built with:
- [NDI SDK](https://ndi.tv/) - Network Device Interface
- [Express.js](https://expressjs.com/) - Web server
- [AVFoundation](https://developer.apple.com/av-foundation/) - Video decoding
- [WebSocket](https://github.com/websockets/ws) - Real-time communication

---

**RocKontrol Media Server** - Professional NDI streaming for live production
