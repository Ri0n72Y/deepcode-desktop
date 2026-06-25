import { create } from "zustand";
import type { PermissionRequest } from "../lib/runtime/types";

type PermissionState = {
  pending: PermissionRequest[];
  setPending: (items: PermissionRequest[]) => void;
  clear: () => void;
};

export const usePermissionStore = create<PermissionState>((set) => ({
  pending: [],
  setPending: (items) => set({ pending: items }),
  clear: () => set({ pending: [] }),
}));
