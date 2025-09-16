// src/app/providers.tsx
'use client';

import { PropsWithChildren, useMemo } from 'react';
import { ApolloProvider } from '@apollo/client/react';
import { getApolloClient } from '@/lib/apollo';
import { TeamProvider } from '@/lib/team-context';

export default function Providers({ children }: PropsWithChildren) {
  const client = useMemo(() => getApolloClient(), []);
  return (
    <ApolloProvider client={client}>
      <TeamProvider>{children}</TeamProvider>
    </ApolloProvider>
  );
}
