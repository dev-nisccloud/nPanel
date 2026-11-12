import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils.ts";

const LINES: { kind: "cmd" | "out" | "ok"; text: string }[] = [
  { kind: "cmd", text: "ssh -i ~/.ssh/id_ed25519 root@your-server-ip" },
  { kind: "out", text: "Welcome to your new VPS" },
  { kind: "cmd", text: "apt update && apt upgrade -y" },
  { kind: "out", text: "All packages are up to date." },
  { kind: "cmd", text: "apt install -y nginx" },
  { kind: "ok", text: "nginx is running on port 80" },
];

/** Plays the first commands on a new server once, line by line, when it scrolls into view. */
export function VpsFirstMinutesArt() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.5, once: true });
  const reduceMotion = useReducedMotion() ?? false;
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (reduceMotion) {
      setShown(LINES.length);
      return;
    }
    if (!inView) return;
    const timers = LINES.map((_, i) => window.setTimeout(() => setShown(i + 1), 300 + i * 650));
    return () => timers.forEach(window.clearTimeout);
  }, [inView, reduceMotion]);

  return (
    <div
      ref={ref}
      role="img"
      aria-label="Illustration: connecting to a new VPS with an SSH key, updating it and installing a web server"
      className="overflow-hidden rounded-3xl border border-border bg-[#0b1220] text-slate-100 shadow-[0_30px_60px_-40px_rgb(2_7_10_/_0.8)]"
    >
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <span className="size-3 rounded-full bg-red-400/80" aria-hidden />
        <span className="size-3 rounded-full bg-amber-400/80" aria-hidden />
        <span className="size-3 rounded-full bg-emerald-400/80" aria-hidden />
        <span className="ml-3 font-mono text-sm text-white/70">Your first five minutes</span>
      </div>
      <ol className="space-y-2 px-4 py-5 font-mono text-[14px] leading-relaxed sm:px-5">
        {LINES.map((line, i) => (
          <li
            key={line.text}
            className={cn(
              "break-all transition-opacity duration-300",
              i < shown ? "opacity-100" : "opacity-0",
              line.kind === "cmd" && "text-white",
              line.kind === "out" && "text-white/60",
              line.kind === "ok" && "text-emerald-300",
            )}
          >
            {line.kind === "cmd" ? <span className="mr-2 text-primary">$</span> : null}
            {line.kind === "ok" ? <span className="mr-2">✓</span> : null}
            {line.text}
          </li>
        ))}
      </ol>
    </div>
  );
}
