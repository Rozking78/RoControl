#!/bin/bash
# Install Tauri build dependencies for Steam Deck (Arch Linux)

echo "Installing Tauri build dependencies for Steam Deck..."
echo ""

# Disable Steam Deck's read-only filesystem if enabled
if command -v steamos-readonly &> /dev/null; then
    echo "Disabling read-only mode (if enabled)..."
    sudo steamos-readonly disable 2>/dev/null || true
fi

# Initialize pacman keyring and trust Steam's builder
echo "Setting up pacman keys for Steam Deck..."
sudo pacman-key --init 2>/dev/null || true
sudo pacman-key --populate archlinux 2>/dev/null || true
sudo pacman-key --populate holo 2>/dev/null || true

# Update package database
echo "Updating package database..."
sudo pacman -Sy

# Install required development packages with SigLevel override for Steam Deck
echo ""
echo "Installing development packages..."
echo "Note: This may take a few minutes..."

sudo pacman -S --needed --noconfirm --disable-download-timeout \
    webkit2gtk \
    base-devel \
    glib2-devel \
    curl \
    wget \
    openssl \
    appmenu-gtk-module \
    gtk3 \
    libappindicator-gtk3 \
    librsvg \
    libvips

# Check if installation was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Dependencies installed successfully!"
    echo ""
    echo "You can now build RoControl:"
    echo "  npm run tauri build"
    echo ""
    echo "Or run in development mode:"
    echo "  npm run tauri dev"
else
    echo ""
    echo "✗ Installation failed. Trying alternative method..."
    echo ""

    # Alternative: Install with SigLevel bypass (less secure but works on Steam Deck)
    echo "Installing with signature verification relaxed..."
    sudo pacman -U --needed --noconfirm \
        --overwrite '*' \
        $(pacman -Sp base-devel webkit2gtk 2>/dev/null)

    if [ $? -ne 0 ]; then
        echo ""
        echo "⚠ Automated installation failed."
        echo ""
        echo "Please try manual installation:"
        echo "  sudo pacman-key --init"
        echo "  sudo pacman-key --populate archlinux holo"
        echo "  sudo pacman -Sy base-devel webkit2gtk"
        echo ""
        echo "Or consult QUICK_START.md for alternative solutions."
    fi
fi
