import { create } from "zustand";
import type { RuntimeConnectionStatus } from "../lib/runtime/types";

type RuntimeState = {
  status: RuntimeConnectionStatus;
  connected: boolean;
  loading: boolean;
  projectRoot: string | null;
  lastError: string | null;
  setStatus: (status: RuntimeConnectionStatus) => void;
  setProjectRoot: (projectRoot: string | null) => void;
  setLoading: (loading: boolean) => void;
  setRuntimeError: (message: string | null) => void;
  reset: () => void;
};

const initialState = {
  status: "offline" as RuntimeConnectionStatus,
  connected: false,
  loading: false,
  projectRoot: null,
  lastError: null,
};

export const useRuntimeStore = create<RuntimeState>((set) => ({
  ...initialState,
  setStatus: (status) => set({ status, connected: status === "connected" }),
  setProjectRoot: (projectRoot) => set({ projectRoot }),
  setLoading: (loading) => set({ loading }),
  setRuntimeError: (lastError) => set((state) => ({ lastError, status: lastError ? "error" : state.status })),
  reset: () => set(initialState),
}));
