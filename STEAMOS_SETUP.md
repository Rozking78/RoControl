# SteamOS Build Tools Setup Guide

## The Problem

SteamOS uses a **read-only filesystem** by default, which prevents installing packages. We need to:
1. Disable read-only mode (temporary)
2. Install build tools (GCC/compiler)
3. Build the Tauri application

## Quick Setup (Recommended)

Run this one command:

```bash
./install-steamos-buildtools.sh
```

Enter your password when prompted. This will handle everything automatically.

---

## Manual Setup (If Script Fails)

### Step 1: Disable Read-Only Filesystem

```bash
sudo steamos-readonly disable
```

**Note:** This is temporary and will reset on reboot. The installed packages persist.

### Step 2: Initialize Pacman Keyring

```bash
sudo pacman-key --init
sudo pacman-key --populate archlinux
```

### Step 3: Update Package Database

```bash
sudo pacman -Sy
```

### Step 4: Install Build Tools

```bash
sudo pacman -S --needed base-devel gcc glibc linux-api-headers make
```

Press Enter to confirm installation.

### Step 5: Verify Installation

```bash
gcc --version
```

You should see GCC version information.

### Step 6: Build the DMX Controller

```bash
npm run tauri dev
```

---

## Alternative: Use Pre-Built Binary

If you don't want to install build tools, we can:

1. **Build on another Linux machine** with Rust/GCC installed
2. **Copy the binary** to Steam Deck
3. **Run the pre-built app**

Would you prefer this approach?

---

## Troubleshooting

### Error: "unexpected error" when syncing databases

**Fix:**
```bash
sudo steamos-readonly disable
sudo pacman-key --init
sudo pacman-key --populate archlinux
sudo pacman -Sy
```

### Error: "failed to synchronize"

**Fix:** Check internet connection:
```bash
ping -c 3 archlinux.org
```

If offline, connect to WiFi first.

### Error: After reboot, can't build anymore

**Fix:** After rebooting, run again:
```bash
sudo steamos-readonly disable
```

The packages remain installed, but filesystem becomes read-only again.

---

## After Installation

Once build tools are installed, you can:

### Development Mode
```bash
npm run tauri dev
```

### Production Build
```bash
npm run tauri build
```

The built app will be in:
```
src-tauri/target/release/
```

### Add to Steam

1. In Steam Desktop Mode, click "Games" → "Add a Non-Steam Game"
2. Browse to the built executable
3. Add it to your library
4. Switch to Gaming Mode and launch!

---

## Notes

- Build tools take ~200-300 MB of space
- Installation is one-time only
- Read-only mode resets on reboot (but packages stay)
- You can re-enable read-only mode: `sudo steamos-readonly enable`

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `sudo steamos-readonly disable` | Allow package installation |
| `sudo steamos-readonly enable` | Re-enable read-only mode |
| `gcc --version` | Check if GCC is installed |
| `npm run tauri dev` | Run in development mode |
| `npm run tauri build` | Build for production |

---

**Ready to proceed?** Run: `./install-steamos-buildtools.sh`
