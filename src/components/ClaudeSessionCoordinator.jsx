import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/tauri'
import '../styles/ClaudeSessionCoordinator.css'

const ClaudeSessionCoordinator = () => {
  const [currentSession, setCurrentSession] = useState(null)
  const [allSessions, setAllSessions] = useState([])
  const [logs, setLogs] = useState([])
  const [pendingActions, setPendingActions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedSession, setSelectedSession] = useState(null)
  const [actionPayload, setActionPayload] = useState('')

  useEffect(() => {
    initializeCoordinator()

    // Poll for sessions and actions every 5 seconds
    const interval = setInterval(() => {
      syncSessions()
      checkPendingActions()
    }, 5000)

    // Send heartbeat every 10 seconds
    const heartbeatInterval = setInterval(() => {
      sendHeartbeat()
    }, 10000)

    return () => {
      clearInterval(interval)
      clearInterval(heartbeatInterval)
    }
  }, [])

  const initializeCoordinator = async () => {
    try {
      // Get current session info
      const session = await invoke('get_session_info')
      setCurrentSession(session)

      // Register session with GitHub
      await invoke('register_claude_session')

      // Initial sync
      await syncSessions()
      await checkPendingActions()
      await pullLogs()

      setLoading(false)
    } catch (error) {
      console.error('Failed to initialize coordinator:', error)
      setLoading(false)
    }
  }

  const sendHeartbeat = async () => {
    try {
      await invoke('session_heartbeat', {
        status: 'active',
        currentTask: document.title
      })
    } catch (error) {
      console.error('Failed to send heartbeat:', error)
    }
  }

  const syncSessions = async () => {
    try {
      const sessions = await invoke('sync_claude_sessions')
      setAllSessions(sessions)
    } catch (error) {
      console.error('Failed to sync sessions:', error)
    }
  }

  const checkPendingActions = async () => {
    try {
      const actions = await invoke('check_pending_session_actions')
      setPendingActions(actions)

      // Auto-execute certain actions
      for (const action of actions) {
        if (action.status === 'pending') {
          await executeAction(action)
        }
      }
    } catch (error) {
      console.error('Failed to check pending actions:', error)
    }
  }

  const executeAction = async (action) => {
    try {
      let result = { success: true, message: 'Action executed' }

      switch (action.action_type) {
        case 'request_status':
          result.message = `Status: ${currentSession?.status}, Task: ${currentSession?.current_task || 'None'}`
          break

        case 'pull_logs':
          await pullLogs()
          result.message = 'Logs pulled successfully'
          break

        case 'execute_command':
          // Could execute CLI commands here
          result.message = `Command queued: ${JSON.stringify(action.payload)}`
          break

        case 'trigger_build':
          result.message = 'Build triggered'
          break

        default:
          result.message = `Unknown action type: ${action.action_type}`
      }

      await invoke('complete_session_action', {
        actionId: action.action_id,
        success: result.success,
        message: result.message
      })

      await invoke('log_session_message', {
        level: 'success',
        message: `Executed action ${action.action_id}: ${result.message}`
      })

      checkPendingActions()
    } catch (error) {
      console.error('Failed to execute action:', error)

      await invoke('complete_session_action', {
        actionId: action.action_id,
        success: false,
        message: error.toString()
      })
    }
  }

  const pullLogs = async () => {
    try {
      const allLogs = await invoke('pull_all_session_logs')
      setLogs(allLogs.sort((a, b) => b.timestamp - a.timestamp))
    } catch (error) {
      console.error('Failed to pull logs:', error)
    }
  }

  const triggerAction = async (actionType) => {
    if (!selectedSession) {
      alert('Please select a target session')
      return
    }

    try {
      let payload = {}

      if (actionPayload) {
        try {
          payload = JSON.parse(actionPayload)
        } catch (e) {
          payload = { data: actionPayload }
        }
      }

      const actionId = await invoke('trigger_session_action', {
        targetSession: selectedSession,
        actionType,
        payload
      })

      await invoke('log_session_message', {
        level: 'info',
        message: `Triggered ${actionType} on ${selectedSession}: ${actionId}`
      })

      alert(`Action triggered: ${actionId}`)
      setActionPayload('')
      await pullLogs()
    } catch (error) {
      console.error('Failed to trigger action:', error)
      alert(`Error: ${error}`)
    }
  }

  const logMessage = async (level, message) => {
    try {
      await invoke('log_session_message', { level, message })
      await pullLogs()
    } catch (error) {
      console.error('Failed to log message:', error)
    }
  }

  const getSessionStatusClass = (session) => {
    if (!session) return 'status-offline'
    const timeSinceHeartbeat = Date.now() / 1000 - session.last_heartbeat
    if (timeSinceHeartbeat < 30) return 'status-online'
    if (timeSinceHeartbeat < 120) return 'status-warning'
    return 'status-offline'
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp * 1000)
    return date.toLocaleTimeString()
  }

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${minutes}m`
    if (minutes > 0) return `${minutes}m`
    return `${seconds}s`
  }

  if (loading) {
    return <div className="session-coordinator-loading">Initializing session coordinator...</div>
  }

  return (
    <div className="session-coordinator">
      <div className="coordinator-header">
        <h2>🔗 Claude Session Coordinator</h2>
        <p className="header-subtitle">Connect and coordinate multiple Claude Code instances via GitHub</p>
      </div>

      {/* Current Session Info */}
      <div className="current-session-section">
        <h3>📍 Current Session</h3>
        {currentSession && (
          <div className={`session-card current ${getSessionStatusClass(currentSession)}`}>
            <div className="session-header">
              <h4>{currentSession.session_id.substring(0, 8)}</h4>
              <span className="session-machine">{currentSession.machine_name}</span>
            </div>
            <div className="session-details">
              <div className="session-info">
                <span className="label">Branch:</span>
                <span className="value">{currentSession.branch_name}</span>
              </div>
              <div className="session-info">
                <span className="label">Uptime:</span>
                <span className="value">
                  {formatDuration(Math.floor(Date.now() / 1000 - currentSession.started_at))}
                </span>
              </div>
              <div className="session-info">
                <span className="label">Status:</span>
                <span className={`value status-badge ${currentSession.status}`}>
                  {currentSession.status}
                </span>
              </div>
            </div>
            <div className="session-capabilities">
              {currentSession.capabilities.map(cap => (
                <span key={cap} className="capability-badge">{cap}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* All Active Sessions */}
      <div className="all-sessions-section">
        <h3>🌐 Active Sessions ({allSessions.length})</h3>
        {allSessions.length === 0 ? (
          <div className="no-sessions">
            <p>No other sessions discovered</p>
            <p className="hint">Start Claude Code on another machine to see it here</p>
          </div>
        ) : (
          <div className="sessions-grid">
            {allSessions.map(session => (
              <div
                key={session.session_id}
                className={`session-card ${getSessionStatusClass(session)} ${selectedSession === session.session_id ? 'selected' : ''}`}
                onClick={() => setSelectedSession(session.session_id)}
              >
                <div className="session-header">
                  <h4>{session.session_id.substring(0, 8)}</h4>
                  <span className="session-machine">{session.machine_name}</span>
                </div>
                <div className="session-details">
                  <div className="session-info">
                    <span className="label">Branch:</span>
                    <span className="value">{session.branch_name}</span>
                  </div>
                  <div className="session-info">
                    <span className="label">Last Seen:</span>
                    <span className="value">
                      {formatDuration(Math.floor(Date.now() / 1000 - session.last_heartbeat))} ago
                    </span>
                  </div>
                  {session.current_task && (
                    <div className="session-info full-width">
                      <span className="label">Task:</span>
                      <span className="value task-text">{session.current_task}</span>
                    </div>
                  )}
                </div>
                <div className="session-capabilities">
                  {session.capabilities.map(cap => (
                    <span key={cap} className="capability-badge">{cap}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Triggers */}
      <div className="actions-section">
        <h3>⚡ Trigger Actions</h3>
        <div className="action-controls">
          <div className="action-target">
            <label>Target Session:</label>
            <select
              value={selectedSession || ''}
              onChange={(e) => setSelectedSession(e.target.value)}
              disabled={allSessions.length === 0}
            >
              <option value="">Select a session...</option>
              {allSessions.map(session => (
                <option key={session.session_id} value={session.session_id}>
                  {session.machine_name} ({session.session_id.substring(0, 8)})
                </option>
              ))}
            </select>
          </div>

          <div className="action-payload">
            <label>Payload (JSON):</label>
            <textarea
              value={actionPayload}
              onChange={(e) => setActionPayload(e.target.value)}
              placeholder='{"command": "example"}'
              rows={3}
            />
          </div>

          <div className="action-buttons">
            <button onClick={() => triggerAction('execute_command')} disabled={!selectedSession}>
              📋 Execute Command
            </button>
            <button onClick={() => triggerAction('pull_logs')} disabled={!selectedSession}>
              📝 Pull Logs
            </button>
            <button onClick={() => triggerAction('sync_state')} disabled={!selectedSession}>
              🔄 Sync State
            </button>
            <button onClick={() => triggerAction('trigger_build')} disabled={!selectedSession}>
              🔨 Trigger Build
            </button>
            <button onClick={() => triggerAction('request_status')} disabled={!selectedSession}>
              ℹ️ Request Status
            </button>
          </div>
        </div>
      </div>

      {/* Pending Actions */}
      {pendingActions.length > 0 && (
        <div className="pending-actions-section">
          <h3>⏳ Pending Actions ({pendingActions.length})</h3>
          <div className="actions-list">
            {pendingActions.map(action => (
              <div key={action.action_id} className="action-item">
                <div className="action-header">
                  <span className="action-type">{action.action_type}</span>
                  <span className="action-from">from: {action.from_session.substring(0, 8)}</span>
                </div>
                <div className="action-payload-display">
                  {JSON.stringify(action.payload)}
                </div>
                <div className="action-time">{formatTimestamp(action.created_at)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Session Logs */}
      <div className="logs-section">
        <div className="logs-header">
          <h3>📜 Session Logs ({logs.length})</h3>
          <button onClick={pullLogs} className="btn-refresh">🔄 Refresh</button>
        </div>
        <div className="logs-container">
          {logs.length === 0 ? (
            <div className="no-logs">No logs yet</div>
          ) : (
            logs.slice(0, 50).map((log, idx) => (
              <div key={idx} className={`log-entry log-${log.level}`}>
                <span className="log-time">{formatTimestamp(log.timestamp)}</span>
                <span className="log-session">[{log.session_id.substring(0, 8)}]</span>
                <span className={`log-level level-${log.level}`}>{log.level.toUpperCase()}</span>
                <span className="log-message">{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default ClaudeSessionCoordinator
