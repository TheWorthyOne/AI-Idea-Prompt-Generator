# AI Idea Prompt Generator

A powerful cross-platform desktop application that generates detailed startup and application ideas using Anthropic's Claude AI. Built with Tauri and React for a lightweight, secure, and performant experience on Windows, macOS, and Linux.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)

## Features

### 🎯 AI-Powered Idea Generation
- Generate innovative startup and application ideas using Claude AI
- Filter by 15+ categories including Fintech, Healthcare, E-commerce, Education, and more
- Each idea includes:
  - Detailed concept description
  - Platform recommendation (Web, Mobile, Desktop, or Multi-platform)
  - Target audience analysis
  - 5-8 key features
  - Monetization strategy
  - Clear value proposition

### 📚 Idea History Management
- Automatically stores the last 50 generated ideas
- Persistent storage across application sessions
- Easy browsing and review of past ideas
- One-click history clearing

### 📋 Clipboard Integration
- Copy formatted ideas directly to clipboard
- Markdown-formatted output ready for documentation
- Perfect for sharing or importing into other tools

### 🔒 Secure API Key Storage
- Platform-specific secure storage:
  - **Windows**: Windows Credential Manager
  - **macOS**: macOS Keychain
  - **Linux**: Secret Service (e.g., GNOME Keyring / KWallet)
- Built-in API key validation
- API keys are stored via the OS credential store (not in the app's JSON settings file)

### 🎨 Modern User Interface
- Clean, intuitive design
- Responsive layout
- Real-time generation feedback
- Category-based filtering
- Beautiful card-based idea display

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **Rust** (latest stable) - [Install](https://www.rust-lang.org/tools/install)
- **npm** or **yarn** package manager

### Platform-Specific Requirements

#### Windows
- Microsoft Visual Studio C++ Build Tools
- WebView2 (usually pre-installed on Windows 10/11)

#### macOS
- Xcode Command Line Tools: `xcode-select --install`

#### Linux
- Required dependencies:
  ```bash
  # Debian/Ubuntu
  sudo apt update
  sudo apt install libwebkit2gtk-4.1-dev \
    build-essential \
    curl \
    wget \
    file \
    libssl-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev

  # Fedora
  sudo dnf install webkit2gtk4.1-devel \
    openssl-devel \
    curl \
    wget \
    file \
    gtk3-devel \
    libappindicator-gtk3-devel \
    librsvg2-devel

  # Arch Linux
  sudo pacman -S webkit2gtk \
    base-devel \
    curl \
    wget \
    file \
    openssl \
    gtk3 \
    libappindicator-gtk3 \
    librsvg
  ```

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/AI-Idea-Prompt-Generator.git
   cd AI-Idea-Prompt-Generator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Get an Anthropic API Key**
   - Visit [Anthropic Console](https://console.anthropic.com/)
   - Sign up or log in to your account
   - Navigate to API Keys section
   - Create a new API key
   - Copy the key (you'll need it when running the app)

## Usage

### Development Mode

Run the application in development mode with hot-reloading:

```bash
npm run tauri:dev
```

### Production Build

Build the application for your platform:

```bash
npm run tauri:build
```

The built application will be available in `src-tauri/target/release/bundle/`:
- **Windows**: `.exe` installer in `msi/` or `nsis/` folder
- **macOS**: `.app` or `.dmg` in `dmg/` or `macos/` folder
- **Linux**: `.deb`, `.AppImage`, or `.rpm` in respective folders

### First-Time Setup

1. Launch the application
2. Click the **Settings** button in the top-right corner
3. Enter your Anthropic API key
4. Click **Test Key** to validate (optional but recommended)
5. Click **Save**
6. Start generating ideas!

### Generating Ideas

1. Select a category from the grid (or choose "All Categories" for variety)
2. Click the **Generate Idea** button
3. Wait a few seconds while the AI generates your idea
4. Review the generated idea in the history section below
5. Click the copy icon to copy the idea to your clipboard

### Managing History

- All generated ideas are automatically saved
- The app stores your last 50 ideas
- Click **Clear History** to remove all saved ideas
- Ideas persist even after closing the application

## Project Structure

```
AI-Idea-Prompt-Generator/
├── src/                          # React frontend source
│   ├── components/               # React components
│   │   ├── IdeaGenerator.tsx    # Main idea generation UI
│   │   ├── IdeaCard.tsx         # Individual idea display
│   │   ├── IdeaHistory.tsx      # History management
│   │   └── Settings.tsx         # API key settings
│   ├── hooks/                   # Custom React hooks
│   │   └── useStore.ts          # Persistent storage hook
│   ├── types/                   # TypeScript type definitions
│   │   └── index.ts             # Shared types
│   ├── utils/                   # Utility functions
│   │   └── formatIdea.ts        # Idea formatting
│   ├── App.tsx                  # Main application component
│   ├── main.tsx                 # React entry point
│   └── index.css                # Global styles
├── src-tauri/                   # Tauri backend (Rust)
│   ├── src/
│   │   └── main.rs              # Rust backend with AI integration
│   ├── icons/                   # Application icons
│   ├── Cargo.toml               # Rust dependencies
│   └── tauri.conf.json          # Tauri configuration
├── public/                      # Static assets
├── index.html                   # HTML entry point
├── package.json                 # Node.js dependencies
├── tsconfig.json                # TypeScript configuration
├── vite.config.ts               # Vite configuration
├── tailwind.config.js           # Tailwind CSS configuration
└── README.md                    # This file
```

## Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Fast build tool and dev server
- **Lucide React** - Beautiful icon library

### Backend
- **Tauri 2.0** - Rust-based desktop framework
- **Rust** - Systems programming language
- **Reqwest** - HTTP client for API calls
- **Serde** - Serialization/deserialization

### AI Integration
- **Anthropic Claude API** - AI-powered idea generation
- **Claude 3.5 Sonnet** - Latest language model

## Configuration

### Customizing Categories

Edit the categories in `src/types/index.ts`:

```typescript
export const CATEGORIES = [
  'All Categories',
  'Your Custom Category',
  // Add more categories...
] as const;
```

### Adjusting Idea Generation

Modify the prompt in `src-tauri/src/main.rs` in the `generate_idea` function to customize the AI's output format or style.

### Changing AI Model

Update the model in `src-tauri/src/main.rs`:

```rust
model: "claude-3-5-sonnet-20241022".to_string(),
```

Available models:
- `claude-3-5-sonnet-20241022` (recommended)
- `claude-3-opus-20240229`
- `claude-3-haiku-20240307`

## API Usage and Costs

This application uses the Anthropic Claude API. Costs depend on your usage:

- **Claude 3.5 Sonnet**: ~$3 per million input tokens, ~$15 per million output tokens
- Each idea generation typically uses 200-500 tokens
- Estimated cost: $0.01-0.02 per idea

Monitor your usage at [Anthropic Console](https://console.anthropic.com/).

## Security

- ✅ API keys stored securely using platform-specific credential storage (Keychain / Credential Manager / Secret Service)
- ✅ No telemetry or data collection
- ✅ All data stored locally on your machine
- ✅ HTTPS-only API communication
- ✅ No third-party analytics

## Troubleshooting

### "API key invalid" error
- Verify your API key at [Anthropic Console](https://console.anthropic.com/)
- Ensure you have sufficient API credits
- Check your internet connection

### Build errors on Linux
- Ensure all system dependencies are installed (see Prerequisites)
- Update Rust: `rustup update`
- Clear build cache: `rm -rf src-tauri/target`

### Application won't start
- Check console/terminal for error messages
- Verify Node.js and Rust are properly installed
- Try removing `node_modules` and reinstalling: `rm -rf node_modules && npm install`

### Icons missing in build
- Generate icons from the SVG: `tauri icon src-tauri/icons/icon.svg`
- Or add custom PNG/ICO/ICNS files to `src-tauri/icons/`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Anthropic](https://www.anthropic.com/) for the Claude AI API
- [Tauri](https://tauri.app/) for the amazing desktop framework
- [React](https://react.dev/) and the React team
- All open-source contributors

## Support

If you encounter any issues or have questions:

1. Check the [Troubleshooting](#troubleshooting) section
2. Search [existing issues](https://github.com/yourusername/AI-Idea-Prompt-Generator/issues)
3. Create a new issue with detailed information

## Roadmap

- [ ] Export ideas to PDF/Markdown files
- [ ] Custom prompt templates
- [ ] Idea comparison feature
- [ ] Collaborative idea sharing
- [ ] Integration with project management tools
- [ ] Support for OpenAI GPT models
- [ ] Idea rating and favoriting system
- [ ] Dark mode theme

---

**Built with ❤️ using Tauri, React, and Claude AI**
