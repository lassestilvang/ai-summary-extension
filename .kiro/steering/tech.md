# Technology Stack

## Chrome Extension
- **Manifest Version**: 3 (latest Chrome extension standard)
- **JavaScript**: Vanilla ES6+ for extension scripts
- **APIs Used**: Chrome Extensions API (scripting, tabs, runtime, action, storage)
- **Permissions**: activeTab, scripting, storage
- **Host Permissions**: https://api.openai.com/* (for API fallback)

## AI Integration
- **Primary**: Chrome Built-in AI (Summarizer API) - experimental feature
- **Fallback**: OpenAI GPT-3.5-turbo API
- **Configuration**: Chrome storage API for API key management

## Development Commands

### Extension Development
- Load unpacked extension in Chrome Developer Mode
- Point to root directory containing manifest.json
- No external server required - fully self-contained
- Test with Chrome Canary for built-in AI features

### Testing AI Features
- Enable Chrome flags for built-in AI (chrome://flags/#optimization-guide-on-device-model)
- Configure OpenAI API key via extension options page
- Test fallback behavior when built-in AI unavailable

## Code Style Conventions
- Use const/let over var
- Prefer arrow functions for callbacks
- Use template literals for string interpolation
- Implement proper error handling with try/catch
- Use meaningful variable names (summaryState, summaryDiv, etc.)
- Add inline comments for complex logic
- Handle async operations with proper error boundaries