import { Link } from 'react-router-dom';
import { ChatCircleDots, UserPlus } from '@phosphor-icons/react';
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
        <div className="w-16 h-16 rounded-2xl bg-white border border-zinc-100 flex items-center justify-center mb-4 shadow-xs">
          <ChatCircleDots size={32} className="text-zinc-300" weight="regular" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-bold text-zinc-900 mb-1">Your Messages</h2>
        <p className="text-sm text-zinc-500 max-w-[280px] mb-5">
          Select a conversation from the sidebar or start a new one to begin chatting.
        </p>
        <Link
          to="/users"
          className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 text-xs font-semibold text-white bg-zinc-900 hover:bg-black rounded-xl transition-colors shadow-xs focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-none"
        >
          <UserPlus size={16} weight="bold" aria-hidden="true" />
          <span>Discover users</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent relative overflow-hidden">
      <ChatHeader chatId={activeChatId} />
      <MessageTimeline key={activeChatId} chatId={activeChatId} />
      <MessageComposer key={activeChatId} chatId={activeChatId} />
    </div>
  );
};
