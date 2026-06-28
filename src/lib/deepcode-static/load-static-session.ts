import { readStaticSession } from "./static-client";
import type { SessionMessage } from "../runtime/types";
import { useChatStore } from "../../stores/chat-store";
import { useRuntimeStore } from "../../stores/runtime-store";
import { useSessionStore } from "../../stores/session-store";

type SessionStats = {
  activeTokens?: number | null;
  usage?: Record<string, unknown> | null;
};

const CONTEXT_LIMIT = 512 * 1024;

export async function loadStaticSession(sessionId: string): Promise<void> {
  const result = await readStaticSession(sessionId);
  const stats = result as SessionStats;
  useChatStore.getState().replaceSession(result.sessionId, result.messages);
  useSessionStore.getState().choose(result.sessionId);
  useRuntimeStore.getState().setTokenTelemetry({
    model: "deepseek-v4-pro",
    thinkingEnabled: true,
    reasoningEffort: "max",
    activeTokens: stats.activeTokens ?? estimateTokens(result.messages),
    compactPromptTokenThreshold: CONTEXT_LIMIT,
    usage: stats.usage ?? null,
  });
}

function estimateTokens(messages: SessionMessage[]): number {
  const characters = messages.reduce((sum, message) => sum + (message.content?.length ?? 0), 0);
  return Math.ceil(characters / 4);
}
