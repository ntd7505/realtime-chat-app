import { useBlockUser, useBlockedUsers, useUnblockUser } from '../hooks/useUserBlocks';
import { getApiErrorMessage } from '@/utils/error';
import { useAuthStore } from '@/features/auth/authStore';
import { Prohibit, CircleNotch } from '@phosphor-icons/react';

interface BlockUserButtonProps {
  userId: number;
}

export function BlockUserButton({ userId }: BlockUserButtonProps) {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const blockedUsers = useBlockedUsers();
  const block = useBlockUser();
  const unblock = useUnblockUser();
  const isBlocked = blockedUsers.data?.some((user) => user.id === userId) ?? false;
  const activeMutation = isBlocked ? unblock : block;

  if (currentUserId === userId) return null;

  if (blockedUsers.isError) {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          onClick={() => blockedUsers.refetch()}
          className="min-h-[44px] px-2 text-xs font-semibold text-rose-700 hover:underline inline-flex items-center"
        >
          Retry block status
        </button>
        <span className="max-w-48 text-right text-xs text-rose-600" role="alert">
          Could not load block status.
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => activeMutation.mutate(userId)}
        disabled={blockedUsers.isLoading || activeMutation.isPending}
        className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-50 shadow-2xs transition-colors"
      >
        {activeMutation.isPending ? (
          <CircleNotch size={14} weight="bold" className="animate-spin" aria-hidden="true" />
        ) : (
          <Prohibit size={15} weight="bold" aria-hidden="true" />
        )}
        <span>
          {activeMutation.isPending
            ? isBlocked ? 'Unblocking...' : 'Blocking...'
            : isBlocked ? 'Unblock' : 'Block'}
        </span>
      </button>
      {activeMutation.isError && (
        <span className="max-w-48 text-right text-xs text-rose-600" role="alert">
          {getApiErrorMessage(
            activeMutation.error,
            isBlocked ? 'Could not unblock this user.' : 'Could not block this user.'
          )}
        </span>
      )}
    </div>
  );
}
