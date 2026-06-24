import { create } from "zustand";
import type { SessionSummary } from "../lib/runtime/types";

type SessionState = {
  list: SessionSummary[];
  current: string | null;
  replaceList: (nextList: SessionSummary[]) => void;
  choose: (nextCurrent: string | null) => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  list: [],
  current: null,
  replaceList: (nextList) => set({ list: nextList }),
  choose: (nextCurrent) => set({ current: nextCurrent }),
}));
