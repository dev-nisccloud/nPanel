import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "motion/react";

const TYPE_MS = 55;
const DELETE_MS = 28;
const HOLD_MS = 2200;
const GAP_MS = 350;

/**
 * Types and deletes a rotating set of phrases. Assistive technology and reduced-motion
 * visitors get the first phrase as plain text; typing runs only while it is on screen.
 */
export function TypedPhrase({
  phrases,
  className = "text-primary",
  caretClassName = "bg-brand-orange",
}: {
  phrases: readonly string[];
  className?: string;
  caretClassName?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { amount: 0.5 });
  const reduceMotion = useReducedMotion() ?? false;
  const animate = inView && !reduceMotion && phrases.length > 1;
  const [text, setText] = useState(phrases[0] ?? "");
  const state = useRef({ index: 0, length: (phrases[0] ?? "").length, deleting: true });

  useEffect(() => {
    if (!animate) return;
    let timer: number;
    const tick = () => {
      const s = state.current;
      const phrase = phrases[s.index] ?? "";
      if (s.deleting) {
        if (s.length > 0) {
          s.length -= 1;
          setText(phrase.slice(0, s.length));
          timer = window.setTimeout(tick, DELETE_MS);
          return;
        }
        s.deleting = false;
        s.index = (s.index + 1) % phrases.length;
        timer = window.setTimeout(tick, GAP_MS);
        return;
      }
      const next = phrases[s.index] ?? "";
      if (s.length < next.length) {
        s.length += 1;
        setText(next.slice(0, s.length));
        timer = window.setTimeout(tick, TYPE_MS);
        return;
      }
      s.deleting = true;
      timer = window.setTimeout(tick, HOLD_MS);
    };
    timer = window.setTimeout(tick, HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [animate, phrases]);

  const longest = phrases.reduce((a, b) => (b.length > a.length ? b : a), "");

  return (
    <span ref={ref} className="inline-grid text-left">
      <span aria-hidden className="invisible [grid-area:1/1]">
        {longest}
        <span className="ml-1 inline-block w-[2px]" />
      </span>
      <span className="[grid-area:1/1]">
        <span className="sr-only">{phrases[0]}</span>
        <span aria-hidden className={className}>
          {animate ? text : phrases[0]}
        </span>
        {animate ? (
          <span aria-hidden className={`ml-1 inline-block h-[0.85em] w-[2px] translate-y-[0.1em] animate-pulse rounded-full ${caretClassName}`} />
        ) : null}
      </span>
    </span>
  );
}
