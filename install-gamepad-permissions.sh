#!/bin/bash

echo "Installing gamepad permissions for DMX Controller..."
echo ""

# Copy udev rules
echo "Step 1: Installing udev rules..."
sudo cp /tmp/99-dmx-controller-gamepad.rules /etc/udev/rules.d/
if [ $? -eq 0 ]; then
    echo "✓ udev rules installed"
else
    echo "✗ Failed to install udev rules"
    exit 1
fi

# Reload udev
echo ""
echo "Step 2: Reloading udev rules..."
sudo udevadm control --reload-rules
sudo udevadm trigger
if [ $? -eq 0 ]; then
    echo "✓ udev rules reloaded"
else
    echo "✗ Failed to reload udev rules"
    exit 1
fi

# Add user to input group (if not already)
echo ""
echo "Step 3: Adding user to input group..."
sudo usermod -a -G input $USER
if [ $? -eq 0 ]; then
    echo "✓ User added to input group"
else
    echo "✗ Failed to add user to input group"
fi

echo ""
echo "=========================================="
echo "Installation complete!"
echo ""
echo "Next steps:"
echo "1. Log out and log back in (for group membership)"
echo "2. In Steam Library, find your DMX Controller app"
echo "3. Right-click → Properties → Controller"
echo "4. Set 'Steam Input Per-Game Setting' to 'Disabled'"
echo "5. In Launch Options, add:"
echo "   /home/deck/Downloads/steamdeck-dmx-controller/launch-dmx.sh"
echo "=========================================="
