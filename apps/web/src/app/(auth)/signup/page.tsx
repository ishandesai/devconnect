'use client';
import { useMutation } from '@apollo/client/react';
import { SIGN_UP } from '@/lib/graphql';
import { saveToken } from '@/lib/auth';
import { useRouter } from 'next/navigation';

interface SignUpResponse {
  signUp: {
    token: string;
    user: {
      id: string;
      email: string;
      name: string;
    };
  };
}

export default function Signup() {
  const r = useRouter();
  const [mut, { loading, error }] = useMutation<SignUpResponse>(SIGN_UP, {
    onCompleted: (d) => {
      saveToken(d.signUp.token);
      r.push('/dashboard');
    },
  });
  return (
    <div className="p-6 max-w-sm mx-auto space-y-3">
      <h1 className="text-xl font-semibold">Create account</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget as HTMLFormElement);
          mut({
            variables: {
              email: f.get('email'),
              name: f.get('name'),
              password: f.get('password'),
            },
          });
        }}
        className="space-y-2"
      >
        <input
          name="email"
          placeholder="email"
          className="border px-3 py-2 w-full"
        />
        <input
          name="name"
          placeholder="name"
          className="border px-3 py-2 w-full"
        />
        <input
          name="password"
          placeholder="password"
          type="password"
          className="border px-3 py-2 w-full"
        />
        <button
          disabled={loading}
          className="px-3 py-2 bg-black text-white rounded w-full"
        >
          Sign up
        </button>
        {error && <p className="text-red-600 text-sm">{error.message}</p>}
      </form>
    </div>
  );
}
