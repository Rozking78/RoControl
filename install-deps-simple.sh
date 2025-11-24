#!/bin/bash
# Simple dependency installer for Steam Deck
# Works around signature verification issues

echo "═══════════════════════════════════════════════════════════"
echo "  RoControl Dependency Installer for Steam Deck"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Check if we're running with sudo
if [ "$EUID" -ne 0 ]; then
    echo "This script needs sudo privileges."
    echo "Please run: sudo ./install-deps-simple.sh"
    exit 1
fi

echo "Step 1: Initializing pacman keyring..."
pacman-key --init
pacman-key --populate archlinux
pacman-key --populate holo

echo ""
echo "Step 2: Updating package database..."
pacman -Sy

echo ""
echo "Step 3: Installing base-devel..."
echo "This package group contains essential build tools."
echo ""

# Try installing with normal signature checking
pacman -S --needed --noconfirm base-devel

if [ $? -ne 0 ]; then
    echo ""
    echo "⚠ Normal installation failed (signature issues)."
    echo "Retrying with relaxed signature checking..."
    echo ""

    # Backup current pacman.conf
    cp /etc/pacman.conf /etc/pacman.conf.backup

    # Temporarily relax signature checking
    sed -i 's/^SigLevel.*$/SigLevel = Optional TrustAll/' /etc/pacman.conf

    # Try again
    pacman -Sy
    pacman -S --needed --noconfirm base-devel

    # Restore pacman.conf
    mv /etc/pacman.conf.backup /etc/pacman.conf
fi

echo ""
echo "Step 4: Installing webkit2gtk..."
pacman -S --needed --noconfirm webkit2gtk

echo ""
echo "Step 5: Installing glib2-devel (critical!)..."
pacman -S --needed --noconfirm glib2-devel

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Verifying installation..."
echo "═══════════════════════════════════════════════════════════"
echo ""

# Verify installations
ALL_GOOD=true

if pacman -Qg base-devel &>/dev/null; then
    BASE_COUNT=$(pacman -Qg base-devel | wc -l)
    echo "✓ base-devel installed ($BASE_COUNT packages)"
else
    echo "✗ base-devel NOT installed"
    ALL_GOOD=false
fi

if pacman -Q webkit2gtk &>/dev/null; then
    WEBKIT_VER=$(pacman -Q webkit2gtk | awk '{print $2}')
    echo "✓ webkit2gtk installed (version $WEBKIT_VER)"
else
    echo "✗ webkit2gtk NOT installed"
    ALL_GOOD=false
fi

if pacman -Q glib2-devel &>/dev/null; then
    GLIB_VER=$(pacman -Q glib2-devel | awk '{print $2}')
    echo "✓ glib2-devel installed (version $GLIB_VER)"
else
    echo "✗ glib2-devel NOT installed"
    ALL_GOOD=false
fi

echo ""
if [ "$ALL_GOOD" = true ]; then
    echo "═══════════════════════════════════════════════════════════"
    echo "  ✓ All dependencies installed successfully!"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    echo "You can now build RoControl:"
    echo "  cd /home/deck/Downloads/steamdeck-dmx-controller"
    echo "  ./build.sh"
    echo ""
else
    echo "═══════════════════════════════════════════════════════════"
    echo "  ✗ Some dependencies failed to install"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    echo "Please check the errors above and try again."
    echo ""
    echo "You may need to:"
    echo "  1. Check disk space: df -h"
    echo "  2. Check network connection"
    echo "  3. Try manual installation: sudo pacman -S base-devel glib2-devel webkit2gtk"
    echo ""
fi
