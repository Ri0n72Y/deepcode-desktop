import { Button } from "@headlessui/react";
import { ArrowDownIcon } from "@heroicons/react/24/outline";
import { useEffect, useMemo, useRef, useState } from "react";
import type { SessionMessage } from "../../lib/runtime/types";
import { useChatStore } from "../../stores/chat-store";
import { useRuntimeStore } from "../../stores/runtime-store";
import { useUiPreferencesStore } from "../../stores/ui-preferences-store";
import ComposerView from "./ComposerView";
import MessageBubble from "./MessageBubble";
import ThinkingBubble from "./ThinkingBubble";

export default function ChatContainerView() {
  const messages = useChatStore((state) => state.messages);
  const loading = useRuntimeStore((state) => state.loading);
  const showSkills = useUiPreferencesStore((state) => state.showSkills);
  const showTools = useUiPreferencesStore((state) => state.showTools);
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const visibleMessages = useMemo(
    () => optimizeVisibleMessages(filterTimelineMessages(messages, showSkills, showTools)),
    [messages, showSkills, showTools],
  );

  useEffect(() => {
    scrollToBottom("auto");
  }, [visibleMessages.length, loading]);

  function scrollToBottom(behavior: ScrollBehavior = "smooth") {
    const element = messagesRef.current;
    if (!element) return;
    element.scrollTo({ top: element.scrollHeight, behavior });
  }

  function updateScrollState() {
    const element = messagesRef.current;
    if (!element) return;
    const distance = element.scrollHeight - element.scrollTop - element.clientHeight;
    setIsAtBottom(distance < 24);
  }

  return (
    <section className="chat-container">
      <div className="messages" onScroll={updateScrollState} ref={messagesRef}>
        {visibleMessages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {loading ? <ThinkingBubble shouldConnect={visibleMessages.length > 0 && visibleMessages[visibleMessages.length - 1]?.role !== "user"} /> : null}
      </div>
      {!isAtBottom ? (
        <Button className="scroll-bottom-button" onClick={() => scrollToBottom()} type="button" aria-label="Scroll to bottom">
          <ArrowDownIcon className="scroll-bottom-icon" />
        </Button>
      ) : null}
      <ComposerView />
    </section>
  );
}

function filterTimelineMessages(messages: SessionMessage[], showSkills: boolean, showTools: boolean): SessionMessage[] {
  return messages.filter((message) => {
    if (!showTools && message.role === "tool") return false;
    if (!showSkills && message.role === "system" && isSkillMessage(message)) return false;
    return true;
  });
}

function isSkillMessage(message: SessionMessage): boolean {
  return Boolean(message.meta && "skill" in message.meta);
}

function optimizeVisibleMessages<T extends { role: string; content: string | null }>(messages: T[]): T[] {
  const totalLines = messages.reduce((sum, message) => sum + (message.content?.split("\n").length ?? 0), 0);
  if (messages.length <= 50 && totalLines <= 200) return messages;
  const lastUserIndex = messages.map((message) => message.role).lastIndexOf("user");
  return lastUserIndex >= 0 ? messages.slice(lastUserIndex) : messages.slice(-12);
}
