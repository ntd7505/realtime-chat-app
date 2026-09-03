import {
  useCancelFriendRequest,
  useFriends,
  useReceivedFriendRequests,
  useSendFriendRequest,
} from '../hooks/useFriendships';
import { getApiErrorMessage } from '@/utils/error';
import { useBlockedUsers } from '@/features/blocks/hooks/useUserBlocks';
import { useAuthStore } from '@/features/auth/authStore';
import { UserPlus, X, CircleNotch } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface FriendRequestButtonProps {
  userId: number;
  compact?: boolean;
}

export function FriendRequestButton({ userId, compact = false }: FriendRequestButtonProps) {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const friends = useFriends();
  const receivedRequests = useReceivedFriendRequests();
  const blockedUsers = useBlockedUsers();
  const request = useSendFriendRequest();
  const cancel = useCancelFriendRequest();

  if (currentUserId === userId) return null;

  if (friends.isError || receivedRequests.isError || blockedUsers.isError) {
    return (
      <button
        type="button"
        onClick={() => void Promise.all([
          friends.refetch(),
          receivedRequests.refetch(),
          blockedUsers.refetch(),
        ])}
        className="min-h-[44px] px-2 text-xs font-semibold text-rose-700 hover:underline inline-flex items-center"
      >
        Retry relationship status
      </button>
    );
  }

  const relationshipLabel = friends.data?.some((user) => user.id === userId)
    ? 'Friends'
    : receivedRequests.data?.some((user) => user.id === userId)
      ? 'Request received'
      : blockedUsers.data?.some((user) => user.id === userId)
        ? 'Blocked'
        : null;

  if (relationshipLabel) {
    return (
      <span
        className="inline-flex items-center min-h-[44px] px-3 text-xs font-semibold text-zinc-500 bg-zinc-100 rounded-xl"
        role="status"
      >
        {relationshipLabel}
      </span>
    );
  }

  if (request.isSuccess) {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          onClick={() => cancel.mutate(userId, { onSuccess: () => request.reset() })}
          disabled={cancel.isPending}
          className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 disabled:opacity-50 shadow-2xs transition-colors"
        >
          {cancel.isPending ? (
            <CircleNotch size={14} weight="bold" className="animate-spin" aria-hidden="true" />
          ) : (
            <X size={15} weight="bold" aria-hidden="true" />
          )}
          <span>{cancel.isPending ? 'Cancelling...' : 'Cancel request'}</span>
        </button>
        <span className="text-[11px] font-medium text-emerald-700" role="status">
          Request sent
        </span>
        {cancel.isError && (
          <span className="max-w-48 text-right text-xs text-rose-600" role="alert">
            {getApiErrorMessage(cancel.error, 'Could not cancel friend request.')}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => request.mutate(userId)}
        disabled={request.isPending || friends.isLoading || receivedRequests.isLoading || blockedUsers.isLoading}
        className={cn(
          "inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 disabled:opacity-50 shadow-2xs transition-colors",
          compact && "px-3"
        )}
      >
        {request.isPending ? (
          <CircleNotch size={14} weight="bold" className="animate-spin" aria-hidden="true" />
        ) : (
          <UserPlus size={15} weight="bold" aria-hidden="true" />
        )}
        <span>{request.isPending ? 'Sending...' : 'Add friend'}</span>
      </button>
      {request.isError && (
        <span className="max-w-48 text-right text-xs text-rose-600" role="alert">
          {getApiErrorMessage(request.error, 'Could not send friend request.')}
        </span>
      )}
    </div>
  );
}
