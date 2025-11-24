#!/bin/bash
# Install build tools on SteamOS
# Handles read-only filesystem and SteamOS-specific issues

set -e

echo "╔════════════════════════════════════════════════════╗"
echo "║  SteamOS Build Tools Installer                    ║"
echo "║  Steam Deck DMX Controller                        ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

# Check if running on SteamOS
if ! grep -q "SteamOS" /etc/os-release 2>/dev/null; then
    echo "⚠️  Warning: This doesn't appear to be SteamOS"
    echo "   Continuing anyway..."
    echo ""
fi

echo "Step 1: Disabling read-only filesystem..."
echo "   (This is temporary and will reset on reboot)"
sudo steamos-readonly disable
echo "✓ Read-only mode disabled"
echo ""

echo "Step 2: Initializing pacman keyring..."
sudo pacman-key --init
sudo pacman-key --populate archlinux
echo "✓ Keyring initialized"
echo ""

echo "Step 3: Updating package databases..."
sudo pacman -Sy
echo "✓ Databases updated"
echo ""

echo "Step 4: Installing build tools..."
echo "   This may take a few minutes..."
echo ""

# Install base development tools
sudo pacman -S --needed --noconfirm \
    base-devel \
    gcc \
    glibc \
    linux-api-headers \
    make

echo ""
echo "Step 5: Verifying installation..."
echo ""

if command -v gcc &> /dev/null; then
    echo "✓ GCC installed successfully!"
    gcc --version | head -1
    echo ""
    if command -v cc &> /dev/null; then
        echo "✓ C compiler (cc) available!"
    else
        echo "⚠️  Creating cc symlink..."
        sudo ln -sf /usr/bin/gcc /usr/bin/cc
        echo "✓ cc symlink created"
    fi
    echo ""
    echo "╔════════════════════════════════════════════════════╗"
    echo "║  ✓ Installation Complete!                         ║"
    echo "╚════════════════════════════════════════════════════╝"
    echo ""
    echo "You can now build the DMX controller:"
    echo "  npm run tauri dev"
    echo ""
    echo "Note: After rebooting Steam Deck, you may need to run:"
    echo "  sudo steamos-readonly disable"
    echo "  (Build tools will persist, but filesystem resets)"
    echo ""
else
    echo "✗ Installation failed - GCC not found"
    echo ""
    echo "Troubleshooting:"
    echo "1. Check internet connection"
    echo "2. Try running: sudo pacman -Syu"
    echo "3. Check /var/log/pacman.log for errors"
    exit 1
fi
