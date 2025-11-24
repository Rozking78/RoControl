#!/bin/bash

# Launcher for DMX Controller that disables Steam Input
# This allows the app to capture gamepad exclusively on SteamOS

# Disable Steam Input environment variables
export SteamDeck=0
export SDL_GAMECONTROLLER_ALLOW_STEAM_VIRTUAL_GAMEPAD=0
export SDL_GAMECONTROLLERCONFIG=""

# Kill any interfering Steam processes (only for this session)
# This ensures Steam Input doesn't grab the controller
pkill -f "steamwebhelper.*--gamepadui-mode" 2>/dev/null || true

# Launch the DMX Controller
cd "$(dirname "$0")"
./src-tauri/target/release/steam-deck-dmx

# Alternative: Use npm for development
# npm run tauri:dev
