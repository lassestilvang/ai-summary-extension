module.exports = {
  env: {
    node: true,
    browser: true,
    es2021: true,
    webextensions: true,
    jest: true,
  },
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
  },
  globals: {
    themes: 'readonly',
    showdown: 'readonly',
    fetchMock: 'readonly',
  },
  extends: ['eslint:recommended', 'prettier'],
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': 'error',
  },
};
