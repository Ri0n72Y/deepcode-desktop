import { useChatStore } from "../../stores/chat-store";
import { useModelStore } from "../../stores/model-store";
import { usePermissionStore } from "../../stores/permission-store";
import { useProcessStore } from "../../stores/process-store";
import { useRuntimeStore } from "../../stores/runtime-store";
import { useSessionStore } from "../../stores/session-store";
import { useSkillStore } from "../../stores/skill-store";
import type { HeadlessEvent, SessionMessage } from "./types";

export function dispatchRuntimeEvent(event: HeadlessEvent): void {
  switch (event.type) {
    case "connected":
      useRuntimeStore.getState().setStatus("connected");
      break;
    case "initializeEmpty":
      useChatStore.getState().clear();
      useSessionStore.getState().choose(null);
      if (Array.isArray(event.sessions)) {
        useSessionStore.getState().replaceList(event.sessions);
      }
      useRuntimeStore.getState().setSessionStatus(event.status ?? null);
      useRuntimeStore.getState().setTokenTelemetry(event.tokenTelemetry ?? null);
      break;
    case "loadSession":
      useChatStore.getState().replaceSession(event.sessionId ?? null, event.messages ?? []);
      useSessionStore.getState().choose(event.sessionId ?? null);
      if (Array.isArray(event.sessions)) {
        useSessionStore.getState().replaceList(event.sessions);
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
        useSessionStore.getState().replaceList(event.sessions);
      }
      break;
    case "skillsList":
      if (Array.isArray(event.skills)) {
        useSkillStore.getState().setAvailable(event.skills);
      }
      break;
    case "userMessage":
      if (typeof event.content === "string" && event.content.length > 0) {
        useChatStore.getState().appendUserText(event.content);
      }
      break;
    case "appendMessage":
      if (isSessionMessage(event.message)) {
        useChatStore.getState().appendMessage({ ...event.message, shouldConnect: Boolean(event.shouldConnect) });
      }
      break;
    case "loading":
      useRuntimeStore.getState().setLoading(Boolean(event.value));
      if (typeof event.status === "string" || event.status === null) {
        useRuntimeStore.getState().setSessionStatus(event.status ?? null);
      }
      break;
    case "sessionStatus":
      useRuntimeStore.getState().setSessionStatus(event.status ?? null);
      useRuntimeStore.getState().setTokenTelemetry(event.tokenTelemetry ?? null);
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

function isSessionMessage(value: unknown): value is SessionMessage {
  return Boolean(value && typeof value === "object" && "role" in value && "content" in value);
}
