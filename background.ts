import {
  getModelConfig,
  Metrics,
  ProgressUpdate,
  OpenAIResponse,
  GeminiResponse,
  AnthropicResponse,
  checkChromeBuiltinSupport,
  validateLanguageSupport,
} from './utils';

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

interface SummarizeResult {
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
  });

  chrome.runtime.onStartup.addListener(async () => {
    // Perform initial compatibility check
    await checkChromeBuiltinSupport();
  });
}

const summaryState: SummaryState = {}; // Stores { tabId: { summary: "...", visible: true/false } }

chrome.action.onClicked.addListener(async (tab: chrome.tabs.Tab) => {
  console.log('Extension clicked on tab URL:', tab.url);
  if (tab.url && tab.url.startsWith('chrome://')) {
    console.log(
      'Skipping chrome:// URL - extension does not work on Chrome internal pages'
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
});
if (chrome.commands && chrome.commands.onCommand) {
  chrome.commands.onCommand.addListener(async (command: string) => {
    if (command === '_execute_action') {
      // Get the active tab
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tab) return;

      console.log('Shortcut triggered on tab URL:', tab.url);
      if (tab.url && tab.url.startsWith('chrome://')) {
        console.log(
          'Skipping chrome:// URL - extension does not work on Chrome internal pages'
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
  } = await chrome.storage.sync.get([
    'selectedModel',
    'openaiApiKey',
    'geminiApiKey',
    'anthropicApiKey',
    'enableFallback',
    'language',
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
      step: 'Extracting content',
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
    selectedLanguage
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
      step: result.success ? 'Processing response' : 'Trying fallback models',
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
          step: `Trying ${getModelConfig(model)!.name}`,
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
        selectedLanguage
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
            step: 'Processing response',
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
      step: 'Finalizing summary',
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
      step: 'Complete',
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
      summary:
        'Unable to summarize content. Please check your settings and try again.',
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
      `Language '${language}' not supported by ${modelConfig.provider}, falling back to English`
    );
  }
  switch (modelConfig.provider) {
    case 'chrome': {
      const isSupported = await checkChromeBuiltinSupport();
      if (!isSupported) {
        return {
          success: false,
          error: 'Chrome built-in AI not supported on this browser version',
        };
      }
      return await tryChromeBuiltinAI(
        content,
        effectiveLanguage,
        progressCallback
      );
    }
    case 'openai':
      return await tryOpenAI(
        content,
        apiKeys.openaiApiKey,
        modelConfig.modelId!,
        effectiveLanguage
      );
    case 'gemini':
      return await tryGeminiAPI(
        content,
        apiKeys.geminiApiKey,
        modelConfig.modelId!,
        effectiveLanguage
      );
    case 'anthropic':
      return await tryAnthropicAPI(
        content,
        apiKeys.anthropicApiKey,
        modelConfig.modelId!,
        effectiveLanguage
      );
    default:
      return { success: false, error: 'Unknown provider' };
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

async function translateSummary(
  summary: string,
  targetLanguage: string,
  progressCallback?: (progress: ProgressUpdate) => void
): Promise<string> {
  if (targetLanguage === 'en') {
    return summary;
  }

  try {
    if ('Translator' in globalThis) {
      if (progressCallback) {
        progressCallback({
          step: 'Checking translation model availability',
          percentage: 60,
          estimatedTimeRemaining: 1,
          currentModel: 'chrome-builtin',
        });
      }

      const translatorAvailability = await (
        globalThis as any
      ).Translator.availability({
        sourceLanguage: 'en',
        targetLanguage: targetLanguage,
      });

      if (translatorAvailability === 'available') {
        if (progressCallback) {
          progressCallback({
            step: 'Translating summary',
            percentage: 80,
            estimatedTimeRemaining: 0.5,
            currentModel: 'chrome-builtin',
          });
        }

        const translator = await (globalThis as any).Translator.create({
          sourceLanguage: 'en',
          targetLanguage: targetLanguage,
        });
        const translatedSummary = await translator.translate(summary);
        translator.destroy();
        return translatedSummary;
      } else if (translatorAvailability === 'after-download') {
        // Language model needs to be downloaded
        if (progressCallback) {
          progressCallback({
            step: 'Downloading language model',
            percentage: 60,
            estimatedTimeRemaining: 5,
            currentModel: 'chrome-builtin',
          });
        }

        try {
          const translator = await (globalThis as any).Translator.create({
            sourceLanguage: 'en',
            targetLanguage: targetLanguage,
            monitor: (monitor: any) => {
              monitor.addEventListener('downloadprogress', (e: any) => {
                if (progressCallback && e.loaded && e.total) {
                  const downloadProgress = (e.loaded / e.total) * 100;
                  progressCallback({
                    step: `Downloading language model (${Math.round(downloadProgress)}%)`,
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
              step: 'Translating summary',
              percentage: 90,
              estimatedTimeRemaining: 0.5,
              currentModel: 'chrome-builtin',
            });
          }

          const translatedSummary = await translator.translate(summary);
          translator.destroy();
          return translatedSummary;
        } catch (downloadError) {
          console.log(
            'Language model download failed, using English summary:',
            downloadError
          );
          return summary;
        }
      } else {
        // Translation not available, use English summary
        console.log(
          `Translation not available for ${targetLanguage}, using English summary`
        );
        return summary;
      }
    } else {
      // Translation not supported, use English summary
      console.log(
        `Translation not supported for ${targetLanguage}, using English summary`
      );
      return summary;
    }
  } catch (translationError) {
    console.log('Translation failed, using English summary:', translationError);
    return summary;
  }
}
async function tryChromeBuiltinAI(
  content: string,
  language: string = 'en',
  progressCallback?: (progress: ProgressUpdate) => void
): Promise<TryModelResult> {
  try {
    if ('Summarizer' in globalThis) {
      // Check language support for translation if needed
      let translationSupported = false;
      if (language !== 'en') {
        try {
          if ('Translator' in globalThis) {
            const availability = await (
              globalThis as any
            ).Translator.availability({
              sourceLanguage: 'en',
              targetLanguage: language,
            });
            translationSupported = availability === 'available';
          }
        } catch (availabilityError) {
          console.log(
            'Error checking translation availability:',
            availabilityError
          );
          translationSupported = false;
        }
      }

      // Generate summary in English first
      if (progressCallback) {
        progressCallback({
          step: 'Creating summarizer',
          percentage: 20,
          estimatedTimeRemaining: 2,
          currentModel: 'chrome-builtin',
        });
      }

      const summarizer = await (globalThis as any).Summarizer.create({
        type: 'key-points',
        format: 'markdown',
        length: 'medium',
        outputLanguage: 'en',
      });

      if (progressCallback) {
        progressCallback({
          step: 'Summarizing content',
          percentage: 50,
          estimatedTimeRemaining: 1.5,
          currentModel: 'chrome-builtin',
        });
      }

      const englishSummary = await summarizer.summarize(content);
      summarizer.destroy();

      // If target language is not English, translate the summary
      if (language !== 'en') {
        if (translationSupported) {
          try {
            if (progressCallback) {
              progressCallback({
                step: 'Checking translation model availability',
                percentage: 60,
                estimatedTimeRemaining: 1,
                currentModel: 'chrome-builtin',
              });
            }

            const translatorAvailability = await (
              globalThis as any
            ).Translator.availability({
              sourceLanguage: 'en',
              targetLanguage: language,
            });

            if (translatorAvailability === 'available') {
              if (progressCallback) {
                progressCallback({
                  step: 'Translating summary',
                  percentage: 80,
                  estimatedTimeRemaining: 0.5,
                  currentModel: 'chrome-builtin',
                });
              }

              const translator = await (globalThis as any).Translator.create({
                sourceLanguage: 'en',
                targetLanguage: language,
              });
              const translatedSummary =
                await translator.translate(englishSummary);
              translator.destroy();
              return { success: true, summary: translatedSummary };
            } else if (translatorAvailability === 'after-download') {
              // Language model needs to be downloaded
              if (progressCallback) {
                progressCallback({
                  step: 'Downloading language model',
                  percentage: 60,
                  estimatedTimeRemaining: 5,
                  currentModel: 'chrome-builtin',
                });
              }

              try {
                const translator = await (globalThis as any).Translator.create({
                  sourceLanguage: 'en',
                  targetLanguage: language,
                  monitor: (monitor: any) => {
                    monitor.addEventListener('downloadprogress', (e: any) => {
                      if (progressCallback && e.loaded && e.total) {
                        const downloadProgress = (e.loaded / e.total) * 100;
                        progressCallback({
                          step: `Downloading language model (${Math.round(downloadProgress)}%)`,
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
                    step: 'Translating summary',
                    percentage: 90,
                    estimatedTimeRemaining: 0.5,
                    currentModel: 'chrome-builtin',
                  });
                }

                const translatedSummary =
                  await translator.translate(englishSummary);
                translator.destroy();
                return { success: true, summary: translatedSummary };
              } catch (downloadError) {
                console.log(
                  'Language model download failed, using English summary:',
                  downloadError
                );
                return { success: true, summary: englishSummary };
              }
            } else {
              // Translation not available, use English summary
              console.log(
                `Translation not available for ${language}, using English summary`
              );
              return { success: true, summary: englishSummary };
            }
          } catch (translationError) {
            console.log(
              'Translation failed, using English summary:',
              translationError
            );
            return { success: true, summary: englishSummary };
          }
        } else {
          // Translation not supported, use English summary
          console.log(
            `Translation not supported for ${language}, using English summary`
          );
          return { success: true, summary: englishSummary };
        }
      } else {
        // Target language is English, return the summary as is
        return { success: true, summary: englishSummary };
      }
    } else {
      return { success: false, error: 'Chrome built-in AI not available' };
    }
  } catch (error) {
    console.log('Chrome built-in AI error:', error);
    return { success: false, error: (error as Error).message };
  }
}

async function tryOpenAI(
  content: string,
  apiKey: string,
  model: string = 'gpt-3.5-turbo',
  language: string = 'en'
): Promise<TryModelResult> {
  try {
    if (!apiKey) {
      return { success: false, error: 'No OpenAI API key configured' };
    }

    const hasPermission = await chrome.permissions.contains({
      origins: ['https://api.openai.com/*'],
    });
    if (!hasPermission) {
      return {
        success: false,
        error:
          'Permission denied for OpenAI API access. Please save your settings again in the extension options to grant permissions.',
      };
    }

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
            content: `IMPORTANT: Provide ONLY a <ul> list with 5 <li> items and no introduction, titles, or extra text. Format like this:

<ul>
<li>[First bullet content]</li>
<li>[Second bullet content]</li>
<li>[Third bullet content]</li>
<li>[Fourth bullet content]</li>
<li>[Fifth bullet content]</li>
</ul>

Provide the summary in the following language: ${language}

Content to summarize:
${content.substring(0, 12000)}`,
          },
        ],
        max_tokens: 300,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API request failed: ${response.status}`);
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
  language: string = 'en'
): Promise<TryModelResult> {
  try {
    if (!apiKey) {
      return { success: false, error: 'No Gemini API key configured' };
    }

    const hasPermission = await chrome.permissions.contains({
      origins: ['https://generativelanguage.googleapis.com/*'],
    });
    if (!hasPermission) {
      return {
        success: false,
        error:
          'Permission denied for Gemini API access. Please save your settings again in the extension options to grant permissions.',
      };
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Provide the summary in the following language: ${language}

IMPORTANT: Provide ONLY a <ul> list with 5 <li> items and no introduction, titles, or extra text. Format like this:

<ul>
<li>[First bullet content]</li>
<li>[Second bullet content]</li>
<li>[Third bullet content]</li>
<li>[Fourth bullet content]</li>
<li>[Fifth bullet content]</li>
</ul>

Content to summarize:
${content.substring(0, 12000)}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 300,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API request failed: ${response.status}`);
    }

    const data: GeminiResponse = await response.json();
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      return {
        success: true,
        summary: data.candidates[0].content.parts[0].text.trim(),
      };
    } else {
      throw new Error('Invalid response format from Gemini API');
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
  language: string = 'en'
): Promise<TryModelResult> {
  try {
    if (!apiKey) {
      return { success: false, error: 'No Anthropic API key configured' };
    }

    const hasPermission = await chrome.permissions.contains({
      origins: ['https://api.anthropic.com/*'],
    });
    if (!hasPermission) {
      return {
        success: false,
        error:
          'Permission denied for Anthropic API access. Please save your settings again in the extension options to grant permissions.',
      };
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 300,
        temperature: 0.3,
        system: `You are a helpful assistant that provides concise summaries in ${language}.`,
        messages: [
          {
            role: 'user',
            content: `IMPORTANT: Provide ONLY a <ul> list with 5 <li> items and no introduction, titles, or extra text. Format like this:

<ul>
<li>[First bullet content]</li>
<li>[Second bullet content]</li>
<li>[Third bullet content]</li>
<li>[Fourth bullet content]</li>
<li>[Fifth bullet content]</li>
</ul>

Content to summarize:
${content.substring(0, 12000)}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API request failed: ${response.status}`);
    }

    const data: AnthropicResponse = await response.json();
    if (data.content && data.content[0] && data.content[0].text) {
      return { success: true, summary: data.content[0].text.trim() };
    } else {
      throw new Error('Invalid response format from Anthropic API');
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
  if (!request || !request.action) return;
  if (request.action === 'process_content') {
    const tabId = sender.tab!.id!;

    // Check if already processing for this tab
    if (summaryState[tabId]?.isProcessing) {
      return;
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
        const errorMessage = 'Error summarizing content. Please try again.';
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
  } else if (request.action === 'update_summary_visibility') {
    const tabId = sender.tab!.id!;
    if (summaryState[tabId]) {
      summaryState[tabId].visible = request.visible;
    }
  } else if (request.action === 'open_options_page') {
    chrome.runtime.openOptionsPage();
  } else if (request.action === 'switch_model') {
    chrome.storage.sync.set({ selectedModel: request.model }, () => {
      chrome.runtime.sendMessage({
        action: 'model_switched',
        model: request.model,
      });
    });
  } else if (request.action === 'get_model_metrics') {
    chrome.storage.local.get('modelMetrics', (result) => {
      chrome.runtime.sendMessage({
        action: 'model_metrics_response',
        metrics: result.modelMetrics || {},
      });
    });
  }
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
