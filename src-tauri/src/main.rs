// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use artnet_protocol::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::net::UdpSocket;
use std::sync::{Arc, Mutex};
use tauri::State;
use std::fs;
use std::io::Read;
use zip::ZipArchive;

// DMX Universe - 512 channels
type DmxUniverse = [u8; 512];

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Fixture {
    id: String,
    name: String,
    fixture_type: String,
    dmx_address: u16,
    universe: u8,
    channel_count: u16,
    gdtf_file: Option<String>,
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

struct DmxEngine {
    universes: HashMap<u8, DmxUniverse>,
    socket: Option<UdpSocket>,
    broadcast_address: String,
}

struct AppState {
    dmx_engine: Arc<Mutex<DmxEngine>>,
    fixtures: Arc<Mutex<HashMap<String, Fixture>>>,
    fixture_library: Arc<Mutex<HashMap<String, GdtfFixtureType>>>,
    programmer: Arc<Mutex<HashMap<String, u8>>>, // fixture_id:channel -> value
}

impl DmxEngine {
    fn new(broadcast_address: String) -> Self {
        let socket = UdpSocket::bind("0.0.0.0:6454").ok();
        DmxEngine {
            universes: HashMap::new(),
            socket,
            broadcast_address,
        }
    }

    fn set_channel(&mut self, universe: u8, channel: u16, value: u8) {
        if channel > 0 && channel <= 512 {
            let dmx_universe = self.universes.entry(universe).or_insert([0u8; 512]);
            dmx_universe[(channel - 1) as usize] = value;
        }
    }

    fn send_artnet(&self, universe: u8) -> Result<(), Box<dyn std::error::Error>> {
        if let Some(socket) = &self.socket {
            let dmx_data = self.universes.get(&universe).unwrap_or(&[0u8; 512]);
            
            let command = ArtCommand::Output(Output {
                length: 512,
                data: dmx_data.into(),
                port_address: universe.into(),
                ..Output::default()
            });

            let bytes = command.write_to_buffer()?;
            socket.send_to(&bytes, format!("{}:6454", self.broadcast_address))?;
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
) -> Result<String, String> {
    let mut engine = state.dmx_engine.lock().map_err(|e| e.to_string())?;
    engine.set_channel(universe, channel, value);
    engine.send_artnet(universe).map_err(|e| e.to_string())?;
    Ok(format!("Set U{} Ch{} to {}", universe, channel, value))
}

#[tauri::command]
fn set_fixture_channel(
    state: State<AppState>,
    fixture_id: String,
    channel_offset: u16,
    value: u8,
) -> Result<String, String> {
    let fixtures = state.fixtures.lock().map_err(|e| e.to_string())?;
    let fixture = fixtures
        .get(&fixture_id)
        .ok_or("Fixture not found")?;

    let mut engine = state.dmx_engine.lock().map_err(|e| e.to_string())?;
    let absolute_channel = fixture.dmx_address + channel_offset;
    engine.set_channel(fixture.universe, absolute_channel, value);
    engine.send_artnet(fixture.universe).map_err(|e| e.to_string())?;

    // Store in programmer
    let mut programmer = state.programmer.lock().map_err(|e| e.to_string())?;
    programmer.insert(format!("{}:{}", fixture_id, channel_offset), value);

    Ok(format!("Set fixture {} channel {} to {}", fixture_id, channel_offset, value))
}

#[tauri::command]
fn add_fixture(
    state: State<AppState>,
    fixture: Fixture,
) -> Result<String, String> {
    let mut fixtures = state.fixtures.lock().map_err(|e| e.to_string())?;
    let id = fixture.id.clone();
    fixtures.insert(id.clone(), fixture);
    Ok(format!("Added fixture {}", id))
}

#[tauri::command]
fn get_fixtures(state: State<AppState>) -> Result<Vec<Fixture>, String> {
    let fixtures = state.fixtures.lock().map_err(|e| e.to_string())?;
    Ok(fixtures.values().cloned().collect())
}

#[tauri::command]
fn blackout(state: State<AppState>) -> Result<String, String> {
    let mut engine = state.dmx_engine.lock().map_err(|e| e.to_string())?;
    engine.blackout();
    for universe in 0..=255 {
        let _ = engine.send_artnet(universe);
    }
    Ok("Blackout activated".to_string())
}

#[tauri::command]
fn parse_gdtf_file(
    state: State<AppState>,
    file_path: String,
) -> Result<GdtfFixtureType, String> {
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
fn get_fixture_library(state: State<AppState>) -> Result<Vec<GdtfFixtureType>, String> {
    let library = state.fixture_library.lock().map_err(|e| e.to_string())?;
    Ok(library.values().cloned().collect())
}

#[tauri::command]
fn configure_artnet(
    state: State<AppState>,
    broadcast_address: String,
) -> Result<String, String> {
    let mut engine = state.dmx_engine.lock().map_err(|e| e.to_string())?;
    engine.broadcast_address = broadcast_address.clone();
    Ok(format!("Art-Net configured to broadcast to {}", broadcast_address))
}

fn main() {
    let dmx_engine = Arc::new(Mutex::new(DmxEngine::new("2.255.255.255".to_string())));
    let fixtures = Arc::new(Mutex::new(HashMap::new()));
    let fixture_library = Arc::new(Mutex::new(HashMap::new()));
    let programmer = Arc::new(Mutex::new(HashMap::new()));

    tauri::Builder::default()
        .manage(AppState {
            dmx_engine,
            fixtures,
            fixture_library,
            programmer,
        })
        .invoke_handler(tauri::generate_handler![
            set_dmx_channel,
            set_fixture_channel,
            add_fixture,
            get_fixtures,
            blackout,
            parse_gdtf_file,
            get_fixture_library,
            configure_artnet,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
