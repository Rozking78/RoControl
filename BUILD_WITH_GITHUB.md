# Build RoControl Using GitHub Actions (Free Cloud Build)

## Why Use GitHub Actions?

- ✅ Free for public repositories
- ✅ No Steam Deck filesystem issues
- ✅ Automatic building in the cloud
- ✅ Professional CI/CD setup
- ✅ Download ready-to-use AppImage
- ✅ Takes 10-15 minutes total

## Step-by-Step Instructions

### Step 1: Create a GitHub Repository

1. Go to https://github.com
2. Sign in (or create a free account)
3. Click the **"+"** button (top right) → **"New repository"**
4. Name it: `rocontrol` or `steamdeck-dmx-controller`
5. Make it **Public** (required for free Actions)
6. Click **"Create repository"**

### Step 2: Push Your Code to GitHub

On your Steam Deck, run:

```bash
cd ~/Downloads/steamdeck-dmx-controller

# Initialize git (if not already done)
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit - RoControl with web remote"

# Add your GitHub repository as remote
# Replace YOUR_USERNAME with your GitHub username
git remote add origin https://github.com/YOUR_USERNAME/rocontrol.git

# Push to GitHub
git push -u origin main
```

**Note:** If you get a branch name error, try:
```bash
git branch -M main
git push -u origin main
```

### Step 3: GitHub Will Build Automatically!

Once you push:

1. Go to your GitHub repository page
2. Click the **"Actions"** tab
3. You'll see a workflow running called "Build RoControl"
4. Wait 10-15 minutes for it to complete (it will turn green ✅)

### Step 4: Download Your AppImage

After the build completes:

1. Click on the completed workflow
2. Scroll down to **"Artifacts"**
3. Download **"rocontrol-appimage"** (zip file)
4. Extract it to get `rocontrol_0.1.0_amd64.AppImage`

### Step 5: Copy to Steam Deck (if building elsewhere)

If you downloaded on another device:

```bash
# From your computer, copy to Steam Deck
scp rocontrol_0.1.0_amd64.AppImage deck@steamdeck:~/

# Or use a USB drive, cloud storage, etc.
```

On Steam Deck:

```bash
chmod +x rocontrol_0.1.0_amd64.AppImage
./rocontrol_0.1.0_amd64.AppImage
```

## Alternative: Manual Trigger

You can also trigger builds manually:

1. Go to **Actions** tab on GitHub
2. Click **"Build RoControl"** workflow
3. Click **"Run workflow"** button
4. Select branch (main)
5. Click **"Run workflow"**

## Troubleshooting

### "git push" asks for username/password

GitHub now uses Personal Access Tokens:

1. Go to GitHub Settings → Developer Settings → Personal Access Tokens
2. Generate new token (classic)
3. Give it `repo` permissions
4. Use the token as your password when pushing

**Or use SSH:**
```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"

# Add to GitHub: Settings → SSH and GPG keys

# Use SSH URL instead
git remote set-url origin git@github.com:YOUR_USERNAME/rocontrol.git
```

### Build fails on GitHub

Check the build log in Actions tab. Common issues:
- Missing files (make sure you committed everything)
- npm install failures (check package.json)

### Can't create public repository

GitHub Actions requires a public repository for free usage. If you need private:
- GitHub Pro (free for students)
- Or build locally on a non-Steam Deck Linux machine

## What Happens in the Cloud Build?

The GitHub Actions workflow:

1. ✅ Checks out your code
2. ✅ Installs Node.js 20
3. ✅ Installs Rust compiler
4. ✅ Installs all Ubuntu dependencies (webkit2gtk, etc.)
5. ✅ Runs `npm install`
6. ✅ Runs `npm run build` (frontend)
7. ✅ Runs `npm run tauri build` (creates AppImage)
8. ✅ Uploads AppImage as downloadable artifact

All automatically, no manual steps needed!

## Benefits of This Approach

- **No Steam Deck filesystem issues** - builds on clean Ubuntu
- **Repeatable** - same build every time
- **Automated** - push code, get AppImage
- **Free** - unlimited builds for public repos
- **Fast** - GitHub's servers are powerful
- **Professional** - same CI/CD setup used by major projects

## After First Build

Every time you make changes:

```bash
# Make your code changes
# ...

# Commit and push
git add .
git commit -m "Description of changes"
git push

# GitHub automatically builds
# Download new AppImage from Actions tab
```

## Summary

**Total time:** 15-20 minutes (most of it is automated build time)

**Steps:**
1. Create GitHub repo (2 minutes)
2. Push code (2 minutes)
3. Wait for build (10-15 minutes)
4. Download AppImage (1 minute)
5. Run on Steam Deck (instant)

**Result:** Working RoControl AppImage without fighting Steam Deck's filesystem!

---

**This is the recommended approach** for Steam Deck development when local compilation is blocked by filesystem restrictions.
