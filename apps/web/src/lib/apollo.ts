// src/lib/apollo.ts
'use client';

import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  ApolloLink,
  from,
  split,
  CombinedGraphQLErrors,
  ServerError,
} from '@apollo/client';
import { ErrorLink } from '@apollo/client/link/error';
import { Observable, getMainDefinition } from '@apollo/client/utilities';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getToken } from './auth';

const HTTP_URI =
  process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql';

const WS_URI =
  process.env.NEXT_PUBLIC_GRAPHQL_WS_URL ||
  HTTP_URI.replace(/^http(s?):/i, 'ws$1:');

// If your API uses cookies/sessions instead of Bearer tokens, flip this:
const USE_COOKIES = false;

/** Add Authorization header (+ cookie creds if enabled) */
const authLink = new ApolloLink((operation, forward) => {
  const token = typeof window !== 'undefined' ? getToken() : null;
  operation.setContext(({ headers = {}, fetchOptions = {} }) => ({
    headers: {
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    fetchOptions: {
      ...fetchOptions,
      keepalive: true,
      credentials: USE_COOKIES ? 'include' : 'same-origin',
    },
  }));
  return forward!(operation);
});

/** Fail requests after a timeout to avoid hung UI */
const timeoutLink = new ApolloLink((operation, forward) => {
  if (typeof AbortController === 'undefined') return forward!(operation);

  const controller = new AbortController();
  operation.setContext(({ fetchOptions = {} }) => ({
    fetchOptions: { ...fetchOptions, signal: controller.signal },
  }));

  const id = setTimeout(() => controller.abort(), 8000); // 8s

  return new Observable((observer) => {
    const sub = forward!(operation).subscribe({
      next: (v) => {
        clearTimeout(id);
        observer.next(v);
      },
      error: (e) => {
        clearTimeout(id);
        observer.error(e);
      },
      complete: () => {
        clearTimeout(id);
        observer.complete();
      },
    });
    return () => {
      clearTimeout(id);
      sub.unsubscribe();
    };
  });
});

/** v4 ErrorLink: unified `error` instead of graphQLErrors/networkError */
const errorLink = new ErrorLink(({ error }) => {
  const isUnauthGraphQL =
    CombinedGraphQLErrors.is(error) &&
    error.errors.some((ge) => (ge.extensions as any)?.code === 'UNAUTHENTICATED');

  const isUnauthHttp = ServerError.is(error) && error.statusCode === 401;

  if (
    (isUnauthGraphQL || isUnauthHttp) &&
    typeof window !== 'undefined' &&
    !location.pathname.startsWith('/login')
  ) {
    location.href = '/login';
  }
});

function makeHttpLink() {
  return new HttpLink({
    uri: HTTP_URI,
    credentials: USE_COOKIES ? 'include' : 'same-origin',
  });
}

function makeWsLink() {
  return new GraphQLWsLink(
    createClient({
      url: WS_URI,
      lazy: true,
      retryAttempts: 5,
      connectionParams: () => {
        const t = typeof window !== 'undefined' ? getToken() : null;
        return t ? { Authorization: `Bearer ${t}` } : {};
      },
    })
  );
}

function makeLink() {
  // Server: only HTTP
  if (typeof window === 'undefined') {
    return from([errorLink, timeoutLink, authLink, makeHttpLink()]);
  }

  // Client: split to WS for subscriptions
  const wsLink = makeWsLink();
  return split(
    ({ query }) => {
      const def = getMainDefinition(query);
      return def.kind === 'OperationDefinition' && def.operation === 'subscription';
    },
    wsLink,
    from([errorLink, timeoutLink, authLink, makeHttpLink()])
  );
}

function createApolloClient() {
  return new ApolloClient({
    link: makeLink(),
    cache: new InMemoryCache(),
    // Keep reasonable defaults; tweak per your needs
    defaultOptions: {
      watchQuery: { fetchPolicy: 'cache-and-network' },
      query: { fetchPolicy: 'network-only' },
      mutate: { errorPolicy: 'all' },
    },
  });
}

let browserClient: ApolloClient | null = null;

/** Use one singleton client per tab. */
export function getApolloClient() {
  if (typeof window === 'undefined') {
    return createApolloClient();
  }
  return (browserClient ??= createApolloClient());
}
