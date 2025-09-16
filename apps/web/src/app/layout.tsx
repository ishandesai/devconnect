// app/layout.tsx
import './globals.css'
import Providers from './providers'
import PerformanceMonitor from '../components/PerformanceMonitor'
import { inter } from './fonts'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>   {/* 👈 add the font class */}
        <Providers>{children}</Providers>
        <PerformanceMonitor />
      </body>
    </html>
  )
}
