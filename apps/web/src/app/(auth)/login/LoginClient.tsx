'use client';

import { useMutation } from '@apollo/client/react';
import { SIGN_IN, type SignInMutation, type SignInVariables } from '@/lib/graphql';
import { saveToken } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginClient() {
  const r = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const [mut, { loading, error }] = useMutation<SignInMutation, SignInVariables>(
    SIGN_IN,
    {
      onCompleted: (d) => {
        saveToken(d.signIn.token);
        r.push('/dashboard');
      },
    }
  );

  return (
    <div className="p-6 max-w-sm mx-auto space-y-3">
      <h1 className="text-xl font-semibold">Log in</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setFormError(null);

          const f = new FormData(e.currentTarget as HTMLFormElement);
          const email = String(f.get('email') ?? '').trim();
          const password = String(f.get('password') ?? '');

          if (!email || !password) {
            setFormError('Please enter email and password.');
            return;
          }

          mut({ variables: { input: { email, password } } });
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
          name="password"
          placeholder="password"
          type="password"
          className="border px-3 py-2 w-full"
          autoComplete="current-password"
          required
        />
        <button
          disabled={loading}
          className="px-3 py-2 bg-black text-white rounded w-full disabled:opacity-60"
        >
          {loading ? 'Logging in…' : 'Log in'}
        </button>

        {formError && <p className="text-red-600 text-sm">{formError}</p>}
        {error && <p className="text-red-600 text-sm">{error.message}</p>}
      </form>
    </div>
  );
}
