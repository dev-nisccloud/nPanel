"use client";

import * as React from "react";
import {
  ChevronDown,
  ChevronUp,
  ImageIcon,
  Loader2,
  Paperclip,
  Plus,
  Send,
  Sparkles,
  Square,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AiMarkdownRenderer } from "@/components/ai/ai-markdown-renderer";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { UploadProgressRing } from "@/components/upload-progress-ring";
import { ZeepoMascot } from "@/components/zeepo/zeepo-mascot";

/** Chat session: full width with hosting-detail gutters (max-w-7xl). */
export const ZEEPO_AGENCY_PAGE_SHELL =
  "@container/main flex min-h-0 flex-1 flex-col overflow-hidden px-4 pt-3 sm:px-5 sm:pt-4 md:px-6 md:pt-5 lg:px-8";
export const ZEEPO_AGENCY_PAGE_CONTENT = "w-full max-w-7xl mx-auto";

/** Session chat: centered floating compose dock (same width as landing). */
export const ZEEPO_CHAT_COMPOSE_COLUMN = "mx-auto w-full max-w-3xl";

/** Landing (/agency/zeepo-ai-agent): centered column; one scroll region for the whole page. */
export const ZEEPO_AGENCY_LANDING_PAGE =
  "zeepo-landing relative flex min-h-0 w-full flex-1 flex-col overflow-hidden";
export const ZEEPO_AGENCY_LANDING_SCROLL =
  "zeepo-landing-scroll min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain";
export const ZEEPO_AGENCY_LANDING_CONTENT =
  "relative mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-5 sm:px-5 md:px-6 zeepo-landing-enter";

/** Elapsed seconds while `active` is true (resets when inactive). */
export function useElapsedSeconds(active: boolean) {
  const [seconds, setSeconds] = React.useState(0);
  React.useEffect(() => {
    if (!active) {
      setSeconds(0);
      return;
    }
    const start = Date.now();
    const id = window.setInterval(() => {
      setSeconds(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [active]);
  return seconds;
}

export function formatElapsed(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function ZeepoAgentIdentity({
  badge,
  className,
}: {
  badge?: string | null;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="size-8 shrink-0 overflow-hidden rounded-full ring-1 ring-border/60 shadow-sm">
        <img src="/zepo.png" alt="" className="size-8 object-cover" width={32} height={32} />
      </div>
      <span className="text-[13px] font-semibold tracking-tight text-foreground/80">Zeepo</span>
      {badge ? (
        <span className="rounded-md border border-border/70 bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          {badge}
        </span>
      ) : null}
    </div>
  );
}

function ThinkingDots() {
  return (
    <span className="flex items-center gap-1" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 rounded-full bg-muted-foreground/50"
          style={{ animationDelay: `${i * 0.2}s`, animation: "zeepo-dot-pulse 1.2s ease-in-out infinite" }}
        />
      ))}
    </span>
  );
}

export function ZeepoUserMessage({
  content,
  skillLabel,
  attachments,
  timestamp,
}: {
  content: string;
  skillLabel?: string | null;
  attachments?: { url: string; name: string }[];
  timestamp?: string | null;
}) {
  return (
    <div className="flex justify-end">
      <div className="flex max-w-[min(80%,28rem)] flex-col items-end gap-1.5">
        {attachments && attachments.length > 0 ? (
          <div className="flex flex-wrap justify-end gap-1.5">
            {attachments.map((a, i) => (
              <a
                key={i}
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block overflow-hidden rounded-xl shadow-md transition-opacity hover:opacity-90"
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
        <div className="relative rounded-2xl rounded-tr-[0.25rem] bg-muted px-4 py-3">
          {skillLabel ? (
            <div className="mb-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Zap className="size-3 shrink-0" aria-hidden />
              <span className="font-medium">{skillLabel}</span>
            </div>
          ) : null}
          <AiMarkdownRenderer
            content={content}
            className="text-[15px] leading-relaxed prose-p:my-1 prose-headings:my-2"
          />
        </div>
        {timestamp ? (
          <time className="px-1 text-[10px] tabular-nums text-muted-foreground/60">{timestamp}</time>
        ) : null}
      </div>
    </div>
  );
}

export function ZeepoAssistantMessage({
  content,
  timestamp,
}: {
  content: string;
  timestamp?: string | null;
}) {
  return (
    <div className="flex w-full min-w-0 items-start gap-3">
      <div className="shrink-0 pt-0.5">
        <div className="size-8 overflow-hidden rounded-full ring-1 ring-border/60 shadow-sm">
          <img src="/zepo.png" alt="" className="size-full object-cover" width={32} height={32} />
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="text-[12px] font-semibold tracking-tight text-foreground/70 leading-none select-none">Zeepo</p>
        <AiMarkdownRenderer
          content={content}
          className="text-[15px] leading-relaxed text-foreground/90 prose-p:my-1.5 prose-headings:my-2.5"
        />
        {timestamp ? (
          <time className="text-[10px] tabular-nums text-muted-foreground/50">{timestamp}</time>
        ) : null}
      </div>
    </div>
  );
}

export function ZeepoStepIndicator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 pl-11 text-[13px] text-muted-foreground/80">
      <span
        className="size-1.5 shrink-0 rounded-full bg-muted-foreground/40"
        aria-hidden
      />
      <span>{label}</span>
    </div>
  );
}

type GenerationProgressItem = {
  id: string;
  label: string;
  detail?: string;
  status: "pending" | "completed" | "failed";
  thumbnailUrl?: string | null;
  icon?: "image" | "sparkle";
};

export function ZeepoGenerationProgressCard({
  title,
  subtitle,
  thumbnailUrl,
  pending,
}: {
  title: string;
  subtitle?: string;
  thumbnailUrl?: string | null;
  pending?: boolean;
}) {
  return (
    <div className="flex w-full min-w-0 items-center gap-3 rounded-2xl border border-border bg-card px-3.5 py-3 shadow-sm">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-foreground text-background">
        <Sparkles className="size-4" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground leading-snug">{title}</p>
        {subtitle ? (
          <p className="mt-0.5 text-xs text-muted-foreground leading-snug">{subtitle}</p>
        ) : null}
      </div>
      <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-muted/30">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt="" className="size-full object-cover" />
        ) : pending ? (
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        ) : (
          <ImageIcon className="size-5 text-muted-foreground/50" />
        )}
      </div>
    </div>
  );
}

export function ZeepoThinkingBlock({
  label,
  showIntermediate,
}: {
  label: string;
  showIntermediate?: boolean;
}) {
  return (
    <div className="flex w-full min-w-0 items-start gap-3">
      <div className="shrink-0 pt-0.5">
        <div className="size-8 overflow-hidden rounded-full ring-1 ring-border/60 shadow-sm">
          <img src="/zepo.png" alt="" className="size-full object-cover" width={32} height={32} />
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="text-[12px] font-semibold tracking-tight text-foreground/70 leading-none select-none">Zeepo</p>
        <div className="flex items-center gap-2.5 py-1">
          <ThinkingDots />
          <span className="text-sm text-muted-foreground">
            {showIntermediate ? "Still working on your request…" : "Thinking…"}
          </span>
        </div>
      </div>
    </div>
  );
}

export function ZeepoEmptyThread({
  skillTitle,
  rotatingCapability,
}: {
  skillTitle?: string | null;
  rotatingCapability?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 sm:py-20 text-center">
      <ZeepoMascot className="h-14 w-14 sm:h-16 sm:w-16 mb-4" />
      <p className="text-base font-medium text-foreground">
        {skillTitle ? skillTitle : "Your AI agent, ready to work"}
      </p>
      <p className="mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
        {skillTitle ? (
          "Tell me what you need and I'll take it from here - ask follow-up questions, refine, and deliver."
        ) : (
          <>
            I can {rotatingCapability ?? "help with creative, research, and operational tasks."}
          </>
        )}
      </p>
    </div>
  );
}

export type ZeepoActivityDockProps = {
  active: boolean;
  taskLabel: string;
  detail?: string;
  progressCurrent?: number;
  progressTotal?: number;
  thumbnailUrl?: string | null;
  expanded: boolean;
  onToggleExpanded: () => void;
  children?: React.ReactNode;
};

export function ZeepoActivityDock({
  active,
  taskLabel,
  detail,
  progressCurrent = 0,
  progressTotal = 0,
  thumbnailUrl,
  expanded,
  onToggleExpanded,
  children,
}: ZeepoActivityDockProps) {
  const elapsed = useElapsedSeconds(active);
  const showExpand = Boolean(children);

  if (!active && !showExpand) return null;

  const barClass =
    "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors";

  const barContent = (
    <>
      <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-muted/40">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt="" className="size-full object-cover" />
        ) : (
          <Sparkles className="size-4 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {active ? (
            <span className="relative flex size-2 shrink-0">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/40 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
          ) : null}
          <span className="truncate text-sm font-medium text-foreground">{taskLabel}</span>
        </div>
        {detail || active ? (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {active ? `${formatElapsed(elapsed)} · ${detail ?? "Working…"}` : detail}
          </p>
        ) : null}
      </div>
      {progressTotal > 0 ? (
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {progressCurrent}/{progressTotal}
        </span>
      ) : null}
      {showExpand ? (
        expanded ? (
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronUp className="size-4 shrink-0 text-muted-foreground" />
        )
      ) : null}
    </>
  );

  return (
    <div className="border-b border-border">
      {showExpand ? (
        <button
          type="button"
          onClick={onToggleExpanded}
          className={cn(barClass, "hover:bg-muted/30 w-full")}
          aria-expanded={expanded}
        >
          {barContent}
        </button>
      ) : (
        <div className={barClass}>{barContent}</div>
      )}
      {expanded && showExpand ? <div className="px-2 pb-2">{children}</div> : null}
    </div>
  );
}

export type ZeepoComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
  isSending?: boolean;
  canSend?: boolean;
  onAttach?: () => void;
  attachDisabled?: boolean;
  isUploading?: boolean;
  uploadProgressPercent?: number;
  onSkills?: () => void;
  skillsDisabled?: boolean;
  selectedSkillTitle?: string | null;
  onClearSkill?: () => void;
  /** Sample-prompt category pill (shown after attach icon). */
  promptCategory?: { label: string; className?: string; icon?: LucideIcon } | null;
  onClearPromptCategory?: () => void;
  pendingPreviews?: { previewUrl: string; name: string; onRemove: () => void }[];
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
  showStop?: boolean;
  onStop?: () => void;
  footer?: React.ReactNode;
  className?: string;
};

export function ZeepoComposer({
  value,
  onChange,
  onSubmit,
  placeholder = "Message Zeepo",
  disabled,
  isSending,
  canSend = true,
  onAttach,
  attachDisabled,
  isUploading,
  uploadProgressPercent = 0,
  onSkills,
  skillsDisabled,
  selectedSkillTitle,
  onClearSkill,
  promptCategory,
  onClearPromptCategory,
  pendingPreviews,
  textareaRef,
  showStop,
  onStop,
  footer,
  className,
}: ZeepoComposerProps) {
  const internalRef = React.useRef<HTMLTextAreaElement>(null);
  const ref = textareaRef ?? internalRef;

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value, ref]);

  const PromptCategoryIcon = promptCategory?.icon;

  return (
    <div className={cn("flex flex-col", className)}>
      {selectedSkillTitle ? (
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-muted/60 px-2.5 py-1 text-xs font-medium">
            <Zap className="size-3 text-muted-foreground" />
            <span className="truncate">{selectedSkillTitle}</span>
            {onClearSkill ? (
              <button
                type="button"
                aria-label="Remove skill"
                className="rounded-full p-0.5 hover:bg-muted"
                onClick={onClearSkill}
              >
                <X className="size-3" />
              </button>
            ) : null}
          </span>
        </div>
      ) : null}

      {pendingPreviews && pendingPreviews.length > 0 ? (
        <div className="flex flex-wrap gap-2 border-b border-border px-3 py-2">
          {pendingPreviews.map((p, i) => (
            <div key={i} className="relative">
              <img
                src={p.previewUrl}
                alt={p.name}
                className="size-14 rounded-lg border border-border object-cover"
              />
              <button
                type="button"
                aria-label="Remove attachment"
                className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-foreground text-background shadow-sm"
                onClick={p.onRemove}
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={1}
        disabled={disabled}
        className="w-full resize-none bg-transparent px-4 pt-3.5 pb-2 text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none min-h-[52px] max-h-[200px]"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (canSend && !disabled) onSubmit();
          }
        }}
      />

      <div className="flex items-center justify-between gap-2 px-3 pb-3 pt-0.5">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          {onSkills ? (
            <button
              type="button"
              aria-label="Skills"
              disabled={skillsDisabled}
              className={cn(
                "flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors",
                "hover:bg-muted hover:text-foreground disabled:opacity-40",
              )}
              onClick={onSkills}
            >
              <Plus className="size-5" />
            </button>
          ) : null}
          {onAttach ? (
            <button
              type="button"
              aria-label="Attach file"
              disabled={attachDisabled}
              className={cn(
                "flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors",
                "hover:bg-muted hover:text-foreground disabled:opacity-40",
              )}
              onClick={onAttach}
            >
              {isUploading ? (
                <UploadProgressRing percent={uploadProgressPercent} size={28} strokeWidth={3} />
              ) : (
                <Paperclip className="size-5" />
              )}
            </button>
          ) : null}
          {promptCategory ? (
            <span
              className={cn(
                "inline-flex max-w-[min(100%,10rem)] shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium leading-none",
                promptCategory.className,
              )}
            >
              {PromptCategoryIcon ? (
                <PromptCategoryIcon className="size-3 shrink-0" aria-hidden />
              ) : null}
              <span className="truncate">{promptCategory.label}</span>
              {onClearPromptCategory ? (
                <button
                  type="button"
                  aria-label="Clear prompt category"
                  className="rounded-full p-0.5 opacity-70 transition-opacity hover:opacity-100"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onClearPromptCategory?.();
                  }}
                >
                  <X className="size-3 shrink-0" />
                </button>
              ) : null}
            </span>
          ) : null}
        </div>

        {showStop && onStop ? (
          <button
            type="button"
            aria-label="Stop"
            className="flex size-9 items-center justify-center rounded-full bg-foreground text-background hover:bg-foreground/90"
            onClick={onStop}
          >
            <Square className="size-3.5 fill-current" />
          </button>
        ) : (
          <button
            type="button"
            aria-label="Send"
            disabled={!canSend || disabled || isSending}
            className={cn(
              "flex size-9 items-center justify-center rounded-full transition-colors",
              canSend && !disabled
                ? "bg-foreground text-background hover:bg-foreground/90"
                : "bg-muted text-muted-foreground cursor-not-allowed",
            )}
            onClick={onSubmit}
          >
            {isSending ? (
              <Spinner size={14} className="text-current" />
            ) : (
              <Send className="size-4" />
            )}
          </button>
        )}
      </div>

      {footer}
    </div>
  );
}

/** Floating dock: optional activity bar + composer in one card */
export function ZeepoFloatingDock({
  activity,
  composer,
  className,
  isLanding,
}: {
  activity?: React.ReactNode;
  composer: React.ReactNode;
  className?: string;
  /** When true, applies the animated rainbow-glow border for the landing page. */
  isLanding?: boolean;
}) {
  return (
    <div
      className={cn(
        "zeepo-composer-shell overflow-hidden rounded-2xl border border-border/70 bg-card",
        "zeepo-floating-dock-shadow transition-[border-color,box-shadow] duration-300",
        "focus-within:border-foreground/20 focus-within:shadow-[0_4px_24px_rgba(0,0,0,0.08)]",
        "dark:focus-within:shadow-[0_4px_28px_rgba(0,0,0,0.45)]",
        isLanding && "zeepo-composer-glow",
        className,
      )}
    >
      {activity}
      {composer}
    </div>
  );
}
