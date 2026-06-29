// Flat ESLint config (ESLint 9). Focused on ONE job: enforcing design-token
// discipline. Colors, spring configs and font families must come from
// constants/tokens.ts & constants/motion.ts — never hardcoded. This is what
// keeps theming (e.g. a future light mode) a one-file change instead of a
// codebase-wide search-and-replace.
//
// It intentionally does NOT pull in the full strict Expo ruleset (react-hooks
// / react-compiler etc.) so `npm run lint` stays signal — a failure here means
// a hardcoded design value slipped in, nothing else.

const tsParser = require('@typescript-eslint/parser');
const reactNative = require('eslint-plugin-react-native');

module.exports = [
  {
    ignores: [
      'node_modules/**',
      '.expo/**',
      'dist/**',
      '*.config.js',
    ],
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: { 'react-native': reactNative },
    rules: {
      // No raw color literals in styles — use colors.* from tokens.
      'react-native/no-color-literals': 'error',

      // No hardcoded font families or inline spring configs.
      'no-restricted-syntax': [
        'error',
        {
          selector: "Property[key.name='fontFamily'] > Literal",
          message:
            'Не хардкодь fontFamily. Используй fonts.* / typography.* из constants/tokens.',
        },
        {
          selector:
            "ObjectExpression:has(Property[key.name='damping']):has(Property[key.name='stiffness'])",
          message:
            'Не хардкодь конфиг пружины. Используй springs.* из constants/motion.',
        },
      ],
    },
  },
  {
    // Token sources legitimately hold the literal values; the error-boundary
    // fallback runs on a separate (useColors) theme system.
    files: [
      'constants/tokens.ts',
      'constants/motion.ts',
      'constants/chips.ts',
      'components/ErrorFallback.tsx',
    ],
    rules: {
      'react-native/no-color-literals': 'off',
      'no-restricted-syntax': 'off',
    },
  },
];
