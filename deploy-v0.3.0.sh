#!/bin/bash
# RoControl v0.3.0 Production Deployment Script
# This script completes the production build process

set -e  # Exit on any error

echo "🚀 RoControl v0.3.0 Production Deployment"
echo "=========================================="
echo ""

# Step 1: Checkout main and pull latest
echo "📥 Step 1/4: Updating main branch..."
git checkout main
git pull origin main
echo "✅ Main branch updated"
echo ""

# Step 2: Merge the production release branch
echo "🔀 Step 2/4: Merging production release..."
git merge claude/production-release-v0.3.0-017VKBjUHTNFyTDjefjDgtBH --no-edit
echo "✅ Production release merged"
echo ""

# Step 3: Push to main
echo "⬆️  Step 3/4: Pushing to main..."
git push origin main
echo "✅ Pushed to main"
echo ""

# Step 4: Create and push tag to trigger release build
echo "🏷️  Step 4/4: Creating and pushing release tag..."
git tag -a v0.3.0 -m "Release v0.3.0: Elgato Stream Deck Support + CI/CD

New Features:
- Native Elgato Stream Deck USB HID support
- Support for all Stream Deck models (Original, Mini, XL, V2, MK.2, Plus, Pedal)
- Enhanced Steam Deck Setup UI with easy button assignments
- Persistent button mappings per device
- Brightness control and device management

Infrastructure:
- GitHub Actions CI/CD for automated builds
- AppImage packaging for Steam Deck
- Debian package (.deb) support
- Automated release generation

Documentation:
- Complete Steam Deck installation guide
- Pre-built download instructions
- Comprehensive README updates" || echo "Tag already exists locally, continuing..."

git push origin v0.3.0
echo "✅ Tag v0.3.0 pushed"
echo ""

echo "🎉 Deployment Complete!"
echo "======================="
echo ""
echo "GitHub Actions is now building your release!"
echo ""
echo "📊 Monitor build progress:"
echo "   https://github.com/Rozking78/RoControl/actions"
echo ""
echo "📦 Release will appear at (in ~5-10 minutes):"
echo "   https://github.com/Rozking78/RoControl/releases/tag/v0.3.0"
echo ""
echo "📥 Downloadable artifacts:"
echo "   - rocontrol_0.3.0_amd64.AppImage (recommended for Steam Deck)"
echo "   - rocontrol_0.3.0_amd64.deb"
echo "   - rocontrol binary"
echo ""
echo "✨ Your Steam Deck users can now download pre-built releases!"
