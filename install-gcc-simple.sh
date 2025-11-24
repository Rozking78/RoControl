#!/bin/bash
# Simple GCC installation script for SteamOS
# Bypasses signature verification issues

set -e

echo "===================================="
echo "Installing GCC for DMX Controller"
echo "===================================="
echo ""

echo "This will install build tools with signature checking disabled"
echo "Press Ctrl+C to cancel, or Enter to continue..."
read

echo "Installing base-devel (gcc, make, etc.)..."
sudo pacman -S --needed --noconfirm --disable-download-timeout base-devel || \
    sudo pacman -Sdd --needed --noconfirm base-devel

echo ""
echo "Verifying installation..."
if command -v gcc &> /dev/null; then
    echo "✓ Success! GCC installed:"
    gcc --version
    echo ""
    echo "You can now build the DMX controller with:"
    echo "  npm run tauri:dev"
else
    echo "✗ Installation failed. Trying alternative method..."
    echo "Attempting to install gcc directly..."
    sudo pacman -Sdd --noconfirm gcc make
fi
