"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type TopProgressBarProps = {
  /** When true, shows + animates progress. When false, completes then fades out. */
  active: boolean;
  className?: string;
};

const TICK_MS = 180;
const MAX_ACTIVE_PROGRESS = 92;
const MIN_VISIBLE_MS = 250;

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function TopProgressBar({ active, className }: TopProgressBarProps) {
  const [visible, setVisible] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [fadingOut, setFadingOut] = React.useState(false);

  const startedAtRef = React.useRef<number>(0);
  const tickRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const hideTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduceMotionRef = React.useRef(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    reduceMotionRef.current = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  }, []);

  const clearTimers = React.useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const finishAndHide = React.useCallback(
    (minDelayMs: number) => {
      clearTimers();

      hideTimeoutRef.current = setTimeout(() => {
        setFadingOut(true);
        setProgress(100);

        // Let the width transition + opacity transition complete.
        hideTimeoutRef.current = setTimeout(() => {
          setVisible(false);
          setFadingOut(false);
          setProgress(0);
          hideTimeoutRef.current = null;
        }, 220);
      }, Math.max(0, minDelayMs));
    },
    [clearTimers]
  );

  React.useEffect(() => {
    if (active) {
      clearTimers();
      startedAtRef.current = Date.now();
      setVisible(true);
      setFadingOut(false);

      const start = clamp(Math.round(10 + Math.random() * 12), 8, 22);
      setProgress((p) => (p > 0 ? p : start));

      if (reduceMotionRef.current) {
        setProgress(85);
        return;
      }

      tickRef.current = setInterval(() => {
        setProgress((p) => {
          // Ease toward MAX_ACTIVE_PROGRESS with a bit of jitter so it feels “alive”.
          const distance = MAX_ACTIVE_PROGRESS - p;
          if (distance <= 0) return MAX_ACTIVE_PROGRESS;
          const step = Math.max(0.6, distance * (0.06 + Math.random() * 0.02));
          return clamp(p + step, 0, MAX_ACTIVE_PROGRESS);
        });
      }, TICK_MS);

      return clearTimers;
    }

    // inactive
    if (!visible) return;
    const elapsed = Date.now() - startedAtRef.current;
    const remainingMin = Math.max(0, MIN_VISIBLE_MS - elapsed);

    // If reduced motion, don't do the easing; just hide quickly.
    if (reduceMotionRef.current) {
      finishAndHide(remainingMin);
      return;
    }

    finishAndHide(remainingMin);
    return clearTimers;
  }, [active, clearTimers, finishAndHide, visible]);

  React.useEffect(() => clearTimers, [clearTimers]);

  if (!visible) return null;

  return (
    <div
      className={cn(
        "pointer-events-none fixed left-0 right-0 z-[60]",
        // Always truly at the top (handles iOS safe-area too)
        "top-0",
        className
      )}
      style={{ top: "env(safe-area-inset-top, 0px)" }}
      aria-hidden="true"
    >
      <div className="h-1.5 w-full bg-transparent">
        <div
          className={cn(
            "h-full origin-left transition-[width,opacity] duration-200 ease-out",
            "bg-gradient-to-r from-primary via-primary/80 to-primary",
            "shadow-[0_0_10px_hsl(var(--primary)/0.35)]",
            fadingOut ? "opacity-0" : "opacity-100"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

