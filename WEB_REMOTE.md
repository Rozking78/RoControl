# RoControl Web Remote

## Overview

The RoControl Web Remote provides a browser-based interface to control the lighting console from any device on the local network. This enables remote control from tablets, phones, or other computers without installing additional software.

## Features

- **CLI Command Interface**: Execute any RoControl CLI command remotely
- **Quick Commands**: One-click access to frequently used commands
- **Command History**: View command execution history in real-time
- **Video File Management**: Upload and manage video files for video fixtures
- **WebSocket Real-Time Updates**: Live command feedback and system status
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Getting Started

### Accessing the Web Remote

1. Start RoControl on your Steam Deck or desktop computer
2. The web server automatically starts on port 8080
3. From any device on the same network, open a web browser and navigate to:
   ```
   http://[STEAM_DECK_IP]:8080
   ```

### Finding Your IP Address

On the Steam Deck:
- Open Desktop Mode
- Click the network icon in the system tray
- View connection details to find your IP address

Or use RoControl's network settings:
- Go to Settings > Network
- Your IP address is displayed in the interface selection

## Using the Web Remote

### CLI Command Interface

The command interface works exactly like the main RoControl CLI:

1. Type any command in the input field
2. Press Enter or click "Send"
3. View the command result in the history panel

**Examples:**
```bash
fixture 1 thru 10
at 255
color
red at 200
record 3.1 "My Color"
```

### Quick Commands

Pre-configured buttons for common operations:

- **Blackout**: Instantly blackout all fixtures
- **Clear**: Clear the programmer
- **Fixture 1-10**: Select fixtures 1 through 10
- **Full**: Set selected fixtures to full intensity (255)
- **Zero**: Set selected fixtures to zero
- **Highlight**: Toggle highlight mode
- **Color**: Switch to color feature set
- **Position**: Switch to position feature set

### Video File Management

Upload video files for use with video fixtures:

1. Click "Choose Video File"
2. Select a video file from your device
3. Monitor upload progress
4. Video appears in the grid when complete

**Supported Formats:**
- MP4, AVI, MOV, MKV, WebM
- Any format supported by your video playback system

**Video Storage:**
- Videos are stored in: `~/Videos/RoControl/Videos/`
- Files persist across sessions
- Can be referenced in video fixture patching

### WebSocket Status

The colored indicator in the bottom-right shows connection status:

- **Green (solid)**: Connected and receiving updates
- **Yellow (pulsing)**: Connecting/reconnecting
- **Red (solid)**: Disconnected

The system automatically reconnects if the connection is lost.

## API Reference

### REST API Endpoints

#### POST /api/command
Execute a CLI command

**Request:**
```json
{
  "command": "fixture 1 at 255"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Command 'fixture 1 at 255' queued"
}
```

#### GET /api/status
Get system status

**Response:**
```json
{
  "status": "online",
  "version": "0.1.0",
  "features": ["cli", "video_patch", "websocket"]
}
```

#### GET /api/videos
List all uploaded videos

**Response:**
```json
[
  {
    "name": "test.mp4",
    "size": 1048576,
    "path": "/home/deck/Videos/RoControl/Videos/test.mp4"
  }
]
```

#### POST /api/video/upload
Upload a video file (multipart/form-data)

**Request:** Multipart form data with file field

**Response:**
```json
{
  "success": true,
  "message": "Video 'test.mp4' uploaded successfully"
}
```

#### GET /api/video/:name
Get video file metadata

**Response:**
```json
{
  "name": "test.mp4",
  "size": 1048576,
  "path": "/home/deck/Videos/RoControl/Videos/test.mp4"
}
```

### WebSocket Endpoint

#### WS /ws
Real-time command updates and system messages

**Connection:**
```javascript
const ws = new WebSocket('ws://[IP]:8080/ws');

ws.onmessage = (event) => {
  console.log('Received:', event.data);
};
```

**Messages:**
- Command execution confirmations
- System status updates
- Error notifications
- Broadcast messages from the main console

## Security Considerations

**Important:** The web remote is designed for local network use only.

- No authentication is required (trust-based on local network)
- Bind to 0.0.0.0 (all interfaces) for maximum compatibility
- CORS is enabled for any origin on the local network
- Do NOT expose port 8080 to the internet

For production environments:
- Use a firewall to restrict access to local network only
- Consider VPN for remote access instead of port forwarding
- Add authentication if deploying on untrusted networks

## Network Configuration

### Port Information
- **Web Server**: 8080 (HTTP)
- **WebSocket**: 8080 (WS on same port)

### Firewall Rules

On Steam Deck (if firewall enabled):
```bash
sudo ufw allow 8080/tcp
```

On router (for local network access):
- No port forwarding needed for local network use
- All devices must be on the same LAN/WLAN

### Multiple Instances

If running multiple RoControl instances on the same network:
- Each instance uses port 8080 on its own IP
- Access via specific IP addresses
- No port conflicts as each device has unique IP

## Troubleshooting

### Cannot Connect to Web Remote

1. **Check IP Address**
   - Verify the Steam Deck's IP address
   - Ensure you're using the correct IP in the URL

2. **Check Network**
   - Verify both devices are on the same network
   - Disable VPN or firewall temporarily to test

3. **Check Server Status**
   - Look for "Web Remote Server starting on http://0.0.0.0:8080" in logs
   - Verify RoControl is running

4. **Check Port**
   - Ensure port 8080 is not blocked by firewall
   - Verify no other service is using port 8080

### WebSocket Not Connecting

1. **Browser Console**
   - Open browser developer tools (F12)
   - Check console for WebSocket errors

2. **Connection String**
   - Verify using `ws://` not `wss://`
   - Check IP and port are correct

3. **Auto-Reconnect**
   - WebSocket automatically reconnects every 3 seconds
   - Watch the status indicator in bottom-right

### Upload Fails

1. **File Size**
   - Large files may take longer
   - Check available disk space

2. **File Format**
   - Verify file is a supported video format
   - Try a different file to isolate the issue

3. **Network Speed**
   - Large files over WiFi may be slow
   - Use wired connection for faster uploads

## Advanced Usage

### Custom Integration

Build your own web interface or mobile app using the API:

```javascript
// Send command
async function sendCommand(cmd) {
  const response = await fetch('http://192.168.1.100:8080/api/command', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command: cmd })
  });
  return await response.json();
}

// Get videos
async function getVideos() {
  const response = await fetch('http://192.168.1.100:8080/api/videos');
  return await response.json();
}

// WebSocket connection
const ws = new WebSocket('ws://192.168.1.100:8080/ws');
ws.onmessage = (event) => {
  console.log('Update:', event.data);
};
```

### Scripting

Use curl or other HTTP clients for automation:

```bash
# Send command via curl
curl -X POST http://192.168.1.100:8080/api/command \
  -H "Content-Type: application/json" \
  -d '{"command":"fixture 1 at 255"}'

# Get status
curl http://192.168.1.100:8080/api/status

# List videos
curl http://192.168.1.100:8080/api/videos

# Upload video
curl -X POST http://192.168.1.100:8080/api/video/upload \
  -F "file=@/path/to/video.mp4"
```

### Mobile App Development

The REST API and WebSocket interface can be used to build native mobile apps:

- iOS: Use URLSession and Starscream (WebSocket)
- Android: Use Retrofit and OkHttp (WebSocket)
- React Native: Use fetch API and react-native-websocket
- Flutter: Use http package and web_socket_channel

## Performance

- **Latency**: ~10-50ms on local network
- **WebSocket Overhead**: Minimal, text-based messages
- **File Upload**: Limited by network speed (typically 10-100 MB/s on WiFi)
- **Concurrent Connections**: Supports multiple simultaneous web clients

## Future Enhancements

Planned features for future releases:

- [ ] User authentication and access control
- [ ] HTTPS/WSS support for encrypted connections
- [ ] Mobile-optimized touch interface
- [ ] Preset and cue triggering
- [ ] Virtual encoder wheels
- [ ] Live output visualization
- [ ] Multi-user collaboration features
- [ ] Remote fixture patching
- [ ] Show file upload/download

## Summary

The RoControl Web Remote provides professional-grade remote access to your lighting console from any device on your local network. With full CLI command support, video file management, and real-time WebSocket updates, you can control your show from anywhere in the venue.

Access: `http://[YOUR_IP]:8080`
