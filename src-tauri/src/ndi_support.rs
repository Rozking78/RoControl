use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use mdns_sd::{ServiceDaemon, ServiceEvent};
use tokio::sync::broadcast;

/// NDI Source information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NdiSource {
    pub name: String,
    pub address: String,
    pub port: u16,
    pub groups: Vec<String>,
    pub url: Option<String>,
}

/// NDI Discovery Manager
pub struct NdiManager {
    sources: Arc<Mutex<HashMap<String, NdiSource>>>,
    discovery_active: Arc<Mutex<bool>>,
    tx: broadcast::Sender<NdiSource>,
}

impl NdiManager {
    /// Create a new NDI Manager
    pub fn new() -> Self {
        let (tx, _rx) = broadcast::channel(100);

        NdiManager {
            sources: Arc::new(Mutex::new(HashMap::new())),
            discovery_active: Arc::new(Mutex::new(false)),
            tx,
        }
    }

    /// Start NDI discovery via mDNS
    pub async fn start_discovery(&self) -> Result<(), Box<dyn std::error::Error>> {
        let mut is_active = self.discovery_active.lock().unwrap();
        if *is_active {
            return Ok(());
        }
        *is_active = true;
        drop(is_active);

        println!("[NDI] Starting NDI source discovery...");

        let mdns = ServiceDaemon::new()?;

        // Browse for NDI services
        // NDI uses _ndi._tcp.local for discovery
        let receiver = mdns.browse("_ndi._tcp.local.")?;

        let sources = Arc::clone(&self.sources);
        let tx = self.tx.clone();
        let discovery_active = Arc::clone(&self.discovery_active);

        tokio::spawn(async move {
            while *discovery_active.lock().unwrap() {
                if let Ok(event) = receiver.recv_async().await {
                    match event {
                        ServiceEvent::ServiceResolved(info) => {
                            let name = info.get_fullname();
                            let addresses = info.get_addresses();
                            let port = info.get_port();

                            if let Some(addr) = addresses.iter().next() {
                                let ndi_source = NdiSource {
                                    name: name.to_string(),
                                    address: addr.to_string(),
                                    port,
                                    groups: vec![],
                                    url: Some(format!("ndi://{}:{}/{}", addr, port, name)),
                                };

                                println!("[NDI] Discovered source: {} at {}:{}",
                                    ndi_source.name, ndi_source.address, ndi_source.port);

                                // Store in sources map
                                sources.lock().unwrap().insert(
                                    ndi_source.name.clone(),
                                    ndi_source.clone()
                                );

                                // Broadcast discovery
                                let _ = tx.send(ndi_source);
                            }
                        }
                        ServiceEvent::ServiceRemoved(_, fullname) => {
                            println!("[NDI] Source removed: {}", fullname);
                            sources.lock().unwrap().remove(&fullname);
                        }
                        _ => {}
                    }
                }
            }
        });

        Ok(())
    }

    /// Stop NDI discovery
    pub fn stop_discovery(&self) {
        let mut is_active = self.discovery_active.lock().unwrap();
        *is_active = false;
        println!("[NDI] Stopped NDI source discovery");
    }

    /// Get all discovered NDI sources
    pub fn get_sources(&self) -> Vec<NdiSource> {
        self.sources
            .lock()
            .unwrap()
            .values()
            .cloned()
            .collect()
    }

    /// Get a specific NDI source by name
    pub fn get_source(&self, name: &str) -> Option<NdiSource> {
        self.sources
            .lock()
            .unwrap()
            .get(name)
            .cloned()
    }

    /// Subscribe to NDI source updates
    pub fn subscribe(&self) -> broadcast::Receiver<NdiSource> {
        self.tx.subscribe()
    }

    /// Manually add an NDI source (for cases where discovery fails)
    pub fn add_manual_source(&self, name: String, address: String, port: u16) -> NdiSource {
        let ndi_source = NdiSource {
            name: name.clone(),
            address: address.clone(),
            port,
            groups: vec![],
            url: Some(format!("ndi://{}:{}/{}", address, port, name)),
        };

        println!("[NDI] Manually added source: {} at {}:{}",
            ndi_source.name, ndi_source.address, ndi_source.port);

        self.sources
            .lock()
            .unwrap()
            .insert(name, ndi_source.clone());

        let _ = self.tx.send(ndi_source.clone());
        ndi_source
    }

    /// Remove an NDI source
    pub fn remove_source(&self, name: &str) -> bool {
        let result = self.sources
            .lock()
            .unwrap()
            .remove(name)
            .is_some();

        if result {
            println!("[NDI] Removed source: {}", name);
        }

        result
    }

    /// Test connection to an NDI source
    pub async fn test_connection(&self, name: &str) -> Result<bool, Box<dyn std::error::Error>> {
        if let Some(source) = self.get_source(name) {
            // Simple TCP connection test
            let addr = format!("{}:{}", source.address, source.port);
            match tokio::net::TcpStream::connect(&addr).await {
                Ok(_) => {
                    println!("[NDI] Connection test successful for: {}", name);
                    Ok(true)
                }
                Err(e) => {
                    println!("[NDI] Connection test failed for {}: {}", name, e);
                    Ok(false)
                }
            }
        } else {
            Err(format!("NDI source '{}' not found", name).into())
        }
    }
}

impl Default for NdiManager {
    fn default() -> Self {
        Self::new()
    }
}

/// NDI Stream Receiver (placeholder for actual NDI SDK integration)
pub struct NdiReceiver {
    source: NdiSource,
    connected: Arc<Mutex<bool>>,
}

impl NdiReceiver {
    /// Create a new NDI Receiver for a specific source
    pub fn new(source: NdiSource) -> Self {
        NdiReceiver {
            source,
            connected: Arc::new(Mutex::new(false)),
        }
    }

    /// Connect to the NDI source
    pub async fn connect(&self) -> Result<(), Box<dyn std::error::Error>> {
        println!("[NDI] Connecting to source: {}", self.source.name);

        // Note: Actual NDI SDK integration would go here
        // For now, this is a placeholder that simulates connection

        let addr = format!("{}:{}", self.source.address, self.source.port);
        match tokio::net::TcpStream::connect(&addr).await {
            Ok(_stream) => {
                *self.connected.lock().unwrap() = true;
                println!("[NDI] Connected to: {}", self.source.name);
                Ok(())
            }
            Err(e) => {
                println!("[NDI] Connection failed: {}", e);
                Err(e.into())
            }
        }
    }

    /// Disconnect from the NDI source
    pub fn disconnect(&self) {
        *self.connected.lock().unwrap() = false;
        println!("[NDI] Disconnected from: {}", self.source.name);
    }

    /// Check if connected
    pub fn is_connected(&self) -> bool {
        *self.connected.lock().unwrap()
    }

    /// Get the source information
    pub fn get_source(&self) -> &NdiSource {
        &self.source
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_ndi_manager_creation() {
        let manager = NdiManager::new();
        assert_eq!(manager.get_sources().len(), 0);
    }

    #[tokio::test]
    async fn test_manual_source_addition() {
        let manager = NdiManager::new();
        let source = manager.add_manual_source(
            "Test Source".to_string(),
            "192.168.1.100".to_string(),
            5960
        );

        assert_eq!(source.name, "Test Source");
        assert_eq!(manager.get_sources().len(), 1);
    }

    #[tokio::test]
    async fn test_source_removal() {
        let manager = NdiManager::new();
        manager.add_manual_source(
            "Test Source".to_string(),
            "192.168.1.100".to_string(),
            5960
        );

        assert!(manager.remove_source("Test Source"));
        assert_eq!(manager.get_sources().len(), 0);
    }
}
