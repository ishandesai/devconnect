// src/app/t/[teamId]/p/[projectId]/docs/layout.tsx
'use client';

import { LiveblocksProvider } from '@liveblocks/react/suspense';


const pk = process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY;



export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
 
    return (
        <LiveblocksProvider publicApiKey={pk!}>{children}</LiveblocksProvider>
      );
}
