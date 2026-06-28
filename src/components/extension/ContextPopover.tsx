import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import type { CSSProperties } from "react";
import { useRuntimeStore } from "../../stores/runtime-store";
import "./context-meter.css";

export default function ContextPopover() {
  const telemetry = useRuntimeStore((state) => state.tokenTelemetry);
  const percent = telemetry?.activeTokens && telemetry?.maxTokens ? Math.round((telemetry.activeTokens / telemetry.maxTokens) * 100) : 0;

  return (
    <Popover className="context-meter">
      <PopoverButton className="context-meter-button" aria-label="Open context details">
        <span className="context-meter-ring" style={{ "--context-percent": `${percent}%` } as CSSProperties} />
      </PopoverButton>
      <PopoverPanel static className="context-meter-tooltip">
        <div className="context-tooltip-title">Context Window</div>
        <div className="context-tooltip-summary">{percent}% used</div>
        <div className="context-tooltip-row"><span>model</span><span>{telemetry?.model ?? "unknown"}</span></div>
        <div className="context-tooltip-row"><span>thinking enabled</span><span>false</span></div>
        <div className="context-tooltip-row"><span>reasoning effort</span><span>max</span></div>
        <div className="context-tooltip-row"><span>activeTokens</span><span>{telemetry?.activeTokens ?? 0}</span></div>
      </PopoverPanel>
    </Popover>
  );
}
