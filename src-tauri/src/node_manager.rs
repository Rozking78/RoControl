use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::net::IpAddr;
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};
use tokio::sync::broadcast;
use mdns_sd::{ServiceDaemon, ServiceInfo, ServiceEvent};

const SERVICE_TYPE: &str = "_rocontrol._tcp.local.";
const HEARTBEAT_INTERVAL_SECS: u64 = 1;
const NODE_TIMEOUT_SECS: u64 = 5;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum NodeRole {
    Master,
    Receiver,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeCapability {
    pub dmx_output: bool,
    pub media_playback: bool,
    pub input_processing: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeInfo {
    pub node_id: String,
    pub role: NodeRole,
    pub ip_address: String,
    pub port: u16,
    pub capabilities: NodeCapability,
    pub universes: Vec<u16>,
    pub last_heartbeat: u64,
    pub online: bool,
    pub version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeConfig {
    pub role: NodeRole,
    pub node_id: String,
    pub listen_port: u16,
    pub master_ip: Option<String>,
    pub master_port: Option<u16>,
    pub local_universes: Vec<u16>,
    pub capabilities: NodeCapability,
    pub auto_discover: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeRegistration {
    pub node_id: String,
    pub capabilities: NodeCapability,
    pub universes: Vec<u16>,
    pub version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeHeartbeat {
    pub node_id: String,
    pub timestamp: u64,
    pub metrics: NodeMetrics,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeMetrics {
    pub dmx_fps: f32,
    pub cpu_usage: f32,
    pub memory_usage: f32,
    pub network_latency_ms: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeCommand {
    pub command_id: String,
    pub command_type: String,
    pub target_node: Option<String>, // None = broadcast to all
    pub payload: serde_json::Value,
    pub timestamp: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeCommandAck {
    pub command_id: String,
    pub node_id: String,
    pub status: String, // "executed", "failed", "pending"
    pub error: Option<String>,
}

pub struct NodeManager {
    config: Arc<Mutex<NodeConfig>>,
    nodes: Arc<Mutex<HashMap<String, NodeInfo>>>,
    mdns_daemon: Arc<Mutex<Option<ServiceDaemon>>>,
    event_tx: broadcast::Sender<NodeEvent>,
}

#[derive(Debug, Clone)]
pub enum NodeEvent {
    NodeDiscovered(NodeInfo),
    NodeConnected(String),
    NodeDisconnected(String),
    NodeHeartbeat(NodeHeartbeat),
    CommandReceived(NodeCommand),
}

impl NodeManager {
    pub fn new(config: NodeConfig) -> Result<Self, String> {
        let (event_tx, _) = broadcast::channel(100);

        Ok(NodeManager {
            config: Arc::new(Mutex::new(config)),
            nodes: Arc::new(Mutex::new(HashMap::new())),
            mdns_daemon: Arc::new(Mutex::new(None)),
            event_tx,
        })
    }

    pub fn get_config(&self) -> Result<NodeConfig, String> {
        let config = self.config.lock().map_err(|e| e.to_string())?;
        Ok(config.clone())
    }

    pub fn update_config(&self, new_config: NodeConfig) -> Result<(), String> {
        let mut config = self.config.lock().map_err(|e| e.to_string())?;
        *config = new_config;
        Ok(())
    }

    pub fn start_discovery(&self) -> Result<(), String> {
        let config = self.config.lock().map_err(|e| e.to_string())?;

        if !config.auto_discover {
            return Ok(());
        }

        let mdns = ServiceDaemon::new().map_err(|e| format!("Failed to create mDNS daemon: {}", e))?;

        // Browse for RoControl nodes
        let receiver = mdns.browse(SERVICE_TYPE).map_err(|e| format!("Failed to browse services: {}", e))?;

        let nodes = Arc::clone(&self.nodes);
        let event_tx = self.event_tx.clone();

        // Spawn task to handle mDNS events
        tokio::spawn(async move {
            while let Ok(event) = receiver.recv_async().await {
                match event {
                    ServiceEvent::ServiceResolved(info) => {
                        if let Some(node_info) = Self::parse_service_info(&info) {
                            let mut nodes_guard = match nodes.lock() {
                                Ok(guard) => guard,
                                Err(_) => continue,
                            };

                            nodes_guard.insert(node_info.node_id.clone(), node_info.clone());
                            let _ = event_tx.send(NodeEvent::NodeDiscovered(node_info));
                        }
                    }
                    ServiceEvent::ServiceRemoved(_, full_name) => {
                        if let Some(node_id) = Self::extract_node_id(&full_name) {
                            let mut nodes_guard = match nodes.lock() {
                                Ok(guard) => guard,
                                Err(_) => continue,
                            };

                            nodes_guard.remove(&node_id);
                            let _ = event_tx.send(NodeEvent::NodeDisconnected(node_id));
                        }
                    }
                    _ => {}
                }
            }
        });

        // Store daemon reference
        let mut daemon_guard = self.mdns_daemon.lock().map_err(|e| e.to_string())?;
        *daemon_guard = Some(mdns);

        Ok(())
    }

    pub fn advertise_self(&self) -> Result<(), String> {
        let config = self.config.lock().map_err(|e| e.to_string())?;

        if config.role != NodeRole::Receiver && config.role != NodeRole::Master {
            return Ok(());
        }

        let mdns = ServiceDaemon::new().map_err(|e| format!("Failed to create mDNS daemon: {}", e))?;

        // Get local IP address
        let local_ip = self.get_local_ip()?;

        // Create service info
        let instance_name = format!("RoControl-{}", config.node_id);
        let mut properties = HashMap::new();
        properties.insert("node_id".to_string(), config.node_id.clone());
        properties.insert("role".to_string(), format!("{:?}", config.role));
        properties.insert("version".to_string(), env!("CARGO_PKG_VERSION").to_string());

        let service_info = ServiceInfo::new(
            SERVICE_TYPE,
            &instance_name,
            &format!("{}.local.", instance_name),
            local_ip,
            config.listen_port,
            Some(properties),
        ).map_err(|e| format!("Failed to create service info: {}", e))?;

        mdns.register(service_info).map_err(|e| format!("Failed to register service: {}", e))?;

        // Store daemon reference
        let mut daemon_guard = self.mdns_daemon.lock().map_err(|e| e.to_string())?;
        *daemon_guard = Some(mdns);

        Ok(())
    }

    pub fn register_node(&self, registration: NodeRegistration) -> Result<String, String> {
        let config = self.config.lock().map_err(|e| e.to_string())?;

        if config.role != NodeRole::Master {
            return Err("Only master nodes can register receiver nodes".to_string());
        }

        let node_info = NodeInfo {
            node_id: registration.node_id.clone(),
            role: NodeRole::Receiver,
            ip_address: "".to_string(), // Will be populated from request
            port: 0,
            capabilities: registration.capabilities,
            universes: registration.universes,
            last_heartbeat: Self::current_timestamp(),
            online: true,
            version: registration.version,
        };

        let mut nodes = self.nodes.lock().map_err(|e| e.to_string())?;
        nodes.insert(node_info.node_id.clone(), node_info.clone());

        let _ = self.event_tx.send(NodeEvent::NodeConnected(registration.node_id.clone()));

        Ok(format!("Node {} registered successfully", registration.node_id))
    }

    pub fn unregister_node(&self, node_id: &str) -> Result<String, String> {
        let mut nodes = self.nodes.lock().map_err(|e| e.to_string())?;

        if nodes.remove(node_id).is_some() {
            let _ = self.event_tx.send(NodeEvent::NodeDisconnected(node_id.to_string()));
            Ok(format!("Node {} unregistered", node_id))
        } else {
            Err(format!("Node {} not found", node_id))
        }
    }

    pub fn get_all_nodes(&self) -> Result<Vec<NodeInfo>, String> {
        let nodes = self.nodes.lock().map_err(|e| e.to_string())?;
        Ok(nodes.values().cloned().collect())
    }

    pub fn get_node(&self, node_id: &str) -> Result<NodeInfo, String> {
        let nodes = self.nodes.lock().map_err(|e| e.to_string())?;
        nodes.get(node_id)
            .cloned()
            .ok_or_else(|| format!("Node {} not found", node_id))
    }

    pub fn update_heartbeat(&self, heartbeat: NodeHeartbeat) -> Result<(), String> {
        let mut nodes = self.nodes.lock().map_err(|e| e.to_string())?;

        if let Some(node) = nodes.get_mut(&heartbeat.node_id) {
            node.last_heartbeat = heartbeat.timestamp;
            node.online = true;

            let _ = self.event_tx.send(NodeEvent::NodeHeartbeat(heartbeat));
            Ok(())
        } else {
            Err(format!("Node {} not found", heartbeat.node_id))
        }
    }

    pub fn check_node_health(&self) -> Result<(), String> {
        let mut nodes = self.nodes.lock().map_err(|e| e.to_string())?;
        let current_time = Self::current_timestamp();

        for node in nodes.values_mut() {
            if current_time - node.last_heartbeat > NODE_TIMEOUT_SECS {
                if node.online {
                    node.online = false;
                    let _ = self.event_tx.send(NodeEvent::NodeDisconnected(node.node_id.clone()));
                }
            }
        }

        Ok(())
    }

    pub fn subscribe_events(&self) -> broadcast::Receiver<NodeEvent> {
        self.event_tx.subscribe()
    }

    fn parse_service_info(info: &ServiceInfo) -> Option<NodeInfo> {
        let properties = info.get_properties();

        let node_id = properties.get("node_id")?.to_string();
        let role_str = properties.get("role")?.to_string();
        let version = properties.get("version")?.to_string();

        let role = if role_str.to_lowercase().contains("master") {
            NodeRole::Master
        } else {
            NodeRole::Receiver
        };

        Some(NodeInfo {
            node_id,
            role,
            ip_address: info.get_addresses().iter().next()?.to_string(),
            port: info.get_port(),
            capabilities: NodeCapability {
                dmx_output: true,
                media_playback: false,
                input_processing: false,
            },
            universes: Vec::new(),
            last_heartbeat: Self::current_timestamp(),
            online: true,
            version,
        })
    }

    fn extract_node_id(full_name: &str) -> Option<String> {
        full_name.split('.').next().map(|s| s.to_string())
    }

    fn get_local_ip(&self) -> Result<IpAddr, String> {
        use if_addrs::get_if_addrs;

        let interfaces = get_if_addrs().map_err(|e| format!("Failed to get interfaces: {}", e))?;

        // Find first non-loopback IPv4 address
        for iface in interfaces {
            if !iface.is_loopback() && iface.addr.is_ipv4() {
                return Ok(iface.addr.ip());
            }
        }

        Err("No suitable network interface found".to_string())
    }

    fn current_timestamp() -> u64 {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs()
    }
}

impl Default for NodeCapability {
    fn default() -> Self {
        NodeCapability {
            dmx_output: true,
            media_playback: false,
            input_processing: false,
        }
    }
}

impl Default for NodeConfig {
    fn default() -> Self {
        NodeConfig {
            role: NodeRole::Master,
            node_id: format!("rocontrol-{}", uuid::Uuid::new_v4().to_string().split('-').next().unwrap_or("unknown")),
            listen_port: 9000,
            master_ip: None,
            master_port: None,
            local_universes: Vec::new(),
            capabilities: NodeCapability::default(),
            auto_discover: true,
        }
    }
}
