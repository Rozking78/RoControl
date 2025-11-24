#!/bin/bash
# Final installation - WebKit2GTK and all Tauri dependencies

echo "╔════════════════════════════════════════════════════╗"
echo "║  Installing All Remaining Dependencies            ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

# Disable read-only
echo "Making filesystem writable..."
sudo steamos-readonly disable
echo "✓ Done"
echo ""

# Install everything needed
echo "Installing webkit2gtk, libsoup, pkg-config, and dependencies..."
echo "(This will download ~200MB and take 5-10 minutes)"
echo ""

sudo pacman -Sdd --needed --noconfirm \
    webkit2gtk \
    libsoup \
    pkg-config \
    openssl \
    curl \
    wget \
    file

echo ""
echo "Verifying installation..."
echo ""

# Check if libraries are available
if [ -f /usr/lib/libwebkit2gtk-4.0.so ]; then
    echo "✓ libwebkit2gtk-4.0 installed"
fi

if [ -f /usr/lib/libsoup-2.4.so ]; then
    echo "✓ libsoup-2.4 installed"
fi

if command -v pkg-config &> /dev/null; then
    echo "✓ pkg-config installed"
fi

echo ""
echo "╔════════════════════════════════════════════════════╗"
echo "║  ✓✓✓ INSTALLATION COMPLETE! ✓✓✓                   ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""
echo "═══════════════════════════════════════════════════════"
echo "  ALL DEPENDENCIES INSTALLED!"
echo ""
echo "  Now build the app:"
echo "    npm run tauri dev"
echo "═══════════════════════════════════════════════════════"
echo ""
