# RoControl Build Guide

## Current Issue: White Screen on Steam Deck

The AppImage builds successfully but shows a white screen on Steam Deck due to WebKit2GTK EGL initialization failure. The root cause and solution are known, but AppImage repackaging in GitHub Actions has proven unreliable.

## Building on Mac (Recommended)

Building on Mac allows you to manually create the AppImage with the correct AppRun script.

### Prerequisites

1. Install Homebrew (if not already installed):
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. Install required dependencies:
   ```bash
   # Node.js and npm
   brew install node

   # Rust
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   source $HOME/.cargo/env

   # Tauri CLI
   cargo install tauri-cli
   ```

3. Install cross-compilation tools for Linux:
   ```bash
   # Install Docker Desktop for Mac
   # Download from: https://www.docker.com/products/docker-desktop

   # Or use cross-compilation with cargo-cross
   cargo install cross
   ```

### Build Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/Rozking78/RoControl.git
   cd RoControl
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Build the frontend:
   ```bash
   npm run build
   ```

4. Build for Linux (using Docker/cross):
   ```bash
   # Option 1: Using cross (recommended)
   cd src-tauri
   cross build --release --target x86_64-unknown-linux-gnu

   # Option 2: Using Docker
   docker run --rm -v $(pwd):/app -w /app rust:latest cargo build --release
   ```

5. Create AppImage with correct AppRun:
   ```bash
   # Download appimagetool for Mac
   wget https://github.com/AppImage/AppImageKit/releases/download/continuous/appimagetool-x86_64.AppImage
   chmod +x appimagetool-x86_64.AppImage

   # Extract the built AppImage
   cd src-tauri/target/release/bundle/appimage
   ./ro-control_*.AppImage --appimage-extract

   # Replace AppRun with Steam Deck version
   cat > squashfs-root/AppRun << 'EOF'
#!/bin/bash
SELF=$(readlink -f "$0")
HERE=${SELF%/*}
export PATH="${HERE}/usr/bin/:${PATH}"
export LD_LIBRARY_PATH="${HERE}/usr/lib/:${LD_LIBRARY_PATH}"

# Steam Deck / WebKit EGL fix - CRITICAL: Must be set before exec
export WEBKIT_DISABLE_COMPOSITING_MODE=1
export WEBKIT_DISABLE_DMABUF_RENDERER=1
export GDK_RENDERING=image
export GDK_BACKEND=x11
export LIBGL_ALWAYS_SOFTWARE=1

# Disable Steam's on-screen keyboard
export SteamAppId=0
export STEAM_DISABLE_OSK=1

exec "${HERE}/usr/bin/ro-control" "$@"
EOF

   chmod +x squashfs-root/AppRun

   # Repackage AppImage
   ARCH=x86_64 ./appimagetool-x86_64.AppImage squashfs-root RoControl-FIXED.AppImage
   ```

6. Test on Steam Deck:
   ```bash
   # Copy to Steam Deck
   scp RoControl-FIXED.AppImage deck@steamdeck:~/

   # On Steam Deck, run it
   chmod +x ~/RoControl-FIXED.AppImage
   ~/RoControl-FIXED.AppImage
   ```

## Alternative: Build Directly on Steam Deck

Building on Steam Deck is challenging due to read-only filesystem, but possible:

### Prerequisites on Steam Deck

1. Disable read-only filesystem (temporary):
   ```bash
   sudo steamos-readonly disable
   ```

2. Install development tools:
   ```bash
   sudo pacman -S base-devel rust nodejs npm webkit2gtk
   ```

3. Build:
   ```bash
   cd /home/deck/RoControl
   npm install
   npm run build
   PKG_CONFIG_PATH=/usr/lib/pkgconfig npm run tauri build
   ```

4. Re-enable read-only filesystem:
   ```bash
   sudo steamos-readonly enable
   ```

## Required Environment Variables

These MUST be set in the AppRun script before the application starts:

```bash
export WEBKIT_DISABLE_COMPOSITING_MODE=1  # Disable WebKit compositing
export WEBKIT_DISABLE_DMABUF_RENDERER=1   # Disable DMA-BUF renderer
export GDK_RENDERING=image                # Force GTK CPU rendering
export GDK_BACKEND=x11                    # Ensure X11 backend
export LIBGL_ALWAYS_SOFTWARE=1            # Force Mesa software rendering
```

## Workaround: Web Interface

Until the AppImage is fixed, use the web interface:

1. Start the AppImage (backend will start even if UI fails)
2. Open browser to http://localhost:8080
3. Full functionality available through web interface

Or use the launcher script:
```bash
/home/deck/rocontrol-web-launcher.sh
```

## Troubleshooting

### White Screen on Steam Deck
- **Symptom**: Window opens but shows only white screen
- **Error in logs**: `Could not create default EGL display: EGL_BAD_PARAMETER`
- **Cause**: Environment variables not set before WebKit initialization
- **Solution**: Use AppImage with custom AppRun (see build steps above)

### Build Fails in GitHub Actions
- **Symptom**: AppImage repackaging fails with mksquashfs errors
- **Cause**: CI environment limitations with FUSE/squashfs
- **Solution**: Build locally on Mac or Linux with proper tools

### Binary Not Found
- **Symptom**: `/tmp/.mount_*/usr/bin/rocontrol: No such file or directory`
- **Cause**: Binary name is `ro-control` (with hyphen), not `rocontrol`
- **Solution**: Update AppRun to use `ro-control`

## Project Structure

```
RoControl/
├── src/                    # Frontend source (React/Vite)
├── src-tauri/             # Tauri backend (Rust)
│   ├── src/main.rs        # Main application
│   └── tauri.conf.json    # Tauri configuration
├── AppDir/                # Custom AppImage directory (not used by Tauri)
│   └── AppRun             # Custom AppRun script
├── .github/workflows/     # CI/CD workflows
└── BUILD_GUIDE.md         # This file
```

## Next Steps

1. **Immediate**: Build locally on Mac with correct AppRun
2. **Short-term**: Test manually built AppImage on Steam Deck
3. **Long-term**: Investigate Tauri v2 upgrade for better WebKit control

## Resources

- [Tauri Documentation](https://tauri.app/v1/guides/)
- [AppImage Specification](https://docs.appimage.org/)
- [WebKit2GTK Documentation](https://webkitgtk.org/)
- [Steam Deck Development](https://partner.steamgames.com/doc/steamdeck/loadinggames)
