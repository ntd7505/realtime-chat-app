import { CaretLeft } from '@phosphor-icons/react';
import { useSearchParams } from 'react-router-dom';
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
      <header className="h-[72px] md:h-[88px] flex items-center px-4 md:px-8 border-b border-zinc-200/50 bg-white/40 flex-shrink-0 animate-pulse">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-zinc-200/60" />
        <div className="ml-4 flex flex-col gap-2">
          <div className="w-32 h-4 bg-zinc-200/60 rounded" />
          <div className="w-16 h-3 bg-zinc-100/60 rounded" />
        </div>
      </header>
    );
  }

  if (isError || !chat) {
    return (
      <header className="h-[72px] md:h-[88px] flex items-center px-4 md:px-8 border-b border-zinc-200/50 bg-white/40 flex-shrink-0">
        <button
          onClick={handleBack}
          className="md:hidden mr-3 text-zinc-500 hover:text-zinc-900"
        >
          <CaretLeft size={24} weight="bold" />
        </button>
        <span className="text-sm font-medium text-rose-500">Failed to load chat</span>
      </header>
    );
  }

  return (
    <header className="h-[72px] md:h-[88px] flex items-center justify-between px-4 md:px-8 border-b border-zinc-200/50 bg-white/40 flex-shrink-0">
      <div className="flex items-center gap-3 md:gap-4">
        {/* Mobile Back Button */}
        <button
          onClick={handleBack}
          className="md:hidden p-2 -ml-2 text-zinc-500 hover:text-zinc-900 hover:bg-white/60 rounded-lg transition-colors"
          aria-label="Back to conversations"
        >
          <CaretLeft size={24} weight="bold" />
        </button>

        <Avatar 
          name={chat.otherUser.displayName} 
          url={chat.otherUser.avatarUrl} 
          className="w-10 h-10 md:w-12 md:h-12" 
        />
        <div>
          <h2 className="text-base md:text-[18px] font-medium text-zinc-900 leading-tight">
            {chat.otherUser.displayName}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Actions removed because they are unsupported */}
      </div>
    </header>
  );
};

