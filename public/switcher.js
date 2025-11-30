/**
 * RocKontrol Video Switcher - Web UI
 *
 * Real-time video switcher control interface
 */

// State
let state = {
  program: 'black',
  preview: 1,
  transitionType: 'cut',
  transitionDuration: 1000,
  ftbActive: false,
  inputs: [],
  outputs: []
};

// WebSocket connection
let ws = null;
let reconnectTimer = null;

// ==================== WEBSOCKET ====================

function connect() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}`;

  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log('WebSocket connected');
    updateConnectionStatus(true);

    // Subscribe to switcher events
    ws.send(JSON.stringify({
      type: 'subscribe',
      data: { events: ['state', 'switcher', '*'] }
    }));

    // Request initial state
    ws.send(JSON.stringify({ type: 'getState' }));
    ws.send(JSON.stringify({ type: 'command', data: { command: 'switcher status' } }));
  };

  ws.onclose = () => {
    console.log('WebSocket disconnected');
    updateConnectionStatus(false);

    // Reconnect after 2 seconds
    reconnectTimer = setTimeout(connect, 2000);
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  ws.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      handleMessage(message);
    } catch (e) {
      console.error('Failed to parse message:', e);
    }
  };
}

function handleMessage(message) {
  const { type, data } = message;

  switch (type) {
    case 'connected':
      console.log('Server says:', data.message);
      break;

    case 'state':
    case 'switcher:state':
      if (data.switcher) {
        updateState(data.switcher);
      } else if (data.program !== undefined) {
        updateState(data);
      }
      break;

    case 'command:response':
      if (data.data) {
        updateState(data.data);
      }
      break;

    case 'switcher:cut':
    case 'switcher:transition_complete':
      state.program = data.program;
      state.preview = data.preview;
      updateUI();
      break;

    case 'switcher:preview_changed':
      state.preview = data.inputId;
      updateUI();
      break;

    case 'switcher:program_changed':
      state.program = data.program;
      state.preview = data.preview;
      updateUI();
      break;

    case 'switcher:transition_progress':
      updateTransitionProgress(data.progress);
      break;

    case 'switcher:ftb':
      state.ftbActive = data.active;
      updateFTBStatus();
      break;

    case 'switcher:input_changed':
      const inputIdx = state.inputs.findIndex(i => i.id === data.inputId);
      if (inputIdx >= 0) {
        state.inputs[inputIdx] = data.input;
      }
      renderInputs();
      break;
  }
}

function updateState(newState) {
  if (newState.program !== undefined) state.program = newState.program;
  if (newState.preview !== undefined) state.preview = newState.preview;
  if (newState.transitionType) state.transitionType = newState.transitionType;
  if (newState.transitionDuration) state.transitionDuration = newState.transitionDuration;
  if (newState.ftbActive !== undefined) state.ftbActive = newState.ftbActive;
  if (newState.inputs) state.inputs = newState.inputs;
  if (newState.outputs) state.outputs = newState.outputs;

  updateUI();
}

function updateConnectionStatus(connected) {
  const statusEl = document.getElementById('connectionStatus');
  const dot = statusEl.querySelector('.status-dot');
  const text = statusEl.querySelector('.status-text');

  if (connected) {
    dot.classList.add('connected');
    text.textContent = 'Connected';
  } else {
    dot.classList.remove('connected');
    text.textContent = 'Disconnected';
  }
}

// ==================== COMMANDS ====================

function sendCommand(command) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'command',
      data: { command }
    }));
  } else {
    console.warn('WebSocket not connected');
  }
}

function executeCut() {
  sendCommand('cut');
  // Optimistic update
  const temp = state.program;
  state.program = state.preview;
  state.preview = temp;
  updateUI();
}

function executeAuto() {
  sendCommand('auto');
}

function executeFTB() {
  sendCommand('ftb');
  state.ftbActive = !state.ftbActive;
  updateFTBStatus();
}

function setPreview(inputId) {
  sendCommand(`preview ${inputId}`);
  state.preview = inputId;
  updateUI();
}

function setProgram(inputId) {
  sendCommand(`program ${inputId}`);
  state.program = inputId;
  updateUI();
}

function setTransitionType(type) {
  sendCommand(`transition ${type}`);
  state.transitionType = type;
  updateTransitionTypeUI();
}

function setTransitionTime(ms) {
  sendCommand(`transition time ${ms}`);
  state.transitionDuration = parseInt(ms);
  updateDurationUI();
}

function handleTBar(value) {
  const position = value / 100;
  sendCommand(`tbar ${position}`);
}

function loadInput(inputId) {
  document.getElementById('loadInputId').value = inputId;
  document.getElementById('sourcePath').value = '';
  document.getElementById('inputName').value = `Input ${inputId}`;
  document.getElementById('loadInputModal').classList.add('show');
}

function closeModal() {
  document.getElementById('loadInputModal').classList.remove('show');
}

function confirmLoadInput() {
  const inputId = document.getElementById('loadInputId').value;
  const sourcePath = document.getElementById('sourcePath').value;
  const inputName = document.getElementById('inputName').value;

  if (sourcePath) {
    sendCommand(`input ${inputId} ${sourcePath}`);
  }

  closeModal();
}

function setOutputBus(outputId, bus) {
  // This would require extending the CLI
  console.log(`Set output ${outputId} to ${bus}`);
}

// ==================== UI UPDATES ====================

function updateUI() {
  updateMonitors();
  renderInputs();
  renderOutputs();
  updateTransitionTypeUI();
  updateDurationUI();
  updateFTBStatus();
  updateFooterStatus();
}

function updateMonitors() {
  const previewIndicator = document.getElementById('previewIndicator');
  const programIndicator = document.getElementById('programIndicator');
  const previewScreen = document.getElementById('previewScreen');
  const programScreen = document.getElementById('programScreen');

  // Find input names
  const previewInput = state.inputs.find(i => i.id === state.preview) || { name: `Input ${state.preview}` };
  const programInput = state.inputs.find(i => i.id === state.program) || { name: state.program === 'black' ? 'Black' : `Input ${state.program}` };

  previewIndicator.textContent = previewInput.name;
  programIndicator.textContent = programInput.name;

  // Update screen backgrounds based on input
  if (state.program === 'black') {
    programScreen.style.background = '#000';
  } else {
    programScreen.style.background = 'linear-gradient(135deg, #111 0%, #222 100%)';
  }
}

function renderInputs() {
  const grid = document.getElementById('inputsGrid');
  grid.innerHTML = '';

  // Create 8 input buttons
  for (let i = 1; i <= 8; i++) {
    const input = state.inputs.find(inp => inp.id === i) || {
      id: i,
      name: `Input ${i}`,
      connected: false
    };

    const isPreview = state.preview === i;
    const isProgram = state.program === i;

    const btn = document.createElement('div');
    btn.className = `input-btn ${isPreview ? 'preview' : ''} ${isProgram ? 'program' : ''}`;
    btn.innerHTML = `
      <span class="input-status ${input.connected ? 'connected' : ''}"></span>
      <span class="input-number">${i}</span>
      <span class="input-name">${input.name}</span>
      <button class="load-btn" onclick="event.stopPropagation(); loadInput(${i})">+</button>
    `;

    btn.onclick = () => {
      if (event.shiftKey) {
        // Shift+click = direct to program
        setProgram(i);
      } else {
        // Normal click = set preview
        setPreview(i);
      }
    };

    btn.ondblclick = () => {
      // Double-click = preview and cut
      setPreview(i);
      setTimeout(executeCut, 50);
    };

    grid.appendChild(btn);
  }

  // Add special inputs (Black, Bars)
  const specialInputs = [
    { id: 'black', name: 'BLACK', connected: true },
    { id: 'bars', name: 'BARS', connected: true }
  ];

  specialInputs.forEach(input => {
    const isPreview = state.preview === input.id;
    const isProgram = state.program === input.id;

    const btn = document.createElement('div');
    btn.className = `input-btn ${isPreview ? 'preview' : ''} ${isProgram ? 'program' : ''}`;
    btn.style.background = input.id === 'black' ? '#000' : 'linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)';
    btn.innerHTML = `
      <span class="input-name" style="color: ${input.id === 'black' ? '#666' : '#000'}">${input.name}</span>
    `;

    btn.onclick = () => setPreview(input.id);
    btn.ondblclick = () => {
      setPreview(input.id);
      setTimeout(executeCut, 50);
    };

    grid.appendChild(btn);
  });
}

function renderOutputs() {
  const grid = document.getElementById('outputsGrid');
  grid.innerHTML = '';

  const outputs = state.outputs.length ? state.outputs : [
    { id: 1, name: 'Output 1', bus: 'program', streaming: true },
    { id: 2, name: 'Output 2', bus: 'program', streaming: false },
    { id: 3, name: 'Output 3', bus: 'preview', streaming: false },
    { id: 4, name: 'Output 4', bus: 'aux', streaming: false }
  ];

  outputs.forEach(output => {
    const card = document.createElement('div');
    card.className = `output-card ${output.streaming ? 'streaming' : ''}`;
    card.innerHTML = `
      <div class="output-name">${output.name}</div>
      <div class="output-source">Source: ${output.bus}</div>
      <div class="output-bus">
        <select onchange="setOutputBus(${output.id}, this.value)">
          <option value="program" ${output.bus === 'program' ? 'selected' : ''}>Program</option>
          <option value="preview" ${output.bus === 'preview' ? 'selected' : ''}>Preview</option>
          <option value="clean" ${output.bus === 'clean' ? 'selected' : ''}>Clean Feed</option>
          <option value="aux" ${output.bus === 'aux' ? 'selected' : ''}>Aux</option>
        </select>
      </div>
    `;
    grid.appendChild(card);
  });
}

function updateTransitionTypeUI() {
  document.querySelectorAll('.type-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === state.transitionType);
  });
  document.getElementById('transitionStatus').textContent = state.transitionType;
}

function updateDurationUI() {
  document.querySelectorAll('.dur-btn').forEach(btn => {
    const btnTime = parseInt(btn.textContent) * 1000;
    btn.classList.toggle('active', btnTime === state.transitionDuration);
  });
  document.getElementById('customDuration').value = state.transitionDuration;
  document.getElementById('durationStatus').textContent = `${state.transitionDuration}ms`;
}

function updateFTBStatus() {
  const ftbBtn = document.getElementById('ftbBtn');
  const ftbStatus = document.getElementById('ftbStatus');
  const onAirTally = document.getElementById('onAirTally');

  ftbBtn.classList.toggle('active', state.ftbActive);
  ftbStatus.textContent = state.ftbActive ? 'ACTIVE' : 'Off';

  if (state.ftbActive) {
    onAirTally.classList.add('hidden');
  } else {
    onAirTally.classList.remove('hidden');
  }
}

function updateTransitionProgress(progress) {
  const autoBtn = document.getElementById('autoBtn');
  if (progress > 0 && progress < 1) {
    autoBtn.style.background = `linear-gradient(to right, #44cc44 ${progress * 100}%, #cccc00 ${progress * 100}%)`;
  } else {
    autoBtn.style.background = '';
  }
}

function updateFooterStatus() {
  document.getElementById('transitionStatus').textContent = state.transitionType;
  document.getElementById('durationStatus').textContent = `${state.transitionDuration}ms`;
  document.getElementById('ftbStatus').textContent = state.ftbActive ? 'ACTIVE' : 'Off';
}

// ==================== KEYBOARD SHORTCUTS ====================

document.addEventListener('keydown', (e) => {
  // Don't trigger if typing in input field
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

  switch (e.key) {
    case '1':
    case '2':
    case '3':
    case '4':
    case '5':
    case '6':
    case '7':
    case '8':
      if (e.shiftKey) {
        setProgram(parseInt(e.key));
      } else {
        setPreview(parseInt(e.key));
      }
      break;

    case 'Enter':
    case ' ':
      e.preventDefault();
      executeCut();
      break;

    case 'a':
    case 'A':
      executeAuto();
      break;

    case 'f':
    case 'F':
      executeFTB();
      break;

    case 'b':
    case 'B':
      setPreview('black');
      break;

    case 'Escape':
      closeModal();
      break;
  }
});

// ==================== INITIALIZATION ====================

function init() {
  // Initialize with default inputs
  state.inputs = [];
  for (let i = 1; i <= 8; i++) {
    state.inputs.push({
      id: i,
      name: `Input ${i}`,
      connected: false
    });
  }

  // Render initial UI
  updateUI();

  // Connect to WebSocket
  connect();
}

// Start on load
window.addEventListener('load', init);
