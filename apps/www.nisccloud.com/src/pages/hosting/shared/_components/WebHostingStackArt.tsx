import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "motion/react";
import { Code2, Layers, LayoutTemplate, Puzzle, Server, Terminal } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const STACKS: { label: string; icon: LucideIcon; tone: string }[] = [
  { label: "WordPress", icon: LayoutTemplate, tone: "bg-primary/15 text-primary dark:text-primary" },
  { label: "Custom websites", icon: Code2, tone: "bg-brand-orange/15 text-[#b9411f] dark:text-brand-orange" },
  { label: "PHP", icon: Server, tone: "bg-primary/15 text-primary dark:text-primary" },
  { label: "Laravel", icon: Layers, tone: "bg-brand-orange/15 text-[#b9411f] dark:text-brand-orange" },
  { label: "Joomla", icon: Puzzle, tone: "bg-primary/15 text-primary dark:text-primary" },
  { label: "Node.js", icon: Code2, tone: "bg-brand-orange/15 text-[#b9411f] dark:text-brand-orange" },
];

const TERMINAL_LINES: { prompt?: boolean; text: string }[] = [
  { prompt: true, text: "ssh you@yourbusiness.co.ke" },
  { text: "Connected to your web hosting" },
  { prompt: true, text: "php artisan migrate" },
  { prompt: true, text: "npm run build" },
];

const TOTAL_CHARS = TERMINAL_LINES.reduce((sum, line) => sum + line.text.length, 0);

/** Types the terminal once when it scrolls into view; output lines appear whole after their command. */
function useTypedChars(ref: React.RefObject<HTMLElement | null>) {
  const inView = useInView(ref, { amount: 0.5, once: true });
  const reduceMotion = useReducedMotion() ?? false;
  const [chars, setChars] = useState(0);
  useEffect(() => {
    if (reduceMotion) {
      setChars(TOTAL_CHARS);
      return;
    }
    if (!inView) return;
    const id = window.setInterval(() => {
      setChars((value) => {
        if (value >= TOTAL_CHARS) {
          window.clearInterval(id);
          return value;
        }
        return value + 1;
      });
    }, 38);
    return () => window.clearInterval(id);
  }, [inView, reduceMotion]);
  return chars;
}

/** Illustration of the technologies web hosting supports, with SSH access. */
export function WebHostingStackArt() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const typed = useTypedChars(terminalRef);
  let remaining = typed;
  const shown = TERMINAL_LINES.map((line) => {
    if (!line.prompt) {
      const visible = remaining >= line.text.length;
      remaining = Math.max(remaining - line.text.length, 0);
      return { ...line, text: visible ? line.text : "", started: visible };
    }
    const text = line.text.slice(0, remaining);
    const started = remaining > 0;
    remaining = Math.max(remaining - line.text.length, 0);
    return { ...line, text, started };
  });
  const typing = typed < TOTAL_CHARS;

  return (
    <div
      role="img"
      aria-label="Illustration: WordPress, custom websites, PHP, Laravel, Joomla and Node.js on web hosting, with an SSH terminal session"
      className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-[#38b6ff]/5 via-white to-orange-50/60 p-5 sm:p-6 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgb(56_182_255_/_0.16)_1px,transparent_0)] [background-size:18px_18px]" />

      <ul className="relative grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {STACKS.map(({ label, icon: Icon, tone }) => (
          <li key={label} className="flex items-center gap-2.5 rounded-2xl border border-border bg-card p-3 shadow-[0_10px_24px_-22px_rgb(2_7_10_/_0.6)]">
            <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${tone}`}>
              <Icon size={16} strokeWidth={2} />
            </span>
            <span className="text-sm font-semibold text-foreground">{label}</span>
          </li>
        ))}
      </ul>

      <div
        ref={terminalRef}
        className="relative mt-4 overflow-hidden rounded-2xl bg-[#02070a] text-[13px] text-slate-200 shadow-lg ring-1 ring-white/10"
      >
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
          <Terminal className="size-4 text-primary" />
          <span className="font-semibold text-white">SSH & command line</span>
        </div>
        <ol className="min-h-[7.25rem] space-y-1.5 px-4 py-3 font-mono" aria-hidden>
          {shown.map((line, index) =>
            line.started || index === 0 ? (
              <li key={index} className={line.prompt ? "break-all text-slate-100" : "break-all text-emerald-300"}>
                {line.prompt ? <span className="mr-2 text-primary">$</span> : null}
                {line.text}
                {typing && line.prompt && line.text.length > 0 && line.text.length < TERMINAL_LINES[index].text.length ? (
                  <span className="ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 bg-primary" />
                ) : null}
              </li>
            ) : null,
          )}
        </ol>
      </div>
    </div>
  );
}
