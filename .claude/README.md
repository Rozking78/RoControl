# Claude Code Project Configuration

This directory contains project-specific settings for developing RoControl with Claude Code.

## What's Synced

- **settings.local.json** - Project-specific permissions and tool approvals
  - Pre-approved commands for faster development
  - Build tool permissions
  - Package manager permissions

## What's Local Only

The following are kept local (via .gitignore) and won't be synced:
- `.credentials.json` - Your API credentials
- `history.jsonl` - Your conversation history
- `debug/`, `file-history/`, `plans/`, etc. - Personal workspace data

## Setting Up on a New Device

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/rocontrol.git
   cd rocontrol
   ```

2. **Open with Claude Code:**
   ```bash
   claude-code .
   ```

3. **Project permissions will be automatically loaded** from `settings.local.json`

4. **Add your API key** (if needed):
   - Claude Code will prompt for your API key on first run
   - This creates `.claude/.credentials.json` locally (not synced)

## Project-Specific Permissions

The `settings.local.json` file pre-approves:
- npm build commands (`npm run build`, `npm run tauri:build`)
- Development servers (`npm run dev`, `npm run tauri:dev`)
- Package management (`pacman`, `dpkg`)
- Build tools (`gcc`, `cc`, `chmod`)
- Application launching and testing

This speeds up development by reducing permission prompts for common tasks.

## Notes

- Each developer's conversation history and credentials remain private
- Project configuration is shared to maintain consistency
- Feel free to add more pre-approved commands as needed
