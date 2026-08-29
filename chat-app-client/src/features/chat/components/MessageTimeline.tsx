import { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/authStore';
import { useStomp } from '@/lib/websocket/stompContext';
import { useMessages, chatKeys } from '@/features/chat/hooks/useChats';
import { WarningCircle, ChatCircleDots } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { Message } from '@/features/chat/chat.types';
import { Avatar } from '@/components/ui/Avatar';

interface MessageTimelineProps {
  chatId: number;
}

export const MessageTimeline = ({ chatId }: MessageTimelineProps) => {
  const currentUser = useAuthStore((state) => state.user);
  const { subscribe } = useStomp();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage, refetch } = useMessages(chatId);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [lastScrollHeight, setLastScrollHeight] = useState<number>(0);

  useEffect(() => {
    if (!currentUser || chatId <= 0) return;

    return subscribe(`/topic/chats/${chatId}`, () => {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: chatKeys.messages(currentUser.id, chatId) }),
        queryClient.invalidateQueries({ queryKey: chatKeys.lists(currentUser.id) }),
        queryClient.invalidateQueries({
          queryKey: chatKeys.detail(currentUser.id, chatId),
          exact: true,
        }),
      ]);
    });
  }, [chatId, currentUser, queryClient, subscribe]);

  const messages = data?.pages.flatMap((page) => page.items).reverse() ?? [];

  const handleFetchNextPage = async () => {
    if (scrollContainerRef.current) {
      setLastScrollHeight(scrollContainerRef.current.scrollHeight);
    }
    await fetchNextPage();
  };

  useLayoutEffect(() => {
    if (scrollContainerRef.current && isFetchingNextPage) {
      // Maintain scroll position when old messages are loaded at the top
      const scrollDiff = scrollContainerRef.current.scrollHeight - lastScrollHeight;
      if (scrollDiff > 0) {
        scrollContainerRef.current.scrollTop += scrollDiff;
      }
    } else if (!isFetchingNextPage && messages.length > 0 && lastScrollHeight === 0) {
      // Scroll to bottom on initial load
      bottomRef.current?.scrollIntoView();
    }
  }, [messages.length, isFetchingNextPage, lastScrollHeight]);

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-6">
        {Array.from({ length: 4 }).map((_, i) => {
          const isMe = i % 2 !== 0;
          return (
            <div key={i} className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}>
              <div className={cn(
                "w-2/3 md:w-1/2 h-16 rounded-3xl animate-pulse",
                isMe ? "bg-zinc-100 rounded-br-sm" : "bg-zinc-900/10 rounded-bl-sm"
              )} />
            </div>
          );
        })}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-3">
        <WarningCircle size={32} className="text-rose-500" />
        <p className="text-sm text-zinc-600">Failed to load messages.</p>
        <button
          onClick={() => refetch()}
          className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-6 relative scroll-smooth">
      {hasNextPage && (
        <div className="flex justify-center mb-4">
          <button
            onClick={handleFetchNextPage}
            disabled={isFetchingNextPage}
            className="px-4 py-2 text-xs font-medium bg-white border border-zinc-200 rounded-full text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors disabled:opacity-50 shadow-sm"
          >
            {isFetchingNextPage ? 'Loading older...' : 'Load older messages'}
          </button>
        </div>
      )}

      {messages.length === 0 && !hasNextPage ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
          <ChatCircleDots size={32} className="text-zinc-300" weight="regular" />
          <p className="text-sm text-zinc-500">No messages yet.<br/>Say hi to start the conversation.</p>
        </div>
      ) : (
        messages.map((message: Message, index: number) => {
          const isMe = message.sender.id === currentUser?.id;
          const showAvatar = !isMe && (index === messages.length - 1 || messages[index + 1]?.sender.id === currentUser?.id);
          const date = new Date(message.createdAt);
          const timeString = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase();

          return (
            <div key={message.id || message.clientMessageId} className={cn(
              "flex flex-col max-w-[85%] md:max-w-[70%]",
              isMe ? "items-end self-end" : "items-start self-start"
            )}>
              <div className={cn("flex items-end gap-3 w-full", isMe ? "flex-row-reverse" : "flex-row")}>
                {!isMe && showAvatar && (
                  <Avatar 
                    name={message.sender.displayName} 
                    url={message.sender.avatarUrl} 
                    className="w-8 h-8 flex-shrink-0 mb-1" 
                  />
                )}
                {!isMe && !showAvatar && (
                  <div className="w-8 h-8 flex-shrink-0 mb-1" />
                )}

                <div className={cn(
                  "px-5 py-3.5 rounded-3xl text-[14px] leading-relaxed shadow-sm break-words w-full",
                  isMe
                    ? "bg-white text-zinc-900 rounded-br-sm border border-zinc-100"
                    : "bg-zinc-900 text-white rounded-bl-sm"
                )}>
                  {message.content}
                </div>
              </div>
              <span className={cn(
                "text-[11px] text-zinc-400 mt-1.5",
                isMe ? "mr-2" : "ml-11"
              )}>
                {timeString}
              </span>
            </div>
          );
        })
      )}

      {/* Scroll anchor */}
      <div ref={bottomRef} className="h-px w-full" />
    </div>
  );
};
