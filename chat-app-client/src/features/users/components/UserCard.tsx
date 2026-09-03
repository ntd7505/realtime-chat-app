import type { User } from '../user.types';
import { Avatar } from '@/components/ui/Avatar';
import { Link } from 'react-router-dom';
import { useStartDirectChat } from '@/features/chat/hooks/useStartDirectChat';
import { FriendRequestButton } from '@/features/friends/components/FriendRequestButton';
import { ChatCircleDots, CircleNotch, WarningCircle } from '@phosphor-icons/react';

interface UserCardProps {
  user: User;
}

export function UserCard({ user }: UserCardProps) {
  const { startDirectChat, isPending, isError } = useStartDirectChat();

  return (
    <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs hover:shadow-xs transition-all duration-150">
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <Avatar name={user.displayName} url={user.avatarUrl} size="lg" className="w-12 h-12 shrink-0" />
        <div className="min-w-0 flex-1">
          <Link
            to={`/users/${user.id}`}
            className="text-base font-semibold text-zinc-900 hover:underline truncate block leading-snug focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 rounded"
          >
            {user.displayName}
          </Link>
          <p className="text-xs text-zinc-500 truncate mt-0.5">{user.email}</p>
        </div>
      </div>

      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
        <button
          type="button"
          onClick={() => startDirectChat(user.id)}
          disabled={isPending}
          className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3.5 py-2 text-xs font-semibold rounded-xl text-white bg-zinc-900 hover:bg-black transition-colors focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-none disabled:opacity-50 shadow-2xs flex-1 sm:flex-none"
        >
          {isPending ? (
            <CircleNotch size={14} weight="bold" className="animate-spin" aria-hidden="true" />
          ) : (
            <ChatCircleDots size={16} weight="bold" aria-hidden="true" />
          )}
          <span>{isPending ? 'Opening...' : 'Message'}</span>
        </button>

        <FriendRequestButton userId={user.id} compact />

        <Link
          to={`/users/${user.id}`}
          className="inline-flex items-center justify-center min-h-[44px] px-3.5 py-2 text-xs font-semibold rounded-xl text-zinc-700 bg-zinc-100 hover:bg-zinc-200/70 transition-colors focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-none flex-1 sm:flex-none"
        >
          Profile
        </Link>
      </div>

      {isError && (
        <div className="w-full flex items-center justify-end gap-2 text-xs text-rose-600 mt-1" role="alert">
          <WarningCircle size={14} weight="bold" aria-hidden="true" />
          <span>Failed to start chat.</span>
          <button
            type="button"
            onClick={() => startDirectChat(user.id)}
            className="font-bold underline hover:text-rose-800"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
