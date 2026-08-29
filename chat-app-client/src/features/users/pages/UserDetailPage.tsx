import { useParams, Link } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { Avatar } from '@/components/ui/Avatar';
import { useStartDirectChat } from '@/features/chat/hooks/useStartDirectChat';
import { getApiErrorMessage, getHttpStatus } from '@/utils/error';

export function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const parsedId = parseInt(userId || '', 10);

  const { data: user, isLoading, isError, error, refetch } = useUser(parsedId);
  const {
    startDirectChat,
    isPending: isStartingChat,
    isError: isStartChatError,
  } = useStartDirectChat();

  if (isNaN(parsedId)) {
    return (
      <div className="max-w-3xl mx-auto mt-8 px-4 sm:px-6 lg:px-8">
        <ErrorState title="Invalid request" message="The user ID provided is not valid." />
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSpinner fullCenter />;
  }

  if (isError) {
    const status = getHttpStatus(error);
    const message = status === 404
      ? 'The user you are looking for does not exist.'
      : getApiErrorMessage(error, 'An unexpected error occurred');

    return (
      <div className="max-w-3xl mx-auto mt-8 px-4 sm:px-6 lg:px-8">
        <ErrorState
          title="User not found"
          message={message}
          onRetry={status !== 404 ? () => refetch() : undefined}
        />
        <div className="mt-4 text-center">
          <Link to="/users" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
            &larr; Back to search
          </Link>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto mt-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-4">
        <Link to="/users" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
          &larr; Back to search
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">User Details</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Information about {user.displayName}.</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button
              type="button"
              onClick={() => startDirectChat(user.id)}
              disabled={isStartingChat}
              className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-zinc-900 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500 disabled:opacity-50"
            >
              {isStartingChat ? 'Opening...' : 'Message'}
            </button>
            {isStartChatError && (
              <span className="text-xs text-red-600" role="alert">
                Could not start chat.
              </span>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">Avatar</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <Avatar name={user.displayName} url={user.avatarUrl} size="lg" />
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Display name</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user.displayName}</dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Email address</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user.email}</dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Member since</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {new Date(user.createdAt).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
