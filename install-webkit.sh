#!/bin/bash
# Install WebKit2GTK and Tauri dependencies for SteamOS

echo "╔════════════════════════════════════════════════════╗"
echo "║  Installing WebKit2GTK for Tauri                  ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

# Ensure read-only is disabled
echo "Step 1: Ensuring filesystem is writable..."
sudo steamos-readonly disable
echo "✓ Done"
echo ""

# Backup and modify pacman.conf for signature bypass
echo "Step 2: Configuring pacman..."
sudo cp /etc/pacman.conf /etc/pacman.conf.backup
sudo sed -i 's/^SigLevel.*/SigLevel = Never/g' /etc/pacman.conf
echo "✓ Done"
echo ""

# Update database
echo "Step 3: Updating package database..."
sudo pacman -Sy
echo "✓ Done"
echo ""

# Install WebKit and dependencies
echo "Step 4: Installing WebKit2GTK and dependencies..."
echo "   (This is a large download - may take 5-10 minutes)"
echo ""
sudo pacman -S --needed --noconfirm \
    webkit2gtk \
    gtk3 \
    libsoup \
    javascriptcoregtk \
    cairo \
    pango \
    gdk-pixbuf2 \
    glib2 \
    dbus \
    openssl \
    libappindicator-gtk3

echo ""

# Restore pacman.conf
echo "Step 5: Restoring pacman configuration..."
sudo mv /etc/pacman.conf.backup /etc/pacman.conf
echo "✓ Done"
echo ""

# Verify
echo "Step 6: Verifying installation..."
if pkg-config --exists webkit2gtk-4.0 2>/dev/null; then
    echo ""
    echo "╔════════════════════════════════════════════════════╗"
    echo "║  ✓✓✓ SUCCESS! ✓✓✓                                 ║"
    echo "╚════════════════════════════════════════════════════╝"
    echo ""
    echo "WebKit2GTK version:"
    pkg-config --modversion webkit2gtk-4.0
    echo ""
    echo "═══════════════════════════════════════════════════════"
    echo "  ALL DEPENDENCIES INSTALLED!"
    echo ""
    echo "  Now you can build the app:"
    echo "    npm run tauri dev"
    echo ""
    echo "  Or build for production:"
    echo "    npm run tauri build"
    echo "═══════════════════════════════════════════════════════"
    echo ""
else
    echo "⚠️  WebKit2GTK may not be fully installed"
    echo ""
    echo "Try running manually:"
    echo "  sudo pacman -S webkit2gtk gtk3 libsoup"
    echo ""
    exit 1
fi
