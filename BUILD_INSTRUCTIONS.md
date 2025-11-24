# Build Instructions for RoControl

## Prerequisites

RoControl is built with Tauri (Rust + React) and requires certain system dependencies to compile.

### For Steam Deck (Arch Linux)

**Option 1: Automatic Installation**

Run the included install script:

```bash
cd /home/deck/Downloads/steamdeck-dmx-controller
./install-tauri-deps.sh
```

This will prompt for your sudo password and install all required dependencies.

**Option 2: Manual Installation**

Install dependencies with pacman:

```bash
sudo pacman -Sy
sudo pacman -S --needed \
    webkit2gtk \
    base-devel \
    curl \
    wget \
    openssl \
    appmenu-gtk-module \
    gtk3 \
    libappindicator-gtk3 \
    librsvg \
    libvips
```

### For Other Linux Distributions

**Debian/Ubuntu:**
```bash
sudo apt update
sudo apt install -y \
    libwebkit2gtk-4.0-dev \
    build-essential \
    curl \
    wget \
    libssl-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev \
    libvips-dev
```

**Fedora:**
```bash
sudo dnf install -y \
    webkit2gtk4.0-devel \
    openssl-devel \
    curl \
    wget \
    libappindicator-gtk3-devel \
    librsvg2-devel \
    libvips-devel
```

**Other distributions:**
See the [Tauri prerequisites guide](https://tauri.app/v1/guides/getting-started/prerequisites)

## Building the Application

### Development Build

For development and testing:

```bash
# Install Node.js dependencies
npm install

# Run in development mode
npm run tauri dev
```

This will:
1. Build the React frontend
2. Compile the Rust backend
3. Launch the application with hot-reload enabled
4. Start the web server on port 8080

### Production Build

For a production release:

```bash
# Build the frontend
npm run build

# Build the Tauri application
npm run tauri build
```

The compiled application will be in:
- AppImage: `src-tauri/target/release/bundle/appimage/`
- DEB package: `src-tauri/target/release/bundle/deb/`
- Binary: `src-tauri/target/release/rocontrol`

### Build for AppImage (Recommended for Steam Deck)

```bash
npm run tauri build

# The AppImage will be at:
# src-tauri/target/release/bundle/appimage/rocontrol_0.1.0_amd64.AppImage
```

Copy this AppImage to anywhere and make it executable:

```bash
chmod +x rocontrol_0.1.0_amd64.AppImage
./rocontrol_0.1.0_amd64.AppImage
```

## Troubleshooting Build Issues

### Issue: "libsoup-2.4 not found"

**Solution:** Install webkit2gtk development package:
```bash
sudo pacman -S webkit2gtk base-devel
```

### Issue: "javascriptcoregtk-4.0 not found"

**Solution:** This is part of webkit2gtk. Ensure webkit2gtk is installed:
```bash
sudo pacman -S webkit2gtk
```

### Issue: "Package 'glib-2.0' not found"

**Solution:** Install base development tools:
```bash
sudo pacman -S base-devel glib2
```

### Issue: Build fails with "permission denied"

**Solution:** Ensure you have write permissions:
```bash
chmod -R u+w src-tauri/target
```

### Issue: "disk full" during build

**Solution:** Rust compilation requires significant disk space. Clean old builds:
```bash
cd src-tauri
cargo clean
```

### Issue: Steam Deck read-only filesystem

**Solution:** Disable read-only mode:
```bash
sudo steamos-readonly disable
```

After installation, re-enable (optional):
```bash
sudo steamos-readonly enable
```

## Verifying the Build

### Check Frontend Build

```bash
npm run build
```

Should output:
```
✓ built in [time]
dist/index.html
dist/assets/...
```

### Check Rust Compilation

```bash
cd src-tauri
cargo check
```

Should complete without errors.

### Test the Application

```bash
npm run tauri dev
```

Should:
1. Open the RoControl window
2. Print "Web Remote Server starting on http://0.0.0.0:8080"
3. Allow CLI commands
4. Enable access to http://[your-ip]:8080 from other devices

## Build Times

Expected build times on Steam Deck:

- **First build (cold)**: 10-20 minutes (downloading and compiling dependencies)
- **Incremental build**: 1-3 minutes (only changed files)
- **Frontend only**: 5-10 seconds

## Disk Space Requirements

- **Source code**: ~50 MB
- **Node modules**: ~200 MB
- **Rust dependencies**: ~2 GB (in target/ directory)
- **Final binary**: ~15-20 MB (AppImage: ~25 MB)

Total: ~2.5 GB for full development environment

## Performance Optimization

### Faster Builds

Use the dev profile for faster compilation during development:

```bash
# In src-tauri/Cargo.toml, the dev profile is already optimized for fast compilation
# But for production builds, use --release
npm run tauri build -- --release
```

### Parallel Compilation

Rust uses all CPU cores by default. If you want to limit it:

```bash
export CARGO_BUILD_JOBS=4
npm run tauri build
```

### Incremental Compilation

Already enabled by default in Cargo.toml:

```toml
[profile.dev]
incremental = true
```

## Platform-Specific Notes

### Steam Deck

- **Game Mode**: The AppImage can be added as a Non-Steam game
- **Desktop Mode**: Run from Dolphin file manager or command line
- **Controls**: Application supports Steam Input with gamepad controls
- **Network**: Ensure WiFi is enabled for web remote functionality

### Linux Desktop

- **Wayland**: Fully supported
- **X11**: Fully supported
- **System Tray**: Uses libappindicator for system tray icon

## Clean Build

If you encounter persistent build issues, perform a clean build:

```bash
# Clean Node modules and build artifacts
rm -rf node_modules dist
npm install
npm run build

# Clean Rust build artifacts
cd src-tauri
cargo clean

# Rebuild everything
cd ..
npm run tauri build
```

## Development Workflow

Recommended workflow for active development:

1. **Start dev server**: `npm run tauri dev`
2. **Edit frontend code**: Changes hot-reload automatically
3. **Edit Rust code**: Save file, Tauri rebuilds and restarts
4. **Test web remote**: Open http://localhost:8080 in browser
5. **Build release**: `npm run tauri build` when ready to deploy

## CI/CD Build

For automated builds, use this script:

```bash
#!/bin/bash
set -e

# Install dependencies (skip if already installed)
npm ci

# Build frontend
npm run build

# Build Tauri app
npm run tauri build -- --bundles appimage

echo "Build complete: src-tauri/target/release/bundle/appimage/"
```

## Summary

Building RoControl requires:
1. System dependencies (webkit2gtk, build tools)
2. Node.js dependencies (npm install)
3. Rust compilation (via Tauri)

Once dependencies are installed, builds are fast and reliable.

For Steam Deck specifically: Run `./install-tauri-deps.sh` once, then use `npm run tauri build` to create an AppImage.
