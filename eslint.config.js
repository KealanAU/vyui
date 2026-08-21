import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'

// Plugins resolve relative to this file, so each package only needs a local
// `eslint` bin. Not type-aware — vue-tsc covers types in CI.
export default tseslint.config(
  {
    // Non-shipped demo/story scaffolds (excluded from the build too).
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/.nuxt/**',
      '**/.output/**',
      'apps/docs/public/**', // vendored @lynx-js/web-core bundles, served verbatim
      '**/.data/**',
      '**/.rspeedy/**',
      '**/.pnpm-store/**',
      '**/*.d.ts',
      '**/*.story.vue',
      '**/story/**',
      '**/_*.vue',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: { parserOptions: { parser: tseslint.parser } },
  },
  {
    // Keep the codebase's defensive `eslint-disable` comments that don't fire.
    linterOptions: { reportUnusedDisableDirectives: 'off' },
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
        lynx: 'readonly',
        NodesRef: 'readonly',
        SystemInfo: 'readonly',
        __DEV__: 'readonly',
      },
    },
    rules: {
      'no-undef': 'off', // Nuxt auto-imports are invisible here; vue-tsc is the real check
      'no-redeclare': 'off', // type + value of the same name; tsc catches real ones
      'vue/valid-template-root': 'off', // portal/renderless components have empty templates
      'vue/no-dupe-keys': 'off', // script-setup renames a prop and derives a ref of the same name
      'vue/require-default-prop': 'off', // defaults via withDefaults
      'vue/one-component-per-file': 'off',
      'vue/multi-word-component-names': 'off',
      '@typescript-eslint/no-explicit-any': 'off', // Lynx typing constraints (issue #10)
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      // Formatting — leave to the editor.
      'vue/singleline-html-element-content-newline': 'off',
      'vue/multiline-html-element-content-newline': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/html-indent': 'off',
      'vue/no-multi-spaces': 'off',
      'vue/attributes-order': 'off',
      'vue/order-in-components': 'off',
      'no-irregular-whitespace': ['error', { skipComments: true }], // deliberate U+200B in a doc comment
      'prefer-const': ['error', { destructuring: 'all' }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },
)
