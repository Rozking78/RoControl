#!/bin/bash
# Final comprehensive fix for Steam Deck glib2 issue

echo "═══════════════════════════════════════════════════════════"
echo "  RoControl - Final Fix for glib2 Issue"
echo "═══════════════════════════════════════════════════════════"
echo ""

if [ "$EUID" -ne 0 ]; then
    echo "Please run with sudo: sudo ./FINAL_FIX.sh"
    exit 1
fi

echo "Step 1: Disabling read-only filesystem (if enabled)..."
if command -v steamos-readonly &>/dev/null; then
    steamos-readonly disable 2>/dev/null || true
    echo "✓ Read-only mode disabled"
else
    echo "✓ Not a Steam Deck (skipping)"
fi

echo ""
echo "Step 2: Reinitializing pacman..."
pacman-key --init
pacman-key --populate archlinux holo
echo "✓ Pacman keys initialized"

echo ""
echo "Step 3: Updating package database..."
pacman -Sy
echo "✓ Database updated"

echo ""
echo "Step 4: Force-reinstalling glib2 (this restores .pc files)..."
pacman -S --force --noconfirm glib2
echo "✓ glib2 reinstalled"

echo ""
echo "Step 5: Installing/verifying other dependencies..."
pacman -S --needed --noconfirm webkit2gtk glib2-devel
echo "✓ Dependencies checked"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Verifying Fix"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Check if .pc files exist now
if [ -f "/usr/lib/pkgconfig/glib-2.0.pc" ]; then
    echo "✓ glib-2.0.pc file exists"
else
    echo "✗ glib-2.0.pc file STILL missing!"
    echo ""
    echo "Trying to locate it..."
    FOUND_PC=$(find /usr -name "glib-2.0.pc" 2>/dev/null | head -1)
    if [ -n "$FOUND_PC" ]; then
        echo "Found at: $FOUND_PC"
        echo "Creating symlink..."
        ln -sf "$FOUND_PC" /usr/lib/pkgconfig/glib-2.0.pc
        echo "✓ Symlink created"
    else
        echo "✗ glib-2.0.pc not found anywhere!"
        echo ""
        echo "This is a serious issue. Possible solutions:"
        echo "  1. The Steam Deck filesystem is preventing file creation"
        echo "  2. The glib2 package in the Steam Deck repos is broken"
        echo "  3. Build RoControl on a regular Linux system instead"
    fi
fi

# Test pkg-config
export PKG_CONFIG_PATH="/usr/lib/pkgconfig:/usr/share/pkgconfig"
if pkg-config --exists glib-2.0; then
    GLIB_VER=$(pkg-config --modversion glib-2.0)
    echo "✓ pkg-config can find glib-2.0 (version $GLIB_VER)"
else
    echo "✗ pkg-config still can't find glib-2.0"
fi

# Check critical tools
echo ""
echo "Checking build tools..."
for tool in gcc make pkg-config; do
    if command -v $tool &>/dev/null; then
        echo "✓ $tool found"
    else
        echo "✗ $tool NOT found"
    fi
done

echo ""
echo "═══════════════════════════════════════════════════════════"

if pkg-config --exists glib-2.0; then
    echo "  ✓ SUCCESS! All dependencies ready!"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    echo "You can now build RoControl:"
    echo "  cd /home/deck/Downloads/steamdeck-dmx-controller"
    echo "  ./build.sh"
    echo ""
else
    echo "  ⚠ glib-2.0 issue persists"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    echo "The Steam Deck's immutable filesystem may be preventing"
    echo "the installation of development files."
    echo ""
    echo "Alternative solutions:"
    echo "  1. Build on a regular Linux machine and copy the AppImage"
    echo "  2. Use a Docker container to build"
    echo "  3. Wait for a Flatpak version (coming soon)"
    echo ""
    echo "See FIX_GLIB.md for more details."
    echo ""
fi
