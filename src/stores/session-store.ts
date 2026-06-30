import { create } from "zustand";
import type { SessionSummary } from "../lib/runtime/types";

type SessionState = {
  list: SessionSummary[];
  current: string | null;
  replaceList: (nextList: SessionSummary[]) => void;
  choose: (nextCurrent: string | null) => void;
  upsertSession: (session: SessionSummary) => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  list: [],
  current: null,
  replaceList: (nextList) => set({ list: dedupeSessions(nextList) }),
  choose: (nextCurrent) => set({ current: nextCurrent }),
  upsertSession: (session) =>
    set((state) => ({
      list: dedupeSessions([
        {
          ...session,
          updateTime: session.updateTime ?? new Date().toISOString(),
        },
        ...state.list.filter((item) => item.id !== session.id),
      ]),
    })),
}));

function dedupeSessions(sessions: SessionSummary[]): SessionSummary[] {
  const seen = new Set<string>();
  const result: SessionSummary[] = [];
  for (const session of sessions) {
    if (!session.id || seen.has(session.id)) continue;
    seen.add(session.id);
    result.push(session);
  }
  return result;
}
