import { cn } from "../../lib/utils/cn";
import { useProcessStore } from "../../stores/process-store";

type ThinkingBubbleProps = {
  shouldConnect: boolean;
};

export default function ThinkingBubble({ shouldConnect }: ThinkingBubbleProps) {
  const processes = useProcessStore((state) => state.processes);
  const firstProcess = processes ? Object.values(processes)[0] : null;
  const text = firstProcess?.command ? `Processing · ${firstProcess.command}` : "Processing...";

  return (
    <div className="bubble assistant" data-thinking-live="true">
      <div className="bubble-collapsible-header">
        <span
          className={cn(
            "bubble-dot spinner-dot",
            shouldConnect && "connect-to-prev",
          )}
        />
        <span className="bubble-title">
          <span className="bubble-title-text"><b>Thinking</b> <span className="thinking-status">{text}</span></span>
        </span>
      </div>
    </div>
  );
}
