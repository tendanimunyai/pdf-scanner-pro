import js from '@eslint/js';
import expo from 'eslint-config-expo/flat.js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'node_modules/',
      'android/',
      'ios/',
      'coverage/',
      'scripts/*.mjs',
      'eslint.config.mjs',
    ],
  },
  js.configs.recommended,
  ...expo,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
  },
);
