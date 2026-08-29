import { useState, useRef, type FormEvent, type KeyboardEvent } from 'react';
import { PaperPlaneRight, CircleNotch, WarningCircle } from '@phosphor-icons/react';
import { useSendMessage } from '@/features/chat/hooks/useChats';
import { cn } from '@/lib/utils';

interface MessageComposerProps {
  chatId: number;
}

export const MessageComposer = ({ chatId }: MessageComposerProps) => {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pendingMessageRef = useRef<{
    chatId: number;
    clientMessageId: string;
    content: string;
  } | null>(null);
  const { mutate: sendMessage, isPending, isError, reset } = useSendMessage();

  const handleSend = () => {
    if (!content.trim() || isPending) return;

    const trimmedContent = content.trim();
    const pendingMessage = pendingMessageRef.current;
    const clientMessageId =
      pendingMessage?.chatId === chatId && pendingMessage.content === trimmedContent
        ? pendingMessage.clientMessageId
        : crypto.randomUUID();

    pendingMessageRef.current = { chatId, clientMessageId, content: trimmedContent };

    sendMessage(
      {
        chatId,
        clientMessageId,
        content: trimmedContent,
      },
      {
        onSuccess: () => {
          pendingMessageRef.current = null;
          setContent('');
          reset(); // Reset error state on success
          if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
          }
        },
      }
    );
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSend();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    // Auto-resize
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
    if (isError) {
      reset();
    }
  };

  return (
    <div className="p-4 md:p-6 bg-transparent flex-shrink-0 relative">
      {isError && (
        <div className="absolute -top-8 left-6 right-6 flex items-center gap-1.5 text-xs text-rose-500 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100 shadow-sm animate-in fade-in slide-in-from-bottom-2">
          <WarningCircle size={14} weight="bold" />
          <span>Failed to send message. Please try again.</span>
        </div>
      )}
      <form
        onSubmit={handleSubmit}
        className={cn(
          "flex items-end gap-2 bg-white rounded-[28px] p-2 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.04)] border",
          isError ? "border-rose-300 focus-within:border-rose-400 focus-within:ring-2 focus-within:ring-rose-100"
                  : "border-zinc-200 focus-within:border-zinc-400 focus-within:ring-2 focus-within:ring-zinc-100"
        )}
      >
        <textarea
          ref={textareaRef}
          className="flex-1 bg-transparent border-0 focus:ring-0 text-[14px] px-4 py-3 placeholder-zinc-400 text-zinc-900 outline-none min-w-0 resize-none max-h-[120px] overflow-y-auto"
          placeholder="Write a message..."
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={isPending}
          rows={1}
        />
        <button
          type="submit"
          disabled={!content.trim() || isPending}
          className="w-11 h-11 mb-0.5 mr-0.5 bg-zinc-900 rounded-full flex items-center justify-center text-white hover:bg-black transition-colors shadow-md disabled:opacity-50 flex-shrink-0 active:scale-[0.96]"
          aria-label="Send message"
        >
          {isPending ? (
            <CircleNotch size={18} weight="bold" className="animate-spin" />
          ) : (
            <PaperPlaneRight size={18} weight="fill" />
          )}
        </button>
      </form>
    </div>
  );
};
