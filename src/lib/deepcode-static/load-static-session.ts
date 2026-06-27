import { readStaticSession } from "./static-client";
import { useChatStore } from "../../stores/chat-store";
import { useSessionStore } from "../../stores/session-store";

export async function loadStaticSession(sessionId: string): Promise<void> {
  const result = await readStaticSession(sessionId);
  useChatStore.getState().replaceSession(result.sessionId, result.messages);
  useSessionStore.getState().choose(result.sessionId);
}
