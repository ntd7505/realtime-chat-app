import { CaretLeft, User } from '@phosphor-icons/react';
import { useSearchParams, Link } from 'react-router-dom';
import { useChat } from '@/features/chat/hooks/useChats';
import { Avatar } from '@/components/ui/Avatar';

interface ChatHeaderProps {
  chatId: number;
}

export const ChatHeader = ({ chatId }: ChatHeaderProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: chat, isLoading, isError } = useChat(chatId);

  const handleBack = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('chat');
    setSearchParams(newParams);
  };

  if (isLoading) {
    return (
      <header
        className="h-[68px] md:h-[76px] flex items-center px-4 md:px-6 border-b border-zinc-200/60 bg-white/80 backdrop-blur-md shrink-0 animate-pulse"
        role="status"
        aria-label="Loading chat details"
      >
        <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-zinc-200/70" />
        <div className="ml-3.5 flex flex-col gap-2">
          <div className="w-32 h-4 bg-zinc-200/70 rounded" />
          <div className="w-16 h-3 bg-zinc-100/70 rounded" />
        </div>
      </header>
    );
  }

  if (isError || !chat) {
    return (
      <header className="h-[68px] md:h-[76px] flex items-center px-4 md:px-6 border-b border-zinc-200/60 bg-white/80 backdrop-blur-md shrink-0 justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleBack}
            className="md:hidden min-w-[44px] min-h-[44px] -ml-2 rounded-xl flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-none"
            aria-label="Back to conversations"
          >
            <CaretLeft size={22} weight="bold" />
          </button>
          <span className="text-xs font-semibold text-rose-600" role="alert">
            Failed to load conversation details
          </span>
        </div>
      </header>
    );
  }

  return (
    <header className="h-[68px] md:h-[76px] flex items-center justify-between px-4 md:px-6 border-b border-zinc-200/60 bg-white/80 backdrop-blur-md shrink-0 z-10">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        {/* Mobile Back Button */}
        <button
          type="button"
          onClick={handleBack}
          className="md:hidden min-w-[44px] min-h-[44px] -ml-2 rounded-xl flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-none"
          aria-label="Back to conversations"
        >
          <CaretLeft size={22} weight="bold" />
        </button>

        <Link
          to={`/users/${chat.otherUser.id}`}
          className="flex min-w-0 items-center gap-3 group rounded-xl p-1 -m-1 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-none"
          title={`View ${chat.otherUser.displayName}'s profile`}
        >
          <Avatar
            name={chat.otherUser.displayName}
            url={chat.otherUser.avatarUrl}
            className="w-10 h-10 md:w-11 md:h-11 shrink-0"
          />
          <div className="flex min-w-0 flex-col">
            <h2 className="truncate text-sm md:text-base font-semibold text-zinc-900 leading-tight group-hover:text-black transition-colors">
              {chat.otherUser.displayName}
            </h2>
            <span className="text-xs text-zinc-600 font-medium flex items-center gap-1 mt-0.5">
              Direct conversation
            </span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-1">
        <Link
          to={`/users/${chat.otherUser.id}`}
          className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-none"
          aria-label={`View ${chat.otherUser.displayName}'s profile`}
          title="View profile"
        >
          <User size={20} weight="bold" aria-hidden="true" />
        </Link>
      </div>
    </header>
  );
};
