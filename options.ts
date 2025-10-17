interface ThemeColors {
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  shadowColor: string;
  closeButtonColor: string;
  copyButtonColor: string;
  titleColor: string;
}

interface Theme {
  name: string;
  colors: ThemeColors;
}

interface ModelConfig {
  provider: 'chrome' | 'openai' | 'gemini' | 'anthropic';
  modelId: string | null;
  name: string;
  cost: number;
}

interface Metrics {
  attempts: Array<{
    model: string;
    success: boolean;
    time: number;
    error?: string;
  }>;
  totalTime: number;
}

interface ValidationStatus {
  openai: { valid: boolean; checking: boolean; error?: string };
  gemini: { valid: boolean; checking: boolean; error?: string };
  anthropic: { valid: boolean; checking: boolean; error?: string };
}

// Browser compatibility functions imported from utils
import {
  checkChromeBuiltinSupport,
  formatDateTime,
  getDefaultDateTimeFormat,
} from './utils.js';

// Inline utility functions to avoid ES6 import issues
async function validateApiKey(
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
  } catch {
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

async function isModelAvailable(
  model: string,
  apiKeys: {
    openaiApiKey: string;
    geminiApiKey: string;
    anthropicApiKey: string;
  }
): Promise<boolean> {
  const config = optionsGetModelConfig(model);
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

const optionsThemes: Record<string, Theme> = {
  light: {
    name: 'Light',
    colors: {
      backgroundColor: '#ffffff',
      textColor: '#333333',
      borderColor: '#cccccc',
      shadowColor: 'rgba(0, 0, 0, 0.2)',
      closeButtonColor: '#666666',
      copyButtonColor: '#666666',
      titleColor: '#333333',
    },
  },
  dark: {
    name: 'Dark',
    colors: {
      backgroundColor: '#2d2d2d',
      textColor: '#f1f1f1',
      borderColor: '#555555',
      shadowColor: 'rgba(255, 255, 255, 0.2)',
      closeButtonColor: '#cccccc',
      copyButtonColor: '#cccccc',
      titleColor: '#f1f1f1',
    },
  },
  solarized: {
    name: 'Solarized',
    colors: {
      backgroundColor: '#fdf6e3',
      textColor: '#657b83',
      borderColor: '#93a1a1',
      shadowColor: 'rgba(0, 0, 0, 0.1)',
      closeButtonColor: '#93a1a1',
      copyButtonColor: '#93a1a1',
      titleColor: '#586e75',
    },
  },
  nord: {
    name: 'Nord',
    colors: {
      backgroundColor: '#2e3440',
      textColor: '#d8dee9',
      borderColor: '#4c566a',
      shadowColor: 'rgba(0, 0, 0, 0.2)',
      closeButtonColor: '#d8dee9',
      copyButtonColor: '#d8dee9',
      titleColor: '#eceff4',
    },
  },
  autumn: {
    name: 'Autumn',
    colors: {
      backgroundColor: '#f3e9d2',
      textColor: '#4a403a',
      borderColor: '#c8a083',
      shadowColor: 'rgba(0, 0, 0, 0.15)',
      closeButtonColor: '#8c6d5e',
      copyButtonColor: '#8c6d5e',
      titleColor: '#4a403a',
    },
  },
  synthwave: {
    name: 'Synthwave',
    colors: {
      backgroundColor: '#261b3e',
      textColor: '#f0d4f7',
      borderColor: '#ff6ac1',
      shadowColor: 'rgba(255, 106, 193, 0.3)',
      closeButtonColor: '#f0d4f7',
      copyButtonColor: '#f0d4f7',
      titleColor: '#f0d4f7',
    },
  },
  'serene landscapes': {
    name: 'Serene Landscapes',
    colors: {
      backgroundColor: '#e8f4f8',
      textColor: '#2c5f2d',
      borderColor: '#87ceeb',
      shadowColor: 'rgba(135, 206, 235, 0.3)',
      closeButtonColor: '#4682b4',
      copyButtonColor: '#4682b4',
      titleColor: '#2c5f2d',
    },
  },
  'mystical forests': {
    name: 'Mystical Forests',
    colors: {
      backgroundColor: '#1a4d3a',
      textColor: '#e6f3e6',
      borderColor: '#228b22',
      shadowColor: 'rgba(34, 139, 34, 0.4)',
      closeButtonColor: '#32cd32',
      copyButtonColor: '#32cd32',
      titleColor: '#90ee90',
    },
  },
  'vibrant sunsets': {
    name: 'Vibrant Sunsets',
    colors: {
      backgroundColor: '#ff6b35',
      textColor: '#ffffff',
      borderColor: '#ff8c42',
      shadowColor: 'rgba(255, 140, 66, 0.5)',
      closeButtonColor: '#ffffff',
      copyButtonColor: '#ffffff',
      titleColor: '#ffffff',
    },
  },
  'ethereal oceans': {
    name: 'Ethereal Oceans',
    colors: {
      backgroundColor: '#001122',
      textColor: '#b0e0e6',
      borderColor: '#00ced1',
      shadowColor: 'rgba(0, 206, 209, 0.4)',
      closeButtonColor: '#87ceeb',
      copyButtonColor: '#87ceeb',
      titleColor: '#e0ffff',
    },
  },
  'enchanted castles': {
    name: 'Enchanted Castles',
    colors: {
      backgroundColor: '#f5f5dc',
      textColor: '#8b4513',
      borderColor: '#daa520',
      shadowColor: 'rgba(218, 165, 32, 0.3)',
      closeButtonColor: '#cd853f',
      copyButtonColor: '#cd853f',
      titleColor: '#8b4513',
    },
  },
  'blooming gardens': {
    name: 'Blooming Gardens',
    colors: {
      backgroundColor: '#f0fff0',
      textColor: '#228b22',
      borderColor: '#32cd32',
      shadowColor: 'rgba(50, 205, 50, 0.2)',
      closeButtonColor: '#006400',
      copyButtonColor: '#006400',
      titleColor: '#228b22',
    },
  },
  'starry night skies': {
    name: 'Starry Night Skies',
    colors: {
      backgroundColor: '#191970',
      textColor: '#f0f8ff',
      borderColor: '#4169e1',
      shadowColor: 'rgba(65, 105, 225, 0.4)',
      closeButtonColor: '#add8e6',
      copyButtonColor: '#add8e6',
      titleColor: '#ffffff',
    },
  },
  'tranquil lakes': {
    name: 'Tranquil Lakes',
    colors: {
      backgroundColor: '#e0f6ff',
      textColor: '#2f4f4f',
      borderColor: '#4682b4',
      shadowColor: 'rgba(70, 130, 180, 0.2)',
      closeButtonColor: '#5f9ea0',
      copyButtonColor: '#5f9ea0',
      titleColor: '#2f4f4f',
    },
  },
  'cosmic nebulas': {
    name: 'Cosmic Nebulas',
    colors: {
      backgroundColor: '#2f1b3d',
      textColor: '#dda0dd',
      borderColor: '#9370db',
      shadowColor: 'rgba(147, 112, 219, 0.5)',
      closeButtonColor: '#ba55d3',
      copyButtonColor: '#ba55d3',
      titleColor: '#ff69b4',
    },
  },
  'golden autumns': {
    name: 'Golden Autumns',
    colors: {
      backgroundColor: '#fff8dc',
      textColor: '#8b4513',
      borderColor: '#daa520',
      shadowColor: 'rgba(218, 165, 32, 0.3)',
      closeButtonColor: '#cd853f',
      copyButtonColor: '#cd853f',
      titleColor: '#8b4513',
    },
  },
  'crystal waterfalls': {
    name: 'Crystal Waterfalls',
    colors: {
      backgroundColor: '#f0f8ff',
      textColor: '#4682b4',
      borderColor: '#87ceeb',
      shadowColor: 'rgba(135, 206, 235, 0.3)',
      closeButtonColor: '#00ced1',
      copyButtonColor: '#00ced1',
      titleColor: '#4682b4',
    },
  },
  'ancient ruins': {
    name: 'Ancient Ruins',
    colors: {
      backgroundColor: '#f5f5dc',
      textColor: '#696969',
      borderColor: '#a0522d',
      shadowColor: 'rgba(160, 82, 45, 0.3)',
      closeButtonColor: '#8b4513',
      copyButtonColor: '#8b4513',
      titleColor: '#696969',
    },
  },
  'floating islands': {
    name: 'Floating Islands',
    colors: {
      backgroundColor: '#e6e6fa',
      textColor: '#4b0082',
      borderColor: '#9370db',
      shadowColor: 'rgba(147, 112, 219, 0.3)',
      closeButtonColor: '#6a5acd',
      copyButtonColor: '#6a5acd',
      titleColor: '#4b0082',
    },
  },
  'radiant auroras': {
    name: 'Radiant Auroras',
    colors: {
      backgroundColor: '#0a0a23',
      textColor: '#00ff7f',
      borderColor: '#00ffff',
      shadowColor: 'rgba(0, 255, 127, 0.4)',
      closeButtonColor: '#32cd32',
      copyButtonColor: '#32cd32',
      titleColor: '#00ff7f',
    },
  },
  'lush jungles': {
    name: 'Lush Jungles',
    colors: {
      backgroundColor: '#228b22',
      textColor: '#f0fff0',
      borderColor: '#32cd32',
      shadowColor: 'rgba(50, 205, 50, 0.4)',
      closeButtonColor: '#90ee90',
      copyButtonColor: '#90ee90',
      titleColor: '#f0fff0',
    },
  },
  'snowy mountains': {
    name: 'Snowy Mountains',
    colors: {
      backgroundColor: '#ffffff',
      textColor: '#4682b4',
      borderColor: '#b0c4de',
      shadowColor: 'rgba(176, 196, 222, 0.3)',
      closeButtonColor: '#778899',
      copyButtonColor: '#778899',
      titleColor: '#4682b4',
    },
  },
  'dreamy cloudscapes': {
    name: 'Dreamy Cloudscapes',
    colors: {
      backgroundColor: '#f0f8ff',
      textColor: '#708090',
      borderColor: '#b0c4de',
      shadowColor: 'rgba(176, 196, 222, 0.2)',
      closeButtonColor: '#87ceeb',
      copyButtonColor: '#87ceeb',
      titleColor: '#708090',
    },
  },
};

function optionsGetModelConfig(model: string): ModelConfig | undefined {
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
    'claude-4-5-sonnet': {
      provider: 'anthropic',
      modelId: 'claude-4-5-sonnet',
      name: 'Sonnet 4.5',
      cost: 0.003,
    },
    'claude-4-5-haiku': {
      provider: 'anthropic',
      modelId: 'claude-4-5-haiku',
      name: 'Haiku 4.5',
      cost: 0.001,
    },
  };
  return models[model];
}

document.addEventListener('DOMContentLoaded', function () {
  // Theme toggle functionality
  const themeToggle = document.getElementById(
    'themeToggle'
  ) as HTMLButtonElement;
  const body = document.body;

  // Initialize theme from user preference, storage, or default to light
  function initializeTheme() {
    // First check for saved theme in localStorage
    let theme = localStorage.getItem('theme');

    // If no saved theme, check system preference
    if (!theme) {
      const prefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches;
      theme = prefersDark ? 'dark' : 'light';
    }

    body.setAttribute('data-theme', theme);
    updateThemeIcon(theme);
  }

  function updateThemeIcon(theme: string) {
    const icon = themeToggle.querySelector('i');
    if (icon) {
      icon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    }
  }

  function toggleTheme() {
    const currentTheme = body.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);

    // Add a subtle animation effect
    body.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    setTimeout(() => {
      body.style.transition = '';
    }, 300);
  }

  themeToggle.addEventListener('click', toggleTheme);
  initializeTheme();

  // Navigation elements
  const navLinks = document.querySelectorAll('.nav-link');
  const pages = document.querySelectorAll('.page');
  const sidebar = document.getElementById('sidebar') as HTMLElement;
  const toggleSidebarBtn = document.getElementById(
    'toggleSidebar'
  ) as HTMLButtonElement;

  // Settings elements
  const selectedModelSelect = document.getElementById(
    'selectedModel'
  ) as HTMLSelectElement;
  const languageSelect = document.getElementById(
    'language'
  ) as HTMLSelectElement;
  const temperatureInput = document.getElementById(
    'temperature'
  ) as HTMLInputElement;
  const temperatureValue = document.getElementById(
    'temperature-value'
  ) as HTMLSpanElement;
  const maxTokensInput = document.getElementById(
    'maxTokens'
  ) as HTMLInputElement;
  const summaryLengthSelect = document.getElementById(
    'summaryLength'
  ) as HTMLSelectElement;
  const enableFallbackCheckbox = document.getElementById(
    'enableFallback'
  ) as HTMLInputElement;
  const openaiApiKeyInput = document.getElementById(
    'openaiApiKey'
  ) as HTMLInputElement;
  const geminiApiKeyInput = document.getElementById(
    'geminiApiKey'
  ) as HTMLInputElement;
  const anthropicApiKeyInput = document.getElementById(
    'anthropicApiKey'
  ) as HTMLInputElement;
  const statusDiv = document.getElementById('status') as HTMLDivElement;

  // Theme elements
  const themeSelect = document.getElementById('theme') as HTMLSelectElement;
  const fontFamilySelect = document.getElementById(
    'fontFamily'
  ) as HTMLSelectElement;
  const fontSizeInput = document.getElementById('fontSize') as HTMLInputElement;
  const fontStyleSelect = document.getElementById(
    'fontStyle'
  ) as HTMLSelectElement;
  const themeStatusDiv = document.getElementById(
    'themeStatus'
  ) as HTMLDivElement;
  const themePreview = document.getElementById('themePreview') as HTMLElement;
  const previewText = document.getElementById('previewText') as HTMLElement;

  // Performance elements
  const refreshMetricsButton = document.getElementById(
    'refreshMetrics'
  ) as HTMLButtonElement;
  const metricsContainer = document.getElementById(
    'metricsContainer'
  ) as HTMLDivElement;

  // Extension settings elements
  const enableRightClickContextMenuCheckbox = document.getElementById(
    'enableRightClickContextMenu'
  ) as HTMLInputElement;
  const dateTimeFormatSelect = document.getElementById(
    'dateTimeFormat'
  ) as HTMLSelectElement;

  // History elements
  const searchInput = document.getElementById(
    'searchInput'
  ) as HTMLInputElement;
  const filterModelSelect = document.getElementById(
    'filterModel'
  ) as HTMLSelectElement;
  const exportFormatSelect = document.getElementById(
    'exportFormat'
  ) as HTMLSelectElement;
  const exportHistoryButton = document.getElementById(
    'exportHistory'
  ) as HTMLButtonElement;
  const refreshHistoryButton = document.getElementById(
    'refreshHistory'
  ) as HTMLButtonElement;
  const clearHistoryButton = document.getElementById(
    'clearHistory'
  ) as HTMLButtonElement;
  const historyContainer = document.getElementById(
    'historyContainer'
  ) as HTMLDivElement;

  // Navigation functionality
  function switchPage(pageId: string) {
    pages.forEach((page) => page.classList.remove('active'));
    navLinks.forEach((link) => link.classList.remove('active'));

    const targetPage = document.getElementById(pageId + '-page');
    const targetLink = document.querySelector(`[data-page="${pageId}"]`);

    if (targetPage) targetPage.classList.add('active');
    if (targetLink) targetLink.classList.add('active');
  }

  navLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = link.getAttribute('data-page');
      if (page) switchPage(page);
    });
  });

  // Mobile sidebar toggle
  toggleSidebarBtn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });

  // Enhanced navigation with smooth transitions
  function enhancedSwitchPage(pageId: string) {
    pages.forEach((page) => {
      page.classList.remove('active');
      (page as HTMLElement).style.transform = 'translateY(30px)';
      (page as HTMLElement).style.opacity = '0';
    });
    navLinks.forEach((link) => link.classList.remove('active'));

    const targetPage = document.getElementById(pageId + '-page');
    const targetLink = document.querySelector(`[data-page="${pageId}"]`);

    if (targetPage) {
      targetPage.classList.add('active');
      // Trigger animation
      setTimeout(() => {
        (targetPage as HTMLElement).style.transform = 'translateY(0)';
        (targetPage as HTMLElement).style.opacity = '1';
      }, 50);
    }
    if (targetLink) targetLink.classList.add('active');
  }

  // Override the basic switchPage with enhanced version
  (window as any).switchPage = enhancedSwitchPage;

  // Temperature slider with enhanced interactions
  temperatureInput.addEventListener('input', () => {
    temperatureValue.textContent = temperatureInput.value;

    // Add visual feedback
    const percentage =
      ((parseFloat(temperatureInput.value) - 0) / (2 - 0)) * 100;
    temperatureInput.style.setProperty('--slider-progress', `${percentage}%`);

    // Add glow effect based on value
    if (parseFloat(temperatureInput.value) > 1.5) {
      temperatureInput.style.boxShadow = '0 0 20px rgba(244, 208, 63, 0.5)';
    } else if (parseFloat(temperatureInput.value) < 0.5) {
      temperatureInput.style.boxShadow = '0 0 20px rgba(46, 204, 113, 0.5)';
    } else {
      temperatureInput.style.boxShadow = '';
    }
  });

  // Add ripple effect to buttons
  function addRippleEffect(button: HTMLElement) {
    button.addEventListener('click', function (e: MouseEvent) {
      const ripple = document.createElement('span');
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      ripple.style.cssText = `
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transform: scale(0);
        animation: ripple 0.6s linear;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        pointer-events: none;
      `;

      button.style.position = 'relative';
      button.style.overflow = 'hidden';
      button.appendChild(ripple);

      setTimeout(() => {
        ripple.remove();
      }, 600);
    });
  }

  // Add ripple effect to all buttons
  document.querySelectorAll('.btn').forEach((button) => {
    addRippleEffect(button as HTMLElement);
  });

  // Add CSS for ripple animation
  const rippleStyle = document.createElement('style');
  rippleStyle.textContent = `
    @keyframes ripple {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(rippleStyle);

  // Load saved settings
  chrome.storage.sync.get(
    [
      'selectedModel',
      'language',
      'temperature',
      'maxTokens',
      'summaryLength',
      'enableFallback',
      'openaiApiKey',
      'geminiApiKey',
      'anthropicApiKey',
      'dateTimeFormat',
      'enableRightClickContextMenu',
    ],
    function (result) {
      try {
        if (result.selectedModel) {
          selectedModelSelect.value = result.selectedModel;
        } else {
          // Set default to chrome-builtin if no model selected
          selectedModelSelect.value = 'chrome-builtin';
        }
        if (result.language) {
          languageSelect.value = result.language;
        } else {
          languageSelect.value = 'en';
        }
        if (result.temperature !== undefined) {
          temperatureInput.value = result.temperature.toString();
          temperatureValue.textContent = result.temperature.toString();
        } else {
          temperatureInput.value = '0.7';
          temperatureValue.textContent = '0.7';
        }
        if (result.maxTokens !== undefined) {
          maxTokensInput.value = result.maxTokens.toString();
        } else {
          maxTokensInput.value = '1000';
        }
        if (result.summaryLength) {
          summaryLengthSelect.value = result.summaryLength;
        } else {
          summaryLengthSelect.value = 'medium';
        }
        if (result.enableFallback !== undefined) {
          enableFallbackCheckbox.checked = result.enableFallback;
        } else {
          enableFallbackCheckbox.checked = true; // Default to enabled
        }
        if (result.openaiApiKey) {
          openaiApiKeyInput.value = result.openaiApiKey;
        }
        if (result.geminiApiKey) {
          geminiApiKeyInput.value = result.geminiApiKey;
        }
        if (result.anthropicApiKey) {
          anthropicApiKeyInput.value = result.anthropicApiKey;
        }
        if (result.dateTimeFormat) {
          dateTimeFormatSelect.value = result.dateTimeFormat;
        } else {
          dateTimeFormatSelect.value = getDefaultDateTimeFormat();
        }
        if (result.enableRightClickContextMenu !== undefined) {
          if (enableRightClickContextMenuCheckbox) {
            enableRightClickContextMenuCheckbox.checked =
              result.enableRightClickContextMenu;
          }
        } else {
          if (enableRightClickContextMenuCheckbox) {
            enableRightClickContextMenuCheckbox.checked = true; // Default to enabled
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        // Set defaults in case of error
        selectedModelSelect.value = 'chrome-builtin';
        languageSelect.value = 'en';
        temperatureInput.value = '0.7';
        temperatureValue.textContent = '0.7';
        maxTokensInput.value = '1000';
        summaryLengthSelect.value = 'medium';
        enableFallbackCheckbox.checked = true;
        dateTimeFormatSelect.value = getDefaultDateTimeFormat();
        if (enableRightClickContextMenuCheckbox) {
          enableRightClickContextMenuCheckbox.checked = true;
        }
      }
    }
  );

  // Save settings
  const settingsForm = document.getElementById(
    'settings-form'
  ) as HTMLFormElement;
  settingsForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const selectedModel = selectedModelSelect.value;
    const temperature = parseFloat(temperatureInput.value);
    const maxTokens = parseInt(maxTokensInput.value);
    const summaryLength = summaryLengthSelect.value;
    const enableFallback = enableFallbackCheckbox.checked;
    const openaiApiKey = openaiApiKeyInput.value.trim();
    const geminiApiKey = geminiApiKeyInput.value.trim();
    const anthropicApiKey = anthropicApiKeyInput.value.trim();

    // Check if selected model is available
    const apiKeys = {
      openaiApiKey,
      geminiApiKey,
      anthropicApiKey,
    };

    const modelAvailable = await isModelAvailable(selectedModel, apiKeys);
    if (!modelAvailable) {
      if (selectedModel === 'chrome-builtin') {
        // Special handling for chrome-builtin: revert to default and show error
        const defaultModel = 'gpt-3.5-turbo';
        selectedModelSelect.value = defaultModel;
        statusDiv.textContent =
          'Chrome Built-in AI is not supported on this browser. Reverted to GPT-3.5 Turbo. Please configure API keys for other models.';
        statusDiv.className = 'status error';
        // Save with default model
        chrome.storage.sync.set(
          {
            selectedModel: defaultModel,
            temperature: temperature,
            maxTokens: maxTokens,
            summaryLength: summaryLength,
            enableFallback: enableFallback,
            openaiApiKey: openaiApiKey,
            geminiApiKey: geminiApiKey,
            anthropicApiKey: anthropicApiKey,
            dateTimeFormat: dateTimeFormatSelect.value,
          },
          function () {
            setTimeout(() => {
              statusDiv.textContent = '';
              statusDiv.className = '';
            }, 5000);
          }
        );
        return;
      } else {
        statusDiv.textContent =
          'Cannot save: Selected model requires a valid API key. Please configure the appropriate API key or choose a different model.';
        statusDiv.className = 'status error';
        return;
      }
    }

    // Request permissions for API providers with keys
    let permissionsGranted = true;
    const permissionsToRequest: string[][] = [];
    if (openaiApiKey) {
      permissionsToRequest.push(['https://api.openai.com/*']);
    }
    if (geminiApiKey) {
      permissionsToRequest.push([
        'https://generativelanguage.googleapis.com/*',
      ]);
    }
    if (anthropicApiKey) {
      permissionsToRequest.push(['https://api.anthropic.com/*']);
    }

    for (const origins of permissionsToRequest) {
      const hasPermission = await chrome.permissions.contains({ origins });
      if (!hasPermission) {
        const granted = await chrome.permissions.request({ origins });
        if (!granted) {
          permissionsGranted = false;
          break;
        }
      }
    }

    if (!permissionsGranted) {
      statusDiv.textContent =
        'Permission denied for one or more API providers. Please grant permissions to save settings.';
      statusDiv.className = 'status error';
      return;
    }

    chrome.storage.sync.set(
      {
        selectedModel: selectedModel,
        language: languageSelect.value,
        temperature: temperature,
        maxTokens: maxTokens,
        summaryLength: summaryLength,
        enableRightClickContextMenu:
          enableRightClickContextMenuCheckbox?.checked ?? true,
        enableFallback: enableFallback,
        openaiApiKey: openaiApiKey,
        geminiApiKey: geminiApiKey,
        anthropicApiKey: anthropicApiKey,
        dateTimeFormat: dateTimeFormatSelect.value,
      },
      function () {
        if (chrome.runtime.lastError) {
          console.error('Error saving settings:', chrome.runtime.lastError);
          statusDiv.textContent = 'Error saving settings. Please try again.';
          statusDiv.className = 'status error';
        } else {
          statusDiv.textContent = 'Settings saved successfully!';
          statusDiv.className = 'status success';
        }

        // Clear status after 3 seconds
        setTimeout(() => {
          statusDiv.textContent = '';
          statusDiv.className = '';
        }, 3000);
      }
    );
  });

  // Load and display metrics
  function loadMetrics() {
    chrome.runtime.sendMessage({ action: 'get_model_metrics' });
  }

  async function displayMetrics(
    metrics: Record<
      string,
      {
        totalRequests: number;
        successfulRequests: number;
        totalTime: number;
        avgTime: number;
        lastUsed: string;
      }
    >
  ) {
    if (!metrics || Object.keys(metrics).length === 0) {
      metricsContainer.innerHTML =
        '<p style="color: rgba(255, 255, 255, 0.7)">No performance data available yet. Use the extension to generate summaries and metrics will appear here.</p>';
      return;
    }

    let html = '';
    const currentFormat = await getCurrentDateTimeFormat();

    Object.entries(metrics).forEach(([modelKey, stats]: [string, any]) => {
      const modelConfig = optionsGetModelConfig(modelKey);
      const modelName = modelConfig ? modelConfig.name : modelKey;
      const successRate =
        stats.totalRequests > 0
          ? (stats.successfulRequests / stats.totalRequests) * 100
          : 0;
      const avgTime = stats.avgTime || 0;
      const lastUsed = stats.lastUsed
        ? formatDateTime(new Date(stats.lastUsed), currentFormat)
        : 'Never';

      html += `
        <div class="metric-card">
          <h3 class="metric-title">${modelName}</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
            <div>
              <div style="color: #00d4ff; font-weight: 600;">Total Requests</div>
              <div style="font-size: 1.5rem; color: #39ff14;">${stats.totalRequests}</div>
            </div>
            <div>
              <div style="color: #00d4ff; font-weight: 600;">Success Rate</div>
              <div style="font-size: 1.5rem; color: #39ff14;">${successRate.toFixed(1)}%</div>
            </div>
            <div>
              <div style="color: #00d4ff; font-weight: 600;">Avg Response Time</div>
              <div style="font-size: 1.5rem; color: #39ff14;">${avgTime.toFixed(2)}s</div>
            </div>
            <div>
              <div style="color: #00d4ff; font-weight: 600;">Last Used</div>
              <div style="font-size: 1rem; color: rgba(255,255,255,0.8);">${lastUsed}</div>
            </div>
          </div>
        </div>
      `;
    });

    metricsContainer.innerHTML = html;
  }

  // Handle metrics response
  chrome.runtime.onMessage.addListener(async (request: any) => {
    if (request.action === 'model_metrics_response') {
      await displayMetrics(request.metrics);
    }
  });

  // Refresh metrics button
  refreshMetricsButton.addEventListener('click', loadMetrics);

  // Load and display history
  function loadHistory() {
    chrome.storage.local.get('summaryHistory', (result) => {
      displayHistory(result.summaryHistory || []);
    });
  }

  let allHistory: Array<{
    id: string;
    timestamp: string;
    url: string;
    title: string;
    summary: string;
    model: string;
    time: string;
    metrics: Metrics;
  }> = [];

  function displayHistory(
    history: Array<{
      id: string;
      timestamp: string;
      url: string;
      title: string;
      summary: string;
      model: string;
      time: string;
      metrics: Metrics;
    }>
  ) {
    allHistory = history || [];

    // Populate filter dropdown
    const models = new Set(allHistory.map((item) => item.model));
    filterModelSelect.innerHTML = '<option value="">All Models</option>';
    models.forEach((model) => {
      const modelConfig = optionsGetModelConfig(model);
      const modelName = modelConfig ? modelConfig.name : model;
      const option = document.createElement('option');
      option.value = model;
      option.textContent = modelName;
      filterModelSelect.appendChild(option);
    });

    // Update export button state
    updateExportButtonState();

    filterAndDisplayHistory();
  }

  function updateExportButtonState() {
    const hasHistory = allHistory.length > 0;
    const hasFormat = exportFormatSelect.value !== '';
    exportHistoryButton.disabled = !hasHistory || !hasFormat;
  }

  async function filterAndDisplayHistory() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedModel = filterModelSelect.value;

    const filteredHistory = allHistory.filter((item) => {
      const matchesSearch =
        (item.title || '').toLowerCase().includes(searchTerm) ||
        (item.summary || '').toLowerCase().includes(searchTerm) ||
        (item.url || '').toLowerCase().includes(searchTerm);

      const matchesModel = !selectedModel || item.model === selectedModel;

      return matchesSearch && matchesModel;
    });

    if (allHistory.length === 0) {
      historyContainer.innerHTML =
        '<p style="color: rgba(255, 255, 255, 0.7)">No summary history available yet.</p>';
      exportHistoryButton.disabled = true;
      return;
    }

    if (filteredHistory.length === 0) {
      historyContainer.innerHTML =
        '<p style="color: rgba(255, 255, 255, 0.7)">No matching history items found.</p>';
      exportHistoryButton.disabled = true;
      return;
    }

    let html = '';
    const currentFormat = await getCurrentDateTimeFormat();
    filteredHistory.forEach((item) => {
      const date = formatDateTime(new Date(item.timestamp), currentFormat);
      const modelConfig = optionsGetModelConfig(item.model);
      const modelName = modelConfig ? modelConfig.name : item.model;

      html += `
        <div class="history-item">
          <div class="history-header">
            <div class="history-title">${item.title || 'Untitled'}</div>
            <div class="history-meta">
              ${modelName} • ${item.time}s • ${date}
            </div>
          </div>
          <div class="history-url">
            <a href="${item.url}" target="_blank">${item.url}</a>
          </div>
          <div class="history-summary">${item.summary}</div>
          <div class="history-actions">
            <button class="btn btn-secondary copy-btn" data-summary="${item.summary.replace(/'/g, "\\'")}">Copy</button>
            <button class="btn btn-secondary share-btn" data-title="${(item.title || 'Untitled').replace(/'/g, "\\'")}" data-summary="${item.summary.replace(/'/g, "\\'")}">Share</button>
          </div>
        </div>
      `;
    });

    historyContainer.innerHTML = html;

    // Enable export button if there are items to export
    exportHistoryButton.disabled = false;

    // Add event listeners to the dynamically created buttons
    const copyButtons = historyContainer.querySelectorAll('.copy-btn');
    const shareButtons = historyContainer.querySelectorAll('.share-btn');

    copyButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const summary = (button as HTMLElement).dataset.summary || '';
        (window as any).copyToClipboard(summary, 'historyStatus');
      });
    });

    shareButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const title = (button as HTMLElement).dataset.title || '';
        const summary = (button as HTMLElement).dataset.summary || '';
        (window as any).shareSummary(title, summary, 'historyStatus');
      });
    });
  }

  // Export functions
  async function exportHistory(format: string) {
    if (allHistory.length === 0) {
      const historyStatusDiv = document.getElementById(
        'historyStatus'
      ) as HTMLDivElement;
      historyStatusDiv.textContent = 'No history to export.';
      historyStatusDiv.className = 'status error';
      setTimeout(() => {
        historyStatusDiv.textContent = '';
        historyStatusDiv.className = '';
      }, 3000);
      return;
    }

    const filteredHistory = getFilteredHistory();

    if (filteredHistory.length === 0) {
      const historyStatusDiv = document.getElementById(
        'historyStatus'
      ) as HTMLDivElement;
      historyStatusDiv.textContent = 'No matching history items to export.';
      historyStatusDiv.className = 'status error';
      setTimeout(() => {
        historyStatusDiv.textContent = '';
        historyStatusDiv.className = '';
      }, 3000);
      return;
    }

    // Show progress
    const originalText = exportHistoryButton.innerHTML;
    exportHistoryButton.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Exporting...';
    exportHistoryButton.disabled = true;

    try {
      let content: string;
      let mimeType: string;
      let filename: string;

      switch (format) {
        case 'csv':
          content = await exportToCSV(filteredHistory);
          mimeType = 'text/csv';
          filename = 'summary-history.csv';
          break;
        case 'json':
          content = exportToJSON(filteredHistory);
          mimeType = 'application/json';
          filename = 'summary-history.json';
          break;
        case 'html':
          content = await exportToHTML(filteredHistory);
          mimeType = 'text/html';
          filename = 'summary-history.html';
          break;
        default:
          throw new Error('Invalid export format');
      }

      // Create download
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const historyStatusDiv = document.getElementById(
        'historyStatus'
      ) as HTMLDivElement;
      historyStatusDiv.textContent = `History exported successfully as ${format.toUpperCase()}.`;
      historyStatusDiv.className = 'status success';
      setTimeout(() => {
        historyStatusDiv.textContent = '';
        historyStatusDiv.className = '';
      }, 3000);
    } catch {
      const historyStatusDiv = document.getElementById(
        'historyStatus'
      ) as HTMLDivElement;
      historyStatusDiv.textContent = 'Export failed. Please try again.';
      historyStatusDiv.className = 'status error';
      setTimeout(() => {
        historyStatusDiv.textContent = '';
        historyStatusDiv.className = '';
      }, 3000);
    } finally {
      // Restore button
      exportHistoryButton.innerHTML = originalText;
      exportHistoryButton.disabled = false;
    }
  }

  function getFilteredHistory() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedModel = filterModelSelect.value;

    return allHistory.filter((item) => {
      const matchesSearch =
        (item.title || '').toLowerCase().includes(searchTerm) ||
        (item.summary || '').toLowerCase().includes(searchTerm) ||
        (item.url || '').toLowerCase().includes(searchTerm);

      const matchesModel = !selectedModel || item.model === selectedModel;

      return matchesSearch && matchesModel;
    });
  }

  async function exportToCSV(history: any[]): Promise<string> {
    const headers = [
      'Date',
      'Title',
      'URL',
      'Summary',
      'Model',
      'Time',
      'Total Time',
    ];
    const currentFormat = await getCurrentDateTimeFormat();
    const rows = history.map((item) => [
      formatDateTime(new Date(item.timestamp), currentFormat),
      item.title || 'Untitled',
      item.url,
      item.summary.replace(/"/g, '""'), // Escape quotes
      item.model,
      item.time,
      item.metrics?.totalTime || 0,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((field) => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }

  function exportToJSON(history: any[]): string {
    return JSON.stringify(history, null, 2);
  }

  async function exportToHTML(history: any[]): Promise<string> {
    const currentFormat = await getCurrentDateTimeFormat();
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
   <meta charset="UTF-8">
   <meta name="viewport" content="width=device-width, initial-scale=1.0">
   <title>Summary History</title>
   <style>
       body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
       .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
       h1 { color: #333; text-align: center; margin-bottom: 30px; }
       table { width: 100%; border-collapse: collapse; margin-top: 20px; }
       th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
       th { background-color: #f8f9fa; font-weight: bold; }
       tr:hover { background-color: #f5f5f5; }
       .summary { max-width: 400px; word-wrap: break-word; }
       .url { max-width: 300px; word-wrap: break-word; }
       .date { white-space: nowrap; }
   </style>
</head>
<body>
   <div class="container">
       <h1>Summary History</h1>
       <table>
           <thead>
               <tr>
                   <th>Date</th>
                   <th>Title</th>
                   <th>URL</th>
                   <th>Summary</th>
                   <th>Model</th>
                   <th>Time (s)</th>
                   <th>Total Time (s)</th>
               </tr>
           </thead>
           <tbody>
               ${history
                 .map(
                   (item) => `
                   <tr>
                       <td class="date">${formatDateTime(new Date(item.timestamp), currentFormat)}</td>
                       <td>${item.title || 'Untitled'}</td>
                       <td class="url"><a href="${item.url}" target="_blank">${item.url}</a></td>
                       <td class="summary">${item.summary}</td>
                       <td>${item.model}</td>
                       <td>${item.time}</td>
                       <td>${item.metrics?.totalTime || 0}</td>
                   </tr>
               `
                 )
                 .join('')}
           </tbody>
       </table>
   </div>
</body>
</html>`;
    return html;
  }

  // Add search and filter event listeners
  searchInput.addEventListener('input', () => filterAndDisplayHistory());
  filterModelSelect.addEventListener('change', () => filterAndDisplayHistory());

  // Add export event listeners
  exportFormatSelect.addEventListener('change', updateExportButtonState);
  exportHistoryButton.addEventListener('click', () => {
    const format = exportFormatSelect.value;
    if (format) {
      exportHistory(format);
    }
  });

  function clearHistory() {
    if (
      confirm(
        'Are you sure you want to clear all summary history? This action cannot be undone.'
      )
    ) {
      chrome.storage.local.set({ summaryHistory: [] }, () => {
        displayHistory([]);
        const historyStatusDiv = document.getElementById(
          'historyStatus'
        ) as HTMLDivElement;
        historyStatusDiv.textContent = 'History cleared successfully!';
        historyStatusDiv.className = 'status success';
        setTimeout(() => {
          historyStatusDiv.textContent = '';
          historyStatusDiv.className = '';
        }, 3000);
      });
    }
  }

  // Global functions for button onclick handlers
  (window as any).copyToClipboard = function (
    text: string,
    statusDivId: string
  ) {
    navigator.clipboard.writeText(text).then(() => {
      const statusDiv = document.getElementById(statusDivId) as HTMLDivElement;
      statusDiv.textContent = 'Summary copied to clipboard!';
      statusDiv.className = 'status success';
      setTimeout(() => {
        statusDiv.textContent = '';
        statusDiv.className = '';
      }, 2000);
    });
  };

  (window as any).shareSummary = function (
    title: string,
    text: string,
    statusDivId: string
  ) {
    if (navigator.share) {
      navigator
        .share({
          title: title,
          text: text,
        })
        .catch(console.error);
    } else {
      (window as any).copyToClipboard(text, statusDivId);
    }
  };

  // Event listeners for history buttons
  refreshHistoryButton.addEventListener('click', loadHistory);
  clearHistoryButton.addEventListener('click', clearHistory);

  // Add event listener for date/time format changes to refresh displays
  dateTimeFormatSelect.addEventListener('change', () => {
    // Save the new format setting
    const newFormat = dateTimeFormatSelect.value;
    chrome.storage.sync.set({ dateTimeFormat: newFormat }, () => {
      // Refresh all date displays
      refreshDateDisplays();
    });
  });

  // Load metrics on page load
  loadMetrics();

  // Load history on page load
  loadHistory();

  // Real-time API key validation
  const validationStatus: ValidationStatus = {
    openai: { valid: false, checking: false },
    gemini: { valid: false, checking: false },
    anthropic: { valid: false, checking: false },
  };

  function updateValidationIndicator(
    provider: keyof ValidationStatus,
    input: HTMLInputElement
  ) {
    const status = validationStatus[provider];
    const container = input.parentElement!;

    // Remove existing indicators
    const existingIndicator = container.querySelector('.validation-indicator');
    if (existingIndicator) {
      existingIndicator.remove();
    }

    // Add new indicator
    const indicator = document.createElement('span');
    indicator.className = 'validation-indicator';

    if (status.checking) {
      indicator.textContent = '⏳';
      indicator.title = 'Validating...';
      indicator.style.color = '#ffa500';
    } else if (status.valid) {
      indicator.textContent = '✓';
      indicator.title = 'Valid API key';
      indicator.style.color = '#28a745';
    } else if (input.value.trim() && status.error) {
      indicator.textContent = '✗';
      indicator.title = status.error;
      indicator.style.color = '#dc3545';
    }

    if (indicator.textContent) {
      indicator.style.marginLeft = '8px';
      container.appendChild(indicator);
    }
  }

  async function validateApiKeyInput(
    provider: keyof ValidationStatus,
    input: HTMLInputElement
  ) {
    const apiKey = input.value.trim();

    if (!apiKey) {
      validationStatus[provider] = { valid: false, checking: false };
      updateValidationIndicator(provider, input);
      return;
    }

    validationStatus[provider].checking = true;
    updateValidationIndicator(provider, input);

    try {
      const result = await validateApiKey(provider, apiKey);
      validationStatus[provider] = {
        valid: result.valid,
        checking: false,
        error: result.error,
      };
    } catch {
      validationStatus[provider] = {
        valid: false,
        checking: false,
        error: 'Validation failed',
      };
    }

    updateValidationIndicator(provider, input);
  }

  // Add validation event listeners
  openaiApiKeyInput.addEventListener('blur', () =>
    validateApiKeyInput('openai', openaiApiKeyInput)
  );
  geminiApiKeyInput.addEventListener('blur', () =>
    validateApiKeyInput('gemini', geminiApiKeyInput)
  );
  anthropicApiKeyInput.addEventListener('blur', () =>
    validateApiKeyInput('anthropic', anthropicApiKeyInput)
  );

  // Also validate on input for better UX (debounced)
  const validationTimeouts: { [key: string]: number } = {};

  function debouncedValidate(
    provider: keyof ValidationStatus,
    input: HTMLInputElement
  ) {
    clearTimeout(validationTimeouts[provider]);
    validationTimeouts[provider] = window.setTimeout(() => {
      validateApiKeyInput(provider, input);
    }, 1000); // 1 second delay
  }

  openaiApiKeyInput.addEventListener('input', () =>
    debouncedValidate('openai', openaiApiKeyInput)
  );
  geminiApiKeyInput.addEventListener('input', () =>
    debouncedValidate('gemini', geminiApiKeyInput)
  );
  anthropicApiKeyInput.addEventListener('input', () =>
    debouncedValidate('anthropic', anthropicApiKeyInput)
  );

  // Theme functionality
  function updatePreview() {
    const selectedTheme = themeSelect.value;
    const fontFamily = fontFamilySelect.value;
    const fontSize = parseInt(fontSizeInput.value);
    const fontStyle = fontStyleSelect.value;

    const theme = optionsThemes[selectedTheme];
    if (theme) {
      themePreview.style.backgroundColor = theme.colors.backgroundColor;
      themePreview.style.color = theme.colors.textColor;
      themePreview.style.borderColor = theme.colors.borderColor;
      themePreview.style.boxShadow = `0 0 10px ${theme.colors.shadowColor}`;

      previewText.style.color = theme.colors.textColor;
    }

    previewText.style.fontFamily = fontFamily;
    previewText.style.fontSize = `${fontSize}px`;
    previewText.style.fontWeight = fontStyle === 'bold' ? 'bold' : 'normal';
    previewText.style.fontStyle = fontStyle === 'italic' ? 'italic' : 'normal';
  }

  // Populate theme selector with unique options
  themeSelect.innerHTML = ''; // Clear existing options to prevent duplicates
  const addedValues = new Set<string>();

  for (const themeKey in optionsThemes) {
    if (!addedValues.has(themeKey)) {
      const option = document.createElement('option');
      option.value = themeKey;
      option.textContent = optionsThemes[themeKey].name;
      themeSelect.appendChild(option);
      addedValues.add(themeKey);
    }
  }

  // Populate font family selector
  const fontOptions = [
    'Arial',
    'Times New Roman',
    'Courier New',
    'Georgia',
    'Verdana',
    'Helvetica',
    'Trebuchet MS',
    'Comic Sans MS',
    'Roboto',
    'Lato',
    'Montserrat',
    'Open Sans',
    'OpenDyslexic',
  ];
  fontFamilySelect.innerHTML = '';
  fontOptions.forEach((font) => {
    const option = document.createElement('option');
    option.value = font;
    option.textContent = font;
    fontFamilySelect.appendChild(option);
  });

  // Load saved theme and font settings
  chrome.storage.sync.get(
    ['theme', 'fontFamily', 'fontSize', 'fontStyle'],
    function (result) {
      if (result.theme) {
        themeSelect.value = result.theme;
      } else {
        themeSelect.value = 'nord'; // Default theme
      }
      if (result.fontFamily) {
        fontFamilySelect.value = result.fontFamily;
      } else {
        fontFamilySelect.value = 'Arial'; // Default font
      }
      if (result.fontSize !== undefined) {
        fontSizeInput.value = result.fontSize.toString();
      } else {
        fontSizeInput.value = '14'; // Default size
      }
      if (result.fontStyle) {
        fontStyleSelect.value = result.fontStyle;
      } else {
        fontStyleSelect.value = 'normal'; // Default style
      }
      updatePreview();
    }
  );

  // Real-time preview updates
  themeSelect.addEventListener('change', updatePreview);
  fontFamilySelect.addEventListener('change', updatePreview);
  fontSizeInput.addEventListener('input', updatePreview);
  fontStyleSelect.addEventListener('change', updatePreview);

  // Save theme settings
  const themeForm = document.getElementById('theme-form') as HTMLFormElement;
  themeForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const theme = themeSelect.value;
    const fontFamily = fontFamilySelect.value;
    const fontSize = parseInt(fontSizeInput.value);
    const fontStyle = fontStyleSelect.value;

    chrome.storage.sync.set(
      {
        theme: theme,
        fontFamily: fontFamily,
        fontSize: fontSize,
        fontStyle: fontStyle,
      },
      function () {
        themeStatusDiv.textContent = 'Theme settings saved successfully!';
        themeStatusDiv.className = 'status success';

        // Clear status after 3 seconds
        setTimeout(() => {
          themeStatusDiv.textContent = '';
          themeStatusDiv.className = '';
        }, 3000);
      }
    );
  });
  // Function to get current date/time format from storage
  function getCurrentDateTimeFormat(): Promise<string> {
    return new Promise((resolve) => {
      chrome.storage.sync.get('dateTimeFormat', (result) => {
        resolve(result.dateTimeFormat || getDefaultDateTimeFormat());
      });
    });
  }

  // Function to populate dateTimeFormat select with current previews
  function populateDateTimeFormatOptions() {
    const now = new Date();
    const formats = [
      { value: 'dd/mm/yyyy-24h', label: 'DD/MM/YYYY HH:MM (24-hour)' },
      { value: 'mm/dd/yyyy-12h', label: 'MM/DD/YYYY HH:MM (12-hour)' },
      { value: 'yyyy-mm-dd-24h', label: 'YYYY-MM-DD HH:MM (24-hour)' },
      { value: 'dd.mm.yyyy-24h', label: 'DD.MM.YYYY HH:MM (24-hour)' },
      { value: 'mm-dd-yyyy-12h', label: 'MM-DD-YYYY HH:MM (12-hour)' },
    ];

    dateTimeFormatSelect.innerHTML = '';
    formats.forEach((format) => {
      const option = document.createElement('option');
      option.value = format.value;
      option.textContent = `${format.label} - ${formatDateTime(now, format.value)}`;
      dateTimeFormatSelect.appendChild(option);
    });
  }

  // Function to refresh all date displays when format changes
  async function refreshDateDisplays() {
    // Refresh history display
    if (allHistory.length > 0) {
      await filterAndDisplayHistory();
    }

    // Refresh metrics display
    loadMetrics();
  }

  // Populate options on page load
  populateDateTimeFormatOptions();

  // Attach utility functions to window for testing
  (window as any).validateApiKey = validateApiKey;
  (window as any).validateOpenAIApiKey = validateOpenAIApiKey;
  (window as any).validateGeminiApiKey = validateGeminiApiKey;
  (window as any).validateAnthropicApiKey = validateAnthropicApiKey;
  (window as any).isModelAvailable = isModelAvailable;
  (window as any).optionsGetModelConfig = optionsGetModelConfig;
  (window as any).formatDateTime = formatDateTime;
  // ===== SHORTCUTS FUNCTIONALITY =====

  // Get shortcut-related elements
  const currentShortcutInput = document.getElementById(
    'currentShortcut'
  ) as HTMLInputElement;
  const shortcutValidationDiv = document.getElementById(
    'shortcutValidation'
  ) as HTMLDivElement;

  // Function to load and display the current shortcut from Chrome
  async function loadCurrentShortcut() {
    try {
      const commands = await chrome.commands.getAll();
      const executeActionCommand = commands.find(
        (cmd) => cmd.name === '_execute_action'
      );
      if (executeActionCommand && executeActionCommand.shortcut) {
        currentShortcutInput.value = executeActionCommand.shortcut;
        shortcutValidationDiv.textContent = `Current shortcut: ${executeActionCommand.shortcut}`;
        shortcutValidationDiv.className = 'status success';
        shortcutValidationDiv.style.display = 'block';
      } else {
        currentShortcutInput.value = 'No shortcut set';
        shortcutValidationDiv.textContent =
          'No keyboard shortcut is currently set for this extension.';
        shortcutValidationDiv.className = 'status';
        shortcutValidationDiv.style.display = 'block';
      }
    } catch (error) {
      console.error('Error loading shortcut:', error);
      currentShortcutInput.value = 'Unable to load shortcut';
      shortcutValidationDiv.textContent = 'Unable to load current shortcut.';
      shortcutValidationDiv.className = 'status error';
      shortcutValidationDiv.style.display = 'block';
    }
  }

  // Handle "Open Chrome Shortcuts" button
  const openShortcutsBtn = document.getElementById('openShortcutsBtn');
  if (openShortcutsBtn) {
    openShortcutsBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
    });
  }

  // Integrate with navigation: load shortcut when shortcuts page becomes active
  const shortcutsPage = document.getElementById('shortcuts-page');
  if (shortcutsPage) {
    const observer = new MutationObserver(async (mutations) => {
      mutations.forEach(async (mutation) => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'class'
        ) {
          const target = mutation.target as HTMLElement;
          if (target.classList.contains('active')) {
            await loadCurrentShortcut();
          }
        }
      });
    });
    observer.observe(shortcutsPage, { attributes: true });
  }
});
(window as any).optionsThemes = optionsThemes;
