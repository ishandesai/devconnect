// packages/eslint-config/flat.mjs
import js from '@eslint/js'
import pluginImport from 'eslint-plugin-import'
import simpleImportSort from 'eslint-plugin-simple-import-sort'

export default [
  js.configs.recommended,
  {
    plugins: {
      import: pluginImport,
      'simple-import-sort': simpleImportSort,
    },
    settings: {
      'import/resolver': { typescript: true, node: true },
    },
    rules: {
      'import/order': 'off',
      'simple-import-sort/imports': 'warn',
      'simple-import-sort/exports': 'warn',
      'import/newline-after-import': 'warn'
    },
  },
]
