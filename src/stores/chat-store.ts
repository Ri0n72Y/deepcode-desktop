import { create } from "zustand";
import type { SessionMessage } from "../lib/runtime/types";

type ChatState = {
  messages: SessionMessage[];
  activeSessionId: string | null;
  replaceSession: (sessionId: string | null, messages: SessionMessage[]) => void;
  appendMessage: (message: SessionMessage) => void;
  appendUserText: (text: string) => void;
  clear: () => void;
};

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  activeSessionId: null,
  replaceSession: (activeSessionId, messages) => set({ activeSessionId, messages }),
  appendMessage: (message) =>
    set((state) => ({
      messages: state.messages.some((item) => item.id === message.id) ? state.messages : [...state.messages, message],
    })),
  appendUserText: (text) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: `user-${Date.now()}`,
          sessionId: state.activeSessionId ?? undefined,
          role: "user",
          content: text,
          visible: true,
          createTime: new Date().toISOString(),
        },
      ],
    })),
  clear: () => set({ messages: [], activeSessionId: null }),
}));
