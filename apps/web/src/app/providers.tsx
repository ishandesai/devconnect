'use client';
import { PropsWithChildren } from "react";
import { ApolloProvider } from "@apollo/client/react";
import { makeClient } from '@/lib/apollo';
export default function Providers({ children }: PropsWithChildren) {
    const client = makeClient();
    return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
