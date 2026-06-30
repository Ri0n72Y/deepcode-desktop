import { create } from "zustand";
import type { SessionMessage } from "../lib/runtime/types";

type ChatState = {
  messages: SessionMessage[];
  activeSessionId: string | null;
  replaceSession: (sessionId: string | null, messages: SessionMessage[]) => void;
  appendMessage: (message: SessionMessage) => void;
  appendUserText: (text: string, options?: { id?: string; sessionId?: string | null }) => void;
  clear: () => void;
};

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  activeSessionId: null,
  replaceSession: (activeSessionId, messages) => set({ activeSessionId, messages: dedupeMessages(messages) }),
  appendMessage: (message) =>
    set((state) => ({
      messages: appendDedupedMessage(state.messages, message),
    })),
  appendUserText: (text, options) =>
    set((state) => ({
      activeSessionId: options?.sessionId ?? state.activeSessionId,
      messages: appendDedupedMessage(state.messages, {
        id: options?.id ?? `user-${Date.now()}`,
        sessionId: options?.sessionId ?? state.activeSessionId ?? undefined,
        role: "user",
        content: text,
        visible: true,
        createTime: new Date().toISOString(),
      }),
    })),
  clear: () => set({ messages: [], activeSessionId: null }),
}));

function appendDedupedMessage(messages: SessionMessage[], message: SessionMessage): SessionMessage[] {
  const content = message.content ?? "";
  if (messages.some((item) => item.id === message.id)) return messages;
  if (message.role === "user" && messages.some((item) => item.role === "user" && (item.content ?? "") === content)) {
    return messages;
  }
  return [...messages, message];
}

function dedupeMessages(messages: SessionMessage[]): SessionMessage[] {
  const seenIds = new Set<string>();
  const seenUserContent = new Set<string>();
  const result: SessionMessage[] = [];
  for (const message of messages) {
    if (seenIds.has(message.id)) continue;
    seenIds.add(message.id);
    if (message.role === "user") {
      const content = message.content ?? "";
      if (seenUserContent.has(content)) continue;
      seenUserContent.add(content);
    }
    result.push(message);
  }
  return result;
}
