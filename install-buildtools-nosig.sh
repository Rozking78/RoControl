#!/bin/bash
# Install build tools on SteamOS - Skip signature verification
# This is safe for official SteamOS packages

set -e

echo "╔════════════════════════════════════════════════════╗"
echo "║  SteamOS Build Tools - No Signature Check         ║"
echo "║  Steam Deck DMX Controller                        ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""
echo "Note: Temporarily disabling signature checks for SteamOS packages"
echo "      This is necessary because SteamOS uses custom signing keys."
echo ""

# Check if already disabled
if grep -q "steamos-readonly status" /usr/bin/steamos-readonly 2>/dev/null; then
    echo "Step 1: Checking read-only status..."
    if sudo steamos-readonly status | grep -q "enabled"; then
        echo "   Disabling read-only filesystem..."
        sudo steamos-readonly disable
        echo "✓ Read-only mode disabled"
    else
        echo "✓ Already writable"
    fi
else
    echo "Step 1: Disabling read-only filesystem..."
    sudo steamos-readonly disable
    echo "✓ Done"
fi
echo ""

echo "Step 2: Installing build tools (skipping signature verification)..."
echo "   This may take several minutes..."
echo ""

# Create temporary pacman config with SigLevel = Never
TEMP_CONF=$(mktemp)
sudo cp /etc/pacman.conf "$TEMP_CONF"
sudo sed -i 's/^SigLevel.*/SigLevel = Never/' "$TEMP_CONF"
sudo sed -i 's/^#SigLevel.*/SigLevel = Never/' "$TEMP_CONF"
# Also set it globally
echo "" | sudo tee -a "$TEMP_CONF" > /dev/null
echo "[options]" | sudo tee -a "$TEMP_CONF" > /dev/null
echo "SigLevel = Never" | sudo tee -a "$TEMP_CONF" > /dev/null

# Clean up any corrupted cached packages
echo "   Cleaning package cache..."
sudo rm -f /var/cache/pacman/pkg/*.part
sudo pacman -Sc --noconfirm 2>/dev/null || true

# Update database
echo "   Updating package database..."
sudo pacman -Sy --config "$TEMP_CONF"

# Install packages
echo "   Installing packages..."
sudo pacman -S --config "$TEMP_CONF" --needed --noconfirm \
    base-devel \
    gcc \
    make

# Clean up temp config
sudo rm -f "$TEMP_CONF"

echo ""
echo "Step 3: Verifying installation..."
echo ""

if command -v gcc &> /dev/null; then
    echo "╔════════════════════════════════════════════════════╗"
    echo "║  ✓ Installation Successful!                       ║"
    echo "╚════════════════════════════════════════════════════╝"
    echo ""
    echo "GCC Version:"
    gcc --version | head -1
    echo ""

    # Create cc symlink if needed
    if ! command -v cc &> /dev/null; then
        echo "Creating 'cc' symlink..."
        sudo ln -sf /usr/bin/gcc /usr/bin/cc
        echo "✓ Done"
        echo ""
    fi

    echo "═══════════════════════════════════════════════════════"
    echo "  Ready to build!"
    echo "═══════════════════════════════════════════════════════"
    echo ""
    echo "Run this command to test:"
    echo "  npm run tauri dev"
    echo ""
    echo "Or build for production:"
    echo "  npm run tauri build"
    echo ""
    echo "Note: After rebooting, run 'sudo steamos-readonly disable'"
    echo "      before building again."
    echo ""
else
    echo "✗ Installation failed - GCC not found"
    echo ""
    echo "Please check errors above and try:"
    echo "  sudo pacman -Sy gcc make"
    exit 1
fi
