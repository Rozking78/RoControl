const { listStreamDecks, openStreamDeck } = require('@elgato-stream-deck/node');
const { createCanvas } = require('canvas');
const axios = require('axios');

// Configuration
const API_BASE = process.env.API_BASE || 'http://localhost:4455';
const POLL_INTERVAL = 1000; // Poll server every second for status updates

// Button layout configuration
const BUTTONS = {
    // Row 1: Test Patterns
    0: { type: 'pattern', name: 'SMPTE Bars', pattern: 'smpte', color: '#FF6B6B' },
    1: { type: 'pattern', name: 'Test Grid', pattern: 'grid', color: '#4ECDC4' },
    2: { type: 'pattern', name: 'Gradient', pattern: 'gradient', color: '#45B7D1' },
    3: { type: 'pattern', name: 'Checkerboard', pattern: 'checkerboard', color: '#96CEB4' },
    4: { type: 'action', name: 'Stop All', action: 'stop_all', color: '#FF4757' },

    // Row 2: Video Controls (will be populated dynamically from library)
    5: { type: 'video', slot: 0, color: '#9B59B6' },
    6: { type: 'video', slot: 1, color: '#9B59B6' },
    7: { type: 'video', slot: 2, color: '#9B59B6' },
    8: { type: 'video', slot: 3, color: '#9B59B6' },
    9: { type: 'action', name: 'Refresh', action: 'refresh', color: '#3498DB' },

    // Row 3: Playlists and advanced controls
    10: { type: 'info', name: 'Server Status', color: '#2C3E50' },
    11: { type: 'resolution', name: '1080p', width: 1920, height: 1080, color: '#34495E' },
    12: { type: 'resolution', name: '720p', width: 1280, height: 720, color: '#34495E' },
    13: { type: 'resolution', name: '4K', width: 3840, height: 2160, color: '#34495E' },
    14: { type: 'action', name: 'Settings', action: 'open_ui', color: '#7F8C8D' }
};

let streamDeck = null;
let activeStreams = [];
let videoLibrary = [];
let currentResolution = { width: 1920, height: 1080 };

// API Functions
async function api(endpoint, options = {}) {
    try {
        const response = await axios({
            method: options.method || 'GET',
            url: `${API_BASE}${endpoint}`,
            data: options.body,
            headers: { 'Content-Type': 'application/json' },
            ...options
        });
        return response.data;
    } catch (err) {
        console.error(`API Error (${endpoint}):`, err.message);
        return null;
    }
}

async function getStreams() {
    const data = await api('/api/streams');
    return data ? data.streams : [];
}

async function getVideos() {
    const data = await api('/api/videos');
    return data ? data.videos : [];
}

async function startStream(config) {
    return await api('/api/streams', {
        method: 'POST',
        body: config
    });
}

async function stopStream(id) {
    return await api(`/api/streams/${id}`, { method: 'DELETE' });
}

async function stopAllStreams() {
    return await api('/api/streams', { method: 'DELETE' });
}

// Canvas/Drawing Functions
function createButton(text, bgColor, isActive = false) {
    const canvas = createCanvas(72, 72);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = isActive ? '#00FF00' : bgColor;
    ctx.fillRect(0, 0, 72, 72);

    // Active indicator
    if (isActive) {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, 68, 68);
    }

    // Text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Word wrap
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        const testLine = currentLine + ' ' + words[i];
        const metrics = ctx.measureText(testLine);
        if (metrics.width > 65) {
            lines.push(currentLine);
            currentLine = words[i];
        } else {
            currentLine = testLine;
        }
    }
    lines.push(currentLine);

    // Draw lines
    const lineHeight = 12;
    const startY = 36 - ((lines.length - 1) * lineHeight / 2);
    lines.forEach((line, i) => {
        ctx.fillText(line, 36, startY + (i * lineHeight));
    });

    return canvas.toBuffer('image/jpeg');
}

function createInfoButton(line1, line2, bgColor = '#2C3E50') {
    const canvas = createCanvas(72, 72);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, 72, 72);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 9px Arial';
    ctx.textAlign = 'center';

    ctx.fillText(line1, 36, 28);
    ctx.font = 'bold 12px Arial';
    ctx.fillText(line2, 36, 46);

    return canvas.toBuffer('image/jpeg');
}

// Button Update Functions
async function updateButton(keyIndex) {
    if (!streamDeck) return;

    const button = BUTTONS[keyIndex];
    if (!button) return;

    let image;

    switch (button.type) {
        case 'pattern':
            const isPatternActive = activeStreams.some(s => s.mode === 'pattern' && s.pattern === button.pattern);
            image = createButton(button.name, button.color, isPatternActive);
            break;

        case 'video':
            if (videoLibrary[button.slot]) {
                const video = videoLibrary[button.slot];
                const filename = video.filename.split('.')[0].substring(0, 20);
                const isVideoActive = activeStreams.some(s => s.file === video.path);
                image = createButton(filename, button.color, isVideoActive);
            } else {
                image = createButton('Empty', '#555555', false);
            }
            break;

        case 'action':
            image = createButton(button.name, button.color, false);
            break;

        case 'resolution':
            const isSelected = currentResolution.width === button.width && currentResolution.height === button.height;
            image = createButton(button.name, button.color, isSelected);
            break;

        case 'info':
            const streamCount = activeStreams.length;
            image = createInfoButton('Active', `${streamCount} stream${streamCount !== 1 ? 's' : ''}`, button.color);
            break;
    }

    if (image) {
        streamDeck.fillKeyBuffer(keyIndex, image);
    }
}

async function updateAllButtons() {
    for (let i = 0; i < 15; i++) {
        await updateButton(i);
    }
}

// Button Press Handlers
async function handleButtonPress(keyIndex) {
    const button = BUTTONS[keyIndex];
    if (!button) return;

    console.log(`Button ${keyIndex} pressed:`, button.name || button.type);

    switch (button.type) {
        case 'pattern':
            // Check if pattern is already active
            const existingPattern = activeStreams.find(s => s.mode === 'pattern' && s.pattern === button.pattern);
            if (existingPattern) {
                console.log(`Stopping ${button.name}...`);
                await stopStream(existingPattern.id);
            } else {
                console.log(`Starting ${button.name}...`);
                await startStream({
                    name: button.name,
                    mode: 'pattern',
                    pattern: button.pattern,
                    width: currentResolution.width,
                    height: currentResolution.height,
                    fps: 30
                });
            }
            break;

        case 'video':
            if (videoLibrary[button.slot]) {
                const video = videoLibrary[button.slot];
                const existingVideo = activeStreams.find(s => s.file === video.path);

                if (existingVideo) {
                    console.log(`Stopping ${video.filename}...`);
                    await stopStream(existingVideo.id);
                } else {
                    console.log(`Starting ${video.filename}...`);
                    await startStream({
                        name: video.filename.split('.')[0],
                        mode: 'video',
                        file: video.path,
                        width: currentResolution.width,
                        height: currentResolution.height,
                        fps: 30,
                        loop: true
                    });
                }
            }
            break;

        case 'action':
            switch (button.action) {
                case 'stop_all':
                    console.log('Stopping all streams...');
                    await stopAllStreams();
                    break;
                case 'refresh':
                    console.log('Refreshing...');
                    await loadData();
                    break;
                case 'open_ui':
                    console.log('Opening web UI...');
                    require('child_process').exec(`open http://localhost:4455`);
                    break;
            }
            break;

        case 'resolution':
            currentResolution = { width: button.width, height: button.height };
            console.log(`Resolution set to ${button.name}`);
            await updateAllButtons();
            break;
    }

    // Refresh status after a short delay
    setTimeout(loadData, 500);
}

// Data Loading
async function loadData() {
    activeStreams = await getStreams();
    const videos = await getVideos();

    // Take first 4 videos for quick access
    videoLibrary = videos.slice(0, 4);

    await updateAllButtons();
}

// Main
async function main() {
    console.log('🎛️  RocKontrol Stream Deck Controller');
    console.log('=====================================');

    // Find Stream Deck devices
    const devices = listStreamDecks();

    if (devices.length === 0) {
        console.error('No Stream Deck devices found!');
        console.log('Make sure your Stream Deck is connected via USB.');
        process.exit(1);
    }

    console.log(`Found ${devices.length} Stream Deck device(s):`);
    devices.forEach((device, i) => {
        console.log(`  ${i + 1}. ${device.model} (${device.serialNumber || 'no serial'})`);
    });

    // Open first device
    try {
        streamDeck = openStreamDeck(devices[0].path);
        console.log(`\nConnected to ${streamDeck.PRODUCT_NAME}`);
        console.log(`Keys: ${streamDeck.NUM_KEYS}`);
        console.log(`Key size: ${streamDeck.KEY_PIXEL_SIZE}x${streamDeck.KEY_PIXEL_SIZE}px`);
    } catch (err) {
        console.error('Failed to open Stream Deck:', err.message);
        process.exit(1);
    }

    // Test connection to media server
    console.log(`\nConnecting to media server at ${API_BASE}...`);
    const health = await api('/health');
    if (!health) {
        console.error('Failed to connect to media server!');
        console.log('Make sure the server is running on port 4455.');
        process.exit(1);
    }
    console.log('✓ Connected to media server');

    // Set brightness
    streamDeck.setBrightness(80);

    // Clear all buttons
    streamDeck.clearPanel();

    // Load initial data
    await loadData();

    // Set up button press handler
    streamDeck.on('down', (keyIndex) => {
        handleButtonPress(keyIndex);
    });

    // Set up periodic status polling
    setInterval(async () => {
        activeStreams = await getStreams();
        await updateAllButtons();
    }, POLL_INTERVAL);

    console.log('\n✓ Stream Deck controller ready!');
    console.log('Press Ctrl+C to exit.\n');

    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\nShutting down...');
        if (streamDeck) {
            streamDeck.clearPanel();
            streamDeck.close();
        }
        process.exit(0);
    });
}

main().catch(console.error);
