module.exports = {
  env: {
    node: true,
    browser: true,
    es2021: true,
    webextensions: true,
  },
  globals: {
    themes: 'readonly',
    showdown: 'readonly',
  },
  extends: ['eslint:recommended', 'prettier'],
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': 'error',
  },
};
