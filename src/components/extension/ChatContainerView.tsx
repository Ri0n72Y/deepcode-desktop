import { Button } from "@headlessui/react";
import { ArrowDownIcon } from "@heroicons/react/24/outline";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { SessionMessage } from "../../lib/runtime/types";
import { useChatStore } from "../../stores/chat-store";
import { useRuntimeStore } from "../../stores/runtime-store";
import { useUiPreferencesStore } from "../../stores/ui-preferences-store";
import ComposerView from "./ComposerView";
import MessageBubble from "./MessageBubble";
import ThinkingBubble from "./ThinkingBubble";

const INITIAL_RENDERED_MESSAGE_LIMIT = 120;
const LOAD_PREVIOUS_MESSAGE_CHUNK = 80;
const TOP_LOAD_THRESHOLD_PX = 24;

export default function ChatContainerView() {
  const messages = useChatStore((state) => state.messages);
  const activeSessionId = useChatStore((state) => state.activeSessionId);
  const loading = useRuntimeStore((state) => state.loading);
  const showSkills = useUiPreferencesStore((state) => state.showSkills);
  const showTools = useUiPreferencesStore((state) => state.showTools);
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const scrollHeightBeforePrependRef = useRef<number | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [renderedCount, setRenderedCount] = useState(() => Math.min(messages.length, INITIAL_RENDERED_MESSAGE_LIMIT));
  const renderedMessages = useMemo(
    () => messages.slice(Math.max(0, messages.length - renderedCount)),
    [messages, renderedCount],
  );
  const visibleTimelineMessages = useMemo(
    () => renderedMessages.filter((message) => !isTimelineMessageHidden(message, showSkills, showTools)),
    [renderedMessages, showSkills, showTools],
  );
  const lastVisibleMessage = visibleTimelineMessages[visibleTimelineMessages.length - 1];

  useEffect(() => {
    setRenderedCount(Math.min(messages.length, INITIAL_RENDERED_MESSAGE_LIMIT));
    setIsAtBottom(true);
  }, [activeSessionId]);

  useEffect(() => {
    setRenderedCount((current) => Math.min(messages.length, Math.max(current, Math.min(messages.length, INITIAL_RENDERED_MESSAGE_LIMIT))));
  }, [messages.length]);

  useLayoutEffect(() => {
    const previousScrollHeight = scrollHeightBeforePrependRef.current;
    const element = messagesRef.current;
    if (previousScrollHeight === null || !element) return;
    scrollHeightBeforePrependRef.current = null;
    element.scrollTop += element.scrollHeight - previousScrollHeight;
  }, [renderedMessages.length]);

  useEffect(() => {
    if (!isAtBottom || scrollHeightBeforePrependRef.current !== null) return;
    scrollToBottom("auto");
  }, [visibleTimelineMessages.length, loading, isAtBottom]);

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

    if (element.scrollTop <= TOP_LOAD_THRESHOLD_PX && renderedCount < messages.length) {
      scrollHeightBeforePrependRef.current = element.scrollHeight;
      setRenderedCount((current) => Math.min(messages.length, current + LOAD_PREVIOUS_MESSAGE_CHUNK));
    }
  }

  return (
    <section className="chat-container">
      <div className="messages" onScroll={updateScrollState} ref={messagesRef}>
        {renderedMessages.map((message) => {
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
