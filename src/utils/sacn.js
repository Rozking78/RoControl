/**
 * sACN (E1.31) Protocol Helper
 *
 * Streaming ACN (Architecture for Control Networks)
 * ANSI E1.31 - Lightweight streaming protocol for entertainment control
 */

/**
 * sACN packet structure constants
 */
export const SACN_CONSTANTS = {
  PORT: 5568,
  MULTICAST_BASE: '239.255.0.0',
  VECTOR_ROOT_E131_DATA: 0x00000004,
  VECTOR_E131_DATA_PACKET: 0x00000002,
  VECTOR_DMP_SET_PROPERTY: 0x02,
  MAX_CHANNELS: 512
};

/**
 * Generate sACN UUID (CID) from source name
 * @param {string} sourceName - Source name
 * @returns {Uint8Array} 16-byte UUID
 */
export function generateSACNUUID(sourceName) {
  // Simple UUID generation based on source name
  const uuid = new Uint8Array(16);
  const encoder = new TextEncoder();
  const nameBytes = encoder.encode(sourceName);

  // Fill UUID with hash of source name
  for (let i = 0; i < 16; i++) {
    uuid[i] = nameBytes[i % nameBytes.length] ^ i;
  }

  return uuid;
}

/**
 * Build sACN E1.31 packet
 * @param {number} universe - Universe number (1-63999)
 * @param {Uint8Array} dmxData - DMX channel data (up to 512 bytes)
 * @param {Object} options - Additional options
 * @returns {Uint8Array} Complete sACN packet
 */
export function buildSACNPacket(universe, dmxData, options = {}) {
  const {
    sourceName = 'SteamDeck-DMX',
    priority = 100,
    sequence = 0,
    preview = false,
    streamTerminated = false,
    forceSynchronization = false
  } = options;

  // sACN packet structure
  const packet = new Uint8Array(638); // Max packet size
  let offset = 0;

  // ===== Root Layer =====

  // Preamble Size (2 bytes) - always 0x0010
  packet[offset++] = 0x00;
  packet[offset++] = 0x10;

  // Post-amble Size (2 bytes) - always 0x0000
  packet[offset++] = 0x00;
  packet[offset++] = 0x00;

  // ACN Packet Identifier (12 bytes) - identifies as ACN packet
  const acnId = [0x41, 0x53, 0x43, 0x2d, 0x45, 0x31, 0x2e, 0x31, 0x37, 0x00, 0x00, 0x00];
  packet.set(acnId, offset);
  offset += 12;

  // Flags and Length (2 bytes) - 0x7000 + length
  const rootLength = 638 - 16; // Total length minus preamble and postamble
  packet[offset++] = 0x70 | ((rootLength >> 8) & 0x0f);
  packet[offset++] = rootLength & 0xff;

  // Vector (4 bytes) - VECTOR_ROOT_E131_DATA
  packet[offset++] = 0x00;
  packet[offset++] = 0x00;
  packet[offset++] = 0x00;
  packet[offset++] = 0x04;

  // CID (16 bytes) - Component Identifier (UUID)
  const cid = generateSACNUUID(sourceName);
  packet.set(cid, offset);
  offset += 16;

  // ===== Framing Layer =====

  // Flags and Length (2 bytes)
  const framingLength = 638 - 38;
  packet[offset++] = 0x70 | ((framingLength >> 8) & 0x0f);
  packet[offset++] = framingLength & 0xff;

  // Vector (4 bytes) - VECTOR_E131_DATA_PACKET
  packet[offset++] = 0x00;
  packet[offset++] = 0x00;
  packet[offset++] = 0x00;
  packet[offset++] = 0x02;

  // Source Name (64 bytes) - UTF-8 string, null terminated
  const sourceNameBytes = new TextEncoder().encode(sourceName);
  packet.set(sourceNameBytes.slice(0, 63), offset);
  offset += 64;

  // Priority (1 byte) - 0-200
  packet[offset++] = Math.min(200, Math.max(0, priority));

  // Synchronization Address (2 bytes) - 0 for no sync
  packet[offset++] = 0x00;
  packet[offset++] = 0x00;

  // Sequence Number (1 byte)
  packet[offset++] = sequence & 0xff;

  // Options (1 byte)
  let optionsByte = 0;
  if (preview) optionsByte |= 0x80;
  if (streamTerminated) optionsByte |= 0x40;
  if (forceSynchronization) optionsByte |= 0x20;
  packet[offset++] = optionsByte;

  // Universe (2 bytes) - big endian
  packet[offset++] = (universe >> 8) & 0xff;
  packet[offset++] = universe & 0xff;

  // ===== DMP Layer =====

  // Flags and Length (2 bytes)
  const dmpLength = 11 + 1 + dmxData.length;
  packet[offset++] = 0x70 | ((dmpLength >> 8) & 0x0f);
  packet[offset++] = dmpLength & 0xff;

  // Vector (1 byte) - VECTOR_DMP_SET_PROPERTY
  packet[offset++] = 0x02;

  // Address Type & Data Type (1 byte)
  packet[offset++] = 0xa1;

  // First Property Address (2 bytes) - always 0
  packet[offset++] = 0x00;
  packet[offset++] = 0x00;

  // Address Increment (2 bytes) - always 1
  packet[offset++] = 0x00;
  packet[offset++] = 0x01;

  // Property value count (2 bytes) - 1 + channel count
  const propertyCount = 1 + dmxData.length;
  packet[offset++] = (propertyCount >> 8) & 0xff;
  packet[offset++] = propertyCount & 0xff;

  // DMX Start Code (1 byte) - always 0
  packet[offset++] = 0x00;

  // DMX Data (up to 512 bytes)
  const dataLength = Math.min(dmxData.length, 512);
  packet.set(dmxData.slice(0, dataLength), offset);
  offset += dataLength;

  // Return only the used portion of the packet
  return packet.slice(0, offset);
}

/**
 * sACN configuration
 */
export class SACNConfig {
  constructor(options = {}) {
    this.enabled = options.enabled !== undefined ? options.enabled : false;
    this.mode = options.mode || 'multicast'; // 'multicast' or 'unicast'
    this.ipAddress = options.ipAddress || '239.255.0.1'; // Multicast or unicast IP
    this.port = options.port || SACN_CONSTANTS.PORT;
    this.universeStart = options.universeStart || 1; // sACN universes start at 1
    this.universeRange = options.universeRange || 1;
    this.sourceName = options.sourceName || 'SteamDeck-DMX';
    this.priority = options.priority !== undefined ? options.priority : 100;
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
   * Get multicast address for universe
   * @param {number} universe - Universe number (1-63999)
   */
  getMulticastAddress(universe) {
    if (this.mode !== 'multicast') {
      return this.ipAddress;
    }

    // sACN multicast: 239.255.x.x where x.x is universe number
    const highByte = (universe >> 8) & 0xff;
    const lowByte = universe & 0xff;
    return `239.255.${highByte}.${lowByte}`;
  }

  /**
   * Convert to JSON for storage
   */
  toJSON() {
    return {
      enabled: this.enabled,
      mode: this.mode,
      ipAddress: this.ipAddress,
      port: this.port,
      universeStart: this.universeStart,
      universeRange: this.universeRange,
      sourceName: this.sourceName,
      priority: this.priority
    };
  }

  /**
   * Load from JSON
   */
  static fromJSON(json) {
    return new SACNConfig(json);
  }
}

/**
 * Send sACN packet via Tauri backend
 * @param {SACNConfig} config - sACN configuration
 * @param {number} universe - Universe number (relative to start)
 * @param {Uint8Array} dmxData - DMX data
 */
export async function sendSACNPacket(config, universe, dmxData) {
  if (!config.enabled) return;

  try {
    const absoluteUniverse = config.universeStart + universe;
    const packet = buildSACNPacket(absoluteUniverse, dmxData, {
      sourceName: config.sourceName,
      priority: config.priority,
      sequence: config.getNextSequence()
    });

    // Convert Uint8Array to regular array for JSON serialization
    const packetArray = Array.from(packet);

    const targetIP = config.getMulticastAddress(absoluteUniverse);

    // Call Tauri backend command
    if (window.__TAURI__) {
      await window.__TAURI__.invoke('send_sacn', {
        ipAddress: targetIP,
        port: config.port,
        data: packetArray
      });
    } else {
      console.warn('Tauri not available - sACN packet not sent');
    }
  } catch (error) {
    console.error('Failed to send sACN packet:', error);
  }
}

/**
 * Send multiple sACN universes
 * @param {SACNConfig} config - sACN configuration
 * @param {Map} universes - Map of universe number to DMX data
 */
export async function sendSACNUniverses(config, universes) {
  if (!config.enabled) return;

  const promises = [];

  universes.forEach((dmxData, universeNum) => {
    if (universeNum < config.universeRange) {
      promises.push(sendSACNPacket(config, universeNum, dmxData));
    }
  });

  await Promise.all(promises);
}
