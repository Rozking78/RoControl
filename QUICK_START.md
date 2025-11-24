# Quick Start - Install Dependencies

## The Issue

The build is failing because development tools are not installed on your Steam Deck.

## The Solution

### Option 1: Use the Automated Script (Recommended)

```bash
# Navigate to project directory
cd /home/deck/Downloads/steamdeck-dmx-controller

# Run the install script
./install-tauri-deps.sh
```

This handles all the Steam Deck-specific setup automatically.

### Option 2: Manual Installation

If you encounter PGP signature errors, first initialize the keyring:

```bash
# Initialize pacman keys
sudo pacman-key --init
sudo pacman-key --populate archlinux holo

# Update package database
sudo pacman -Sy

# Install dependencies
sudo pacman -S --needed base-devel webkit2gtk
```

If you still see signature errors, you can temporarily bypass them:

```bash
# Install with SigLevel bypass (Steam Deck specific)
sudo pacman -S --needed base-devel webkit2gtk
# When prompted about corrupted packages, type 'y' to delete and continue
```

Then build the project:

```bash
npm run tauri build
```

## What This Does

- **base-devel**: Installs essential development tools (gcc, make, pkg-config, etc.)
- **webkit2gtk**: Web rendering engine required by Tauri

## After Installation

Once dependencies are installed, you can build RoControl:

```bash
# Production build (creates AppImage)
npm run tauri build

# Or run in development mode
npm run tauri dev
```

## Alternative: Use the Install Script

We've created an automated script:

```bash
./install-tauri-deps.sh
```

This installs all required dependencies automatically.

## Expected Results

After installation, the build should complete successfully and create:
- AppImage at: `src-tauri/target/release/bundle/appimage/rocontrol_0.1.0_amd64.AppImage`
- Binary at: `src-tauri/target/release/rocontrol`

## Web Remote

Once RoControl is running, access the web remote from any device:
```
http://[your-steam-deck-ip]:8080
```

Find your IP in Desktop Mode:
- Click network icon in system tray
- View connection details
