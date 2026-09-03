import { LoginForm } from '../components/LoginForm';
import { Link, useLocation } from 'react-router-dom';
import { ChatTeardropDots } from '@phosphor-icons/react';

export function LoginPage() {
  const location = useLocation();
  const message = location.state?.message;

  return (
    <main className="min-h-[100dvh] bg-[#d8eee2] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md flex flex-col gap-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shadow-xs">
            <ChatTeardropDots size={28} weight="fill" aria-hidden="true" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 mt-2">
            Welcome back
          </h1>
          <p className="text-sm text-zinc-600">
            Sign in to start conversations with friends and teams.
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-white/95 backdrop-blur-md p-6 sm:p-8 rounded-[28px] border border-white/80 shadow-[0_20px_40px_rgba(0,0,0,0.05)]">
          {message && (
            <div
              className="mb-5 p-3.5 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl"
              role="status"
            >
              {message}
            </div>
          )}
          <LoginForm />
        </div>

        {/* Footer Link */}
        <p className="text-center text-xs text-zinc-600">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="font-semibold text-zinc-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 rounded"
          >
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
