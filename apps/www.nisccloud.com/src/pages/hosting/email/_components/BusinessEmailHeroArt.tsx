import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "motion/react";
import { Archive, BadgeCheck, Mail, Send, ShieldCheck, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils.ts";

const ADDRESS = "you@yourbusiness.co.ke";
const CHECKS = [
  { label: "Spam and phishing filtered", icon: ShieldCheck },
  { label: "Sender verified (DKIM, SPF, DMARC)", icon: BadgeCheck },
  { label: "Backed up daily", icon: Archive },
];

/** Types the address once, then ticks the protection checks; reduced motion shows the end state. */
function useHeroSequence() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4, once: true });
  const reduceMotion = useReducedMotion() ?? false;
  const [typed, setTyped] = useState(0);
  const [checks, setChecks] = useState(0);

  useEffect(() => {
    if (reduceMotion) {
      setTyped(ADDRESS.length);
      setChecks(CHECKS.length);
      return;
    }
    if (!inView) return;
    let n = 0;
    const timers: number[] = [];
    const id = window.setInterval(() => {
      n += 1;
      setTyped(n);
      if (n >= ADDRESS.length) {
        window.clearInterval(id);
        CHECKS.forEach((_, i) => timers.push(window.setTimeout(() => setChecks(i + 1), 350 + i * 420)));
      }
    }, 65);
    return () => {
      window.clearInterval(id);
      timers.forEach(window.clearTimeout);
    };
  }, [inView, reduceMotion]);

  return { ref, typed, checks };
}

/** Hero illustration: a new message from a branded address, with the protections that come with it. */
export function BusinessEmailHeroArt() {
  const { ref, typed, checks } = useHeroSequence();
  const done = typed >= ADDRESS.length;

  return (
    <div
      ref={ref}
      role="img"
      aria-label="Illustration: a new email from you@yourbusiness.co.ke with spam filtering, sender verification and daily backups"
      className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-sky-50 via-white to-amber-50/70 p-5 sm:p-7 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgb(56_182_255_/_0.16)_1px,transparent_0)] [background-size:18px_18px]" />

      <div className="relative rounded-2xl border border-border bg-card shadow-[0_30px_60px_-35px_rgb(14_87_118_/_0.5)]">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Mail className="size-4 text-primary" aria-hidden />
          <span className="text-sm font-semibold text-foreground">New message</span>
          <span className="ml-auto rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-sky-800 dark:text-primary">Nisc Mail</span>
        </div>
        <dl className="space-y-3 px-4 py-4 text-[15px]">
          <div className="flex gap-3">
            <dt className="w-16 shrink-0 text-muted-foreground">From</dt>
            <dd className="min-w-0 break-all font-semibold text-foreground">
              {ADDRESS.slice(0, typed)}
              {!done ? <span className="ml-0.5 inline-block h-4 w-1.5 translate-y-0.5 bg-primary" aria-hidden /> : null}
            </dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-16 shrink-0 text-muted-foreground">Subject</dt>
            <dd className="font-medium text-foreground">Your quotation is attached</dd>
          </div>
        </dl>
        <div className="mx-4 mb-4 rounded-xl border border-dashed border-primary/40 bg-primary/[0.05] p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-sky-800 dark:text-primary">
            <Sparkles className="size-3.5" aria-hidden /> AI draft, ready for your review
          </p>
          <div className={cn("mt-2 space-y-1.5 transition-opacity duration-700", done ? "opacity-100" : "opacity-30")} aria-hidden>
            <span className="block h-2 w-full rounded-full bg-muted" />
            <span className="block h-2 w-11/12 rounded-full bg-muted" />
            <span className="block h-2 w-2/3 rounded-full bg-muted" />
          </div>
        </div>
        <div className="flex items-center justify-end border-t border-border px-4 py-3">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-bold text-[#02070a]">
            <Send className="size-3.5" aria-hidden /> Send
          </span>
        </div>
      </div>

      <ul className="relative mt-4 grid gap-2 sm:grid-cols-3">
        {CHECKS.map(({ label, icon: Icon }, i) => {
          const on = i < checks;
          return (
            <li
              key={label}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all duration-500",
                on ? "border-emerald-500/40 bg-card text-foreground" : "border-dashed border-border bg-card/60 text-muted-foreground",
              )}
            >
              <Icon className={cn("size-4 shrink-0", on ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground/50")} aria-hidden />
              {label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
