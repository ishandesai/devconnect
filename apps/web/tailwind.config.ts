// tailwind.config.ts
import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'

export default {
  content: [
    './app/**/*.{ts,tsx,mdx}',
    './components/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx,mdx}', // keep only if you really have ./src
  ],
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        bg: 'hsl(var(--bg))',
        card: 'hsl(var(--card))',
        border: 'hsl(var(--border))',
        text: 'hsl(var(--text))',
        muted: 'hsl(var(--muted))',
        primary: 'hsl(var(--primary))',
        primaryFg: 'hsl(var(--primary-fg))',
      },
      boxShadow: { soft: '0 1px 2px rgba(0,0,0,.06), 0 8px 24px rgba(0,0,0,.06)' },
    },
  },
  plugins: [typography],
} satisfies Config
