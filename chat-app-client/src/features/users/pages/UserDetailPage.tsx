import { useParams, Link } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { Avatar } from '@/components/ui/Avatar';
import { useStartDirectChat } from '@/features/chat/hooks/useStartDirectChat';
import { getApiErrorMessage, getHttpStatus } from '@/utils/error';
import { FriendRequestButton } from '@/features/friends/components/FriendRequestButton';
import { BlockUserButton } from '@/features/blocks/components/BlockUserButton';
import { useAuthStore } from '@/features/auth/authStore';
import { ArrowLeft, ChatCircleDots, CircleNotch, CalendarBlank, EnvelopeSimple, User as UserIcon } from '@phosphor-icons/react';

export function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const parsedId = parseInt(userId || '', 10);
  const currentUserId = useAuthStore((state) => state.user?.id);

  const { data: user, isLoading, isError, error, refetch } = useUser(parsedId);
  const {
    startDirectChat,
    isPending: isStartingChat,
    isError: isStartChatError,
  } = useStartDirectChat();

  if (isNaN(parsedId)) {
    return (
      <main className="flex-1 overflow-y-auto w-full p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <ErrorState title="Invalid request" message="The user ID provided is not valid." />
        </div>
      </main>
    );
  }

  if (isLoading) {
    return <LoadingSpinner fullCenter label="Loading profile details..." />;
  }

  if (isError) {
    const status = getHttpStatus(error);
    const message =
      status === 404
        ? 'The user you are looking for does not exist.'
        : getApiErrorMessage(error, 'An unexpected error occurred');

    return (
      <main className="flex-1 overflow-y-auto w-full p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto flex flex-col gap-4">
          <ErrorState
            title="User not found"
            message={message}
            onRetry={status !== 404 ? () => refetch() : undefined}
          />
          <div className="text-center">
            <Link
              to="/users"
              className="inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2 text-sm font-semibold text-zinc-900 hover:underline"
            >
              <ArrowLeft size={16} weight="bold" aria-hidden="true" />
              <span>Back to discover</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  const isSelf = currentUserId === user.id;

  return (
    <main className="flex-1 overflow-y-auto w-full p-4 sm:p-6 lg:p-8" aria-label={`Profile of ${user.displayName}`}>
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        {/* Back Link */}
        <div>
          <Link
            to="/users"
            className="inline-flex items-center gap-2 min-h-[44px] px-2 py-1 text-sm font-semibold text-zinc-600 hover:text-zinc-900 transition-colors rounded-lg focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-none"
          >
            <ArrowLeft size={18} weight="bold" aria-hidden="true" />
            <span>Back to search</span>
          </Link>
        </div>

        {/* Profile Card */}
        <article className="bg-white rounded-2xl border border-zinc-200/80 overflow-hidden shadow-xs">
          {/* Header Cover & Avatar */}
          <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b border-zinc-100">
            <div className="flex items-center gap-4 min-w-0">
              <Avatar
                name={user.displayName}
                url={user.avatarUrl}
                size="xl"
                className="w-16 h-16 sm:w-20 sm:h-20 shrink-0"
              />
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 truncate">
                  {user.displayName}
                </h1>
                <p className="text-xs sm:text-sm text-zinc-500 truncate mt-0.5">{user.email}</p>
              </div>
            </div>

            {/* Action Buttons */}
            {!isSelf && (
              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto shrink-0">
                <button
                  type="button"
                  onClick={() => startDirectChat(user.id)}
                  disabled={isStartingChat}
                  className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2 text-xs font-semibold rounded-xl text-white bg-zinc-900 hover:bg-black transition-colors focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-none disabled:opacity-50 shadow-2xs"
                >
                  {isStartingChat ? (
                    <CircleNotch size={15} weight="bold" className="animate-spin" aria-hidden="true" />
                  ) : (
                    <ChatCircleDots size={16} weight="bold" aria-hidden="true" />
                  )}
                  <span>{isStartingChat ? 'Opening...' : 'Message'}</span>
                </button>
                <FriendRequestButton userId={user.id} />
                <BlockUserButton userId={user.id} />
              </div>
            )}
            {isSelf && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700">
                This is you
              </span>
            )}
          </div>

          {isStartChatError && (
            <div className="px-6 py-2 bg-rose-50 border-b border-rose-100 text-xs text-rose-600 flex items-center justify-between" role="alert">
              <span>Failed to start chat. Please try again.</span>
              <button
                type="button"
                onClick={() => startDirectChat(user.id)}
                className="font-bold underline hover:text-rose-800 ml-2"
              >
                Retry
              </button>
            </div>
          )}

          {/* Details List */}
          <div className="p-6 sm:p-8 flex flex-col gap-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Account Details</h2>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-zinc-50 border border-zinc-100">
                <div className="w-9 h-9 rounded-lg bg-white border border-zinc-200/80 flex items-center justify-center text-zinc-600 shrink-0">
                  <UserIcon size={18} weight="bold" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <dt className="text-xs text-zinc-500 font-medium">Display name</dt>
                  <dd className="text-sm font-semibold text-zinc-900 truncate mt-0.5">{user.displayName}</dd>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-zinc-50 border border-zinc-100">
                <div className="w-9 h-9 rounded-lg bg-white border border-zinc-200/80 flex items-center justify-center text-zinc-600 shrink-0">
                  <EnvelopeSimple size={18} weight="bold" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <dt className="text-xs text-zinc-500 font-medium">Email address</dt>
                  <dd className="text-sm font-semibold text-zinc-900 truncate mt-0.5">{user.email}</dd>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-zinc-50 border border-zinc-100 sm:col-span-2">
                <div className="w-9 h-9 rounded-lg bg-white border border-zinc-200/80 flex items-center justify-center text-zinc-600 shrink-0">
                  <CalendarBlank size={18} weight="bold" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <dt className="text-xs text-zinc-500 font-medium">Member since</dt>
                  <dd className="text-sm font-semibold text-zinc-900 truncate mt-0.5">
                    {new Date(user.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </dd>
                </div>
              </div>
            </dl>
          </div>
        </article>
      </div>
    </main>
  );
}
