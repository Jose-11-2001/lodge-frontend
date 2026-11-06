'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLodge } from '@/context/LodgeContext';

export default function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter();
  
  // Use the context functions so React state updates immediately
  const { login, register } = useLodge();
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isLogin = mode === 'login';

  const goBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (!isLogin && password.length < 6)
        throw new Error('Password must be at least 6 characters');
      if (!isLogin && !email.trim())
        throw new Error('Email is required');

      // Call the context functions, NOT authApi
      if (isLogin) {
        const u = await login({ username, password });
        router.push(u.role === 'ADMIN' ? '/admin/dashboard' : '/');
      } else {
        // Assuming your context register function accepts email as a 3rd argument
        // If it only accepts (username, password), you'll need to update LodgeContext.tsx
        const u = await register({ username, password });
        router.push(u.role === 'ADMIN' ? '/admin/dashboard' : '/');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[420px] mx-auto mt-10 bg-[var(--card)] border border-[var(--line-2)] rounded-[20px] p-7 shadow-[var(--shadow-md)]">
      
      {/* Back arrow */}
      <button
        type="button"
        onClick={goBack}
        aria-label="Go back"
        title="Go back"
        className="inline-flex items-center gap-1.5 mb-4 -ml-1 px-2 py-1 rounded-lg text-sm font-medium text-[var(--muted)] hover:text-[var(--text)] hover:bg-[#f4f4f5] transition-colors cursor-pointer border-none bg-transparent"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Back
      </button>

      <h2 className="m-0 mb-1 font-fraunces font-bold text-[28px]">
        {isLogin ? 'Welcome back' : 'Create your account'}
      </h2>
      <p className="m-0 mb-5 text-sm text-[var(--muted)]">
        {isLogin ? 'Log in to book rooms, halls and meals.' : 'It takes a few seconds.'}
      </p>

      <form onSubmit={submit}>
        <div className="field">
          <label>Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
          />
        </div>

        {!isLogin && (
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@gmail.com"
            />
          </div>
        )}

        <div className="field">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={isLogin ? 'current-password' : 'new-password'}
          />
        </div>

        {error && (
          <p className="text-sm text-[#ff6b7e] m-0 mb-2" role="alert">
            {error}
          </p>
        )}

        <button className="btn btn-primary w-full" type="submit" disabled={loading}>
          {loading ? 'Please wait…' : isLogin ? 'Login' : 'Create account'}
        </button>
      </form>

      <p className="mt-4 mb-0 text-sm text-[var(--muted)]">
        {isLogin ? 'New here? ' : 'Already registered? '}
        <Link
          href={isLogin ? '/register' : '/login'}
          className="text-[var(--accent)] font-semibold no-underline"
        >
          {isLogin ? 'Create an account' : 'Login'}
        </Link>
      </p>
    </div>
  );
}