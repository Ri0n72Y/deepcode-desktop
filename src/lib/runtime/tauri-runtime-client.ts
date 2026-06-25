import { invoke } from "@tauri-apps/api/core";
import type { PromptInput, RuntimeClient, RuntimeStatus } from "./types";

export class TauriRuntimeClient implements RuntimeClient {
  subscribe(): () => void {
    return () => undefined;
  }

  async startRuntime(projectRoot?: string): Promise<RuntimeStatus> {
    return await invoke<RuntimeStatus>("start_deepcode_server", { projectRoot });
  }

  async stopRuntime(): Promise<void> {
    await invoke("stop_deepcode_server");
  }

  async ready(): Promise<void> {
    await this.request("/ready", "POST");
  }

  async requestSkills(): Promise<void> {
    await this.request("/request-skills", "POST");
  }

  async createNewSession(): Promise<void> {
    await this.request("/ready", "POST");
  }

  async selectSession(sessionId: string): Promise<void> {
    await this.request("/select-session", "POST", { sessionId });
  }

  async backToList(): Promise<void> {
    await this.request("/back-to-list", "POST");
  }

  async prompt(input: PromptInput): Promise<{ requestId: string }> {
    const response = await this.request<{ requestId?: string }>("/prompt", "POST", input);
    return { requestId: response.requestId ?? "tauri-request" };
  }

  async interrupt(): Promise<void> {
    await this.request("/interrupt", "POST");
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
}
