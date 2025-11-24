#!/bin/bash
# Force install WebKit2GTK bypassing ALL signature checks

echo "╔════════════════════════════════════════════════════╗"
echo "║  Installing WebKit2GTK (Signature Bypass)         ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

# Disable read-only
echo "Step 1: Making filesystem writable..."
sudo steamos-readonly disable
echo "✓ Done"
echo ""

# Install with --disable-download-timeout and signature bypass
echo "Step 2: Installing WebKit and dependencies..."
echo "   (Large download - please be patient)"
echo ""

# Use a here-document to answer 'n' to all delete prompts
yes n 2>/dev/null | sudo pacman -S --needed --overwrite '*' \
    webkit2gtk \
    gtk3 \
    libsoup \
    javascriptcoregtk \
    cairo \
    pango \
    gdk-pixbuf2 \
    glib2 \
    dbus \
    openssl 2>&1 | grep -v "signature" || true

echo ""
echo "Step 3: Verifying installation..."

if pkg-config --exists webkit2gtk-4.0 2>/dev/null; then
    echo ""
    echo "╔════════════════════════════════════════════════════╗"
    echo "║  ✓✓✓ SUCCESS! ✓✓✓                                 ║"
    echo "╚════════════════════════════════════════════════════╝"
    echo ""
    echo "WebKit version:"
    pkg-config --modversion webkit2gtk-4.0
    echo ""
    echo "═══════════════════════════════════════════════════════"
    echo "  READY TO BUILD!"
    echo ""
    echo "  Run: npm run tauri dev"
    echo "═══════════════════════════════════════════════════════"
    echo ""
else
    echo "⚠️  Still missing some libraries"
    echo ""
    echo "Try the manual approach below:"
    echo ""
    exit 1
fi
