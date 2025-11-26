# RoControl Changelog

## v0.4.9 (2025-11-26) - Binary Name Fix (BUILD FAILED)

### Fixed
- Fixed AppRun binary path: changed from `rocontrol` to `ro-control` (with hyphen)
- v0.4.8 failed to launch because binary name didn't match

### Result
- Build FAILED - mksquashfs/runtime combination issues in GitHub Actions
- AppImage repackaging not reliable in CI environment

---

## Current Status (2025-11-26)

### White Screen Issue - NOT YET FIXED
The white screen issue on Steam Deck remains unresolved. Multiple approaches have been attempted:

**Root Cause:**
- WebKit2GTK requires environment variables set BEFORE process execution
- Tauri's AppImage bundler generates generic AppRun without Steam Deck-specific settings
- Environment variables must be in AppRun script, not Rust code

**Attempted Fixes:**
1. v0.4.3-0.4.5: Setting env vars in Rust `main()` - Failed (too late, WebKit already initializing)
2. v0.4.6-0.4.7: Post-build patching with appimagetool - Failed (FUSE requirements in CI)
3. v0.4.8: Manual squashfs repackaging - Build succeeded but wrong binary name
4. v0.4.9: Fixed binary name - Build failed (squashfs/runtime issues)

**Required Environment Variables:**
```bash
export WEBKIT_DISABLE_COMPOSITING_MODE=1
export WEBKIT_DISABLE_DMABUF_RENDERER=1
export GDK_RENDERING=image
export GDK_BACKEND=x11
export LIBGL_ALWAYS_SOFTWARE=1
```

**Workaround:**
The web interface works perfectly - backend services start successfully at http://localhost:8080
Use the web launcher script: `/home/deck/rocontrol-web-launcher.sh`

**Next Steps:**
- Try building AppImage locally on Mac with proper AppRun
- Consider alternative: Build on Steam Deck if filesystem constraints can be resolved
- Investigate Tauri v2 upgrade (may have better AppImage/WebKit control)

---

## v0.4.8 (2025-11-26) - AppImage Repackaging Fix (FAILED TO LAUNCH)

### Changed
- Replaced appimagetool with manual AppImage repackaging using mksquashfs
- Now uses squashfs-tools and AppImage runtime to rebuild patched AppImage
- More reliable repackaging that doesn't require FUSE

### Technical Details
- v0.4.7 failed because appimagetool requires FUSE which may not be available in GitHub Actions
- v0.4.8 manually creates squashfs filesystem and combines with AppImage runtime
- Same custom AppRun with Steam Deck environment variables

---

## v0.4.7 (2025-11-26) - Build Failed

### Result
- Build FAILED - appimagetool couldn't repackage AppImage in GitHub Actions environment
- Likely due to FUSE requirement or other containerization issues
- Led to v0.4.8 with manual repackaging approach

---

## v0.4.6 (2025-11-25) - WHITE SCREEN FIX

### Fixed
- **CRITICAL: White screen issue on Steam Deck** caused by WebKit EGL initialization failure
  - Root cause: Tauri's AppImage bundler generates AppRun without Steam Deck environment variables
  - Solution: Post-build step patches AppImage with custom AppRun setting:
    - `WEBKIT_DISABLE_COMPOSITING_MODE=1` - Disables WebKit compositing
    - `WEBKIT_DISABLE_DMABUF_RENDERER=1` - Disables DMA-BUF renderer
    - `GDK_RENDERING=image` - Forces GTK CPU rendering
    - `GDK_BACKEND=x11` - Ensures X11 backend (Steam Deck requirement)
    - `LIBGL_ALWAYS_SOFTWARE=1` - Forces Mesa software rendering
  - These MUST be set in AppRun before process starts, not in Rust code

### Technical Details
- Environment variables set via `std::env::set_var()` in main.rs don't work because WebKit initializes during `tauri::Builder::run()`
- GitHub Actions workflow now extracts AppImage, replaces AppRun, and repackages with appimagetool
- See commit `45d5a19` for implementation

### User Feedback Addressed
- "look at logs last build started all white screen" - Investigated build logs and EGL errors
- "rebuild from git hub to ensure latest code" - Built v0.4.2 from GitHub, still white screen
- "screen is all white" - Confirmed issue persisted across builds
- "why was it working before" - Discovered v0.1.1 had 2.9MB corrupted AppImage (not actually working)
- "look a little deeper before pushing a change" - Researched Tauri docs, WebKit issues, GTK environment variables
- "the change occurred just after the last successful build" - Traced back through commits, found AppRun not being used
- "please keep track of revision feedback in the project file" - Created this CHANGELOG.md

---

## v0.4.5 (2025-11-25) - Attempted Fix (UNSUCCESSFUL)

### Changed
- Removed `#[tokio::main]` macro from main function
- Changed `async fn main()` back to `fn main()`
- Replaced `tokio::spawn` with `tauri::async_runtime::spawn`
- Removed duplicate environment variable settings

### Result
- Build succeeded but white screen persisted
- Confirmed issue was NOT the Tokio runtime conflict
- Led to discovery of real cause: AppRun not being used in GitHub Actions builds

---

## v0.4.4 (2025-11-25) - Invalid Fix Attempt

### Changed
- Attempted to add `webviewAttributes.disableWebkitHardwareAcceleration` to tauri.conf.json
- Bumped version to 0.4.4

### Result
- Build FAILED - this configuration option does not exist in Tauri 1.5.4
- Only valid in Tauri v2+
- Reverted changes

---

## v0.4.3 (2025-11-25) - Environment Variable Attempt

### Changed
- Added environment variable settings to main.rs at lines 459-462:
  ```rust
  std::env::set_var("WEBKIT_DISABLE_COMPOSITING_MODE", "1");
  std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
  std::env::set_var("GDK_BACKEND", "x11");
  ```

### Result
- Build succeeded but white screen persisted
- Environment variables set too late (after process starts)
- WebKit already initialized before these variables take effect

---

## v0.3.0 - Last Build Before Investigation

### Known Issues
- White screen on Steam Deck due to EGL_BAD_PARAMETER error
- Error message: "Could not create default EGL display: EGL_BAD_PARAMETER. Aborting..."
- Backend services (NDI, Web Remote Server port 8080) working correctly
- Issue only affects WebKit window rendering

---

## Investigation Notes

### What Worked
1. Testing v0.1.1 AppImage (though it was corrupted/incomplete at 2.9MB)
2. Comparing git history to identify when `#[tokio::main]` was added (commit `0cd374c`)
3. Checking if AppDir/AppRun exists in project (yes, but not being used by GitHub Actions)
4. Research into Tauri, WebKit, and GTK environment variables

### What Didn't Work
1. Launcher scripts with environment variables (too late, process already started)
2. Setting environment variables in Rust code (too late, WebKit already initializing)
3. Tauri config options (don't exist in v1.5.4)
4. Removing `#[tokio::main]` (helped with threading but didn't fix EGL issue)

### Key Learnings
- WebKit/GTK environment variables MUST be set before process execution
- AppImage's AppRun script is the correct place for these variables
- Tauri's bundler generates its own AppRun, ignoring custom ones in AppDir/
- Post-build patching is required to inject custom AppRun into AppImage

---

## Build System

### GitHub Actions Workflow
- Uses ubuntu-22.04 runner
- Builds with Tauri 1.5.4 and WebKit2GTK
- Post-build step patches AppImage with custom AppRun (as of v0.4.6)
- Creates releases on version tags (`v*`)

### Local Development
- Steam Deck (Arch Linux)
- Node.js v18.20.8
- Rust stable
- Can't build locally due to read-only filesystem and missing pkg-config files

---

## Future Improvements

### Potential Enhancements
1. Upgrade to Tauri v2 when stable (may have better WebKit control)
2. Consider alternative webview backends (if available for Linux)
3. Add automated testing for Steam Deck compatibility
4. Document Steam Deck setup process for users

### Known Limitations
1. Requires AppImage patching workaround for Steam Deck
2. Web interface at localhost:8080 works as backup if window fails
3. Hardware acceleration disabled on Steam Deck (performance impact minimal for DMX control app)
