import { readStaticSession, readStaticSettings } from "./static-client";
import type { SessionMessage } from "../runtime/types";
import { useChatStore } from "../../stores/chat-store";
import { useRuntimeStore } from "../../stores/runtime-store";
import { useSessionStore } from "../../stores/session-store";

const DEFAULT_MODEL = "deepseek-v4-pro";
const DEFAULT_CONTEXT_LIMIT = 512 * 1024;

export async function loadStaticSession(sessionId: string): Promise<void> {
  const [result, settings] = await Promise.all([readStaticSession(sessionId), readStaticSettings()]);
  const model = result.model ?? settings.config.env?.MODEL ?? DEFAULT_MODEL;
  const thinkingEnabled = result.thinkingEnabled ?? settings.config.thinkingEnabled ?? true;
  const reasoningEffort = result.reasoningEffort ?? settings.config.reasoningEffort ?? "max";
  const compactPromptTokenThreshold = result.compactPromptTokenThreshold ?? getCompactPromptTokenThreshold(model);

  useChatStore.getState().replaceSession(result.sessionId, result.messages);
  useSessionStore.getState().choose(result.sessionId);
  useRuntimeStore.getState().setTokenTelemetry({
    model,
    thinkingEnabled,
    reasoningEffort,
    activeTokens: result.activeTokens ?? estimateTokens(result.messages),
    compactPromptTokenThreshold,
    usage: result.usage ?? null,
  });
}

function getCompactPromptTokenThreshold(model: string): number {
  const normalized = model.toLowerCase();
  if (normalized.includes("deepseek-v4")) return DEFAULT_CONTEXT_LIMIT;
  return DEFAULT_CONTEXT_LIMIT;
}

function estimateTokens(messages: SessionMessage[]): number {
  const characters = messages.reduce((sum, message) => sum + (message.content?.length ?? 0), 0);
  return Math.ceil(characters / 4);
}
