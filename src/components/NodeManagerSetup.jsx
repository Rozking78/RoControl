import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/tauri'
import '../styles/NodeManagerSetup.css'

const NodeManagerSetup = () => {
  const [config, setConfig] = useState(null)
  const [nodes, setNodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [discoveryActive, setDiscoveryActive] = useState(false)
  const [advertisingActive, setAdvertisingActive] = useState(false)

  useEffect(() => {
    loadNodeConfig()
    loadNodes()

    // Poll for nodes every 2 seconds
    const interval = setInterval(loadNodes, 2000)
    return () => clearInterval(interval)
  }, [])

  const loadNodeConfig = async () => {
    try {
      const nodeConfig = await invoke('get_node_config')
      setConfig(nodeConfig)
      setLoading(false)
    } catch (error) {
      console.error('Failed to load node config:', error)
      setLoading(false)
    }
  }

  const loadNodes = async () => {
    try {
      const nodeList = await invoke('get_all_nodes')
      setNodes(nodeList)
    } catch (error) {
      console.error('Failed to load nodes:', error)
    }
  }

  const updateConfig = async (updates) => {
    try {
      const newConfig = { ...config, ...updates }
      await invoke('update_node_config', { config: newConfig })
      setConfig(newConfig)
    } catch (error) {
      console.error('Failed to update config:', error)
      alert(`Error: ${error}`)
    }
  }

  const startDiscovery = async () => {
    try {
      await invoke('start_node_discovery')
      setDiscoveryActive(true)
      alert('Node discovery started - listening for RoControl nodes on the network')
    } catch (error) {
      console.error('Failed to start discovery:', error)
      alert(`Error: ${error}`)
    }
  }

  const advertiseNode = async () => {
    try {
      await invoke('advertise_node')
      setAdvertisingActive(true)
      alert('Now advertising this node on the network')
    } catch (error) {
      console.error('Failed to advertise node:', error)
      alert(`Error: ${error}`)
    }
  }

  const unregisterNode = async (nodeId) => {
    if (!confirm(`Remove node ${nodeId} from the network?`)) return

    try {
      await invoke('unregister_node', { nodeId })
      loadNodes()
      alert(`Node ${nodeId} removed`)
    } catch (error) {
      console.error('Failed to unregister node:', error)
      alert(`Error: ${error}`)
    }
  }

  const getNodeStatusClass = (node) => {
    if (!node.online) return 'status-offline'
    const timeSinceHeartbeat = Date.now() / 1000 - node.last_heartbeat
    if (timeSinceHeartbeat < 2) return 'status-online'
    if (timeSinceHeartbeat < 5) return 'status-warning'
    return 'status-offline'
  }

  const formatTimeSince = (timestamp) => {
    const seconds = Math.floor(Date.now() / 1000 - timestamp)
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    return `${Math.floor(seconds / 3600)}h ago`
  }

  if (loading) {
    return <div className="node-manager-loading">Loading node configuration...</div>
  }

  if (!config) {
    return <div className="node-manager-error">Failed to load node configuration</div>
  }

  return (
    <div className="node-manager-setup">
      <div className="node-config-section">
        <h3>🌐 Node Configuration</h3>

        <div className="config-grid">
          <div className="config-item">
            <label>Node Role</label>
            <select
              value={config.role}
              onChange={(e) => updateConfig({ role: e.target.value })}
              className="role-select"
            >
              <option value="master">Master Node</option>
              <option value="receiver">Receiver Node</option>
            </select>
            <p className="config-help">
              {config.role === 'master'
                ? '🎛️ Master controls receiver nodes and coordinates shows'
                : '📡 Receiver executes commands from master node'}
            </p>
          </div>

          <div className="config-item">
            <label>Node ID</label>
            <input
              type="text"
              value={config.node_id}
              onChange={(e) => updateConfig({ node_id: e.target.value })}
              className="node-id-input"
            />
            <p className="config-help">Unique identifier for this node</p>
          </div>

          <div className="config-item">
            <label>Listen Port</label>
            <input
              type="number"
              value={config.listen_port}
              onChange={(e) => updateConfig({ listen_port: parseInt(e.target.value) })}
              className="port-input"
            />
            <p className="config-help">Port for node communication (default: 9000)</p>
          </div>

          {config.role === 'receiver' && (
            <>
              <div className="config-item">
                <label>Master IP Address</label>
                <input
                  type="text"
                  value={config.master_ip || ''}
                  onChange={(e) => updateConfig({ master_ip: e.target.value })}
                  placeholder="192.168.1.100"
                  className="ip-input"
                />
                <p className="config-help">IP address of the master node</p>
              </div>

              <div className="config-item">
                <label>Master Port</label>
                <input
                  type="number"
                  value={config.master_port || 9000}
                  onChange={(e) => updateConfig({ master_port: parseInt(e.target.value) })}
                  className="port-input"
                />
              </div>
            </>
          )}

          <div className="config-item full-width">
            <label>
              <input
                type="checkbox"
                checked={config.auto_discover}
                onChange={(e) => updateConfig({ auto_discover: e.target.checked })}
              />
              Auto-discover nodes (mDNS/Bonjour)
            </label>
            <p className="config-help">Automatically find other RoControl nodes on the network</p>
          </div>
        </div>

        <div className="node-actions">
          <button
            className={`btn-discovery ${discoveryActive ? 'active' : ''}`}
            onClick={startDiscovery}
            disabled={!config.auto_discover}
          >
            {discoveryActive ? '✓ Discovery Active' : '🔍 Start Discovery'}
          </button>

          <button
            className={`btn-advertise ${advertisingActive ? 'active' : ''}`}
            onClick={advertiseNode}
            disabled={!config.auto_discover}
          >
            {advertisingActive ? '✓ Advertising' : '📢 Advertise This Node'}
          </button>
        </div>
      </div>

      <div className="node-capabilities-section">
        <h3>⚙️ Node Capabilities</h3>
        <div className="capabilities-grid">
          <label>
            <input
              type="checkbox"
              checked={config.capabilities?.dmx_output || false}
              onChange={(e) => updateConfig({
                capabilities: { ...config.capabilities, dmx_output: e.target.checked }
              })}
            />
            <span>🎭 DMX Output</span>
            <small>This node can output DMX/Art-Net/sACN</small>
          </label>

          <label>
            <input
              type="checkbox"
              checked={config.capabilities?.media_playback || false}
              onChange={(e) => updateConfig({
                capabilities: { ...config.capabilities, media_playback: e.target.checked }
              })}
            />
            <span>🎬 Media Playback</span>
            <small>This node can play video content</small>
          </label>

          <label>
            <input
              type="checkbox"
              checked={config.capabilities?.input_processing || false}
              onChange={(e) => updateConfig({
                capabilities: { ...config.capabilities, input_processing: e.target.checked }
              })}
            />
            <span>🎮 Input Processing</span>
            <small>This node can process user input</small>
          </label>
        </div>
      </div>

      {config.role === 'master' && (
        <div className="nodes-list-section">
          <h3>📡 Connected Nodes ({nodes.length})</h3>

          {nodes.length === 0 ? (
            <div className="no-nodes">
              <p>No nodes discovered yet</p>
              <p className="hint">Enable auto-discovery and click "Start Discovery" to find nodes</p>
            </div>
          ) : (
            <div className="nodes-grid">
              {nodes.map((node) => (
                <div key={node.node_id} className={`node-card ${getNodeStatusClass(node)}`}>
                  <div className="node-header">
                    <h4>{node.node_id}</h4>
                    <span className={`node-role-badge ${node.role}`}>
                      {node.role === 'master' ? '🎛️ Master' : '📡 Receiver'}
                    </span>
                  </div>

                  <div className="node-details">
                    <div className="node-info">
                      <span className="label">IP:</span>
                      <span className="value">{node.ip_address}:{node.port}</span>
                    </div>

                    <div className="node-info">
                      <span className="label">Status:</span>
                      <span className={`value status-text ${getNodeStatusClass(node)}`}>
                        {node.online ? '✓ Online' : '✗ Offline'}
                      </span>
                    </div>

                    <div className="node-info">
                      <span className="label">Last Seen:</span>
                      <span className="value">{formatTimeSince(node.last_heartbeat)}</span>
                    </div>

                    {node.universes && node.universes.length > 0 && (
                      <div className="node-info">
                        <span className="label">Universes:</span>
                        <span className="value">{node.universes.join(', ')}</span>
                      </div>
                    )}

                    <div className="node-capabilities-badges">
                      {node.capabilities?.dmx_output && <span className="cap-badge">DMX</span>}
                      {node.capabilities?.media_playback && <span className="cap-badge">Media</span>}
                      {node.capabilities?.input_processing && <span className="cap-badge">Input</span>}
                    </div>
                  </div>

                  {node.node_id !== config.node_id && (
                    <button
                      className="btn-remove-node"
                      onClick={() => unregisterNode(node.node_id)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {config.role === 'receiver' && (
        <div className="receiver-info-section">
          <h3>📡 Receiver Mode</h3>
          <p>This node is configured as a receiver and will execute commands from the master node.</p>
          <p>Make sure the master node IP and port are configured correctly above.</p>
          <p>Enable auto-discovery to automatically connect to the master when it becomes available.</p>
        </div>
      )}
    </div>
  )
}

export default NodeManagerSetup
