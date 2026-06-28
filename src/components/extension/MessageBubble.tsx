import { Button, Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import { CheckIcon, ChevronRightIcon, ClipboardDocumentIcon } from "@heroicons/react/24/outline";
import { useState, type ReactNode } from "react";
import type { SessionMessage } from "../../lib/runtime/types";
import { cn } from "../../lib/utils/cn";

const COLLAPSE_LINE_LIMIT = 20;

export default function MessageBubble({ message }: { message: SessionMessage }) {
  if (message.role === "user") {
    return <UserBubble content={message.content ?? ""} />;
  }

  if (message.role === "assistant") {
    return <AssistantBubble message={message} />;
  }

  const title = message.role === "system" ? "Skills" : "tool";
  return (
    <CollapsibleBubble
      dotClass={cn(
        message.role === "tool" ? "success" : "system-dot",
        message.shouldConnect && "connect-to-prev",
      )}
      title={title}
    >
      {message.content}
    </CollapsibleBubble>
  );
}

function UserBubble({ content }: { content: string }) {
  const lines = content.split("\n");
  if (lines.length <= COLLAPSE_LINE_LIMIT) {
    return <div className="bubble user">{content}</div>;
  }

  return (
    <Disclosure as="div" className="bubble user long-user-bubble">
      {({ open }) => (
        <>
          <div className="user-bubble-content">{open ? content : lines.slice(0, COLLAPSE_LINE_LIMIT).join("\n")}</div>
          <DisclosureButton className="bubble-expand-button">{open ? "收起" : "展开"}</DisclosureButton>
        </>
      )}
    </Disclosure>
  );
}

function AssistantBubble({ message }: { message: SessionMessage }) {
  const [copied, setCopied] = useState(false);
  const content = message.content ?? "";

  async function copyMessage() {
    try {
      await navigator.clipboard?.writeText(content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="bubble assistant">
      <span
        className={cn(
          "bubble-dot",
          message.shouldConnect && "connect-to-prev",
        )}
      />
      <div className="bubble-normal-content">{content}</div>
      <Button className="bubble-copy-btn" onClick={() => void copyMessage()} type="button" aria-label="Copy assistant message">
        {copied ? <CheckIcon className="bubble-action-icon" /> : <ClipboardDocumentIcon className="bubble-action-icon" />}
      </Button>
    </div>
  );
}

function CollapsibleBubble({ title, dotClass, children }: { title: string; dotClass: string; children: ReactNode }) {
  return (
    <Disclosure as="div" className="bubble tool">
      {({ open }) => (
        <>
          <DisclosureButton className="bubble-collapsible-header" aria-label={`Toggle ${title} details`}>
            <span className={cn("bubble-dot", dotClass)} />
            <span className="bubble-title">
              <span className="bubble-title-text"><b>{title}</b></span>
              <ChevronRightIcon
                className={cn(
                  "bubble-toggle-icon",
                  open && "expanded",
                )}
              />
            </span>
          </DisclosureButton>
          <DisclosurePanel className="bubble-collapsible-content">{children}</DisclosurePanel>
        </>
      )}
    </Disclosure>
  );
}
