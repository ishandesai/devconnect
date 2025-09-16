import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  ApolloLink,
  from,
  split,
  type FetchResult,
} from '@apollo/client';
import { Observable } from '@apollo/client/utilities';
import { getMainDefinition } from '@apollo/client/utilities';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getToken } from './auth';

const HTTP_URI =
  process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql';

const WS_URI =
  process.env.NEXT_PUBLIC_GRAPHQL_WS_URL ||
  HTTP_URI.replace(/^http(s?):/i, 'ws$1:');

const authLink = new ApolloLink((operation, forward) => {
  const token = getToken();
  operation.setContext(({ headers = {} }) => ({
    headers: {
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  }));
  return forward!(operation);
});

const timeoutLink = new ApolloLink((operation, forward) => {
  if (typeof AbortController === 'undefined') return forward!(operation);
  const controller = new AbortController();
  operation.setContext(({ fetchOptions = {} }) => ({
    fetchOptions: { ...fetchOptions, signal: controller.signal },
  }));
  const id = setTimeout(() => controller.abort(), 8000); // 8s

  return new Observable((observer) => {
    const subscription = forward!(operation).subscribe({
      next: (result) => {
        clearTimeout(id);
        observer.next(result);
      },
      error: (error) => {
        clearTimeout(id);
        observer.error(error);
      },
      complete: () => {
        clearTimeout(id);
        observer.complete();
      },
    });

    return () => {
      clearTimeout(id);
      subscription.unsubscribe();
    };
  });
});

function makeHttpLink() {
  return new HttpLink({ uri: HTTP_URI });
}

function makeWsLink() {
  return new GraphQLWsLink(
    createClient({
      url: WS_URI,
      lazy: true,
      connectionParams: () => {
        const t = getToken();
        return t ? { Authorization: `Bearer ${t}` } : {};
      },
    })
  );
}

function makeLink() {
  if (typeof window === 'undefined') {
    return from([timeoutLink, authLink, makeHttpLink()]);
  }
  const wsLink = makeWsLink();
  return split(
    ({ query }) => {
      const def = getMainDefinition(query);
      return (
        def.kind === 'OperationDefinition' && def.operation === 'subscription'
      );
    },
    wsLink,
    from([timeoutLink, authLink, makeHttpLink()])
  );
}

function createApolloClient() {
  return new ApolloClient({
    link: makeLink(),
    cache: new InMemoryCache(),
  });
}

let browserClient: ReturnType<typeof createApolloClient> | null = null;

export function getApolloClient() {
  if (typeof window === 'undefined') {
    return createApolloClient();
  }
  return (browserClient ??= createApolloClient());
}
