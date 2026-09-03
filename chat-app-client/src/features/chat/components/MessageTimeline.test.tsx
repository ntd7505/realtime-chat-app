import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MessageTimeline } from './MessageTimeline';
import { useAuthStore } from '@/features/auth/authStore';
import { useStomp } from '@/lib/websocket/stompContext';
import { useMessages, useSendMessage } from '@/features/chat/hooks/useChats';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock dependencies
vi.mock('@/features/auth/authStore', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('@/lib/websocket/stompContext', () => ({
  useStomp: vi.fn(),
}));

vi.mock('@/features/chat/hooks/useChats', () => ({
  useMessages: vi.fn(),
  useSendMessage: vi.fn(),
  chatKeys: {
    messages: vi.fn().mockReturnValue(['messages']),
    lists: vi.fn().mockReturnValue(['lists']),
    detail: vi.fn().mockReturnValue(['detail']),
  }
}));

// Mock scroll properties on HTMLElement
Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { configurable: true, value: 500 });
Object.defineProperty(HTMLElement.prototype, 'scrollTop', { configurable: true, value: 0, writable: true });
Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 300 });
HTMLElement.prototype.scrollTo = vi.fn();

const createMockMessage = (id: number, content: string) => ({
  id,
  clientMessageId: `msg-${id}`,
  sender: { id: 1, displayName: 'User', avatarUrl: '' },
  content,
  createdAt: new Date().toISOString(),
});

describe('MessageTimeline Auto-Scroll Regression', () => {
  let queryClient: QueryClient;
  const mockUser = { id: 1, displayName: 'User', avatarUrl: '' };
  const mockSubscribe = vi.fn();
  
  beforeEach(() => {
    queryClient = new QueryClient();
    vi.clearAllMocks();
    
    // Default mocks
    (useAuthStore as any).mockReturnValue(mockUser);
    (useStomp as any).mockReturnValue({ subscribe: mockSubscribe });
    (useSendMessage as any).mockReturnValue({ mutate: vi.fn() });
    
    // Reset scroll values
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { configurable: true, value: 500 });
    HTMLElement.prototype.scrollTo = vi.fn(function(this: HTMLElement, options: any) {
      if (options && options.top !== undefined) {
        this.scrollTop = options.top;
      }
    });
  });

  const renderComponent = (mockData: any, overrides = {}) => {
    (useMessages as any).mockReturnValue({
      data: mockData,
      isLoading: false,
      isError: false,
      hasNextPage: true, // true to show button
      fetchNextPage: vi.fn(),
      isFetchingNextPage: false,
      refetch: vi.fn(),
      ...overrides
    });
    
    return render(
      <MessageTimeline chatId={1} />,
      {
        wrapper: function Wrapper({ children }: any) {
          return (
            <QueryClientProvider client={queryClient}>
              {children}
            </QueryClientProvider>
          );
        }
      }
    );
  };

  it('1. Mở conversation lần đầu phải nằm cuối timeline', () => {
    const mockData = { pages: [{ items: [createMockMessage(1, 'Hello')] }] };
    renderComponent(mockData);
    
    expect(HTMLElement.prototype.scrollTo).toHaveBeenCalledWith({
      top: 500,
      behavior: 'auto'
    });
  });

  it('2. Cuộn lên quá threshold 150px rồi chờ một render cycle: scrollTop không thay đổi', async () => {
    const mockData = { pages: [{ items: [createMockMessage(1, 'Hello')] }] };
    const { container, rerender } = renderComponent(mockData);
    
    const scrollContainer = container.querySelector('.overflow-y-auto') as HTMLElement;
    
    // Simulate scroll up
    act(() => {
      scrollContainer.scrollTop = 100; // 500 - 100 - 300 = 100px from bottom (isNearBottom = true initially, but wait, threshold is 150px)
      // wait let's make it clearly far from bottom:
      scrollContainer.scrollTop = 0; // 500 - 0 - 300 = 200px > 150px => isNearBottom = false
      // dispatch scroll event
      scrollContainer.dispatchEvent(new Event('scroll'));
    });
    
    // Rerender with same data
    (HTMLElement.prototype.scrollTo as any).mockClear();
    
    rerender(<MessageTimeline chatId={1} />);
    
    expect(HTMLElement.prototype.scrollTo).not.toHaveBeenCalled();
    expect(scrollContainer.scrollTop).toBe(0);
  });

  it('3. Đang đọc lịch sử, có tin nhắn mới: không bị kéo xuống', () => {
    const mockData = { pages: [{ items: [createMockMessage(1, 'Hello')] }] };
    const { container, rerender } = renderComponent(mockData);
    const scrollContainer = container.querySelector('.overflow-y-auto') as HTMLElement;
    
    // Simulate scroll up (reading history)
    act(() => {
      scrollContainer.scrollTop = 50; // Distance from bottom = 150, which is threshold? Wait. 500-50-300 = 150. Make it 0.
      scrollContainer.scrollTop = 0; 
      scrollContainer.dispatchEvent(new Event('scroll'));
    });
    
    (HTMLElement.prototype.scrollTo as any).mockClear();
    
    // New message arrives
    const newData = { pages: [{ items: [createMockMessage(2, 'New msg'), createMockMessage(1, 'Hello')] }] };
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { value: 600 }); // height increases
    
    (useMessages as any).mockReturnValue({
      data: newData,
      isLoading: false,
      isError: false,
    });
    
    rerender(<MessageTimeline chatId={1} />);
    
    // Should NOT scroll to bottom
    expect(HTMLElement.prototype.scrollTo).not.toHaveBeenCalledWith(expect.objectContaining({ top: 600 }));
    expect(scrollContainer.scrollTop).toBe(0);
  });

  it('4. Đang gần cuối, có tin nhắn mới: tự cuộn xuống', () => {
    const mockData = { pages: [{ items: [createMockMessage(1, 'Hello')] }] };
    const { container, rerender } = renderComponent(mockData);
    const scrollContainer = container.querySelector('.overflow-y-auto') as HTMLElement;
    
    // Simulate scroll to near bottom
    act(() => {
      scrollContainer.scrollTop = 180; // 500 - 180 - 300 = 20px from bottom (< 150)
      scrollContainer.dispatchEvent(new Event('scroll'));
    });
    
    (HTMLElement.prototype.scrollTo as any).mockClear();
    
    // New message arrives
    const newData = { pages: [{ items: [createMockMessage(2, 'New msg'), createMockMessage(1, 'Hello')] }] };
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { value: 600 });
    
    (useMessages as any).mockReturnValue({
      data: newData,
      isLoading: false,
      isError: false,
    });
    
    rerender(<MessageTimeline chatId={1} />);
    
    // Should scroll to bottom
    expect(HTMLElement.prototype.scrollTo).toHaveBeenCalledWith({ top: 600, behavior: 'smooth' });
  });

  it('5. Load tin nhắn cũ: giữ nguyên message đang nhìn', () => {
    const mockData = { pages: [{ items: [createMockMessage(2, 'Recent')] }] };
    const { container, rerender } = renderComponent(mockData);
    const scrollContainer = container.querySelector('.overflow-y-auto') as HTMLElement;
    
    act(() => {
      scrollContainer.scrollTop = 0;
      scrollContainer.dispatchEvent(new Event('scroll'));
    });
    
    // Load older messages (click button)
    const loadButton = screen.getByText('Load older messages');
    act(() => {
      loadButton.click();
    });
    
    // the button click calls fetchNextPage, and sets prependSnapshotRef
    
    (useMessages as any).mockReturnValue({
      data: mockData,
      isLoading: false,
      isError: false,
      isFetchingNextPage: true, // During fetch
    });
    rerender(<MessageTimeline chatId={1} />);
    
    // Fetch completes, height increases, data prepends
    const newData = { pages: [
      { items: [createMockMessage(2, 'Recent')] },
      { items: [createMockMessage(1, 'Older')] }
    ] };
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { value: 800 }); // Grew by 300
    
    (useMessages as any).mockReturnValue({
      data: newData,
      isLoading: false,
      isError: false,
      isFetchingNextPage: false,
      hasNextPage: false
    });
    
    rerender(<MessageTimeline chatId={1} />);
    
    // Should adjust scrollTop to maintain visual position
    // previousScrollTop (0) + (newScrollHeight (800) - previousScrollHeight (500)) = 300
    expect(scrollContainer.scrollTop).toBe(300);
    // Should NOT scroll to bottom
    expect(HTMLElement.prototype.scrollTo).not.toHaveBeenCalledWith(expect.objectContaining({ behavior: 'smooth' }));
  });

  it('6. Chuyển conversation: conversation mới được đặt xuống cuối một lần', () => {
    const mockData = { pages: [{ items: [createMockMessage(1, 'Hello')] }] };
    renderComponent(mockData);
    
    (HTMLElement.prototype.scrollTo as any).mockClear();
    
    // Change chatId
    render(
      <QueryClientProvider client={queryClient}>
        <MessageTimeline chatId={2} />
      </QueryClientProvider>
    );
    
    expect(HTMLElement.prototype.scrollTo).toHaveBeenCalledWith({ top: 500, behavior: 'auto' });
  });
});
