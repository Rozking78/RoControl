# Tauri Backend Requirements

## Overview

The frontend protocol helpers (`artnet.js`, `sacn.js`, `dmxOutputManager.js`) are complete and ready to send DMX data. However, they require Tauri Rust backend commands to perform actual UDP transmission.

This document specifies the required Tauri commands and their implementation.

---

## Required Tauri Commands

### 1. `send_artnet_packet`

**Purpose:** Send a single Art-Net DMX packet via UDP

**Frontend Usage:**
```javascript
await window.__TAURI__.invoke('send_artnet_packet', {
  ipAddress: '2.255.255.255',  // Target IP (broadcast/unicast)
  port: 6454,                   // Art-Net port
  packet: Array.from(packetData) // Uint8Array converted to array
});
```

**Rust Implementation:**

```rust
use tauri::command;
use std::net::UdpSocket;

#[command]
async fn send_artnet_packet(
    ip_address: String,
    port: u16,
    packet: Vec<u8>
) -> Result<(), String> {
    // Create UDP socket
    let socket = UdpSocket::bind("0.0.0.0:0")
        .map_err(|e| format!("Failed to bind socket: {}", e))?;

    // Enable broadcast if needed
    socket.set_broadcast(true)
        .map_err(|e| format!("Failed to set broadcast: {}", e))?;

    // Send packet
    let addr = format!("{}:{}", ip_address, port);
    socket.send_to(&packet, addr)
        .map_err(|e| format!("Failed to send packet: {}", e))?;

    Ok(())
}
```

**Register in main.rs:**
```rust
fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            send_artnet_packet,
            send_sacn_packet
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

---

### 2. `send_sacn_packet`

**Purpose:** Send a single sACN (E1.31) packet via UDP

**Frontend Usage:**
```javascript
await window.__TAURI__.invoke('send_sacn_packet', {
  ipAddress: '239.255.0.1',     // Multicast group or unicast IP
  port: 5568,                    // sACN port
  packet: Array.from(packetData),
  isMulticast: true              // Enable multicast options
});
```

**Rust Implementation:**

```rust
use std::net::{UdpSocket, Ipv4Addr};

#[command]
async fn send_sacn_packet(
    ip_address: String,
    port: u16,
    packet: Vec<u8>,
    is_multicast: bool
) -> Result<(), String> {
    // Create UDP socket
    let socket = UdpSocket::bind("0.0.0.0:0")
        .map_err(|e| format!("Failed to bind socket: {}", e))?;

    // Set multicast TTL if multicast mode
    if is_multicast {
        socket.set_multicast_ttl_v4(64)
            .map_err(|e| format!("Failed to set multicast TTL: {}", e))?;
    }

    // Send packet
    let addr = format!("{}:{}", ip_address, port);
    socket.send_to(&packet, addr)
        .map_err(|e| format!("Failed to send packet: {}", e))?;

    Ok(())
}
```

---

### 3. `send_artnet_universes` (Batch Command - Optional but Recommended)

**Purpose:** Send multiple Art-Net universes in a single call for better performance

**Frontend Usage:**
```javascript
await window.__TAURI__.invoke('send_artnet_universes', {
  ipAddress: '2.255.255.255',
  port: 6454,
  universes: [
    { universe: 0, data: Array.from(dmxData0) },
    { universe: 1, data: Array.from(dmxData1) },
    { universe: 2, data: Array.from(dmxData2) }
  ]
});
```

**Rust Implementation:**

```rust
use serde::Deserialize;

#[derive(Deserialize)]
struct UniverseData {
    universe: u16,
    data: Vec<u8>
}

#[command]
async fn send_artnet_universes(
    ip_address: String,
    port: u16,
    universes: Vec<UniverseData>
) -> Result<(), String> {
    let socket = UdpSocket::bind("0.0.0.0:0")
        .map_err(|e| format!("Failed to bind socket: {}", e))?;

    socket.set_broadcast(true)
        .map_err(|e| format!("Failed to set broadcast: {}", e))?;

    let addr = format!("{}:{}", ip_address, port);

    for universe_data in universes {
        // Build Art-Net packet (use helper function)
        let packet = build_artnet_packet(universe_data.universe, &universe_data.data);

        socket.send_to(&packet, &addr)
            .map_err(|e| format!("Failed to send universe {}: {}", universe_data.universe, e))?;
    }

    Ok(())
}

fn build_artnet_packet(universe: u16, dmx_data: &[u8]) -> Vec<u8> {
    let mut packet = vec![0u8; 18 + 512];

    // Art-Net header "Art-Net\0"
    packet[0..8].copy_from_slice(b"Art-Net\0");

    // OpCode: 0x5000 (ArtDMX) - little endian
    packet[8] = 0x00;
    packet[9] = 0x50;

    // Protocol Version: 14 - big endian
    packet[10] = 0x00;
    packet[11] = 0x0e;

    // Sequence (could be incremented)
    packet[12] = 0;

    // Physical port
    packet[13] = 0;

    // Universe (15-bit) - little endian
    packet[14] = (universe & 0xff) as u8;
    packet[15] = ((universe >> 8) & 0x7f) as u8;

    // Length - big endian
    let length = dmx_data.len().min(512) as u16;
    packet[16] = ((length >> 8) & 0xff) as u8;
    packet[17] = (length & 0xff) as u8;

    // DMX data
    packet[18..18 + length as usize].copy_from_slice(&dmx_data[..length as usize]);

    packet
}
```

---

### 4. `send_sacn_universes` (Batch Command - Optional but Recommended)

**Purpose:** Send multiple sACN universes in a single call

**Frontend Usage:**
```javascript
await window.__TAURI__.invoke('send_sacn_universes', {
  mode: 'multicast',
  port: 5568,
  priority: 100,
  sourceName: 'Steam Deck DMX',
  universes: [
    { universe: 1, data: Array.from(dmxData1) },
    { universe: 2, data: Array.from(dmxData2) }
  ]
});
```

**Rust Implementation:**

```rust
#[command]
async fn send_sacn_universes(
    mode: String,
    port: u16,
    priority: u8,
    source_name: String,
    universes: Vec<UniverseData>
) -> Result<(), String> {
    let socket = UdpSocket::bind("0.0.0.0:0")
        .map_err(|e| format!("Failed to bind socket: {}", e))?;

    if mode == "multicast" {
        socket.set_multicast_ttl_v4(64)
            .map_err(|e| format!("Failed to set multicast TTL: {}", e))?;
    }

    for universe_data in universes {
        // Calculate multicast IP for this universe
        let ip_address = if mode == "multicast" {
            format!("239.255.{}.{}", (universe_data.universe >> 8) & 0xff, universe_data.universe & 0xff)
        } else {
            // For unicast, would need to be passed in
            "127.0.0.1".to_string()
        };

        // Build sACN packet
        let packet = build_sacn_packet(
            universe_data.universe,
            &universe_data.data,
            priority,
            &source_name
        );

        let addr = format!("{}:{}", ip_address, port);
        socket.send_to(&packet, addr)
            .map_err(|e| format!("Failed to send universe {}: {}", universe_data.universe, e))?;
    }

    Ok(())
}

fn build_sacn_packet(universe: u16, dmx_data: &[u8], priority: u8, source_name: &str) -> Vec<u8> {
    let mut packet = vec![0u8; 638];
    let mut offset = 0;

    // Root Layer
    // Preamble Size (2 bytes)
    packet[offset] = 0x00; offset += 1;
    packet[offset] = 0x10; offset += 1;

    // Post-amble Size (2 bytes)
    packet[offset] = 0x00; offset += 1;
    packet[offset] = 0x00; offset += 1;

    // ACN Packet Identifier (12 bytes)
    let acn_id = [0x41, 0x53, 0x43, 0x2d, 0x45, 0x31, 0x2e, 0x31, 0x37, 0x00, 0x00, 0x00];
    packet[offset..offset+12].copy_from_slice(&acn_id);
    offset += 12;

    // Flags and Length (2 bytes) - Root Layer
    let root_length = (638 - 16) as u16 | 0x7000; // Flags: 0x70
    packet[offset] = ((root_length >> 8) & 0xff) as u8; offset += 1;
    packet[offset] = (root_length & 0xff) as u8; offset += 1;

    // Vector (4 bytes) - VECTOR_ROOT_E131_DATA
    packet[offset] = 0x00; offset += 1;
    packet[offset] = 0x00; offset += 1;
    packet[offset] = 0x00; offset += 1;
    packet[offset] = 0x04; offset += 1;

    // CID (16 bytes) - Component Identifier (UUID)
    // For simplicity, use a fixed UUID; should be unique per source
    let cid = [0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0,
               0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0];
    packet[offset..offset+16].copy_from_slice(&cid);
    offset += 16;

    // Framing Layer
    // Flags and Length (2 bytes)
    let frame_length = (638 - 38) as u16 | 0x7000;
    packet[offset] = ((frame_length >> 8) & 0xff) as u8; offset += 1;
    packet[offset] = (frame_length & 0xff) as u8; offset += 1;

    // Vector (4 bytes) - VECTOR_E131_DATA_PACKET
    packet[offset] = 0x00; offset += 1;
    packet[offset] = 0x00; offset += 1;
    packet[offset] = 0x00; offset += 1;
    packet[offset] = 0x02; offset += 1;

    // Source Name (64 bytes) - UTF-8 null-terminated
    let name_bytes = source_name.as_bytes();
    let copy_len = name_bytes.len().min(63);
    packet[offset..offset+copy_len].copy_from_slice(&name_bytes[..copy_len]);
    offset += 64;

    // Priority (1 byte)
    packet[offset] = priority; offset += 1;

    // Synchronization Address (2 bytes) - 0 for no sync
    packet[offset] = 0x00; offset += 1;
    packet[offset] = 0x00; offset += 1;

    // Sequence Number (1 byte) - Could be incremented
    packet[offset] = 0; offset += 1;

    // Options (1 byte)
    packet[offset] = 0x00; offset += 1;

    // Universe (2 bytes) - big endian
    packet[offset] = ((universe >> 8) & 0xff) as u8; offset += 1;
    packet[offset] = (universe & 0xff) as u8; offset += 1;

    // DMP Layer
    // Flags and Length (2 bytes)
    let dmp_length = (638 - 115) as u16 | 0x7000;
    packet[offset] = ((dmp_length >> 8) & 0xff) as u8; offset += 1;
    packet[offset] = (dmp_length & 0xff) as u8; offset += 1;

    // Vector (1 byte) - VECTOR_DMP_SET_PROPERTY
    packet[offset] = 0x02; offset += 1;

    // Address Type & Data Type (1 byte)
    packet[offset] = 0xa1; offset += 1;

    // First Property Address (2 bytes)
    packet[offset] = 0x00; offset += 1;
    packet[offset] = 0x00; offset += 1;

    // Address Increment (2 bytes)
    packet[offset] = 0x00; offset += 1;
    packet[offset] = 0x01; offset += 1;

    // Property value count (2 bytes) - 513 (1 start code + 512 DMX)
    packet[offset] = 0x02; offset += 1;
    packet[offset] = 0x01; offset += 1;

    // DMX Start Code (1 byte)
    packet[offset] = 0x00; offset += 1;

    // DMX Data (512 bytes)
    let copy_len = dmx_data.len().min(512);
    packet[offset..offset+copy_len].copy_from_slice(&dmx_data[..copy_len]);

    packet
}
```

---

## Cargo.toml Dependencies

Add these dependencies to `src-tauri/Cargo.toml`:

```toml
[dependencies]
tauri = { version = "2.2.0", features = [] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
```

No additional crates needed - UDP sockets are in `std::net`.

---

## Permission Configuration

Update `src-tauri/capabilities/default.json` to allow network access:

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Capability for the main window",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "core:window:allow-create",
    "core:window:allow-center",
    "core:window:allow-request-user-attention",
    "core:window:allow-set-resizable",
    "core:window:allow-set-maximizable",
    "core:window:allow-set-minimizable",
    "core:window:allow-set-closable",
    "core:window:allow-set-title",
    "core:window:allow-maximize",
    "core:window:allow-unmaximize",
    "core:window:allow-minimize",
    "core:window:allow-unminimize",
    "core:window:allow-show",
    "core:window:allow-hide",
    "core:window:allow-close",
    "core:window:allow-set-decorations",
    "core:window:allow-set-always-on-top",
    "core:window:allow-set-content-protected",
    "core:window:allow-set-size",
    "core:window:allow-set-min-size",
    "core:window:allow-set-max-size",
    "core:window:allow-set-position",
    "core:window:allow-set-fullscreen",
    "core:window:allow-set-focus",
    "core:window:allow-set-icon",
    "core:window:allow-set-skip-taskbar",
    "core:window:allow-set-cursor-grab",
    "core:window:allow-set-cursor-visible",
    "core:window:allow-set-cursor-icon",
    "core:window:allow-set-cursor-position",
    "core:window:allow-set-ignore-cursor-events",
    "core:window:allow-start-dragging",
    "core:window:allow-print"
  ]
}
```

**Note:** Tauri v2 network permissions are implicit through Rust's std library. No additional permissions needed.

---

## Complete src-tauri/src/main.rs Example

```rust
// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::command;
use std::net::UdpSocket;
use serde::Deserialize;

#[derive(Deserialize)]
struct UniverseData {
    universe: u16,
    data: Vec<u8>,
}

// Single Art-Net packet
#[command]
async fn send_artnet_packet(
    ip_address: String,
    port: u16,
    packet: Vec<u8>,
) -> Result<(), String> {
    let socket = UdpSocket::bind("0.0.0.0:0")
        .map_err(|e| format!("Failed to bind socket: {}", e))?;

    socket
        .set_broadcast(true)
        .map_err(|e| format!("Failed to set broadcast: {}", e))?;

    let addr = format!("{}:{}", ip_address, port);
    socket
        .send_to(&packet, addr)
        .map_err(|e| format!("Failed to send packet: {}", e))?;

    Ok(())
}

// Multiple Art-Net universes
#[command]
async fn send_artnet_universes(
    ip_address: String,
    port: u16,
    universes: Vec<UniverseData>,
) -> Result<(), String> {
    let socket = UdpSocket::bind("0.0.0.0:0")
        .map_err(|e| format!("Failed to bind socket: {}", e))?;

    socket
        .set_broadcast(true)
        .map_err(|e| format!("Failed to set broadcast: {}", e))?;

    let addr = format!("{}:{}", ip_address, port);

    for universe_data in universes {
        let packet = build_artnet_packet(universe_data.universe, &universe_data.data);

        socket
            .send_to(&packet, &addr)
            .map_err(|e| format!("Failed to send universe {}: {}", universe_data.universe, e))?;
    }

    Ok(())
}

// Single sACN packet
#[command]
async fn send_sacn_packet(
    ip_address: String,
    port: u16,
    packet: Vec<u8>,
    is_multicast: bool,
) -> Result<(), String> {
    let socket = UdpSocket::bind("0.0.0.0:0")
        .map_err(|e| format!("Failed to bind socket: {}", e))?;

    if is_multicast {
        socket
            .set_multicast_ttl_v4(64)
            .map_err(|e| format!("Failed to set multicast TTL: {}", e))?;
    }

    let addr = format!("{}:{}", ip_address, port);
    socket
        .send_to(&packet, addr)
        .map_err(|e| format!("Failed to send packet: {}", e))?;

    Ok(())
}

// Multiple sACN universes
#[command]
async fn send_sacn_universes(
    mode: String,
    port: u16,
    priority: u8,
    source_name: String,
    universes: Vec<UniverseData>,
) -> Result<(), String> {
    let socket = UdpSocket::bind("0.0.0.0:0")
        .map_err(|e| format!("Failed to bind socket: {}", e))?;

    if mode == "multicast" {
        socket
            .set_multicast_ttl_v4(64)
            .map_err(|e| format!("Failed to set multicast TTL: {}", e))?;
    }

    for universe_data in universes {
        let ip_address = if mode == "multicast" {
            format!(
                "239.255.{}.{}",
                (universe_data.universe >> 8) & 0xff,
                universe_data.universe & 0xff
            )
        } else {
            // For unicast, would need IP per universe or single IP
            "127.0.0.1".to_string()
        };

        let packet = build_sacn_packet(
            universe_data.universe,
            &universe_data.data,
            priority,
            &source_name,
        );

        let addr = format!("{}:{}", ip_address, port);
        socket
            .send_to(&packet, addr)
            .map_err(|e| format!("Failed to send universe {}: {}", universe_data.universe, e))?;
    }

    Ok(())
}

// Helper: Build Art-Net packet
fn build_artnet_packet(universe: u16, dmx_data: &[u8]) -> Vec<u8> {
    let mut packet = vec![0u8; 18 + 512];

    packet[0..8].copy_from_slice(b"Art-Net\0");
    packet[8] = 0x00;
    packet[9] = 0x50;
    packet[10] = 0x00;
    packet[11] = 0x0e;
    packet[12] = 0;
    packet[13] = 0;
    packet[14] = (universe & 0xff) as u8;
    packet[15] = ((universe >> 8) & 0x7f) as u8;

    let length = dmx_data.len().min(512) as u16;
    packet[16] = ((length >> 8) & 0xff) as u8;
    packet[17] = (length & 0xff) as u8;

    packet[18..18 + length as usize].copy_from_slice(&dmx_data[..length as usize]);

    packet
}

// Helper: Build sACN packet
fn build_sacn_packet(universe: u16, dmx_data: &[u8], priority: u8, source_name: &str) -> Vec<u8> {
    let mut packet = vec![0u8; 638];
    let mut offset = 0;

    // Root Layer
    packet[offset] = 0x00; offset += 1;
    packet[offset] = 0x10; offset += 1;
    packet[offset] = 0x00; offset += 1;
    packet[offset] = 0x00; offset += 1;

    let acn_id = [0x41, 0x53, 0x43, 0x2d, 0x45, 0x31, 0x2e, 0x31, 0x37, 0x00, 0x00, 0x00];
    packet[offset..offset + 12].copy_from_slice(&acn_id);
    offset += 12;

    let root_length = (638 - 16) as u16 | 0x7000;
    packet[offset] = ((root_length >> 8) & 0xff) as u8; offset += 1;
    packet[offset] = (root_length & 0xff) as u8; offset += 1;

    packet[offset..offset + 4].copy_from_slice(&[0x00, 0x00, 0x00, 0x04]);
    offset += 4;

    let cid = [0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0,
               0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0];
    packet[offset..offset + 16].copy_from_slice(&cid);
    offset += 16;

    // Framing Layer
    let frame_length = (638 - 38) as u16 | 0x7000;
    packet[offset] = ((frame_length >> 8) & 0xff) as u8; offset += 1;
    packet[offset] = (frame_length & 0xff) as u8; offset += 1;

    packet[offset..offset + 4].copy_from_slice(&[0x00, 0x00, 0x00, 0x02]);
    offset += 4;

    let name_bytes = source_name.as_bytes();
    let copy_len = name_bytes.len().min(63);
    packet[offset..offset + copy_len].copy_from_slice(&name_bytes[..copy_len]);
    offset += 64;

    packet[offset] = priority; offset += 1;
    packet[offset] = 0x00; offset += 1;
    packet[offset] = 0x00; offset += 1;
    packet[offset] = 0; offset += 1;
    packet[offset] = 0x00; offset += 1;

    packet[offset] = ((universe >> 8) & 0xff) as u8; offset += 1;
    packet[offset] = (universe & 0xff) as u8; offset += 1;

    // DMP Layer
    let dmp_length = (638 - 115) as u16 | 0x7000;
    packet[offset] = ((dmp_length >> 8) & 0xff) as u8; offset += 1;
    packet[offset] = (dmp_length & 0xff) as u8; offset += 1;

    packet[offset] = 0x02; offset += 1;
    packet[offset] = 0xa1; offset += 1;
    packet[offset] = 0x00; offset += 1;
    packet[offset] = 0x00; offset += 1;
    packet[offset] = 0x00; offset += 1;
    packet[offset] = 0x01; offset += 1;
    packet[offset] = 0x02; offset += 1;
    packet[offset] = 0x01; offset += 1;
    packet[offset] = 0x00; offset += 1;

    let copy_len = dmx_data.len().min(512);
    packet[offset..offset + copy_len].copy_from_slice(&dmx_data[..copy_len]);

    packet
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            send_artnet_packet,
            send_artnet_universes,
            send_sacn_packet,
            send_sacn_universes
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

---

## Testing the Backend

### 1. Build Tauri App

```bash
npm run tauri build
```

### 2. Test Art-Net Output

Use a DMX monitoring tool like:
- **QLC+** (free, cross-platform)
- **DMX Workshop** (Windows)
- **Art-Net View** (Windows)

Configure the tool to listen on universe 0 and verify packets are received.

### 3. Test sACN Output

Use sACN monitoring tools:
- **sACN View** (free, Windows)
- **QLC+** (supports sACN input)

Join multicast group 239.255.0.1 (universe 1) and verify packets.

### 4. Wireshark Packet Capture

For detailed debugging:

```bash
# Capture Art-Net packets
sudo tcpdump -i any -n udp port 6454

# Capture sACN packets
sudo tcpdump -i any -n udp port 5568
```

---

## Frontend Updates Required

Once Tauri commands are implemented, update the frontend helpers to use batch commands for better performance:

**src/utils/artnet.js:**
```javascript
export async function sendArtNetUniverses(config, universes) {
  if (!window.__TAURI__) {
    console.warn('Tauri not available');
    return;
  }

  const universeArray = Object.entries(universes).map(([universeNum, dmxData]) => ({
    universe: parseInt(universeNum),
    data: Array.from(dmxData)
  }));

  await window.__TAURI__.invoke('send_artnet_universes', {
    ipAddress: config.ipAddress,
    port: config.port,
    universes: universeArray
  });
}
```

**src/utils/sacn.js:**
```javascript
export async function sendSACNUniverses(config, universes) {
  if (!window.__TAURI__) {
    console.warn('Tauri not available');
    return;
  }

  const universeArray = Object.entries(universes).map(([universeNum, dmxData]) => ({
    universe: parseInt(universeNum),
    data: Array.from(dmxData)
  }));

  await window.__TAURI__.invoke('send_sacn_universes', {
    mode: config.mode,
    port: config.port,
    priority: config.priority,
    sourceName: config.sourceName,
    universes: universeArray
  });
}
```

---

## Performance Considerations

### UDP Socket Reuse

For optimal performance at 44Hz, consider keeping sockets open:

```rust
use std::sync::Mutex;
use std::collections::HashMap;

// Global socket pool
lazy_static! {
    static ref SOCKET_POOL: Mutex<HashMap<String, UdpSocket>> = Mutex::new(HashMap::new());
}

#[command]
async fn send_artnet_universes_optimized(
    ip_address: String,
    port: u16,
    universes: Vec<UniverseData>,
) -> Result<(), String> {
    let socket_key = format!("artnet_{}_{}", ip_address, port);

    let mut pool = SOCKET_POOL.lock().unwrap();
    let socket = pool.entry(socket_key).or_insert_with(|| {
        let s = UdpSocket::bind("0.0.0.0:0").unwrap();
        s.set_broadcast(true).unwrap();
        s
    });

    let addr = format!("{}:{}", ip_address, port);
    for universe_data in universes {
        let packet = build_artnet_packet(universe_data.universe, &universe_data.data);
        socket.send_to(&packet, &addr)
            .map_err(|e| format!("Send failed: {}", e))?;
    }

    Ok(())
}
```

Add to Cargo.toml:
```toml
lazy_static = "1.4"
```

---

## Summary

**Required Implementations:**
1. ✅ `send_artnet_packet` - Single Art-Net packet
2. ✅ `send_sacn_packet` - Single sACN packet
3. ✅ `send_artnet_universes` - Batch Art-Net (recommended)
4. ✅ `send_sacn_universes` - Batch sACN (recommended)

**Next Steps:**
1. Copy Rust code to `src-tauri/src/main.rs`
2. Build with `npm run tauri build`
3. Test with DMX monitoring tools
4. Verify 44Hz output performance
5. Deploy to Steam Deck

**Performance Target:** 44 Hz (22.7ms per frame) across 4+ universes simultaneously
