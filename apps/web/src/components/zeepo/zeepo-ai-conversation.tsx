"use client";

import { useEffect, useRef, useState, memo, type ReactNode, type RefObject } from "react";
import {
  Check,
  ChevronRight,
  Copy,
  Pencil,
  RotateCcw,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { cn } from "@/lib/utils";
import { copyTextToClipboard } from "@/lib/copy-to-clipboard";
import { AiMarkdownRenderer } from "@/components/ai/ai-markdown-renderer";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ZeepoAiInlineGenerations } from "@/components/zeepo/zeepo-ai-inline-generations";
import { ZeepoToolResultCards } from "@/components/zeepo/zeepo-tool-result-cards";
import { useZeepoAiRoute } from "@/components/zeepo/zeepo-ai-route-context";
import { AiStreamingText } from "@/components/ui/streaming-text";
import { sanitizeZeepoAiReasoning } from "@/lib/sanitize-zeepo-ai-reasoning";
import type {
  ZeepoAiActivePanel,
  ZeepoAiGeneration,
  ZeepoAiMessage,
  ZeepoAiMessageAttachment,
} from "@/components/zeepo/zeepo-ai-types";

function formatThoughtDuration(ms?: number): string {
  if (!ms || ms <= 0) return "a moment";
  const seconds = Math.max(1, Math.round(ms / 1000));
  return `${seconds}s`;
}

function ZeepoAiReasoningAccordion({
  reasoning,
  reasoningStatus,
  reasoningDurationMs,
  forceOpen,
  hideDetails = false,
}: {
  reasoning?: string;
  reasoningStatus?: ZeepoAiMessage["reasoningStatus"];
  reasoningDurationMs?: number;
  forceOpen?: boolean;
  /** If true, show only "Thinking..." loader without expandable reasoning content */
  hideDetails?: boolean;
}) {
  const isStreaming = reasoningStatus === "streaming";
  const hasReasoning = Boolean(reasoning?.trim()) || isStreaming;
  const [open, setOpen] = useState(Boolean(forceOpen || isStreaming));

  useEffect(() => {
    if (forceOpen || isStreaming) setOpen(true);
  }, [forceOpen, isStreaming]);

  useEffect(() => {
    if (!isStreaming && reasoningStatus === "complete" && !forceOpen) {
      const t = window.setTimeout(() => setOpen(false), 420);
      return () => window.clearTimeout(t);
    }
  }, [isStreaming, reasoningStatus, forceOpen]);

  if (!hasReasoning) return null;

  // Customer mode: show only "Thinking..." when streaming, nothing when complete
  if (hideDetails) {
    if (!isStreaming) return null;
    return (
      <div className="mb-3 flex items-center gap-2 text-[13px] text-muted-foreground/90">
        <span className="zeepo-ai-thinking-label">Thinking</span>
        <span className="zeepo-ai-thinking-dots inline-flex gap-0.5" aria-hidden>
          <span />
          <span />
          <span />
        </span>
      </div>
    );
  }

  // Agency mode: full reasoning accordion
  if (!hasReasoning) return null;

  const safeReasoning = sanitizeZeepoAiReasoning(reasoning);
  const label = isStreaming
    ? "Thinking"
    : `Thought for ${formatThoughtDuration(reasoningDurationMs)}`;

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mb-3 w-full min-w-0">
      <CollapsibleTrigger
        type="button"
        className={cn(
          "group/reason inline-flex max-w-full items-center gap-1.5 rounded-md py-0.5",
          "text-left text-[12.5px] font-medium tracking-tight text-muted-foreground",
          "outline-none transition-colors hover:text-foreground",
          "focus-visible:ring-2 focus-visible:ring-ring/40",
        )}
      >
        <ChevronRight
          className={cn(
            "size-3.5 shrink-0 text-muted-foreground/80 transition-transform duration-200",
            open && "rotate-90",
          )}
        />
        <span className="inline-flex items-center gap-1.5">
          <span className={cn(isStreaming && "zeepo-ai-thinking-label")}>{label}</span>
          {isStreaming ? (
            <span className="zeepo-ai-thinking-dots inline-flex gap-0.5" aria-hidden>
              <span />
              <span />
              <span />
            </span>
          ) : null}
        </span>
      </CollapsibleTrigger>

      <CollapsibleContent className="zeepo-ai-reasoning-panel overflow-hidden">
        <div className="mt-2 border-l-2 border-border/70 pl-3.5">
          {safeReasoning ? (
            <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-muted-foreground/90">
              {safeReasoning}
              {isStreaming ? <span className="zeepo-ai-stream-caret" aria-hidden /> : null}
            </p>
          ) : (
            <p className="text-[13px] text-muted-foreground/70">Gathering context…</p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function ActionButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "relative z-10 inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors",
        "hover:bg-muted hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        active && "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary",
      )}
    >
      {children}
    </button>
  );
}

export const ZeepoAiUserBubble = memo(function ZeepoAiUserBubble({
  content,
  attachments,
  onCopy,
  onRetry,
  onEditSave,
  animateEnter = true,
}: {
  content: string;
  attachments?: ZeepoAiMessageAttachment[];
  onCopy?: () => void;
  onRetry?: () => void;
  onEditSave?: (nextContent: string) => void;
  animateEnter?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(content);

  const handleCopy = async () => {
    if (!content) return;
    const ok = await copyTextToClipboard(content);
    if (!ok) {
      toast.error("Could not copy");
      return;
    }
    setCopied(true);
    onCopy?.();
    window.setTimeout(() => setCopied(false), 1600);
  };

  const startEdit = () => {
    setDraft(content);
    setEditing(true);
  };

  const cancelEdit = () => {
    setDraft(content);
    setEditing(false);
  };

  const saveEdit = () => {
    const next = draft.trim();
    if (!next || next === content.trim()) {
      cancelEdit();
      return;
    }
    setEditing(false);
    onEditSave?.(next);
  };

  if (editing) {
    return (
      <div className="zeepo-ai-msg zeepo-ai-msg-user flex w-full flex-col items-end gap-2">
        <div
          className={cn(
            "w-full max-w-[min(92%,34rem)] rounded-2xl rounded-br-md",
            "bg-muted/80 px-3 py-2.5 text-foreground",
            "ring-1 ring-border/40",
          )}
        >
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={Math.min(12, Math.max(3, draft.split("\n").length + 1))}
            className="w-full resize-y bg-transparent text-[15px] leading-[1.55] text-foreground outline-none placeholder:text-muted-foreground"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                cancelEdit();
              }
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                saveEdit();
              }
            }}
          />
        </div>
        <div className="flex items-center gap-2 pr-0.5">
          <button
            type="button"
            onClick={cancelEdit}
            className="rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={saveEdit}
            disabled={!draft.trim()}
            className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "zeepo-ai-msg zeepo-ai-msg-user flex flex-col items-end gap-1.5",
        animateEnter && "zeepo-ai-msg-enter",
      )}
    >
      {attachments && attachments.length > 0 ? (
        <div className="flex max-w-[min(92%,34rem)] flex-wrap justify-end gap-1.5">
          {attachments.map((a, i) => (
            <a
              key={`${a.url}-${i}`}
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block overflow-hidden rounded-xl ring-1 ring-border/50 shadow-sm transition-opacity hover:opacity-90"
            >
              <img
                src={a.url}
                alt={a.name}
                className="h-[5.5rem] w-auto max-w-[8rem] object-cover"
              />
            </a>
          ))}
        </div>
      ) : null}
      {content.trim() ? (
        <div
          className={cn(
            "max-w-[min(92%,34rem)] rounded-2xl rounded-br-md",
            "bg-muted/80 px-4 py-2.5 text-foreground",
            "ring-1 ring-border/40",
          )}
        >
          <p className="whitespace-pre-wrap text-[15px] leading-[1.55]">{content}</p>
        </div>
      ) : null}
      <div className="flex items-center gap-0.5 pr-0.5">
        <ActionButton label="Copy" onClick={() => void handleCopy()}>
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        </ActionButton>
        {onEditSave ? (
          <ActionButton label="Edit" onClick={startEdit}>
            <Pencil className="size-3.5" />
          </ActionButton>
        ) : null}
        {onRetry ? (
          <ActionButton label="Retry" onClick={onRetry}>
            <RotateCcw className="size-3.5" />
          </ActionButton>
        ) : null}
      </div>
    </div>
  );
});

/** While streaming: paced plain-text reveal (no markdown parse). Done: full markdown. */
function ZeepoAiStreamingText({
  content,
  showCaret,
}: {
  content: string;
  showCaret?: boolean;
}) {
  return (
    <div className="zeepo-ai-streaming-body">
      <AiStreamingText
        text={content}
        active
        speed={14}
        mode="character"
        showCursor={showCaret !== false}
      />
    </div>
  );
}

export const ZeepoAiAssistantBubble = memo(function ZeepoAiAssistantBubble({
  message,
  generations,
  keepReasoningOpen,
  activeGenerationId,
  onOpenGeneration,
  onFeedback,
  onCopy,
  animateEnter = true,
  isAgencySuperAdmin = false,
  hideReasoning = false,
}: {
  message: ZeepoAiMessage;
  generations?: ZeepoAiGeneration[];
  keepReasoningOpen?: boolean;
  activeGenerationId?: string | null;
  onOpenGeneration?: (panel: NonNullable<ZeepoAiActivePanel>) => void;
  onFeedback?: (messageId: string, feedback: "like" | "dislike" | "clear") => void;
  onCopy?: () => void;
  animateEnter?: boolean;
  isAgencySuperAdmin?: boolean;
  /** Hide reasoning details for customer users */
  hideReasoning?: boolean;
}) {
  const route = useZeepoAiRoute();
  const navigate = useNavigate();
  const isStreaming = message.status === "streaming";
  const isReasoning = message.reasoningStatus === "streaming";
  const showAnswerCaret = isStreaming && !isReasoning;
  const inlineGens = generations ?? [];
  const [copied, setCopied] = useState(false);
  const showActions =
    !isStreaming &&
    Boolean(
      message.content ||
        message.interrupted ||
        (message.toolResults && message.toolResults.length > 0) ||
        inlineGens.length > 0,
    );

  const handleCopy = async () => {
    if (!message.content) return;
    const ok = await copyTextToClipboard(message.content);
    if (!ok) {
      toast.error("Could not copy");
      return;
    }
    setCopied(true);
    onCopy?.();
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div
      className={cn(
        "zeepo-ai-msg zeepo-ai-msg-assistant flex w-full min-w-0 items-start gap-3",
        animateEnter && !isStreaming && "zeepo-ai-msg-enter",
      )}
    >
      <div className="mt-0.5 size-7 shrink-0 overflow-hidden rounded-full ring-1 ring-border/50">
        <img src="/zepo.png" alt="" className="size-full object-cover" width={28} height={28} />
      </div>

      <div className="min-w-0 flex-1 pt-0.5">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/80">
          Zeepo
        </p>

        <ZeepoAiReasoningAccordion
          reasoning={message.reasoning}
          reasoningStatus={message.reasoningStatus}
          reasoningDurationMs={message.reasoningDurationMs}
          forceOpen={keepReasoningOpen || isReasoning}
          hideDetails={hideReasoning}
        />

        {message.content ? (
          isStreaming ? (
            <ZeepoAiStreamingText content={message.content} showCaret={showAnswerCaret} />
          ) : (
            <AiMarkdownRenderer
              content={message.content}
              className="text-[15px] leading-[1.65] text-foreground/95 prose-p:my-2 prose-headings:my-3 prose-li:my-0.5"
            />
          )
        ) : showAnswerCaret ? (
          <span className="zeepo-ai-stream-caret mt-1 inline-block" aria-hidden />
        ) : null}

        {message.status === "error" || message.interrupted ? (
          <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
            This reply was interrupted. Retry from your message above.
          </p>
        ) : null}

        {inlineGens.length > 0 && onOpenGeneration ? (
          <ZeepoAiInlineGenerations
            generations={inlineGens}
            activeGenerationId={activeGenerationId}
            onOpen={onOpenGeneration}
            isAgencySuperAdmin={isAgencySuperAdmin}
          />
        ) : null}

        {message.toolResults && message.toolResults.length > 0 ? (
          <ZeepoToolResultCards
            results={message.toolResults}
            onViewTicket={
              route.isCustomer
                ? undefined
                : (ticketId) =>
                    navigate(`/agency/support?ticket=${encodeURIComponent(ticketId)}`)
            }
          />
        ) : null}

        {showActions ? (
          <div className="relative z-10 mt-2 flex items-center gap-0.5">
            {message.content ? (
              <ActionButton label="Copy" onClick={() => void handleCopy()}>
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              </ActionButton>
            ) : null}
            {onFeedback ? (
              <>
                <ActionButton
                  label="Like"
                  active={message.feedback === "like"}
                  onClick={() =>
                    onFeedback(
                      message.id,
                      message.feedback === "like" ? "clear" : "like",
                    )
                  }
                >
                  <ThumbsUp className="size-3.5" />
                </ActionButton>
                <ActionButton
                  label="Dislike"
                  active={message.feedback === "dislike"}
                  onClick={() =>
                    onFeedback(
                      message.id,
                      message.feedback === "dislike" ? "clear" : "dislike",
                    )
                  }
                >
                  <ThumbsDown className="size-3.5" />
                </ActionButton>
              </>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
});

const STICK_BOTTOM_PX = 96;

export function ZeepoAiMessageList({
  messages,
  generations,
  streamingMessageId,
  scrollParentRef,
  activeGenerationId,
  onOpenGeneration,
  onRetryUser,
  onEditUser,
  onFeedback,
  onCopy,
  isAgencySuperAdmin = false,
  hideReasoning = false,
}: {
  messages: ZeepoAiMessage[];
  generations: ZeepoAiGeneration[];
  streamingMessageId?: string | null;
  scrollParentRef: RefObject<HTMLDivElement | null>;
  activeGenerationId?: string | null;
  onOpenGeneration: (panel: NonNullable<ZeepoAiActivePanel>) => void;
  onRetryUser?: (message: ZeepoAiMessage) => void;
  onEditUser?: (message: ZeepoAiMessage, nextContent: string) => void;
  onFeedback?: (messageId: string, feedback: "like" | "dislike" | "clear") => void;
  onCopy?: () => void;
  isAgencySuperAdmin?: boolean;
  /** Hide reasoning details for customer users */
  hideReasoning?: boolean;
}) {
  const stickToBottomRef = useRef(true);
  const rafRef = useRef<number | null>(null);
  const isStreaming = Boolean(streamingMessageId);
  const last = messages[messages.length - 1];
  const gensForLast = generations.filter((g) => g.messageId === last?.id).length;
  // Coarser scroll key while streaming  avoid layout work on every character.
  const scrollKey = isStreaming
    ? `${messages.length}:${Math.floor((last?.content?.length ?? 0) / 48)}:${last?.reasoningStatus ?? ""}:${gensForLast}`
    : `${messages.length}:${last?.content?.length ?? 0}:${last?.reasoning?.length ?? 0}:${last?.status ?? ""}:${last?.reasoningStatus ?? ""}:${gensForLast}`;
  const hasMessages = messages.length > 0;

  useEffect(() => {
    const el = scrollParentRef.current;
    if (!el) return;

    const onScroll = () => {
      const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
      stickToBottomRef.current = distance <= STICK_BOTTOM_PX;
    };

    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [scrollParentRef]);

  useEffect(() => {
    stickToBottomRef.current = true;
  }, [messages.length]);

  useEffect(() => {
    const el = scrollParentRef.current;
    if (!el) return;

    const schedulePin = () => {
      if (!stickToBottomRef.current) return;
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        if (!stickToBottomRef.current) return;
        el.scrollTop = el.scrollHeight;
      });
    };

    schedulePin();

    const content = el.firstElementChild;
    let ro: ResizeObserver | null = null;
    if (content && typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(schedulePin);
      ro.observe(content);
    }

    return () => {
      ro?.disconnect();
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [scrollParentRef, hasMessages]);

  useEffect(() => {
    const el = scrollParentRef.current;
    if (!el || !stickToBottomRef.current) return;
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      if (!stickToBottomRef.current) return;
      el.scrollTop = el.scrollHeight;
    });
  }, [scrollKey, isStreaming, scrollParentRef]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-7 px-3 py-5 sm:px-4 md:px-6">
      {messages.map((message, index) => {
        const isLast = index === messages.length - 1;
        const animateEnter = !isStreaming || !isLast;
        if (message.role === "user") {
          return (
            <ZeepoAiUserBubble
              key={message.id}
              content={message.content}
              attachments={message.attachments}
              onCopy={onCopy}
              animateEnter={animateEnter}
              onRetry={
                onRetryUser && !streamingMessageId
                  ? () => onRetryUser(message)
                  : undefined
              }
              onEditSave={
                onEditUser && !streamingMessageId
                  ? (next) => onEditUser(message, next)
                  : undefined
              }
            />
          );
        }
        return (
          <ZeepoAiAssistantBubble
            key={message.id}
            message={message}
            generations={generations.filter((g) => g.messageId === message.id)}
            keepReasoningOpen={streamingMessageId === message.id && message.status === "streaming"}
            activeGenerationId={activeGenerationId}
            onOpenGeneration={onOpenGeneration}
            onFeedback={onFeedback}
            onCopy={onCopy}
            animateEnter={animateEnter}
            isAgencySuperAdmin={isAgencySuperAdmin}
            hideReasoning={hideReasoning}
          />
        );
      })}
      <div className="h-px w-full shrink-0" aria-hidden />
    </div>
  );
}
