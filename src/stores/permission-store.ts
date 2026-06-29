import { create } from "zustand";
import type { PermissionRequest } from "../lib/runtime/types";

export type PermissionDecisionKind = "allow_once" | "allow_always" | "deny";

export type PermissionDecision = {
  kind: PermissionDecisionKind;
  request: PermissionRequest;
};

type PermissionState = {
  pending: PermissionRequest[];
  lastDecision: PermissionDecision | null;
  setPending: (items: PermissionRequest[]) => void;
  resolveCurrent: (kind: PermissionDecisionKind) => PermissionDecision | null;
  clear: () => void;
};

export const usePermissionStore = create<PermissionState>((set, get) => ({
  pending: [],
  lastDecision: null,
  setPending: (items) => set({ pending: items, lastDecision: null }),
  resolveCurrent: (kind) => {
    const [request, ...rest] = get().pending;
    if (!request) return null;
    const decision = { kind, request } satisfies PermissionDecision;
    set({ pending: rest, lastDecision: decision });
    return decision;
  },
  clear: () => set({ pending: [], lastDecision: null }),
}));
