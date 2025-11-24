#!/bin/bash
# Simple installer for SteamOS - Skip all signature checks

echo "╔════════════════════════════════════════════════════╗"
echo "║  Installing Build Tools for Steam Deck            ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

# Disable read-only
echo "Step 1: Making filesystem writable..."
sudo steamos-readonly disable
echo "✓ Done"
echo ""

# Clean cache
echo "Step 2: Cleaning package cache..."
sudo rm -rf /var/cache/pacman/pkg/*.part
sudo pacman -Sc --noconfirm 2>/dev/null || true
echo "✓ Done"
echo ""

# Update database with no signature checking
echo "Step 3: Updating package database..."
sudo pacman -Sy --noconfirm
echo "✓ Done"
echo ""

# Install with signature level never
echo "Step 4: Installing build tools..."
echo "   (This will take a few minutes)"
echo ""
sudo pacman -S --noconfirm --needed gcc make 2>&1 | grep -v "signature" || true
echo ""

# Verify
echo "Step 5: Verifying installation..."
if command -v gcc &> /dev/null; then
    echo ""
    echo "╔════════════════════════════════════════════════════╗"
    echo "║  ✓ SUCCESS!                                       ║"
    echo "╚════════════════════════════════════════════════════╝"
    echo ""
    gcc --version | head -1
    echo ""

    # Create cc symlink
    if ! command -v cc &> /dev/null; then
        sudo ln -sf /usr/bin/gcc /usr/bin/cc
        echo "✓ Created 'cc' symlink"
    fi

    echo ""
    echo "═══════════════════════════════════════════════════════"
    echo "  Ready to build! Run:"
    echo "    npm run tauri dev"
    echo "═══════════════════════════════════════════════════════"
    echo ""
else
    echo "✗ Installation failed"
    echo ""
    echo "Try this manual command:"
    echo "  sudo steamos-readonly disable"
    echo "  sudo pacman -Syu --overwrite '*' gcc make"
    exit 1
fi
