"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const DEFAULT_MAX_LINES = 5;

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  maxLines?: number;
};

function mergeRefs<T>(...refs: Array<React.Ref<T> | undefined>) {
  return (node: T) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === "function") ref(node);
      else (ref as React.MutableRefObject<T | null>).current = node;
    }
  };
}

function resizeToContent(el: HTMLTextAreaElement, maxLines: number) {
  el.style.height = "auto";
  const computed = window.getComputedStyle(el);
  const lineHeight = Number.parseFloat(computed.lineHeight) || 24;
  const maxHeight = lineHeight * maxLines;
  const next = Math.min(Math.max(el.scrollHeight, lineHeight), maxHeight);
  el.style.height = `${next}px`;
  el.style.overflowY = el.scrollHeight > maxHeight + 1 ? "auto" : "hidden";
}

/** Grows with typed content up to `maxLines`, then scrolls inside the field. */
export const ZeepoAiAutosizeTextarea = React.forwardRef<HTMLTextAreaElement, Props>(
  function ZeepoAiAutosizeTextarea(
    { className, value, maxLines = DEFAULT_MAX_LINES, onChange, onInput, ...props },
    forwardedRef,
  ) {
    const localRef = React.useRef<HTMLTextAreaElement>(null);

    const sync = React.useCallback(() => {
      const el = localRef.current;
      if (el) resizeToContent(el, maxLines);
    }, [maxLines]);

    React.useLayoutEffect(() => {
      sync();
    }, [sync, value]);

    return (
      <textarea
        {...props}
        ref={mergeRefs(localRef, forwardedRef)}
        rows={1}
        value={value}
        onChange={(event) => {
          onChange?.(event);
          resizeToContent(event.currentTarget, maxLines);
        }}
        onInput={(event) => {
          onInput?.(event);
          resizeToContent(event.currentTarget, maxLines);
        }}
        className={cn(
          "w-full resize-none overflow-x-hidden bg-transparent",
          "zeepo-ai-autosize-textarea max-h-[calc(1.625em*5)] text-[15px] leading-relaxed text-foreground outline-none",
          "placeholder:text-muted-foreground/60",
          "whitespace-pre-wrap break-words [overflow-wrap:anywhere]",
          "disabled:cursor-not-allowed disabled:opacity-70",
          className,
        )}
      />
    );
  },
);
