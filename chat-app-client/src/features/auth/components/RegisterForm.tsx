import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { CircleNotch, WarningCircle } from '@phosphor-icons/react';

export function RegisterForm() {
  const { register, isRegistering } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedDisplayName = displayName.trim();
    const trimmedEmail = email.trim();
    const trimmedAvatarUrl = avatarUrl.trim();

    if (!trimmedDisplayName || !trimmedEmail || !password) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    if (trimmedDisplayName.length > 100) {
      setErrorMsg('Display name cannot exceed 100 characters.');
      return;
    }

    try {
      await register({
        displayName: trimmedDisplayName,
        email: trimmedEmail,
        password,
        ...(trimmedAvatarUrl && { avatarUrl: trimmedAvatarUrl }),
      });
      navigate('/login', { state: { message: 'Registration successful! Please sign in.' } });
    } catch (err: unknown) {
      const msg = (err as any)?.response?.data?.message || 'Registration failed. Please try again.';
      setErrorMsg(msg);
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
        <label className="block text-xs font-semibold text-zinc-700" htmlFor="displayName">
          Display name <span className="text-rose-500">*</span>
        </label>
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="e.g. Alex Miller"
          className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder-zinc-400 focus:bg-white focus:border-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 transition-all duration-150 disabled:opacity-50"
          disabled={isRegistering}
          maxLength={100}
          required
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-zinc-700" htmlFor="email">
          Email address <span className="text-rose-500">*</span>
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
          className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder-zinc-400 focus:bg-white focus:border-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 transition-all duration-150 disabled:opacity-50"
          disabled={isRegistering}
          required
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-zinc-700" htmlFor="password">
          Password <span className="text-rose-500">*</span>
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder-zinc-400 focus:bg-white focus:border-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 transition-all duration-150 disabled:opacity-50"
          disabled={isRegistering}
          minLength={8}
          required
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-zinc-700" htmlFor="avatarUrl">
          Avatar URL <span className="text-zinc-400 font-normal">(Optional)</span>
        </label>
        <input
          id="avatarUrl"
          type="url"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          placeholder="https://images.example.com/avatar.jpg"
          className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder-zinc-400 focus:bg-white focus:border-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 transition-all duration-150 disabled:opacity-50"
          disabled={isRegistering}
        />
      </div>

      <button
        type="submit"
        disabled={isRegistering}
        className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-zinc-900 hover:bg-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 disabled:opacity-50 shadow-xs active:scale-[0.98] mt-2"
      >
        {isRegistering && (
          <CircleNotch size={16} weight="bold" className="animate-spin" aria-hidden="true" />
        )}
        <span>{isRegistering ? 'Creating account...' : 'Create account'}</span>
      </button>
    </form>
  );
}
