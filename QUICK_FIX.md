# Quick Fix - Install GCC on SteamOS

## The Nuclear Option (Most Reliable)

Run this script - it temporarily modifies pacman.conf to disable ALL signature checking, installs GCC, then restores the original config:

```bash
./install-force.sh
```

---

## Alternative: Manual Step-by-Step

If the script fails, do this manually:

### 1. Disable read-only
```bash
sudo steamos-readonly disable
```

### 2. Backup pacman config
```bash
sudo cp /etc/pacman.conf /etc/pacman.conf.backup
```

### 3. Disable signature checking
```bash
sudo sed -i 's/^SigLevel.*/SigLevel = Never/g' /etc/pacman.conf
```

### 4. Install GCC
```bash
sudo pacman -Sy
sudo pacman -S --needed gcc make
```

### 5. Restore config
```bash
sudo mv /etc/pacman.conf.backup /etc/pacman.conf
```

### 6. Verify
```bash
gcc --version
```

### 7. Create symlink
```bash
sudo ln -sf /usr/bin/gcc /usr/bin/cc
```

---

## Last Resort: Skip Dependencies

If NOTHING works, try installing without dependency checks:

```bash
sudo steamos-readonly disable
sudo pacman -Sdd --needed gcc make
```

The `-dd` flag skips ALL dependency checks and will force install.

---

## Nuclear Nuclear Option: Download Packages Manually

If pacman is completely broken:

```bash
# Download packages
cd /tmp
wget https://archive.archlinux.org/packages/g/gcc/gcc-14.2.1+r134+gab884fffe3fc-2-x86_64.pkg.tar.zst
wget https://archive.archlinux.org/packages/m/make/make-4.4.1-2-x86_64.pkg.tar.zst

# Install without verification
sudo pacman -U --noconfirm *.pkg.tar.zst

# Clean up
rm *.pkg.tar.zst
```

---

## After Success

Test it:
```bash
gcc --version
npm run tauri dev
```

---

**TRY THIS FIRST:** `./install-force.sh`
