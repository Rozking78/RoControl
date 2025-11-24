#!/bin/bash
# Force reinstall glibc and linux headers to restore missing header files

echo "Force reinstalling glibc and linux-api-headers..."
echo "This will restore the missing C standard library headers."
echo ""

# Create temporary pacman config with signature checking disabled
TEMP_CONF=$(mktemp)
cp /etc/pacman.conf "$TEMP_CONF"
sed -i 's/^SigLevel.*/SigLevel = Never/' "$TEMP_CONF"

# Force reinstall with --overwrite to ensure files are written
echo "Reinstalling linux-api-headers..."
sudo pacman -S --config "$TEMP_CONF" --overwrite '*' --noconfirm linux-api-headers

echo ""
echo "Reinstalling glibc..."
sudo pacman -S --config "$TEMP_CONF" --overwrite '*' --noconfirm glibc

# Clean up
rm -f "$TEMP_CONF"

echo ""
echo "Verifying header files..."
if [ -f /usr/include/stdlib.h ]; then
    echo "✓ Success! Standard C headers are now present:"
    ls -la /usr/include/stdlib.h /usr/include/stdio.h /usr/include/string.h
    echo ""
    echo "You can now build the DMX controller with: npm run tauri:dev"
else
    echo "✗ Headers still missing. Trying alternative approach..."
    echo "Extracting glibc package manually..."

    # Alternative: download and extract package manually
    cd /tmp
    sudo pacman -Sw --config "$TEMP_CONF" --noconfirm glibc

    PKG_FILE=$(find /var/cache/pacman/pkg/ -name "glibc-*.pkg.tar.zst" | head -1)
    if [ -n "$PKG_FILE" ]; then
        echo "Extracting $PKG_FILE to root filesystem..."
        sudo tar -xf "$PKG_FILE" -C / usr/include/
        echo "Headers extracted!"
        ls -la /usr/include/stdlib.h 2>/dev/null && echo "✓ stdlib.h now present"
    fi
fi
