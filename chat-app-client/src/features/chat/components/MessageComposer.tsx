import { useLayoutEffect, useRef, type FormEvent, type KeyboardEvent } from 'react';
import { PaperPlaneRight, CircleNotch, WarningCircle } from '@phosphor-icons/react';
import { useSendMessage } from '../hooks/useChats';
import { useStomp } from '@/lib/websocket/stompContext';
import { useAuthStore } from '@/features/auth/authStore';
import { draftKey, useDraftStore } from '../draftStore';
import { getApiErrorMessage } from '@/utils/error';

export const MessageComposer = ({ chatId }: { chatId: number }) => {
  const userId = useAuthStore((state) => state.user?.id ?? 0);
  const key = draftKey(userId, chatId);
  const content = useDraftStore((state) => state.drafts[key]?.content ?? '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const composingRef = useRef(false);
  const { status } = useStomp();
  const { mutate: sendMessage, isPending, isError, error, reset } = useSendMessage();
  const canSend = status === 'connected' && !isPending && !!content.trim();

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }, [content]);

  const handleSend = () => {
    if (!canSend || composingRef.current) return;
    const clientMessageId = useDraftStore.getState().prepare(key);
    sendMessage({ chatId, clientMessageId, content: content.trim() }, {
      onSuccess: () => {
        reset();
        textareaRef.current?.focus();
      },
    });
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    handleSend();
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.nativeEvent.isComposing || composingRef.current || event.keyCode === 229) return;
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <footer className="shrink-0 border-t border-zinc-200 bg-white p-3 sm:p-4 md:px-6 pb-[max(0.75rem,env(safe-area-inset-bottom))]" aria-label="Message composer">
      {isError && (
        <div role="alert" className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          <span className="flex min-w-0 items-center gap-2 [overflow-wrap:anywhere]">
            <WarningCircle size={18} className="shrink-0" aria-hidden="true" />
            {getApiErrorMessage(error, 'Could not send. Your draft is saved. Try again.')}
          </span>
          <button type="button" onClick={handleSend} disabled={!canSend} className="min-h-11 min-w-11 rounded-lg px-2 font-semibold underline focus-visible:ring-2 focus-visible:ring-rose-700 disabled:opacity-50">Retry</button>
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex items-end gap-2 rounded-2xl border border-zinc-300 bg-zinc-50 p-2 focus-within:border-zinc-700 focus-within:ring-2 focus-within:ring-zinc-700">
        <label htmlFor="message-textarea" className="sr-only">Write a message</label>
        <textarea
          id="message-textarea" ref={textareaRef} value={content} rows={1} maxLength={5000}
          placeholder="Write a message..."
          className="min-w-0 flex-1 resize-none overflow-y-auto bg-transparent px-2 py-2 text-base leading-relaxed text-zinc-900 placeholder-zinc-500 max-h-[120px]"
          onChange={(event) => {
            useDraftStore.getState().edit(key, event.target.value);
            if (isError) reset();
          }}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => { composingRef.current = true; }}
          onCompositionEnd={() => { composingRef.current = false; }}
          aria-describedby="composer-hint"
        />
        <button type="submit" disabled={!canSend} aria-label={isPending ? 'Sending message...' : 'Send message'} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white transition-colors hover:bg-black focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 disabled:bg-zinc-200 disabled:text-zinc-600">
          {isPending ? <CircleNotch size={18} className="animate-spin" aria-hidden="true" /> : <PaperPlaneRight size={18} weight="fill" aria-hidden="true" />}
        </button>
      </form>
      <p id="composer-hint" className="mt-2 text-xs text-zinc-600">
        {status !== 'connected'
          ? 'You can keep writing. Send when connected; messages are not queued automatically.'
          : 'Enter to send · Shift+Enter for a new line'}
      </p>
    </footer>
  );
};
