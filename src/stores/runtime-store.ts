import { create } from "zustand";
import type { RuntimeConnectionStatus, TokenTelemetry } from "../lib/runtime/types";

type RuntimeState = {
  status: RuntimeConnectionStatus;
  connected: boolean;
  loading: boolean;
  sessionStatus: string | null;
  projectRoot: string | null;
  lastError: string | null;
  tokenTelemetry: TokenTelemetry | null;
  setStatus: (status: RuntimeConnectionStatus) => void;
  setProjectRoot: (projectRoot: string | null) => void;
  setLoading: (loading: boolean) => void;
  setSessionStatus: (status: string | null) => void;
  setTokenTelemetry: (telemetry: TokenTelemetry | null) => void;
  setRuntimeError: (message: string | null) => void;
  reset: () => void;
};

const initialState = {
  status: "offline" as RuntimeConnectionStatus,
  connected: false,
  loading: false,
  sessionStatus: null,
  projectRoot: null,
  lastError: null,
  tokenTelemetry: null,
};

export const useRuntimeStore = create<RuntimeState>((set) => ({
  ...initialState,
  setStatus: (status) => set({ status, connected: status === "connected" }),
  setProjectRoot: (projectRoot) => set({ projectRoot }),
  setLoading: (loading) => set({ loading }),
  setSessionStatus: (sessionStatus) => set({ sessionStatus }),
  setTokenTelemetry: (tokenTelemetry) => set({ tokenTelemetry }),
  setRuntimeError: (lastError) => set((state) => ({ lastError, status: lastError ? "error" : state.status })),
  reset: () => set(initialState),
}));
