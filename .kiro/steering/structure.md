# Project Structure

## Root Directory
```
├── manifest.json          # Chrome extension manifest (v3)
├── background.js          # Service worker for extension background tasks
├── content.js            # Content script injected into web pages
├── options.html          # Extension options/settings page
├── options.js            # Options page functionality
├── .gitignore            # Git ignore patterns
└── server/               # Legacy server (can be removed)
    ├── index.js          # Express server entry point
    ├── package.json      # Server dependencies and scripts
    ├── pnpm-lock.yaml    # Package manager lock file
    └── node_modules/     # Server dependencies (ignored by git)
```

## File Responsibilities

### Extension Files (Root)
- **manifest.json**: Extension configuration, permissions, AI API access
- **background.js**: Handles AI summarization, manages summary state per tab, message routing
- **content.js**: Injected into web pages, extracts content, displays summary UI
- **options.html/js**: Settings page for OpenAI API key configuration

### Legacy Files
- **server/**: No longer required - can be removed as extension is now self-contained

## Architecture Patterns
- **Self-Contained Extension**: No external server dependencies
- **Dual AI Strategy**: Chrome built-in AI with OpenAI fallback
- **Message Passing**: Chrome runtime messaging between background and content scripts
- **State Management**: Tab-specific summary state stored in background script
- **Configuration Storage**: Chrome storage API for user settings

## Development Workflow
1. Modify extension files in root directory
2. Reload extension in Chrome Developer Mode to test changes
3. No server setup required - extension is fully self-contained
4. Test AI features with Chrome Canary for built-in AI support