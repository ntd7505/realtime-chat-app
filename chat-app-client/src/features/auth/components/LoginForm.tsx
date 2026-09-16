import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { getApiErrorMessage } from '@/utils/error';
import { CircleNotch, WarningCircle } from '@phosphor-icons/react';

export function LoginForm() {
  const { login, isLoggingIn } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    try {
      await login({ email: email.trim(), password });
      navigate('/chat');
    } catch (error: unknown) {
      setErrorMsg(getApiErrorMessage(error, 'Login failed. Please check your credentials.'));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMsg && (
        <div
          className="p-3 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2"
          role="alert"
        >
          <WarningCircle size={16} weight="bold" className="shrink-0 text-rose-600" aria-hidden="true" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-zinc-700" htmlFor="email">
          Email address
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
          className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder-zinc-400 focus:bg-white focus:border-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 transition-all duration-150 disabled:opacity-50"
          disabled={isLoggingIn}
          required
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-zinc-700" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder-zinc-400 focus:bg-white focus:border-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 transition-all duration-150 disabled:opacity-50"
          disabled={isLoggingIn}
          required
        />
      </div>

      <button
        type="submit"
        disabled={isLoggingIn}
        className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-zinc-900 hover:bg-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 disabled:opacity-50 shadow-xs active:scale-[0.98] mt-2"
      >
        {isLoggingIn && (
          <CircleNotch size={16} weight="bold" className="animate-spin" aria-hidden="true" />
        )}
        <span>{isLoggingIn ? 'Signing in...' : 'Sign In'}</span>
      </button>
    </form>
  );
}
