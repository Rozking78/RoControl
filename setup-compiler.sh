#!/bin/bash
# Setup script to install build tools for DMX Controller
# You need to run this manually in a terminal

set -e

echo "===================================="
echo "DMX Controller - Compiler Setup"
echo "===================================="
echo ""

# Initialize pacman keyring
echo "Step 1: Initializing pacman keyring..."
sudo pacman-key --init
sudo pacman-key --populate archlinux

echo ""
echo "Step 2: Adding SteamOS package signing key..."
# Receive and locally sign the SteamOS CI builder key
sudo pacman-key --recv-keys 5CC908FDB71E12C2 || true
sudo pacman-key --lsign-key 5CC908FDB71E12C2 || true

echo ""
echo "Step 3: Installing build tools (gcc, make, etc.)..."
sudo pacman -S --needed base-devel

echo ""
echo "Step 4: Verifying installation..."
if command -v gcc &> /dev/null; then
    echo "✓ GCC installed successfully:"
    gcc --version
else
    echo "✗ GCC installation failed"
    exit 1
fi

echo ""
echo "===================================="
echo "Setup Complete!"
echo "===================================="
echo ""
echo "You can now build the DMX controller with:"
echo "  npm run tauri:dev"
echo ""
