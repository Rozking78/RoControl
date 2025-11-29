const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 4455;
const HOST = process.env.HOST || '0.0.0.0';

// Paths
const BASE_DIR = path.resolve(__dirname, '..');
const MEDIA_DIR = path.join(BASE_DIR, 'media', 'videos');
const PLAYLISTS_DIR = path.join(BASE_DIR, 'media', 'playlists');
const LOGS_DIR = path.join(BASE_DIR, 'logs');
const BIN_DIR = path.join(BASE_DIR, 'bin');
const SENDER_BIN = path.join(BIN_DIR, 'media_sender');

// Ensure directories exist
[MEDIA_DIR, PLAYLISTS_DIR, LOGS_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(BASE_DIR, 'public')));

// File upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, MEDIA_DIR),
    filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`)
});
const upload = multer({ storage });

// Active streams registry
const streams = new Map();

// WebSocket server for real-time updates
const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (ws) => {
    console.log('WebSocket client connected');

    // Send current streams state
    ws.send(JSON.stringify({
        type: 'streams_update',
        streams: Array.from(streams.entries()).map(([id, stream]) => ({
            id,
            name: stream.name,
            mode: stream.mode,
            state: stream.state,
            file: stream.file,
            settings: stream.settings
        }))
    }));

    ws.on('close', () => console.log('WebSocket client disconnected'));
});

// Broadcast to all connected WebSocket clients
function broadcast(data) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

// Stream management functions
function startStream(config) {
    const {
        id = `stream_${Date.now()}`,
        name = 'RocKontrol Media',
        mode = 'video',
        file = null,
        pattern = 'gradient',
        ndi_source = null,
        color = '0,0,0',
        width = 1920,
        height = 1080,
        fps = 30.0,
        loop = true,
        blend = { left: 0, right: 0, top: 0, bottom: 0 }
    } = config;

    if (streams.has(id)) {
        throw new Error(`Stream ${id} already exists`);
    }

    const args = [
        '--name', name,
        '--mode', mode,
        '--width', width.toString(),
        '--height', height.toString(),
        '--fps', fps.toString(),
        loop ? '--loop' : '--no-loop',
        '--blend-left', blend.left.toString(),
        '--blend-right', blend.right.toString(),
        '--blend-top', blend.top.toString(),
        '--blend-bottom', blend.bottom.toString()
    ];

    if (mode === 'video' && file) {
        args.push('--file', file);
    } else if (mode === 'pattern' || mode === 'grid') {
        args.push('--pattern', pattern);
    } else if (mode === 'ndi_source' && ndi_source) {
        args.push('--ndi-source', ndi_source);
    } else if (mode === 'blank') {
        args.push('--color', color);
    }

    const logFile = path.join(LOGS_DIR, `${id}.log`);
    const logStream = fs.createWriteStream(logFile, { flags: 'a' });

    const process = spawn(SENDER_BIN, args);

    const streamData = {
        id,
        name,
        mode,
        file,
        pattern,
        state: 'running',
        process,
        logFile,
        settings: { width, height, fps, loop, blend },
        startTime: new Date().toISOString()
    };

    streams.set(id, streamData);

    process.stdout.on('data', (data) => {
        console.log(`[${id}] ${data}`);
        logStream.write(`${new Date().toISOString()} [stdout] ${data}`);
    });

    process.stderr.on('data', (data) => {
        console.error(`[${id}] ${data}`);
        logStream.write(`${new Date().toISOString()} [stderr] ${data}`);
    });

    process.on('close', (code) => {
        console.log(`[${id}] Process exited with code ${code}`);
        logStream.write(`${new Date().toISOString()} Process exited with code ${code}\n`);
        logStream.end();

        const stream = streams.get(id);
        if (stream) {
            stream.state = 'stopped';
            stream.exitCode = code;

            // Remove from streams Map after 5 seconds
            setTimeout(() => {
                streams.delete(id);
                console.log(`[${id}] Removed from streams list`);
            }, 5000);

            broadcast({ type: 'stream_stopped', id, code });
        }
    });

    broadcast({
        type: 'stream_started',
        stream: {
            id,
            name,
            mode,
            file,
            pattern,
            state: 'running',
            settings: streamData.settings
        }
    });

    return streamData;
}

function stopStream(id) {
    const stream = streams.get(id);
    if (!stream) {
        throw new Error(`Stream ${id} not found`);
    }

    if (stream.process && !stream.process.killed) {
        stream.process.kill('SIGTERM');
        stream.state = 'stopping';
        broadcast({ type: 'stream_stopping', id });

        // Force kill after 3 seconds if still running
        setTimeout(() => {
            if (stream.process && !stream.process.killed) {
                console.log(`[${id}] Force killing with SIGKILL`);
                try {
                    stream.process.kill('SIGKILL');
                } catch (err) {
                    console.error(`[${id}] Force kill failed:`, err);
                }
            }
        }, 3000);
    } else {
        // Process already dead, remove from streams
        console.log(`[${id}] Process already stopped, removing from list`);
        streams.delete(id);
        broadcast({ type: 'stream_stopped', id });
    }

    return stream;
}

function stopAllStreams() {
    const stopped = [];
    for (const [id, stream] of streams) {
        try {
            stopStream(id);
            stopped.push(id);
        } catch (err) {
            console.error(`Error stopping stream ${id}:`, err);
        }
    }
    return stopped;
}

// REST API Routes

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});

// Get all streams
app.get('/api/streams', (req, res) => {
    const streamList = Array.from(streams.entries()).map(([id, stream]) => ({
        id,
        name: stream.name,
        mode: stream.mode,
        state: stream.state,
        file: stream.file,
        pattern: stream.pattern,
        settings: stream.settings,
        startTime: stream.startTime
    }));
    res.json({ streams: streamList });
});

// Get specific stream
app.get('/api/streams/:id', (req, res) => {
    const stream = streams.get(req.params.id);
    if (!stream) {
        return res.status(404).json({ error: 'Stream not found' });
    }

    res.json({
        id: req.params.id,
        name: stream.name,
        mode: stream.mode,
        state: stream.state,
        file: stream.file,
        pattern: stream.pattern,
        settings: stream.settings,
        startTime: stream.startTime
    });
});

// Start a new stream
app.post('/api/streams', (req, res) => {
    try {
        const stream = startStream(req.body);
        res.json({
            success: true,
            stream: {
                id: stream.id,
                name: stream.name,
                mode: stream.mode,
                state: stream.state
            }
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Stop a stream
app.delete('/api/streams/:id', (req, res) => {
    try {
        const stream = stopStream(req.params.id);
        res.json({ success: true, id: req.params.id, state: stream.state });
    } catch (err) {
        res.status(404).json({ error: err.message });
    }
});

// Stop all streams
app.delete('/api/streams', (req, res) => {
    const stopped = stopAllStreams();
    res.json({ success: true, stopped });
});

// NDI Discovery
app.get('/api/ndi/discover', (req, res) => {
    const { execFile } = require('child_process');
    const discoverBin = path.join(BIN_DIR, 'ndi_discover');

    execFile(discoverBin, [], { timeout: 10000 }, (error, stdout, stderr) => {
        if (error) {
            console.error('NDI discovery error:', error);
            return res.status(500).json({ error: 'NDI discovery failed', sources: [] });
        }

        try {
            const sources = JSON.parse(stdout);
            res.json({ sources });
        } catch (err) {
            console.error('Failed to parse NDI sources:', err);
            res.json({ sources: [] });
        }
    });
});

// Video library management

// List videos
app.get('/api/videos', (req, res) => {
    try {
        const files = fs.readdirSync(MEDIA_DIR)
            .filter(f => /\.(mov|mp4|avi|mkv|m4v)$/i.test(f))
            .map(filename => {
                const filepath = path.join(MEDIA_DIR, filename);
                const stats = fs.statSync(filepath);
                return {
                    filename,
                    path: filepath,
                    size: stats.size,
                    modified: stats.mtime
                };
            });
        res.json({ videos: files });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Upload video
app.post('/api/videos/upload', upload.single('video'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    res.json({
        success: true,
        file: {
            filename: req.file.filename,
            path: req.file.path,
            size: req.file.size
        }
    });
});

// Delete video
app.delete('/api/videos/:filename', (req, res) => {
    try {
        const filepath = path.join(MEDIA_DIR, req.params.filename);
        if (!filepath.startsWith(MEDIA_DIR)) {
            return res.status(403).json({ error: 'Invalid path' });
        }

        fs.unlinkSync(filepath);
        res.json({ success: true });
    } catch (err) {
        res.status(404).json({ error: err.message });
    }
});

// Playlist management

// List playlists
app.get('/api/playlists', (req, res) => {
    try {
        const files = fs.readdirSync(PLAYLISTS_DIR)
            .filter(f => f.endsWith('.json'))
            .map(filename => {
                const filepath = path.join(PLAYLISTS_DIR, filename);
                const content = JSON.parse(fs.readFileSync(filepath, 'utf8'));
                return {
                    filename,
                    name: content.name,
                    items: content.items.length
                };
            });
        res.json({ playlists: files });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get playlist
app.get('/api/playlists/:name', (req, res) => {
    try {
        const filepath = path.join(PLAYLISTS_DIR, `${req.params.name}.json`);
        const content = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        res.json(content);
    } catch (err) {
        res.status(404).json({ error: 'Playlist not found' });
    }
});

// Save playlist
app.post('/api/playlists', (req, res) => {
    try {
        const { name, items } = req.body;
        if (!name || !items) {
            return res.status(400).json({ error: 'Missing name or items' });
        }

        const filepath = path.join(PLAYLISTS_DIR, `${name}.json`);
        fs.writeFileSync(filepath, JSON.stringify({ name, items }, null, 2));
        res.json({ success: true, name });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete playlist
app.delete('/api/playlists/:name', (req, res) => {
    try {
        const filepath = path.join(PLAYLISTS_DIR, `${req.params.name}.json`);
        fs.unlinkSync(filepath);
        res.json({ success: true });
    } catch (err) {
        res.status(404).json({ error: err.message });
    }
});

// Get logs
app.get('/api/logs/:streamId', (req, res) => {
    try {
        const logFile = path.join(LOGS_DIR, `${req.params.streamId}.log`);
        const content = fs.readFileSync(logFile, 'utf8');
        res.type('text/plain').send(content);
    } catch (err) {
        res.status(404).json({ error: 'Log file not found' });
    }
});

// Start server
const server = app.listen(PORT, HOST, () => {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║         RocKontrol Media Server                                ║
║                                                                ║
║  Server running on: http://${HOST}:${PORT}                    ║
║  Media directory:   ${MEDIA_DIR}                              ║
║  Native sender:     ${SENDER_BIN}                              ║
║                                                                ║
║  REST API:          http://${HOST}:${PORT}/api                 ║
║  WebSocket:         ws://${HOST}:${PORT}                       ║
╚════════════════════════════════════════════════════════════════╝
    `);
});

// WebSocket upgrade
server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...');
    stopAllStreams();
    setTimeout(() => {
        server.close(() => {
            console.log('Server closed');
            process.exit(0);
        });
    }, 1000);
});
