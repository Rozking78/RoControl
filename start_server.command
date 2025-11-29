#!/bin/bash

# RocKontrol Media Server Launcher
# Double-click this file to start the server with a settings GUI

cd "$(dirname "$0")"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

clear
echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         RocKontrol Media Server Launcher                      ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Node.js is not installed. Please install Node.js 18+ to continue.${NC}"
    exit 1
fi

# Check if NDI SDK is installed
if [ ! -d "/Library/NDI SDK for Apple" ]; then
    echo -e "${YELLOW}Warning: NDI SDK not found at /Library/NDI SDK for Apple${NC}"
    echo "NDI streaming will not work without the SDK."
    echo ""
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
    echo ""
fi

# Check if native sender is built
if [ ! -f "bin/media_sender" ]; then
    echo -e "${YELLOW}Building native NDI sender...${NC}"
    make
    echo ""
fi

# Get network interfaces
echo -e "${GREEN}Available Network Interfaces:${NC}"
echo ""

# Collect all non-loopback IP addresses
IPS=($(ifconfig | grep "inet " | grep -v "127.0.0.1" | awk '{print $2}'))

if [ ${#IPS[@]} -eq 0 ]; then
    echo -e "${YELLOW}No network interfaces found! Using localhost only.${NC}"
    IPS=("127.0.0.1")
fi

# Display options
echo "  0) 0.0.0.0 (All interfaces - recommended)"
for i in "${!IPS[@]}"; do
    INTERFACE_NAME=$(ifconfig | grep -B 1 "${IPS[$i]}" | head -1 | awk '{print $1}' | sed 's/://')
    echo "  $((i+1))) ${IPS[$i]} (${INTERFACE_NAME})"
done
echo "  $((${#IPS[@]}+1))) Custom IP address"
echo ""

# Prompt for selection
echo -e "${BLUE}Server Configuration${NC}"
read -p "Select network interface [0-$((${#IPS[@]}+1))]: " SELECTION

# Determine HOST and BROWSER_HOST
if [ "$SELECTION" = "0" ] || [ -z "$SELECTION" ]; then
    HOST="0.0.0.0"
    BROWSER_HOST="${IPS[0]}"  # Use first available IP for browser
elif [ "$SELECTION" = "$((${#IPS[@]}+1))" ]; then
    read -p "Enter custom IP address: " HOST
    BROWSER_HOST="$HOST"
elif [ "$SELECTION" -ge 1 ] && [ "$SELECTION" -le "${#IPS[@]}" ]; then
    HOST="${IPS[$((SELECTION-1))]}"
    BROWSER_HOST="$HOST"
else
    echo -e "${YELLOW}Invalid selection. Using 0.0.0.0${NC}"
    HOST="0.0.0.0"
    BROWSER_HOST="${IPS[0]}"
fi

# Prompt for port
echo ""
read -p "Port [4455]: " PORT
PORT=${PORT:-"4455"}

echo ""
echo -e "${GREEN}Starting server on http://${HOST}:${PORT}${NC}"
if [ "$HOST" = "0.0.0.0" ]; then
    echo -e "${GREEN}Web UI will open at: http://${BROWSER_HOST}:${PORT}${NC}"
else
    echo -e "${GREEN}Web UI will open at: http://${HOST}:${PORT}${NC}"
fi
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Open web browser after a delay to the selected address
(sleep 3 && open "http://${BROWSER_HOST}:${PORT}") &

# Start the server
HOST=${HOST} PORT=${PORT} npm start

# Cleanup on exit
echo ""
echo -e "${YELLOW}Server stopped.${NC}"
