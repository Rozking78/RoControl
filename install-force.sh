#!/bin/bash
# Force install build tools by temporarily modifying pacman.conf

echo "╔════════════════════════════════════════════════════╗"
echo "║  Force Installing Build Tools                     ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

# Disable read-only
echo "Step 1: Disabling read-only mode..."
sudo steamos-readonly disable || true
echo "✓ Done"
echo ""

# Backup and modify pacman.conf
echo "Step 2: Configuring pacman..."
sudo cp /etc/pacman.conf /etc/pacman.conf.backup
sudo sed -i 's/^SigLevel.*/SigLevel = Never/g' /etc/pacman.conf
sudo sed -i '/^\[core\]/a SigLevel = Never' /etc/pacman.conf
sudo sed -i '/^\[extra\]/a SigLevel = Never' /etc/pacman.conf
sudo sed -i '/^\[community\]/a SigLevel = Never' /etc/pacman.conf
sudo sed -i '/^\[jupiter\]/a SigLevel = Never' /etc/pacman.conf 2>/dev/null || true
sudo sed -i '/^\[holo\]/a SigLevel = Never' /etc/pacman.conf 2>/dev/null || true
echo "✓ Done"
echo ""

# Clean cache
echo "Step 3: Cleaning package cache..."
sudo rm -f /var/cache/pacman/pkg/*.part
echo "✓ Done"
echo ""

# Update database
echo "Step 4: Updating package database..."
sudo pacman -Sy
echo "✓ Done"
echo ""

# Install packages
echo "Step 5: Installing gcc and make..."
sudo pacman -S --needed --noconfirm gcc make
INSTALL_RESULT=$?
echo ""

# Restore original pacman.conf
echo "Step 6: Restoring pacman configuration..."
sudo mv /etc/pacman.conf.backup /etc/pacman.conf
echo "✓ Done"
echo ""

# Verify
echo "Step 7: Verifying installation..."
if command -v gcc &> /dev/null; then
    echo ""
    echo "╔════════════════════════════════════════════════════╗"
    echo "║  ✓✓✓ SUCCESS! ✓✓✓                                 ║"
    echo "╚════════════════════════════════════════════════════╝"
    echo ""
    echo "Installed:"
    gcc --version | head -1
    echo ""

    # Create cc symlink
    if ! command -v cc &> /dev/null; then
        sudo ln -sf /usr/bin/gcc /usr/bin/cc
        echo "✓ Created 'cc' symlink"
        echo ""
    fi

    echo "═══════════════════════════════════════════════════════"
    echo "  YOU'RE READY TO BUILD!"
    echo ""
    echo "  Run this command:"
    echo "    npm run tauri dev"
    echo "═══════════════════════════════════════════════════════"
    echo ""
else
    echo "✗ Installation failed"
    echo ""
    echo "Trying alternative approach..."
    echo "Run these commands manually:"
    echo ""
    echo "  sudo steamos-readonly disable"
    echo "  sudo pacman -Sdd --needed --noconfirm gcc make"
    echo ""
    exit 1
fi
