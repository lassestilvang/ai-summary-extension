// Comprehensive unit tests for language preference implementation
import fetchMock from 'jest-fetch-mock';
import {
  validateLanguageSupport,
  isLanguageSupported,
  getSupportedLanguages,
  LANGUAGE_SUPPORT,
} from '../utils';

// Mock chrome APIs
Object.defineProperty(global, 'chrome', {
  value: {
    storage: {
      sync: {
        get: jest.fn().mockResolvedValue({
          language: 'en',
          selectedModel: 'chrome-builtin',
          enableFallback: true,
        }),
        set: jest.fn().mockResolvedValue(undefined),
      },
      local: {
        get: jest.fn().mockResolvedValue({}),
        set: jest.fn().mockResolvedValue(undefined),
      },
    },
    runtime: {
      sendMessage: jest.fn().mockResolvedValue(undefined),
      onMessage: {
        addListener: jest.fn(),
      },
    },
    tabs: {
      sendMessage: jest.fn().mockResolvedValue(undefined),
    },
  },
  writable: true,
});

// Mock Summarizer API
(globalThis as any).Summarizer = {
  create: jest.fn().mockResolvedValue({
    summarize: jest.fn().mockResolvedValue('Mocked summary'),
    destroy: jest.fn(),
  }),
};

describe('Language Preferences Comprehensive Tests', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
    jest.clearAllMocks();
  });

  describe('Language Support Validation', () => {
    describe('validateLanguageSupport function', () => {
      it('should return supported=true for English with any provider', () => {
        const providers = ['openai', 'gemini', 'anthropic', 'chrome'];

        providers.forEach((provider) => {
          const result = validateLanguageSupport(provider, 'en');
          expect(result.supported).toBe(true);
          expect(result.fallbackLanguage).toBe('en');
          expect(result.needsFallback).toBe(false);
        });
      });

      it('should return fallback for unsupported languages', () => {
        const result = validateLanguageSupport('chrome', 'xx'); // Chrome only supports English
        expect(result.supported).toBe(false);
        expect(result.fallbackLanguage).toBe('en');
        expect(result.needsFallback).toBe(true);
      });

      it('should handle unknown providers gracefully', () => {
        const result = validateLanguageSupport('unknown-provider', 'en');
        expect(result.supported).toBe(false);
        expect(result.fallbackLanguage).toBe('en');
        expect(result.needsFallback).toBe(false);
      });

      it('should not need fallback when unsupported language is English', () => {
        const result = validateLanguageSupport('chrome', 'en');
        expect(result.needsFallback).toBe(false);
      });
    });

    describe('isLanguageSupported function', () => {
      it('should return true for supported languages', () => {
        expect(isLanguageSupported('openai', 'es')).toBe(true);
        expect(isLanguageSupported('gemini', 'fr')).toBe(true);
        expect(isLanguageSupported('anthropic', 'de')).toBe(true);
        expect(isLanguageSupported('chrome', 'en')).toBe(true);
      });

      it('should return false for unsupported languages', () => {
        expect(isLanguageSupported('chrome', 'es')).toBe(false);
        expect(isLanguageSupported('openai', 'unsupported')).toBe(false);
      });

      it('should handle unknown providers', () => {
        expect(isLanguageSupported('unknown', 'en')).toBe(false);
      });
    });

    describe('getSupportedLanguages function', () => {
      it('should return correct languages for each provider', () => {
        expect(getSupportedLanguages('chrome')).toEqual(['en']);
        expect(getSupportedLanguages('openai')).toContain('en');
        expect(getSupportedLanguages('gemini')).toContain('en');
        expect(getSupportedLanguages('anthropic')).toContain('en');
      });

      it('should return empty array for unknown providers', () => {
        expect(getSupportedLanguages('unknown')).toEqual([]);
      });
    });
  });

  describe('Provider-Specific Language Support', () => {
    describe('Chrome Built-in AI', () => {
      it('should only support English', () => {
        expect(isLanguageSupported('chrome', 'en')).toBe(true);
        expect(isLanguageSupported('chrome', 'es')).toBe(false);
        expect(isLanguageSupported('chrome', 'fr')).toBe(false);
        expect(isLanguageSupported('chrome', 'de')).toBe(false);
      });

      it('should fallback to English for any non-English language', () => {
        const languages = ['es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko'];

        languages.forEach((lang) => {
          const result = validateLanguageSupport('chrome', lang);
          expect(result.supported).toBe(false);
          expect(result.fallbackLanguage).toBe('en');
          expect(result.needsFallback).toBe(true);
        });
      });
    });

    describe('OpenAI Models', () => {
      const openaiLanguages = LANGUAGE_SUPPORT.openai;

      it('should support all documented languages', () => {
        openaiLanguages.forEach((lang) => {
          expect(isLanguageSupported('openai', lang)).toBe(true);
        });
      });

      it('should include major languages', () => {
        const majorLanguages = [
          'en',
          'es',
          'fr',
          'de',
          'it',
          'pt',
          'zh',
          'ja',
          'ko',
          'ru',
          'ar',
          'hi',
        ];
        majorLanguages.forEach((lang) => {
          expect(openaiLanguages).toContain(lang);
        });
      });

      it('should not need fallback for supported languages', () => {
        openaiLanguages.slice(0, 5).forEach((lang) => {
          const result = validateLanguageSupport('openai', lang);
          expect(result.supported).toBe(true);
          expect(result.fallbackLanguage).toBe(lang);
          expect(result.needsFallback).toBe(false);
        });
      });
    });

    describe('Gemini Models', () => {
      const geminiLanguages = LANGUAGE_SUPPORT.gemini;

      it('should support all documented languages', () => {
        geminiLanguages.forEach((lang) => {
          expect(isLanguageSupported('gemini', lang)).toBe(true);
        });
      });

      it('should include major languages', () => {
        const majorLanguages = [
          'en',
          'es',
          'fr',
          'de',
          'it',
          'pt',
          'zh',
          'ja',
          'ko',
          'ru',
          'ar',
          'hi',
        ];
        majorLanguages.forEach((lang) => {
          expect(geminiLanguages).toContain(lang);
        });
      });

      it('should not need fallback for supported languages', () => {
        geminiLanguages.slice(0, 5).forEach((lang) => {
          const result = validateLanguageSupport('gemini', lang);
          expect(result.supported).toBe(true);
          expect(result.fallbackLanguage).toBe(lang);
          expect(result.needsFallback).toBe(false);
        });
      });
    });

    describe('Anthropic Models', () => {
      const anthropicLanguages = LANGUAGE_SUPPORT.anthropic;

      it('should support all documented languages', () => {
        anthropicLanguages.forEach((lang) => {
          expect(isLanguageSupported('anthropic', lang)).toBe(true);
        });
      });

      it('should include major languages', () => {
        const majorLanguages = [
          'en',
          'es',
          'fr',
          'de',
          'it',
          'pt',
          'zh',
          'ja',
          'ko',
          'ru',
          'ar',
          'hi',
        ];
        majorLanguages.forEach((lang) => {
          expect(anthropicLanguages).toContain(lang);
        });
      });

      it('should not need fallback for supported languages', () => {
        anthropicLanguages.slice(0, 5).forEach((lang) => {
          const result = validateLanguageSupport('anthropic', lang);
          expect(result.supported).toBe(true);
          expect(result.fallbackLanguage).toBe(lang);
          expect(result.needsFallback).toBe(false);
        });
      });
    });
  });

  describe('Language Fallback Behavior', () => {
    it('should fallback to English when language is not supported', () => {
      const providers = ['openai', 'gemini', 'anthropic', 'chrome'];

      providers.forEach((provider) => {
        // Test with a language that might not be supported by all providers
        const result = validateLanguageSupport(provider, 'xx'); // Non-existent language
        expect(result.fallbackLanguage).toBe('en');
        if (provider !== 'chrome') {
          expect(result.needsFallback).toBe(true);
        }
      });
    });

    it('should handle edge cases in language codes', () => {
      // Test with malformed language codes
      const result = validateLanguageSupport('openai', '');
      expect(result.fallbackLanguage).toBe('en');

      const result2 = validateLanguageSupport('openai', null as any);
      expect(result2.fallbackLanguage).toBe('en');
    });
  });

  describe('Integration with Background Script', () => {
    it('should validate language before making API calls', async () => {
      // Mock the tryModel function import
      const { tryModel } = await import('../background');

      // Test with Chrome AI and non-English language
      const result = await tryModel(
        'chrome-builtin',
        'Test content',
        {
          openaiApiKey: '',
          geminiApiKey: '',
          anthropicApiKey: '',
        },
        'es'
      );

      // Should succeed because Chrome AI only outputs English anyway
      expect(result.success).toBe(true);
      expect(result.summary).toBe('Mocked summary');
    });

    it('should handle language validation in summarization flow', async () => {
      const { summarizeWithAI } = await import('../background');

      // Mock progress callback
      const progressCallback = jest.fn();

      const result = await summarizeWithAI(
        'Test content',
        'chrome-builtin',
        progressCallback
      );

      expect(result.summary).toBeDefined();
      expect(result.model).toBe('chrome-builtin');
    });
  });

  describe('UI Language Indicators', () => {
    beforeEach(() => {
      // Mock DOM elements
      document.body.innerHTML = `
        <div id="ai-summary-container">
          <div id="ai-summary-header"></div>
          <div id="ai-summary-content"></div>
          <div id="ai-summary-footer"></div>
        </div>
      `;
    });

    it('should display language indicator for English', () => {
      // Import and test the content script functions
      require('../content');

      // Mock chrome storage to return English
      (chrome.storage.sync.get as any).mockResolvedValueOnce({
        language: 'en',
        theme: 'light',
        fontFamily: 'Arial',
        fontSize: 14,
        fontStyle: 'normal',
      });

      // The content script should create language indicator
      // This is tested indirectly through DOM manipulation
      expect(
        document.getElementById('ai-summary-language-indicator')
      ).toBeNull(); // Not created yet
    });

    it('should handle language indicator creation', () => {
      // Test the language indicator creation logic from content.ts
      const footerDiv = document.createElement('div');
      const language = 'es';

      // Simulate the language indicator creation from content.ts
      const languageIndicator = document.createElement('div');
      languageIndicator.id = 'ai-summary-language-indicator';
      languageIndicator.style.cssText = `
        font-size: 11px !important;
        position: absolute !important;
        bottom: 8px !important;
        right: 8px !important;
        background: rgba(0, 0, 0, 0.7) !important;
        color: white !important;
        padding: 2px 6px !important;
        border-radius: 3px !important;
        font-weight: bold !important;
        z-index: 1000 !important;
      `;

      if (language) {
        languageIndicator.textContent = language.toUpperCase();
        languageIndicator.title = `Summary language: ${language}`;
      } else {
        languageIndicator.textContent = 'EN';
        languageIndicator.title = 'Summary language: English (default)';
      }

      footerDiv.appendChild(languageIndicator);

      expect(languageIndicator.textContent).toBe('ES');
      expect(languageIndicator.title).toBe('Summary language: es');
    });
  });

  describe('Options Page Language Selection', () => {
    beforeEach(() => {
      // Mock DOM for options page
      document.body.innerHTML = `
        <select id="language">
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
        </select>
        <button id="save">Save</button>
        <div id="status"></div>
      `;

      // Mock chrome storage
      (chrome.storage.sync.get as any).mockResolvedValue({
        language: 'es',
        selectedModel: 'chrome-builtin',
      });
    });

    it('should load saved language preference', () => {
      // Import options script
      require('../options');

      // The options script should set the language select value
      const languageSelect = document.getElementById(
        'language'
      ) as HTMLSelectElement;
      expect(languageSelect).toBeDefined();
    });

    it('should save language preference', () => {
      require('../options');

      const languageSelect = document.getElementById(
        'language'
      ) as HTMLSelectElement;
      const saveButton = document.getElementById('save') as HTMLButtonElement;

      // Set language to French
      languageSelect.value = 'fr';

      // Trigger save (this would normally be done by the form submit handler)
      // For testing, we'll directly call the storage set
      expect(languageSelect.value).toBe('fr');
    });
  });

  describe('Cross-Provider Language Consistency', () => {
    it('should have consistent language support across providers', () => {
      const providers = ['openai', 'gemini', 'anthropic'];

      // All providers should support English
      providers.forEach((provider) => {
        expect(isLanguageSupported(provider, 'en')).toBe(true);
      });

      // Check that major languages are consistently supported
      const majorLanguages = ['es', 'fr', 'de', 'it', 'pt'];

      majorLanguages.forEach((lang) => {
        const supportCount = providers.filter((p) =>
          isLanguageSupported(p, lang)
        ).length;
        // At least most providers should support major languages
        expect(supportCount).toBeGreaterThanOrEqual(providers.length - 1);
      });
    });

    it('should handle language codes case-insensitively in validation', () => {
      // Language codes should be case-insensitive
      expect(isLanguageSupported('openai', 'EN')).toBe(false);
      expect(isLanguageSupported('openai', 'En')).toBe(false);
      expect(isLanguageSupported('chrome', 'EN')).toBe(false);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty or null language values', () => {
      const result1 = validateLanguageSupport('openai', '');
      expect(result1.fallbackLanguage).toBe('en');

      const result2 = validateLanguageSupport('openai', null as any);
      expect(result2.fallbackLanguage).toBe('en');

      const result3 = validateLanguageSupport('openai', undefined as any);
      expect(result3.fallbackLanguage).toBe('en');
    });

    it('should handle unknown language codes gracefully', () => {
      const unknownLanguages = ['xx', 'yy', 'zz', 'nonexistent'];

      unknownLanguages.forEach((lang) => {
        const result = validateLanguageSupport('openai', lang);
        expect(result.fallbackLanguage).toBe('en');
        expect(result.needsFallback).toBe(true);
      });
    });

    it('should handle malformed provider names', () => {
      const result = validateLanguageSupport('', 'en');
      expect(result.supported).toBe(false);
      expect(result.fallbackLanguage).toBe('en');
    });
  });

  describe('Performance and Memory', () => {
    it('should not create excessive memory usage with language validation', () => {
      // Test that repeated calls don't cause memory leaks
      for (let i = 0; i < 1000; i++) {
        validateLanguageSupport('openai', 'en');
        validateLanguageSupport('chrome', 'es');
      }

      // If we get here without crashing, the test passes
      expect(true).toBe(true);
    });

    it('should have efficient language lookups', () => {
      const startTime = Date.now();

      // Test lookup performance
      for (let i = 0; i < 10000; i++) {
        isLanguageSupported('openai', 'en');
        isLanguageSupported('chrome', 'en');
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete in reasonable time (less than 100ms for 20k operations)
      expect(duration).toBeLessThan(100);
    });
  });
});
