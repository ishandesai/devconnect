// apollo.ts
import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  ApolloLink,
  from,
  split,
  type NormalizedCacheObject,
} from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getToken } from './auth';

const HTTP_URI = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql';

const authLink = new ApolloLink((operation, forward) => {
  const token = getToken();
  operation.setContext(({ headers = {} }) => ({
    headers: { ...headers, Authorization: token ? `Bearer ${token}` : '' },
  }));
  return forward(operation!);
});

function makeHttpLink() {
  return new HttpLink({ uri: HTTP_URI, fetch });
}

function makeWsLink() {
  // Browser only
  const wsUrl = HTTP_URI.replace('http', 'ws');
  return new GraphQLWsLink(
    createClient({
      url: wsUrl,
      lazy: true,                        // don't connect until first subscription
      connectionParams: () => ({
        Authorization: getToken() ? `Bearer ${getToken()}` : '',
      }),
    })
  );
}

function makeLink() {
  if (typeof window === 'undefined') {
    // Server (RSC/SSR): HTTP only
    return from([authLink, makeHttpLink()]);
  }
  // Client: split subscriptions vs queries/mutations
  const wsLink = makeWsLink();
  return split(
    ({ query }) => {
      const def = getMainDefinition(query);
      return def.kind === 'OperationDefinition' && def.operation === 'subscription';
    },
    wsLink,
    from([authLink, makeHttpLink()])
  );
}

function createApolloClient() {
  return new ApolloClient<NormalizedCacheObject>({
    link: makeLink(),
    cache: new InMemoryCache(),
  });
}

// Client-side singleton to preserve cache & avoid multiple WS connections
let browserClient: ApolloClient<NormalizedCacheObject> | null = null;
export function getApolloClient() {
  if (typeof window === 'undefined') {
    // per-request client on server
    return createApolloClient();
  }
  return (browserClient ??= createApolloClient());
}
