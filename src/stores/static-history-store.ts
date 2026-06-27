import { create } from "zustand";
import type { SessionSummary } from "../lib/runtime/types";
import type { StaticHistoryResult, StaticProjectHistory } from "../lib/deepcode-static/types";

type StaticHistoryState = {
  history: StaticHistoryResult | null;
  setHistory: (history: StaticHistoryResult | null) => void;
  flattenedSessions: () => SessionSummary[];
};

export const useStaticHistoryStore = create<StaticHistoryState>((set, get) => ({
  history: null,
  setHistory: (history) => set({ history }),
  flattenedSessions: () => flattenStaticHistory(get().history?.projects ?? []),
}));

export function flattenStaticHistory(projects: StaticProjectHistory[]): SessionSummary[] {
  return projects.flatMap((project) =>
    project.sessions.map((session) => ({
      id: session.id,
      summary: session.summary || "Untitled session",
      status: session.status,
      createTime: session.createTime ?? undefined,
      updateTime: session.updateTime ?? undefined,
    })),
  );
}
