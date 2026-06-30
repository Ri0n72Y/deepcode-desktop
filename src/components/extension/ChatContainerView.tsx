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

const TOP_LOAD_THRESHOLD_PX = 24;

type TimelineConnectivity = {
  connectToPrevious: boolean;
  connectToNext: boolean;
};

export default function ChatContainerView() {
  const messages = useChatStore((state) => state.messages);
  const activeSessionId = useChatStore((state) => state.activeSessionId);
  const loading = useRuntimeStore((state) => state.loading);
  const showSkills = useUiPreferencesStore((state) => state.showSkills);
  const showTools = useUiPreferencesStore((state) => state.showTools);
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const scrollHeightBeforePrependRef = useRef<number | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [renderedStartIndex, setRenderedStartIndex] = useState(() => getLastUserTurnStartIndex(messages));
  const renderedMessages = useMemo(
    () => messages.slice(Math.min(renderedStartIndex, messages.length)),
    [messages, renderedStartIndex],
  );
  const visibleTimelineMessages = useMemo(
    () => renderedMessages.filter((message) => !isTimelineMessageHidden(message, showSkills, showTools)),
    [renderedMessages, showSkills, showTools],
  );
  const timelineConnectivity = useMemo(
    () => buildTimelineConnectivity(visibleTimelineMessages),
    [visibleTimelineMessages],
  );
  const lastVisibleMessage = visibleTimelineMessages[visibleTimelineMessages.length - 1];

  useEffect(() => {
    setRenderedStartIndex(getLastUserTurnStartIndex(messages));
    setIsAtBottom(true);
  }, [activeSessionId]);

  useEffect(() => {
    setRenderedStartIndex((current) => {
      if (messages.length === 0) return 0;
      if (current >= messages.length) return getLastUserTurnStartIndex(messages);
      return current;
    });
  }, [messages]);

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

    if (element.scrollTop <= TOP_LOAD_THRESHOLD_PX && renderedStartIndex > 0) {
      scrollHeightBeforePrependRef.current = element.scrollHeight;
      setRenderedStartIndex((current) => getPreviousUserTurnStartIndex(messages, current));
    }
  }

  return (
    <section className="chat-container">
      <div className="messages" onScroll={updateScrollState} ref={messagesRef}>
        {renderedMessages.map((message) => {
          const hidden = isTimelineMessageHidden(message, showSkills, showTools);
          const connectivity = timelineConnectivity.get(message.id);
          return (
            <div key={message.id} aria-hidden={hidden} style={{ display: hidden ? "none" : undefined }}>
              <MessageBubble
                connectToNext={connectivity?.connectToNext ?? false}
                connectToPrevious={connectivity?.connectToPrevious ?? false}
                message={message}
              />
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

function buildTimelineConnectivity(messages: SessionMessage[]): Map<string, TimelineConnectivity> {
  const connectivity = new Map<string, TimelineConnectivity>();
  for (let index = 0; index < messages.length; index += 1) {
    const message = messages[index];
    if (!message || message.role === "user") continue;
    const previous = messages[index - 1];
    const next = messages[index + 1];
    connectivity.set(message.id, {
      connectToPrevious: Boolean(previous && previous.role !== "user"),
      connectToNext: Boolean(next && next.role !== "user"),
    });
  }
  return connectivity;
}

function getLastUserTurnStartIndex(messages: SessionMessage[]): number {
  const lastUserIndex = findPreviousUserIndex(messages, messages.length);
  return lastUserIndex >= 0 ? lastUserIndex : 0;
}

function getPreviousUserTurnStartIndex(messages: SessionMessage[], currentStartIndex: number): number {
  const previousUserIndex = findPreviousUserIndex(messages, currentStartIndex);
  return previousUserIndex >= 0 ? previousUserIndex : 0;
}

function findPreviousUserIndex(messages: SessionMessage[], beforeIndex: number): number {
  for (let index = Math.min(beforeIndex, messages.length) - 1; index >= 0; index -= 1) {
    if (messages[index]?.role === "user") return index;
  }
  return -1;
}

function isTimelineMessageHidden(message: SessionMessage, showSkills: boolean, showTools: boolean): boolean {
  if (!showTools && message.role === "tool") return true;
  if (!showSkills && message.role === "system" && isSkillMessage(message)) return true;
  return false;
}

function isSkillMessage(message: SessionMessage): boolean {
  return Boolean(message.meta && "skill" in message.meta);
}
