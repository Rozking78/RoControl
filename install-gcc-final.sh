#!/bin/bash
# Install GCC for SteamOS - Final version
# Temporarily disables signature checking

echo "Installing GCC and build tools..."
echo ""

# Create temporary pacman config with signature checking disabled
TEMP_CONF=$(mktemp)
cp /etc/pacman.conf "$TEMP_CONF"
sed -i 's/^SigLevel.*/SigLevel = Never/' "$TEMP_CONF"

echo "Installing packages..."
sudo pacman -Sy --config "$TEMP_CONF" --needed --noconfirm \
    gcc \
    make \
    autoconf \
    automake \
    bison \
    flex \
    groff \
    texinfo \
    patch \
    pkgconf \
    debugedit \
    fakeroot \
    libisl \
    libmpc \
    m4

# Clean up
rm -f "$TEMP_CONF"

echo ""
echo "Verifying installation..."
if command -v gcc &> /dev/null; then
    echo "✓ Success! GCC is installed:"
    gcc --version
    echo ""
    echo "You can now build the DMX controller with: npm run tauri:dev"
else
    echo "✗ Installation failed"
    exit 1
fi
