import { tryProvider } from './api.js';

// Mock fetch globally
global.fetch = jest.fn();

describe('API Functions', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('tryProvider with chrome should call tryChromeBuiltinAI', async () => {
    // Mock Summarizer
    global.Summarizer = {
      create: jest.fn().mockResolvedValue({
        summarize: jest.fn().mockResolvedValue('Mocked summary'),
        destroy: jest.fn(),
      }),
    };

    const result = await tryProvider('chrome', 'test content');
    expect(result.success).toBe(true);
    expect(result.summary).toBe('Mocked summary');
  });

  test('tryProvider with openai should call tryOpenAI', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({
        choices: [{ message: { content: 'Mocked OpenAI summary' } }],
      }),
    });

    const result = await tryProvider('openai', 'test content', 'fake-key');
    expect(result.success).toBe(true);
    expect(result.summary).toBe('Mocked OpenAI summary');
  });

  test('tryProvider with gemini should call tryGeminiAPI', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({
        candidates: [{ content: { parts: [{ text: 'Mocked Gemini summary' }] } }],
      }),
    });

    const result = await tryProvider('gemini', 'test content', null, 'fake-key');
    expect(result.success).toBe(true);
    expect(result.summary).toBe('Mocked Gemini summary');
  });

  test('tryProvider with invalid provider should return error', async () => {
    const result = await tryProvider('invalid', 'test content');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Unknown provider');
  });
});