import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

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
        ...(trimmedAvatarUrl && { avatarUrl: trimmedAvatarUrl })
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
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-md">
          {errorMsg}
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium text-gray-700" htmlFor="displayName">
          Display Name <span className="text-red-500">*</span>
        </label>
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 bg-white"
          disabled={isRegistering}
          maxLength={100}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700" htmlFor="email">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 bg-white"
          disabled={isRegistering}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700" htmlFor="password">
          Password <span className="text-red-500">*</span>
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 bg-white"
          disabled={isRegistering}
          minLength={8}
          required
        />
        <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters.</p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700" htmlFor="avatarUrl">
          Avatar URL <span className="text-gray-400 font-normal">(Optional)</span>
        </label>
        <input
          id="avatarUrl"
          type="url"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 bg-white"
          disabled={isRegistering}
        />
      </div>

      <button
        type="submit"
        disabled={isRegistering}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        {isRegistering ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
}
