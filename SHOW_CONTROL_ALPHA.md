# Grid Layout System - User Guide

## Overview

The DMX Controller now features a fully configurable grid layout system that allows you to customize your workspace exactly how you want it. Save multiple layouts for different workflows!

## Quick Start

### Accessing Layout Controls

Look for these new buttons in the top bar:
- **📐 Layout** - Opens the layout configuration editor
- **🔲/📋** - Toggles between grid layout and classic layout

### Available View Types

1. **Fixtures** - Your patched fixtures list
2. **Programmer** - Encoder wheels for parameter control
3. **Color Palettes** - Quick color selection buttons
4. **Executors** - Playback faders
5. **Quick Actions** - Black, Locate, Clear buttons
6. **Channel Grid** - Direct DMX channel control (1-512)

## Using Layout Presets

The system comes with 7 built-in presets:

### 1. **Default** (3x3 grid)
- Fixtures on left
- Programmer in center
- Palettes on right
- Executors across bottom
- Perfect for general use

### 2. **Compact** (2x2 grid)
- Minimal layout for small screens
- Fixtures and Palettes on left column
- Programmer spans full right column

### 3. **Programming** (3x4 grid)
- Focus on programming features
- Large programmer section
- Quick access to all tools
- Ideal for building cues

### 4. **Playback** (4x2 grid)
- Optimized for live shows
- Fixtures list
- Large executors section
- Quick actions at bottom

### 5. **Channel Control** (3x3 grid)
- Direct DMX control focus
- Large channel grid view
- Perfect for troubleshooting

### 6. **Full Control** (4x4 grid)
- Everything visible at once
- Maximum workspace
- Best for large screens

### 7. **Minimal** (2x1 grid)
- Just programmer and quick actions
- Ultra-compact for tiny displays

## Creating Custom Layouts

### Step 1: Open Layout Editor
Click the **📐 Layout** button in the top bar

### Step 2: Configure Grid Size
- Set the number of rows (1-10)
- Set the number of columns (1-10)

### Step 3: Add Cells
Click **+ Add Cell** to create a new view panel

For each cell, configure:
- **View Type** - What content to display
- **Row** - Starting row position (0-indexed)
- **Column** - Starting column position (0-indexed)
- **Row Span** - How many rows to span
- **Col Span** - How many columns to span

### Step 4: Save Your Layout
- Give it a descriptive name
- Click **Save & Apply**

## Example: Creating a Custom Layout

Let's create a "Busking" layout optimized for live improvisation:

```
Grid: 3 rows × 3 columns

Cell 1: Fixtures
- Row: 0, Col: 0
- Row Span: 2, Col Span: 1

Cell 2: Palettes
- Row: 0, Col: 1
- Row Span: 2, Col Span: 2

Cell 3: Quick Actions
- Row: 2, Col: 0
- Row Span: 1, Col Span: 3
```

This gives you quick access to fixtures and palettes, with quick actions spanning the bottom.

## Managing Saved Layouts

### Loading a Layout
1. Open Layout Editor
2. Scroll to "Saved Layouts" section
3. Click **Load** next to the layout you want
4. Click **Save & Apply**

### Deleting a Layout
1. Open Layout Editor
2. Find the layout in "Saved Layouts"
3. Click **Delete**

### Switching Layouts Quickly
- Your current layout is displayed in the top bar
- Layouts are saved automatically to browser localStorage
- The last used layout loads on app restart

## Tips & Tricks

### Grid Design Best Practices
1. **Start with a preset** - Modify an existing layout rather than starting from scratch
2. **Plan your grid** - Sketch your layout on paper first
3. **Use spans wisely** - Larger cells for frequently used views
4. **Leave space** - Don't cram too much into small grids

### Workflow-Specific Layouts

**For Programming:**
- Large programmer section
- Fixtures list visible
- Palettes accessible
- Minimize executors

**For Playback:**
- Large executors section
- Fixture list for quick checks
- Quick actions prominent

**For Troubleshooting:**
- Channel grid view
- Fixture list
- Quick actions

### Performance Tips
- Smaller grids load faster
- Disable unused views
- Use "Empty" cells as spacers if needed

## Keyboard Shortcuts

While in grid layout mode:
- **Steam Deck controls** still work normally
- Click cell headers to focus that view
- Use gamepad for parameter control

## Classic Layout Mode

Prefer the original layout? Click the **🔲** button to switch to classic mode.
- Original 3-column design
- Fixed layout
- Quick actions at bottom
- Perfect for users who prefer consistency

## Troubleshooting

### Layout looks wrong
- Check row/column spans don't overlap
- Ensure cells fit within grid bounds
- Try loading a preset and modifying it

### Changes not saving
- Make sure you give the layout a name
- Click "Save & Apply" not just "Cancel"
- Check browser localStorage is enabled

### Views appear empty
- Select fixtures first (for Programmer, etc.)
- Patch fixtures (for Fixtures view)
- Configure DMX settings (for Channel Grid)

## Technical Details

### Storage
- Layouts saved to browser localStorage
- Current layout: `dmx_current_layout`
- Saved layouts: `dmx_saved_layouts`
- Grid mode toggle: `dmx_use_grid_layout`

### Grid System
- CSS Grid-based responsive layout
- Supports 1-10 rows/columns
- Dynamic cell spanning
- Automatic scrolling in cells

## Future Enhancements

Planned features:
- [ ] Drag-and-drop cell positioning
- [ ] Visual grid editor
- [ ] Import/export layouts as files
- [ ] Layout templates for specific console types
- [ ] Swipeable layout tabs

---

**Made with ❤️ for customizable lighting control**
