import { useChatStore } from "../../stores/chat-store";
import { useSessionStore } from "../../stores/session-store";

export function startStaticChat(): void {
  useChatStore.getState().clear();
  useSessionStore.getState().choose(null);
}
