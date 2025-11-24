#!/bin/bash
# Install C standard library headers

echo "Installing C library headers..."

# Create temporary pacman config with signature checking disabled
TEMP_CONF=$(mktemp)
cp /etc/pacman.conf "$TEMP_CONF"
sed -i 's/^SigLevel.*/SigLevel = Never/' "$TEMP_CONF"

# Install linux headers and glibc
sudo pacman -Sy --config "$TEMP_CONF" --needed --noconfirm \
    linux-api-headers \
    glibc

# Clean up
rm -f "$TEMP_CONF"

echo ""
echo "C library headers installed!"
echo "You can now build the DMX controller with: npm run tauri:dev"
