'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/UserContext';

export default function LoginPage() {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const { username, isLoading, setUsername } = useUser();
  const router = useRouter();

  // If already logged in, redirect to calculator
  useEffect(() => {
    if (!isLoading && username) {
      router.push('/two');
    }
  }, [username, isLoading, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    
    if (!trimmed) {
      setError('Please enter a username');
      return;
    }
    
    if (trimmed.length < 2) {
      setError('Username must be at least 2 characters');
      return;
    }
    
    if (trimmed.length > 30) {
      setError('Username must be 30 characters or less');
      return;
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      setError('Username can only contain letters, numbers, underscores, and hyphens');
      return;
    }

    setUsername(trimmed);
    router.push('/two');
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-100 mb-2">EV Discipline Machine</h1>
          <p className="text-slate-400">Track your pick&apos;em slips with precision</p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 backdrop-blur-sm p-8">
          <h2 className="text-xl font-semibold text-slate-100 mb-6 text-center">Enter Your Username</h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-400 mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setError('');
                }}
                placeholder="e.g., bigm"
                className="w-full rounded-xl border border-slate-700/50 bg-slate-900/60 px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/30 transition-colors"
                autoFocus
                autoComplete="off"
              />
              {error && (
                <p className="mt-2 text-sm text-rose-400">{error}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-sky-600 hover:bg-sky-500 active:bg-sky-700 px-4 py-3 font-semibold text-white transition-colors"
            >
              Continue
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            Your bet data will be saved under this username.
            <br />
            No password required — just pick a unique name.
          </p>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-slate-600">
          Your data is stored securely in the cloud.
        </p>
      </div>
    </main>
  );
}
