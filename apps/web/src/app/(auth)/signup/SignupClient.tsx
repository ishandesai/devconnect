'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { SIGN_UP, type SignUpMutation, type SignUpVariables } from '@/lib/graphql';
import { saveToken } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function SignupClient() {
  const r = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const [mut, { loading, error }] = useMutation<SignUpMutation, SignUpVariables>(
    SIGN_UP,
    {
      onCompleted: (d) => {
        saveToken(d.signUp.token);
        r.push('/dashboard');
      },
    }
  );

  return (
    <div className="p-6 max-w-sm mx-auto space-y-3">
      <h1 className="text-xl font-semibold">Create account</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setFormError(null);

          const f = new FormData(e.currentTarget as HTMLFormElement);
          const email = String(f.get('email') ?? '').trim();
          const name = String(f.get('name') ?? '').trim();
          const password = String(f.get('password') ?? '');

          if (!email || !name || !password) {
            setFormError('Please fill out email, name, and password.');
            return;
          }

          mut({ variables: { input: { email, name, password } } });
        }}
        className="space-y-2"
      >
        <input
          name="email"
          placeholder="email"
          type="email"
          className="border px-3 py-2 w-full"
          autoComplete="email"
          required
        />
        <input
          name="name"
          placeholder="name"
          className="border px-3 py-2 w-full"
          autoComplete="name"
          required
        />
        <input
          name="password"
          placeholder="password"
          type="password"
          className="border px-3 py-2 w-full"
          autoComplete="new-password"
          required
          minLength={6}
        />
        <button
          disabled={loading}
          className="px-3 py-2 bg-black text-white rounded w-full disabled:opacity-60"
        >
          {loading ? 'Creating…' : 'Sign up'}
        </button>

        {formError && <p className="text-red-600 text-sm">{formError}</p>}
        {error && <p className="text-red-600 text-sm">{error.message}</p>}
      </form>
    </div>
  );
}
