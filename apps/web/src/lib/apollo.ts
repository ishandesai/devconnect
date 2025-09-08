import { ApolloClient, InMemoryCache, HttpLink, ApolloLink, from } from '@apollo/client';
import { getToken } from './auth';

const authLink = new ApolloLink((operation, forward) => {
  const token = getToken();
  console.log('Using token', token);
  operation.setContext(({ headers = {} }) => ({
    headers: { ...headers, Authorization: token ? `Bearer ${token}` : '' },
  }));
  return forward(operation);
});

function createApolloClient(): ApolloClient {
  return new ApolloClient({
    link: from([
      authLink,
      new HttpLink({
        uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql',
        fetch,
      }),
    ]),
    cache: new InMemoryCache(),
  });
}

let client: ApolloClient | null = null;
export const getApolloClient = () => (client ??= createApolloClient());
