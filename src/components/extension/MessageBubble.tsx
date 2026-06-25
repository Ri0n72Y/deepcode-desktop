import { Button, Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import { CheckIcon, ChevronRightIcon, ClipboardDocumentIcon, WrenchScrewdriverIcon } from "@heroicons/react/24/outline";
import { useState, type ReactNode } from "react";
import type { SessionMessage } from "../../lib/runtime/types";

export default function MessageBubble({ message }: { message: SessionMessage }) {
  if (message.role === "user") {
    return <div className="bubble user">{message.content}</div>;
  }

  if (message.role === "assistant") {
    return <AssistantBubble message={message} />;
  }

  const title = message.role === "system" ? "Skills" : "tool";
  return (
    <CollapsibleBubble
      dotClass={`${message.role === "tool" ? "success" : "system-dot"} ${message.shouldConnect ? "connect-to-prev" : ""}`}
      title={title}
    >
      {message.content}
    </CollapsibleBubble>
  );
}

function AssistantBubble({ message }: { message: SessionMessage }) {
  const [copied, setCopied] = useState(false);
  const content = message.content ?? "";

  async function copyMessage() {
    await navigator.clipboard?.writeText(content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="bubble assistant">
      <span className={`bubble-dot ${message.shouldConnect ? "connect-to-prev" : ""}`} />
      <div className="bubble-normal-content">{content}</div>
      <Button className="bubble-copy-btn" onClick={() => void copyMessage()} type="button" aria-label="Copy assistant message">
        {copied ? <CheckIcon className="bubble-action-icon" /> : <ClipboardDocumentIcon className="bubble-action-icon" />}
      </Button>
    </div>
  );
}

function CollapsibleBubble({ title, dotClass, children }: { title: string; dotClass: string; children: ReactNode }) {
  return (
    <Disclosure as="div" className="bubble tool" defaultOpen>
      {({ open }) => (
        <>
          <DisclosureButton className="bubble-collapsible-header" aria-label={`Toggle ${title} details`}>
            <span className={`bubble-dot ${dotClass}`} />
            <span className="bubble-title">
              <span className="bubble-title-text">
                <WrenchScrewdriverIcon className="bubble-title-icon" />
                <b>{title}</b>
              </span>
              <ChevronRightIcon className={`bubble-toggle-icon ${open ? "expanded" : ""}`} />
            </span>
          </DisclosureButton>
          <DisclosurePanel className="bubble-collapsible-content">{children}</DisclosurePanel>
        </>
      )}
    </Disclosure>
  );
}
