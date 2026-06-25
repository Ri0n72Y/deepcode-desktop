import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { HeadlessEvent, PromptInput, RuntimeClient, RuntimeStatus } from "./types";

const EVENT_NAME = "deepcode-event";

type RequestOptions = {
  route: string;
  method?: "GET" | "POST";
  body?: unknown;
};

export class TauriRuntimeClient implements RuntimeClient {
  private readonly listeners = new Set<(event: HeadlessEvent) => void>();
  private unlisten: (() => void) | null = null;

  subscribe(listener: (event: HeadlessEvent) => void): () => void {
    this.listeners.add(listener);
    void this.ensureEventBridge();
    return () => {
      this.listeners.delete(listener);
    };
  }

  async startRuntime(projectRoot?: string): Promise<RuntimeStatus> {
    return await invoke<RuntimeStatus>("start_deepcode_server", { projectRoot });
  }

  async stopRuntime(): Promise<void> {
    await invoke("stop_deepcode_server");
  }

  async ready(): Promise<void> {
    await this.request({ route: "/ready" });
  }

  async requestSkills(): Promise<void> {
    await this.request({ route: "/request-skills" });
  }

  async createNewSession(): Promise<void> {
    await this.request({ route: "/ready" });
  }

  async selectSession(sessionId: string): Promise<void> {
    await this.request({ route: "/select-session", body: { sessionId } });
  }

  async backToList(): Promise<void> {
    await this.request({ route: "/back-to-list" });
  }

  async prompt(input: PromptInput): Promise<{ requestId: string }> {
    return await this.request<{ requestId: string }>({ route: "/prompt", body: input });
  }

  async interrupt(): Promise<void> {
    await this.request({ route: "/interrupt" });
  }

  async openFile(filePath: string, line?: number): Promise<void> {
    await this.request({ route: "/open-file", body: { filePath, line } });
  }

  async copyText(text: string): Promise<void> {
    await navigator.clipboard?.writeText(text);
  }

  private async request<T = unknown>({ route, method = "POST", body }: RequestOptions): Promise<T> {
    return await invoke<T>("deepcode_request", { request: { route, method, body } });
  }

  private async ensureEventBridge(): Promise<void> {
    if (this.unlisten) return;
    this.unlisten = await listen<HeadlessEvent>(EVENT_NAME, (event) => {
      for (const listener of this.listeners) {
        listener(event.payload);
      }
    });
  }
}
