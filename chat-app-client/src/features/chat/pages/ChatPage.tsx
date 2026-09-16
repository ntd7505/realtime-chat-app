import { useSearchParams } from 'react-router-dom';
import { ConversationList } from '@/features/chat/components/ConversationList';
import { ChatArea } from '@/features/chat/components/ChatArea';
import { cn } from '@/lib/utils';

export const ChatPage = () => {
  const [searchParams] = useSearchParams();
  const chatIdParam = searchParams.get('chat');
  const parsedChatId = chatIdParam ? Number(chatIdParam) : null;
  const activeChatId =
    parsedChatId !== null && Number.isInteger(parsedChatId) && parsedChatId > 0
      ? parsedChatId
      : null;
  const isChatActive = activeChatId !== null;

  return (
    <div className="flex w-full h-full relative">
      {/* Mobile logic: if chat is active, hide conversation list on mobile. Show on md+ */}
      <div className={cn(
        "flex-shrink-0 w-full md:w-[320px] lg:w-[340px] border-r border-zinc-200/50 flex flex-col relative z-10",
        isChatActive ? "hidden md:flex" : "flex"
      )}>
        <ConversationList activeChatId={activeChatId} />
      </div>

      {/* Chat Area */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 bg-white/50 relative",
        !isChatActive ? "hidden md:flex" : "flex"
      )}>
        <ChatArea activeChatId={activeChatId} />
      </div>
    </div>
  );
};
