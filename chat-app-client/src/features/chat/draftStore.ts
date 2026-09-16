import { create } from 'zustand';
import { useAuthStore } from '@/features/auth/authStore';

interface Draft { content: string; clientMessageId?: string }
interface DraftState {
  drafts: Record<string, Draft>;
  edit: (key: string, content: string) => void;
  prepare: (key: string) => string;
  confirm: (key: string, clientMessageId: string) => void;
}

export const draftKey = (userId: number, chatId: number) => `${userId}:${chatId}`;

export const useDraftStore = create<DraftState>((set, get) => ({
  drafts: {},
  edit: (key, content) => set((state) => ({ drafts: { ...state.drafts, [key]: { content } } })),
  prepare: (key) => {
    const draft = get().drafts[key] ?? { content: '' };
    const clientMessageId = draft.clientMessageId ?? crypto.randomUUID();
    set((state) => ({ drafts: { ...state.drafts, [key]: { ...draft, clientMessageId } } }));
    return clientMessageId;
  },
  confirm: (key, clientMessageId) => set((state) => {
    if (state.drafts[key]?.clientMessageId !== clientMessageId) return state;
    const drafts = { ...state.drafts };
    delete drafts[key];
    return { drafts };
  }),
}));

// In-memory drafts survive navigation, but never cross an account/session boundary.
useAuthStore.subscribe((state, previous) => {
  if (state.user?.id !== previous.user?.id || state.status === 'unauthenticated') {
    useDraftStore.setState({ drafts: {} });
  }
});
