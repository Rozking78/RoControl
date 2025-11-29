const API_BASE = window.location.origin;
const WS_URL = `ws://${window.location.host}`;

let ws = null;
let reconnectTimer = null;

// API Functions
async function api(endpoint, options = {}) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Request failed');
    }

    return response.json();
}

// WebSocket Connection
function connectWebSocket() {
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
        console.log('WebSocket connected');
        updateConnectionStatus(true);
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
    };

    ws.onclose = () => {
        console.log('WebSocket disconnected');
        updateConnectionStatus(false);
        reconnectTimer = setTimeout(connectWebSocket, 3000);
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
}

function handleWebSocketMessage(data) {
    switch (data.type) {
        case 'streams_update':
            renderStreams(data.streams);
            break;
        case 'stream_started':
            loadStreams();
            showNotification(`Stream "${data.stream.name}" started`, 'success');
            break;
        case 'stream_stopped':
            loadStreams();
            showNotification(`Stream stopped`, 'info');
            break;
        case 'stream_stopping':
            loadStreams();
            break;
    }
}

function updateConnectionStatus(connected) {
    const indicator = document.getElementById('connection-status');
    indicator.className = `status-indicator ${connected ? '' : 'disconnected'}`;
}

// Stream Management
async function loadStreams() {
    try {
        const data = await api('/api/streams');
        renderStreams(data.streams);
    } catch (err) {
        console.error('Failed to load streams:', err);
    }
}

function renderStreams(streams) {
    const container = document.getElementById('streams-list');
    const countEl = document.getElementById('stream-count');

    countEl.textContent = `${streams.length} stream${streams.length !== 1 ? 's' : ''} active`;

    if (streams.length === 0) {
        container.innerHTML = '<p class="empty-state">No active streams</p>';
        return;
    }

    container.innerHTML = streams.map(stream => `
        <div class="stream-item">
            <div class="stream-info">
                <h3>${stream.name}</h3>
                <div class="stream-details">
                    <span class="stream-badge ${stream.state}">${stream.state}</span>
                    <span>Mode: ${stream.mode}</span>
                    ${stream.file ? `<span>File: ${stream.file.split('/').pop()}</span>` : ''}
                    ${stream.pattern ? `<span>Pattern: ${stream.pattern}</span>` : ''}
                    <span>${stream.settings.width}x${stream.settings.height} @ ${stream.settings.fps}fps</span>
                </div>
            </div>
            <div class="stream-actions">
                <button class="btn btn-danger" onclick="stopStream('${stream.id}')">Stop</button>
            </div>
        </div>
    `).join('');
}

async function startStream(config) {
    try {
        await api('/api/streams', {
            method: 'POST',
            body: JSON.stringify(config)
        });
        showNotification('Stream started successfully', 'success');
    } catch (err) {
        showNotification(`Failed to start stream: ${err.message}`, 'error');
    }
}

async function stopStream(id) {
    try {
        await api(`/api/streams/${id}`, { method: 'DELETE' });
        showNotification('Stream stopped', 'success');
    } catch (err) {
        showNotification(`Failed to stop stream: ${err.message}`, 'error');
    }
}

// Video Library
async function loadVideos() {
    try {
        const data = await api('/api/videos');
        renderVideos(data.videos);
        updateVideoSelect(data.videos);
    } catch (err) {
        console.error('Failed to load videos:', err);
    }
}

function renderVideos(videos) {
    const container = document.getElementById('videos-list');

    if (videos.length === 0) {
        container.innerHTML = '<p class="empty-state">No videos in library</p>';
        return;
    }

    container.innerHTML = videos.map(video => `
        <div class="video-item">
            <div class="video-info">
                <div class="video-name">${video.filename}</div>
                <div class="video-meta">
                    ${formatBytes(video.size)} • Modified: ${new Date(video.modified).toLocaleDateString()}
                </div>
            </div>
            <div class="video-actions">
                <button class="btn btn-danger" onclick="deleteVideo('${video.filename}')">Delete</button>
            </div>
        </div>
    `).join('');
}

function updateVideoSelect(videos) {
    const select = document.getElementById('video-file');
    select.innerHTML = '<option value="">Select video...</option>' +
        videos.map(v => `<option value="${v.path}">${v.filename}</option>`).join('');
}

async function uploadVideo(file) {
    const formData = new FormData();
    formData.append('video', file);

    try {
        const response = await fetch(`${API_BASE}/api/videos/upload`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error('Upload failed');

        showNotification('Video uploaded successfully', 'success');
        loadVideos();
    } catch (err) {
        showNotification(`Upload failed: ${err.message}`, 'error');
    }
}

async function deleteVideo(filename) {
    if (!confirm(`Delete ${filename}?`)) return;

    try {
        await api(`/api/videos/${filename}`, { method: 'DELETE' });
        showNotification('Video deleted', 'success');
        loadVideos();
    } catch (err) {
        showNotification(`Failed to delete: ${err.message}`, 'error');
    }
}

// Playlists
async function loadPlaylists() {
    try {
        const data = await api('/api/playlists');
        renderPlaylists(data.playlists);
    } catch (err) {
        console.error('Failed to load playlists:', err);
    }
}

function renderPlaylists(playlists) {
    const container = document.getElementById('playlists-list');

    if (playlists.length === 0) {
        container.innerHTML = '<p class="empty-state">No playlists</p>';
        return;
    }

    container.innerHTML = playlists.map(playlist => `
        <div class="playlist-item">
            <div class="playlist-info">
                <div class="playlist-name">${playlist.name}</div>
                <div class="playlist-meta">${playlist.items} items</div>
            </div>
            <div class="playlist-actions">
                <button class="btn" onclick="loadPlaylist('${playlist.filename}')">Load</button>
                <button class="btn btn-danger" onclick="deletePlaylist('${playlist.filename}')">Delete</button>
            </div>
        </div>
    `).join('');
}

async function createPlaylist(name) {
    try {
        await api('/api/playlists', {
            method: 'POST',
            body: JSON.stringify({ name, items: [] })
        });
        showNotification('Playlist created', 'success');
        loadPlaylists();
    } catch (err) {
        showNotification(`Failed to create playlist: ${err.message}`, 'error');
    }
}

async function deletePlaylist(filename) {
    const name = filename.replace('.json', '');
    if (!confirm(`Delete playlist "${name}"?`)) return;

    try {
        await api(`/api/playlists/${name}`, { method: 'DELETE' });
        showNotification('Playlist deleted', 'success');
        loadPlaylists();
    } catch (err) {
        showNotification(`Failed to delete: ${err.message}`, 'error');
    }
}

// NDI Discovery
async function loadNDISources() {
    const select = document.getElementById('ndi-source-select');
    const refreshBtn = document.getElementById('refresh-ndi');

    select.innerHTML = '<option value="">Discovering NDI sources...</option>';
    select.disabled = true;
    refreshBtn.disabled = true;

    try {
        const data = await api('/api/ndi/discover');
        const sources = data.sources || [];

        if (sources.length === 0) {
            select.innerHTML = '<option value="">No NDI sources found</option>';
        } else {
            select.innerHTML = '<option value="">Select NDI source...</option>' +
                sources.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
        }
    } catch (err) {
        console.error('Failed to discover NDI sources:', err);
        select.innerHTML = '<option value="">Discovery failed - retry</option>';
    } finally {
        select.disabled = false;
        refreshBtn.disabled = false;
    }
}

// Utilities
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function showNotification(message, type = 'info') {
    console.log(`[${type}] ${message}`);
    // TODO: Implement toast notifications
}

// Event Handlers
document.getElementById('new-stream-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const mode = document.getElementById('stream-mode').value;
    const [width, height] = document.getElementById('resolution').value.split('x').map(Number);

    const config = {
        name: document.getElementById('stream-name').value,
        mode,
        width,
        height,
        fps: parseFloat(document.getElementById('fps').value),
        loop: document.getElementById('loop').checked,
        blend: {
            left: parseFloat(document.getElementById('blend-left').value) / 100,
            right: parseFloat(document.getElementById('blend-right').value) / 100,
            top: parseFloat(document.getElementById('blend-top').value) / 100,
            bottom: parseFloat(document.getElementById('blend-bottom').value) / 100
        }
    };

    if (mode === 'video') {
        const file = document.getElementById('video-file').value;
        if (!file) {
            showNotification('Please select a video file', 'error');
            return;
        }
        config.file = file;
    } else if (mode === 'ndi_source') {
        const ndiSource = document.getElementById('ndi-source-select').value.trim();
        if (!ndiSource) {
            showNotification('Please select an NDI source', 'error');
            return;
        }
        config.ndi_source = ndiSource;
    } else {
        config.pattern = document.getElementById('pattern-type').value;
    }

    await startStream(config);
});

document.getElementById('stream-mode').addEventListener('change', (e) => {
    const mode = e.target.value;
    document.getElementById('video-select-group').style.display = mode === 'video' ? 'block' : 'none';
    document.getElementById('pattern-select-group').style.display = (mode === 'pattern' || mode === 'grid') ? 'block' : 'none';
    document.getElementById('ndi-source-group').style.display = mode === 'ndi_source' ? 'block' : 'none';

    // Auto-discover NDI sources when mode is selected
    if (mode === 'ndi_source') {
        loadNDISources();
    }
});

document.getElementById('refresh-ndi').addEventListener('click', loadNDISources);

document.getElementById('upload-btn').addEventListener('click', () => {
    document.getElementById('file-input').click();
});

document.getElementById('file-input').addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        uploadVideo(e.target.files[0]);
    }
});

document.getElementById('refresh-videos').addEventListener('click', loadVideos);

document.getElementById('create-playlist').addEventListener('click', () => {
    const name = document.getElementById('playlist-name').value.trim();
    if (!name) {
        showNotification('Please enter a playlist name', 'error');
        return;
    }
    createPlaylist(name);
    document.getElementById('playlist-name').value = '';
});

// Blend slider value updates
['left', 'right', 'top', 'bottom'].forEach(edge => {
    const slider = document.getElementById(`blend-${edge}`);
    const label = document.getElementById(`blend-${edge}-val`);
    slider.addEventListener('input', (e) => {
        label.textContent = `${e.target.value}%`;
    });
});

// Initialize
connectWebSocket();
loadStreams();
loadVideos();
loadPlaylists();

// Periodic refresh
setInterval(loadStreams, 5000);
