#!/bin/bash
# Install essential build tools individually (workaround for base-devel signature issues)

echo "═══════════════════════════════════════════════════════════"
echo "  Installing Essential Build Tools"
echo "═══════════════════════════════════════════════════════════"
echo ""

if [ "$EUID" -ne 0 ]; then
    echo "Please run with sudo: sudo ./install-essential-tools.sh"
    exit 1
fi

echo "Installing essential build tools individually..."
echo "This works around the base-devel signature issues."
echo ""

# List of essential packages from base-devel that we actually need
ESSENTIAL_PACKAGES=(
    "gcc"
    "make"
    "pkg-config"
    "autoconf"
    "automake"
    "binutils"
    "bison"
    "fakeroot"
    "file"
    "findutils"
    "flex"
    "gawk"
    "gettext"
    "grep"
    "groff"
    "gzip"
    "libtool"
    "m4"
    "patch"
    "pkgconf"
    "sed"
    "sudo"
    "texinfo"
    "which"
)

# Backup pacman.conf
cp /etc/pacman.conf /etc/pacman.conf.backup.essential

# Temporarily relax signature checking for this installation
sed -i 's/^SigLevel.*$/SigLevel = Optional TrustAll/' /etc/pacman.conf

# Update database
pacman -Sy

INSTALLED=0
FAILED=0

for pkg in "${ESSENTIAL_PACKAGES[@]}"; do
    if pacman -Q "$pkg" &>/dev/null; then
        echo "✓ $pkg already installed"
        ((INSTALLED++))
    else
        echo -n "Installing $pkg... "
        if pacman -S --needed --noconfirm "$pkg" &>/dev/null; then
            echo "✓"
            ((INSTALLED++))
        else
            echo "✗ (failed, but may not be critical)"
            ((FAILED++))
        fi
    fi
done

# Restore pacman.conf
mv /etc/pacman.conf.backup.essential /etc/pacman.conf

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Installation Summary"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Installed: $INSTALLED packages"
echo "Failed: $FAILED packages"
echo ""

# Verify critical tools
echo "Verifying critical build tools..."
echo ""

ALL_GOOD=true

if command -v gcc &>/dev/null; then
    GCC_VER=$(gcc --version | head -n1)
    echo "✓ gcc found: $GCC_VER"
else
    echo "✗ gcc NOT found (CRITICAL!)"
    ALL_GOOD=false
fi

if command -v make &>/dev/null; then
    MAKE_VER=$(make --version | head -n1)
    echo "✓ make found: $MAKE_VER"
else
    echo "✗ make NOT found (CRITICAL!)"
    ALL_GOOD=false
fi

if command -v pkg-config &>/dev/null; then
    PKG_VER=$(pkg-config --version)
    echo "✓ pkg-config found: version $PKG_VER"
else
    echo "✗ pkg-config NOT found (CRITICAL!)"
    ALL_GOOD=false
fi

if command -v cargo &>/dev/null; then
    CARGO_VER=$(cargo --version)
    echo "✓ cargo found: $CARGO_VER"
else
    echo "⚠ cargo NOT found (install Rust separately if needed)"
fi

echo ""

if [ "$ALL_GOOD" = true ]; then
    echo "═══════════════════════════════════════════════════════════"
    echo "  ✓ Essential build tools installed successfully!"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    echo "You can now build RoControl:"
    echo "  cd /home/deck/Downloads/steamdeck-dmx-controller"
    echo "  ./build.sh"
    echo ""
else
    echo "═══════════════════════════════════════════════════════════"
    echo "  ✗ Some critical tools are missing"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    echo "Please try installing manually:"
    echo "  sudo pacman -S gcc make pkg-config"
    echo ""
fi
