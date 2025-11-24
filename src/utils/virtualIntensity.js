/**
 * Virtual Intensity Logic for LED Fixtures
 *
 * Scales RGB color values by master fader intensity for fixtures
 * without a dedicated dimmer channel.
 *
 * This ensures Master Fader controls all fixtures uniformly.
 */

/**
 * Apply virtual intensity to RGB values
 * @param {number} red - Red value (0-255)
 * @param {number} green - Green value (0-255)
 * @param {number} blue - Blue value (0-255)
 * @param {number} masterIntensity - Master fader value (0-255)
 * @param {boolean} hasDimmerChannel - Does fixture have dedicated dimmer?
 * @returns {Object} Scaled RGB values
 */
export function applyVirtualIntensity(red, green, blue, masterIntensity, hasDimmerChannel = false) {
  // If fixture has dimmer channel, don't apply virtual intensity
  if (hasDimmerChannel) {
    return { red, green, blue };
  }

  // Calculate intensity scale factor (0.0 to 1.0)
  const intensityScale = masterIntensity / 255;

  // Scale each color channel
  const scaledRed = Math.round(red * intensityScale);
  const scaledGreen = Math.round(green * intensityScale);
  const scaledBlue = Math.round(blue * intensityScale);

  return {
    red: Math.max(0, Math.min(255, scaledRed)),
    green: Math.max(0, Math.min(255, scaledGreen)),
    blue: Math.max(0, Math.min(255, scaledBlue))
  };
}

/**
 * Apply virtual intensity to all color channels
 * @param {Object} colorValues - Object with color channel values
 * @param {number} masterIntensity - Master fader value (0-255)
 * @param {boolean} hasDimmerChannel - Does fixture have dedicated dimmer?
 * @returns {Object} Scaled color values
 */
export function applyVirtualIntensityToChannels(colorValues, masterIntensity, hasDimmerChannel = false) {
  if (hasDimmerChannel) {
    return colorValues;
  }

  const intensityScale = masterIntensity / 255;
  const scaledValues = {};

  // Color channels to scale
  const colorChannels = ['red', 'green', 'blue', 'white', 'amber', 'uv', 'cyan', 'magenta', 'yellow'];

  Object.keys(colorValues).forEach(channel => {
    if (colorChannels.includes(channel.toLowerCase())) {
      // Scale color channels
      scaledValues[channel] = Math.round(colorValues[channel] * intensityScale);
    } else {
      // Don't scale non-color channels (pan, tilt, etc.)
      scaledValues[channel] = colorValues[channel];
    }
  });

  return scaledValues;
}

/**
 * Calculate DMX output values for a fixture
 * @param {Object} fixture - Fixture object with channels
 * @param {Object} encoderValues - Current encoder values
 * @param {number} masterIntensity - Master fader value (0-255)
 * @returns {Array} Array of DMX values for fixture channels
 */
export function calculateDMXOutput(fixture, encoderValues, masterIntensity) {
  const dmxValues = [];
  const hasDimmer = fixture.channels.some(ch => ch.name.toLowerCase() === 'dimmer');

  fixture.channels.forEach((channel, index) => {
    const channelKey = channel.name.toLowerCase().replace(/\s+/g, '_');
    let value = encoderValues[channelKey] || 0;

    // Apply virtual intensity to color channels if no dimmer
    const colorChannels = ['red', 'green', 'blue', 'white', 'amber', 'uv', 'cyan', 'magenta', 'yellow'];

    if (!hasDimmer && colorChannels.includes(channel.name.toLowerCase())) {
      const intensityScale = masterIntensity / 255;
      value = Math.round(value * intensityScale);
    }

    // If this is the dimmer channel, scale by master
    if (channel.name.toLowerCase() === 'dimmer') {
      const dimmerScale = masterIntensity / 255;
      value = Math.round(value * dimmerScale);
    }

    dmxValues[index] = Math.max(0, Math.min(255, value));
  });

  return dmxValues;
}

/**
 * Build complete DMX universe data
 * @param {Array} fixtures - Array of fixtures
 * @param {Object} encoderValues - Current encoder values
 * @param {number} masterIntensity - Master fader value (0-255)
 * @param {number} universeSize - Size of DMX universe (default 512)
 * @returns {Uint8Array} DMX universe data
 */
export function buildDMXUniverse(fixtures, encoderValues, masterIntensity, universeSize = 512) {
  const universeData = new Uint8Array(universeSize);
  universeData.fill(0);

  fixtures.forEach(fixture => {
    const dmxValues = calculateDMXOutput(fixture, encoderValues, masterIntensity);

    // Write values to universe buffer
    dmxValues.forEach((value, offset) => {
      const address = fixture.dmx_address + offset - 1; // DMX is 1-indexed
      if (address >= 0 && address < universeSize) {
        universeData[address] = value;
      }
    });
  });

  return universeData;
}

/**
 * Build multiple universes for fixtures
 * @param {Array} fixtures - Array of fixtures
 * @param {Object} encoderValues - Current encoder values
 * @param {number} masterIntensity - Master fader value (0-255)
 * @returns {Map} Map of universe number to Uint8Array
 */
export function buildMultiUniverseDMX(fixtures, encoderValues, masterIntensity) {
  const universes = new Map();

  fixtures.forEach(fixture => {
    const universeNum = fixture.universe || 0;

    if (!universes.has(universeNum)) {
      universes.set(universeNum, new Uint8Array(512).fill(0));
    }

    const universeData = universes.get(universeNum);
    const dmxValues = calculateDMXOutput(fixture, encoderValues, masterIntensity);

    dmxValues.forEach((value, offset) => {
      const address = fixture.dmx_address + offset - 1;
      if (address >= 0 && address < 512) {
        universeData[address] = value;
      }
    });
  });

  return universes;
}

/**
 * Check if fixture has dimmer channel
 * @param {Object} fixture - Fixture object
 * @returns {boolean}
 */
export function fixtureHasDimmer(fixture) {
  return fixture.channels.some(ch => ch.name.toLowerCase() === 'dimmer');
}

/**
 * Get color channels for a fixture
 * @param {Object} fixture - Fixture object
 * @returns {Array} Array of color channel names
 */
export function getColorChannels(fixture) {
  const colorChannelNames = ['red', 'green', 'blue', 'white', 'amber', 'uv', 'cyan', 'magenta', 'yellow'];
  return fixture.channels
    .filter(ch => colorChannelNames.includes(ch.name.toLowerCase()))
    .map(ch => ch.name);
}
