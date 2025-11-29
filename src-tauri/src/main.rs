// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod web_server;
mod ndi_support;
mod streamdeck_support;
mod node_manager;
mod node_api;
mod claude_session_coordinator;
mod time_manager;

use artnet_protocol::*;
use sacn::source::SacnSource;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::net::UdpSocket;
use std::sync::{Arc, Mutex};
use std::path::PathBuf;
use tauri::State;
use std::fs;
use std::io::Read;
use zip::ZipArchive;

// DMX Universe - 512 channels
type DmxUniverse = [u8; 512];

#[derive(Debug, Clone, Serialize, Deserialize)]
struct NetworkInterface {
    name: String,
    ip: String,
    is_loopback: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Fixture {
    id: String,
    name: String,
    fixture_type: String,
    dmx_address: u16,
    universe: u8,
    channel_count: u16,
    gdtf_file: Option<String>,
    // Video fixture fields
    is_video: Option<bool>,           // True if this is a video fixture
    video_source_type: Option<String>, // "file" or "ndi"
    video_source_path: Option<String>, // File path or NDI stream name
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct FixtureChannel {
    name: String,
    offset: u16,
    default_value: u8,
    channel_type: String, // Dimmer, Pan, Tilt, ColorRGB_Red, etc.
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct GdtfFixtureType {
    name: String,
    manufacturer: String,
    channels: Vec<FixtureChannel>,
    modes: Vec<String>,
}

#[derive(Debug, Clone, PartialEq)]
enum DmxProtocol {
    ArtNet,
    Sacn,
}

struct DmxEngine {
    universes: HashMap<u8, DmxUniverse>,
    artnet_socket: Option<UdpSocket>,
    sacn_source: Option<Arc<Mutex<SacnSource>>>,
    broadcast_address: String,
    protocol: DmxProtocol,
    selected_interface: Option<String>, // IP address of selected interface
}

struct AppState {
    dmx_engine: Arc<Mutex<DmxEngine>>,
    fixtures: Arc<Mutex<HashMap<String, Fixture>>>,
    fixture_library: Arc<Mutex<HashMap<String, GdtfFixtureType>>>,
    programmer: Arc<Mutex<HashMap<String, u8>>>, // fixture_id:channel -> value
    streamdeck_manager: Arc<Mutex<streamdeck_support::StreamDeckManager>>,
    node_manager: Arc<Mutex<node_manager::NodeManager>>,
    session_coordinator: Arc<Mutex<claude_session_coordinator::ClaudeSessionCoordinator>>,
    time_manager: Arc<Mutex<time_manager::TimeManager>>,
}

impl DmxEngine {
    fn new(broadcast_address: String) -> Self {
        let artnet_socket = UdpSocket::bind("0.0.0.0:6454").ok();

        // Initialize sACN source (IPv4)
        let sacn_source = SacnSource::new_v4("SteamDeck DMX Controller").ok().map(|src| Arc::new(Mutex::new(src)));

        DmxEngine {
            universes: HashMap::new(),
            artnet_socket,
            sacn_source,
            broadcast_address,
            protocol: DmxProtocol::ArtNet,
            selected_interface: None,
        }
    }

    fn set_network_interface(&mut self, interface_ip: Option<String>) -> std::result::Result<(), Box<dyn std::error::Error>> {
        self.selected_interface = interface_ip.clone();

        // Rebind socket to specific interface
        if let Some(ip) = interface_ip {
            let bind_addr = format!("{}:6454", ip);
            self.artnet_socket = UdpSocket::bind(&bind_addr).ok();

            // Recreate sACN source with specific interface
            // Note: sACN library might need specific configuration for interface binding
            self.sacn_source = SacnSource::new_v4("SteamDeck DMX Controller").ok().map(|src| Arc::new(Mutex::new(src)));
        } else {
            // Bind to all interfaces
            self.artnet_socket = UdpSocket::bind("0.0.0.0:6454").ok();
            self.sacn_source = SacnSource::new_v4("SteamDeck DMX Controller").ok().map(|src| Arc::new(Mutex::new(src)));
        }

        Ok(())
    }

    fn set_protocol(&mut self, protocol: DmxProtocol) {
        self.protocol = protocol;
    }

    fn set_channel(&mut self, universe: u8, channel: u16, value: u8) {
        if channel > 0 && channel <= 512 {
            let dmx_universe = self.universes.entry(universe).or_insert([0u8; 512]);
            dmx_universe[(channel - 1) as usize] = value;
        }
    }

    fn send_dmx(&self, universe: u8) -> std::result::Result<(), Box<dyn std::error::Error>> {
        match self.protocol {
            DmxProtocol::ArtNet => self.send_artnet(universe),
            DmxProtocol::Sacn => self.send_sacn(universe),
        }
    }

    fn send_artnet(&self, universe: u8) -> std::result::Result<(), Box<dyn std::error::Error>> {
        if let Some(socket) = &self.artnet_socket {
            let dmx_data = self.universes.get(&universe).unwrap_or(&[0u8; 512]);

            let command = ArtCommand::Output(Output {
                data: dmx_data.to_vec().into(),
                port_address: universe.into(),
                ..Output::default()
            });

            let bytes = command.write_to_buffer()?;
            socket.send_to(&bytes, format!("{}:6454", self.broadcast_address))?;
        }
        Ok(())
    }

    fn send_sacn(&self, universe: u8) -> std::result::Result<(), Box<dyn std::error::Error>> {
        if let Some(sacn_src) = &self.sacn_source {
            let dmx_data = self.universes.get(&universe).unwrap_or(&[0u8; 512]);
            let mut src = sacn_src.lock().map_err(|e| format!("Lock error: {}", e))?;

            // sACN universes are 1-based (1-63999)
            let sacn_universe = (universe as u16) + 1;

            // Send DMX data via sACN
            // send(universes: &[u16], data: &[u8], priority: Option<u8>, dst_ip: Option<SocketAddr>, sync_addr: Option<u16>)
            src.send(&[sacn_universe], dmx_data, None, None, None).map_err(|e| format!("sACN send error: {}", e))?;
        }
        Ok(())
    }

    fn blackout(&mut self) {
        for universe in self.universes.values_mut() {
            universe.fill(0);
        }
    }
}

#[tauri::command]
fn set_dmx_channel(
    state: State<AppState>,
    universe: u8,
    channel: u16,
    value: u8,
) -> std::result::Result<String, String> {
    let mut engine = state.dmx_engine.lock().map_err(|e| e.to_string())?;
    engine.set_channel(universe, channel, value);
    engine.send_dmx(universe).map_err(|e| e.to_string())?;
    Ok(format!("Set U{} Ch{} to {}", universe, channel, value))
}

#[tauri::command]
fn set_fixture_channel(
    state: State<AppState>,
    fixture_id: String,
    channel_offset: u16,
    value: u8,
) -> std::result::Result<String, String> {
    let fixtures = state.fixtures.lock().map_err(|e| e.to_string())?;
    let fixture = fixtures
        .get(&fixture_id)
        .ok_or("Fixture not found")?;

    let mut engine = state.dmx_engine.lock().map_err(|e| e.to_string())?;
    let absolute_channel = fixture.dmx_address + channel_offset;
    engine.set_channel(fixture.universe, absolute_channel, value);
    engine.send_dmx(fixture.universe).map_err(|e| e.to_string())?;

    // Store in programmer
    let mut programmer = state.programmer.lock().map_err(|e| e.to_string())?;
    programmer.insert(format!("{}:{}", fixture_id, channel_offset), value);

    Ok(format!("Set fixture {} channel {} to {}", fixture_id, channel_offset, value))
}

#[tauri::command]
fn add_fixture(
    state: State<AppState>,
    fixture: Fixture,
) -> std::result::Result<String, String> {
    let mut fixtures = state.fixtures.lock().map_err(|e| e.to_string())?;
    let id = fixture.id.clone();
    fixtures.insert(id.clone(), fixture);
    Ok(format!("Added fixture {}", id))
}

#[tauri::command]
fn get_fixtures(state: State<AppState>) -> std::result::Result<Vec<Fixture>, String> {
    let fixtures = state.fixtures.lock().map_err(|e| e.to_string())?;
    Ok(fixtures.values().cloned().collect())
}

#[tauri::command]
fn blackout(state: State<AppState>) -> std::result::Result<String, String> {
    let mut engine = state.dmx_engine.lock().map_err(|e| e.to_string())?;
    engine.blackout();
    for universe in 0..=255 {
        let _ = engine.send_dmx(universe);
    }
    Ok("Blackout activated".to_string())
}

#[tauri::command]
fn set_protocol(
    state: State<AppState>,
    protocol: String,
) -> std::result::Result<String, String> {
    let mut engine = state.dmx_engine.lock().map_err(|e| e.to_string())?;
    let dmx_protocol = match protocol.to_lowercase().as_str() {
        "artnet" | "art-net" => DmxProtocol::ArtNet,
        "sacn" | "e1.31" => DmxProtocol::Sacn,
        _ => return Err(format!("Unknown protocol: {}", protocol)),
    };
    engine.set_protocol(dmx_protocol);
    Ok(format!("Protocol set to: {}", protocol))
}

#[tauri::command]
fn parse_gdtf_file(
    state: State<AppState>,
    file_path: String,
) -> std::result::Result<GdtfFixtureType, String> {
    // GDTF files are ZIP archives containing XML files
    let file = fs::File::open(&file_path).map_err(|e| e.to_string())?;
    let mut archive = ZipArchive::new(file).map_err(|e| e.to_string())?;
    
    // Look for description.xml
    let mut description_xml = String::new();
    for i in 0..archive.len() {
        let mut file = archive.by_index(i).map_err(|e| e.to_string())?;
        if file.name().ends_with("description.xml") {
            file.read_to_string(&mut description_xml).map_err(|e| e.to_string())?;
            break;
        }
    }

    // Basic XML parsing (simplified for now)
    // In production, use proper XML parser to extract DMX modes, channels, etc.
    let fixture_type = GdtfFixtureType {
        name: "Generic GDTF Fixture".to_string(),
        manufacturer: "Unknown".to_string(),
        channels: vec![
            FixtureChannel {
                name: "Dimmer".to_string(),
                offset: 0,
                default_value: 0,
                channel_type: "Dimmer".to_string(),
            },
        ],
        modes: vec!["Standard".to_string()],
    };

    let mut library = state.fixture_library.lock().map_err(|e| e.to_string())?;
    library.insert(fixture_type.name.clone(), fixture_type.clone());

    Ok(fixture_type)
}

#[tauri::command]
fn get_fixture_library(state: State<AppState>) -> std::result::Result<Vec<GdtfFixtureType>, String> {
    let library = state.fixture_library.lock().map_err(|e| e.to_string())?;
    Ok(library.values().cloned().collect())
}

#[tauri::command]
fn configure_artnet(
    state: State<AppState>,
    broadcast_address: String,
) -> std::result::Result<String, String> {
    let mut engine = state.dmx_engine.lock().map_err(|e| e.to_string())?;
    engine.broadcast_address = broadcast_address.clone();
    Ok(format!("Art-Net configured to broadcast to {}", broadcast_address))
}

#[tauri::command]
fn get_network_interfaces() -> std::result::Result<Vec<NetworkInterface>, String> {
    let addrs = if_addrs::get_if_addrs().map_err(|e| e.to_string())?;

    let interfaces: Vec<NetworkInterface> = addrs
        .into_iter()
        .filter_map(|iface| {
            if let if_addrs::IfAddr::V4(v4_addr) = iface.addr {
                Some(NetworkInterface {
                    name: iface.name,
                    ip: v4_addr.ip.to_string(),
                    is_loopback: v4_addr.ip.is_loopback(),
                })
            } else {
                None
            }
        })
        .collect();

    Ok(interfaces)
}

#[tauri::command]
fn set_network_interface(
    state: State<AppState>,
    interface_ip: Option<String>,
) -> std::result::Result<String, String> {
    let mut engine = state.dmx_engine.lock().map_err(|e| e.to_string())?;
    engine.set_network_interface(interface_ip.clone()).map_err(|e| e.to_string())?;

    if let Some(ip) = interface_ip {
        Ok(format!("Network interface set to {}", ip))
    } else {
        Ok("Network interface set to all interfaces (0.0.0.0)".to_string())
    }
}

#[tauri::command]
async fn execute_cli_command(
    command: String,
) -> std::result::Result<String, String> {
    // TODO: Integrate with actual CLI dispatcher
    // For now, return a placeholder response
    Ok(format!("CLI command received: {}", command))
}

// Stream Deck Commands
#[tauri::command]
fn scan_streamdeck_devices(
    state: State<AppState>,
) -> std::result::Result<Vec<streamdeck_support::StreamDeckDevice>, String> {
    let manager = state.streamdeck_manager.lock().map_err(|e| e.to_string())?;
    manager.scan_devices()
}

#[tauri::command]
fn connect_streamdeck(
    state: State<AppState>,
    serial: String,
) -> std::result::Result<String, String> {
    let manager = state.streamdeck_manager.lock().map_err(|e| e.to_string())?;
    manager.connect_device(&serial)
}

#[tauri::command]
fn disconnect_streamdeck(
    state: State<AppState>,
    serial: String,
) -> std::result::Result<String, String> {
    let manager = state.streamdeck_manager.lock().map_err(|e| e.to_string())?;
    manager.disconnect_device(&serial)
}

#[tauri::command]
fn set_streamdeck_brightness(
    state: State<AppState>,
    serial: String,
    brightness: u8,
) -> std::result::Result<String, String> {
    let manager = state.streamdeck_manager.lock().map_err(|e| e.to_string())?;
    manager.set_brightness(&serial, brightness)
}

#[tauri::command]
fn read_streamdeck_buttons(
    state: State<AppState>,
    serial: String,
) -> std::result::Result<Vec<bool>, String> {
    let manager = state.streamdeck_manager.lock().map_err(|e| e.to_string())?;
    manager.read_buttons(&serial)
}

#[tauri::command]
fn reset_streamdeck(
    state: State<AppState>,
    serial: String,
) -> std::result::Result<String, String> {
    let manager = state.streamdeck_manager.lock().map_err(|e| e.to_string())?;
    manager.reset_device(&serial)
}

#[tauri::command]
fn clear_streamdeck_buttons(
    state: State<AppState>,
    serial: String,
) -> std::result::Result<String, String> {
    let manager = state.streamdeck_manager.lock().map_err(|e| e.to_string())?;
    manager.clear_all_buttons(&serial)
}

// Node Manager Commands

#[tauri::command]
fn get_node_config(
    state: State<AppState>,
) -> std::result::Result<node_manager::NodeConfig, String> {
    let manager = state.node_manager.lock().map_err(|e| e.to_string())?;
    manager.get_config()
}

#[tauri::command]
fn update_node_config(
    state: State<AppState>,
    config: node_manager::NodeConfig,
) -> std::result::Result<String, String> {
    let manager = state.node_manager.lock().map_err(|e| e.to_string())?;
    manager.update_config(config)?;
    Ok("Node configuration updated".to_string())
}

#[tauri::command]
fn start_node_discovery(
    state: State<AppState>,
) -> std::result::Result<String, String> {
    let manager = state.node_manager.lock().map_err(|e| e.to_string())?;
    manager.start_discovery()?;
    Ok("Node discovery started".to_string())
}

#[tauri::command]
fn advertise_node(
    state: State<AppState>,
) -> std::result::Result<String, String> {
    let manager = state.node_manager.lock().map_err(|e| e.to_string())?;
    manager.advertise_self()?;
    Ok("Node advertisement started".to_string())
}

#[tauri::command]
fn register_node(
    state: State<AppState>,
    registration: node_manager::NodeRegistration,
) -> std::result::Result<String, String> {
    let manager = state.node_manager.lock().map_err(|e| e.to_string())?;
    manager.register_node(registration)
}

#[tauri::command]
fn unregister_node(
    state: State<AppState>,
    node_id: String,
) -> std::result::Result<String, String> {
    let manager = state.node_manager.lock().map_err(|e| e.to_string())?;
    manager.unregister_node(&node_id)
}

#[tauri::command]
fn get_all_nodes(
    state: State<AppState>,
) -> std::result::Result<Vec<node_manager::NodeInfo>, String> {
    let manager = state.node_manager.lock().map_err(|e| e.to_string())?;
    manager.get_all_nodes()
}

#[tauri::command]
fn get_node_info(
    state: State<AppState>,
    node_id: String,
) -> std::result::Result<node_manager::NodeInfo, String> {
    let manager = state.node_manager.lock().map_err(|e| e.to_string())?;
    manager.get_node(&node_id)
}

#[tauri::command]
fn update_node_heartbeat(
    state: State<AppState>,
    heartbeat: node_manager::NodeHeartbeat,
) -> std::result::Result<String, String> {
    let manager = state.node_manager.lock().map_err(|e| e.to_string())?;
    manager.update_heartbeat(heartbeat)?;
    Ok("Heartbeat updated".to_string())
}

// Claude Session Coordinator Commands

#[tauri::command]
async fn register_claude_session(
    state: State<'_, AppState>,
) -> std::result::Result<String, String> {
    let coordinator = state.session_coordinator.lock().map_err(|e| e.to_string())?;
    coordinator.register_session().await?;
    Ok("Session registered".to_string())
}

#[tauri::command]
async fn session_heartbeat(
    state: State<'_, AppState>,
    status: String,
    current_task: Option<String>,
) -> std::result::Result<String, String> {
    let coordinator = state.session_coordinator.lock().map_err(|e| e.to_string())?;
    let session_status = match status.as_str() {
        "active" => claude_session_coordinator::SessionStatus::Active,
        "idle" => claude_session_coordinator::SessionStatus::Idle,
        "busy" => claude_session_coordinator::SessionStatus::Busy,
        _ => claude_session_coordinator::SessionStatus::Offline,
    };
    coordinator.heartbeat(session_status, current_task).await?;
    Ok("Heartbeat sent".to_string())
}

#[tauri::command]
async fn sync_claude_sessions(
    state: State<'_, AppState>,
) -> std::result::Result<Vec<claude_session_coordinator::ClaudeSession>, String> {
    let coordinator = state.session_coordinator.lock().map_err(|e| e.to_string())?;
    coordinator.sync_sessions().await
}

#[tauri::command]
async fn trigger_session_action(
    state: State<'_, AppState>,
    target_session: String,
    action_type: String,
    payload: serde_json::Value,
) -> std::result::Result<String, String> {
    let coordinator = state.session_coordinator.lock().map_err(|e| e.to_string())?;
    let action = match action_type.as_str() {
        "execute_command" => claude_session_coordinator::ActionType::ExecuteCommand,
        "pull_logs" => claude_session_coordinator::ActionType::PullLogs,
        "sync_state" => claude_session_coordinator::ActionType::SyncState,
        "trigger_build" => claude_session_coordinator::ActionType::TriggerBuild,
        "request_status" => claude_session_coordinator::ActionType::RequestStatus,
        _ => claude_session_coordinator::ActionType::Custom,
    };
    coordinator.trigger_action(target_session, action, payload).await
}

#[tauri::command]
async fn check_pending_session_actions(
    state: State<'_, AppState>,
) -> std::result::Result<Vec<claude_session_coordinator::SessionAction>, String> {
    let coordinator = state.session_coordinator.lock().map_err(|e| e.to_string())?;
    coordinator.check_pending_actions().await
}

#[tauri::command]
async fn complete_session_action(
    state: State<'_, AppState>,
    action_id: String,
    success: bool,
    message: String,
) -> std::result::Result<String, String> {
    let coordinator = state.session_coordinator.lock().map_err(|e| e.to_string())?;
    let result = if success {
        Ok(message)
    } else {
        Err(message)
    };
    coordinator.complete_action(action_id, result).await?;
    Ok("Action completed".to_string())
}

#[tauri::command]
async fn pull_all_session_logs(
    state: State<'_, AppState>,
) -> std::result::Result<Vec<claude_session_coordinator::SessionLog>, String> {
    let coordinator = state.session_coordinator.lock().map_err(|e| e.to_string())?;
    coordinator.pull_all_logs().await
}

#[tauri::command]
async fn log_session_message(
    state: State<'_, AppState>,
    level: String,
    message: String,
) -> std::result::Result<String, String> {
    let coordinator = state.session_coordinator.lock().map_err(|e| e.to_string())?;
    let log_level = match level.as_str() {
        "info" => claude_session_coordinator::LogLevel::Info,
        "warning" => claude_session_coordinator::LogLevel::Warning,
        "error" => claude_session_coordinator::LogLevel::Error,
        "success" => claude_session_coordinator::LogLevel::Success,
        _ => claude_session_coordinator::LogLevel::Info,
    };
    coordinator.log(log_level, message).await?;
    Ok("Logged".to_string())
}

#[tauri::command]
fn get_session_info(
    state: State<AppState>,
) -> std::result::Result<claude_session_coordinator::ClaudeSession, String> {
    let coordinator = state.session_coordinator.lock().map_err(|e| e.to_string())?;
    coordinator.get_current_session()
}

// Time Manager Commands

#[tauri::command]
fn register_time_state(
    state: State<AppState>,
    id: String,
    name: String,
    source_type: String,
    duration_type: String,
    duration_ms: Option<u64>,
) -> std::result::Result<String, String> {
    let manager = state.time_manager.lock().map_err(|e| e.to_string())?;

    let src_type = match source_type.as_str() {
        "video_playback" => time_manager::SourceType::VideoPlayback,
        "audio_playback" => time_manager::SourceType::AudioPlayback,
        "ndi_stream" => time_manager::SourceType::NdiStream,
        "artnet_input" => time_manager::SourceType::ArtNetInput,
        "sacn_input" => time_manager::SourceType::SacnInput,
        "dmx_output" => time_manager::SourceType::DmxOutput,
        "cue_list" => time_manager::SourceType::CueList,
        "executor" => time_manager::SourceType::Executor,
        _ => return Err(format!("Unknown source type: {}", source_type)),
    };

    let dur_type = match duration_type.as_str() {
        "finite" => time_manager::DurationType::Finite {
            duration_ms: duration_ms.ok_or("duration_ms required for finite type")?,
        },
        "indefinite" => time_manager::DurationType::Indefinite,
        _ => return Err(format!("Unknown duration type: {}", duration_type)),
    };

    let time_state = time_manager::TimeState::new(id.clone(), name, src_type, dur_type);
    manager.register_state(time_state)?;

    Ok(format!("State {} registered", id))
}

#[tauri::command]
fn start_time_state(
    state: State<AppState>,
    id: String,
) -> std::result::Result<String, String> {
    let manager = state.time_manager.lock().map_err(|e| e.to_string())?;
    manager.start_state(&id)?;
    Ok(format!("State {} started", id))
}

#[tauri::command]
fn pause_time_state(
    state: State<AppState>,
    id: String,
) -> std::result::Result<String, String> {
    let manager = state.time_manager.lock().map_err(|e| e.to_string())?;
    manager.pause_state(&id)?;
    Ok(format!("State {} paused", id))
}

#[tauri::command]
fn stop_time_state(
    state: State<AppState>,
    id: String,
) -> std::result::Result<String, String> {
    let manager = state.time_manager.lock().map_err(|e| e.to_string())?;
    manager.stop_state(&id)?;
    Ok(format!("State {} stopped", id))
}

#[tauri::command]
fn update_all_time_states(
    state: State<AppState>,
) -> std::result::Result<String, String> {
    let manager = state.time_manager.lock().map_err(|e| e.to_string())?;
    manager.update_all_states()?;
    Ok("All states updated".to_string())
}

#[tauri::command]
fn get_time_state(
    state: State<AppState>,
    id: String,
) -> std::result::Result<time_manager::TimeState, String> {
    let manager = state.time_manager.lock().map_err(|e| e.to_string())?;
    manager.get_state(&id)
}

#[tauri::command]
fn get_all_time_states(
    state: State<AppState>,
) -> std::result::Result<Vec<time_manager::TimeState>, String> {
    let manager = state.time_manager.lock().map_err(|e| e.to_string())?;
    manager.get_all_states()
}

#[tauri::command]
fn get_playing_time_states(
    state: State<AppState>,
) -> std::result::Result<Vec<time_manager::TimeState>, String> {
    let manager = state.time_manager.lock().map_err(|e| e.to_string())?;
    manager.get_playing_states()
}

#[tauri::command]
fn create_timeline(
    state: State<AppState>,
    name: String,
    state_ids: Vec<String>,
) -> std::result::Result<String, String> {
    let manager = state.time_manager.lock().map_err(|e| e.to_string())?;
    manager.create_timeline(name, state_ids)
}

#[tauri::command]
fn get_timeline(
    state: State<AppState>,
    id: String,
) -> std::result::Result<time_manager::Timeline, String> {
    let manager = state.time_manager.lock().map_err(|e| e.to_string())?;
    manager.get_timeline(&id)
}

#[tauri::command]
fn get_all_timelines(
    state: State<AppState>,
) -> std::result::Result<Vec<time_manager::Timeline>, String> {
    let manager = state.time_manager.lock().map_err(|e| e.to_string())?;
    manager.get_all_timelines()
}

#[tauri::command]
fn report_frame(
    state: State<AppState>,
    id: String,
    dropped: bool,
) -> std::result::Result<String, String> {
    let manager = state.time_manager.lock().map_err(|e| e.to_string())?;
    manager.report_frame(&id, dropped)?;
    Ok("Frame reported".to_string())
}

#[tauri::command]
fn set_time_state_latency(
    state: State<AppState>,
    id: String,
    latency_ms: f64,
) -> std::result::Result<String, String> {
    let manager = state.time_manager.lock().map_err(|e| e.to_string())?;
    manager.set_latency(&id, latency_ms)?;
    Ok("Latency updated".to_string())
}

// Gamepad capture removed - using Steam Input instead
// The browser Gamepad API works natively with Steam Input

fn main() {
    let dmx_engine = Arc::new(Mutex::new(DmxEngine::new("2.255.255.255".to_string())));
    let fixtures = Arc::new(Mutex::new(HashMap::new()));
    let fixture_library = Arc::new(Mutex::new(HashMap::new()));
    let programmer = Arc::new(Mutex::new(HashMap::new()));

    // Initialize Stream Deck manager
    let streamdeck_manager = Arc::new(Mutex::new(
        streamdeck_support::StreamDeckManager::new()
            .unwrap_or_else(|e| {
                eprintln!("Failed to initialize Stream Deck manager: {}", e);
                panic!("Stream Deck initialization failed");
            })
    ));

    // Initialize Node Manager with default config
    let node_config = node_manager::NodeConfig::default();
    let node_manager = Arc::new(Mutex::new(
        node_manager::NodeManager::new(node_config)
            .unwrap_or_else(|e| {
                eprintln!("Failed to initialize Node Manager: {}", e);
                panic!("Node Manager initialization failed");
            })
    ));

    // Initialize Claude Session Coordinator
    let repo_path = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
    let session_id = uuid::Uuid::new_v4().to_string();
    let machine_name = hostname::get()
        .ok()
        .and_then(|h| h.into_string().ok())
        .unwrap_or_else(|| "unknown".to_string());

    let session_coordinator = Arc::new(Mutex::new(
        claude_session_coordinator::ClaudeSessionCoordinator::new(
            repo_path.clone(),
            session_id,
            machine_name
        )
        .unwrap_or_else(|e| {
            eprintln!("Failed to initialize Session Coordinator: {}", e);
            panic!("Session Coordinator initialization failed");
        })
    ));

    // Initialize Time Manager with 30fps default
    let time_manager = Arc::new(Mutex::new(time_manager::TimeManager::new(time_manager::Framerate::Fps30)));

    // Spawn background task to update all time states every 100ms
    let time_manager_update = Arc::clone(&time_manager);
    tauri::async_runtime::spawn(async move {
        let mut interval = tokio::time::interval(tokio::time::Duration::from_millis(100));
        loop {
            interval.tick().await;
            if let Ok(manager) = time_manager_update.lock() {
                let _ = manager.update_all_states();
            }
        }
    });

    // Setup video directory for web remote
    let video_dir = dirs::video_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("RoControl")
        .join("Videos");

    // Create video directory if it doesn't exist
    let _ = std::fs::create_dir_all(&video_dir);

    // Start web server in background using Tauri's async runtime
    let web_video_dir = video_dir.clone();
    tauri::async_runtime::spawn(async move {
        if let Err(e) = web_server::start_server(web_video_dir).await {
            eprintln!("Web server error: {}", e);
        }
    });

    // Start node API server on port 9000
    let node_api_manager = Arc::clone(&node_manager);
    tauri::async_runtime::spawn(async move {
        if let Err(e) = node_api::start_node_api(node_api_manager).await {
            eprintln!("Node API server error: {}", e);
        }
    });

    tauri::Builder::default()
        .manage(AppState {
            dmx_engine,
            fixtures,
            fixture_library,
            programmer,
            streamdeck_manager,
            node_manager,
            session_coordinator,
            time_manager,
        })
        .invoke_handler(tauri::generate_handler![
            set_dmx_channel,
            set_fixture_channel,
            add_fixture,
            get_fixtures,
            blackout,
            set_protocol,
            parse_gdtf_file,
            get_fixture_library,
            configure_artnet,
            get_network_interfaces,
            set_network_interface,
            execute_cli_command,
            scan_streamdeck_devices,
            connect_streamdeck,
            disconnect_streamdeck,
            set_streamdeck_brightness,
            read_streamdeck_buttons,
            reset_streamdeck,
            clear_streamdeck_buttons,
            get_node_config,
            update_node_config,
            start_node_discovery,
            advertise_node,
            register_node,
            unregister_node,
            get_all_nodes,
            get_node_info,
            update_node_heartbeat,
            register_claude_session,
            session_heartbeat,
            sync_claude_sessions,
            trigger_session_action,
            check_pending_session_actions,
            complete_session_action,
            pull_all_session_logs,
            log_session_message,
            get_session_info,
            register_time_state,
            start_time_state,
            pause_time_state,
            stop_time_state,
            update_all_time_states,
            get_time_state,
            get_all_time_states,
            get_playing_time_states,
            create_timeline,
            get_timeline,
            get_all_timelines,
            report_frame,
            set_time_state_latency,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
