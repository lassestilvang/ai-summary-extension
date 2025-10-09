export interface ModelConfig {
  provider: 'chrome' | 'openai' | 'gemini' | 'anthropic';
  modelId: string | null;
  name: string;
  cost: number;
}

// API Response Interfaces
export interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

export interface AnthropicResponse {
  content: Array<{
    text: string;
  }>;
}

// Progress and Metrics Interfaces
export interface ProgressUpdate {
  step: string;
  percentage: number;
  estimatedTimeRemaining: number;
  currentModel: string;
  success?: boolean;
}

export interface AttemptMetrics {
  model: string;
  success: boolean;
  time: number;
  error?: string;
}

export interface Metrics {
  attempts: AttemptMetrics[];
  totalTime: number;
}

// Chrome Runtime Message Interfaces
export interface ProcessContentMessage {
  action: 'process_content';
  content: string;
  forceModel?: string;
}

export interface DisplaySummaryMessage {
  action: 'display_inline_summary';
  summary: string;
  model: string;
  time: string;
  metrics: Metrics;
}

export interface ShowLoadingMessage {
  action: 'show_loading_spinner';
}

export interface UpdateProgressMessage {
  action: 'update_loading_progress';
  progress: ProgressUpdate;
}

export interface ToggleVisibilityMessage {
  action: 'toggle_summary_visibility';
}

export interface OpenOptionsMessage {
  action: 'open_options_page';
}

export interface SwitchModelMessage {
  action: 'switch_model';
  model: string;
}

export interface GetMetricsMessage {
  action: 'get_model_metrics';
}

export interface MetricsResponseMessage {
  action: 'model_metrics_response';
  metrics: Record<
    string,
    {
      totalRequests: number;
      successfulRequests: number;
      totalTime: number;
      avgTime: number;
      lastUsed: string;
    }
  >;
}

export interface ModelSwitchedMessage {
  action: 'model_switched';
  model: string;
}

export type ChromeMessage =
  | ProcessContentMessage
  | DisplaySummaryMessage
  | ShowLoadingMessage
  | UpdateProgressMessage
  | ToggleVisibilityMessage
  | OpenOptionsMessage
  | SwitchModelMessage
  | GetMetricsMessage
  | MetricsResponseMessage
  | ModelSwitchedMessage;

export function getModelConfig(model: string): ModelConfig | undefined {
  const models: Record<string, ModelConfig> = {
    'chrome-builtin': {
      provider: 'chrome',
      modelId: null,
      name: 'Chrome Built-in AI',
      cost: 0,
    },
    'gpt-3.5-turbo': {
      provider: 'openai',
      modelId: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      cost: 0.002,
    },
    'gpt-4': {
      provider: 'openai',
      modelId: 'gpt-4',
      name: 'GPT-4',
      cost: 0.03,
    },
    'gpt-4-turbo': {
      provider: 'openai',
      modelId: 'gpt-4-turbo',
      name: 'GPT-4 Turbo',
      cost: 0.01,
    },
    'gpt-4o': {
      provider: 'openai',
      modelId: 'gpt-4o',
      name: 'GPT-4o',
      cost: 0.005,
    },
    'gemini-1.5-pro': {
      provider: 'gemini',
      modelId: 'gemini-1.5-pro',
      name: 'Gemini 1.5 Pro',
      cost: 0.00125,
    },
    'gemini-1.5-flash': {
      provider: 'gemini',
      modelId: 'gemini-1.5-flash',
      name: 'Gemini 1.5 Flash',
      cost: 0.000075,
    },
    'gemini-2.0-flash-exp': {
      provider: 'gemini',
      modelId: 'gemini-2.0-flash-exp',
      name: 'Gemini 2.0 Flash (Exp)',
      cost: 0,
    },
    'claude-3-haiku': {
      provider: 'anthropic',
      modelId: 'claude-3-haiku-20240307',
      name: 'Claude 3 Haiku',
      cost: 0.00025,
    },
    'claude-3-sonnet': {
      provider: 'anthropic',
      modelId: 'claude-3-sonnet-20240229',
      name: 'Claude 3 Sonnet',
      cost: 0.003,
    },
    'claude-3-opus': {
      provider: 'anthropic',
      modelId: 'claude-3-opus-20240229',
      name: 'Claude 3 Opus',
      cost: 0.015,
    },
    'claude-3.5-sonnet': {
      provider: 'anthropic',
      modelId: 'claude-3-5-sonnet-20240620',
      name: 'Claude 3.5 Sonnet',
      cost: 0.003,
    },
  };
  return models[model];
}

// API Key validation functions
export async function validateApiKey(
  provider: string,
  apiKey: string
): Promise<{ valid: boolean; error?: string }> {
  if (!apiKey || apiKey.trim() === '') {
    return { valid: false, error: 'API key is required' };
  }

  try {
    switch (provider) {
      case 'openai':
        return await validateOpenAIApiKey(apiKey);
      case 'gemini':
        return await validateGeminiApiKey(apiKey);
      case 'anthropic':
        return await validateAnthropicApiKey(apiKey);
      default:
        return { valid: false, error: 'Unknown provider' };
    }
  } catch (error) {
    console.error('API key validation error:', error);
    return { valid: false, error: 'Network error during validation' };
  }
}

async function validateOpenAIApiKey(
  apiKey: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      return { valid: true };
    } else if (response.status === 401) {
      return { valid: false, error: 'Invalid API key' };
    } else {
      return {
        valid: false,
        error: `API validation failed: ${response.status}`,
      };
    }
  } catch {
    return { valid: false, error: 'Network error during validation' };
  }
}

async function validateGeminiApiKey(
  apiKey: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.ok) {
      return { valid: true };
    } else if (response.status === 400 || response.status === 403) {
      return { valid: false, error: 'Invalid API key' };
    } else {
      return {
        valid: false,
        error: `API validation failed: ${response.status}`,
      };
    }
  } catch {
    return { valid: false, error: 'Network error during validation' };
  }
}

async function validateAnthropicApiKey(
  apiKey: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'test' }],
      }),
    });

    if (response.ok) {
      return { valid: true };
    } else if (response.status === 401) {
      return { valid: false, error: 'Invalid API key' };
    } else {
      return {
        valid: false,
        error: `API validation failed: ${response.status}`,
      };
    }
  } catch {
    return { valid: false, error: 'Network error during validation' };
  }
}

export function getChromeVersion(): number {
  const userAgent = navigator?.userAgent;
  if (!userAgent) return 0;
  const chromeMatch = userAgent.match(/Chrome\/(\d+)/);
  return chromeMatch ? parseInt(chromeMatch[1]) : 0;
}

export async function isSummarizerAvailable(): Promise<boolean> {
  if (!globalThis || !('Summarizer' in globalThis)) {
    return false;
  }
  try {
    const availability = await (globalThis as any).Summarizer.availability();
    return availability === 'available';
  } catch {
    return false;
  }
}

export async function checkChromeBuiltinSupport(): Promise<boolean> {
  const version = getChromeVersion();
  const apiAvailable = await isSummarizerAvailable();
  return version >= 138 && apiAvailable;
}

export async function isModelAvailable(
  model: string,
  apiKeys: {
    openaiApiKey: string;
    geminiApiKey: string;
    anthropicApiKey: string;
  }
): Promise<boolean> {
  const config = getModelConfig(model);
  if (!config) return false;

  switch (config.provider) {
    case 'chrome':
      return await checkChromeBuiltinSupport();
    case 'openai':
      return !!(apiKeys.openaiApiKey && apiKeys.openaiApiKey.trim() !== '');
    case 'gemini':
      return !!(apiKeys.geminiApiKey && apiKeys.geminiApiKey.trim() !== '');
    case 'anthropic':
      return !!(
        apiKeys.anthropicApiKey && apiKeys.anthropicApiKey.trim() !== ''
      );
    default:
      return false;
  }
}

// Shortcut management functions
const DEFAULT_SHORTCUT = 'Ctrl+Shift+S';
const COMMAND_NAME = '_execute_action'; // Default command for browser action

/**
 * Detects if the current platform is macOS
 */
function isMac(): boolean {
  return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
}

/**
 * Converts a KeyboardEvent to a shortcut string
 */
function keyEventToShortcut(event: KeyboardEvent): string {
  const modifiers: string[] = [];

  if (event.ctrlKey) modifiers.push('Ctrl');
  if (event.altKey) modifiers.push('Alt');
  if (event.shiftKey) modifiers.push('Shift');
  if (event.metaKey && isMac()) modifiers.push('Cmd');

  // Get the key name
  let key = event.key;

  // Handle special keys
  if (key === ' ') key = 'Space';
  else if (key.length === 1) key = key.toUpperCase();
  else if (key.startsWith('Arrow')) key = key.replace('Arrow', '');
  else if (key === 'Escape') key = 'Esc';

  // Build shortcut string
  const parts = [...modifiers, key];
  return parts.join('+');
}

/**
 * Records a keyboard shortcut by listening for key presses
 */
export function recordShortcut(): Promise<string> {
  return new Promise((resolve) => {
    const handler = (event: KeyboardEvent) => {
      // Prevent default to avoid triggering browser actions during recording
      event.preventDefault();
      event.stopPropagation();

      const shortcut = keyEventToShortcut(event);
      const validation = validateShortcut(shortcut);

      if (!validation) {
        // Valid shortcut
        document.removeEventListener('keydown', handler);
        resolve(shortcut);
      }
      // If invalid, continue listening
    };

    document.addEventListener('keydown', handler);
  });
}

/**
 * Validates a shortcut string for conflicts and invalid combinations
 */
export function validateShortcut(shortcut: string): string | null {
  if (!shortcut || shortcut.trim() === '') {
    return 'Shortcut cannot be empty';
  }

  const parts = shortcut.split('+');
  if (parts.length < 2) {
    return 'Shortcut must include at least one modifier key (Ctrl/Cmd, Alt, Shift)';
  }

  const modifiers = parts.slice(0, -1);
  const key = parts[parts.length - 1];

  // Check for single modifier keys
  if (modifiers.length === 0) {
    return 'Shortcut cannot be a single key without modifiers';
  }

  // Check for invalid modifier combinations
  if (modifiers.includes('Ctrl') && modifiers.includes('Cmd')) {
    return 'Cannot use both Ctrl and Cmd in the same shortcut';
  }

  // Check for known browser/OS conflicts
  const conflictShortcuts = [
    'Ctrl+T',
    'Ctrl+W',
    'Ctrl+R',
    'Ctrl+N',
    'Ctrl+Shift+T',
    'Ctrl+Shift+W',
    'Ctrl+F4',
    'Alt+F4',
    'Ctrl+Q',
    'Ctrl+Shift+Q',
    'Ctrl+Tab',
    'Ctrl+Shift+Tab',
    'Cmd+T',
    'Cmd+W',
    'Cmd+R',
    'Cmd+N',
    'Cmd+Shift+T',
    'Cmd+Shift+W',
    'Cmd+Q',
    'Cmd+Tab',
    'Cmd+Shift+Tab',
  ];

  if (conflictShortcuts.includes(shortcut)) {
    return 'This shortcut conflicts with browser or system shortcuts';
  }

  // Check for function keys (F1-F12 are allowed)
  if (key.startsWith('F') && /^\d+$/.test(key.substring(1))) {
    const fKeyNum = parseInt(key.substring(1));
    if (fKeyNum < 1 || fKeyNum > 12) {
      return 'Function keys must be F1 through F12';
    }
  } else {
    // For non-function keys, ensure it's a valid key
    if (
      key.length > 1 &&
      !['Space', 'Enter', 'Tab', 'Esc', 'Backspace', 'Delete', 'Up', 'Down', 'Left', 'Right'].includes(key)
    ) {
      return 'Invalid key for shortcut';
    }
  }

  // Check for duplicate modifiers
  if (new Set(modifiers).size !== modifiers.length) {
    return 'Duplicate modifier keys are not allowed';
  }

  return null; // Valid
}

/**
 * Saves the shortcut to chrome.storage.sync and updates the extension's commands
 */
export async function saveShortcut(shortcut: string): Promise<void> {
  try {
    // Save to storage
    await chrome.storage.sync.set({ keyboardShortcut: shortcut });

    // Update the command shortcut
    await chrome.commands.update({
      name: COMMAND_NAME,
      shortcut: shortcut,
    });
  } catch (error) {
    console.error('Error saving shortcut:', error);
    throw new Error('Failed to save shortcut');
  }
}

/**
 * Loads the current shortcut from storage
 */
export async function loadShortcut(): Promise<string> {
  try {
    const result = await chrome.storage.sync.get('keyboardShortcut');
    return result.keyboardShortcut || DEFAULT_SHORTCUT;
  } catch (error) {
    console.error('Error loading shortcut:', error);
    return DEFAULT_SHORTCUT;
  }
}

/**
 * Resets the shortcut to the default value
 */
export async function resetShortcut(): Promise<void> {
  await saveShortcut(DEFAULT_SHORTCUT);
}
