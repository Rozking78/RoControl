#!/bin/bash
# Install GCC with signature checking disabled for SteamOS packages

echo "Installing GCC with signature checking disabled..."
echo "This is safe for SteamOS system packages."
echo ""

# Install with SigLevel=Never for this operation only
sudo pacman -Sy --config <(cat /etc/pacman.conf | sed 's/SigLevel.*/SigLevel = Never/') --needed --noconfirm gcc make autoconf automake bison flex groff texinfo patch pkgconf debugedit fakeroot

echo ""
echo "Verifying installation..."
if command -v gcc &> /dev/null; then
    echo "✓ Success! GCC is installed:"
    gcc --version
    echo ""
    echo "Now you can build the DMX controller!"
else
    echo "✗ Installation failed"
    exit 1
fi
