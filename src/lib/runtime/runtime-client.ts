import type { RuntimeClient } from "./types";
import { MockRuntimeClient } from "./mock-runtime-client";
import { TauriRuntimeClient } from "./tauri-runtime-client";

export type { RuntimeClient } from "./types";
export { MockRuntimeClient } from "./mock-runtime-client";
export { TauriRuntimeClient } from "./tauri-runtime-client";

export function createRuntimeClient(): RuntimeClient {
  if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
    return new TauriRuntimeClient();
  }
  return new MockRuntimeClient();
}
