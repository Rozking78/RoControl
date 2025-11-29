# RocKontrol Media Server - Project TODO & Goals

## Project Vision
Professional NDI media server with multi-stream support, web UI, API, and Stream Deck integration for live event production.

---

## Implementation Status

### Completed Features

- [x] **NDI Video Streaming** - Native macOS sender via media_sender.mm
- [x] **NDI Discovery** - Network source discovery via ndi_discover.mm
- [x] **Web UI** - Browser-based playback control interface
- [x] **REST API** - HTTP endpoints for programmatic control
- [x] **WebSocket Support** - Real-time state synchronization
- [x] **Stream Deck Integration** - Hardware button control
- [x] **Multi-output Video Routing** - Route videos to multiple outputs

### In Progress

- [ ] **Video Fixture Integration** - Connect with RoControl fixture system
- [ ] **CLI Command Support** - MA3/Hog-style command syntax
- [ ] **Playlist Management** - Create and manage video playlists
- [ ] **Timecode Sync** - LTC/MTC timecode input

### Planned Features

- [ ] **Group Handle Auto-Assignment** (fixture numbers 4001+)
- [ ] **Program Time Button** - Default fade time control
- [ ] **Cue/Executor Time Button** - Per-cue fade times
- [ ] **Clocks Feature** - Time of day, timecode, video TRR
- [ ] **IF Command Support** - Conditional execution
- [ ] **Dual Programmer Mode** - Two simultaneous operators

---

## CLI Commands (Target Implementation)

### Video Control
```bash
play video1 output1          # Start playback to output
pause video1                 # Pause playback
stop video1                  # Stop and reset
restart video1               # Restart from beginning
loop video1 on/off           # Toggle looping
speed video1 1.5             # Set playback speed (0.1x - 10x)
route video1 output2         # Route to different output
```

### Future Commands
```bash
goto video1 00:01:30         # Jump to timestamp
fade video1 output2 3s       # 3-second crossfade
layer video1 1               # Set video to layer 1
opacity video1 75            # Set opacity to 75%
sync video1 video2           # Synchronize playback
timecode video1 external     # Sync to external timecode
```

---

## Integration Points

### RoControl Integration
- Video fixtures appear in fixture patch (channels, no DMX address)
- Group handles for video outputs (fixture 4001+)
- CLI commands route through unified dispatcher
- Preset system for video configurations

### Stream Deck Integration
- Play/pause/stop buttons per video
- Output selection buttons
- Playlist navigation
- Master controls

### Web Remote
- Full playback control
- Real-time status display
- Multi-device support
- Touch-optimized interface

---

## Architecture Goals

### Data Flow
```
User Input (CLI/Web/StreamDeck)
        ↓
Command Router
        ↓
Video Playback Manager
        ↓
NDI Sender (native)
        ↓
Network Output
```

### State Management
- Persistent playback state (localStorage)
- WebSocket sync across clients
- Auto-reconnect on connection loss

---

## Priority Queue

### High Priority
1. Video fixture integration with RoControl
2. CLI command routing through dispatcher
3. Timecode sync for show automation

### Medium Priority
4. Group handle auto-assignment
5. Program/cue time controls
6. Clocks feature implementation

### Low Priority (Future)
7. Dual programmer mode
8. Advanced effects (blur, brightness)
9. Layer compositing

---

## Testing Checklist

- [ ] NDI output visible in NDI Monitor
- [ ] Web UI loads and controls playback
- [ ] Stream Deck buttons trigger actions
- [ ] WebSocket reconnects after disconnect
- [ ] Multiple clients stay in sync
- [ ] CLI commands execute correctly
- [ ] Video routing works between outputs

---

## Notes

- Native binaries require macOS 10.15+
- NDI SDK must be installed for sender functionality
- Stream Deck controller requires @elgato-stream-deck package

---

*Last Updated: 2025-11-29*
