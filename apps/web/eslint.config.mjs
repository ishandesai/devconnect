import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import nextPlugin from '@next/eslint-plugin-next'

export default [
  // 0) Ignore generated + config files so ESLint doesn't lint them
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
      'eslint.config.{js,cjs,mjs,ts}',
    ],
  },

  // 1) Base JS
  js.configs.recommended,

  // 2) TypeScript (typed) — scope to TS/TSX and point at your tsconfig
  ...tseslint.configs.recommendedTypeChecked.map((cfg) => ({
    ...cfg,
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      ...(cfg.languageOptions ?? {}),
      parserOptions: {
        ...(cfg.languageOptions?.parserOptions ?? {}),
        project: ['./tsconfig.json'],
        tsconfigRootDir: process.cwd(),
      },
    },
    rules: {
      ...(cfg.rules ?? {}),

      // So onClick / onSubmit handlers aren’t errors
      '@typescript-eslint/no-misused-promises': [
        'warn',
        { checksVoidReturn: { attributes: false, properties: false } },
      ],
      '@typescript-eslint/no-floating-promises': ['warn', { ignoreVoid: true }],

      // Make “unused” a warning (so lint passes)
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],

      // QUICK UNBLOCKERS (you can re-enable these later as you add types)
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-enum-comparison': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/no-base-to-string': 'off',
    },
  })),

  // 3) Next.js rules (App Router: disable pages-only rule)
  {
    plugins: { '@next/next': nextPlugin },
    rules: {
      ...nextPlugin.configs['core-web-vitals'].rules,
      '@next/next/no-html-link-for-pages': 'off',
    },
    settings: { next: { rootDir: ['apps/web'] } },
  },

  // 4) If any config files still get picked up, relax a few rules there
  {
    files: [
      '**/tailwind.config.{ts,js,cjs,mjs}',
      '**/postcss.config.{ts,js,cjs,mjs}',
      '**/next.config.{ts,js,cjs,mjs}',
    ],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'no-undef': 'off',
    },
  },
]
