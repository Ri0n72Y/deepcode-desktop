import { useRuntimeStore } from "../../stores/runtime-store";

export default function ContextMeter() {
  const telemetry = useRuntimeStore((state) => state.tokenTelemetry);
  const percent = telemetry?.activeTokens && telemetry?.maxTokens ? Math.round((telemetry.activeTokens / telemetry.maxTokens) * 100) : 0;
  return (
    <div className="context-meter" aria-label={`Context usage ${percent}%`}>
      <div className="context-meter-ring" style={{ "--context-percent": `${percent}%` } as React.CSSProperties} />
      <div className="context-meter-tooltip">
        <div className="context-tooltip-title">Context Window</div>
        <div className="context-tooltip-summary">{percent}% used</div>
        <div className="context-tooltip-row"><span>model</span><span>{telemetry?.model ?? "unknown"}</span></div>
        <div className="context-tooltip-row"><span>activeTokens</span><span>{telemetry?.activeTokens ?? 0}</span></div>
      </div>
    </div>
  );
}
