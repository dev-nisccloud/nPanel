import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "motion/react";
import { CheckCircle2, CircleDashed } from "lucide-react";
import { cn } from "@/lib/utils.ts";

const RECORDS = [
  { type: "MX", job: "Delivers your mail to Nisc Mail" },
  { type: "SPF", job: "Lists the servers allowed to send for you" },
  { type: "DKIM", job: "Signs each message you send" },
  { type: "DMARC", job: "Tells inboxes what to do with fakes" },
];

/** Domain email records turning green one by one, once the panel scrolls into view. */
export function MailRecordsArt() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.5, once: true });
  const reduceMotion = useReducedMotion() ?? false;
  const [ready, setReady] = useState(0);

  useEffect(() => {
    if (reduceMotion) {
      setReady(RECORDS.length);
      return;
    }
    if (!inView) return;
    const timers = RECORDS.map((_, i) => window.setTimeout(() => setReady(i + 1), 400 + i * 550));
    return () => timers.forEach(window.clearTimeout);
  }, [inView, reduceMotion]);

  const all = ready >= RECORDS.length;

  return (
    <div
      ref={ref}
      role="img"
      aria-label="Illustration: MX, SPF, DKIM and DMARC records for a business domain, each marked as set up"
      className="rounded-3xl border border-border bg-card p-5 sm:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="type-label text-primary dark:text-primary">Domain email records</p>
          <p className="mt-1 text-base font-semibold text-foreground">yourbusiness.co.ke</p>
        </div>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold transition-colors duration-500",
            all ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-muted text-muted-foreground",
          )}
        >
          {all ? "Ready to send" : "Setting up"}
        </span>
      </div>
      <ul className="mt-5 space-y-2">
        {RECORDS.map(({ type, job }, i) => {
          const on = i < ready;
          return (
            <li
              key={type}
              className={cn(
                "flex items-center gap-3 rounded-2xl border p-3 transition-colors duration-500",
                on ? "border-emerald-500/40 bg-emerald-500/[0.05]" : "border-dashed border-border",
              )}
            >
              <span className="w-16 shrink-0 font-mono text-sm font-bold text-foreground">{type}</span>
              <span className="min-w-0 flex-1 text-[15px] text-muted-foreground">{job}</span>
              {on ? (
                <CheckCircle2 className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
              ) : (
                <CircleDashed className="size-5 shrink-0 text-muted-foreground/50" aria-hidden />
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
