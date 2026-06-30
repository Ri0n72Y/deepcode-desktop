import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type { HeadlessEvent, PromptInput, RuntimeClient, RuntimeStatus, SessionMessage } from "./types";

type RuntimeProxyFailure = {
  ok: false;
  error: string;
};

type RuntimePromptResponse = {
  requestId?: string;
};

export class TauriRuntimeClient implements RuntimeClient {
  private readonly listeners = new Set<(event: HeadlessEvent) => void>();
  private requestCounter = 0;
  private runtimeUnlistenPromise: Promise<UnlistenFn> | undefined;

  subscribe(listener: (event: HeadlessEvent) => void): () => void {
    this.listeners.add(listener);
    this.ensureRuntimeEventBridge();
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) {
        const unlistenPromise = this.runtimeUnlistenPromise;
        this.runtimeUnlistenPromise = undefined;
        void unlistenPromise?.then((unlisten) => unlisten());
      }
    };
  }

  async startRuntime(projectRoot?: string): Promise<RuntimeStatus> {
    try {
      const status = await invoke<RuntimeStatus>("start_deepcode_server", { projectRoot });
      this.emitRuntimeStatus(status);
      return status;
    } catch (error) {
      const status: RuntimeStatus = { status: "error", lastError: errorToMessage(error) };
      this.emitRuntimeStatus(status);
      return status;
    }
  }

  async stopRuntime(): Promise<void> {
    const status = await invoke<RuntimeStatus>("stop_deepcode_server");
    this.emitRuntimeStatus(status);
    this.emit({ type: "shutdown" });
  }

  async ready(): Promise<void> {
    await this.request("/ready", "POST");
  }

  async requestSkills(): Promise<void> {
    await this.request("/request-skills", "POST");
  }

  async createNewSession(): Promise<void> {
    this.emit({ type: "initializeEmpty", sessions: [], status: null, tokenTelemetry: { activeTokens: 0, compactPromptTokenThreshold: 0, usage: null } });
    await this.request("/ready", "POST");
  }

  async selectSession(sessionId: string): Promise<void> {
    await this.request("/select-session", "POST", { sessionId });
  }

  async backToList(): Promise<void> {
    await this.request("/back-to-list", "POST");
  }

  async prompt(input: PromptInput): Promise<{ requestId: string }> {
    this.requestCounter += 1;
    const requestId = `tauri-${this.requestCounter}`;
    const promptText = input.text.trim();

    if (promptText) {
      this.emit({ type: "userMessage", requestId, content: promptText });
    }
    this.emit({ type: "loading", requestId, value: true, status: "running" });

    try {
      const response = await this.request<RuntimePromptResponse | RuntimeProxyFailure>("/prompt", "POST", input);
      if (isProxyFailure(response)) {
        this.emitAssistantError(requestId, response.error);
        this.emit({ type: "loading", requestId, value: false, status: "error" });
        return { requestId };
      }
      return { requestId: typeof response.requestId === "string" ? response.requestId : requestId };
    } catch (error) {
      this.emitAssistantError(requestId, errorToMessage(error));
      this.emit({ type: "loading", requestId, value: false, status: "error" });
      return { requestId };
    }
  }

  async interrupt(): Promise<void> {
    await this.request("/interrupt", "POST");
    this.emit({ type: "loading", value: false, status: "interrupted" });
  }

  async openFile(filePath: string, line?: number): Promise<void> {
    await this.request("/open-file", "POST", { filePath, line });
  }

  async copyText(text: string): Promise<void> {
    await navigator.clipboard?.writeText(text);
  }

  private async request<T = unknown>(route: string, method: "GET" | "POST", body?: unknown): Promise<T> {
    return await invoke<T>("deepcode_request", { route, method, body });
  }

  private ensureRuntimeEventBridge(): void {
    if (this.runtimeUnlistenPromise) {
      return;
    }
    this.runtimeUnlistenPromise = listen<HeadlessEvent>("deepcode-runtime-event", (event) => {
      this.emit(event.payload);
    });
  }

  private emitRuntimeStatus(status: RuntimeStatus): void {
    this.emit({ type: "runtimeStatus", status: status.status, pid: status.pid, projectRoot: status.projectRoot });
    if (status.status === "connected") {
      this.emit({ type: "connected" });
    }
    if (status.status === "error" && status.lastError) {
      this.emit({ type: "error", error: status.lastError });
    }
  }

  private emitAssistantError(requestId: string, message: string): void {
    const assistantMessage: SessionMessage = {
      id: `assistant-${requestId}`,
      role: "assistant",
      content: `Runtime request failed: ${message}`,
      visible: true,
      createTime: new Date().toISOString(),
    };
    this.emit({ type: "appendMessage", requestId, message: assistantMessage, shouldConnect: true });
  }

  private emit(event: HeadlessEvent): void {
    const enriched = { ...event, timestamp: event.timestamp ?? new Date().toISOString() };
    for (const listener of this.listeners) {
      listener(enriched);
    }
  }
}

function isProxyFailure(value: RuntimePromptResponse | RuntimeProxyFailure): value is RuntimeProxyFailure {
  return "ok" in value && value.ok === false && typeof value.error === "string";
}

function errorToMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
