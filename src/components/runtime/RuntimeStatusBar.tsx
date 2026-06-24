import { useRuntimeStore } from "../../stores/runtime-store";

export default function RuntimeStatusBar() {
  const status = useRuntimeStore((state) => state.status);
  const loading = useRuntimeStore((state) => state.loading);
  const lastError = useRuntimeStore((state) => state.lastError);

  return (
    <footer className="flex h-8 shrink-0 items-center justify-between border-t border-white/10 bg-[#0b0d12] px-3 text-xs text-slate-400">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        <span>runtime: {status}</span>
        {loading ? <span className="text-sky-300">busy</span> : <span>idle</span>}
      </div>
      <div className="truncate text-slate-500">{lastError ?? "Host-owned server transport foundation"}</div>
    </footer>
  );
}
