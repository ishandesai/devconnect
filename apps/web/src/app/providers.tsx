'use client';
import { PropsWithChildren, useMemo } from "react";
import { ApolloProvider } from "@apollo/client/react";
import { getApolloClient } from '@/lib/apollo';
export default function Providers({ children }: PropsWithChildren) {
    const client = useMemo(() => getApolloClient(), []);
    return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
