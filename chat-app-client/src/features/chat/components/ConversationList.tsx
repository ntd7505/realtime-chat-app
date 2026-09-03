import { useState, useRef, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { MagnifyingGlass, WarningCircle, ChatCircleDots, UserPlus } from '@phosphor-icons/react';
import { useChats } from '@/features/chat/hooks/useChats';
import { cn } from '@/lib/utils';
import type { Chat } from '@/features/chat/chat.types';
import { Avatar } from '@/components/ui/Avatar';

interface ConversationListProps {
  activeChatId: number | null;
}

function formatConversationTime(dateString: string | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase();
  }
  if (isYesterday) {
    return 'Yesterday';
  }
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
  return date.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: '2-digit' });
}

export const ConversationList = ({ activeChatId }: ConversationListProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage, refetch } = useChats(20);

  const handleSelectChat = (chatId: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('chat', chatId.toString());
    setSearchParams(newParams);
  };

  const chats = data?.pages.flatMap((page) => page.items) ?? [];
  const filteredChats = chats.filter((chat: Chat) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      chat.otherUser.displayName.toLowerCase().includes(query) ||
      (chat.lastMessage?.content && chat.lastMessage.content.toLowerCase().includes(query))
    );
  });

  // Global shortcut: Cmd+K / Ctrl+K jumps to search
  useEffect(() => {
    const handleGlobalKeyDown = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Keyboard navigation from search input
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filteredChats.length > 0) {
        itemRefs.current[0]?.focus();
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredChats.length > 0) {
        handleSelectChat(filteredChats[0].id);
      }
    }
  };

  // Keyboard navigation between conversation items
  const handleItemKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = index + 1;
      if (nextIndex < filteredChats.length) {
        itemRefs.current[nextIndex]?.focus();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = index - 1;
      if (prevIndex >= 0) {
        itemRefs.current[prevIndex]?.focus();
      } else {
        searchInputRef.current?.focus();
      }
    }
  };

  return (
    <aside className="flex flex-col h-full bg-white/75 backdrop-blur-md" aria-label="Conversations sidebar">
      {/* Header & Search */}
      <div className="p-4 sm:p-5 flex flex-col gap-4 border-b border-zinc-100">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Messages</h1>
          <Link
            to="/users"
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-none"
            aria-label="New chat / find users"
            title="Start new chat"
          >
            <UserPlus size={18} weight="bold" aria-hidden="true" />
          </Link>
        </div>

        <div className="relative">
          <label htmlFor="conversation-search" className="sr-only">
            Search conversations
          </label>
          <MagnifyingGlass
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
            size={16}
            weight="bold"
            aria-hidden="true"
          />
          <input
            id="conversation-search"
            ref={searchInputRef}
            className="w-full rounded-xl py-2.5 pl-10 pr-12 text-sm bg-zinc-100/90 text-zinc-900 placeholder-zinc-400 border border-transparent focus:border-zinc-300 focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 transition-all duration-150"
            placeholder="Search messages..."
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            aria-keyshortcuts="Control+K Meta+K"
          />
          <kbd
            className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold text-zinc-400 bg-zinc-200/60 rounded border border-zinc-300/50 pointer-events-none select-none"
            title="Quick search shortcut"
          >
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-3 flex flex-col gap-1" role="list">
        {isLoading && (
          <div className="flex flex-col gap-2 p-1" aria-label="Loading conversations" role="status">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-2xl animate-pulse">
                <div className="w-11 h-11 bg-zinc-200/80 rounded-full shrink-0" />
                <div className="flex-1 flex flex-col gap-2 min-w-0">
                  <div className="w-28 h-3.5 bg-zinc-200/80 rounded" />
                  <div className="w-full h-3 bg-zinc-100/80 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center p-6 text-center gap-3 my-auto" role="alert">
            <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
              <WarningCircle size={22} weight="bold" />
            </div>
            <p className="text-sm font-medium text-zinc-700">Failed to load conversations</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="min-h-[44px] px-3 py-1.5 text-xs font-semibold text-zinc-900 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors shadow-2xs focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-none"
            >
              Try again
            </button>
          </div>
        )}

        {!isLoading && !isError && chats.length === 0 && (
          <div className="flex flex-col items-center justify-center p-6 text-center gap-3 my-auto">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400">
              <ChatCircleDots size={26} weight="regular" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-900">No conversations yet</p>
              <p className="text-xs text-zinc-500">Connect with others to start chatting.</p>
            </div>
            <Link
              to="/users"
              className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 text-xs font-semibold text-white bg-zinc-900 hover:bg-black rounded-xl transition-colors shadow-2xs focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-none"
            >
              Find people
            </Link>
          </div>
        )}

        {!isLoading && !isError && filteredChats.length === 0 && chats.length > 0 && (
          <div className="p-6 text-center text-xs text-zinc-500 my-auto">
            No conversations matching "{searchQuery}"
          </div>
        )}

        {!isLoading && !isError && filteredChats.length > 0 && (
          <>
            {filteredChats.map((chat: Chat, index: number) => {
              const isActive = activeChatId === chat.id;
              const timeString = formatConversationTime(chat.lastMessageAt);

              return (
                <button
                  key={chat.id}
                  ref={(el) => {
                    itemRefs.current[index] = el;
                  }}
                  type="button"
                  onClick={() => handleSelectChat(chat.id)}
                  onKeyDown={(e) => handleItemKeyDown(e, index)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-2xl transition-all duration-150 text-left w-full border min-h-[64px] focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-none select-none relative group",
                    isActive
                      ? "bg-zinc-100/95 border-zinc-200 text-zinc-900 shadow-2xs"
                      : "border-transparent text-zinc-700 hover:bg-white/80"
                  )}
                  aria-selected={isActive}
                >
                  {isActive && (
                    <span
                      className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1 h-6 bg-zinc-900 rounded-full"
                      aria-hidden="true"
                    />
                  )}
                  <Avatar
                    name={chat.otherUser.displayName}
                    url={chat.otherUser.avatarUrl}
                    className="w-11 h-11 shrink-0 ml-1"
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-center gap-1 overflow-hidden">
                    <div className="flex justify-between items-baseline gap-2">
                      <h2 className="text-sm font-semibold text-zinc-900 truncate">
                        {chat.otherUser.displayName}
                      </h2>
                      {timeString && (
                        <span className="text-[11px] text-zinc-400 shrink-0 font-normal">
                          {timeString}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={cn(
                          "text-xs truncate",
                          isActive ? "text-zinc-700 font-medium" : "text-zinc-500"
                        )}
                      >
                        {chat.lastMessage?.content || 'Started a conversation'}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}

            {hasNextPage && (
              <button
                type="button"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="mt-2 min-h-[44px] py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 disabled:opacity-50 transition-colors focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-none"
              >
                {isFetchingNextPage ? 'Loading more...' : 'Load more conversations'}
              </button>
            )}
          </>
        )}
      </div>
    </aside>
  );
};
