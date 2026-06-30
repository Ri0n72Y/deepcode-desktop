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
  const timelineMessages = useMemo(
    () => optimizeTimelineMessages(messages),
    [messages],
  );
  const visibleTimelineMessages = useMemo(
    () => timelineMessages.filter((message) => !isTimelineMessageHidden(message, showSkills, showTools)),
    [timelineMessages, showSkills, showTools],
  );
  const lastVisibleMessage = visibleTimelineMessages[visibleTimelineMessages.length - 1];

  useEffect(() => {
    scrollToBottom("auto");
  }, [visibleTimelineMessages.length, loading]);

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
        {timelineMessages.map((message) => {
          const hidden = isTimelineMessageHidden(message, showSkills, showTools);
          return (
            <div key={message.id} aria-hidden={hidden} style={{ display: hidden ? "none" : undefined }}>
              <MessageBubble message={message} />
            </div>
          );
        })}
        {loading ? <ThinkingBubble shouldConnect={visibleTimelineMessages.length > 0 && lastVisibleMessage?.role !== "user"} /> : null}
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

function isTimelineMessageHidden(message: SessionMessage, showSkills: boolean, showTools: boolean): boolean {
  if (!showTools && message.role === "tool") return true;
  if (!showSkills && message.role === "system" && isSkillMessage(message)) return true;
  return false;
}

function isSkillMessage(message: SessionMessage): boolean {
  return Boolean(message.meta && "skill" in message.meta);
}

function optimizeTimelineMessages<T extends { role: string; content: string | null }>(messages: T[]): T[] {
  const totalLines = messages.reduce((sum, message) => sum + (message.content?.split("\n").length ?? 0), 0);
  if (messages.length <= 50 && totalLines <= 200) return messages;
  const lastUserIndex = messages.map((message) => message.role).lastIndexOf("user");
  return lastUserIndex >= 0 ? messages.slice(lastUserIndex) : messages.slice(-12);
}
