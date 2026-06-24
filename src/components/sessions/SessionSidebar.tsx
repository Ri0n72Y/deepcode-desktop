import { useSessionStore } from "../../stores/session-store";
import { cn } from "../../lib/utils/cn";

export default function SessionSidebar() {
  const sessions = useSessionStore((state) => state.list);
  const current = useSessionStore((state) => state.current);

  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-white/10 bg-[#11151d]">
      <div className="border-b border-white/10 px-4 py-3">
        <div className="text-sm font-semibold tracking-wide text-slate-100">DeepCode</div>
        <div className="mt-1 text-xs text-slate-400">Desktop host-owned runtime</div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {sessions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/10 p-3 text-xs text-slate-500">No sessions loaded.</div>
        ) : (
          sessions.map((session) => (
            <button
              key={session.id}
              className={cn(
                "mb-1 w-full rounded-lg px-3 py-2 text-left text-sm transition",
                current === session.id ? "bg-sky-500/20 text-sky-100" : "text-slate-300 hover:bg-white/5",
              )}
              type="button"
            >
              <div className="truncate font-medium">{session.summary || "Untitled"}</div>
              <div className="mt-1 text-xs text-slate-500">{session.status ?? "idle"}</div>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}
