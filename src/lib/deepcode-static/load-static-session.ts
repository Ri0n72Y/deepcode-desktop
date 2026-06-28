import { readStaticSession } from "./static-client";
import { useChatStore } from "../../stores/chat-store";
import { useRuntimeStore } from "../../stores/runtime-store";
import { useSessionStore } from "../../stores/session-store";

type StaticSessionWithTelemetry = {
  sessionId: string;
  messages: Parameters<typeof useChatStore.getState>[0] extends never ? never : unknown[];
  activeTokens?: number | null;
  usage?: Record<string, unknown> | null;
};

const DEEPSEEK_V4_COMPACT_PROMPT_TOKEN_THRESHOLD = 512 * 1024;

export async function loadStaticSession(sessionId: string): Promise<void> {
  const result = await readStaticSession(sessionId);
  const telemetry = result as StaticSessionWithTelemetry;
  useChatStore.getState().replaceSession(result.sessionId, result.messages);
  useSessionStore.getState().choose(result.sessionId);
  useRuntimeStore.getState().setTokenTelemetry({
    model: "deepseek-v4-pro",
    thinkingEnabled: true,
    reasoningEffort: "max",
    activeTokens: telemetry.activeTokens ?? estimateTokens(result.messages),
    compactPromptTokenThreshold: DEEPSEEK_V4_COMPACT_PROMPT_TOKEN_THRESHOLD,
    usage: telemetry.usage ?? null,
  });
}

function estimateTokens(messages: Array<{ content?: string | null }>): number {
  const characters = messages.reduce((sum, message) => sum + (message.content?.length ?? 0), 0);
  return Math.ceil(characters / 4);
}
