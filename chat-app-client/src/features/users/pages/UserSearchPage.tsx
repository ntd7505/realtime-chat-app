import { useState } from 'react';
import { UserSearchForm } from '../components/UserSearchForm';
import { UserCard } from '../components/UserCard';
import { useUserSearch } from '../hooks/useUserSearch';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';

export function UserSearchPage() {
  const [keyword, setKeyword] = useState('');
  
  // We only fetch when keyword is not empty, handled by the hook's `enabled` property
  const { data: users, isLoading, isError, error, refetch, isFetching } = useUserSearch(keyword);

  const handleSearch = (newKeyword: string) => {
    setKeyword(newKeyword);
  };

  return (
    <div className="max-w-4xl mx-auto mt-8 px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6 border border-gray-100">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Discover Users</h2>
        <UserSearchForm 
          onSearch={handleSearch} 
          isSearching={isFetching} 
          initialKeyword={keyword} 
        />
      </div>

      <div className="mt-6">
        {!keyword && !isLoading && !users && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-100 border-dashed">
            <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Start searching</h3>
            <p className="mt-1 text-sm text-gray-500">Find people by entering their name or email.</p>
          </div>
        )}

        {isLoading && (
          <div className="py-12 bg-white rounded-lg border border-gray-100 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {isError && (
          <ErrorState 
            title="Search failed" 
            message={(error as any)?.response?.data?.message || 'An error occurred while searching for users.'} 
            onRetry={() => refetch()} 
          />
        )}

        {users && users.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-100">
            <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
            <p className="mt-1 text-sm text-gray-500">We couldn't find anyone matching "{keyword}".</p>
          </div>
        )}

        {users && users.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {users.map(user => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
