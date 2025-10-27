# AI Summary

[![CI](https://github.com/lassestilvang/ai-summary-extension/workflows/CI/badge.svg)](https://github.com/lassestilvang/ai-summary-extension/actions)
[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/lassestilvang/ai-summary-extension)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

![SCR-20250925-porj-2](https://github.com/user-attachments/assets/19f33ad3-419b-4ce1-9752-3fd0817c9402)

## Table of Contents

- [Project Description and Overview](#project-description-and-overview)
- [Key Features and Benefits](#key-features-and-benefits)
- [Prerequisites and System Requirements](#prerequisites-and-system-requirements)
- [Installation Instructions](#installation-instructions)
- [Usage Guide](#usage-guide)
- [API Documentation](#api-documentation)
- [Configuration Options](#configuration-options)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Troubleshooting Tips](#troubleshooting-tips)
- [Contribution Guidelines](#contribution-guidelines)
- [License Information](#license-information)
- [Acknowledgments](#acknowledgments)
- [Contact Details](#contact-details)

## Project Description and Overview

AI Summary is a powerful Chrome extension that leverages artificial intelligence to generate concise summaries of web pages. Built with JavaScript, HTML, and CSS, this extension integrates seamlessly with your browser to provide instant, AI-powered insights from any webpage.

The extension supports multiple AI providers including OpenAI's GPT models, Google's Gemini, Anthropic's Claude, and even Chrome's built-in AI capabilities. It features automatic fallback mechanisms, customizable themes, and performance tracking to ensure reliable and efficient summarization.

## Key Features and Benefits

- **Multi-Provider AI Support**: Choose from a wide range of AI models including GPT-4, Gemini, Claude, and Chrome Built-in AI
- **Automatic Fallback**: If your primary AI provider fails, the extension automatically tries alternative providers
- **Cost-Effective Options**: Includes free models like Chrome Built-in AI and low-cost options
- **Customizable Themes**: Personalize the appearance with various theme options
- **Performance Metrics**: Track model performance, success rates, and response times
- **Secure API Key Storage**: API keys are stored securely using Chrome's storage API
- **Markdown Rendering**: Summaries are rendered using Markdown for better readability
- **Real-time Summarization**: Get instant summaries of the current web page
- **Customizable Keyboard Shortcuts**: Set up keyboard shortcuts for quick access to page summarization

## Prerequisites and System Requirements

### System Requirements

- **Operating System**: Windows, macOS, or Linux
- **Browser**: Google Chrome or any Chromium-based browser (version 88 or later for Manifest V3 support)
- **RAM**: Minimum 512MB available RAM
- **Storage**: ~5MB free disk space for installation

### Software Dependencies

- **Node.js** (version 18 or later) - Required for development and testing
- **npm** (comes with Node.js) - For managing development dependencies

### API Requirements (Optional)

Depending on your chosen AI model:

- **OpenAI API Key**: For GPT models
- **Google Gemini API Key**: For Gemini models
- **Anthropic API Key**: For Claude models

_Note: Chrome Built-in AI models don't require API keys but may have limited availability._

## Installation Instructions

### For Users

1. **Download the Extension**
   - Visit the [Chrome Web Store](https://chromewebstore.google.com/detail/ai-summary/jbdalmaofgehlogmedjomdjimhdfnboi)
   - Or download the latest release from [GitHub Releases](https://github.com/lassestilvang/ai-summary-extension/releases)

2. **Install in Chrome**
   - Open Google Chrome
   - Navigate to `chrome://extensions`
   - Enable "Developer mode" (toggle in top right corner)
   - Click "Load unpacked"
   - Select the downloaded extension folder

3. **Configure Settings**
   - Click the extension icon in the toolbar
   - Click "Options" or right-click the icon and select "Options"
   - Configure your preferred AI model and API keys (if using paid models)

### For Developers

1. **Clone the Repository**

   ```bash
   git clone https://github.com/lassestilvang/ai-summary-extension.git
   cd ai-summary-extension
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Run Tests**

   ```bash
   npm test
   ```

4. **Load in Chrome**
   - Follow steps 2-4 from the user installation above
   - Select the cloned repository folder

## Usage Guide

### Basic Usage

1. **Navigate to a Web Page**
   - Open any website you want to summarize

2. **Activate the Extension**
   - Click the AI Summary icon in your browser toolbar
   - The extension will analyze the current page content

3. **View Summary**
   - A popup will appear with the AI-generated summary
   - The summary is displayed in Markdown format for easy reading

### Advanced Usage

#### Customizing AI Models

```javascript
// Example: Programmatically set preferred model
chrome.storage.sync.set({
  selectedModel: 'gpt-4',
  enableFallback: true,
});
```

#### Using Different Themes

- Access extension options
- Select your preferred theme from the dropdown
- Themes affect the appearance of summaries and settings pages

#### Monitoring Performance

- Go to extension options
- Click "Refresh Model Metrics" to view performance statistics
- Track success rates, response times, and usage patterns

### Code Examples

#### Checking Extension Status

```javascript
// Check if extension is active
chrome.runtime.sendMessage({ action: 'get_status' }, (response) => {
  console.log('Extension status:', response);
});
```

#### Custom Summary Requests

```javascript
// Request summary for current tab
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  chrome.runtime.sendMessage({
    action: 'summarize_page',
    tabId: tabs[0].id,
  });
});
```

## API Documentation

The extension communicates internally using Chrome's messaging API. While there's no public REST API, developers can interact with the extension through Chrome extension APIs.

### Internal Message Types

- `summarize_page`: Triggers page summarization
- `get_model_metrics`: Retrieves performance metrics
- `model_metrics_response`: Response containing metrics data

### Storage Keys

The extension uses `chrome.storage.sync` for persistent settings:

- `selectedModel`: Preferred AI model
- `enableFallback`: Boolean for fallback behavior
- `openaiApiKey`: OpenAI API key
- `geminiApiKey`: Google Gemini API key
- `anthropicApiKey`: Anthropic API key
- `theme`: Selected theme

## Configuration Options

### Language Selection

Choose the language for AI-generated summaries:

- English (default)
- Spanish
- French
- German
- Italian
- Portuguese
- Chinese
- Japanese
- Korean
- Russian
- Arabic
- Hindi
- Danish
- Norwegian
- Swedish
- Finnish
- Polish
- Ukrainian
- Dutch

### Summary Length

Control the length of generated summaries:

- **Short**: Brief, concise summaries
- **Medium**: Balanced length summaries (default)
- **Long**: Detailed, comprehensive summaries

### AI Model Selection

Choose from various AI models with different capabilities and costs:

- **Free Models**:
  - Chrome Built-in AI (Free, requires Chrome 138+)
  - Gemini 2.0 Flash Experimental (Free)

- **OpenAI Models**:
  - GPT-3.5 Turbo ($0.002/1K tokens)
  - GPT-4 ($0.03/1K tokens)
  - GPT-4 Turbo ($0.01/1K tokens)
  - GPT-4o ($0.005/1K tokens)
  - GPT-5 ($0.00125/1K tokens)
  - GPT-5 mini ($0.00025/1K tokens)
  - GPT-5 nano ($0.00005/1K tokens)

- **Google Gemini Models**:
  - Gemini 2.5 Pro ($0.00125/1K tokens)
  - Gemini 2.5 Flash ($0.00003/1K tokens)

- **Anthropic Claude Models**:
  - Claude 3 Haiku ($0.00025/1K tokens)
  - Claude 3 Sonnet ($0.003/1K tokens)
  - Claude 3 Opus ($0.015/1K tokens)
  - Claude 3.5 Sonnet ($0.003/1K tokens)
  - Claude 4.5 Sonnet ($0.003/1K tokens)
  - Claude 4.5 Haiku ($0.001/1K tokens)

### Temperature

Adjust the creativity/randomness of AI responses:

- Range: 0.0 to 2.0
- Default: 0.7
- Lower values (0.0-0.5): More focused and deterministic
- Higher values (1.0-2.0): More creative and varied

### Max Tokens

Set the maximum length of AI responses:

- Range: 100 to 4000 tokens
- Default: 1000 tokens
- Higher values allow longer summaries but may increase costs

### Fallback Settings

- Enable/disable automatic fallback to other models if the primary model fails
- Default: Enabled

### API Keys

- Securely store API keys for paid AI services
- Keys are encrypted and stored locally using Chrome's storage API
- Real-time validation with visual indicators
- Required for OpenAI, Google Gemini, and Anthropic models

### Theme Customization

- Choose from 20+ available themes to customize the UI appearance
- Customize font family, size (8-24px), and style
- Real-time preview of theme changes
- Available themes include: Light, Dark, Solarized, Nord, Autumn, Synthwave, and many more

### Extension Settings

#### Right-Click Context Menu

- Enable/disable right-click context menu for selected text
- When enabled, right-clicking on selected text shows an option to summarize it
- Default: Enabled

#### Date and Time Format

Choose how dates and times are displayed in the extension:

- DD/MM/YYYY HH:MM (24-hour) - 17/10/2024 20:21
- MM/DD/YYYY HH:MM (12-hour) - 10/17/2024 08:21 PM
- YYYY-MM-DD HH:MM (24-hour) - 2024-10-17 20:21
- DD.MM.YYYY HH:MM (24-hour) - 17.10.2024 20:21
- MM-DD-YYYY HH:MM (12-hour) - 10-17-2024 08:21 PM

## Keyboard Shortcuts

The extension supports customizable keyboard shortcuts for quick access to page summarization functionality, allowing you to trigger summaries without clicking the extension icon.

### How It Works

Keyboard shortcuts are implemented using Chrome's commands API, which provides a standardized way to handle keyboard input across different platforms. When you press your configured shortcut, it activates the extension's action, which then processes the current page content and displays the summary.

### Setting Up and Customizing Shortcuts

1. **Access the Options Page**
   - Click the extension icon in your browser toolbar
   - Click "Options" or right-click the icon and select "Options"
   - Navigate to the "Keyboard Shortcuts" tab

2. **View Current Shortcut**
   - The current shortcut is displayed at the top of the shortcuts page
   - Default shortcut: `Ctrl+Shift+S` (Windows/Linux) or `Cmd+Shift+S` (macOS)

3. **Record a New Shortcut**
   - Click the "Record Shortcut" button
   - Press your desired key combination (modifier + key)
   - The shortcut will be validated and displayed for confirmation
   - Click "Save" to apply the new shortcut

4. **Reset to Default**
   - Click the "Reset to Default" button to restore the original shortcut
   - This is useful if you accidentally set an unusable shortcut

### Default Shortcut Information

- **Default**: `Ctrl+Shift+S` (Windows/Linux) or `Command+Shift+S` (macOS)
- **Purpose**: Triggers page summarization for the current tab
- **Storage**: Saved in Chrome's synchronized storage for consistency across devices

### Cross-Platform Compatibility

The extension automatically adapts shortcuts based on your operating system:

- **Windows/Linux**: Uses `Ctrl` as the primary modifier key
- **macOS**: Uses `Cmd` (⌘) as the primary modifier key
- **Supported Modifiers**: `Ctrl/Cmd`, `Alt`, `Shift`
- **Supported Keys**: Letters (A-Z), numbers (0-9), function keys (F1-F12), and special keys (Space, Enter, Tab, Esc, etc.)

### Edge Cases and Limitations

- **Input Fields**: Shortcuts are disabled when typing in input fields, text areas, or other form elements to avoid conflicts
- **Browser Conflicts**: Certain shortcuts are blocked to prevent conflicts with browser or system functionality (e.g., `Ctrl+T` for new tabs, `Ctrl+W` for closing tabs)
- **Validation**: The extension validates shortcuts to ensure they include at least one modifier key and don't conflict with known browser shortcuts
- **Single Session**: Shortcuts are active only while the extension is loaded; they don't persist browser restarts independently

### Accessibility Information

- **Screen Reader Support**: All shortcut-related UI elements include proper ARIA labels and live regions for status updates
- **Keyboard Navigation**: The shortcuts configuration page is fully navigable using keyboard-only input
- **Visual Feedback**: Clear visual indicators show shortcut recording status and validation results
- **Error Announcements**: Validation errors and success messages are announced to assistive technologies

### Developer Notes

For developers working on the extension:

- **API Integration**: Shortcuts are managed through `chrome.commands` API in `manifest.json`
- **Storage Key**: Custom shortcuts are stored as `keyboardShortcut` in `chrome.storage.sync`
- **Validation Logic**: Shortcut validation is handled in `utils.ts` with conflict detection for common browser shortcuts
- **Recording Function**: The `recordShortcut()` function in `utils.ts` captures keyboard input during shortcut setup
- **Platform Detection**: Automatic platform detection ensures correct modifier keys (Ctrl vs Cmd) are used

## Troubleshooting Tips

### Common Issues

**Extension Not Loading**

- Ensure you're using Chrome version 88 or later
- Check that "Developer mode" is enabled in `chrome://extensions`
- Try reloading the extension

**API Key Errors**

- Verify your API keys are correct and have sufficient credits
- Check API key format (OpenAI: sk-..., Gemini: AIza..., Anthropic: sk-ant-...)
- Ensure your API keys have the necessary permissions

**Summarization Fails**

- Try switching to a different AI model
- Check your internet connection
- Ensure the webpage content is accessible (not behind login/paywall)

**Performance Issues**

- Consider using faster models like GPT-3.5 Turbo or Gemini Flash
- Check model metrics in extension options for performance insights

### Debug Mode

Enable debug logging by opening Chrome DevTools (F12) and checking the Console tab for extension-related messages.

### Reset Settings

To reset all settings:

1. Go to `chrome://extensions`
2. Find AI Summary
3. Click "Details"
4. Scroll to "Site access" and click "Clear storage"

## Contribution Guidelines

We welcome contributions! Please follow these guidelines:

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Install dependencies: `npm install`
4. Run tests: `npm test`

### Code Standards

- Follow ESLint configuration: `npm run lint`
- Use Prettier for code formatting: `npm run format`
- Write tests for new features
- Maintain code coverage above 80%

### Branching Strategy

- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: New features
- `bugfix/*`: Bug fixes
- `hotfix/*`: Critical fixes for production

### Pull Request Process

1. Ensure all tests pass
2. Update documentation if needed
3. Add screenshots for UI changes
4. Request review from maintainers

### Commit Message Format

```
type(scope): description

[optional body]

[optional footer]
```

Types: feat, fix, docs, style, refactor, test, chore

## License Information

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **AI Providers**: Thanks to OpenAI, Google, and Anthropic for their excellent AI APIs
- **Chrome Extensions**: Built using Manifest V3 for modern Chrome extension development
- **Open Source Libraries**: Utilizes showdown.js for Markdown rendering
- **Contributors**: All contributors who help improve this project

## Contact Details

- **Project Homepage**: [https://github.com/lassestilvang/ai-summary-extension](https://github.com/lassestilvang/ai-summary-extension)
- **Issues**: [GitHub Issues](https://github.com/lassestilvang/ai-summary-extension/issues)

---

_Made in [Copenhagen](https://en.wikipedia.org/wiki/Copenhagen) with ❤️ for efficient web browsing_
