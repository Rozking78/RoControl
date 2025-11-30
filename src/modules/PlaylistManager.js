/**
 * PlaylistManager Module - Video playlist management
 *
 * Handles playlist creation, playback order, and auto-advance
 */

import { eventBus, Events } from './EventBus.js';
import fs from 'fs';
import path from 'path';

class Playlist {
  constructor(id, options = {}) {
    this.id = id;
    this.name = options.name || `Playlist ${id}`;
    this.items = options.items || [];
    this.currentIndex = 0;

    // Playback options
    this.loop = options.loop || false;
    this.shuffle = options.shuffle || false;
    this.autoAdvance = options.autoAdvance !== false;

    // Metadata
    this.createdAt = options.createdAt || Date.now();
    this.modifiedAt = Date.now();
  }

  /**
   * Add an item to the playlist
   * @param {Object} item - Playlist item
   * @param {number} index - Optional insert position
   */
  addItem(item, index = null) {
    const playlistItem = {
      id: item.id || Date.now(),
      source: item.source,
      sourceType: item.sourceType || 'file',
      name: item.name || path.basename(item.source),
      duration: item.duration || 0,
      inPoint: item.inPoint || 0,
      outPoint: item.outPoint || null,
      fadeIn: item.fadeIn || 0,
      fadeOut: item.fadeOut || 0,
      loop: item.loop || false
    };

    if (index !== null && index >= 0 && index <= this.items.length) {
      this.items.splice(index, 0, playlistItem);
    } else {
      this.items.push(playlistItem);
    }

    this.modifiedAt = Date.now();
    return playlistItem;
  }

  /**
   * Remove an item from the playlist
   * @param {number} index - Item index
   */
  removeItem(index) {
    if (index >= 0 && index < this.items.length) {
      const removed = this.items.splice(index, 1)[0];
      this.modifiedAt = Date.now();

      // Adjust current index if needed
      if (this.currentIndex >= this.items.length) {
        this.currentIndex = Math.max(0, this.items.length - 1);
      }

      return removed;
    }
    return null;
  }

  /**
   * Move an item within the playlist
   * @param {number} fromIndex
   * @param {number} toIndex
   */
  moveItem(fromIndex, toIndex) {
    if (fromIndex >= 0 && fromIndex < this.items.length &&
        toIndex >= 0 && toIndex < this.items.length) {
      const item = this.items.splice(fromIndex, 1)[0];
      this.items.splice(toIndex, 0, item);
      this.modifiedAt = Date.now();
      return true;
    }
    return false;
  }

  /**
   * Get current item
   */
  getCurrentItem() {
    return this.items[this.currentIndex] || null;
  }

  /**
   * Get next item
   */
  getNextItem() {
    let nextIndex = this.currentIndex + 1;

    if (this.shuffle) {
      nextIndex = Math.floor(Math.random() * this.items.length);
    }

    if (nextIndex >= this.items.length) {
      if (this.loop) {
        nextIndex = 0;
      } else {
        return null;
      }
    }

    return this.items[nextIndex];
  }

  /**
   * Get previous item
   */
  getPreviousItem() {
    let prevIndex = this.currentIndex - 1;

    if (prevIndex < 0) {
      if (this.loop) {
        prevIndex = this.items.length - 1;
      } else {
        return null;
      }
    }

    return this.items[prevIndex];
  }

  /**
   * Advance to next item
   */
  next() {
    const wasIndex = this.currentIndex;
    let nextIndex = this.currentIndex + 1;

    if (this.shuffle) {
      nextIndex = Math.floor(Math.random() * this.items.length);
    }

    if (nextIndex >= this.items.length) {
      if (this.loop) {
        nextIndex = 0;
      } else {
        eventBus.emit(Events.PLAYLIST_ENDED, { playlistId: this.id });
        return null;
      }
    }

    this.currentIndex = nextIndex;

    eventBus.emit(Events.PLAYLIST_ITEM_CHANGED, {
      playlistId: this.id,
      previousIndex: wasIndex,
      currentIndex: this.currentIndex,
      item: this.getCurrentItem()
    });

    return this.getCurrentItem();
  }

  /**
   * Go to previous item
   */
  previous() {
    const wasIndex = this.currentIndex;
    let prevIndex = this.currentIndex - 1;

    if (prevIndex < 0) {
      if (this.loop) {
        prevIndex = this.items.length - 1;
      } else {
        return null;
      }
    }

    this.currentIndex = prevIndex;

    eventBus.emit(Events.PLAYLIST_ITEM_CHANGED, {
      playlistId: this.id,
      previousIndex: wasIndex,
      currentIndex: this.currentIndex,
      item: this.getCurrentItem()
    });

    return this.getCurrentItem();
  }

  /**
   * Go to specific index
   * @param {number} index
   */
  goTo(index) {
    if (index >= 0 && index < this.items.length) {
      const wasIndex = this.currentIndex;
      this.currentIndex = index;

      eventBus.emit(Events.PLAYLIST_ITEM_CHANGED, {
        playlistId: this.id,
        previousIndex: wasIndex,
        currentIndex: this.currentIndex,
        item: this.getCurrentItem()
      });

      return this.getCurrentItem();
    }
    return null;
  }

  /**
   * Reset to beginning
   */
  reset() {
    this.currentIndex = 0;
    return this.getCurrentItem();
  }

  /**
   * Get total duration
   */
  getTotalDuration() {
    return this.items.reduce((total, item) => total + (item.duration || 0), 0);
  }

  /**
   * Get item count
   */
  getItemCount() {
    return this.items.length;
  }

  /**
   * Export to JSON
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      items: this.items,
      currentIndex: this.currentIndex,
      loop: this.loop,
      shuffle: this.shuffle,
      autoAdvance: this.autoAdvance,
      createdAt: this.createdAt,
      modifiedAt: this.modifiedAt,
      totalDuration: this.getTotalDuration(),
      itemCount: this.getItemCount()
    };
  }

  /**
   * Create from JSON
   */
  static fromJSON(data) {
    const playlist = new Playlist(data.id, data);
    playlist.items = data.items || [];
    playlist.currentIndex = data.currentIndex || 0;
    return playlist;
  }
}

/**
 * PlaylistManager - Manages multiple playlists
 */
class PlaylistManager {
  constructor() {
    this.playlists = new Map();
    this.activePlaylistId = null;
    this.nextId = 1;
    this._saveDir = null;
  }

  /**
   * Initialize manager
   * @param {string} saveDir - Directory for saving playlists
   */
  initialize(saveDir) {
    this._saveDir = saveDir;

    // Create save directory if it doesn't exist
    if (saveDir && !fs.existsSync(saveDir)) {
      fs.mkdirSync(saveDir, { recursive: true });
    }
  }

  /**
   * Create a new playlist
   * @param {Object} options
   * @returns {Playlist}
   */
  create(options = {}) {
    const id = options.id || this.nextId++;
    const playlist = new Playlist(id, options);
    this.playlists.set(id, playlist);

    eventBus.emit(Events.PLAYLIST_LOADED, {
      playlistId: id,
      name: playlist.name
    });

    return playlist;
  }

  /**
   * Get a playlist by ID
   * @param {number|string} id
   * @returns {Playlist|null}
   */
  get(id) {
    return this.playlists.get(id) || this.playlists.get(parseInt(id)) || null;
  }

  /**
   * Get all playlists
   * @returns {Playlist[]}
   */
  getAll() {
    return Array.from(this.playlists.values());
  }

  /**
   * Get active playlist
   * @returns {Playlist|null}
   */
  getActive() {
    return this.activePlaylistId ? this.get(this.activePlaylistId) : null;
  }

  /**
   * Set active playlist
   * @param {number|string} id
   */
  setActive(id) {
    if (this.playlists.has(id) || this.playlists.has(parseInt(id))) {
      this.activePlaylistId = id;
      return true;
    }
    return false;
  }

  /**
   * Remove a playlist
   * @param {number|string} id
   */
  remove(id) {
    if (this.playlists.delete(id) || this.playlists.delete(parseInt(id))) {
      if (this.activePlaylistId === id) {
        this.activePlaylistId = null;
      }
      return true;
    }
    return false;
  }

  /**
   * Save playlist to file
   * @param {number|string} id
   * @param {string} filename - Optional custom filename
   */
  save(id, filename = null) {
    const playlist = this.get(id);
    if (!playlist || !this._saveDir) return false;

    const fname = filename || `playlist_${id}.json`;
    const filepath = path.join(this._saveDir, fname);

    try {
      fs.writeFileSync(filepath, JSON.stringify(playlist.toJSON(), null, 2));
      return filepath;
    } catch (error) {
      console.error('Failed to save playlist:', error);
      return false;
    }
  }

  /**
   * Load playlist from file
   * @param {string} filepath
   */
  load(filepath) {
    try {
      const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
      const playlist = Playlist.fromJSON(data);

      // Update nextId if needed
      if (playlist.id >= this.nextId) {
        this.nextId = playlist.id + 1;
      }

      this.playlists.set(playlist.id, playlist);

      eventBus.emit(Events.PLAYLIST_LOADED, {
        playlistId: playlist.id,
        name: playlist.name,
        filepath
      });

      return playlist;
    } catch (error) {
      console.error('Failed to load playlist:', error);
      return null;
    }
  }

  /**
   * Load all playlists from save directory
   */
  loadAll() {
    if (!this._saveDir || !fs.existsSync(this._saveDir)) return [];

    const loaded = [];
    const files = fs.readdirSync(this._saveDir);

    files.forEach(file => {
      if (file.endsWith('.json')) {
        const playlist = this.load(path.join(this._saveDir, file));
        if (playlist) {
          loaded.push(playlist);
        }
      }
    });

    return loaded;
  }

  /**
   * Get all states
   */
  getAllStates() {
    return this.getAll().map(p => p.toJSON());
  }

  /**
   * Clear all playlists
   */
  clear() {
    this.playlists.clear();
    this.activePlaylistId = null;
  }
}

// Export singleton manager
const playlistManager = new PlaylistManager();

export { Playlist, PlaylistManager, playlistManager };
