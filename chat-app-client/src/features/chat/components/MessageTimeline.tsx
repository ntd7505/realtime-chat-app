import { useEffect, useRef, useState, useLayoutEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/authStore';
import { useStomp } from '@/lib/websocket/stompContext';
import { useMessages, chatKeys, useSendMessage } from '@/features/chat/hooks/useChats';
import { WarningCircle, ChatCircleDots, Clock, ArrowCounterClockwise, ArrowDown } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { Message } from '@/features/chat/chat.types';
import { Avatar } from '@/components/ui/Avatar';

interface MessageTimelineProps {
  chatId: number;
}

function formatDateSeparator(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function isSameDay(d1: string, d2: string): boolean {
  return new Date(d1).toDateString() === new Date(d2).toDateString();
}

export const MessageTimeline = ({ chatId }: MessageTimelineProps) => {
  const currentUser = useAuthStore((state) => state.user);
  const { subscribe } = useStomp();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage, refetch } = useMessages(chatId);
  const { mutate: sendMessage } = useSendMessage();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [hasNewMessageIndicator, setHasNewMessageIndicator] = useState(false);

  // Ref 1: Chỉ auto-scroll lần đầu
  const hasInitialScrolledRef = useRef(false);
  // Ref 2: Lưu vị trí người dùng trước khi dữ liệu thay đổi
  const wasNearBottomRef = useRef(true);
  // Ref 3: Giữ scrollHeight và scrollTop trước khi load lịch sử
  const prependSnapshotRef = useRef<{ scrollTop: number; scrollHeight: number } | null>(null);
  // Ref 4: Phân biệt message mới với render thông thường
  const previousLastMessageIdRef = useRef<string | number | null>(null);



  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const threshold = 150;
    const isNear = target.scrollHeight - target.scrollTop - target.clientHeight < threshold;
    wasNearBottomRef.current = isNear;

    if (isNear && hasNewMessageIndicator) {
      setHasNewMessageIndicator(false);
    }
  };

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

  const messages = useMemo(() => {
    return data?.pages.flatMap((page) => page.items).reverse() ?? [];
  }, [data]);

  const handleFetchNextPage = async () => {
    if (scrollContainerRef.current) {
      prependSnapshotRef.current = {
        scrollTop: scrollContainerRef.current.scrollTop,
        scrollHeight: scrollContainerRef.current.scrollHeight,
      };
    }
    await fetchNextPage();
  };

  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    const currentLastMessageId = lastMessage.id || lastMessage.clientMessageId;

    if (isFetchingNextPage) {
      return;
    }

    // 1. Giữ vị trí khi load tin cũ
    if (prependSnapshotRef.current) {
      const { scrollTop: previousScrollTop, scrollHeight: previousScrollHeight } = prependSnapshotRef.current;
      const newScrollHeight = container.scrollHeight;
      container.scrollTo({
        top: previousScrollTop + (newScrollHeight - previousScrollHeight),
        behavior: 'auto',
      });
      prependSnapshotRef.current = null;
      return;
    }

    // 2. Chỉ auto-scroll lần đầu đúng một lần
    if (!hasInitialScrolledRef.current) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'auto' });
      hasInitialScrolledRef.current = true;
      previousLastMessageIdRef.current = currentLastMessageId;
      return;
    }

    // 3. Xử lý message mới
    if (previousLastMessageIdRef.current !== currentLastMessageId) {
      if (wasNearBottomRef.current) {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      } else {
        setHasNewMessageIndicator(true);
      }
      previousLastMessageIdRef.current = currentLastMessageId;
    }
  }, [messages, isFetchingNextPage]);

  const scrollToBottom = () => {
    setHasNewMessageIndicator(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-4" role="status" aria-label="Loading messages">
        {Array.from({ length: 5 }).map((_, i) => {
          const isMe = i % 2 !== 0;
          return (
            <div key={i} className={cn("flex w-full items-end gap-2.5", isMe ? "justify-end" : "justify-start")}>
              {!isMe && <div className="w-8 h-8 rounded-full bg-zinc-200/70 animate-pulse shrink-0" />}
              <div
                className={cn(
                  "h-12 rounded-2xl animate-pulse",
                  isMe ? "w-2/5 bg-zinc-200/80 rounded-br-sm" : "w-1/2 bg-zinc-200/60 rounded-bl-sm"
                )}
              />
            </div>
          );
        })}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-3" role="alert">
        <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
          <WarningCircle size={24} weight="bold" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-zinc-900">Failed to load messages</p>
          <p className="text-xs text-zinc-500">Please check your network and try again.</p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="min-h-[44px] px-4 py-2 text-xs font-semibold text-zinc-900 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-none"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-4 relative"
      tabIndex={0}
      aria-label="Message history"
    >
      {hasNextPage && (
        <div className="flex justify-center mb-2">
          <button
            type="button"
            onClick={handleFetchNextPage}
            disabled={isFetchingNextPage}
            className="min-h-[36px] px-4 py-1.5 text-xs font-medium bg-white/90 backdrop-blur-sm border border-zinc-200 rounded-full text-zinc-600 hover:bg-white hover:text-zinc-900 transition-colors disabled:opacity-50 shadow-xs focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-none"
          >
            {isFetchingNextPage ? 'Loading older messages...' : 'Load older messages'}
          </button>
        </div>
      )}

      {messages.length === 0 && !hasNextPage ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center py-12">
          <div className="w-12 h-12 rounded-2xl bg-white border border-zinc-100 flex items-center justify-center shadow-xs">
            <ChatCircleDots size={24} className="text-zinc-400" weight="regular" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-zinc-900">No messages yet</p>
            <p className="text-xs text-zinc-500">Send a greeting to start the conversation.</p>
          </div>
        </div>
      ) : (
        messages.map((message: Message, index: number) => {
          const isMe = message.sender.id === currentUser?.id;
          const prevMessage = messages[index - 1];
          const nextMessage = messages[index + 1];

          // Show date separator if first message or different day from previous
          const showDateSeparator = !prevMessage || !isSameDay(prevMessage.createdAt, message.createdAt);

          // Grouping logic: is consecutive message from same sender within 5 minutes
          const isSameSenderAsNext = nextMessage && nextMessage.sender.id === message.sender.id;
          const isWithin5MinOfNext =
            isSameSenderAsNext &&
            Math.abs(new Date(nextMessage.createdAt).getTime() - new Date(message.createdAt).getTime()) < 5 * 60 * 1000;
          const showAvatar = !isMe && !isWithin5MinOfNext;

          const date = new Date(message.createdAt);
          const timeString = isNaN(date.getTime())
            ? ''
            : date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase();

          return (
            <div key={message.id || message.clientMessageId} className="flex flex-col">
              {showDateSeparator && (
                <div className="flex justify-center my-3" aria-label={`Date: ${formatDateSeparator(message.createdAt)}`}>
                  <span className="text-[11px] font-medium text-zinc-500 bg-white/80 backdrop-blur-xs border border-zinc-200/70 px-3 py-1 rounded-full shadow-2xs">
                    {formatDateSeparator(message.createdAt)}
                  </span>
                </div>
              )}

              <div
                className={cn(
                  "flex flex-col max-w-[85%] sm:max-w-[75%] md:max-w-[70%]",
                  isMe ? "items-end self-end" : "items-start self-start",
                  isWithin5MinOfNext ? "mb-1" : "mb-3"
                )}
              >
                <div className={cn("flex items-end gap-2.5 w-full", isMe ? "flex-row-reverse" : "flex-row")}>
                  {!isMe && (
                    <div className="w-8 shrink-0 mb-0.5">
                      {showAvatar ? (
                        <Avatar
                          name={message.sender.displayName}
                          url={message.sender.avatarUrl}
                          className="w-8 h-8"
                        />
                      ) : (
                        <div className="w-8 h-8" aria-hidden="true" />
                      )}
                    </div>
                  )}

                  <div
                    className={cn(
                      "px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed shadow-2xs break-words max-w-full transition-opacity duration-150",
                      isMe
                        ? "bg-zinc-900 text-white rounded-br-xs"
                        : "bg-white text-zinc-900 rounded-bl-xs border border-zinc-200/80",
                      message.status === 'sending' && "opacity-60",
                      message.status === 'failed' && "border-rose-300 bg-rose-50 text-rose-900"
                    )}
                  >
                    {message.content}
                  </div>
                </div>

                <div
                  className={cn(
                    "flex items-center gap-1.5 mt-1 text-[11px]",
                    isMe ? "mr-1 text-zinc-400" : "ml-10 text-zinc-400"
                  )}
                >
                  {message.status === 'sending' && (
                    <span className="flex items-center gap-1 text-zinc-500">
                      <Clock size={12} aria-hidden="true" /> Sending...
                    </span>
                  )}
                  {message.status === 'failed' && (
                    <span className="flex items-center gap-1.5 text-rose-600 font-medium" role="alert">
                      <WarningCircle size={12} weight="bold" aria-hidden="true" />
                      Failed to send
                      <button
                        type="button"
                        onClick={() => sendMessage({ chatId, content: message.content, clientMessageId: message.clientMessageId })}
                        className="inline-flex items-center gap-1 min-h-[32px] px-1 text-rose-700 hover:text-rose-900 hover:underline font-semibold focus-visible:outline-none"
                      >
                        <ArrowCounterClockwise size={12} weight="bold" aria-hidden="true" /> Retry
                      </button>
                    </span>
                  )}
                  {message.status !== 'sending' && message.status !== 'failed' && timeString && (
                    <span>{timeString}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}

      {/* New message indicator */}
      {hasNewMessageIndicator && (
        <button
          type="button"
          onClick={scrollToBottom}
          className="sticky bottom-2 mx-auto bg-zinc-900 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg hover:bg-black transition-all z-30 flex items-center gap-1.5 min-h-[36px] focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 focus-visible:outline-none"
          aria-label="Scroll to new messages"
        >
          <span>New messages</span>
          <ArrowDown size={14} weight="bold" aria-hidden="true" />
        </button>
      )}

      {/* Scroll anchor */}
      <div ref={bottomRef} className="h-px w-full shrink-0" aria-hidden="true" />
    </div>
  );
};
