# Project Overview

This project is an AI-powered Chrome extension designed to summarize web pages. It consists of two main parts:

1.  **Chrome Extension (Frontend):** Built with JavaScript, HTML, and CSS, it interacts with the browser and the current web page. It utilizes `showdown.js` for rendering Markdown content.

# AI Summary

A Chrome browser extension that provides AI-powered page summarization functionality. The extension allows users to quickly get summaries of web page content by clicking the extension icon.

## Key Features

- One-click page summarization via browser extension icon
- Dual AI approach: Chrome built-in AI (primary) + OpenAI API (fallback)
- Inline summary display with toggle visibility
- Persistent summary state per browser tab
- Clean, non-intrusive UI overlay
- Optional API key configuration for enhanced functionality

## Architecture

The product is a self-contained Chrome extension that:

- **Chrome Extension**: Handles content extraction, AI processing, UI display, and user interactions
- **AI Integration**: Uses Chrome's built-in AI when available, falls back to OpenAI API
- **Options Page**: Allows users to configure OpenAI API key for fallback functionality

## User Flow

1. User clicks extension icon on any web page
2. Extension extracts page content (paragraphs)
3. Content is processed using Chrome built-in AI or OpenAI API
4. Summary is displayed in a floating overlay
5. Subsequent clicks toggle summary visibility

## Building and Running

### Chrome Extension

To run the Chrome extension:

1.  Open Google Chrome (or any Chromium-based browser).
2.  Navigate to `chrome://extensions`.
3.  Enable "Developer mode" using the toggle switch in the top right corner.
4.  Click "Load unpacked" and select the root directory of this project (`ai-summary-extension`).
5.  The extension should now appear in your extensions list and its icon in the browser toolbar.

## Development Conventions

- **Extension Structure:** The `manifest.json` defines the extension's metadata, permissions, and entry points (`background.js`, `content.js`).
- **Content Script (`content.js`):** Responsible for directly interacting with the DOM of the active web page.
- **Background Script (`background.js`):** Handles browser events, manages communication with the backend server, and orchestrates data flow within the extension.
- **Options Page (`options.html`, `options.js`):** Provides a user interface for configuring extension settings.
- **Theming (`themes.js`):** Suggests that the extension supports different visual themes.
- **Code Quality:** IMPORTANT: After making changes, run `npm run lint` to ensure code adheres to style guidelines and fix issues with `npm run lint:fix`. Run `npm test` to execute unit tests.
- **Documentation:** Product and steering documents are located in `AGENTS.md` and `.kiro/steering/product.md`, providing insights into the project's goals and design principles.
- Use const/let over var
- Prefer arrow functions for callbacks
- Use template literals for string interpolation
- Implement proper error handling with try/catch
- Use meaningful variable names (summaryState, summaryDiv, etc.)
- Add inline comments for complex logic
- Handle async operations with proper error boundaries

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
