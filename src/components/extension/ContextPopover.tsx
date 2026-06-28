import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import type { CSSProperties } from "react";
import { useRuntimeStore } from "../../stores/runtime-store";
import "./context-meter.css";

export default function ContextPopover() {
  const telemetry = useRuntimeStore((state) => state.tokenTelemetry);
  const activeTokens = telemetry?.activeTokens ?? 0;
  const limit = (telemetry as { compactPromptTokenThreshold?: number } | null)?.compactPromptTokenThreshold ?? telemetry?.maxTokens ?? 0;
  const percent = limit > 0 ? Math.min(100, Math.round((activeTokens / limit) * 100)) : 0;

  return (
    <Popover className="context-meter">
      <PopoverButton className="context-meter-button" aria-label="Open context details">
        <span className="context-meter-ring" style={{ "--context-percent": `${percent}%` } as CSSProperties} />
      </PopoverButton>
      <PopoverPanel static className="context-meter-tooltip">
        <div className="context-tooltip-title">Context Window</div>
        <div className="context-tooltip-summary">{percent}% used</div>
        <div className="context-tooltip-row"><span>model</span><span>{telemetry?.model ?? "unknown"}</span></div>
        <div className="context-tooltip-row"><span>thinking enabled</span><span>{String(telemetry?.thinkingEnabled ?? false)}</span></div>
        <div className="context-tooltip-row"><span>reasoning effort</span><span>{telemetry?.reasoningEffort ?? ""}</span></div>
        <div className="context-tooltip-row"><span>activeTokens</span><span>{activeTokens}</span></div>
      </PopoverPanel>
    </Popover>
  );
}
