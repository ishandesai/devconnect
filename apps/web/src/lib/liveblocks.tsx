'use client';

import type { PropsWithChildren } from 'react';
import { LiveblocksProvider } from '@liveblocks/react/suspense';

const key =
  'pk_dev_eddb4uIOtI8XEBMZz5MRHrYMXz2O9lUfwIejCmtNiLxYAbfq36u_6yAh6v_VkQWD';
if (typeof window !== 'undefined' && !key) {
  console.warn('NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY is missing');
}

export default function LBProvider({ children }: PropsWithChildren) {
  return (
    <LiveblocksProvider publicApiKey={key!}>{children}</LiveblocksProvider>
  );
}
