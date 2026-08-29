import { useSearchParams } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
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
    <div className="flex items-center justify-center w-full min-h-[100dvh] bg-[#d8eee2] text-zinc-900 font-sans md:p-6 lg:p-8">
      <div className="flex w-full h-[100dvh] md:h-[calc(100dvh-3rem)] md:max-h-[850px] md:max-w-[1200px] md:rounded-[32px] overflow-hidden bg-gradient-to-br from-[#fdfbf7] to-[#f4f6f1] md:shadow-[0_20px_40px_rgba(0,0,0,0.05)] md:border md:border-white/50 relative">
        <Sidebar />

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
    </div>
  );
};
