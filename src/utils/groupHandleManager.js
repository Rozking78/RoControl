/**
 * Group Handle Manager - Manage group handles as virtual fixtures
 *
 * Group handles are assigned fixture numbers starting at 4001
 * and can be controlled like regular fixtures
 */

export const GROUP_HANDLE_START = 4001;

export const GroupHandleMode = {
  INHIBITIVE: 'inhibitive',  // Default - reduces/blocks output
  ADDITIVE: 'additive',      // Adds to existing output
  SCALING: 'scaling',        // Scales existing output by percentage
  SUBTRACTIVE: 'subtractive' // Subtracts from existing output
};

export class GroupHandle {
  constructor(id, config = {}) {
    this.id = id; // Group handle ID (e.g., 1, 2, 3)
    this.fixtureNumber = GROUP_HANDLE_START + id - 1; // Auto-assigned fixture number
    this.name = config.name || `Group ${id}`;
    this.mode = config.mode || GroupHandleMode.INHIBITIVE;
    this.fixtures = config.fixtures || []; // Array of fixture IDs in this group
    this.values = config.values || {}; // Channel values for this group
    this.intensity = config.intensity || 0; // Master intensity for scaling
    this.executorId = config.executorId || null; // Which executor this group is in
    this.executorPosition = config.executorPosition || null; // Position in executor
    this.active = false;
    this.priority = config.priority || 50; // 0-100, higher = higher priority
  }

  /**
   * Add a fixture to this group handle
   */
  addFixture(fixtureId) {
    if (!this.fixtures.includes(fixtureId)) {
      this.fixtures.push(fixtureId);
    }
  }

  /**
   * Remove a fixture from this group handle
   */
  removeFixture(fixtureId) {
    const index = this.fixtures.indexOf(fixtureId);
    if (index > -1) {
      this.fixtures.splice(index, 1);
    }
  }

  /**
   * Set the mode of this group handle
   */
  setMode(mode) {
    if (Object.values(GroupHandleMode).includes(mode)) {
      this.mode = mode;
    }
  }

  /**
   * Set a value for a specific channel
   */
  setValue(channel, value) {
    this.values[channel] = value;
  }

  /**
   * Get value for a specific channel
   */
  getValue(channel) {
    return this.values[channel] || 0;
  }

  /**
   * Apply this group handle to a fixture's output
   * Returns the modified value based on mode
   */
  applyToFixture(fixtureId, channel, currentValue) {
    if (!this.fixtures.includes(fixtureId) || !this.active) {
      return currentValue;
    }

    const groupValue = this.getValue(channel);

    switch (this.mode) {
      case GroupHandleMode.INHIBITIVE:
        // Reduce output - take the minimum
        return Math.min(currentValue, groupValue);

      case GroupHandleMode.ADDITIVE:
        // Add to output - sum and cap at 255
        return Math.min(255, currentValue + groupValue);

      case GroupHandleMode.SCALING:
        // Scale output by group intensity (0-100%)
        const scaleFactor = this.intensity / 100;
        return Math.round(currentValue * scaleFactor);

      case GroupHandleMode.SUBTRACTIVE:
        // Subtract from output - floor at 0
        return Math.max(0, currentValue - groupValue);

      default:
        return currentValue;
    }
  }

  /**
   * Activate this group handle
   */
  activate() {
    this.active = true;
  }

  /**
   * Deactivate this group handle
   */
  deactivate() {
    this.active = false;
  }

  /**
   * Toggle active state
   */
  toggle() {
    this.active = !this.active;
  }

  /**
   * Export group handle data
   */
  toJSON() {
    return {
      id: this.id,
      fixtureNumber: this.fixtureNumber,
      name: this.name,
      mode: this.mode,
      fixtures: this.fixtures,
      values: this.values,
      intensity: this.intensity,
      executorId: this.executorId,
      executorPosition: this.executorPosition,
      active: this.active,
      priority: this.priority
    };
  }

  /**
   * Import group handle data
   */
  static fromJSON(data) {
    return new GroupHandle(data.id, {
      name: data.name,
      mode: data.mode,
      fixtures: data.fixtures,
      values: data.values,
      intensity: data.intensity,
      executorId: data.executorId,
      executorPosition: data.executorPosition,
      priority: data.priority
    });
  }
}

export class GroupHandleManager {
  constructor() {
    this.groupHandles = new Map(); // id -> GroupHandle
    this.nextId = 1;
    this.listeners = new Set();
  }

  /**
   * Create a new group handle
   */
  createGroupHandle(fixtures = [], name = null, mode = GroupHandleMode.INHIBITIVE) {
    const id = this.nextId++;
    const groupHandle = new GroupHandle(id, {
      name: name || `Group ${id}`,
      mode,
      fixtures
    });

    this.groupHandles.set(id, groupHandle);
    this.notifyListeners('create', groupHandle);

    return groupHandle;
  }

  /**
   * Create group handle from executor recording
   * Called when: record group X exec Y.Z
   */
  createFromExecutor(groupId, executorId, position, fixtures, values, mode = GroupHandleMode.INHIBITIVE) {
    const groupHandle = new GroupHandle(groupId, {
      name: `Group ${groupId}`,
      mode,
      fixtures,
      values,
      executorId,
      executorPosition: position
    });

    this.groupHandles.set(groupId, groupHandle);
    this.notifyListeners('create', groupHandle);

    return groupHandle;
  }

  /**
   * Get a group handle by ID
   */
  getGroupHandle(id) {
    return this.groupHandles.get(id);
  }

  /**
   * Get a group handle by fixture number
   */
  getGroupHandleByFixtureNumber(fixtureNumber) {
    for (const groupHandle of this.groupHandles.values()) {
      if (groupHandle.fixtureNumber === fixtureNumber) {
        return groupHandle;
      }
    }
    return null;
  }

  /**
   * Delete a group handle
   */
  deleteGroupHandle(id) {
    const groupHandle = this.groupHandles.get(id);
    if (groupHandle) {
      this.groupHandles.delete(id);
      this.notifyListeners('delete', groupHandle);
      return true;
    }
    return false;
  }

  /**
   * Get all group handles
   */
  getAllGroupHandles() {
    return Array.from(this.groupHandles.values());
  }

  /**
   * Get all group handles sorted by priority
   */
  getGroupHandlesByPriority() {
    return this.getAllGroupHandles().sort((a, b) => b.priority - a.priority);
  }

  /**
   * Check if a fixture number is a group handle
   */
  isGroupHandle(fixtureNumber) {
    return fixtureNumber >= GROUP_HANDLE_START;
  }

  /**
   * Apply all active group handles to a fixture's output
   * This is called during DMX output generation
   */
  applyGroupHandles(fixtureId, channel, currentValue) {
    let value = currentValue;

    // Apply group handles in priority order
    const activeGroups = this.getGroupHandlesByPriority().filter(g => g.active);

    for (const groupHandle of activeGroups) {
      value = groupHandle.applyToFixture(fixtureId, channel, value);
    }

    return value;
  }

  /**
   * Update a group handle's mode
   */
  setGroupHandleMode(id, mode) {
    const groupHandle = this.getGroupHandle(id);
    if (groupHandle) {
      groupHandle.setMode(mode);
      this.notifyListeners('update', groupHandle);
      return true;
    }
    return false;
  }

  /**
   * Add fixtures to a group handle
   */
  addFixturesToGroup(groupId, fixtureIds) {
    const groupHandle = this.getGroupHandle(groupId);
    if (groupHandle) {
      fixtureIds.forEach(fixtureId => groupHandle.addFixture(fixtureId));
      this.notifyListeners('update', groupHandle);
      return true;
    }
    return false;
  }

  /**
   * Remove fixtures from a group handle
   */
  removeFixturesFromGroup(groupId, fixtureIds) {
    const groupHandle = this.getGroupHandle(groupId);
    if (groupHandle) {
      fixtureIds.forEach(fixtureId => groupHandle.removeFixture(fixtureId));
      this.notifyListeners('update', groupHandle);
      return true;
    }
    return false;
  }

  /**
   * Activate a group handle
   */
  activateGroupHandle(id) {
    const groupHandle = this.getGroupHandle(id);
    if (groupHandle) {
      groupHandle.activate();
      this.notifyListeners('activate', groupHandle);
      return true;
    }
    return false;
  }

  /**
   * Deactivate a group handle
   */
  deactivateGroupHandle(id) {
    const groupHandle = this.getGroupHandle(id);
    if (groupHandle) {
      groupHandle.deactivate();
      this.notifyListeners('deactivate', groupHandle);
      return true;
    }
    return false;
  }

  /**
   * Subscribe to group handle events
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify listeners of group handle changes
   */
  notifyListeners(event, groupHandle) {
    this.listeners.forEach(callback => {
      callback(event, groupHandle);
    });
  }

  /**
   * Export all group handles
   */
  exportConfig() {
    return {
      groupHandles: this.getAllGroupHandles().map(g => g.toJSON()),
      nextId: this.nextId
    };
  }

  /**
   * Import group handles configuration
   */
  importConfig(config) {
    if (config.groupHandles) {
      this.groupHandles.clear();
      config.groupHandles.forEach(data => {
        const groupHandle = GroupHandle.fromJSON(data);
        this.groupHandles.set(groupHandle.id, groupHandle);
      });
      this.nextId = config.nextId || this.groupHandles.size + 1;
    }
  }

  /**
   * Get fixture list for patch table (includes group handles as virtual fixtures)
   */
  getFixturesForPatchTable(realFixtures) {
    const allFixtures = [...realFixtures];

    // Add group handles as virtual fixtures
    this.getAllGroupHandles().forEach(groupHandle => {
      allFixtures.push({
        id: groupHandle.fixtureNumber,
        name: groupHandle.name,
        type: 'Group Handle',
        mode: groupHandle.mode,
        isGroupHandle: true,
        groupHandleId: groupHandle.id,
        dmx_address: null,
        universe: null,
        fixtures: groupHandle.fixtures,
        active: groupHandle.active
      });
    });

    return allFixtures.sort((a, b) => a.id - b.id);
  }
}

export default GroupHandleManager;
