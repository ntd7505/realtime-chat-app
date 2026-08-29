import type { User } from '../user.types';
import { Avatar } from '@/components/ui/Avatar';
import { Link } from 'react-router-dom';
import { useStartDirectChat } from '@/features/chat/hooks/useStartDirectChat';


interface UserCardProps {
  user: User;
}

export function UserCard({ user }: UserCardProps) {
  const { startDirectChat, isPending, isError } = useStartDirectChat();

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100 flex items-center p-4">
      <Avatar name={user.displayName} url={user.avatarUrl} size="lg" />
      <div className="ml-4 flex-1">
        <h3 className="text-lg font-medium text-gray-900">{user.displayName}</h3>
        <p className="text-sm text-gray-500">{user.email}</p>
      </div>
      <div className="ml-4 flex-shrink-0 flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={() => startDirectChat(user.id)}
          disabled={isPending}
          className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-zinc-900 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500 disabled:opacity-50"
        >
          {isPending ? 'Opening...' : 'Message'}
        </button>
        <Link
          to={`/users/${user.id}`}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          View Profile
        </Link>
        {isError && (
          <span className="text-xs text-red-600" role="alert">
            Could not start chat.
          </span>
        )}
      </div>
    </div>
  );
}
