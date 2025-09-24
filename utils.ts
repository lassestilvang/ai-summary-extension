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
