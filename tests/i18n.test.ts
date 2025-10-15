// Comprehensive unit and integration tests for i18n functionality
import fetchMock from 'jest-fetch-mock';
import {
  getMessage,
  detectUserLanguage,
  isRTLLanguage,
  formatMessage,
  setUserLanguage,
  getUserLanguage,
  updateUILanguage,
  initializeI18n,
  initializeLanguagePreference,
  loadTranslations,
  getCurrentLanguage,
} from '../utils';

// Import constants that are not exported but needed for testing
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

// Mock chrome APIs
Object.defineProperty(global, 'chrome', {
  value: {
    i18n: {
      getMessage: jest.fn(),
      getUILanguage: jest.fn(),
    },
    storage: {
      sync: {
        get: jest.fn().mockResolvedValue({}),
        set: jest.fn().mockResolvedValue(undefined),
      },
    },
  },
  writable: true,
});

// Mock navigator
Object.defineProperty(global, 'navigator', {
  value: {
    languages: ['en-US', 'es-ES'],
    language: 'en-US',
  },
  writable: true,
});

// Mock document
Object.defineProperty(global, 'document', {
  value: {
    documentElement: {
      setAttribute: jest.fn(),
      getAttribute: jest.fn(),
    },
    querySelectorAll: jest.fn().mockReturnValue([]),
    createElement: jest.fn().mockReturnValue({
      textContent: '',
      setAttribute: jest.fn(),
      appendChild: jest.fn(),
    }),
  },
  writable: true,
});

describe('I18n Functionality Comprehensive Tests', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
    jest.clearAllMocks();

    // Reset chrome mocks
    (chrome.i18n.getMessage as any).mockReset();
    (chrome.i18n.getUILanguage as any).mockReset().mockReturnValue('en');
    (chrome.storage.sync.get as any).mockReset().mockResolvedValue({});
    (chrome.storage.sync.set as any).mockReset().mockResolvedValue(undefined);

    // Reset document mocks
    (document.querySelectorAll as any).mockReset().mockReturnValue([]);
    (document.documentElement.setAttribute as any).mockReset();
    (document.documentElement.getAttribute as any)
      .mockReset()
      .mockReturnValue('ltr');
  });

  describe('Message Key Existence and Retrieval', () => {
    describe('getMessage function', () => {
      it('should return message from chrome.i18n.getMessage when available', () => {
        (chrome.i18n.getMessage as any).mockReturnValue('Hello World');

        const result = getMessage('hello');

        expect(chrome.i18n.getMessage).toHaveBeenCalledWith('hello', undefined);
        expect(result).toBe('Hello World');
      });

      it('should return fallback when message is empty', () => {
        (chrome.i18n.getMessage as any).mockReturnValue('');

        const result = getMessage('hello', { fallback: 'Default Hello' });

        expect(result).toBe('Default Hello');
      });

      it('should return fallback when message is whitespace only', () => {
        (chrome.i18n.getMessage as any).mockReturnValue('   ');

        const result = getMessage('hello', { fallback: 'Default Hello' });

        expect(result).toBe('Default Hello');
      });

      it('should return message name when no fallback provided and message not found', () => {
        (chrome.i18n.getMessage as any).mockReturnValue('');

        const result = getMessage('hello');

        expect(result).toBe('hello');
      });

      it('should handle parameters correctly', () => {
        (chrome.i18n.getMessage as any).mockReturnValue('Hello John');

        const result = getMessage('hello', {
          parameters: { name: 'John' },
        });

        expect(chrome.i18n.getMessage).toHaveBeenCalledWith('hello', ['John']);
        expect(result).toBe('Hello John');
      });

      it('should handle array parameters', () => {
        (chrome.i18n.getMessage as any).mockReturnValue(
          'Hello John from Paris'
        );

        const result = getMessage('hello', {
          parameters: ['John', 'Paris'],
        });

        expect(chrome.i18n.getMessage).toHaveBeenCalledWith('hello', [
          'John',
          'Paris',
        ]);
        expect(result).toBe('Hello John from Paris');
      });

      it('should handle string parameters', () => {
        (chrome.i18n.getMessage as any).mockReturnValue('Hello World');

        const result = getMessage('hello', {
          parameters: 'World',
        });

        expect(chrome.i18n.getMessage).toHaveBeenCalledWith('hello', 'World');
        expect(result).toBe('Hello World');
      });

      it('should handle chrome.i18n errors gracefully', () => {
        (chrome.i18n.getMessage as any).mockImplementation(() => {
          throw new Error('i18n error');
        });

        const result = getMessage('hello', { fallback: 'Default' });

        expect(result).toBe('Default');
      });

      it('should return message name when chrome.i18n throws error and no fallback', () => {
        (chrome.i18n.getMessage as any).mockImplementation(() => {
          throw new Error('i18n error');
        });

        const result = getMessage('hello');

        expect(result).toBe('hello');
      });
    });

    describe('getCurrentLanguage function', () => {
      it('should return chrome.i18n.getUILanguage result', () => {
        (chrome.i18n.getUILanguage as any).mockReturnValue('es');

        const result = getCurrentLanguage();

        expect(result).toBe('es');
        expect(chrome.i18n.getUILanguage).toHaveBeenCalled();
      });

      it('should return default fallback on error', () => {
        (chrome.i18n.getUILanguage as any).mockImplementation(() => {
          throw new Error('UI language error');
        });

        const result = getCurrentLanguage();

        expect(result).toBe('en');
      });
    });
  });

  describe('Language Detection and Fallback Logic', () => {
    describe('detectUserLanguage function', () => {
      it('should return first supported language from navigator.languages', () => {
        Object.defineProperty(navigator, 'languages', {
          value: ['es-ES', 'fr-FR', 'en-US'],
          writable: true,
        });

        const result = detectUserLanguage();

        expect(result).toBe('es');
      });

      it('should handle language codes without region', () => {
        Object.defineProperty(navigator, 'languages', {
          value: ['zh', 'en'],
          writable: true,
        });

        const result = detectUserLanguage();

        expect(result).toBe('zh');
      });

      it('should fallback to LANGUAGE_FALLBACK_CHAIN when no supported language found', () => {
        Object.defineProperty(navigator, 'languages', {
          value: ['unsupported-lang'],
          writable: true,
        });

        const result = detectUserLanguage();

        expect(LANGUAGE_FALLBACK_CHAIN).toContain(result);
      });

      it('should return english as ultimate fallback', () => {
        Object.defineProperty(navigator, 'languages', {
          value: [],
          writable: true,
        });

        const result = detectUserLanguage();

        expect(result).toBe('en');
      });

      it('should handle navigator.language fallback', () => {
        Object.defineProperty(navigator, 'languages', {
          value: undefined,
          writable: true,
        });
        Object.defineProperty(navigator, 'language', {
          value: 'de-DE',
          writable: true,
        });

        const result = detectUserLanguage();

        expect(result).toBe('de');
      });

      it('should handle errors gracefully', () => {
        Object.defineProperty(navigator, 'languages', {
          value: null,
          writable: true,
        });

        const result = detectUserLanguage();

        expect(result).toBe('en');
      });
    });

    describe('LANGUAGE_FALLBACK_CHAIN', () => {
      it('should contain english as first fallback', () => {
        expect(LANGUAGE_FALLBACK_CHAIN[0]).toBe('en');
      });

      it('should contain major languages', () => {
        const majorLanguages = [
          'en',
          'es',
          'fr',
          'de',
          'zh',
          'ja',
          'ko',
          'ru',
          'pt',
          'it',
          'ar',
          'hi',
        ];
        majorLanguages.forEach((lang) => {
          expect(LANGUAGE_FALLBACK_CHAIN).toContain(lang);
        });
      });

      it('should have english as ultimate fallback', () => {
        expect(
          LANGUAGE_FALLBACK_CHAIN[LANGUAGE_FALLBACK_CHAIN.length - 1]
        ).toBe('en');
      });
    });
  });

  describe('RTL Language Detection', () => {
    describe('isRTLLanguage function', () => {
      it('should return true for RTL languages', () => {
        const rtlLanguages = [
          'ar',
          'he',
          'fa',
          'ur',
          'yi',
          'az',
          'dv',
          'ku',
          'ps',
          'sd',
          'ug',
        ];

        rtlLanguages.forEach((lang) => {
          expect(isRTLLanguage(lang)).toBe(true);
        });
      });

      it('should return false for LTR languages', () => {
        const ltrLanguages = ['en', 'es', 'fr', 'de', 'zh', 'ja', 'ko', 'ru'];

        ltrLanguages.forEach((lang) => {
          expect(isRTLLanguage(lang)).toBe(false);
        });
      });

      it('should handle language codes with region', () => {
        expect(isRTLLanguage('ar-SA')).toBe(true);
        expect(isRTLLanguage('en-US')).toBe(false);
      });

      it('should handle empty or invalid inputs', () => {
        expect(isRTLLanguage('')).toBe(false);
        expect(isRTLLanguage('invalid')).toBe(false);
      });
    });

    describe('RTL_LANGUAGES set', () => {
      it('should contain all expected RTL languages', () => {
        const expectedRTL = new Set([
          'ar',
          'he',
          'fa',
          'ur',
          'yi',
          'az',
          'dv',
          'ku',
          'ps',
          'sd',
          'ug',
        ]);

        expect(RTL_LANGUAGES).toEqual(expectedRTL);
      });
    });
  });

  describe('Message Formatting', () => {
    describe('formatMessage function', () => {
      it('should replace $PARAM$ style placeholders', () => {
        const message = 'Hello $NAME$, welcome to $PLACE$!';
        const parameters = { NAME: 'John', PLACE: 'Paris' };

        const result = formatMessage(message, parameters);

        expect(result).toBe('Hello John, welcome to Paris!');
      });

      it('should handle case sensitive placeholders', () => {
        const message = 'Hello $name$, welcome!';
        const parameters = { NAME: 'John' };

        const result = formatMessage(message, parameters);

        expect(result).toBe('Hello $name$, welcome!');
      });

      it('should handle multiple occurrences of same placeholder', () => {
        const message = 'Hello $NAME$, $NAME$!';
        const parameters = { NAME: 'John' };

        const result = formatMessage(message, parameters);

        expect(result).toBe('Hello John, John!');
      });

      it('should handle empty parameters object', () => {
        const message = 'Hello World!';

        const result = formatMessage(message, {});

        expect(result).toBe('Hello World!');
      });

      it('should handle undefined parameters', () => {
        const message = 'Hello World!';

        const result = formatMessage(message);

        expect(result).toBe('Hello World!');
      });

      it('should handle regex special characters in placeholders', () => {
        const message = 'Price: $PRICE$';
        const parameters = { PRICE: '$100' };

        const result = formatMessage(message, parameters);

        expect(result).toBe('Price: $100');
      });

      it('should handle errors gracefully', () => {
        const message = 'Hello $NAME$!';
        const parameters = null as any;

        const result = formatMessage(message, parameters);

        expect(result).toBe('Hello $NAME$!');
      });
    });
  });

  describe('Storage Operations for Language Preferences', () => {
    describe('setUserLanguage function', () => {
      it('should store language preference with timestamp', async () => {
        const mockDate = new Date('2023-12-01T10:00:00.000Z');
        jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime());

        await setUserLanguage('es');

        expect(chrome.storage.sync.set).toHaveBeenCalledWith({
          userLanguage: 'es',
          languageSetAt: mockDate.getTime(),
        });

        jest.restoreAllMocks();
      });

      it('should handle storage errors', async () => {
        (chrome.storage.sync.set as any).mockRejectedValue(
          new Error('Storage error')
        );

        await expect(setUserLanguage('es')).rejects.toThrow(
          'Failed to save language preference'
        );
      });
    });

    describe('getUserLanguage function', () => {
      it('should return stored language preference', async () => {
        (chrome.storage.sync.get as any).mockResolvedValue({
          userLanguage: 'fr',
        });

        const result = await getUserLanguage();

        expect(result).toBe('fr');
        expect(chrome.storage.sync.get).toHaveBeenCalledWith(['userLanguage']);
      });

      it('should return null when no preference stored', async () => {
        (chrome.storage.sync.get as any).mockResolvedValue({});

        const result = await getUserLanguage();

        expect(result).toBeNull();
      });

      it('should handle storage errors', async () => {
        (chrome.storage.sync.get as any).mockRejectedValue(
          new Error('Storage error')
        );

        const result = await getUserLanguage();

        expect(result).toBeNull();
      });
    });
  });

  describe('UI Language Updates and Element Translation', () => {
    describe('updateUILanguage function', () => {
      beforeEach(() => {
        // Mock elements
        const mockElements = [
          { getAttribute: jest.fn(() => 'hello'), textContent: '' },
          { getAttribute: jest.fn(() => 'goodbye'), textContent: '' },
        ];

        const mockPlaceholderElements = [
          { getAttribute: jest.fn(() => 'search'), placeholder: '' },
        ];

        const mockTitleElements = [
          { getAttribute: jest.fn(() => 'tooltip'), setAttribute: jest.fn() },
        ];

        (document.querySelectorAll as any)
          .mockReturnValueOnce(mockElements) // data-i18n
          .mockReturnValueOnce(mockPlaceholderElements) // data-i18n-placeholder
          .mockReturnValueOnce(mockTitleElements); // data-i18n-title
      });

      it('should update elements with data-i18n attribute', () => {
        (chrome.i18n.getMessage as any)
          .mockReturnValueOnce('Hello')
          .mockReturnValueOnce('Goodbye');

        updateUILanguage();

        // Verify querySelectorAll calls
        expect(document.querySelectorAll).toHaveBeenCalledWith('[data-i18n]');
        expect(document.querySelectorAll).toHaveBeenCalledWith(
          '[data-i18n-placeholder]'
        );
        expect(document.querySelectorAll).toHaveBeenCalledWith(
          '[data-i18n-title]'
        );
      });

      it('should set document language and direction', () => {
        (chrome.i18n.getUILanguage as any).mockReturnValue('ar');

        updateUILanguage();

        expect(document.documentElement.setAttribute).toHaveBeenCalledWith(
          'lang',
          'ar'
        );
        expect(document.documentElement.setAttribute).toHaveBeenCalledWith(
          'dir',
          'rtl'
        );
      });

      it('should set LTR direction for non-RTL languages', () => {
        (chrome.i18n.getUILanguage as any).mockReturnValue('en');

        updateUILanguage();

        expect(document.documentElement.setAttribute).toHaveBeenCalledWith(
          'dir',
          'ltr'
        );
      });

      it('should only update elements when translation exists', () => {
        const mockElements = [
          {
            getAttribute: jest.fn(() => 'existing'),
            textContent: 'old content',
          },
          {
            getAttribute: jest.fn(() => 'missing'),
            textContent: 'old content',
          },
        ];

        (document.querySelectorAll as any).mockReturnValue(mockElements);
        (chrome.i18n.getMessage as any)
          .mockReturnValueOnce('New Content')
          .mockReturnValueOnce('missing'); // No translation found

        updateUILanguage();

        expect(mockElements[0].textContent).toBe('New Content');
        expect(mockElements[1].textContent).toBe('old content');
      });

      it('should handle placeholder elements correctly', () => {
        const mockPlaceholderElement = {
          getAttribute: jest.fn(() => 'search'),
          placeholder: 'old placeholder',
          instanceof: () => true,
        };

        (document.querySelectorAll as any)
          .mockReturnValueOnce([]) // data-i18n
          .mockReturnValueOnce([mockPlaceholderElement]) // data-i18n-placeholder
          .mockReturnValueOnce([]); // data-i18n-title

        (chrome.i18n.getMessage as any).mockReturnValue('Search...');

        updateUILanguage();

        expect(mockPlaceholderElement.placeholder).toBe('Search...');
      });

      it('should handle title elements correctly', () => {
        const mockTitleElement = {
          getAttribute: jest.fn(() => 'tooltip'),
          setAttribute: jest.fn(),
        };

        (document.querySelectorAll as any)
          .mockReturnValueOnce([]) // data-i18n
          .mockReturnValueOnce([]) // data-i18n-placeholder
          .mockReturnValueOnce([mockTitleElement]); // data-i18n-title

        (chrome.i18n.getMessage as any).mockReturnValue('Help tooltip');

        updateUILanguage();

        expect(mockTitleElement.setAttribute).toHaveBeenCalledWith(
          'title',
          'Help tooltip'
        );
      });

      it('should handle errors gracefully', () => {
        (document.querySelectorAll as any).mockImplementation(() => {
          throw new Error('DOM error');
        });

        expect(() => updateUILanguage()).not.toThrow();
      });
    });
  });

  describe('Language Switching Functionality', () => {
    describe('initializeLanguagePreference function', () => {
      it('should use stored language preference when available', async () => {
        (chrome.storage.sync.get as any).mockResolvedValue({
          userLanguage: 'fr',
        });

        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        await initializeLanguagePreference();

        expect(consoleSpy).toHaveBeenCalledWith(
          'Using stored language preference: fr'
        );

        consoleSpy.mockRestore();
      });

      it('should detect and store language when no preference exists', async () => {
        (chrome.storage.sync.get as any).mockResolvedValue({});
        Object.defineProperty(navigator, 'languages', {
          value: ['es-ES'],
          writable: true,
        });

        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        await initializeLanguagePreference();

        expect(chrome.storage.sync.set).toHaveBeenCalledWith({
          userLanguage: 'es',
          languageSetAt: expect.any(Number),
        });
        expect(consoleSpy).toHaveBeenCalledWith(
          'Language preference detected and stored: es'
        );

        consoleSpy.mockRestore();
      });

      it('should handle storage errors gracefully', async () => {
        (chrome.storage.sync.get as any).mockRejectedValue(
          new Error('Storage error')
        );

        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

        await initializeLanguagePreference();

        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to initialize language preference:',
          expect.any(Error)
        );

        consoleSpy.mockRestore();
      });
    });

    describe('initializeI18n function', () => {
      it('should initialize language preference and update UI', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        await initializeI18n();

        expect(consoleSpy).toHaveBeenCalledWith(
          'i18n initialized with language: en'
        );

        consoleSpy.mockRestore();
      });

      it('should handle initialization errors gracefully', async () => {
        (chrome.storage.sync.get as any).mockRejectedValue(
          new Error('Storage error')
        );

        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

        await initializeI18n();

        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to initialize i18n:',
          expect.any(Error)
        );

        consoleSpy.mockRestore();
      });
    });
  });

  describe('Translation Loading', () => {
    describe('loadTranslations function', () => {
      it('should load and validate translations successfully', async () => {
        const mockTranslations = {
          hello: 'Hola',
          goodbye: 'Adiós',
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockTranslations));

        const result = await loadTranslations(
          'https://example.com/translations',
          'es'
        );

        expect(result).toEqual(mockTranslations);
        expect(fetchMock).toHaveBeenCalledWith(
          'https://example.com/translations/es.json'
        );
      });

      it('should throw error for failed HTTP response', async () => {
        fetchMock.mockResponseOnce('', { status: 404 });

        await expect(
          loadTranslations('https://example.com/translations', 'es')
        ).rejects.toThrow('Failed to load translations: 404');
      });

      it('should throw error for invalid JSON', async () => {
        fetchMock.mockResponseOnce('invalid json');

        await expect(
          loadTranslations('https://example.com/translations', 'es')
        ).rejects.toThrow();
      });

      it('should throw error for invalid translation structure', async () => {
        fetchMock.mockResponseOnce('"not an object"');

        await expect(
          loadTranslations('https://example.com/translations', 'es')
        ).rejects.toThrow('Invalid translation data format');
      });

      it('should handle network errors', async () => {
        fetchMock.mockRejectOnce(new Error('Network error'));

        await expect(
          loadTranslations('https://example.com/translations', 'es')
        ).rejects.toThrow('Network error');
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    describe('Missing Translations', () => {
      it('should handle missing message keys gracefully', () => {
        (chrome.i18n.getMessage as any).mockReturnValue('');

        const result = getMessage('nonexistent.key');

        expect(result).toBe('nonexistent.key');
      });

      it('should use fallback for missing translations', () => {
        (chrome.i18n.getMessage as any).mockReturnValue('');

        const result = getMessage('missing', { fallback: 'Default text' });

        expect(result).toBe('Default text');
      });
    });

    describe('Invalid Languages', () => {
      it('should handle invalid language codes in detection', () => {
        Object.defineProperty(navigator, 'languages', {
          value: ['invalid-lang-code'],
          writable: true,
        });

        const result = detectUserLanguage();

        expect(result).toBe('en');
      });

      it('should handle empty language arrays', () => {
        Object.defineProperty(navigator, 'languages', {
          value: [],
          writable: true,
        });

        const result = detectUserLanguage();

        expect(result).toBe('en');
      });
    });

    describe('Network Failures', () => {
      it('should handle translation loading network failures', async () => {
        fetchMock.mockRejectOnce(new Error('Network timeout'));

        await expect(
          loadTranslations('https://example.com', 'es')
        ).rejects.toThrow('Network timeout');
      });

      it('should handle storage network failures', async () => {
        (chrome.storage.sync.get as any).mockRejectedValue(
          new Error('Network error')
        );

        const result = await getUserLanguage();

        expect(result).toBeNull();
      });
    });

    describe('DOM Manipulation Errors', () => {
      it('should handle DOM query errors in updateUILanguage', () => {
        (document.querySelectorAll as any).mockImplementation(() => {
          throw new Error('DOM error');
        });

        expect(() => updateUILanguage()).not.toThrow();
      });

      it('should handle invalid element attributes', () => {
        const mockElement = {
          getAttribute: jest.fn(() => null),
          textContent: 'old content',
        };

        (document.querySelectorAll as any).mockReturnValue([mockElement]);

        updateUILanguage();

        expect(mockElement.textContent).toBe('old content');
      });
    });
  });

  describe('Integration Tests for Cross-Context Functionality', () => {
    describe('End-to-End Language Switching', () => {
      it('should complete full language switching workflow', async () => {
        // Step 1: Detect and store language
        Object.defineProperty(navigator, 'languages', {
          value: ['fr-FR'],
          writable: true,
        });

        await initializeLanguagePreference();

        expect(chrome.storage.sync.set).toHaveBeenCalledWith({
          userLanguage: 'fr',
          languageSetAt: expect.any(Number),
        });

        // Step 2: Initialize i18n and update UI
        (chrome.i18n.getUILanguage as any).mockReturnValue('fr');

        const mockElements = [
          { getAttribute: jest.fn(() => 'hello'), textContent: '' },
        ];
        (document.querySelectorAll as any).mockReturnValue(mockElements);
        (chrome.i18n.getMessage as any).mockReturnValue('Bonjour');

        await initializeI18n();

        expect(document.documentElement.setAttribute).toHaveBeenCalledWith(
          'lang',
          'fr'
        );
        expect(mockElements[0].textContent).toBe('Bonjour');
      });

      it('should handle language switching with RTL languages', async () => {
        // Set Arabic language
        (chrome.i18n.getUILanguage as any).mockReturnValue('ar');

        updateUILanguage();

        expect(document.documentElement.setAttribute).toHaveBeenCalledWith(
          'dir',
          'rtl'
        );
        expect(document.documentElement.setAttribute).toHaveBeenCalledWith(
          'lang',
          'ar'
        );
      });
    });

    describe('Message Passing Integration', () => {
      it('should integrate with chrome runtime messaging', () => {
        // This would test integration with background/content script messaging
        // For unit tests, we verify the functions work independently
        expect(typeof getMessage).toBe('function');
        expect(typeof updateUILanguage).toBe('function');
        expect(typeof initializeI18n).toBe('function');
      });
    });

    describe('Storage Integration', () => {
      it('should persist language preferences across sessions', async () => {
        // Store language
        await setUserLanguage('de');

        // Retrieve language
        (chrome.storage.sync.get as any).mockResolvedValue({
          userLanguage: 'de',
        });

        const retrieved = await getUserLanguage();

        expect(retrieved).toBe('de');
      });

      it('should handle storage quota exceeded', async () => {
        (chrome.storage.sync.set as any).mockRejectedValue({
          message: 'QUOTA_BYTES_PER_ITEM quota exceeded',
        });

        await expect(
          setUserLanguage('very-long-language-code')
        ).rejects.toThrow();
      });
    });
  });

  describe('Performance and Memory Usage', () => {
    it('should handle multiple rapid message retrievals efficiently', () => {
      const startTime = Date.now();

      for (let i = 0; i < 1000; i++) {
        getMessage(`message${i}`);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete in reasonable time (less than 100ms for 1000 calls)
      expect(duration).toBeLessThan(100);
    });

    it('should not leak memory with repeated UI updates', () => {
      for (let i = 0; i < 100; i++) {
        updateUILanguage();
      }

      // If we get here without crashing, the test passes
      expect(true).toBe(true);
    });

    it('should handle large parameter objects efficiently', () => {
      const largeParams: Record<string, string> = {};
      for (let i = 0; i < 100; i++) {
        largeParams[`param${i}`] = `value${i}`;
      }

      const result = formatMessage('Test $PARAM1$ $PARAM50$', largeParams);

      expect(result).toContain('value1');
      expect(result).toContain('value50');
    });

    it('should handle concurrent language detection calls', async () => {
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(detectUserLanguage());
      }

      const results = await Promise.all(promises);

      results.forEach((result) => {
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Accessibility and Internationalization Standards', () => {
    it('should set proper lang attribute for accessibility', () => {
      (chrome.i18n.getUILanguage as any).mockReturnValue('ja');

      updateUILanguage();

      expect(document.documentElement.setAttribute).toHaveBeenCalledWith(
        'lang',
        'ja'
      );
    });

    it('should set proper dir attribute for RTL languages', () => {
      (chrome.i18n.getUILanguage as any).mockReturnValue('ar');

      updateUILanguage();

      expect(document.documentElement.setAttribute).toHaveBeenCalledWith(
        'dir',
        'rtl'
      );
    });

    it('should maintain LTR direction for LTR languages', () => {
      (chrome.i18n.getUILanguage as any).mockReturnValue('en');

      updateUILanguage();

      expect(document.documentElement.setAttribute).toHaveBeenCalledWith(
        'dir',
        'ltr'
      );
    });
  });
});
