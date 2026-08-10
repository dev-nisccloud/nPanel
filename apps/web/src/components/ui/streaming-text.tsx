"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type StreamingMode = "character" | "word";

export type AiStreamingTextProps = {
  text: string;
  /** Ms between reveal ticks. Lower = faster. */
  speed?: number;
  mode?: StreamingMode;
  showCursor?: boolean;
  /** When false, snap to full text (end of stream). */
  active?: boolean;
  className?: string;
  onComplete?: () => void;
};

/**
 * Smooth typewriter for live SSE streams.
 * Growing `text` does not reset — the reveal catches up to the latest target.
 */
export function AiStreamingText({
  text,
  speed = 16,
  mode = "character",
  showCursor = true,
  active = true,
  className,
  onComplete,
}: AiStreamingTextProps) {
  const [displayedText, setDisplayedText] = React.useState("");
  const targetRef = React.useRef(text);
  const displayedRef = React.useRef("");
  const rafRef = React.useRef<number | null>(null);
  const lastTickRef = React.useRef(0);
  const onCompleteRef = React.useRef(onComplete);
  onCompleteRef.current = onComplete;

  const stopLoop = React.useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const ensureLoop = React.useCallback(() => {
    if (rafRef.current != null) return;

    const step = (time: number) => {
      rafRef.current = null;
      const target = targetRef.current;
      let shown = displayedRef.current;

      if (shown.length > 0 && !target.startsWith(shown)) {
        shown = "";
        displayedRef.current = "";
      }

      if (!active) {
        if (shown !== target) {
          displayedRef.current = target;
          setDisplayedText(target);
        }
        onCompleteRef.current?.();
        return;
      }

      if (time - lastTickRef.current >= speed) {
        lastTickRef.current = time;

        if (shown.length < target.length) {
          const behind = target.length - shown.length;
          let nextLen = shown.length;

          if (mode === "word") {
            if (behind > 120) {
              nextLen = Math.min(target.length, shown.length + Math.ceil(behind / 4));
            } else {
              const rest = target.slice(shown.length);
              const take =
                behind > 40
                  ? rest.match(/^(\s*\S+){1,3}|^\s+/)?.[0]
                  : rest.match(/^\s*\S+|^\s+/)?.[0];
              nextLen = shown.length + (take?.length ?? 1);
            }
          } else {
            const chunk =
              behind > 160 ? Math.ceil(behind / 6) : behind > 48 ? 4 : behind > 16 ? 2 : 1;
            nextLen = Math.min(target.length, shown.length + chunk);
          }

          const next = target.slice(0, nextLen);
          displayedRef.current = next;
          setDisplayedText(next);
        }
      }

      if (displayedRef.current.length < targetRef.current.length) {
        rafRef.current = requestAnimationFrame(step);
      }
    };

    rafRef.current = requestAnimationFrame(step);
  }, [active, speed, mode]);

  React.useEffect(() => {
    targetRef.current = text;

    if (!active) {
      stopLoop();
      displayedRef.current = text;
      setDisplayedText(text);
      onCompleteRef.current?.();
      return;
    }

    ensureLoop();
  }, [text, active, ensureLoop, stopLoop]);

  React.useEffect(() => () => stopLoop(), [stopLoop]);

  const showCaret = Boolean(showCursor && active);

  return (
    <div
      data-slot="ai-streaming-text"
      role="status"
      aria-live="polite"
      aria-busy={active}
      className={cn("relative text-[15px] leading-[1.65] text-foreground/95", className)}
    >
      <span className="whitespace-pre-wrap break-words">{displayedText}</span>
      {showCaret ? (
        <span
          className="ml-0.5 inline-block h-[1.15em] w-[2px] animate-pulse bg-current align-middle will-change-[opacity]"
          aria-hidden
        />
      ) : null}
    </div>
  );
}

export type { StreamingMode };
export default AiStreamingText;
