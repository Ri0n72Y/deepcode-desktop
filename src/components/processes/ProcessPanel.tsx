import { useProcessStore } from "../../stores/process-store";

export default function ProcessPanel() {
  const processes = useProcessStore((state) => state.processes);
  const entries = processes ? Object.entries(processes) : [];

  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <h2 className="text-sm font-semibold text-slate-100">Processes</h2>
      {entries.length === 0 ? (
        <p className="mt-3 text-xs text-slate-500">No active process.</p>
      ) : (
        <ul className="mt-3 space-y-2 text-xs text-slate-300">
          {entries.map(([pid, entry]) => (
            <li className="rounded-lg bg-white/5 p-2" key={pid}>
              <div className="font-medium text-slate-200">{entry.command ?? `pid ${pid}`}</div>
              <div className="mt-1 text-slate-500">timeout: {entry.timeoutMs ?? "-"}</div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
