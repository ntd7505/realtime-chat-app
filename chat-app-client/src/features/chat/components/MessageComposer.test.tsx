import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MessageComposer } from './MessageComposer';
import { useSendMessage } from '@/features/chat/hooks/useChats';
import { useStomp } from '@/lib/websocket/stompContext';
import { useDraftStore } from '../draftStore';

vi.mock('@/features/chat/hooks/useChats', () => ({
  useSendMessage: vi.fn(),
}));

vi.mock('@/lib/websocket/stompContext', () => ({
  useStomp: vi.fn(),
}));

describe('MessageComposer', () => {
  const sendMessage = vi.fn();
  const reset = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useDraftStore.setState({ drafts: {} });

    vi.mocked(useStomp).mockReturnValue({
      status: 'connected',
      subscribe: vi.fn(),
    } as never);

    vi.mocked(useSendMessage).mockReturnValue({
      mutate: sendMessage,
      isPending: false,
      isError: false,
      reset,
    } as never);
  });

  it('renders textarea with accessible label and disables send when empty', () => {
    render(<MessageComposer chatId={10} />);
    const textarea = screen.getByRole('textbox', { name: /write a message/i });
    const sendButton = screen.getByRole('button', { name: /send message/i });

    expect(textarea).toBeInTheDocument();
    expect(sendButton).toBeDisabled();
  });

  it('enables send button when text is typed, sends on click and resets input', async () => {
    const user = userEvent.setup();
    render(<MessageComposer chatId={10} />);

    const textarea = screen.getByRole('textbox', { name: /write a message/i });
    const sendButton = screen.getByRole('button', { name: /send message/i });

    await user.type(textarea, 'Hello world');
    expect(sendButton).not.toBeDisabled();

    await user.click(sendButton);
    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        chatId: 10,
        content: 'Hello world',
      }),
      expect.any(Object)
    );
  });

  it('sends on Enter and does not send on Shift+Enter', async () => {
    render(<MessageComposer chatId={10} />);
    const textarea = screen.getByRole('textbox', { name: /write a message/i });

    fireEvent.change(textarea, { target: { value: 'Multiline\nText' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });
    expect(sendMessage).not.toHaveBeenCalled();

    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        chatId: 10,
        content: 'Multiline\nText',
      }),
      expect.any(Object)
    );
  });

  it('shows reconnecting state when disconnected', () => {
    vi.mocked(useStomp).mockReturnValue({
      status: 'disconnected',
      subscribe: vi.fn(),
    } as never);

    render(<MessageComposer chatId={10} />);
    expect(screen.getByText(/send when connected/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send message/i })).toBeDisabled();
  });

  it('keeps drafts when moving between conversations', () => {
    const { rerender } = render(<MessageComposer key={10} chatId={10} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Draft A' } });
    rerender(<MessageComposer key={11} chatId={11} />);
    expect(screen.getByRole('textbox')).toHaveValue('');
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Draft B' } });
    rerender(<MessageComposer key={10} chatId={10} />);
    expect(screen.getByRole('textbox')).toHaveValue('Draft A');
  });

  it('allows typing while connecting but blocks publish via Enter and submit', () => {
    vi.mocked(useStomp).mockReturnValue({ status: 'connecting' } as never);
    render(<MessageComposer chatId={10} />);
    const input = screen.getByRole('textbox');
    expect(input).toBeEnabled();
    fireEvent.change(input, { target: { value: 'Offline draft' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.submit(input.closest('form')!);
    expect(sendMessage).not.toHaveBeenCalled();
    expect(input).toHaveValue('Offline draft');
  });

  it('does not send Enter used to confirm IME input', () => {
    render(<MessageComposer chatId={10} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '日本語' } });
    fireEvent.compositionStart(input);
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
    expect(sendMessage).not.toHaveBeenCalled();
    fireEvent.compositionEnd(input);
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(sendMessage).toHaveBeenCalledTimes(1);
  });
});
