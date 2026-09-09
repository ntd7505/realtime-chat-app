import { useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChatCircleDots, Prohibit, UserMinus, UserPlus, Check, X, CircleNotch } from '@phosphor-icons/react';
import { Avatar } from '@/components/ui/Avatar';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { UserSummary } from '@/features/users/user.types';
import { getApiErrorMessage } from '@/utils/error';
import { useStartDirectChat } from '@/features/chat/hooks/useStartDirectChat';
import {
  useAcceptFriendRequest,
  useCancelFriendRequest,
  useFriends,
  useReceivedFriendRequests,
  useSentFriendRequests,
  useUnfriend,
} from '../hooks/useFriendships';
import { useBlockedUsers, useUnblockUser } from '@/features/blocks/hooks/useUserBlocks';
import { cn } from '@/lib/utils';

type ConnectionTab = 'friends' | 'requests' | 'sent' | 'blocked';

interface PersonRowProps {
  user: UserSummary;
  children: ReactNode;
}

function PersonRow({ user, children }: PersonRowProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-zinc-200/80 bg-white p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-shadow duration-150">
      <Link
        to={`/users/${user.id}`}
        className="flex min-w-0 flex-1 items-center gap-3.5 rounded-xl group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
      >
        <Avatar name={user.displayName} url={user.avatarUrl} size="md" className="w-11 h-11 shrink-0" />
        <div className="min-w-0 flex-1">
          <span className="truncate text-sm font-semibold text-zinc-900 group-hover:underline block">
            {user.displayName}
          </span>
          <span className="text-xs text-zinc-400 font-normal">View profile</span>
        </div>
      </Link>
      <div className="flex flex-wrap items-center gap-2 shrink-0">{children}</div>
    </div>
  );
}

function StartChatButton({ user }: { user: UserSummary }) {
  const chat = useStartDirectChat();

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => chat.startDirectChat(user.id)}
        disabled={chat.isPending}
        className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 disabled:opacity-50 shadow-2xs transition-colors"
      >
        {chat.isPending ? (
          <CircleNotch size={14} weight="bold" className="animate-spin" aria-hidden="true" />
        ) : (
          <ChatCircleDots size={16} weight="bold" aria-hidden="true" />
        )}
        <span>{chat.isPending ? 'Opening...' : 'Message'}</span>
      </button>
      {chat.isError && (
        <span className="text-xs text-rose-600" role="alert">
          Could not start chat.
        </span>
      )}
    </div>
  );
}

export function ConnectionsPage() {
  const [activeTab, setActiveTab] = useState<ConnectionTab>('friends');
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const friends = useFriends();
  const requests = useReceivedFriendRequests();
  const sentRequests = useSentFriendRequests();
  const blocked = useBlockedUsers();
  const accept = useAcceptFriendRequest();
  const decline = useCancelFriendRequest();
  const unfriend = useUnfriend();
  const unblock = useUnblockUser();

  const tabs: Array<{ id: ConnectionTab; label: string; count: number }> = [
    { id: 'friends', label: 'Friends', count: friends.data?.length ?? 0 },
    { id: 'requests', label: 'Requests', count: requests.data?.length ?? 0 },
    { id: 'sent', label: 'Sent', count: sentRequests.data?.length ?? 0 },
    { id: 'blocked', label: 'Blocked', count: blocked.data?.length ?? 0 },
  ];

  const handleKeyDownTabs = (e: React.KeyboardEvent, index: number) => {
    const nextIndex = e.key === 'ArrowRight' ? (index + 1) % tabs.length
      : e.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length
      : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : null;
    if (nextIndex === null) return;
    e.preventDefault();
    setActiveTab(tabs[nextIndex].id);
    tabRefs.current[nextIndex]?.focus();
  };

  const renderFriends = () => {
    if (friends.isLoading) return <LoadingSpinner fullCenter label="Loading friends..." />;
    if (friends.isError) {
      return <ErrorState message="Could not load your friends." onRetry={() => friends.refetch()} />;
    }
    if (!friends.data?.length) {
      return (
        <EmptyState
          icon={<UserPlus size={26} weight="regular" />}
          title="No friends yet"
          description="You haven't added any friends yet. Discover people to connect with."
          action={
            <Link
              to="/users"
              className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 text-xs font-semibold text-white bg-zinc-900 hover:bg-black rounded-xl transition-colors shadow-2xs focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-none"
            >
              Discover users
            </Link>
          }
        />
      );
    }

    return friends.data.map((friend) => (
      <PersonRow key={friend.id} user={friend}>
        <StartChatButton user={friend} />
        <button
          type="button"
          aria-label={`Unfriend ${friend.displayName}`}
          onClick={() => unfriend.mutate(friend.id)}
          disabled={unfriend.isPending}
          className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 hover:text-rose-800 hover:border-rose-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-50 transition-colors shadow-2xs"
        >
          {unfriend.isPending && unfriend.variables === friend.id ? (
            <CircleNotch size={14} weight="bold" className="animate-spin" aria-hidden="true" />
          ) : (
            <UserMinus size={15} weight="bold" aria-hidden="true" />
          )}
          <span>{unfriend.isPending && unfriend.variables === friend.id ? 'Removing...' : 'Unfriend'}</span>
        </button>
        {unfriend.isError && unfriend.variables === friend.id && (
          <span className="w-full text-xs text-rose-600" role="alert">
            {getApiErrorMessage(unfriend.error, 'Could not remove friend.')}
          </span>
        )}
      </PersonRow>
    ));
  };

  const renderRequests = () => {
    if (requests.isLoading) return <LoadingSpinner fullCenter label="Loading requests..." />;
    if (requests.isError) {
      return <ErrorState message="Could not load friend requests." onRetry={() => requests.refetch()} />;
    }
    if (!requests.data?.length) {
      return (
        <EmptyState
          icon={<UserPlus size={26} weight="regular" />}
          title="No pending requests"
          description="You don't have any incoming friend requests at the moment."
        />
      );
    }

    return requests.data.map((requester) => (
      <PersonRow key={requester.id} user={requester}>
        <button
          type="button"
          aria-label={`Accept ${requester.displayName}`}
          onClick={() => accept.mutate(requester.id)}
          disabled={accept.isPending || decline.isPending}
          className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 disabled:opacity-50 shadow-2xs transition-colors"
        >
          {accept.isPending && accept.variables === requester.id ? (
            <CircleNotch size={14} weight="bold" className="animate-spin" aria-hidden="true" />
          ) : (
            <Check size={15} weight="bold" aria-hidden="true" />
          )}
          <span>{accept.isPending && accept.variables === requester.id ? 'Accepting...' : 'Accept'}</span>
        </button>
        <button
          type="button"
          aria-label={`Decline ${requester.displayName}`}
          onClick={() => decline.mutate(requester.id)}
          disabled={accept.isPending || decline.isPending}
          className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 disabled:opacity-50 shadow-2xs transition-colors"
        >
          {decline.isPending && decline.variables === requester.id ? (
            <CircleNotch size={14} weight="bold" className="animate-spin" aria-hidden="true" />
          ) : (
            <X size={15} weight="bold" aria-hidden="true" />
          )}
          <span>{decline.isPending && decline.variables === requester.id ? 'Declining...' : 'Decline'}</span>
        </button>
        {((accept.isError && accept.variables === requester.id) ||
          (decline.isError && decline.variables === requester.id)) && (
          <span className="w-full text-xs text-rose-600" role="alert">
            {getApiErrorMessage(accept.error ?? decline.error, 'Could not update this request.')}
          </span>
        )}
      </PersonRow>
    ));
  };

  const renderBlocked = () => {
    if (blocked.isLoading) return <LoadingSpinner fullCenter label="Loading blocked users..." />;
    if (blocked.isError) {
      return <ErrorState message="Could not load blocked users." onRetry={() => blocked.refetch()} />;
    }
    if (!blocked.data?.length) {
      return (
        <EmptyState
          icon={<Prohibit size={26} weight="regular" />}
          title="No blocked users"
          description="You haven't blocked any users."
        />
      );
    }

    return blocked.data.map((blockedUser) => (
      <PersonRow key={blockedUser.id} user={blockedUser}>
        <button
          type="button"
          aria-label={`Unblock ${blockedUser.displayName}`}
          onClick={() => unblock.mutate(blockedUser.id)}
          disabled={unblock.isPending}
          className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-50 shadow-2xs transition-colors"
        >
          {unblock.isPending && unblock.variables === blockedUser.id ? (
            <CircleNotch size={14} weight="bold" className="animate-spin" aria-hidden="true" />
          ) : (
            <Prohibit size={15} weight="bold" aria-hidden="true" />
          )}
          <span>{unblock.isPending && unblock.variables === blockedUser.id ? 'Unblocking...' : 'Unblock'}</span>
        </button>
        {unblock.isError && unblock.variables === blockedUser.id && (
          <span className="w-full text-xs text-rose-600" role="alert">
            {getApiErrorMessage(unblock.error, 'Could not unblock this user.')}
          </span>
        )}
      </PersonRow>
    ));
  };

  const renderSentRequests = () => {
    if (sentRequests.isLoading) {
      return <LoadingSpinner fullCenter label="Loading sent requests..." />;
    }
    if (sentRequests.isError) {
      return (
        <ErrorState
          message="Could not load sent friend requests."
          onRetry={() => sentRequests.refetch()}
        />
      );
    }
    if (!sentRequests.data?.length) {
      return (
        <EmptyState
          icon={<UserPlus size={26} weight="regular" />}
          title="No sent requests"
          description="Friend requests you send will appear here until they are accepted or cancelled."
        />
      );
    }

    return sentRequests.data.map((recipient) => (
      <PersonRow key={recipient.id} user={recipient}>
        <button
          type="button"
          aria-label={`Cancel request to ${recipient.displayName}`}
          onClick={() => decline.mutate(recipient.id)}
          disabled={decline.isPending}
          className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 disabled:opacity-50 shadow-2xs transition-colors"
        >
          {decline.isPending && decline.variables === recipient.id ? (
            <CircleNotch size={14} weight="bold" className="animate-spin" aria-hidden="true" />
          ) : (
            <X size={15} weight="bold" aria-hidden="true" />
          )}
          <span>
            {decline.isPending && decline.variables === recipient.id
              ? 'Cancelling...'
              : 'Cancel request'}
          </span>
        </button>
        {decline.isError && decline.variables === recipient.id && (
          <span className="w-full text-xs text-rose-600" role="alert">
            {getApiErrorMessage(decline.error, 'Could not cancel this request.')}
          </span>
        )}
      </PersonRow>
    ));
  };

  return (
    <main className="flex-1 overflow-y-auto w-full p-4 sm:p-6 lg:p-8" aria-label="Connections">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Connections</h1>
          <p className="text-sm text-zinc-500">Manage your friends, requests, and blocked users.</p>
        </header>

        {/* Tab Navigation */}
        <div
          className="flex gap-1.5 rounded-2xl bg-zinc-100/90 p-1.5 border border-zinc-200/50"
          role="tablist"
          aria-label="Connection categories"
        >
          {tabs.map((tab, index) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`connections-tab-${tab.id}`}
                aria-controls={`connections-panel-${tab.id}`}
                ref={(element) => { tabRefs.current[index] = element; }}
                type="button"
                role="tab"
                aria-selected={isSelected}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={(e) => handleKeyDownTabs(e, index)}
                className={cn(
                  'min-w-0 min-h-[44px] flex-1 flex-wrap rounded-xl px-2 sm:px-4 py-2 text-xs font-semibold transition-colors duration-150 flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900',
                  isSelected
                    ? 'bg-white text-zinc-900 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-white/50'
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'px-1.5 py-0.5 rounded-full text-[11px] font-bold',
                    isSelected ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-200/60 text-zinc-500'
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Panel */}
        <section id={`connections-panel-${activeTab}`} aria-labelledby={`connections-tab-${activeTab}`} tabIndex={0} className="flex flex-col gap-3 min-h-64" role="tabpanel">
          {activeTab === 'friends' && renderFriends()}
          {activeTab === 'requests' && renderRequests()}
          {activeTab === 'sent' && renderSentRequests()}
          {activeTab === 'blocked' && renderBlocked()}
        </section>
      </div>
    </main>
  );
}
