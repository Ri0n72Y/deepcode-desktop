import { cn } from "../../lib/utils/cn";
import { useProcessStore } from "../../stores/process-store";
import { useRuntimeStore } from "../../stores/runtime-store";

type ThinkingBubbleProps = {
  shouldConnect: boolean;
};

export default function ThinkingBubble({ shouldConnect }: ThinkingBubbleProps) {
  const processes = useProcessStore((state) => state.processes);
  const progress = useRuntimeStore((state) => state.llmStreamProgress);
  const text = getThinkingText(processes, progress);

  return (
    <div className={cn("bubble assistant", shouldConnect && "timeline-connect-prev")} data-thinking-live="true">
      <span className="bubble-dot spinner-dot" />
      <span className="bubble-title">
        <span className="bubble-title-text whitespace-nowrap">
          <b>Thinking</b>
          <span className="thinking-status">{text}</span>
        </span>
      </span>
    </div>
  );
}

function getThinkingText(processes: Record<string, { startTime?: string; command?: string }> | null, progress: Record<string, unknown> | null): string {
  const firstProcess = processes ? Object.values(processes)[0] : null;
  if (firstProcess?.command) {
    return `${formatElapsed(firstProcess.startTime)} ${firstProcess.command}`;
  }

  const startedAt = typeof progress?.startedAt === "string" ? progress.startedAt : null;
  if (startedAt) {
    const tokens = typeof progress?.formattedTokens === "string" ? progress.formattedTokens : "0";
    const elapsed = elapsedSeconds(startedAt);
    return elapsed >= 3 ? `(${elapsed}s) · ↓ ${tokens} tokens` : "Processing...";
  }

  return "Processing...";
}

function formatElapsed(startTime?: string): string {
  if (!startTime) return "Processing ·";
  const seconds = elapsedSeconds(startTime);
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return minutes > 0 ? `(${minutes}m${remaining}s)` : `(${remaining}s)`;
}

function elapsedSeconds(value: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
}
