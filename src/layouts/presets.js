// Default layout presets for different workflows

export const LAYOUT_PRESETS = {
  default: {
    name: 'Default',
    rows: 3,
    cols: 3,
    cells: [
      { row: 0, col: 0, rowSpan: 2, colSpan: 1, view: 'fixtures' },
      { row: 0, col: 1, rowSpan: 2, colSpan: 1, view: 'programmer' },
      { row: 0, col: 2, rowSpan: 2, colSpan: 1, view: 'palettes' },
      { row: 2, col: 0, rowSpan: 1, colSpan: 3, view: 'executors' }
    ]
  },

  compact: {
    name: 'Compact',
    rows: 2,
    cols: 2,
    cells: [
      { row: 0, col: 0, rowSpan: 1, colSpan: 1, view: 'fixtures' },
      { row: 0, col: 1, rowSpan: 2, colSpan: 1, view: 'programmer' },
      { row: 1, col: 0, rowSpan: 1, colSpan: 1, view: 'palettes' }
    ]
  },

  programming: {
    name: 'Programming',
    rows: 3,
    cols: 4,
    cells: [
      { row: 0, col: 0, rowSpan: 3, colSpan: 1, view: 'fixtures' },
      { row: 0, col: 1, rowSpan: 2, colSpan: 2, view: 'programmer' },
      { row: 0, col: 3, rowSpan: 2, colSpan: 1, view: 'palettes' },
      { row: 2, col: 1, rowSpan: 1, colSpan: 3, view: 'quickActions' }
    ]
  },

  playback: {
    name: 'Playback',
    rows: 4,
    cols: 2,
    cells: [
      { row: 0, col: 0, rowSpan: 3, colSpan: 1, view: 'fixtures' },
      { row: 0, col: 1, rowSpan: 3, colSpan: 1, view: 'executors' },
      { row: 3, col: 0, rowSpan: 1, colSpan: 2, view: 'quickActions' }
    ]
  },

  channelControl: {
    name: 'Channel Control',
    rows: 3,
    cols: 3,
    cells: [
      { row: 0, col: 0, rowSpan: 2, colSpan: 1, view: 'fixtures' },
      { row: 0, col: 1, rowSpan: 3, colSpan: 2, view: 'channelGrid' },
      { row: 2, col: 0, rowSpan: 1, colSpan: 1, view: 'quickActions' }
    ]
  },

  fullControl: {
    name: 'Full Control',
    rows: 4,
    cols: 4,
    cells: [
      { row: 0, col: 0, rowSpan: 3, colSpan: 1, view: 'fixtures' },
      { row: 0, col: 1, rowSpan: 2, colSpan: 2, view: 'programmer' },
      { row: 0, col: 3, rowSpan: 2, colSpan: 1, view: 'palettes' },
      { row: 2, col: 1, rowSpan: 1, colSpan: 3, view: 'quickActions' },
      { row: 3, col: 0, rowSpan: 1, colSpan: 4, view: 'executors' }
    ]
  },

  minimal: {
    name: 'Minimal',
    rows: 2,
    cols: 1,
    cells: [
      { row: 0, col: 0, rowSpan: 1, colSpan: 1, view: 'programmer' },
      { row: 1, col: 0, rowSpan: 1, colSpan: 1, view: 'quickActions' }
    ]
  }
}

export const getLayoutPreset = (name) => {
  return LAYOUT_PRESETS[name] || LAYOUT_PRESETS.default
}

export const getAllPresets = () => {
  return Object.values(LAYOUT_PRESETS)
}
