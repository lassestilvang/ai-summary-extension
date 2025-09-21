# Project Structure

## Root Directory
```
├── manifest.json          # Chrome extension manifest (v3)
├── background.js          # Service worker for extension background tasks
├── content.js            # Content script injected into web pages
├── options.html          # Extension options/settings page
├── options.js            # Options page functionality
└── .gitignore            # Git ignore patterns
```

## File Responsibilities

### Extension Files (Root)
- **manifest.json**: Extension configuration, permissions, AI API access
- **background.js**: Handles AI summarization, manages summary state per tab, message routing
- **content.js**: Injected into web pages, extracts content, displays summary UI
- **options.html/js**: Settings page for OpenAI API key configuration

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
