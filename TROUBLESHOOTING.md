# Troubleshooting & Testing Guide

## Quick Diagnostics

### 1. Check Application Status

**Is the app running?**
```bash
ps aux | grep steamdeck-dmx-controller
```

**Check for errors:**
```bash
# If running from terminal, check console output
./steamdeck-dmx-controller
```

### 2. Network Connectivity

**Test Art-Net broadcast:**
```bash
# Listen for Art-Net packets
sudo tcpdump -i any udp port 6454 -v

# You should see Art-Net packets when DMX is active
```

**Check network interface:**
```bash
ip addr show
# Look for your active network interface (wlan0, eth0, etc.)
```

**Ping your Art-Net node:**
```bash
ping 2.0.0.1  # Replace with your node's IP
```

### 3. DMX Output Test

**Manual DMX Channel Test:**
1. Open developer console (F12)
2. Run this in console:
```javascript
await invoke('set_dmx_channel', {
  universe: 0,
  channel: 1,
  value: 255
})
```

**Test Pattern:**
Send full white to first 10 channels:
```javascript
for (let i = 1; i <= 10; i++) {
  await invoke('set_dmx_channel', {
    universe: 0,
    channel: i,
    value: 255
  })
}
```

## Common Issues & Solutions

### Issue: No DMX Output

**Symptoms:** Fixtures don't respond, no changes visible

**Solutions:**

1. **Verify Network Configuration**
   ```javascript
   // Check broadcast address
   await invoke('configure_artnet', { 
     broadcast_address: '2.255.255.255' 
   })
   ```

2. **Check Firewall**
   ```bash
   # SteamOS/Linux
   sudo ufw allow 6454/udp
   
   # Or disable firewall temporarily for testing
   sudo ufw disable
   ```

3. **Verify Art-Net Node Setup**
   - Ensure node is powered on
   - Check node is on same network subnet
   - Verify node is in Art-Net mode (not DMX512)
   - Check universe settings match

4. **Test with Art-Net Monitor Software**
   - Download Art-Net View or similar
   - Confirm packets are being sent
   - Verify universe and channel data

### Issue: Gamepad Not Working

**Symptoms:** Steam Deck controls don't affect lighting

**Solutions:**

1. **Test Gamepad API**
   Open console (F12):
   ```javascript
   const gamepads = navigator.getGamepads()
   console.log(gamepads)
   // Should show gamepad if connected
   ```

2. **Switch Gaming/Desktop Mode**
   - Try switching between Desktop and Gaming mode
   - Some gamepad features work better in Gaming mode

3. **Check Steam Input**
   - Open Steam settings
   - Controller → General Controller Settings
   - Ensure "Steam Input" is enabled

4. **Manual Control Test**
   Use keyboard/mouse first to verify fixture control works

### Issue: Fixtures Respond Incorrectly

**Symptoms:** Wrong colors, erratic movement, flickering

**Solutions:**

1. **Verify DMX Addressing**
   ```javascript
   // List all patched fixtures
   const fixtures = await invoke('get_fixtures')
   console.log(fixtures)
   
   // Check for address conflicts
   fixtures.forEach(f => {
     console.log(`${f.name}: U${f.universe} @${f.dmx_address}`)
   })
   ```

2. **Check Fixture Mode**
   - Ensure fixture is in correct DMX mode
   - Some fixtures have 3-4 different channel modes
   - Match mode in fixture menu to what's patched

3. **Test Individual Channels**
   ```javascript
   // Test each channel one by one
   for (let i = 0; i < 16; i++) {
     await invoke('set_fixture_channel', {
       fixtureId: 'fx1',
       channelOffset: i,
       value: 255
     })
     await new Promise(r => setTimeout(r, 1000))
     await invoke('set_fixture_channel', {
       fixtureId: 'fx1',
       channelOffset: i,
       value: 0
     })
   }
   ```

4. **Verify DMX Cable & Termination**
   - Check 3-pin or 5-pin DMX cable is correct
   - Add 120Ω terminator at end of DMX line
   - Test with shorter cable run

### Issue: High Latency / Lag

**Symptoms:** Controls feel sluggish, delayed response

**Solutions:**

1. **Check Network Performance**
   ```bash
   # Test network latency
   ping -c 100 2.0.0.1
   ```

2. **Reduce Refresh Rate (if needed)**
   - Art-Net standard is 44fps
   - Can reduce if network is congested

3. **Optimize WiFi Connection**
   - Use 5GHz band if possible
   - Reduce distance to access point
   - Consider USB Ethernet adapter for Steam Deck

4. **Close Background Apps**
   - Free up CPU/RAM on Steam Deck
   - Disable Steam overlay if needed

### Issue: App Crashes / Freezes

**Symptoms:** Application becomes unresponsive

**Solutions:**

1. **Check System Resources**
   ```bash
   htop
   # Look for high CPU/RAM usage
   ```

2. **View Application Logs**
   ```bash
   journalctl -f | grep steamdeck-dmx
   ```

3. **Reset Configuration**
   ```bash
   rm -rf ~/.local/share/steamdeck-dmx/
   ```

4. **Rebuild Application**
   ```bash
   cd ~/steamdeck-dmx-controller
   npm run tauri:build
   ```

## Testing Checklist

### Basic Functionality Test

- [ ] Application launches successfully
- [ ] UI displays correctly (1280x800)
- [ ] Can select fixtures in left panel
- [ ] Encoder wheels respond to clicks
- [ ] Faders can be adjusted
- [ ] Quick action buttons work (Blackout, Locate, Clear)

### DMX Output Test

- [ ] Can set individual DMX channels
- [ ] Fixtures respond to channel changes
- [ ] Multiple fixtures can be controlled simultaneously
- [ ] Color mixing works correctly (RGB)
- [ ] Dimmer control functions properly
- [ ] Blackout command works instantly

### Gamepad Test (Steam Deck)

- [ ] Left joystick controls Pan/Tilt
- [ ] Right trigger (R2) controls Dimmer
- [ ] D-Pad navigates fixture selection
- [ ] A button selects fixtures
- [ ] B button triggers blackout
- [ ] X button activates locate
- [ ] Y button clears programmer
- [ ] Bumpers change pages (if implemented)

### Touch Screen Test

- [ ] Can tap fixtures to select
- [ ] Can tap encoders to adjust
- [ ] Can drag faders
- [ ] Touch targets are appropriately sized
- [ ] Multi-touch works for simultaneous controls

### Network Test

- [ ] Art-Net packets are being sent (tcpdump)
- [ ] Correct universe numbers in packets
- [ ] Channel values match what was set
- [ ] No packet loss or errors
- [ ] Multiple universes work (if applicable)

### Performance Test

- [ ] Smooth 60fps UI rendering
- [ ] < 20ms control latency
- [ ] No dropped DMX frames
- [ ] Handles 10+ fixtures simultaneously
- [ ] No memory leaks after extended use

## Test Fixtures & Equipment

### Recommended Test Setup

**Minimal Setup:**
- 1x Art-Net to DMX interface
- 1x LED PAR RGB fixture
- DMX cable
- Network connection

**Full Test Setup:**
- Art-Net node (DMXKing eDMX1, Enttec ODE)
- 2x LED PAR RGBW fixtures
- 1x Moving head spot
- DMX cables with terminator
- Gigabit ethernet or 5GHz WiFi

### Recommended Hardware

**Art-Net Nodes:**
- DMXKing eDMX1 ($130) - Reliable, widely compatible
- Enttec ODE ($250) - Professional grade
- Artnet-DMX.com DIY solutions ($50-100) - Budget friendly

**USB DMX (Future Support):**
- Enttec DMX USB Pro ($120)
- DMXKing ultraDMX Micro ($65)

**WiFi Recommendations for Steam Deck:**
- 5GHz band strongly preferred
- WPA2/WPA3 encryption
- Dedicated VLAN for lighting if possible
- < 10ms ping to Art-Net node

## Performance Benchmarks

**Target Metrics:**
- DMX refresh rate: 40-44 fps (Art-Net standard)
- Control latency: < 50ms from input to DMX output
- UI frame rate: 60fps
- Memory usage: < 200MB RAM
- CPU usage: < 15% average (Steam Deck)

**Actual Performance (Expected):**
- DMX refresh: 44fps (Art-Net locked)
- Control latency: 20-30ms
- UI rendering: 60fps
- RAM usage: ~150MB
- CPU usage: ~10% (optimized Rust backend)

## Debug Mode

Enable verbose logging for troubleshooting:

```bash
# Set environment variable
export RUST_LOG=debug

# Run application
./steamdeck-dmx-controller
```

Or in code:
```javascript
// Enable console logging
localStorage.setItem('debug', 'true')
```

## Getting Help

If issues persist:

1. **Collect Information:**
   - Application version
   - SteamOS version
   - Network configuration
   - Fixture models and DMX modes
   - Error messages or logs

2. **Check Documentation:**
   - README.md
   - GDTF_GUIDE.md
   - GitHub Issues

3. **Community Support:**
   - Discord: [Join our community]
   - Reddit: r/lightingdesign
   - GitHub: Open an issue

4. **Create Issue Report:**
   Include:
   - Steps to reproduce
   - Expected vs actual behavior
   - System information
   - Screenshots if relevant
   - Console logs

## Developer Testing

For contributors testing new features:

```bash
# Run in development mode with hot reload
npm run tauri:dev

# Run with debug logging
RUST_LOG=debug npm run tauri:dev

# Build and test production version
npm run tauri:build
./src-tauri/target/release/steamdeck-dmx-controller

# Run Rust tests
cd src-tauri
cargo test

# Run with specific Art-Net address
ARTNET_BROADCAST=10.0.0.255 npm run tauri:dev
```

## Known Limitations

Current version limitations:
- Single universe output (will expand to 64)
- Basic GDTF parsing (doesn't parse all XML elements yet)
- No cue list playback (coming in v0.2)
- No effects engine (coming in v0.3)
- Art-Net only (sACN in v0.4)

These are actively being developed!
