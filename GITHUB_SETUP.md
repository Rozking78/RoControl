# GitHub Installation Guide

## Quick Install from GitHub

### Option 1: Using Git (Recommended)

On your Steam Deck, open **Konsole** (terminal) and run:

```bash
# Install git if needed
sudo steamos-readonly disable
sudo pacman -Sy git
sudo steamos-readonly enable

# Clone the repository
cd ~/Downloads
git clone https://github.com/YOUR_USERNAME/steamdeck-dmx-controller.git
cd steamdeck-dmx-controller

# Run the installer
chmod +x install.sh
./install.sh
```

### Option 2: Download ZIP from GitHub

1. Go to the GitHub repository
2. Click the green **Code** button
3. Select **Download ZIP**
4. On Steam Deck (Desktop Mode):
   - Open the downloaded ZIP
   - Extract to `/home/deck/Downloads/`
   - Open Konsole and run:

```bash
cd ~/Downloads/steamdeck-dmx-controller
chmod +x install.sh
./install.sh
```

## Setting Up Your Own GitHub Repository

If you want to host this yourself:

### 1. Create a New Repository on GitHub

1. Go to https://github.com/new
2. Repository name: `steamdeck-dmx-controller`
3. Description: "DMX Lighting Controller for Steam Deck"
4. Public or Private (your choice)
5. **Don't** initialize with README (we already have one)
6. Click **Create repository**

### 2. Push the Code

On your computer where you have the files:

```bash
cd steamdeck-dmx-controller

# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/steamdeck-dmx-controller.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### 3. Now Anyone Can Install

Share this command:

```bash
git clone https://github.com/YOUR_USERNAME/steamdeck-dmx-controller.git
cd steamdeck-dmx-controller
chmod +x install.sh
./install.sh
```

## Repository Structure

```
steamdeck-dmx-controller/
├── .gitignore              # Git ignore file
├── LICENSE                 # MIT License
├── README.md               # Main documentation
├── CONTRIBUTING.md         # Contribution guidelines
├── GDTF_GUIDE.md          # GDTF fixture guide
├── TROUBLESHOOTING.md      # Debug guide
├── install.sh             # Installation script
├── package.json           # Node.js dependencies
├── vite.config.js        # Vite configuration
├── index.html            # HTML template
├── demo-show.json        # Example show file
├── src/                  # React frontend
│   ├── main.jsx
│   ├── App.jsx
│   ├── App.css
│   └── index.css
└── src-tauri/           # Rust backend
    ├── Cargo.toml
    ├── build.rs
    ├── tauri.conf.json
    └── src/
        └── main.rs
```

## For Steam Deck Users

### Quick Start (After Cloning)

```bash
cd steamdeck-dmx-controller
./install.sh
```

This will:
- ✅ Install Node.js and Rust
- ✅ Install all dependencies
- ✅ Build the application
- ✅ Create desktop shortcut
- ✅ Ready to use!

### Add to Steam

After installation:

1. **Desktop Mode** → Open Steam
2. **Games** → **Add a Non-Steam Game**
3. Browse to: `/home/deck/Downloads/steamdeck-dmx-controller/src-tauri/target/release/steamdeck-dmx-controller`
4. Add it
5. Switch to **Gaming Mode** and launch like any game!

## Updates

To get the latest version:

```bash
cd ~/Downloads/steamdeck-dmx-controller
git pull
npm install
npm run tauri:build
```

## Issues or Questions?

- **Bug reports**: Open an issue on GitHub
- **Feature requests**: Open an issue with the "enhancement" label
- **Questions**: Use GitHub Discussions

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines!

---

**Ready to light up your shows with Steam Deck! 🎮💡✨**
