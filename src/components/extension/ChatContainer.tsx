import { useChatStore } from "../../stores/chat-store";
import { useRuntimeStore } from "../../stores/runtime-store";
import Composer from "./Composer";
import MessageBubble from "./MessageBubble";
import ThinkingBubble from "./ThinkingBubble";

export default function ChatContainer() {
  const messages = useChatStore((state) => state.messages);
  const loading = useRuntimeStore((state) => state.loading);

  return (
    <section className="chat-container">
      <div className="messages">
        {messages.length === 0 ? <div className="empty-chat">Start a new Deep Code session.</div> : null}
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {loading ? <ThinkingBubble shouldConnect={messages.length > 0 && messages[messages.length - 1]?.role !== "user"} /> : null}
      </div>
      <Composer />
    </section>
  );
}
