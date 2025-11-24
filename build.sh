#!/bin/bash
# Build script for RoControl with proper PKG_CONFIG_PATH

echo "Building RoControl..."
echo ""

# Set PKG_CONFIG_PATH to include standard locations
export PKG_CONFIG_PATH="/usr/lib/pkgconfig:/usr/share/pkgconfig:/usr/local/lib/pkgconfig:/usr/local/share/pkgconfig"

# Check if required packages are installed
echo "Checking dependencies..."

# Check for essential build tools (instead of base-devel group)
MISSING_TOOLS=false
for tool in gcc make pkg-config; do
    if ! command -v $tool &>/dev/null; then
        echo "✗ $tool not found"
        MISSING_TOOLS=true
    fi
done

if [ "$MISSING_TOOLS" = true ]; then
    echo ""
    echo "Missing essential build tools!"
    echo "Please run: sudo ./install-essential-tools.sh"
    exit 1
fi
echo "✓ Essential build tools installed (gcc, make, pkg-config)"

# Check for glib2-devel
if ! pacman -Q glib2-devel &>/dev/null; then
    echo "✗ glib2-devel not installed (THIS IS REQUIRED!)"
    echo "  Please install: sudo pacman -S --needed glib2-devel"
    echo ""
    echo "  Or run the install script: ./install-tauri-deps.sh"
    exit 1
fi
echo "✓ glib2-devel installed"

# Verify pkg-config can find required libraries
if pkg-config --exists glib-2.0; then
    echo "✓ glib-2.0 found ($(pkg-config --modversion glib-2.0))"
else
    echo "✗ glib-2.0 not found"
    echo "  This usually means glib2-devel isn't properly installed"
    echo "  Please run: sudo pacman -S --needed glib2-devel"
    exit 1
fi

if pkg-config --exists libsoup-2.4; then
    echo "✓ libsoup-2.4 found ($(pkg-config --modversion libsoup-2.4))"
else
    echo "✗ libsoup-2.4 not found"
    echo "  Please install: sudo pacman -S libsoup"
    exit 1
fi

if pkg-config --exists javascriptcoregtk-4.0; then
    echo "✓ javascriptcoregtk-4.0 found ($(pkg-config --modversion javascriptcoregtk-4.0))"
else
    echo "✗ javascriptcoregtk-4.0 not found"
    echo "  Please install: sudo pacman -S webkit2gtk"
    exit 1
fi

if pkg-config --exists webkit2gtk-4.0; then
    echo "✓ webkit2gtk-4.0 found ($(pkg-config --modversion webkit2gtk-4.0))"
else
    echo "✗ webkit2gtk-4.0 not found"
    echo "  Please install: sudo pacman -S webkit2gtk"
    exit 1
fi

echo ""
echo "All dependencies found!"
echo ""
echo "Building frontend..."

# Build frontend
npm run build

if [ $? -ne 0 ]; then
    echo "Frontend build failed!"
    exit 1
fi

echo ""
echo "Building Tauri application..."
echo "This may take 10-20 minutes on first build..."
echo ""

# Build Tauri app with PKG_CONFIG_PATH set
npm run tauri build

if [ $? -eq 0 ]; then
    echo ""
    echo "════════════════════════════════════════════════════════════"
    echo "✓ Build successful!"
    echo "════════════════════════════════════════════════════════════"
    echo ""
    echo "AppImage created at:"
    echo "  src-tauri/target/release/bundle/appimage/rocontrol_0.1.0_amd64.AppImage"
    echo ""
    echo "Binary created at:"
    echo "  src-tauri/target/release/rocontrol"
    echo ""
    echo "To run RoControl:"
    echo "  ./src-tauri/target/release/rocontrol"
    echo ""
    echo "Web remote will be available at:"
    echo "  http://0.0.0.0:8080"
    echo ""
else
    echo ""
    echo "✗ Build failed!"
    echo ""
    echo "Check the error messages above."
    echo "Common issues:"
    echo "  - Missing dependencies: run ./install-tauri-deps.sh"
    echo "  - Disk space: run 'df -h' to check available space"
    echo "  - Permissions: run 'chmod -R u+w src-tauri/target'"
    exit 1
fi
