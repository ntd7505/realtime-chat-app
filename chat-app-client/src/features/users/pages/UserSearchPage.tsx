import { useSearchParams, Link } from 'react-router-dom';
import { UserSearchForm } from '../components/UserSearchForm';
import { UserCard } from '../components/UserCard';
import { useUserSearch } from '../hooks/useUserSearch';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonAvatar, SkeletonText } from '@/components/ui/Skeleton';
import {
  ChatCircleDots,
  UserPlus,
  ShieldCheck,
  ArrowRight,
  MagnifyingGlass,
  UsersThree,
} from '@phosphor-icons/react';

export function UserSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const keyword = searchParams.get('q') || '';

  const { data: users, isLoading, isError, error, refetch, isFetching } = useUserSearch(keyword);

  const handleSearch = (newKeyword: string) => {
    if (newKeyword.trim()) {
      setSearchParams({ q: newKeyword.trim() });
    } else {
      setSearchParams({});
    }
  };

  return (
    <main className="flex-1 overflow-y-auto w-full p-4 sm:p-6 lg:p-8" aria-label="Discover Users">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        {/* Page Header */}
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Discover Users</h1>
            <p className="text-sm text-zinc-500">
              Find new connections by entering a name or email address.
            </p>
          </div>
          <Link
            to="/connections"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-700 hover:text-zinc-900 transition-colors py-1"
          >
            <span>Your connections</span>
            <ArrowRight size={14} weight="bold" aria-hidden="true" />
          </Link>
        </header>

        {/* Sleek Search Bar */}
        <section aria-label="User search">
          <UserSearchForm
            onSearch={handleSearch}
            isSearching={isFetching}
            initialKeyword={keyword}
          />
        </section>

        {/* Main Content Area */}
        <section className="flex flex-col gap-4">
          {/* Default State: Welcome & Discovery Guide */}
          {!keyword && !isLoading && !users && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-200">
              {/* Hero Discovery Card */}
              <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-zinc-200/80 p-6 sm:p-8 text-center shadow-2xs">
                <div
                  className="w-14 h-14 rounded-2xl bg-zinc-900 text-white flex items-center justify-center mx-auto mb-4 shadow-xs"
                  aria-hidden="true"
                >
                  <UsersThree size={28} weight="fill" />
                </div>
                <h2 className="text-lg font-bold text-zinc-900">Connect with anyone on the platform</h2>
                <p className="mt-1 text-sm text-zinc-500 max-w-md mx-auto">
                  Type a display name or email address in the search box above to start an instant conversation or send a friend request.
                </p>
              </div>

              {/* Discovery Feature Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="bg-white/60 backdrop-blur-2xs rounded-2xl border border-zinc-200/60 p-4 flex flex-col gap-2">
                  <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700">
                    <ChatCircleDots size={20} weight="bold" aria-hidden="true" />
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-900">Direct Chat</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Start real-time 1-on-1 messaging directly from search results with instant delivery.
                  </p>
                </div>

                <div className="bg-white/60 backdrop-blur-2xs rounded-2xl border border-zinc-200/60 p-4 flex flex-col gap-2">
                  <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700">
                    <UserPlus size={20} weight="bold" aria-hidden="true" />
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-900">Friend Requests</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Build your personal contact list by sending and receiving connection requests.
                  </p>
                </div>

                <div className="bg-white/60 backdrop-blur-2xs rounded-2xl border border-zinc-200/60 p-4 flex flex-col gap-2">
                  <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700">
                    <ShieldCheck size={20} weight="bold" aria-hidden="true" />
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-900">Privacy Controls</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Easily manage relationships with full block and unblock controls at any time.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Loading Skeleton */}
          {isLoading && (
            <div className="flex flex-col gap-3" aria-label="Loading search results" role="status">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-zinc-200/80 p-4 sm:p-5 flex items-center justify-between gap-4 shadow-2xs animate-pulse"
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <SkeletonAvatar size="md" />
                    <SkeletonText lines={2} className="max-w-[200px]" />
                  </div>
                  <div className="w-24 h-9 bg-zinc-200/70 rounded-xl" />
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {isError && (
            <ErrorState
              title="Search failed"
              message={(error as any)?.response?.data?.message || 'An error occurred while searching for users.'}
              onRetry={() => refetch()}
            />
          )}

          {/* No Users Found State */}
          {users && users.length === 0 && (
            <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed border-zinc-200 bg-white/70 backdrop-blur-xs max-w-lg mx-auto my-4">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400 mb-3 shadow-2xs">
                <MagnifyingGlass size={26} weight="regular" />
              </div>
              <h3 className="text-base font-semibold text-zinc-900">No users found</h3>
              <p className="mt-1 text-xs sm:text-sm text-zinc-500 max-w-sm">
                We couldn't find anyone matching &ldquo;{keyword}&rdquo;. Try checking the spelling or searching by first name.
              </p>
              <button
                type="button"
                onClick={() => handleSearch('')}
                className="mt-4 min-h-[40px] px-4 py-2 text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors shadow-2xs focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-none"
              >
                Clear search
              </button>
            </div>
          )}

          {/* Results List */}
          {users && users.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  {users.length} {users.length === 1 ? 'user found' : 'users found'}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {users.map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
