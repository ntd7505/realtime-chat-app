import { useState, useRef, type FormEvent, type KeyboardEvent } from 'react';
import { PaperPlaneRight, CircleNotch, WarningCircle, WifiSlash } from '@phosphor-icons/react';
import { useSendMessage } from '@/features/chat/hooks/useChats';
import { useStomp } from '@/lib/websocket/stompContext';
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

  const { status: stompStatus } = useStomp();
  const isDisconnected = stompStatus === 'disconnected' || stompStatus === 'reconnecting';

  const { mutate: sendMessage, isPending, isError, reset } = useSendMessage();

  const handleSend = () => {
    const trimmedContent = content.trim();
    if (!trimmedContent || isPending) return;

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
          reset();
          if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.focus();
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

  const isSendDisabled = !content.trim() || isPending || isDisconnected;

  return (
    <footer
      className="p-3 sm:p-4 md:px-6 md:py-3.5 bg-white/70 backdrop-blur-md border-t border-zinc-200/60 shrink-0 relative"
      aria-label="Message composer"
    >
      {/* Error alert */}
      {isError && (
        <div
          role="alert"
          className="absolute -top-11 left-4 right-4 sm:left-6 sm:right-6 flex items-center justify-between gap-2 text-xs font-medium text-rose-700 bg-rose-50/95 border border-rose-200 px-3.5 py-2 rounded-xl shadow-xs backdrop-blur-xs"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <WarningCircle size={15} weight="bold" className="shrink-0 text-rose-600" aria-hidden="true" />
            <span className="truncate">Failed to send message. Please try again.</span>
          </div>
          <button
            type="button"
            onClick={handleSend}
            className="shrink-0 text-xs font-bold text-rose-800 hover:text-rose-950 underline px-1 focus-visible:outline-none"
          >
            Retry
          </button>
        </div>
      )}

      {/* Disconnected alert */}
      {isDisconnected && !isError && (
        <div
          role="status"
          aria-live="polite"
          className="absolute -top-11 left-4 right-4 sm:left-6 sm:right-6 flex items-center gap-2 text-xs font-medium text-amber-800 bg-amber-50/95 border border-amber-200 px-3.5 py-2 rounded-xl shadow-xs backdrop-blur-xs"
        >
          <WifiSlash size={15} weight="bold" className="shrink-0 text-amber-600" aria-hidden="true" />
          <span>Realtime is reconnecting. Messages will be sent once restored.</span>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className={cn(
          "flex items-end gap-2 bg-zinc-50/90 hover:bg-zinc-100/70 focus-within:bg-white rounded-2xl p-1.5 sm:p-2 transition-all duration-150 border",
          isError
            ? "border-rose-300 ring-2 ring-rose-100"
            : "border-zinc-200/90 focus-within:border-zinc-400 focus-within:ring-2 focus-within:ring-zinc-900/10 shadow-2xs"
        )}
      >
        <label htmlFor="message-textarea" className="sr-only">
          Write a message
        </label>
        <textarea
          id="message-textarea"
          ref={textareaRef}
          className="flex-1 bg-transparent border-none outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 text-sm px-3.5 py-2 text-zinc-900 placeholder-zinc-400 min-w-0 resize-none max-h-[120px] overflow-y-auto leading-relaxed"
          placeholder="Write a message..."
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={isPending || isDisconnected}
          rows={1}
          aria-label="Write a message"
        />

        <div className="flex items-center gap-2 shrink-0 pb-0.5 pr-0.5">
          <span
            className="hidden sm:inline-block text-[11px] text-zinc-400 select-none pr-1"
            title="Press Enter to send, Shift+Enter for new line"
          >
            Enter ↵
          </span>

          <button
            type="submit"
            disabled={isSendDisabled}
            className={cn(
              "min-w-[40px] min-h-[40px] w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150 shrink-0 active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-none",
              isSendDisabled
                ? "bg-zinc-200/70 text-zinc-400 cursor-not-allowed"
                : "bg-zinc-900 text-white hover:bg-black shadow-2xs"
            )}
            aria-label={isPending ? 'Sending message...' : 'Send message'}
            title={isPending ? 'Sending...' : 'Send message (Enter)'}
          >
            {isPending ? (
              <CircleNotch size={17} weight="bold" className="animate-spin" aria-hidden="true" />
            ) : (
              <PaperPlaneRight size={17} weight="fill" aria-hidden="true" />
            )}
          </button>
        </div>
      </form>
    </footer>
  );
};
