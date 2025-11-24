# Fix Missing glib-2.0.pc Files

## The Issue

The `glib2` and `glib2-devel` packages are installed, but the `.pc` files that pkg-config needs are missing from `/usr/lib/pkgconfig/`.

This is likely because:
1. The files were installed but then removed/corrupted
2. The package database is out of sync with actual files
3. Steam Deck's immutable filesystem might be interfering

## The Solution

### Option 1: Reinstall glib2 (Recommended)

```bash
sudo pacman -S --force glib2
```

This will reinstall glib2 and restore the missing `.pc` files.

### Option 2: Create Symlinks (If glib2 can't be reinstalled)

If the .pc files exist elsewhere, create symlinks:

```bash
# Find where the .pc files actually are
find /usr -name "glib-2.0.pc" 2>/dev/null

# If found in another location, symlink them
sudo ln -s /path/to/glib-2.0.pc /usr/lib/pkgconfig/glib-2.0.pc
```

### Option 3: Disable Immutable Filesystem

Steam Deck uses an immutable filesystem that might be preventing package files from being written:

```bash
# Disable read-only mode
sudo steamos-readonly disable

# Reinstall glib2
sudo pacman -S --force glib2

# Re-enable read-only mode (optional)
sudo steamos-readonly enable
```

### Option 4: Build Without Tauri GUI (Alternative Approach)

If you can't fix the glib2 issue, you could build RoControl as a pure CLI application without the Tauri GUI:

1. Use the web remote as the primary interface
2. Run the backend server standalone
3. Access via browser on any device

This would require modifying the build to be server-only, which bypasses the need for webkit/glib entirely.

## Verify the Fix

After trying one of the solutions above, verify:

```bash
export PKG_CONFIG_PATH="/usr/lib/pkgconfig:/usr/share/pkgconfig"
pkg-config --modversion glib-2.0
```

Should output: `2.82.4` (or similar version number)

## Then Build

Once glib-2.0 is found by pkg-config:

```bash
cd ~/Downloads/steamdeck-dmx-controller
./build.sh
```

## Why This Happened

Steam Deck's SteamOS has an immutable root filesystem for system stability. This can sometimes cause issues with package installations where files appear to be installed (in the package database) but aren't actually on disk.

The `/usr/lib/pkgconfig/` directory might be read-only or the files might have been cleaned up by the system.

## Alternative: Use Flatpak or AppImage

If compilation continues to be problematic due to Steam Deck's filesystem restrictions, consider:

1. **Flatpak**: Package RoControl as a Flatpak (fully self-contained)
2. **AppImage**: Build on a standard Linux system and copy the AppImage to Steam Deck
3. **Docker**: Build in a Docker container and extract the binary

For now, try **Option 3** (disable read-only mode, reinstall glib2) as it's most likely to work.
