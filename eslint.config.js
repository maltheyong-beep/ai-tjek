// Fælles lintregler gør ubrugt kode og skjulte globale afhængigheder synlige.
import js from '@eslint/js';
import globals from 'globals';
export default [
  js.configs.recommended,
  { ignores: ['node_modules/**'] },
  {
    files: ['**/*.js'],
    languageOptions: { sourceType: 'module', globals: { ...globals.browser, ...globals.node } },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', ignoreRestSiblings: true }],
      'no-console': 'error',
    },
  },
];
