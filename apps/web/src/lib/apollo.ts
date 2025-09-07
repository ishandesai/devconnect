import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

export const makeClient = () =>
  new ApolloClient({
    link: new HttpLink({
      uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql',
      fetch,
    }),
    cache: new InMemoryCache(),
  });
