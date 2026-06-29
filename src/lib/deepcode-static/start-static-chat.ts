import { useChatStore } from "../../stores/chat-store";
import { useRuntimeStore } from "../../stores/runtime-store";
import { useSessionStore } from "../../stores/session-store";

export function startStaticChat(): void {
  useChatStore.getState().clear();
  useSessionStore.getState().choose(null);
  useRuntimeStore.getState().setLoading(false);
  useRuntimeStore.getState().setSessionStatus(null);
  useRuntimeStore.getState().setTokenTelemetry({
    activeTokens: 0,
    compactPromptTokenThreshold: 0,
    usage: null,
  });
}
