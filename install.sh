#!/bin/bash
# Steam Deck DMX Controller - Installation Script

set -e

echo "================================="
echo "Steam Deck DMX Controller Setup"
echo "================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running on Steam Deck or Linux
if [ -f /etc/os-release ]; then
    . /etc/os-release
    echo "Detected OS: $NAME"
else
    echo "${RED}Could not detect OS. Proceeding anyway...${NC}"
fi

# Check for required commands
command -v curl >/dev/null 2>&1 || { echo "${RED}curl is required but not installed. Aborting.${NC}" >&2; exit 1; }

echo ""
echo "${GREEN}Step 1: Installing dependencies...${NC}"

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    if [[ "$ID" == "steamos" ]] || [[ "$ID_LIKE" == *"arch"* ]]; then
        sudo pacman -Sy --noconfirm nodejs npm
    elif [[ "$ID" == "ubuntu" ]] || [[ "$ID_LIKE" == *"debian"* ]]; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    else
        echo "${YELLOW}Please install Node.js 18+ manually${NC}"
        exit 1
    fi
else
    echo "Node.js already installed: $(node --version)"
fi

# Install Rust if not present
if ! command -v rustc &> /dev/null; then
    echo "Installing Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
else
    echo "Rust already installed: $(rustc --version)"
fi

echo ""
echo "${GREEN}Step 2: Installing project dependencies...${NC}"
npm install

echo ""
echo "${GREEN}Step 3: Building application...${NC}"
npm run tauri:build

echo ""
echo "${GREEN}Step 4: Setting up desktop integration...${NC}"

# Create desktop entry
DESKTOP_FILE="$HOME/.local/share/applications/steamdeck-dmx.desktop"
mkdir -p "$HOME/.local/share/applications"

cat > "$DESKTOP_FILE" << EOF
[Desktop Entry]
Name=DMX Controller
Comment=Professional DMX Lighting Controller for Steam Deck
Exec=$HOME/steamdeck-dmx-controller/src-tauri/target/release/steamdeck-dmx-controller
Icon=utilities-terminal
Terminal=false
Type=Application
Categories=Utility;AudioVideo;
EOF

echo "Desktop entry created at: $DESKTOP_FILE"

# Make binary executable
chmod +x src-tauri/target/release/steamdeck-dmx-controller

echo ""
echo "${GREEN}Step 5: Configuring network for Art-Net...${NC}"
echo "Art-Net uses UDP port 6454"
echo "Ensure your Steam Deck is connected to your lighting network"

# Check network interfaces
echo ""
echo "Available network interfaces:"
ip addr show | grep -E '^[0-9]+:|inet ' | grep -v '127.0.0.1'

echo ""
echo "${GREEN}=================================${NC}"
echo "${GREEN}Installation Complete!${NC}"
echo "${GREEN}=================================${NC}"
echo ""
echo "To launch the application:"
echo "1. Run: ./src-tauri/target/release/steamdeck-dmx-controller"
echo "2. Or find 'DMX Controller' in your applications menu"
echo ""
echo "To add to Steam:"
echo "1. Switch to Desktop Mode"
echo "2. Open Steam"
echo "3. Games → Add a Non-Steam Game to My Library"
echo "4. Browse to: $HOME/steamdeck-dmx-controller/src-tauri/target/release/steamdeck-dmx-controller"
echo ""
echo "Quick Start:"
echo "- Default Art-Net broadcast: 2.255.255.255"
echo "- Import GDTF fixtures from gdtf-share.com"
echo "- Use Steam Deck controls: L-Stick=Pan/Tilt, R2=Dimmer"
echo ""
echo "${YELLOW}Note: For Art-Net to work, ensure:${NC}"
echo "  - Steam Deck is on the same network as your DMX devices"
echo "  - UDP port 6454 is not blocked"
echo "  - Your Art-Net node is configured correctly"
echo ""
echo "Documentation: README.md"
echo "Support: https://github.com/yourusername/steamdeck-dmx-controller"
echo ""
