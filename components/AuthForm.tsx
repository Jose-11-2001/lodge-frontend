'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLodge } from '@/context/LodgeContext';

export default function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const { login, register, showToast } = useLodge();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const isLogin = mode === 'login';

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!isLogin && password.length < 6) throw new Error('Password must be at least 6 characters');
      const u = isLogin ? login({ username, password }) : register({ username, password });
      showToast(isLogin ? `Welcome back, ${u.username}` : 'Account created');
      router.push(u.role === 'ADMIN' ? '/admin/dashboard' : '/');
    } catch (err) {
      showToast((err as Error).message, true);
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
      <form onSubmit={submit}>
        <div className="field">
          <label>Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button className="btn btn-primary w-full" type="submit">
          {isLogin ? 'Login' : 'Create account'}
        </button>
      </form>
      <p className="mt-4 mb-0 text-sm text-[var(--muted)]">
        {isLogin ? 'New here? ' : 'Already registered? '}
        <Link href={isLogin ? '/register' : '/login'} className="text-[var(--accent)] font-semibold no-underline">
          {isLogin ? 'Create an account' : 'Login'}
        </Link>
      </p>
      {isLogin && (
        <p className="mt-3 mb-0 text-xs text-[var(--muted)]">Test accounts: alice / pass, admin / admin</p>
      )}
    </div>
  );
}