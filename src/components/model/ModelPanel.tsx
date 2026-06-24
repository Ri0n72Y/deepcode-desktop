import { useModelStore } from "../../stores/model-store";

export default function ModelPanel() {
  const config = useModelStore((state) => state.value);

  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <h2 className="text-sm font-semibold text-slate-100">Model</h2>
      <div className="mt-3 space-y-2 text-xs text-slate-400">
        <div className="flex justify-between gap-3"><span>Current</span><span className="text-slate-200">{config?.model ?? "unknown"}</span></div>
        <div className="flex justify-between gap-3"><span>Thinking</span><span className="text-slate-200">{config?.thinkingEnabled ? "on" : "off"}</span></div>
        <div className="flex justify-between gap-3"><span>Effort</span><span className="text-slate-200">{config?.reasoningEffort ?? "-"}</span></div>
      </div>
    </section>
  );
}
