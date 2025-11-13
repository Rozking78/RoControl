# Contributing to Steam Deck DMX Controller

Thank you for your interest in contributing! 🎮💡

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/steamdeck-dmx-controller.git`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test thoroughly
6. Commit: `git commit -m "Add: your feature description"`
7. Push: `git push origin feature/your-feature-name`
8. Open a Pull Request

## Development Setup

```bash
# Install dependencies
npm install

# Run in development mode
npm run tauri:dev

# Build for production
npm run tauri:build

# Run Rust tests
cd src-tauri && cargo test
```

## Code Style

- **JavaScript/React**: Use Prettier defaults
- **Rust**: Run `cargo fmt` before committing
- **Git commits**: Use conventional commits format
  - `feat:` for new features
  - `fix:` for bug fixes
  - `docs:` for documentation
  - `refactor:` for code refactoring

## Testing

- Test on actual DMX hardware when possible
- Test gamepad controls on Steam Deck
- Verify network performance
- Check touch screen responsiveness

## Areas We Need Help

- 🎨 UI/UX improvements
- 🔧 GDTF parser enhancements
- 🌐 Additional protocols (sACN, USB DMX)
- 📊 Effect engine development
- 📝 Documentation improvements
- 🐛 Bug fixes
- 🧪 Test coverage

## Questions?

Open an issue or discussion on GitHub!

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
