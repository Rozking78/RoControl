/**
 * Art-Net Protocol Helper
 *
 * Utilities for Art-Net DMX over Ethernet
 * Art-Net is a royalty-free protocol for transmitting DMX512-A data over UDP/IP
 */

/**
 * Art-Net packet structure constants
 */
export const ARTNET_CONSTANTS = {
  PROTOCOL_VERSION: 14,
  PORT: 6454,
  HEADER: 'Art-Net\0',
  OPCODE_DMX: 0x5000,
  MAX_CHANNELS: 512
};

/**
 * Build Art-Net DMX packet
 * @param {number} universe - Universe number (0-32767)
 * @param {Uint8Array} dmxData - DMX channel data (512 bytes)
 * @param {number} sequence - Sequence number (0-255)
 * @returns {Uint8Array} Complete Art-Net packet
 */
export function buildArtNetPacket(universe, dmxData, sequence = 0) {
  // Art-Net DMX packet is minimum 18 bytes header + 512 bytes data
  const packet = new Uint8Array(18 + 512);

  // Header: "Art-Net\0" (8 bytes)
  const header = new TextEncoder().encode('Art-Net\0');
  packet.set(header, 0);

  // OpCode: 0x5000 (ArtDMX) - little endian
  packet[8] = 0x00;
  packet[9] = 0x50;

  // Protocol Version: 14 - big endian
  packet[10] = 0x00;
  packet[11] = 0x0e;

  // Sequence: packet sequence number
  packet[12] = sequence & 0xff;

  // Physical: physical input port
  packet[13] = 0x00;

  // Universe: 15-bit Port-Address (0-32767) - little endian
  packet[14] = universe & 0xff;
  packet[15] = (universe >> 8) & 0x7f;

  // Length: number of DMX channels - big endian
  const length = Math.min(dmxData.length, 512);
  packet[16] = (length >> 8) & 0xff;
  packet[17] = length & 0xff;

  // Data: DMX channel data
  packet.set(dmxData.slice(0, length), 18);

  return packet;
}

/**
 * Art-Net configuration
 */
export class ArtNetConfig {
  constructor(options = {}) {
    this.enabled = options.enabled !== undefined ? options.enabled : false;
    this.ipAddress = options.ipAddress || '2.255.255.255'; // Broadcast
    this.port = options.port || ARTNET_CONSTANTS.PORT;
    this.universeStart = options.universeStart || 0;
    this.universeRange = options.universeRange || 1;
    this.mode = options.mode || 'broadcast'; // 'broadcast', 'unicast', 'multicast'
    this.sequence = 0;
  }

  /**
   * Get next sequence number
   */
  getNextSequence() {
    this.sequence = (this.sequence + 1) % 256;
    return this.sequence;
  }

  /**
   * Get broadcast address for subnet
   */
  getBroadcastAddress() {
    if (this.mode === 'broadcast') {
      return '2.255.255.255'; // Art-Net broadcast
    } else if (this.mode === 'multicast') {
      return '239.255.0.0'; // Multicast base
    }
    return this.ipAddress; // Unicast
  }

  /**
   * Convert to JSON for storage
   */
  toJSON() {
    return {
      enabled: this.enabled,
      ipAddress: this.ipAddress,
      port: this.port,
      universeStart: this.universeStart,
      universeRange: this.universeRange,
      mode: this.mode
    };
  }

  /**
   * Load from JSON
   */
  static fromJSON(json) {
    return new ArtNetConfig(json);
  }
}

/**
 * Send Art-Net packet via Tauri backend
 * @param {ArtNetConfig} config - Art-Net configuration
 * @param {number} universe - Universe number
 * @param {Uint8Array} dmxData - DMX data
 */
export async function sendArtNetPacket(config, universe, dmxData) {
  if (!config.enabled) return;

  try {
    const packet = buildArtNetPacket(
      config.universeStart + universe,
      dmxData,
      config.getNextSequence()
    );

    // Convert Uint8Array to regular array for JSON serialization
    const packetArray = Array.from(packet);

    // Call Tauri backend command
    if (window.__TAURI__) {
      await window.__TAURI__.invoke('send_artnet', {
        ipAddress: config.getBroadcastAddress(),
        port: config.port,
        data: packetArray
      });
    } else {
      console.warn('Tauri not available - Art-Net packet not sent');
    }
  } catch (error) {
    console.error('Failed to send Art-Net packet:', error);
  }
}

/**
 * Send multiple Art-Net universes
 * @param {ArtNetConfig} config - Art-Net configuration
 * @param {Map} universes - Map of universe number to DMX data
 */
export async function sendArtNetUniverses(config, universes) {
  if (!config.enabled) return;

  const promises = [];

  universes.forEach((dmxData, universeNum) => {
    if (universeNum < config.universeRange) {
      promises.push(sendArtNetPacket(config, universeNum, dmxData));
    }
  });

  await Promise.all(promises);
}

/**
 * Calculate Art-Net universe from net/subnet/universe
 * @param {number} net - Net (0-127)
 * @param {number} subnet - Subnet (0-15)
 * @param {number} universe - Universe (0-15)
 * @returns {number} 15-bit universe address
 */
export function calculateArtNetUniverse(net, subnet, universe) {
  return (net << 8) | (subnet << 4) | universe;
}

/**
 * Parse Art-Net universe into net/subnet/universe
 * @param {number} universeAddress - 15-bit universe address
 * @returns {Object} Object with net, subnet, universe
 */
export function parseArtNetUniverse(universeAddress) {
  return {
    net: (universeAddress >> 8) & 0x7f,
    subnet: (universeAddress >> 4) & 0x0f,
    universe: universeAddress & 0x0f
  };
}
