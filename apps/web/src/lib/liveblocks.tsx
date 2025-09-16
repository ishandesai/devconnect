// src/lib/liveblocks.tsx
'use client';

import type { PropsWithChildren } from 'react';
import { LiveblocksProvider } from '@liveblocks/react/suspense';

const key = "pk_dev_eddb4uIOtI8XEBMZz5MRHrYMXz2O9lUfwIejCmtNiLxYAbfq36u_6yAh6v_VkQWD";
// Optional: warn in the browser if key is missing
if (typeof window !== 'undefined' && !key) {
  // eslint-disable-next-line no-console
  console.warn('NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY is missing');
}

export default function LBProvider({ children }: PropsWithChildren) {
  return (
    <LiveblocksProvider publicApiKey={key!}>
      {children}
    </LiveblocksProvider>
  );
}
