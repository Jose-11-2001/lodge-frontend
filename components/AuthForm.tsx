'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';

export default function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isLogin = mode === 'login';

  // If we arrived from /register → /login?registered=1, show a friendly notice.
  useEffect(() => {
    if (!isLogin) return;
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('registered') === '1') {
      setNotice('Account created — please log in.');
    }
  }, [isLogin]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      if (!isLogin && password.length < 6)
        throw new Error('Password must be at least 6 characters');
      if (!isLogin && !email.trim())
        throw new Error('Email is required');

      if (isLogin) {
        // Log in → redirect straight in
        const u = await authApi.login(username, password);
        router.push(u.role === 'ADMIN' ? '/admin/dashboard' : '/');
      } else {
        // Register → create the account, then force a fresh login
        await authApi.register(username, password, email.trim());
        authApi.logout();                       // clear the JWT that register returned
        router.push('/login?registered=1');     // send to login page
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[420px] mx-auto mt-10 bg-[var(--card)] border border-[var(--line-2)] rounded-[20px] p-7 shadow-[var(--shadow-md)]">
      <h2 className="m-0 mb-1 font-fraunces font-bold text-[28px]">
        {isLogin ? 'Welcome back' : 'Create your account'}
      </h2>
      <p className="m-0 mb-5 text-sm text-[var(--muted)]">
        {isLogin ? 'Log in to book rooms, halls and meals.' : 'It takes a few seconds.'}
      </p>

      {notice && (
        <p className="text-sm text-[#5bd39a] m-0 mb-3" role="status">
          {notice}
        </p>
      )}

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
              placeholder="you@example.com"
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