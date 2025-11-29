import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/tauri'
import '../styles/TimeStateMonitor.css'

const TimeStateMonitor = () => {
  const [timeStates, setTimeStates] = useState([])
  const [timelines, setTimelines] = useState([])
  const [filter, setFilter] = useState('all') // all, playing, streams, playbacks

  useEffect(() => {
    // Connect to WebSocket time stream
    const ws = new WebSocket('ws://localhost:9000/ws/time')

    ws.onopen = () => {
      console.log('Time stream connected')
    }

    ws.onmessage = (event) => {
      try {
        const states = JSON.parse(event.data)
        setTimeStates(states)
      } catch (error) {
        console.error('Failed to parse time states:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    ws.onclose = () => {
      console.log('Time stream disconnected')
    }

    // Cleanup on unmount
    return () => {
      ws.close()
    }
  }, [])

  const loadTimeStates = async () => {
    try {
      const states = await invoke('get_all_time_states')
      setTimeStates(states)
    } catch (error) {
      console.error('Failed to load time states:', error)
    }
  }

  const loadTimelines = async () => {
    try {
      const tls = await invoke('get_all_timelines')
      setTimelines(tls)
    } catch (error) {
      console.error('Failed to load timelines:', error)
    }
  }

  const startState = async (id) => {
    try {
      await invoke('start_time_state', { id })
      await loadTimeStates()
    } catch (error) {
      console.error('Failed to start state:', error)
      alert(`Error: ${error}`)
    }
  }

  const pauseState = async (id) => {
    try {
      await invoke('pause_time_state', { id })
      await loadTimeStates()
    } catch (error) {
      console.error('Failed to pause state:', error)
    }
  }

  const stopState = async (id) => {
    try {
      await invoke('stop_time_state', { id })
      await loadTimeStates()
    } catch (error) {
      console.error('Failed to stop state:', error)
    }
  }

  const formatDuration = (ms) => {
    const totalSeconds = Math.floor(ms / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    }
    return `${minutes}:${String(seconds).padStart(2, '0')}`
  }

  const formatTimecode = (tc) => {
    if (!tc) return '--:--:--:--'
    return `${String(tc.hours).padStart(2, '0')}:${String(tc.minutes).padStart(2, '0')}:${String(tc.seconds).padStart(2, '0')}:${String(tc.frames).padStart(2, '0')}`
  }

  const getRunStateClass = (state) => {
    switch (state.run_state) {
      case 'playing': return 'state-playing'
      case 'paused': return 'state-paused'
      case 'stopped': return 'state-stopped'
      case 'cueing': return 'state-cueing'
      case 'error': return 'state-error'
      default: return ''
    }
  }

  const getHealthClass = (state) => {
    if (!state.is_alive) return 'health-dead'
    if (state.dropped_frames > state.frame_count * 0.05) return 'health-warning' // >5% drops
    if (state.latency_ms > 50) return 'health-warning'
    return 'health-good'
  }

  const getSourceTypeIcon = (type) => {
    const icons = {
      video_playback: '🎬',
      audio_playback: '🎵',
      ndi_stream: '📡',
      artnet_input: '🎭',
      sacn_input: '🌐',
      dmx_output: '💡',
      cue_list: '📋',
      executor: '▶️'
    }
    return icons[type] || '⏱️'
  }

  const filteredStates = timeStates.filter(state => {
    switch (filter) {
      case 'playing':
        return state.run_state === 'playing'
      case 'streams':
        return state.duration_type === 'indefinite'
      case 'playbacks':
        return state.duration_type?.finite
      default:
        return true
    }
  })

  return (
    <div className="time-state-monitor">
      <div className="monitor-header">
        <h2>⏱️ Time State Monitor</h2>
        <p className="header-subtitle">Real-time monitoring of all outputs, inputs, and playbacks</p>
      </div>

      {/* Filter Controls */}
      <div className="filter-controls">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({timeStates.length})
        </button>
        <button
          className={`filter-btn ${filter === 'playing' ? 'active' : ''}`}
          onClick={() => setFilter('playing')}
        >
          ▶️ Playing ({timeStates.filter(s => s.run_state === 'playing').length})
        </button>
        <button
          className={`filter-btn ${filter === 'streams' ? 'active' : ''}`}
          onClick={() => setFilter('streams')}
        >
          📡 Streams ({timeStates.filter(s => s.duration_type === 'indefinite').length})
        </button>
        <button
          className={`filter-btn ${filter === 'playbacks' ? 'active' : ''}`}
          onClick={() => setFilter('playbacks')}
        >
          🎬 Playbacks ({timeStates.filter(s => s.duration_type?.finite).length})
        </button>
      </div>

      {/* Time States Grid */}
      <div className="time-states-grid">
        {filteredStates.length === 0 ? (
          <div className="no-states">
            <p>No time states registered</p>
            <p className="hint">Start a playback or activate a stream to see it here</p>
          </div>
        ) : (
          filteredStates.map(state => (
            <div key={state.id} className={`time-state-card ${getRunStateClass(state)} ${getHealthClass(state)}`}>
              {/* Header */}
              <div className="state-header">
                <div className="state-title">
                  <span className="state-icon">{getSourceTypeIcon(state.source_type)}</span>
                  <h4>{state.name}</h4>
                </div>
                <span className={`run-state-badge ${state.run_state}`}>
                  {state.run_state.toUpperCase()}
                </span>
              </div>

              {/* Timecode */}
              {state.timecode && (
                <div className="timecode-display">
                  <span className="timecode-label">TC:</span>
                  <span className="timecode-value">{formatTimecode(state.timecode)}</span>
                  <span className="framerate-badge">{state.timecode.framerate}</span>
                </div>
              )}

              {/* Progress (for finite sources) */}
              {state.duration_type?.finite && (
                <div className="progress-section">
                  <div className="progress-bar-container">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${state.progress_percent}%` }}
                    />
                  </div>
                  <div className="progress-info">
                    <div className="time-display">
                      <span className="time-label">Elapsed:</span>
                      <span className="elapsed">{formatDuration(state.elapsed_ms)}</span>
                    </div>
                    <div className="time-display">
                      <span className="time-label">Remaining:</span>
                      <span className="remaining">
                        {formatDuration(state.duration_type.finite.duration_ms - state.elapsed_ms)}
                      </span>
                    </div>
                    <div className="time-display">
                      <span className="time-label">Total:</span>
                      <span className="duration">{formatDuration(state.duration_type.finite.duration_ms)}</span>
                    </div>
                  </div>
                  <div className="progress-percent-display">
                    {state.progress_percent.toFixed(1)}%
                  </div>
                </div>
              )}

              {/* Elapsed (for indefinite sources) */}
              {state.duration_type === 'indefinite' && (
                <div className="elapsed-section">
                  <span className="elapsed-label">Elapsed:</span>
                  <span className="elapsed-value">{formatDuration(state.elapsed_ms)}</span>
                  <span className="stream-indicator">● LIVE</span>
                </div>
              )}

              {/* Health Stats */}
              <div className="health-stats">
                <div className="stat-item">
                  <span className="stat-label">Frames:</span>
                  <span className="stat-value">{state.frame_count.toLocaleString()}</span>
                </div>
                {state.dropped_frames > 0 && (
                  <div className="stat-item warning">
                    <span className="stat-label">Drops:</span>
                    <span className="stat-value">{state.dropped_frames}</span>
                  </div>
                )}
                {state.latency_ms > 0 && (
                  <div className={`stat-item ${state.latency_ms > 50 ? 'warning' : ''}`}>
                    <span className="stat-label">Latency:</span>
                    <span className="stat-value">{state.latency_ms.toFixed(1)}ms</span>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="state-controls">
                {state.run_state === 'stopped' || state.run_state === 'paused' ? (
                  <button className="btn-play" onClick={() => startState(state.id)}>
                    ▶️ Play
                  </button>
                ) : state.run_state === 'playing' ? (
                  <>
                    <button className="btn-pause" onClick={() => pauseState(state.id)}>
                      ⏸️ Pause
                    </button>
                    <button className="btn-stop" onClick={() => stopState(state.id)}>
                      ⏹️ Stop
                    </button>
                  </>
                ) : null}
              </div>

              {/* Metadata */}
              {Object.keys(state.metadata).length > 0 && (
                <div className="metadata-section">
                  {Object.entries(state.metadata).map(([key, value]) => (
                    <div key={key} className="metadata-item">
                      <span className="meta-key">{key}:</span>
                      <span className="meta-value">{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Summary Stats */}
      <div className="summary-stats">
        <div className="summary-card">
          <div className="summary-value">{timeStates.length}</div>
          <div className="summary-label">Total States</div>
        </div>
        <div className="summary-card">
          <div className="summary-value">{timeStates.filter(s => s.run_state === 'playing').length}</div>
          <div className="summary-label">Playing</div>
        </div>
        <div className="summary-card">
          <div className="summary-value">{timeStates.filter(s => s.duration_type === 'indefinite').length}</div>
          <div className="summary-label">Live Streams</div>
        </div>
        <div className="summary-card">
          <div className="summary-value">{timeStates.filter(s => s.duration_type?.finite).length}</div>
          <div className="summary-label">Playbacks</div>
        </div>
        <div className="summary-card">
          <div className="summary-value">
            {timeStates.reduce((sum, s) => sum + s.dropped_frames, 0)}
          </div>
          <div className="summary-label">Dropped Frames</div>
        </div>
      </div>
    </div>
  )
}

export default TimeStateMonitor
