// ===== INLINE UTILITY FUNCTIONS =====

// Interfaces
interface ModelConfig {
  provider: 'chrome' | 'openai' | 'gemini' | 'anthropic';
  modelId: string | null;
  name: string;
  cost: number;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

interface AnthropicResponse {
  content: Array<{
    text: string;
  }>;
}

interface ProgressUpdate {
  step: string;
  percentage: number;
  estimatedTimeRemaining: number;
  currentModel: string;
  success?: boolean;
}

interface AttemptMetrics {
  model: string;
  success: boolean;
  time: number;
  error?: string;
}

interface Metrics {
  attempts: AttemptMetrics[];
  totalTime: number;
}

interface MessageParameters {
  [key: string]: string | number;
}

interface I18nOptions {
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

function getModelConfig(model: string): ModelConfig | undefined {
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
      name: 'GPT-5 Mini',
      cost: 0.00025,
    },
    'gpt-5-nano': {
      provider: 'openai',
      modelId: 'gpt-5-nano',
      name: 'GPT-5 Nano',
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
    'claude-sonnet-4.5': {
      provider: 'anthropic',
      modelId: 'claude-sonnet-4.5',
      name: 'Claude Sonnet 4.5',
      cost: 0.003,
    },
    'claude-haiku-4.5': {
      provider: 'anthropic',
      modelId: 'claude-haiku-4.5',
      name: 'Claude Haiku 4.5',
      cost: 0.001,
    },
  };
  return models[model];
}

function getChromeVersion(): number {
  const userAgent = navigator?.userAgent;
  if (!userAgent) return 0;
  const chromeMatch = userAgent.match(/Chrome\/(\d+)/);
  return chromeMatch ? parseInt(chromeMatch[1]) : 0;
}

async function isSummarizerAvailable(): Promise<boolean> {
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

async function checkChromeBuiltinSupport(): Promise<boolean> {
  const version = getChromeVersion();
  const apiAvailable = await isSummarizerAvailable();
  return version >= 138 && apiAvailable;
}

function getSupportedLanguages(provider: string): string[] {
  return LANGUAGE_SUPPORT[provider] || [];
}

function isLanguageSupported(provider: string, language: string): boolean {
  const supportedLanguages = LANGUAGE_SUPPORT[provider];
  return supportedLanguages ? supportedLanguages.includes(language) : false;
}

function validateLanguageSupport(
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

/**
 * Wrapper for chrome.i18n.getMessage with enhanced fallback logic
 * @param messageName - The message key to retrieve
 * @param options - Options for fallback and parameters
 * @returns The localized message or fallback
 */
function getMessage(messageName: string, options: I18nOptions = {}): string {
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
function getCurrentLanguage(): string {
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
function detectUserLanguage(): string {
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
function isRTLLanguage(languageCode: string): boolean {
  const baseLang = languageCode.split('-')[0]; // Remove region
  return RTL_LANGUAGES.has(baseLang);
}

/**
 * Store user's language preference
 * @param languageCode - The language code to store
 * @returns Promise that resolves when storage is complete
 */
async function setUserLanguage(languageCode: string): Promise<void> {
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
async function getUserLanguage(): Promise<string | null> {
  try {
    const result = await chrome.storage.sync.get(['userLanguage']);
    return result.userLanguage || null;
  } catch (error) {
    console.warn('Failed to get user language:', error);
    return null;
  }
}

/**
 * Initialize language preference detection and storage
 * Should be called on extension startup (background script)
 */
async function initializeLanguagePreference(): Promise<void> {
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


interface SummaryState {
  [tabId: number]: {
    summary: string;
    visible: boolean;
    model?: string;
    time?: string;
    metrics?: Metrics;
    isProcessing?: boolean;
  };
}

interface ApiKeys {
  openaiApiKey: string;
  geminiApiKey: string;
  anthropicApiKey: string;
}

interface TryModelResult {
  success: boolean;
  summary?: string;
  error?: string;
}

const lengthConfigs = {
  short: { items: 3, tokens: 1000 },
  medium: { items: 5, tokens: 2000 },
  long: { items: 7, tokens: 3000 },
};

export interface SummarizeResult {
  summary: string;
  model: string;
  time: string;
  metrics: Metrics;
}

interface ModelMetrics {
  [model: string]: {
    totalRequests: number;
    successfulRequests: number;
    totalTime: number;
    avgTime: number;
    lastUsed: string;
  };
}

interface SummaryHistoryEntry {
  id: string;
  timestamp: string;
  url: string;
  title: string;
  summary: string;
  model: string;
  time: string;
  metrics: any;
}

if (
  typeof chrome !== 'undefined' &&
  chrome.runtime &&
  chrome.runtime.onInstalled
) {
  chrome.runtime.onInstalled.addListener(async () => {
    // Perform initial compatibility check
    await checkChromeBuiltinSupport();
    // Initialize language preference detection and storage
    await initializeLanguagePreference();
  });

  chrome.runtime.onStartup.addListener(async () => {
    // Perform initial compatibility check
    await checkChromeBuiltinSupport();
    // Initialize language preference detection and storage
    await initializeLanguagePreference();
  });
}

export const summaryState: SummaryState = {}; // Stores { tabId: { summary: "...", visible: true/false } }

chrome.action.onClicked.addListener(async (tab: chrome.tabs.Tab) => {
  if (tab.url && tab.url.startsWith('chrome://')) {
    console.log(
      'chrome.action.onClicked: Skipping chrome:// URL - extension does not work on Chrome internal pages'
    );
    return;
  }
  // Inject library scripts dynamically
  if (!tab.id) return; // Add check for undefined tab.id
  await chrome.scripting.executeScript({
    target: { tabId: tab.id! },
    files: ['readability.js', 'showdown.js', 'content.js'],
  });

  // Check if summary exists for this tab
  const existingSummary = summaryState[tab.id!];
  if (existingSummary && existingSummary.summary) {
    // Send toggle with existing summary data
    chrome.tabs
      .sendMessage(tab.id!, {
        action: 'toggle_summary_visibility',
        hasSummary: true,
        summary: existingSummary.summary,
        model: existingSummary.model,
        time: existingSummary.time,
        metrics: existingSummary.metrics,
      })
      .catch((error) => {
        console.log('Content script message failed:', error);
      });
  } else {
    // Send toggle to generate new summary
    chrome.tabs
      .sendMessage(tab.id!, {
        action: 'toggle_summary_visibility',
        hasSummary: false,
      })
      .catch((error) => {
        console.log('Content script message failed:', error);
      });
  }
});
if (chrome.commands && chrome.commands.onCommand) {
  chrome.commands.onCommand.addListener(async (command: string) => {
    if (command === '_execute_action') {
      // Get the active tab
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tab || !tab.id) return; // Add check for undefined tab.id

      if (tab.url && tab.url.startsWith('chrome://')) {
        console.log(
          'chrome.commands.onCommand: Skipping chrome:// URL - extension does not work on Chrome internal pages'
        );
        return;
      }
      // Inject library scripts dynamically
      await chrome.scripting.executeScript({
        target: { tabId: tab.id! },
        files: ['readability.js', 'showdown.js', 'content.js'],
      });

      // Check if summary exists for this tab
      const existingSummary = summaryState[tab.id!];
      if (existingSummary && existingSummary.summary) {
        // Send toggle with existing summary data
        chrome.tabs
          .sendMessage(tab.id!, {
            action: 'toggle_summary_visibility',
            hasSummary: true,
            summary: existingSummary.summary,
            model: existingSummary.model,
            time: existingSummary.time,
            metrics: existingSummary.metrics,
          })
          .catch((error) => {
            console.log('Content script message failed:', error);
          });
      } else {
        // Send toggle to generate new summary
        chrome.tabs
          .sendMessage(tab.id!, {
            action: 'toggle_summary_visibility',
            hasSummary: false,
          })
          .catch((error) => {
            console.log('Content script message failed:', error);
          });
      }
    }
  });
}

export async function summarizeWithAI(
  content: string,
  forceModel: string | null = null,
  progressCallback?: (progress: ProgressUpdate) => void
): Promise<SummarizeResult> {
  const startTime = Date.now();
  const {
    selectedModel,
    openaiApiKey,
    geminiApiKey,
    anthropicApiKey,
    enableFallback,
    language,
    summaryLength,
  } = await chrome.storage.sync.get([
    'selectedModel',
    'openaiApiKey',
    'geminiApiKey',
    'anthropicApiKey',
    'enableFallback',
    'language',
    'summaryLength',
  ]);

  const selectedLanguage = language || 'en';

  const preferredModel = forceModel || selectedModel || 'chrome-builtin';
  const metrics: Metrics = { attempts: [], totalTime: 0 };

  // Get stored metrics for time estimation
  const { modelMetrics = {} } = await chrome.storage.local.get('modelMetrics');
  const primaryMetrics = (modelMetrics as ModelMetrics)[preferredModel];
  const estimatedTotalTime = primaryMetrics ? primaryMetrics.avgTime : 5; // Default 5 seconds

  // Step 1: Content extraction (10%)
  if (progressCallback) {
    progressCallback({
      step: getMessage('extractingContent'),
      percentage: 10,
      estimatedTimeRemaining: estimatedTotalTime * 0.9,
      currentModel: preferredModel,
    });
  }

  let result = await tryModel(
    preferredModel,
    content,
    {
      openaiApiKey,
      geminiApiKey,
      anthropicApiKey,
    },
    selectedLanguage,
    summaryLength || 'medium'
  );

  metrics.attempts.push({
    model: preferredModel,
    success: result.success,
    time: Date.now() - startTime,
    error: result.error,
  });

  let usedModel = preferredModel;

  // Step 2: Primary model attempt (20-70%)
  if (progressCallback) {
    progressCallback({
      step: result.success
        ? getMessage('processingResponse')
        : getMessage('tryingFallbackModels'),
      percentage: result.success ? 70 : 20,
      estimatedTimeRemaining: result.success
        ? estimatedTotalTime * 0.3
        : estimatedTotalTime * 0.8,
      currentModel: preferredModel,
      success: result.success,
    });
  }

  // Fallback to other models if enabled and preferred failed
  if (!result.success && enableFallback !== false) {
    const fallbackModels = await getFallbackModels(preferredModel);
    let fallbackProgress = 20;

    for (let i = 0; i < fallbackModels.length; i++) {
      const model = fallbackModels[i];
      const attemptStart = Date.now();

      if (progressCallback) {
        progressCallback({
          step: getMessage('tryingModel', {
            parameters: { model: getModelConfig(model)!.name },
          }),
          percentage: fallbackProgress + i * 15,
          estimatedTimeRemaining: estimatedTotalTime * (0.8 - i * 0.1),
          currentModel: model,
        });
      }

      result = await tryModel(
        model,
        content,
        {
          openaiApiKey,
          geminiApiKey,
          anthropicApiKey,
        },
        selectedLanguage,
        summaryLength || 'medium'
      );

      metrics.attempts.push({
        model,
        success: result.success,
        time: Date.now() - attemptStart,
        error: result.error,
      });

      if (result.success) {
        usedModel = model;
        if (progressCallback) {
          progressCallback({
            step: getMessage('processingResponse'),
            percentage: 90,
            estimatedTimeRemaining: estimatedTotalTime * 0.1,
            currentModel: model,
            success: true,
          });
        }
        break;
      }

      fallbackProgress += 15;
    }
  }

  // Step 3: Final processing (90-100%)
  if (progressCallback) {
    progressCallback({
      step: getMessage('finalizingSummary'),
      percentage: 95,
      estimatedTimeRemaining: 0.5,
      currentModel: usedModel,
      success: result.success,
    });
  }

  const endTime = Date.now();
  const timeTaken = ((endTime - startTime) / 1000).toFixed(2);
  metrics.totalTime = parseFloat(timeTaken);

  // Store metrics for comparison
  await storeModelMetrics(usedModel, metrics);

  if (progressCallback) {
    progressCallback({
      step: getMessage('complete'),
      percentage: 100,
      estimatedTimeRemaining: 0,
      currentModel: usedModel,
      success: result.success,
    });
  }

  if (result.success) {
    return {
      summary: result.summary!,
      model: usedModel,
      time: timeTaken,
      metrics,
    };
  } else {
    return {
      summary: getMessage('unableToSummarize'),
      model: 'N/A',
      time: timeTaken,
      metrics,
    };
  }
}

export async function tryModel(
  model: string,
  content: string,
  apiKeys: ApiKeys,
  language: string = 'en',
  length: string = 'medium',
  progressCallback?: (progress: ProgressUpdate) => void
): Promise<TryModelResult> {
  const modelConfig = getModelConfig(model);
  if (!modelConfig) {
    return { success: false, error: 'Unknown model' };
  }

  // Validate language support and determine fallback
  const languageValidation = validateLanguageSupport(
    modelConfig.provider,
    language
  );
  const effectiveLanguage = languageValidation.fallbackLanguage;
  const needsFallback = languageValidation.needsFallback;

  // If fallback occurred, notify the user
  if (needsFallback) {
    console.log(
      getMessage('languageNotSupported', {
        parameters: {
          language: language,
          provider: modelConfig.provider,
        },
      })
    );
  }

  let result: TryModelResult;

  switch (modelConfig.provider) {
    case 'chrome': {
      const isSupported = await checkChromeBuiltinSupport();
      if (!isSupported) {
        return {
          success: false,
          error: getMessage('chromeAiNotSupported'),
        };
      }
      result = await tryChromeBuiltinAI(content, length, progressCallback);

      // If successful and language is not English, translate the summary
      if (result.success && effectiveLanguage !== 'en') {
        const translatedSummary = await translateSummary(
          result.summary!,
          effectiveLanguage,
          progressCallback
        );
        result.summary = translatedSummary;
      }

      return result;
    }
    case 'openai':
      return await tryOpenAI(
        content,
        apiKeys.openaiApiKey,
        modelConfig.modelId!,
        effectiveLanguage,
        length
      );
    case 'gemini':
      return await tryGeminiAPI(
        content,
        apiKeys.geminiApiKey,
        modelConfig.modelId!,
        effectiveLanguage,
        length
      );
    case 'anthropic':
      return await tryAnthropicAPI(
        content,
        apiKeys.anthropicApiKey,
        modelConfig.modelId!,
        effectiveLanguage,
        length
      );
    default:
      return { success: false, error: getMessage('unknownProvider') };
  }
}

export async function getFallbackModels(
  primaryModel: string
): Promise<string[]> {
  const modelConfig = getModelConfig(primaryModel);
  if (!modelConfig) return [];

  const fallbacks: Record<string, string[]> = {
    chrome: ['gpt-3.5-turbo', 'gemini-2.0-flash-exp', 'claude-3-haiku'],
    openai: ['gemini-2.0-flash-exp', 'claude-3-haiku', 'chrome-builtin'],
    gemini: ['gpt-3.5-turbo', 'claude-3-haiku', 'chrome-builtin'],
    anthropic: ['gpt-3.5-turbo', 'gemini-2.0-flash-exp', 'chrome-builtin'],
  };

  const isChromeSupported = await checkChromeBuiltinSupport();
  return (
    fallbacks[modelConfig.provider]?.filter(
      (model) => model !== 'chrome-builtin' || isChromeSupported
    ) || []
  );
}

export async function storeModelMetrics(
  model: string,
  metrics: Metrics
): Promise<void> {
  try {
    const { modelMetrics = {} } =
      await chrome.storage.local.get('modelMetrics');
    if (!(modelMetrics as ModelMetrics)[model]) {
      (modelMetrics as ModelMetrics)[model] = {
        totalRequests: 0,
        successfulRequests: 0,
        totalTime: 0,
        avgTime: 0,
        lastUsed: null as any,
      };
    }

    const modelStats = (modelMetrics as ModelMetrics)[model];
    modelStats.totalRequests++;
    modelStats.totalTime += metrics.totalTime;
    modelStats.avgTime = modelStats.totalTime / modelStats.totalRequests;
    modelStats.lastUsed = new Date().toISOString();

    const lastAttempt = metrics.attempts[metrics.attempts.length - 1];
    if (lastAttempt.success) {
      modelStats.successfulRequests++;
    }

    await chrome.storage.local.set({ modelMetrics });
  } catch (error) {
    console.error('Error storing model metrics:', error);
  }
}

export async function storeSummaryHistory(
  tabId: number,
  summary: string,
  model: string,
  time: string,
  metrics: any
): Promise<void> {
  try {
    const { summaryHistory = [] } =
      await chrome.storage.local.get('summaryHistory');

    // Get tab info for URL and title
    const tab = await chrome.tabs.get(tabId);

    const historyEntry: SummaryHistoryEntry = {
      id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      url: tab.url!,
      title: tab.title!,
      summary: summary,
      model: model,
      time: time,
      metrics: metrics,
    };

    // Add to beginning of array (most recent first)
    (summaryHistory as SummaryHistoryEntry[]).unshift(historyEntry);

    // Keep only the most recent 50 summaries
    if ((summaryHistory as SummaryHistoryEntry[]).length > 50) {
      (summaryHistory as SummaryHistoryEntry[]).splice(50);
    }

    await chrome.storage.local.set({ summaryHistory });
  } catch (error) {
    console.error('Error storing summary history:', error);
  }
}

function markdownToHtml(markdown: string): string {
  // Simple markdown to HTML converter focused on lists
  // Replace markdown list items with HTML
  let html = markdown
    .replace(/^- (.+)$/gm, '<li>$1</li>') // Convert - item to <li>item</li>
    .replace(/^\* (.+)$/gm, '<li>$1</li>') // Convert * item to <li>item</li>
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>'); // Convert 1. item to <li>item</li>

  // Wrap consecutive <li> elements in <ul>
  html = html.replace(/(<li>.*?<\/li>\s*)+/gs, '<ul>$&</ul>');

  return html;
}

async function translateSummary(
  summary: string,
  effectiveLanguage: string,
  progressCallback?: (progress: ProgressUpdate) => void
): Promise<string> {
  if (effectiveLanguage === 'en') {
    return summary;
  }

  try {
    if ('Translator' in globalThis) {
      if (progressCallback) {
        progressCallback({
          step: getMessage('checkingTranslationModel'),
          percentage: 60,
          estimatedTimeRemaining: 1,
          currentModel: 'chrome-builtin',
        });
      }

      const translatorAvailability = await (
        globalThis as any
      ).Translator.availability({
        sourceLanguage: 'en',
        targetLanguage: effectiveLanguage,
      });

      if (translatorAvailability === 'available') {
        if (progressCallback) {
          progressCallback({
            step: getMessage('translatingSummary'),
            percentage: 80,
            estimatedTimeRemaining: 0.5,
            currentModel: 'chrome-builtin',
          });
        }

        const translator = await (globalThis as any).Translator.create({
          sourceLanguage: 'en',
          targetLanguage: effectiveLanguage,
        });
        const translatedSummary = await translator.translate(summary);
        translator.destroy();
        return translatedSummary;
      } else if (translatorAvailability === 'downloadable') {
        // Language model needs to be downloaded
        if (progressCallback) {
          progressCallback({
            step: getMessage('downloadingLanguageModel'),
            percentage: 60,
            estimatedTimeRemaining: 5,
            currentModel: 'chrome-builtin',
          });
        }

        const translator = await (globalThis as any).Translator.create({
          sourceLanguage: 'en',
          targetLanguage: effectiveLanguage,
          monitor: (monitor: any) => {
            monitor.addEventListener('downloadprogress', (e: any) => {
              if (progressCallback && e.loaded && e.total) {
                const downloadProgress = (e.loaded / e.total) * 100;
                progressCallback({
                  step: getMessage('downloadingLanguageModelProgress', {
                    parameters: {
                      percentage: Math.round(downloadProgress).toString(),
                    },
                  }),
                  percentage: 60 + downloadProgress * 0.3,
                  estimatedTimeRemaining:
                    (e.total - e.loaded) /
                    (e.loaded / (Date.now() - monitor.startTime || 1)) /
                    1000,
                  currentModel: 'chrome-builtin',
                });
              }
            });
          },
        });

        if (progressCallback) {
          progressCallback({
            step: getMessage('translatingSummary'),
            percentage: 90,
            estimatedTimeRemaining: 0.5,
            currentModel: 'chrome-builtin',
          });
        }

        const translatedSummary = await translator.translate(summary);
        translator.destroy();
        return translatedSummary;
      } else {
        // Translation not available, use English summary
        return summary;
      }
    } else {
      // Translation not supported, use English summary
      return summary;
    }
  } catch {
    return summary;
  }
}
async function tryChromeBuiltinAI(
  content: string,
  length: string = 'medium',
  progressCallback?: (progress: ProgressUpdate) => void
): Promise<TryModelResult> {
  try {
    if ('Summarizer' in globalThis && (globalThis as any).Summarizer) {
      // Generate summary in English first
      if (progressCallback) {
        progressCallback({
          step: getMessage('initializing'),
          percentage: 20,
          estimatedTimeRemaining: 2,
          currentModel: 'chrome-builtin',
        });
      }
      const summarizer = await (globalThis as any).Summarizer.create({
        type: 'key-points',
        format: 'markdown',
        length: length,
        outputLanguage: 'en',
      });

      if (progressCallback) {
        progressCallback({
          step: getMessage('extractingContent'),
          percentage: 50,
          estimatedTimeRemaining: 1.5,
          currentModel: 'chrome-builtin',
        });
      }
      const englishSummary = await summarizer.summarize(content);
      summarizer.destroy();

      // Convert Markdown to HTML to preserve list structure during translation
      const htmlSummary = markdownToHtml(englishSummary);

      return { success: true, summary: htmlSummary };
    } else {
      return { success: false, error: getMessage('chromeAiNotAvailable') };
    }
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

async function tryOpenAI(
  content: string,
  apiKey: string,
  model: string = 'gpt-3.5-turbo',
  language: string = 'en',
  length: string = 'medium'
): Promise<TryModelResult> {
  try {
    if (!apiKey) {
      return {
        success: false,
        error: getMessage('noApiKeyConfigured', {
          parameters: { provider: 'OpenAI' },
        }),
      };
    }

    const hasPermission = await chrome.permissions.contains({
      origins: ['https://api.openai.com/*'],
    });
    if (!hasPermission) {
      return {
        success: false,
        error: getMessage('permissionDenied', {
          parameters: { provider: 'OpenAI' },
        }),
      };
    }
    const config =
      lengthConfigs[length as keyof typeof lengthConfigs] ||
      lengthConfigs.medium;
    const bulletItems = Array.from(
      { length: config.items },
      (_, i) =>
        `<li>[${i + 1}${i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'} bullet content]</li>`
    ).join('\n');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: `IMPORTANT: Provide ONLY a <ul> list with ${config.items} <li> items and no introduction, titles, or extra text. Format like this:

<ul>
${bulletItems}
</ul>

Provide the summary in the following language: ${language}

Content to summarize:
${content.substring(0, 12000)}`,
          },
        ],
        max_tokens: config.tokens,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(
        getMessage('apiRequestFailed', {
          parameters: {
            provider: 'OpenAI',
            status: response.status.toString(),
          },
        })
      );
    }

    const data: OpenAIResponse = await response.json();
    return { success: true, summary: data.choices[0].message.content.trim() };
  } catch (error) {
    console.error('OpenAI API error:', error);
    return { success: false, error: (error as Error).message };
  }
}

async function tryGeminiAPI(
  content: string,
  apiKey: string,
  model: string = 'gemini-2.0-flash-exp',
  language: string = 'en',
  length: string = 'medium'
): Promise<TryModelResult> {
  try {
    if (!apiKey) {
      return {
        success: false,
        error: getMessage('noApiKeyConfigured', {
          parameters: { provider: 'Gemini' },
        }),
      };
    }

    const hasPermission = await chrome.permissions.contains({
      origins: ['https://generativelanguage.googleapis.com/*'],
    });
    if (!hasPermission) {
      return {
        success: false,
        error: getMessage('permissionDenied', {
          parameters: { provider: 'Gemini' },
        }),
      };
    }
    const config =
      lengthConfigs[length as keyof typeof lengthConfigs] ||
      lengthConfigs.medium;
    const bulletItems = Array.from(
      { length: config.items },
      (_, i) =>
        `<li>[${i + 1}${i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'} bullet content]</li>`
    ).join('\n');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'x-goog-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Provide the summary in the following language: ${language}

IMPORTANT: Provide ONLY a <ul> list with ${config.items} <li> items and no introduction, titles, or extra text. Format like this:

<ul>
${bulletItems}
</ul>

Content to summarize:
${content.substring(0, 12000)}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: config.tokens,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        getMessage('apiRequestFailed', {
          parameters: {
            provider: 'Gemini',
            status: response.status.toString(),
          },
        })
      );
    }

    const data: GeminiResponse = await response.json();
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      return {
        success: true,
        summary: data.candidates[0].content.parts[0].text.trim(),
      };
    } else {
      throw new Error(
        getMessage('invalidResponseFormat', {
          parameters: { provider: 'Gemini' },
        })
      );
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    return { success: false, error: (error as Error).message };
  }
}

async function tryAnthropicAPI(
  content: string,
  apiKey: string,
  model: string = 'claude-3-haiku-20240307',
  language: string = 'en',
  length: string = 'medium'
): Promise<TryModelResult> {
  try {
    if (!apiKey) {
      return {
        success: false,
        error: getMessage('noApiKeyConfigured', {
          parameters: { provider: 'Anthropic' },
        }),
      };
    }

    const hasPermission = await chrome.permissions.contains({
      origins: ['https://api.anthropic.com/*'],
    });
    if (!hasPermission) {
      return {
        success: false,
        error: getMessage('permissionDenied', {
          parameters: { provider: 'Anthropic' },
        }),
      };
    }
    const config =
      lengthConfigs[length as keyof typeof lengthConfigs] ||
      lengthConfigs.medium;
    const bulletItems = Array.from(
      { length: config.items },
      (_, i) =>
        `<li>[${i + 1}${i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'} bullet content]</li>`
    ).join('\n');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        max_tokens: config.tokens,
        temperature: 0.3,
        system: `You are a helpful assistant that provides concise summaries in ${language}.`,
        messages: [
          {
            role: 'user',
            content: `IMPORTANT: Provide ONLY a <ul> list with ${config.items} <li> items and no introduction, titles, or extra text. Format like this:

<ul>
${bulletItems}
</ul>

Content to summarize:
${content.substring(0, 12000)}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(
        getMessage('apiRequestFailed', {
          parameters: {
            provider: 'Anthropic',
            status: response.status.toString(),
          },
        })
      );
    }

    const data: AnthropicResponse = await response.json();
    if (data.content && data.content[0] && data.content[0].text) {
      return { success: true, summary: data.content[0].text.trim() };
    } else {
      throw new Error(
        getMessage('invalidResponseFormat', {
          parameters: { provider: 'Anthropic' },
        })
      );
    }
  } catch (error) {
    console.error('Anthropic API error:', error);
    return { success: false, error: (error as Error).message };
  }
}

chrome.runtime.onMessage.addListener(function (
  request: any,
  sender: chrome.runtime.MessageSender
) {
  if (!request || !request.action) return false; // Explicitly return false for invalid messages
  if (request.action === 'process_content') {
    const tabId = sender.tab!.id!;

    // Check if already processing for this tab
    if (summaryState[tabId]?.isProcessing) {
      return false; // Explicitly return false when concurrent processing is prevented
    }

    // Set processing flag
    if (!summaryState[tabId]) {
      summaryState[tabId] = { summary: '', visible: false };
    }
    summaryState[tabId].isProcessing = true;

    // Show loading state
    chrome.tabs
      .sendMessage(tabId, { action: 'show_loading_spinner' })
      .catch((error) => {
        console.log('Content script message failed:', error);
      });

    // Progress callback to send updates to content script
    const progressCallback = (progress: ProgressUpdate) => {
      chrome.tabs
        .sendMessage(tabId, {
          action: 'update_loading_progress',
          progress,
        })
        .catch((error) => {
          console.log('Content script message failed:', error);
        });
    };

    summarizeWithAI(request.content, request.forceModel, progressCallback)
      .then(async ({ summary, model, time, metrics }) => {
        summaryState[tabId] = {
          summary,
          visible: true,
          model,
          time,
          metrics,
          isProcessing: false,
        };
        chrome.tabs
          .sendMessage(tabId, {
            action: 'display_inline_summary',
            summary,
            model,
            time,
            metrics,
          })
          .catch((error) => {
            console.log('Content script message failed:', error);
          });

        // Store summary in history
        await storeSummaryHistory(tabId, summary, model, time, metrics);
      })
      .catch((error) => {
        console.error('Error summarizing:', error);
        const errorMessage = getMessage('errorSummarizing');
        summaryState[tabId] = {
          summary: errorMessage,
          visible: true,
          model: 'N/A',
          time: 'N/A',
          metrics: undefined,
          isProcessing: false,
        };
        chrome.tabs
          .sendMessage(tabId, {
            action: 'display_inline_summary',
            summary: errorMessage,
            model: 'N/A',
            time: 'N/A',
            metrics: undefined,
          })
          .catch((error) => {
            console.log('Content script message failed:', error);
          });
      });
    return true; // Indicate that the response will be sent asynchronously
  } else if (request.action === 'update_summary_visibility') {
    const tabId = sender.tab!.id!;
    if (summaryState[tabId]) {
      summaryState[tabId].visible = request.visible;
    }
    return false; // Synchronous operation
  } else if (request.action === 'open_options_page') {
    chrome.runtime.openOptionsPage();
    return false; // Synchronous operation
  } else if (request.action === 'switch_model') {
    chrome.storage.sync.set({ selectedModel: request.model }, () => {
      chrome.runtime.sendMessage({
        action: 'model_switched',
        model: request.model,
      });
    });
    return true; // Asynchronous operation
  } else if (request.action === 'get_model_metrics') {
    chrome.storage.local.get('modelMetrics', (result) => {
      chrome.runtime.sendMessage({
        action: 'model_metrics_response',
        metrics: result.modelMetrics || {},
      });
    });
    return true; // Asynchronous operation
  }
  return false; // For synchronous messages or unrecognized actions
});

// Clear summary state when a tab is closed
chrome.tabs.onRemoved.addListener((tabId: number) => {
  delete summaryState[tabId];
});

// Clear summary state when a tab navigates to a new URL
chrome.tabs.onUpdated.addListener((tabId: number, changeInfo: any) => {
  if (changeInfo.url) {
    delete summaryState[tabId];
  }
});
