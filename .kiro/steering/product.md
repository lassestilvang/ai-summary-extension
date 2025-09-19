# AI Page Summarizer

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