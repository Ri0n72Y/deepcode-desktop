import { create } from "zustand";
import type { ProcessMap } from "../lib/runtime/types";

type ProcessState = {
  processes: ProcessMap;
  output: Record<string, string[]>;
  setProcesses: (processes: ProcessMap) => void;
  appendOutput: (pid: number, chunk: string) => void;
  clear: () => void;
};

export const useProcessStore = create<ProcessState>((set) => ({
  processes: null,
  output: {},
  setProcesses: (processes) => set({ processes }),
  appendOutput: (pid, chunk) =>
    set((state) => {
      const key = String(pid);
      return { output: { ...state.output, [key]: [...(state.output[key] ?? []), chunk] } };
    }),
  clear: () => set({ processes: null, output: {} }),
}));
