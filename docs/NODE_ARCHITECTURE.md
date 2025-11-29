# RocKontrol Node Architecture Design

## Overview

RocKontrol Media Server supports a distributed node architecture where each instance can operate as either a **Master Node** or a **Receiver Node**, enabling multi-device coordination and show synchronization.

## Architecture Types

### Master Node
- **Controls** multiple receiver nodes
- **Sends** DMX data, cues, and media commands
- **Coordinates** timing and synchronization
- **Manages** the show state
- Can also output DMX locally

### Receiver Node (Fixed Receiver)
- **Receives** commands from master node
- **Executes** DMX output to local universe
- **Plays back** assigned media content
- **Reports** status back to master
- Lightweight - optimized for Steam Deck deployment

## Network Communication

### Protocol Stack
- **Discovery**: mDNS/Bonjour for automatic node discovery
- **Control**: WebSocket for real-time command delivery
- **Data**: Art-Net/sACN for DMX distribution
- **Media**: HTTP/REST for media file transfer
- **Sync**: NTP/PTP for timing synchronization

### Message Types
1. **Command Messages**
   - Cue execution
   - Blackout/Clear
   - Intensity changes
   - Media playback control

2. **Status Messages**
   - Node health
   - DMX output confirmation
   - Media playback state
   - Network statistics

3. **Sync Messages**
   - Timecode
   - Beat/BPM
   - Show clock

## Node Configuration

### Master Node Setup
```json
{
  "role": "master",
  "node_id": "master-01",
  "listen_port": 9000,
  "broadcast_enabled": true,
  "managed_nodes": [
    {
      "node_id": "node-01",
      "ip": "192.168.1.101",
      "universe_map": [1, 2],
      "role": "dmx_output"
    },
    {
      "node_id": "node-02",
      "ip": "192.168.1.102",
      "universe_map": [3, 4],
      "role": "media_server"
    }
  ]
}
```

### Receiver Node Setup
```json
{
  "role": "receiver",
  "node_id": "node-01",
  "master_ip": "192.168.1.100",
  "master_port": 9000,
  "local_universes": [1, 2],
  "capabilities": ["dmx_output", "media_playback"],
  "auto_discover": true
}
```

## Implementation Plan

### Phase 1: Node Framework
- [ ] Node discovery service (mDNS)
- [ ] Node registration system
- [ ] Basic master/receiver handshake
- [ ] Health monitoring

### Phase 2: Command Distribution
- [ ] WebSocket command relay
- [ ] DMX data forwarding
- [ ] Universe routing
- [ ] Command queuing/buffering

### Phase 3: Media Sync
- [ ] Media library synchronization
- [ ] Distributed playback control
- [ ] Frame-accurate sync
- [ ] Timecode distribution

### Phase 4: Advanced Features
- [ ] Failover support (backup master)
- [ ] Load balancing
- [ ] Multi-master clusters
- [ ] Node performance metrics

## Use Cases

### 1. Multi-Universe DMX Output
**Setup**: 1 Master (Steam Deck) + 3 Receiver Nodes (Raspberry Pi)
- Master: Programming and control
- Node 1: Universes 1-4
- Node 2: Universes 5-8
- Node 3: Universes 9-12

### 2. Distributed Media Server
**Setup**: 1 Master + Multiple Media Nodes
- Master: Cue control and timing
- Media Nodes: Each outputs to different LED walls/screens
- Synchronized playback across all nodes

### 3. Redundant Backup
**Setup**: 2 Masters in failover mode
- Primary Master: Active control
- Secondary Master: Hot standby
- Automatic failover on primary failure

## API Design

### Master Node Endpoints

#### Register Node
```
POST /api/nodes/register
{
  "node_id": "node-01",
  "capabilities": ["dmx_output"],
  "universes": [1, 2]
}
```

#### Send Command to Node
```
POST /api/nodes/{node_id}/command
{
  "type": "cue",
  "cue_id": 1.5,
  "fade_time": 3.0
}
```

#### Get Node Status
```
GET /api/nodes/{node_id}/status
Response:
{
  "online": true,
  "last_heartbeat": "2024-11-29T12:00:00Z",
  "dmx_fps": 44,
  "cpu_usage": 15.2
}
```

### Receiver Node Endpoints

#### Report Status
```
POST /api/master/heartbeat
{
  "node_id": "node-01",
  "status": "online",
  "metrics": {
    "dmx_fps": 44,
    "cpu_usage": 15.2
  }
}
```

#### Acknowledge Command
```
POST /api/master/ack
{
  "node_id": "node-01",
  "command_id": "cmd-12345",
  "status": "executed"
}
```

## Security Considerations

### Authentication
- Node registration requires API key
- Master validates all node connections
- TLS/SSL for command transmission

### Authorization
- Universe permissions per node
- Command filtering based on role
- Read-only vs control access

### Network Security
- Firewall rules for node communication
- VLAN isolation recommended
- Encrypted command payloads

## Performance Targets

- **Command Latency**: < 10ms master to node
- **DMX Sync**: ±1ms across all nodes
- **Heartbeat**: 1Hz (1 update/second)
- **Max Nodes**: 100 receivers per master
- **Bandwidth**: < 100 Mbps per node (1 Gbps recommended)

## Configuration UI

### Master Node View
- Node topology map
- Real-time status indicators
- Universe assignment matrix
- Performance graphs
- Quick actions (restart node, test connection)

### Receiver Node View
- Master connection status
- Local universe output
- Command log/history
- Resource usage monitor
- Simple troubleshooting tools

## Error Handling

### Connection Loss
1. Receiver detects master offline
2. Continue last state OR blackout (configurable)
3. Attempt reconnection every 5 seconds
4. Log all offline commands for sync

### Command Failure
1. Node reports failure to master
2. Master retries (max 3 attempts)
3. Alert operator on persistent failure
4. Mark node as degraded

### Split Brain Prevention
- Only one master per network segment
- Election protocol for failover
- Unique master ID validation
- Lock file on startup

## Future Enhancements

- **Cloud Integration**: Remote node management
- **Mobile Nodes**: 4G/5G connected receivers
- **Mesh Networking**: Node-to-node relay
- **AI Load Balancing**: Automatic universe distribution
- **Remote Show Upload**: Push shows to nodes
- **Centralized Logging**: Aggregate logs from all nodes

## Technical Requirements

### Master Node
- **CPU**: Multi-core (4+ cores recommended)
- **RAM**: 4GB minimum, 8GB recommended
- **Network**: Gigabit Ethernet
- **Storage**: SSD for media library

### Receiver Node
- **CPU**: Dual-core minimum
- **RAM**: 2GB minimum
- **Network**: 100Mbps minimum, Gigabit preferred
- **Storage**: SD card or small SSD

## Testing Strategy

### Unit Tests
- Node discovery
- Command serialization
- Universe routing
- Failover logic

### Integration Tests
- Master-receiver handshake
- Multi-node command broadcast
- Network failure recovery
- Media sync accuracy

### Load Tests
- 100 simultaneous nodes
- 1000 commands/second
- 512 universes (100K+ channels)
- 10+ 4K video streams

---

**Document Version**: 1.0
**Last Updated**: 2024-11-29
**Status**: Design Phase
**Target Release**: RocKontrol Media Server v1.0
