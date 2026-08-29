import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { MagnifyingGlass, WarningCircle, ChatCircleDots } from '@phosphor-icons/react';
import { useChats } from '@/features/chat/hooks/useChats';
import { cn } from '@/lib/utils';
import type { Chat } from '@/features/chat/chat.types';
import { Avatar } from '@/components/ui/Avatar';

interface ConversationListProps {
  activeChatId: number | null;
}

export const ConversationList = ({ activeChatId }: ConversationListProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  
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
      chat.lastMessage?.content.toLowerCase().includes(query)
    );
  });

  return (
    <div className="flex flex-col h-full bg-white/70 backdrop-blur-sm">
      {/* Header & Search */}
      <div className="px-6 pt-6 pb-4 flex flex-col gap-6">
        <div className="relative">
          <MagnifyingGlass
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-400"
            size={16}
            weight="bold"
          />
          <input
            className="w-full border-0 rounded-2xl py-3 pl-11 pr-4 text-sm focus:ring-2 focus:ring-zinc-200 shadow-sm placeholder-zinc-400 bg-zinc-100/80 outline-none transition-all"
            placeholder="Search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex justify-between items-center">
          <h2 className="text-[22px] font-semibold text-zinc-900 tracking-tight leading-none">Messages</h2>
        </div>
      </div>

      {/* List Area */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 flex flex-col gap-1">
        {isLoading && (
          <div className="flex flex-col gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 animate-pulse rounded-2xl">
                <div className="w-11 h-11 bg-zinc-200/60 rounded-full flex-shrink-0" />
                <div className="flex-1 flex flex-col gap-2">
                  <div className="w-24 h-3.5 bg-zinc-200/60 rounded" />
                  <div className="w-full h-3 bg-zinc-100/60 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center p-6 text-center gap-3 mt-10">
            <WarningCircle size={32} className="text-rose-500" />
            <p className="text-sm text-zinc-600">Failed to load conversations.</p>
            <button
              onClick={() => refetch()}
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
            >
              Try again
            </button>
          </div>
        )}

        {!isLoading && !isError && chats.length === 0 && (
          <div className="flex flex-col items-center justify-center p-6 text-center gap-3 mt-10">
            <ChatCircleDots size={32} className="text-zinc-300" weight="regular" />
            <p className="text-sm text-zinc-500">No conversations yet.</p>
            <Link to="/users" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">Find users to chat</Link>
          </div>
        )}

        {!isLoading && !isError && filteredChats.length > 0 && (
          <>
            {filteredChats.map((chat: Chat) => {
              const isActive = activeChatId === chat.id;
              const date = chat.lastMessageAt ? new Date(chat.lastMessageAt) : null;
              const timeString = date
                ? date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase()
                : '';

              return (
                <button
                  key={chat.id}
                  onClick={() => handleSelectChat(chat.id)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-2xl transition-colors text-left w-full border",
                    isActive 
                      ? "bg-zinc-100/80 border-zinc-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)]" 
                      : "border-transparent hover:bg-white"
                  )}
                >
                  <Avatar name={chat.otherUser.displayName} url={chat.otherUser.avatarUrl} className="w-11 h-11" />
                  <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                    <div className="flex justify-between items-baseline">
                      <h3 className="text-[14px] font-medium text-zinc-900 truncate pr-2">
                        {chat.otherUser.displayName}
                      </h3>
                      {timeString && (
                        <span className="text-[11px] text-zinc-400 flex-shrink-0">{timeString}</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <p className={cn(
                        "text-[13px] truncate pr-2",
                        isActive ? "text-zinc-600" : "text-zinc-500"
                      )}>
                        {chat.lastMessage?.content || 'Started a conversation'}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
            
            {hasNextPage && (
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="mt-2 py-2 text-[13px] text-zinc-500 font-medium hover:text-zinc-900 disabled:opacity-50 transition-colors"
              >
                {isFetchingNextPage ? 'Loading...' : 'Load older'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

