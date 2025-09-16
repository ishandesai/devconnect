// src/app/HomeClient.tsx
'use client';

import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { saveToken } from '@/lib/auth';

// TODO: replace with your real queries
const SIGN_UP = gql`...`;
const ME = gql`...`;

export default function HomeClient() {
  const { data, refetch } = useQuery(ME);
  const [signUp, { loading }] = useMutation(SIGN_UP, {
    onCompleted: (r: any) => {
      saveToken(r.signUp.token);
      refetch();
    },
  });

  return (
    <main className="p-8 space-y-4">
      <div>
        Me:{' '}
        <pre>
          {JSON.stringify((data as any)?.currentUser ?? null, null, 2)}
        </pre>
      </div>
      <button
        className="px-3 py-2 rounded bg-black text-white"
        disabled={loading}
        onClick={() =>
          signUp({
            variables: {
              email: `${Date.now()}@te3st.com`,
              name: 'Bob',
              password: 'secret123',
            },
          })
        }
      >
        Quick Sign Up
      </button>
    </main>
  );
}
