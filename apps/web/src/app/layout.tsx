// app/layout.tsx (Server Component)
import '@liveblocks/react-ui/styles.css';
import '@liveblocks/react-tiptap/styles.css';
import './globals.css';

import LBProvider from '@/lib/liveblocks';
import Providers from './providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <LBProvider>
          <Providers>{children}</Providers>
        </LBProvider>
      </body>
    </html>
  );
}
