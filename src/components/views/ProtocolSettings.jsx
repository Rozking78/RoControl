import React, { useState } from 'react';
import '../../styles/views/ProtocolSettings.css';
import { ArtNetConfig } from '../../utils/artnet';
import { SACNConfig } from '../../utils/sacn';

const ProtocolSettings = (props) => {
  const {
    artnetConfig = new ArtNetConfig(),
    sacnConfig = new SACNConfig(),
    setArtnetConfig,
    setSacnConfig
  } = props;

  const [activeTab, setActiveTab] = useState('artnet');

  // Art-Net handlers
  const handleArtNetToggle = () => {
    const newConfig = new ArtNetConfig({
      ...artnetConfig.toJSON(),
      enabled: !artnetConfig.enabled
    });
    if (setArtnetConfig) {
      setArtnetConfig(newConfig);
    }
  };

  const handleArtNetChange = (field, value) => {
    const newConfig = new ArtNetConfig({
      ...artnetConfig.toJSON(),
      [field]: value
    });
    if (setArtnetConfig) {
      setArtnetConfig(newConfig);
    }
  };

  // sACN handlers
  const handleSACNToggle = () => {
    const newConfig = new SACNConfig({
      ...sacnConfig.toJSON(),
      enabled: !sacnConfig.enabled
    });
    if (setSacnConfig) {
      setSacnConfig(newConfig);
    }
  };

  const handleSACNChange = (field, value) => {
    const newConfig = new SACNConfig({
      ...sacnConfig.toJSON(),
      [field]: value
    });
    if (setSacnConfig) {
      setSacnConfig(newConfig);
    }
  };

  return (
    <div className="protocol-settings">
      <div className="protocol-settings-header">
        <h3>Protocol Settings</h3>
        <div className="protocol-status">
          {artnetConfig.enabled && <span className="status-badge artnet">Art-Net ✓</span>}
          {sacnConfig.enabled && <span className="status-badge sacn">sACN ✓</span>}
        </div>
      </div>

      {/* Protocol Tabs */}
      <div className="protocol-tabs">
        <button
          className={`protocol-tab ${activeTab === 'artnet' ? 'active' : ''}`}
          onClick={() => setActiveTab('artnet')}
        >
          Art-Net
        </button>
        <button
          className={`protocol-tab ${activeTab === 'sacn' ? 'active' : ''}`}
          onClick={() => setActiveTab('sacn')}
        >
          sACN (E1.31)
        </button>
      </div>

      {/* Art-Net Settings */}
      {activeTab === 'artnet' && (
        <div className="protocol-panel">
          <div className="protocol-enable">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={artnetConfig.enabled}
                onChange={handleArtNetToggle}
                className="toggle-checkbox"
              />
              <span className="toggle-slider"></span>
              <span className="toggle-text">
                {artnetConfig.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </label>
          </div>

          <div className="setting-group">
            <label>Transmission Mode</label>
            <select
              value={artnetConfig.mode}
              onChange={(e) => handleArtNetChange('mode', e.target.value)}
              className="setting-select"
            >
              <option value="broadcast">Broadcast (2.255.255.255)</option>
              <option value="unicast">Unicast (Direct IP)</option>
              <option value="multicast">Multicast</option>
            </select>
          </div>

          {artnetConfig.mode === 'unicast' && (
            <div className="setting-group">
              <label>Target IP Address</label>
              <input
                type="text"
                inputMode="text"
                value={artnetConfig.ipAddress}
                onChange={(e) => handleArtNetChange('ipAddress', e.target.value)}
                placeholder="192.168.1.100"
                className="setting-input"
              />
            </div>
          )}

          <div className="setting-group">
            <label>Port</label>
            <input
              type="number"
              inputMode="numeric"
              value={artnetConfig.port}
              onChange={(e) => handleArtNetChange('port', parseInt(e.target.value))}
              min="1"
              max="65535"
              className="setting-input"
            />
            <span className="setting-hint">Default: 6454</span>
          </div>

          <div className="setting-row">
            <div className="setting-group">
              <label>Universe Start</label>
              <input
                type="number"
                inputMode="numeric"
                value={artnetConfig.universeStart}
                onChange={(e) => handleArtNetChange('universeStart', parseInt(e.target.value))}
                min="0"
                max="32767"
                className="setting-input"
              />
            </div>

            <div className="setting-group">
              <label>Universe Range</label>
              <input
                type="number"
                inputMode="numeric"
                value={artnetConfig.universeRange}
                onChange={(e) => handleArtNetChange('universeRange', parseInt(e.target.value))}
                min="1"
                max="256"
                className="setting-input"
              />
            </div>
          </div>

          <div className="protocol-info">
            <p>
              <strong>Art-Net</strong> is a royalty-free DMX over Ethernet protocol.
              Broadcasts on port 6454. Supports up to 32,768 universes.
            </p>
          </div>
        </div>
      )}

      {/* sACN Settings */}
      {activeTab === 'sacn' && (
        <div className="protocol-panel">
          <div className="protocol-enable">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={sacnConfig.enabled}
                onChange={handleSACNToggle}
                className="toggle-checkbox"
              />
              <span className="toggle-slider"></span>
              <span className="toggle-text">
                {sacnConfig.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </label>
          </div>

          <div className="setting-group">
            <label>Transmission Mode</label>
            <select
              value={sacnConfig.mode}
              onChange={(e) => handleSACNChange('mode', e.target.value)}
              className="setting-select"
            >
              <option value="multicast">Multicast (Recommended)</option>
              <option value="unicast">Unicast (Direct IP)</option>
            </select>
          </div>

          {sacnConfig.mode === 'unicast' && (
            <div className="setting-group">
              <label>Target IP Address</label>
              <input
                type="text"
                value={sacnConfig.ipAddress}
                onChange={(e) => handleSACNChange('ipAddress', e.target.value)}
                placeholder="192.168.1.100"
                className="setting-input"
              />
            </div>
          )}

          <div className="setting-group">
            <label>Source Name</label>
            <input
              type="text"
              value={sacnConfig.sourceName}
              onChange={(e) => handleSACNChange('sourceName', e.target.value)}
              placeholder="SteamDeck-DMX"
              className="setting-input"
              maxLength="63"
            />
            <span className="setting-hint">Identifies this controller on the network</span>
          </div>

          <div className="setting-group">
            <label>Port</label>
            <input
              type="number"
              value={sacnConfig.port}
              onChange={(e) => handleSACNChange('port', parseInt(e.target.value))}
              min="1"
              max="65535"
              className="setting-input"
            />
            <span className="setting-hint">Default: 5568</span>
          </div>

          <div className="setting-row">
            <div className="setting-group">
              <label>Universe Start</label>
              <input
                type="number"
                value={sacnConfig.universeStart}
                onChange={(e) => handleSACNChange('universeStart', parseInt(e.target.value))}
                min="1"
                max="63999"
                className="setting-input"
              />
            </div>

            <div className="setting-group">
              <label>Universe Range</label>
              <input
                type="number"
                value={sacnConfig.universeRange}
                onChange={(e) => handleSACNChange('universeRange', parseInt(e.target.value))}
                min="1"
                max="256"
                className="setting-input"
              />
            </div>
          </div>

          <div className="setting-group">
            <label>Priority</label>
            <input
              type="range"
              value={sacnConfig.priority}
              onChange={(e) => handleSACNChange('priority', parseInt(e.target.value))}
              min="0"
              max="200"
              className="setting-slider"
            />
            <span className="setting-value">{sacnConfig.priority}</span>
            <span className="setting-hint">Higher priority sources take precedence (0-200)</span>
          </div>

          <div className="protocol-info">
            <p>
              <strong>sACN (E1.31)</strong> is ANSI standard for streaming DMX over IP.
              Uses multicast by default. Supports up to 63,999 universes.
            </p>
          </div>
        </div>
      )}

      {/* Simultaneous Output Warning */}
      {artnetConfig.enabled && sacnConfig.enabled && (
        <div className="protocol-warning">
          <strong>⚠️ Both protocols enabled</strong>
          <p>Art-Net and sACN will transmit simultaneously. Ensure devices are configured to receive from only one protocol to avoid conflicts.</p>
        </div>
      )}

      <div className="protocol-footer">
        <div className="protocol-tip">
          💡 Changes take effect immediately. Ensure network settings match your lighting network.
        </div>
      </div>
    </div>
  );
};

export default ProtocolSettings;
