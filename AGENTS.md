# Project Overview

This project is an AI-powered Chrome extension designed to summarize web pages. It consists of two main parts:

1.  **Chrome Extension (Frontend):** Built with JavaScript, HTML, and CSS, it interacts with the browser and the current web page. It utilizes `showdown.min.js` for rendering Markdown content.

## Building and Running

### Chrome Extension

To run the Chrome extension:

1.  Open Google Chrome (or any Chromium-based browser).
2.  Navigate to `chrome://extensions`.
3.  Enable "Developer mode" using the toggle switch in the top right corner.
4.  Click "Load unpacked" and select the root directory of this project (`ai-summary-extension`).
5.  The extension should now appear in your extensions list and its icon in the browser toolbar.

## Development Conventions

*   **Extension Structure:** The `manifest.json` defines the extension's metadata, permissions, and entry points (`background.js`, `content.js`).
*   **Content Script (`content.js`):** Responsible for directly interacting with the DOM of the active web page.
*   **Background Script (`background.js`):** Handles browser events, manages communication with the backend server, and orchestrates data flow within the extension.
*   **Options Page (`options.html`, `options.js`):** Provides a user interface for configuring extension settings.
*   **Theming (`themes.js`):** Suggests that the extension supports different visual themes.
*   **Code Quality:** After making changes, run `npm run lint` to ensure code adheres to style guidelines and fix issues with `npm run lint:fix`.
*   **Documentation:** Product and steering documents are located in `AGENTS.md` and `.kiro/steering/product.md`, providing insights into the project's goals and design principles.
