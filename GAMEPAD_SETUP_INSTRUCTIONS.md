# Gamepad Capture Setup for SteamOS (Non-Steam Games)

## Problem
When running as a non-Steam game, Steam Input intercepts gamepad controls before your app can capture them exclusively.

## Complete Setup (Run These Commands)

### 1. Install Permissions (Run in Konsole)
```bash
cd /home/deck/Downloads/steamdeck-dmx-controller
./install-gamepad-permissions.sh
```

### 2. Configure Steam (Manual Steps)

#### Option A: Disable Steam Input (Recommended)
1. Open **Steam** → **Library**
2. Find **DMX Controller** in your games list
3. Right-click → **Properties**
4. Go to **Controller** section
5. Set **Steam Input Per-Game Setting** to: **Disabled**
6. Click **OK**

#### Option B: Use Custom Launch Script
1. Open **Steam** → **Library**
2. Find **DMX Controller** in your games list
3. Right-click → **Properties**
4. In **Launch Options**, enter:
   ```
   /home/deck/Downloads/steamdeck-dmx-controller/launch-dmx.sh
   ```
5. Click **OK**

### 3. Test the App
1. Launch the app from Steam
2. Open **Setup** → **Gamepad** tab
3. Enable "Capture gamepad exclusively"
4. Check the result message - it should say devices were grabbed successfully

## Files Created

- `/tmp/99-dmx-controller-gamepad.rules` - udev rules for permissions
- `/home/deck/Downloads/steamdeck-dmx-controller/launch-dmx.sh` - Launch script that disables Steam Input
- `/home/deck/Downloads/steamdeck-dmx-controller/install-gamepad-permissions.sh` - Installation script

## Troubleshooting

### No devices grabbed
- Make sure you disabled Steam Input for this game
- Check that you ran the install script
- Log out and log back in after running install script

### Permission denied errors
- Run the install script again
- Make sure you're in the `input` group: `groups | grep input`
- Reboot the Steam Deck

### Still not working
- Try both Option A AND Option B together
- Make sure the app is running (not just added to Steam)
- Check launch script has execute permissions: `ls -l launch-dmx.sh`

## How It Works

1. **udev rules**: Give your user permissions to access gamepad devices
2. **Disable Steam Input**: Prevents Steam from intercepting gamepad
3. **Launch script**: Sets environment variables to bypass Steam's gamepad handling
4. **evdev grab()**: Your app takes exclusive control of the gamepad
