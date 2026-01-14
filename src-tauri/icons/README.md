# App Icons

To generate the required icon formats, you can use the following tools:

1. **Online Tool**: Use [Tauri Icon Generator](https://tauri.app/v1/guides/features/icons/)
2. **CLI Tool**: Install and use `@tauri-apps/cli` icon generation

## Required Icon Formats

- `32x32.png` - Windows small icon
- `128x128.png` - macOS and Linux icon
- `128x128@2x.png` - macOS retina icon
- `icon.icns` - macOS bundle icon
- `icon.ico` - Windows bundle icon

## Generate Icons

You can generate all required icons from `icon.svg` using:

```bash
npm install -g @tauri-apps/cli
tauri icon src-tauri/icons/icon.svg
```

Or use an online converter to create PNG files from the SVG, then manually create .icns and .ico files.

For now, the build will work with placeholder icons, but you should replace these with proper icons before distribution.
