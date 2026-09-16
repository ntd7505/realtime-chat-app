import React, { useState } from 'react';
import { MagnifyingGlass, CircleNotch, X } from '@phosphor-icons/react';

interface UserSearchFormProps {
  initialKeyword?: string;
  onSearch: (keyword: string) => void;
  isSearching: boolean;
}

export function UserSearchForm({ initialKeyword = '', onSearch, isSearching }: UserSearchFormProps) {
  const [keyword, setKeyword] = useState(initialKeyword);
  const [prevInitial, setPrevInitial] = useState(initialKeyword);

  // Sync state when initialKeyword changes without useEffect cascading renders
  if (prevInitial !== initialKeyword) {
    setPrevInitial(initialKeyword);
    setKeyword(initialKeyword);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword.trim()) {
      onSearch(keyword.trim());
    }
  };

  const handleClear = () => {
    setKeyword('');
    onSearch('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 w-full bg-white/95 backdrop-blur-md rounded-2xl border border-zinc-200/90 hover:border-zinc-300 focus-within:border-zinc-900 focus-within:ring-2 focus-within:ring-zinc-900/10 p-2 sm:p-2.5 transition-all duration-150 shadow-xs"
    >
      <div className="flex-1 flex items-center gap-2 pl-2">
        <label htmlFor="user-search-input" className="sr-only">
          Search users by name or email
        </label>
        <MagnifyingGlass
          size={20}
          weight="bold"
          className="text-zinc-400 shrink-0 pointer-events-none"
          aria-hidden="true"
        />
        <input
          id="user-search-input"
          type="search"
          className="w-full bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-sm sm:text-base text-zinc-900 placeholder-zinc-400 py-1"
          placeholder="Search by display name or email address..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          disabled={isSearching}
        />
        {keyword && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 text-zinc-400 hover:text-zinc-700 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-none"
            aria-label="Clear search input"
            title="Clear search"
          >
            <X size={16} weight="bold" />
          </button>
        )}
      </div>

      <button
        type="submit"
        disabled={isSearching || !keyword.trim()}
        className="min-h-[44px] px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl text-white bg-zinc-900 hover:bg-black transition-all duration-150 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-none disabled:opacity-40 inline-flex items-center justify-center gap-2 shrink-0 shadow-2xs active:scale-[0.98]"
      >
        {isSearching && (
          <CircleNotch size={16} weight="bold" className="animate-spin" aria-hidden="true" />
        )}
        <span>{isSearching ? 'Searching...' : 'Search'}</span>
      </button>
    </form>
  );
}
