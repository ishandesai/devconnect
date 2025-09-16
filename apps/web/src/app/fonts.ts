// app/fonts.ts
import { Inter } from 'next/font/google'

export const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '600', '700'], // include your bold weight for the H2/H1
  display: 'swap',               // 'optional' if you want even less blocking
  adjustFontFallback: true,      // reduces tiny layout jank
  variable: '--font-inter',
})
