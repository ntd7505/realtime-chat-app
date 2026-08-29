import { ChatCircleDots } from '@phosphor-icons/react';
import { ChatHeader } from './ChatHeader';
import { MessageTimeline } from './MessageTimeline';
import { MessageComposer } from './MessageComposer';

interface ChatAreaProps {
  activeChatId: number | null;
}

export const ChatArea = ({ activeChatId }: ChatAreaProps) => {
  if (!activeChatId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-transparent p-6 text-center h-full">
        <div className="w-16 h-16 rounded-2xl bg-white border border-zinc-100 flex items-center justify-center mb-4 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
          <ChatCircleDots size={32} className="text-zinc-300" weight="regular" />
        </div>
        <h3 className="text-lg font-medium text-zinc-900 mb-1">Your Messages</h3>
        <p className="text-sm text-zinc-500 max-w-[280px]">
          Select a conversation from the sidebar or start a new one to begin chatting.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent relative">
      <ChatHeader chatId={activeChatId} />
      <MessageTimeline chatId={activeChatId} />
      <MessageComposer key={activeChatId} chatId={activeChatId} />
    </div>
  );
};
