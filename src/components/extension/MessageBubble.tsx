import type { SessionMessage } from "../../lib/runtime/types";

export default function MessageBubble({ message }: { message: SessionMessage }) {
  if (message.role === "user") {
    return <div className="bubble user">{message.content}</div>;
  }

  if (message.role === "assistant") {
    return (
      <div className="bubble assistant">
        <span className={`bubble-dot ${message.shouldConnect ? "connect-to-prev" : ""}`} />
        <div className="bubble-normal-content">{message.content}</div>
        <button className="bubble-copy-btn" type="button">Copy</button>
      </div>
    );
  }

  const title = message.role === "system" ? "Skills" : "tool";
  return (
    <div className={`bubble ${message.role}`}>
      <div className="bubble-collapsible-header">
        <span className={`bubble-dot ${message.role === "tool" ? "success" : ""} ${message.shouldConnect ? "connect-to-prev" : ""}`} />
        <span className="bubble-title">
          <span className="bubble-title-text"><b>{title}</b></span>
          <span className="bubble-toggle">v</span>
        </span>
      </div>
      <div className="bubble-collapsible-content">{message.content}</div>
    </div>
  );
}
