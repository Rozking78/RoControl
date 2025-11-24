# Install Dependencies Now - Two Simple Commands

## The Situation

Your build failed with this error:
```
The system library `libsoup-2.4` required by crate `soup2-sys` was not found.
```

**Root Cause:** Missing development packages (base-devel, glib2-devel)

**Solution:** Install them with our automated script!

## The Fix (Copy & Paste)

Open **Konsole** (the terminal) and run:

```bash
cd ~/Downloads/steamdeck-dmx-controller
sudo ./install-deps-simple.sh
```

Enter your password when prompted.

After installation completes, run:

```bash
./build.sh
```

**Done!** Wait 10-20 minutes for the build to complete.

## What This Does

The `install-deps-simple.sh` script:
1. ✓ Initializes pacman keyring (fixes signature errors)
2. ✓ Installs base-devel (build tools: gcc, make, pkg-config)
3. ✓ Installs webkit2gtk (web rendering engine)
4. ✓ Installs glib2-devel (THE MISSING PIECE - development headers)
5. ✓ Verifies everything installed correctly

**It handles signature issues automatically** by temporarily relaxing signature checks if needed.

## Expected Output

You should see:
```
═══════════════════════════════════════════════════════════
  RoControl Dependency Installer for Steam Deck
═══════════════════════════════════════════════════════════

Step 1: Initializing pacman keyring...
Step 2: Updating package database...
Step 3: Installing base-devel...
Step 4: Installing webkit2gtk...
Step 5: Installing glib2-devel (critical!)...

═══════════════════════════════════════════════════════════
  Verifying installation...
═══════════════════════════════════════════════════════════

✓ base-devel installed (24 packages)
✓ webkit2gtk installed (version 2.46.5-1)
✓ glib2-devel installed (version 2.82.4-2)

═══════════════════════════════════════════════════════════
  ✓ All dependencies installed successfully!
═══════════════════════════════════════════════════════════

You can now build RoControl:
  cd /home/deck/Downloads/steamdeck-dmx-controller
  ./build.sh
```

## After Dependencies Are Installed

Run the build script:

```bash
./build.sh
```

This will:
1. Check all dependencies are present
2. Build the React frontend (~5 seconds)
3. Compile the Rust backend (~10-20 minutes)
4. Create an AppImage and binary

## What You'll Get

After a successful build:

**AppImage:**
```
src-tauri/target/release/bundle/appimage/rocontrol_0.1.0_amd64.AppImage
```

**Binary:**
```
src-tauri/target/release/rocontrol
```

## Running RoControl

```bash
# Option 1: Run the binary
./src-tauri/target/release/rocontrol

# Option 2: Run the AppImage
./src-tauri/target/release/bundle/appimage/rocontrol_0.1.0_amd64.AppImage
```

## Accessing the Web Remote

1. Start RoControl (using either method above)
2. Look for this message:
   ```
   Web Remote Server starting on http://0.0.0.0:8080
   ```
3. Find your Steam Deck's IP address:
   - Click network icon in system tray
   - Select "Connection Information"
   - Note the IP (e.g., 192.168.1.100)

4. On any device (phone, tablet, laptop), open a browser:
   ```
   http://192.168.1.100:8080
   ```
   (Replace with your actual IP)

5. You can now control RoControl remotely!

## Troubleshooting

### Script says "base-devel NOT installed"

The signature verification failed. Try:

```bash
# Option 1: Manual key initialization
sudo pacman-key --init
sudo pacman-key --populate archlinux holo
sudo ./install-deps-simple.sh

# Option 2: Temporarily disable read-only mode
sudo steamos-readonly disable
sudo ./install-deps-simple.sh
sudo steamos-readonly enable
```

### "No space left on device"

Check disk space:
```bash
df -h /home
```

If low on space:
```bash
# Clean old builds
cd src-tauri
cargo clean
```

### "Permission denied"

Make scripts executable:
```bash
chmod +x install-deps-simple.sh build.sh
```

## Why This Happened

Steam Deck doesn't include development tools by default because:
- They take up significant disk space (~500MB)
- Most users don't need them
- They're only needed for compiling software

That's why you need to install them manually!

## Summary

**Two commands, that's it:**

```bash
sudo ./install-deps-simple.sh  # Install dependencies
./build.sh                      # Build RoControl
```

Then access your web remote at `http://[your-ip]:8080`

**Total time:** 5 minutes install + 15 minutes build = 20 minutes to success! 🚀
