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
    'gpt-5': {
      provider: 'openai',
      modelId: 'gpt-5',
      name: 'GPT-5',
      cost: 0.00125,
    },
    'gpt-5-mini': {
      provider: 'openai',
      modelId: 'gpt-5-mini',
      name: 'GPT-5 mini',
      cost: 0.00025,
    },
    'gpt-5-nano': {
      provider: 'openai',
      modelId: 'gpt-5-nano',
      name: 'GPT-5 nano',
      cost: 0.00005,
    },
    'gemini-2.5-pro': {
      provider: 'gemini',
      modelId: 'gemini-2.5-pro',
      name: 'Gemini 2.5 Pro',
      cost: 0.00125,
    },
    'gemini-2.5-flash': {
      provider: 'gemini',
      modelId: 'gemini-2.5-flash',
      name: 'Gemini 2.5 Flash',
      cost: 0.00003,
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
    'claude-4.5-sonnet': {
      provider: 'anthropic',
      modelId: 'claude-4.5-sonnet',
      name: 'Sonnet 4.5',
      cost: 0.003,
    },
    'claude-4.5-haiku': {
      provider: 'anthropic',
      modelId: 'claude-4.5-haiku',
      name: 'Haiku 4.5',
      cost: 0.001,
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

// Language support definitions for each provider
const LANGUAGE_SUPPORT: Record<string, string[]> = {
  chrome: [
    'en',
    'es',
    'fr',
    'de',
    'it',
    'pt',
    'ru',
    'ja',
    'ko',
    'zh',
    'ar',
    'hi',
    'nl',
    'sv',
    'da',
    'no',
    'fi',
    'pl',
    'tr',
    'he',
    'th',
    'vi',
    'id',
    'ms',
    'tl',
    'cs',
    'sk',
    'hu',
    'ro',
    'bg',
    'hr',
    'sl',
    'et',
    'lv',
    'lt',
    'mt',
    'el',
    'uk',
    'be',
    'sr',
    'mk',
    'bs',
    'sq',
    'is',
    'ga',
    'cy',
    'gd',
    'kw',
    'br',
    'co',
    'gl',
    'eu',
    'ca',
    'oc',
    'an',
    'ast',
    'ext',
    'lad',
    'lld',
    'lij',
    'lmo',
    'nap',
    'pms',
    'sc',
    'scn',
    'vec',
    'wa',
    'fur',
    'rm',
    'sw',
    'af',
    'zu',
    'xh',
    'st',
    'tn',
    'ts',
    'ss',
    've',
    'nr',
    'nso',
  ], // Chrome Summarizer supports all languages through Translator API
  openai: [
    'en',
    'es',
    'fr',
    'de',
    'it',
    'pt',
    'ru',
    'ja',
    'ko',
    'zh',
    'ar',
    'hi',
    'nl',
    'sv',
    'da',
    'no',
    'fi',
    'pl',
    'tr',
    'he',
    'th',
    'vi',
    'id',
    'ms',
    'tl',
    'cs',
    'sk',
    'hu',
    'ro',
    'bg',
    'hr',
    'sl',
    'et',
    'lv',
    'lt',
    'mt',
    'el',
    'uk',
    'be',
    'sr',
    'mk',
    'bs',
    'sq',
    'is',
    'ga',
    'cy',
    'gd',
    'kw',
    'br',
    'co',
    'gl',
    'eu',
    'ca',
    'oc',
    'an',
    'ast',
    'ext',
    'lad',
    'lld',
    'lij',
    'lmo',
    'nap',
    'pms',
    'sc',
    'scn',
    'vec',
    'wa',
    'fur',
    'rm',
    'sw',
    'af',
    'zu',
    'xh',
    'st',
    'tn',
    'ts',
    'ss',
    've',
    'nr',
    'nso',
  ], // OpenAI supports many languages
  gemini: [
    'en',
    'es',
    'fr',
    'de',
    'it',
    'pt',
    'ru',
    'ja',
    'ko',
    'zh',
    'ar',
    'hi',
    'nl',
    'sv',
    'da',
    'no',
    'fi',
    'pl',
    'tr',
    'he',
    'th',
    'vi',
    'id',
    'ms',
    'tl',
    'cs',
    'sk',
    'hu',
    'ro',
    'bg',
    'hr',
    'sl',
    'et',
    'lv',
    'lt',
    'mt',
    'el',
    'uk',
    'be',
    'sr',
    'mk',
    'bs',
    'sq',
    'is',
    'ga',
    'cy',
    'gd',
    'kw',
    'br',
    'co',
    'gl',
    'eu',
    'ca',
    'oc',
    'an',
    'ast',
    'ext',
    'lad',
    'lld',
    'lij',
    'lmo',
    'nap',
    'pms',
    'sc',
    'scn',
    'vec',
    'wa',
    'fur',
    'rm',
    'sw',
    'af',
    'zu',
    'xh',
    'st',
    'tn',
    'ts',
    'ss',
    've',
    'nr',
    'nso',
  ], // Gemini supports many languages
  anthropic: [
    'en',
    'es',
    'fr',
    'de',
    'it',
    'pt',
    'ru',
    'ja',
    'ko',
    'zh',
    'ar',
    'hi',
    'nl',
    'sv',
    'da',
    'no',
    'fi',
    'pl',
    'tr',
    'he',
    'th',
    'vi',
    'id',
    'ms',
    'tl',
    'cs',
    'sk',
    'hu',
    'ro',
    'bg',
    'hr',
    'sl',
    'et',
    'lv',
    'lt',
    'mt',
    'el',
    'uk',
    'be',
    'sr',
    'mk',
    'bs',
    'sq',
    'is',
    'ga',
    'cy',
    'gd',
    'kw',
    'br',
    'co',
    'gl',
    'eu',
    'ca',
    'oc',
    'an',
    'ast',
    'ext',
    'lad',
    'lld',
    'lij',
    'lmo',
    'nap',
    'pms',
    'sc',
    'scn',
    'vec',
    'wa',
    'fur',
    'rm',
    'sw',
    'af',
    'zu',
    'xh',
    'st',
    'tn',
    'ts',
    'ss',
    've',
    'nr',
    'nso',
  ], // Anthropic supports many languages
};

export function getSupportedLanguages(provider: string): string[] {
  return LANGUAGE_SUPPORT[provider] || [];
}

export function isLanguageSupported(
  provider: string,
  language: string
): boolean {
  const supportedLanguages = LANGUAGE_SUPPORT[provider];
  return supportedLanguages ? supportedLanguages.includes(language) : false;
}

export function validateLanguageSupport(
  provider: string,
  language: string
): {
  supported: boolean;
  fallbackLanguage: string;
  needsFallback: boolean;
} {
  const supported = isLanguageSupported(provider, language);
  return {
    supported,
    fallbackLanguage: supported ? language : 'en',
    needsFallback: !supported && language !== 'en',
  };
}

// ===== I18N UTILITIES =====

// I18n Interfaces
export interface MessageParameters {
  [key: string]: string | number;
}

export interface TranslationData {
  [key: string]: string;
}

export interface I18nOptions {
  fallback?: string;
  parameters?: string | (string | number)[] | MessageParameters;
}

// RTL language codes
const RTL_LANGUAGES = new Set([
  'ar', // Arabic
  'he', // Hebrew
  'fa', // Persian/Farsi
  'ur', // Urdu
  'yi', // Yiddish
  'az', // Azerbaijani (when written in Arabic script)
  'dv', // Divehi
  'ku', // Kurdish (when written in Arabic script)
  'ps', // Pashto
  'sd', // Sindhi
  'ug', // Uyghur
]);

// Language detection fallback chain
const LANGUAGE_FALLBACK_CHAIN = [
  'en', // English as ultimate fallback
  'es', // Spanish
  'fr', // French
  'de', // German
  'zh', // Chinese
  'ja', // Japanese
  'ko', // Korean
  'ru', // Russian
  'pt', // Portuguese
  'it', // Italian
  'ar', // Arabic
  'hi', // Hindi
];

/**
 * Wrapper for chrome.i18n.getMessage with enhanced fallback logic
 * @param messageName - The message key to retrieve
 * @param options - Options for fallback and parameters
 * @returns The localized message or fallback
 */
export function getMessage(
  messageName: string,
  options: I18nOptions = {}
): string {
  try {
    // Convert MessageParameters to array if needed
    let substitutions: string | (string | number)[] | undefined;
    if (options.parameters) {
      if (
        typeof options.parameters === 'string' ||
        Array.isArray(options.parameters)
      ) {
        substitutions = options.parameters;
      } else {
        // Convert MessageParameters object to array
        substitutions = Object.values(options.parameters);
      }
    }

    // Try to get the message from Chrome i18n
    const message = chrome.i18n.getMessage(messageName, substitutions);

    // If message exists and is not empty, return it
    if (message && message.trim() !== '') {
      return message;
    }

    // If no message found and fallback provided, return fallback
    if (options.fallback) {
      return options.fallback;
    }

    // Ultimate fallback: return the message name itself
    return messageName;
  } catch (error) {
    console.warn(`Failed to get message for key "${messageName}":`, error);

    // Return fallback or message name
    return options.fallback || messageName;
  }
}

/**
 * Get the current UI language
 * @returns The current UI language code (e.g., 'en', 'es')
 */
export function getCurrentLanguage(): string {
  try {
    return chrome.i18n.getUILanguage();
  } catch (error) {
    console.warn('Failed to get current UI language:', error);
    return 'en'; // Default fallback
  }
}

/**
 * Detect user's preferred language with fallback chain
 * @returns The detected language code
 */
export function detectUserLanguage(): string {
  try {
    // Get browser languages
    const languages = navigator.languages || [navigator.language];

    // Find first supported language in the chain
    for (const lang of languages) {
      const baseLang = lang.split('-')[0]; // Remove region (e.g., 'en-US' -> 'en')

      // Check if language is in our supported list
      if (LANGUAGE_SUPPORT.chrome.includes(baseLang)) {
        return baseLang;
      }
    }

    // Fallback to our predefined chain
    for (const fallbackLang of LANGUAGE_FALLBACK_CHAIN) {
      if (LANGUAGE_SUPPORT.chrome.includes(fallbackLang)) {
        return fallbackLang;
      }
    }

    // Ultimate fallback
    return 'en';
  } catch (error) {
    console.warn('Failed to detect user language:', error);
    return 'en';
  }
}

/**
 * Check if a language requires right-to-left (RTL) layout
 * @param languageCode - The language code to check
 * @returns True if the language is RTL
 */
export function isRTLLanguage(languageCode: string): boolean {
  const baseLang = languageCode.split('-')[0]; // Remove region
  return RTL_LANGUAGES.has(baseLang);
}

/**
 * Format a message with named parameters (Chrome i18n style)
 * @param message - The message template
 * @param parameters - Object with parameter values
 * @returns The formatted message
 */
export function formatMessage(
  message: string,
  parameters: MessageParameters = {}
): string {
  try {
    let formattedMessage = message;

    // Replace $PARAM$ style placeholders
    for (const [key, value] of Object.entries(parameters)) {
      const placeholder = `$${key.toUpperCase()}$`;
      formattedMessage = formattedMessage.replace(
        new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
        String(value)
      );
    }

    return formattedMessage;
  } catch (error) {
    console.warn('Failed to format message:', error);
    return message;
  }
}

/**
 * Store user's language preference
 * @param languageCode - The language code to store
 * @returns Promise that resolves when storage is complete
 */
export async function setUserLanguage(languageCode: string): Promise<void> {
  try {
    await chrome.storage.sync.set({
      userLanguage: languageCode,
      languageSetAt: Date.now(),
    });
  } catch (error) {
    console.error('Failed to set user language:', error);
    throw new Error('Failed to save language preference');
  }
}

/**
 * Retrieve stored user language preference
 * @returns Promise that resolves to the stored language or null
 */
export async function getUserLanguage(): Promise<string | null> {
  try {
    const result = await chrome.storage.sync.get(['userLanguage']);
    return result.userLanguage || null;
  } catch (error) {
    console.warn('Failed to get user language:', error);
    return null;
  }
}

/**
 * Apply language changes to UI elements
 * Updates elements with data-i18n attributes
 * @param rootElement - Root element to search for i18n elements (default: document)
 * @param languageOverride - Optional language code to use instead of current language
 */
export function updateUILanguage(
  rootElement: Document | Element = document,
  languageOverride?: string
): void {
  console.log(
    `Updating UI language to: ${languageOverride || getCurrentLanguage()}`
  );
  try {
    // Update elements with data-i18n attribute
    const i18nElements = rootElement.querySelectorAll('[data-i18n]');

    i18nElements.forEach((element) => {
      const messageKey = element.getAttribute('data-i18n');
      if (messageKey) {
        const message = getMessage(messageKey);
        if (message !== messageKey) {
          // Only update if translation found
          element.textContent = message;
        }
      }
    });

    // Update elements with data-i18n-placeholder attribute
    const placeholderElements = rootElement.querySelectorAll(
      '[data-i18n-placeholder]'
    );

    placeholderElements.forEach((element) => {
      const messageKey = element.getAttribute('data-i18n-placeholder');
      if (messageKey) {
        const message = getMessage(messageKey);
        if (message !== messageKey && element instanceof HTMLInputElement) {
          element.placeholder = message;
        }
      }
    });

    // Update elements with data-i18n-title attribute
    const titleElements = rootElement.querySelectorAll('[data-i18n-title]');

    titleElements.forEach((element) => {
      const messageKey = element.getAttribute('data-i18n-title');
      if (messageKey) {
        const message = getMessage(messageKey);
        if (message !== messageKey) {
          element.setAttribute('title', message);
        }
      }
    });

    // Update select options with data-i18n attributes
    const optionElements = rootElement.querySelectorAll('option[data-i18n]');

    optionElements.forEach((element) => {
      const messageKey = element.getAttribute('data-i18n');
      if (messageKey) {
        const message = getMessage(messageKey);
        if (message !== messageKey) {
          element.textContent = message;
        }
      }
    });

    // Update optgroup labels with data-i18n attributes
    const optgroupElements = rootElement.querySelectorAll(
      'optgroup[data-i18n]'
    );

    optgroupElements.forEach((element) => {
      const messageKey = element.getAttribute('data-i18n');
      if (messageKey) {
        const message = getMessage(messageKey);
        if (message !== messageKey) {
          element.label = message;
        }
      }
    });

    // Update document direction for RTL languages
    const currentLang = languageOverride || getCurrentLanguage();
    const isRTL = isRTLLanguage(currentLang);
    document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', currentLang);
  } catch (error) {
    console.warn('Failed to update UI language:', error);
  }
}

/**
 * Load translations from remote source (for future updates)
 * @param url - URL to fetch translations from
 * @param languageCode - Language code to load
 * @returns Promise that resolves to translation data
 */
export async function loadTranslations(
  url: string,
  languageCode: string
): Promise<TranslationData> {
  try {
    const response = await fetch(`${url}/${languageCode}.json`);

    if (!response.ok) {
      throw new Error(`Failed to load translations: ${response.status}`);
    }

    const translations: TranslationData = await response.json();

    // Validate translation structure
    if (typeof translations !== 'object' || translations === null) {
      throw new Error('Invalid translation data format');
    }

    return translations;
  } catch (error) {
    console.error('Failed to load translations:', error);
    throw error;
  }
}

/**
 * Initialize language preference detection and storage
 * Should be called on extension startup (background script)
 */
export async function initializeLanguagePreference(): Promise<void> {
  try {
    // Get stored user language or detect automatically
    let userLanguage = await getUserLanguage();

    if (!userLanguage) {
      userLanguage = detectUserLanguage();
      // Save detected language for future use
      await setUserLanguage(userLanguage);
      console.log(`Language preference detected and stored: ${userLanguage}`);
    } else {
      console.log(`Using stored language preference: ${userLanguage}`);
    }
  } catch (error) {
    console.warn('Failed to initialize language preference:', error);
  }
}

/**
 * Initialize i18n system with UI updates
 * Should be called when UI contexts load (content script, options page)
 */
export async function initializeI18n(): Promise<void> {
  try {
    // Get stored user language preference
    const storedLanguage = await getUserLanguage();

    if (storedLanguage) {
      // Apply stored language preference
      updateUILanguage(document, storedLanguage || undefined);
      console.log(`i18n initialized with stored language: ${storedLanguage}`);
    } else {
      // No stored preference, initialize and use detected language
      await initializeLanguagePreference();
      updateUILanguage();
      console.log(
        `i18n initialized with detected language: ${getCurrentLanguage()}`
      );
    }
  } catch (error) {
    console.warn('Failed to initialize i18n:', error);
  }
}
