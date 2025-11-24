# Steam Deck Setup Guide for RoControl

## PGP Signature Issue - SOLVED

You're seeing PGP signature errors because Steam Deck uses a custom package repository. Here's how to fix it:

## Solution 1: Initialize Pacman Keyring (Recommended)

Open Konsole (terminal) and run:

```bash
# Step 1: Initialize the keyring
sudo pacman-key --init

# Step 2: Populate with Steam Deck and Arch keys
sudo pacman-key --populate archlinux holo

# Step 3: Update package database
sudo pacman -Sy

# Step 4: Install dependencies
sudo pacman -S --needed base-devel webkit2gtk glib2-devel

# Step 5: Build RoControl
cd /home/deck/Downloads/steamdeck-dmx-controller
npm run tauri build
```

**Password:** Your Steam Deck user password (set in Desktop Mode)

## Solution 2: Edit Pacman Config (If Solution 1 Fails)

If you still get signature errors, temporarily relax signature checking:

```bash
# Edit pacman config
sudo nano /etc/pacman.conf
```

Find the line:
```
SigLevel = Required DatabaseOptional
```

Change it to:
```
SigLevel = Optional TrustAll
```

Press `Ctrl+X`, then `Y`, then `Enter` to save.

Then install:
```bash
sudo pacman -Sy
sudo pacman -S --needed base-devel webkit2gtk
```

**IMPORTANT:** After installation, change it back to `Required DatabaseOptional` for security.

## Solution 3: Use Our Automated Script

We've created a script that tries multiple methods:

```bash
cd /home/deck/Downloads/steamdeck-dmx-controller
./install-tauri-deps.sh
```

Enter your password when prompted.

## Understanding the Error

The error message:
```
signature from "GitLab CI Package Builder <ci-package-builder-1@steamos.cloud>" is unknown trust
```

This happens because:
1. Steam Deck uses a custom package repository
2. The packages are signed by Valve's GitLab CI
3. The signing key isn't in your keyring yet

**Fix:** Run `sudo pacman-key --populate archlinux holo` to trust these keys.

## Verification

After installing dependencies, verify with:

```bash
# Check pkg-config is installed
which pkg-config

# Check base-devel is installed
pacman -Qg base-devel | wc -l
# Should show: 24 (or similar number)

# Check webkit2gtk is installed
pacman -Q webkit2gtk
# Should show: webkit2gtk 2.46.5-1 (or similar)
```

## Building RoControl

Once dependencies are installed:

```bash
# Navigate to project
cd /home/deck/Downloads/steamdeck-dmx-controller

# Build for production
npm run tauri build

# Or run in development mode
npm run tauri dev
```

## Expected Build Time

- **First build:** 10-20 minutes (compiling Rust dependencies)
- **Incremental builds:** 1-3 minutes
- **Frontend only:** 5-10 seconds

## Disk Space

Ensure you have at least **3 GB free** on your Steam Deck for the build process.

Check with:
```bash
df -h /home
```

## Common Issues

### "No space left on device"

**Solution:** Clean up disk space or use an SD card:

```bash
# Clean old builds
cd ~/Downloads/steamdeck-dmx-controller/src-tauri
cargo clean

# Or move entire project to SD card
mv ~/Downloads/steamdeck-dmx-controller /run/media/mmcblk0p1/
cd /run/media/mmcblk0p1/steamdeck-dmx-controller
```

### "Permission denied"

**Solution:** Fix permissions:

```bash
chmod -R u+w ~/Downloads/steamdeck-dmx-controller
```

### "Read-only file system"

**Solution:** Disable read-only mode:

```bash
sudo steamos-readonly disable
```

After installation, you can re-enable it:

```bash
sudo steamos-readonly enable
```

## Alternative: Use Flatpak (Coming Soon)

If compilation is problematic, we're working on a Flatpak version that won't require compilation:

```bash
# Future command (not yet available)
flatpak install rocontrol.flatpak
```

## Running RoControl

After successful build:

```bash
# Run the AppImage
~/Downloads/steamdeck-dmx-controller/src-tauri/target/release/bundle/appimage/rocontrol_0.1.0_amd64.AppImage

# Or run the binary directly
~/Downloads/steamdeck-dmx-controller/src-tauri/target/release/rocontrol
```

## Adding to Steam (Game Mode)

1. In Desktop Mode, right-click the AppImage
2. Select "Add to Steam"
3. In Steam, find it under "Non-Steam Games"
4. Configure controller layout as needed

## Web Remote Access

Once RoControl is running:

1. Find your Steam Deck's IP:
   - Click network icon in system tray
   - Select "Connection Information"
   - Note the IP address (e.g., 192.168.1.100)

2. On any device on the same network, open a browser:
   ```
   http://[YOUR_IP]:8080
   ```

3. You can now control RoControl remotely!

## Still Having Issues?

Check these files for more help:
- `QUICK_START.md` - Quick installation steps
- `BUILD_INSTRUCTIONS.md` - Detailed build guide
- `WEB_REMOTE.md` - Web remote documentation

Or create an issue on GitHub with:
- Full error message
- Output of `pacman -Qg base-devel`
- Output of `df -h`
- Steam Deck OS version

## Summary

**The Fix:**
```bash
sudo pacman-key --init
sudo pacman-key --populate archlinux holo
sudo pacman -Sy
sudo pacman -S --needed base-devel webkit2gtk
cd ~/Downloads/steamdeck-dmx-controller
npm run tauri build
```

That's it! The signature errors will be resolved and you'll be able to build RoControl successfully.
