import type { SessionMessage } from "../../lib/runtime/types";
import { cn } from "../../lib/utils/cn";

type MessageItemProps = {
  message: SessionMessage;
};

export default function MessageItem({ message }: MessageItemProps) {
  const roleLabel = message.role === "assistant" ? "DeepCode" : message.role;
  return (
    <article className={cn("rounded-xl border p-4", message.role === "user" ? "border-sky-400/20 bg-sky-400/10" : "border-white/10 bg-white/[0.03]")}> 
      <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-wide text-slate-500">
        <span>{roleLabel}</span>
        {message.createTime ? <time>{new Date(message.createTime).toLocaleTimeString()}</time> : null}
      </div>
      <p className="whitespace-pre-wrap text-sm leading-6 text-slate-100">{message.content}</p>
    </article>
  );
}
