'use client';
import { gql } from '@apollo/client';
import {useMutation, useQuery } from "@apollo/client/react"
import { saveToken } from '@/lib/auth';


const SIGN_UP = gql`
  mutation SignUp($email: String!, $name: String!, $password: String!) {
    signUp(input: { email: $email, name: $name, password: $password }) {
      token
      user { id email name }
    }
  }
`;

const ME = gql`
  query Me {
    currentUser { id email name }
  }
`;

type MeQuery = { currentUser: { id: string; email: string; name: string } | null };
type SignUpMutation = { signUp: { token: string; user: { id: string; email: string; name: string } } };
type SignUpVars = { email: string; name: string; password: string };

export default function Home() {
  const { data, refetch } = useQuery<MeQuery>(ME);

  const [signUp, { loading }] = useMutation<SignUpMutation, SignUpVars>(
    SIGN_UP,
    {
      onCompleted: (r) => {
        saveToken(r.signUp.token);
        refetch(); // will re-run ME with Authorization header
      },
    }
  );

  return (
    <main className="p-8 space-y-4">
      <div>
        Me: <pre>{JSON.stringify(data?.currentUser ?? null, null, 2)}</pre>
      </div>
      <button
        className="px-3 py-2 rounded bg-black text-white"
        disabled={loading}
        onClick={() =>
          signUp({
            variables: { email: `${Date.now()}@te3st.com`, name: 'Bob', password: 'secret123' }, // avoids EMAIL_TAKEN while testing
          })
        }
      >
        Quick Sign Up
      </button>
    </main>
  );
}
