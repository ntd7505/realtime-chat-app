import React, { useState } from 'react';

interface UserSearchFormProps {
  initialKeyword?: string;
  onSearch: (keyword: string) => void;
  isSearching: boolean;
}

export function UserSearchForm({ initialKeyword = '', onSearch, isSearching }: UserSearchFormProps) {
  const [keyword, setKeyword] = useState(initialKeyword);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword.trim()) {
      onSearch(keyword.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="flex-1 relative rounded-md shadow-sm">
        <input
          type="text"
          className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md px-4 py-2 border bg-white text-gray-900"
          placeholder="Search users by name or email..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          disabled={isSearching}
        />
      </div>
      <button
        type="submit"
        disabled={isSearching || !keyword.trim()}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        {isSearching ? 'Searching...' : 'Search'}
      </button>
    </form>
  );
}
