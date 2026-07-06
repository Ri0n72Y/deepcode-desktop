import { useChatStore } from "../../stores/chat-store";
import { useModelStore } from "../../stores/model-store";
import { usePermissionStore } from "../../stores/permission-store";
import { useProcessStore } from "../../stores/process-store";
import { useRuntimeStore } from "../../stores/runtime-store";
import { useSessionStore } from "../../stores/session-store";
import { useSkillStore } from "../../stores/skill-store";
import type { HeadlessEvent, RuntimeConnectionStatus, SessionMessage, SessionSummary } from "./types";

export function dispatchRuntimeEvent(event: HeadlessEvent): void {
  switch (event.type) {
    case "connected":
      useRuntimeStore.getState().setStatus("connected");
      break;
    case "runtimeStatus":
      if (isRuntimeConnectionStatus(event.status)) {
        useRuntimeStore.getState().setStatus(event.status);
      }
      if (typeof event.projectRoot === "string" || event.projectRoot === null) {
        useRuntimeStore.getState().setProjectRoot(event.projectRoot ?? null);
      }
      break;
    case "initializeEmpty":
      useChatStore.getState().clear();
      useSessionStore.getState().choose(null);
      if (Array.isArray(event.sessions)) {
        useSessionStore.getState().replaceList(normalizeSessions(event.sessions));
      }
      useRuntimeStore.getState().setSessionStatus(event.status ?? null);
      useRuntimeStore.getState().setTokenTelemetry(event.tokenTelemetry ?? null);
      break;
    case "loadSession":
      useChatStore.getState().replaceSession(event.sessionId ?? null, normalizeSessionMessages(event.messages ?? [], event.sessionId ?? null));
      useSessionStore.getState().choose(event.sessionId ?? null);
      if (Array.isArray(event.sessions)) {
        useSessionStore.getState().replaceList(normalizeSessions(event.sessions));
      }
      if (event.sessionId) {
        useSessionStore.getState().upsertSession(buildSessionSummary(event));
      }
      useRuntimeStore.getState().setSessionStatus(event.status ?? null);
      useRuntimeStore.getState().setTokenTelemetry(event.tokenTelemetry ?? null);
      if (event.processes !== undefined) {
        useProcessStore.getState().setProcesses(event.processes);
      }
      if (Array.isArray(event.askPermissions)) {
        usePermissionStore.getState().setPending(event.askPermissions);
      }
      break;
    case "showSessionsList":
      if (Array.isArray(event.sessions)) {
        useSessionStore.getState().replaceList(normalizeSessions(event.sessions));
      }
      break;
    case "skillsList":
      if (Array.isArray(event.skills)) {
        useSkillStore.getState().setAvailable(event.skills);
      }
      break;
    case "userMessage":
      if (typeof event.content === "string" && event.content.length > 0) {
        const sessionId = useSessionStore.getState().current ?? event.sessionId ?? `draft-${event.requestId ?? Date.now()}`;
        useSessionStore.getState().choose(sessionId);
        useSessionStore.getState().upsertSession({
          id: sessionId,
          summary: summarizeUserPrompt(event.content),
          status: "running",
          createTime: event.timestamp,
          updateTime: event.timestamp,
        });
        useChatStore.getState().appendUserText(event.content, { id: `user-${event.requestId ?? stableHash(event.content)}`, sessionId });
      }
      break;
    case "appendMessage":
      if (isSessionMessage(event.message)) {
        const sessionId = event.message.sessionId ?? event.sessionId ?? useSessionStore.getState().current;
        useChatStore.getState().appendMessage(normalizeSessionMessage(event.message, {
          fallbackId: buildMessageId(event, event.message),
          fallbackSessionId: sessionId,
          shouldConnect: Boolean(event.shouldConnect),
        }));
      }
      break;
    case "assistant":
      useChatStore.getState().appendMessage({
        id: `assistant-${event.requestId ?? event.sequence ?? Date.now()}`,
        sessionId: event.sessionId ?? useSessionStore.getState().current ?? undefined,
        role: "assistant",
        content: typeof event.content === "string" ? event.content : typeof event.html === "string" ? stripHtml(event.html) : "",
        html: typeof event.html === "string" ? event.html : undefined,
        visible: true,
        createTime: event.timestamp,
      });
      break;
    case "loading":
      useRuntimeStore.getState().setLoading(Boolean(event.value));
      if (typeof event.status === "string" || event.status === null) {
        useRuntimeStore.getState().setSessionStatus(event.status ?? null);
      }
      break;
    case "llmStreamProgress":
      useRuntimeStore.getState().setLlmStreamProgress(event.progress ?? null);
      break;
    case "sessionStatus":
      useRuntimeStore.getState().setSessionStatus(event.status ?? null);
      useRuntimeStore.getState().setTokenTelemetry(event.tokenTelemetry ?? null);
      if (event.sessionId) {
        useSessionStore.getState().choose(event.sessionId);
        useSessionStore.getState().upsertSession(buildSessionSummary(event));
      }
      if (event.processes !== undefined) {
        useProcessStore.getState().setProcesses(event.processes);
      }
      if (Array.isArray(event.askPermissions)) {
        usePermissionStore.getState().setPending(event.askPermissions);
      }
      break;
    case "permissionRequest":
      if (Array.isArray(event.askPermissions)) {
        usePermissionStore.getState().setPending(event.askPermissions);
      }
      break;
    case "processStdout":
      if (typeof event.pid === "number" && typeof event.chunk === "string") {
        useProcessStore.getState().appendOutput(event.pid, event.chunk);
      }
      break;
    case "modelConfig":
      useModelStore.getState().setValue(event.config ?? null);
      break;
    case "shutdown":
      useRuntimeStore.getState().setStatus("offline");
      useRuntimeStore.getState().setLoading(false);
      break;
    case "error":
      useRuntimeStore.getState().setRuntimeError(event.error ?? "Unknown runtime error");
      break;
    default:
      break;
  }
}

function normalizeSessions(sessions: SessionSummary[]): SessionSummary[] {
  return sessions.map((session) => ({
    ...session,
    summary: session.summary || "Untitled",
  }));
}

function normalizeSessionMessages(messages: SessionMessage[], sessionId: string | null): SessionMessage[] {
  return messages.filter((message) => message.visible !== false).map((message, index) => normalizeSessionMessage(message, {
    fallbackId: `${sessionId ?? "session"}-${index}-${message.role}-${stableHash(message.content ?? "")}`,
    fallbackSessionId: sessionId,
  }));
}

function normalizeSessionMessage(message: SessionMessage, options: { fallbackId: string; fallbackSessionId?: string | null; shouldConnect?: boolean }): SessionMessage {
  return {
    ...message,
    id: typeof message.id === "string" && message.id ? message.id : options.fallbackId,
    sessionId: message.sessionId ?? options.fallbackSessionId ?? undefined,
    content: message.content ?? null,
    visible: message.visible ?? true,
    shouldConnect: options.shouldConnect ?? message.shouldConnect,
  };
}

function buildMessageId(event: HeadlessEvent, message: SessionMessage): string {
  return `${event.sessionId ?? useSessionStore.getState().current ?? "live"}-${event.requestId ?? event.sequence ?? Date.now()}-${message.role}-${stableHash(message.content ?? "")}`;
}

function buildSessionSummary(event: HeadlessEvent): SessionSummary {
  const id = event.sessionId ?? useSessionStore.getState().current ?? `session-${Date.now()}`;
  const existing = useSessionStore.getState().list.find((item) => item.id === id);
  return {
    id,
    summary: event.summary || existing?.summary || "Untitled",
    status: event.status ?? existing?.status ?? null,
    createTime: existing?.createTime ?? event.timestamp,
    updateTime: event.timestamp ?? new Date().toISOString(),
  };
}

function summarizeUserPrompt(content: string): string {
  const normalized = content.trim().split(/\s+/u).join(" ");
  if (!normalized) return "Untitled";
  return normalized.length > 80 ? `${normalized.slice(0, 77)}...` : normalized;
}

function stableHash(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash).toString(36);
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, "").trim();
}

function isSessionMessage(value: unknown): value is SessionMessage {
  return Boolean(value && typeof value === "object" && "role" in value && "content" in value);
}

function isRuntimeConnectionStatus(value: unknown): value is RuntimeConnectionStatus {
  return value === "offline" || value === "starting" || value === "connected" || value === "error";
}
