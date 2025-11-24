#!/bin/bash
# RoControl - Steam Deck DMX Lighting Controller
# Launch script for Steam

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Set the binary path
ROCONTROL_BIN="$SCRIPT_DIR/src-tauri/target/release/ro-control"

# Check if binary exists
if [ ! -f "$ROCONTROL_BIN" ]; then
    zenity --error --text="RoControl binary not found!\n\nPlease build the app first:\nnpm run tauri:build" --width=400
    exit 1
fi

# Make sure it's executable
chmod +x "$ROCONTROL_BIN"

# Set environment variables for better Steam Deck compatibility
export WEBKIT_DISABLE_COMPOSITING_MODE=1
export WEBKIT_DISABLE_DMABUF_RENDERER=1

# Disable Steam's on-screen keyboard for this app
# This prevents the Steam keyboard from popping up when using touch
export SteamAppId=0
export STEAM_DISABLE_OSK=1

# Launch the app
cd "$SCRIPT_DIR"
exec "$ROCONTROL_BIN" "$@"
