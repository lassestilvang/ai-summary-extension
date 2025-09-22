export function getModelConfig(model) {
    const models = {
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
