/**
 * Glass Mock Stages  context-specific product UI on a soft sky canvas (#d9eeff).
 * Primary chrome. Notifications, graphs, and tools only where they belong.
 */

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import type { VisualTheme } from "@/components/shadcn-space/blocks/built-different-01/visual-context.ts";

type StageProps = { label: string };

/* ─── Shared chrome ─────────────────────────────────────────────────────── */

function MockCanvas({ children }: { children: ReactNode }) {
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[1.75rem] md:aspect-[5/4] md:rounded-[2rem]">
      <div className="absolute inset-0 bg-[#d9eeff]" />
      <div
        className="absolute inset-0 opacity-45"
        style={{
          background:
            "radial-gradient(75% 55% at 18% 12%, rgb(255 255 255 / 0.65), transparent 55%), radial-gradient(60% 45% at 92% 88%, rgb(56 182 255 / 0.18), transparent 50%)",
        }}
      />
      <div className="absolute left-[12%] top-0 h-3 w-16 rounded-b-xl bg-primary/20" />
      <div className="absolute bottom-[16%] right-0 h-14 w-3 rounded-l-xl bg-primary/20" />
      <div className="relative z-10 flex size-full items-stretch gap-2.5 p-3.5 md:gap-3 md:p-5">
        {children}
      </div>
    </div>
  );
}

function Glass({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border border-primary/15 bg-white/85 shadow-[0_10px_30px_-16px_rgb(56_182_255/0.45)] backdrop-blur-sm ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

function Window({
  title,
  badge,
  children,
  className,
}: {
  title: string;
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Glass className={`flex min-w-0 flex-1 flex-col overflow-hidden ${className ?? ""}`}>
      <div className="flex items-center justify-between border-b border-primary/10 px-3 py-2.5">
        <div className="flex gap-1">
          <span className="size-1.5 rounded-full bg-primary/40" />
          <span className="size-1.5 rounded-full bg-primary/30" />
          <span className="size-1.5 rounded-full bg-primary/20" />
        </div>
        <span className="text-[10px] font-semibold tracking-wide text-primary">{title}</span>
        <div className="min-w-[2rem] text-right">{badge}</div>
      </div>
      {children}
    </Glass>
  );
}

function SideRail({ icons, active = 0 }: { icons: ReactNode[]; active?: number }) {
  return (
    <Glass className="flex w-10 shrink-0 flex-col items-center gap-3 py-3 md:w-11 md:py-3.5">
      {icons.map((icon, i) => (
        <motion.div
          key={i}
          className={i === active ? "text-primary" : "text-primary/45"}
          animate={i === active ? { scale: [1, 1.12, 1] } : { opacity: [0.45, 0.75, 0.45] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.15 }}
        >
          {icon}
        </motion.div>
      ))}
      <div className="mt-auto flex size-7 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-[10px] font-bold text-primary">
        N
      </div>
    </Glass>
  );
}

/** Sliding toast notification  bold white */
function ToastLoop({
  items,
  interval = 3200,
}: {
  items: { title: string; body: string }[];
  interval?: number;
}) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setI((v) => (v + 1) % items.length), interval);
    return () => window.clearInterval(id);
  }, [items.length, interval]);

  const item = items[i]!;
  return (
    <div className="pointer-events-none absolute right-2.5 top-10 z-20 w-[58%] max-w-[170px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={item.title + i}
          initial={{ opacity: 0, x: 28, y: -6 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 16, y: -4 }}
          transition={{ duration: 0.35 }}
          className="rounded-xl border border-primary/15 bg-white px-2.5 py-2 shadow-[0_10px_30px_-8px_rgb(56_182_255/0.35)]"
        >
          <div className="flex items-start gap-2">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">
              N
            </span>
            <div className="min-w-0">
              <div className="truncate text-[10px] font-bold text-primary">{item.title}</div>
              <div className="truncate text-[9px] text-primary/70">{item.body}</div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/** Animated bar chart  white bars */
function BarChart({
  values,
  className,
}: {
  values: number[];
  className?: string;
}) {
  return (
    <div className={`flex items-end gap-1 ${className ?? ""}`}>
      {values.map((h, i) => (
        <motion.div
          key={i}
          className="flex-1 rounded-t-sm bg-primary"
          animate={{ height: [`${h * 0.4}%`, `${h}%`, `${h * 0.55}%`, `${h}%`] }}
          transition={{ duration: 3.4, repeat: Infinity, delay: i * 0.08, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

/** Animated sparkline */
function Sparkline({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 56" className={className ?? "h-full w-full"} aria-hidden>
      <motion.path
        d="M2 44 C18 42, 28 30, 42 28 C56 26, 64 36, 78 24 C92 12, 104 18, 118 14 C132 10, 144 8, 158 6"
        fill="none"
        stroke="var(--primary)"
        strokeWidth="2.25"
        strokeLinecap="round"
        animate={{ pathLength: [0, 1, 1, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, times: [0, 0.45, 0.8, 1] }}
      />
      <motion.circle
        r="3.5"
        fill="var(--primary)"
        animate={{
          cx: [2, 42, 78, 118, 158, 158, 2],
          cy: [44, 28, 24, 14, 6, 6, 44],
          opacity: [0, 1, 1, 1, 1, 0, 0],
        }}
        transition={{ duration: 4.5, repeat: Infinity }}
      />
    </svg>
  );
}

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary">
      <motion.span
        className="size-1.5 rounded-full bg-white"
        animate={{ opacity: [1, 0.25, 1] }}
        transition={{ duration: 1.4, repeat: Infinity }}
      />
      Live
    </span>
  );
}

/* Icons  bold white strokes */
const I = {
  chart: (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M2 12V9M6 12V5M10 12V8M14 12V3" strokeLinecap="round" />
    </svg>
  ),
  text: (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 3h10M8 3v10M5 13h6" strokeLinecap="round" />
    </svg>
  ),
  pen: (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M10 2l4 4-8 8H2v-4l8-8z" strokeLinejoin="round" />
    </svg>
  ),
  node: (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="4" cy="8" r="2" />
      <circle cx="12" cy="4" r="2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M6 8h4M11.2 5.5L6.8 7.2M11.2 10.5L6.8 8.8" />
    </svg>
  ),
  spark: (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M8 1l1.2 4.2L13 6.5l-3.8 1.3L8 12l-1.2-4.2L3 6.5l3.8-1.3L8 1z" strokeLinejoin="round" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 8.5l3.2 3.2L13 4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  pin: (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M8 14s5-4.2 5-8a5 5 0 10-10 0c0 3.8 5 8 5 8z" />
      <circle cx="8" cy="6" r="1.5" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M8 1.5l5 2v4c0 3.2-2.2 5.4-5 6.5-2.8-1.1-5-3.3-5-6.5v-4l5-2z" />
    </svg>
  ),
  mail: (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="2" y="3.5" width="12" height="9" rx="1.5" />
      <path d="M2.5 5l5.5 4 5.5-4" strokeLinecap="round" />
    </svg>
  ),
  bolt: (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M9 1L4 9h4l-1 6 5-8H8l1-6z" strokeLinejoin="round" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="6" cy="5" r="2" />
      <circle cx="11" cy="6" r="1.5" />
      <path d="M2 13c0-2 1.8-3.5 4-3.5s4 1.5 4 3.5M10 9.5c1.4.2 2.5 1.2 2.5 2.5" strokeLinecap="round" />
    </svg>
  ),
  lock: (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3.5" y="7" width="9" height="7" rx="1.5" />
      <path d="M5.5 7V5a2.5 2.5 0 015 0v2" strokeLinecap="round" />
    </svg>
  ),
  phone: (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="4.5" y="1.5" width="7" height="13" rx="1.5" />
      <path d="M7 12.5h2" strokeLinecap="round" />
    </svg>
  ),
  cal: (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="2" y="3" width="12" height="11" rx="1.5" />
      <path d="M2 7h12M5 1.5v3M11 1.5v3" strokeLinecap="round" />
    </svg>
  ),
  mountain: (
    <svg viewBox="0 0 24 24" className="size-8 text-primary" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 17l6-8 4 5 3-4 5 7H3z" strokeLinejoin="round" />
    </svg>
  ),
};

/* ─── Theme-specific stages ─────────────────────────────────────────────── */

function BrandStage() {
  return (
    <MockCanvas>
      <div className="relative flex min-w-0 flex-1">
        <Window title="Brand kit" badge={<span className="text-[9px] font-bold text-slate-700">v2</span>}>
          <div className="grid flex-1 grid-cols-2 grid-rows-2 gap-2 p-2.5 md:p-3">
            <Glass className="relative flex items-center justify-center overflow-hidden">
              <motion.div
                className="flex size-12 items-center justify-center rounded-2xl bg-white text-lg font-black text-primary md:size-14"
                animate={{ scale: [0.94, 1.05, 0.94], rotate: [0, -3, 2, 0] }}
                transition={{ duration: 3.6, repeat: Infinity }}
              >
                N
              </motion.div>
              {/* Pen tool drawing around mark */}
              <motion.svg
                viewBox="0 0 80 80"
                className="absolute inset-2 text-slate-700"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <motion.path
                  d="M18 52 C28 28, 52 22, 62 34"
                  strokeLinecap="round"
                  animate={{ pathLength: [0, 1, 1, 0], opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 3.8, repeat: Infinity, times: [0, 0.4, 0.75, 1] }}
                />
                <motion.circle
                  r="2.5"
                  fill="var(--primary)"
                  animate={{ cx: [18, 40, 62, 62, 18], cy: [52, 30, 34, 34, 52], opacity: [0, 1, 1, 0, 0] }}
                  transition={{ duration: 3.8, repeat: Infinity }}
                />
              </motion.svg>
            </Glass>
            <Glass className="flex flex-col justify-center gap-2 px-3">
              <span className="text-[9px] font-bold uppercase tracking-wider text-primary/70">Palette</span>
              <div className="flex gap-1.5">
                {["bg-white", "bg-primary/40", "bg-primary/25", "bg-primary/15"].map((c, i) => (
                  <motion.span
                    key={c}
                    className={`size-5 rounded-full border border-primary/25 ${c}`}
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </Glass>
            <Glass className="flex flex-col justify-center gap-1 px-3">
              <span className="text-[9px] font-bold uppercase tracking-wider text-primary/70">Type</span>
              <motion.span
                className="text-2xl font-black leading-none text-slate-700"
                animate={{ opacity: [0.55, 1, 0.55] }}
                transition={{ duration: 2.6, repeat: Infinity }}
              >
                Aa
              </motion.span>
              <span className="text-[9px] text-slate-700/65">Display · Body</span>
            </Glass>
            <Glass className="flex flex-col justify-center gap-1.5 px-3">
              <span className="text-[9px] font-bold uppercase tracking-wider text-primary/70">Guide</span>
              {[0.95, 0.75, 0.55].map((w, i) => (
                <motion.div
                  key={i}
                  className="h-1.5 rounded-full bg-white"
                  style={{ width: `${w * 100}%` }}
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.18 }}
                />
              ))}
            </Glass>
          </div>
          <div className="border-t border-primary/15 p-2.5">
            <Glass className="flex items-center gap-2 px-3 py-2">
              <motion.span
                className="text-[10px] font-medium text-slate-700/80"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Export logo pack…
              </motion.span>
              <motion.div
                className="ml-auto flex size-6 items-center justify-center rounded-full bg-white text-primary"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {I.spark}
              </motion.div>
            </Glass>
          </div>
        </Window>
        <ToastLoop
          items={[
            { title: "Logo approved", body: "Primary mark locked in" },
            { title: "Palette synced", body: "4 colours · brand kit" },
            { title: "Files ready", body: "AI · SVG · PNG exported" },
          ]}
        />
      </div>
      <SideRail icons={[I.pen, I.text, I.chart, I.spark]} active={0} />
    </MockCanvas>
  );
}

function ClarityStage() {
  return (
    <MockCanvas>
      <div className="relative flex min-w-0 flex-1">
        <Window title="Guidelines" badge={<span className="text-[9px] font-bold text-slate-700">PDF</span>}>
          <div className="flex flex-1 flex-col gap-2 p-2.5 md:p-3">
            {[
              { t: "Logo clear space", d: "Minimum margin = x-height" },
              { t: "Typography", d: "H1 40 · Body 16 · Caption 12" },
              { t: "Do / Don’t", d: "No stretch · No recolour" },
              { t: "Social crops", d: "1:1 · 4:5 · 16:9" },
            ].map((row, i) => (
              <motion.div
                key={row.t}
                className="flex items-center gap-2.5 rounded-xl border border-primary/15 bg-primary/5 px-2.5 py-2"
                initial={false}
                animate={{ opacity: [0.5, 1, 0.5], x: [0, 2, 0] }}
                transition={{ duration: 3.2, repeat: Infinity, delay: i * 0.35 }}
              >
                <span className="flex size-7 items-center justify-center rounded-lg bg-white text-[10px] font-black text-primary">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-slate-700">{row.t}</div>
                  <div className="text-[9px] text-slate-700/65">{row.d}</div>
                </div>
                <span className="ml-auto text-slate-700">{I.check}</span>
              </motion.div>
            ))}
          </div>
        </Window>
        <ToastLoop
          items={[
            { title: "Guide updated", body: "Team can use tonight" },
            { title: "Clear next step", body: "Apply rules to website" },
          ]}
        />
      </div>
      <SideRail icons={[I.text, I.check, I.pen, I.spark]} active={0} />
    </MockCanvas>
  );
}

function TrustStage() {
  return (
    <MockCanvas>
      <div className="relative flex min-w-0 flex-1">
        <Window title="Clients" badge={<LiveBadge />}>
          <div className="grid flex-1 grid-cols-2 gap-2 p-2.5 md:p-3">
            <Glass className="flex flex-col justify-between p-3">
              <span className="text-[9px] font-bold uppercase tracking-wider text-primary/70">Trusted by</span>
              <motion.span
                className="text-3xl font-black text-slate-700"
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ duration: 2.4, repeat: Infinity }}
              >
                100+
              </motion.span>
              <span className="text-[10px] text-slate-700/65">businesses growing</span>
            </Glass>
            <Glass className="flex flex-col justify-between p-3">
              <span className="text-[9px] font-bold uppercase tracking-wider text-primary/70">NPS</span>
              <span className="text-3xl font-black text-slate-700">72</span>
              <motion.div className="h-1.5 overflow-hidden rounded-full bg-primary/10">
                <motion.div
                  className="h-full rounded-full bg-white"
                  animate={{ width: ["40%", "72%", "72%", "40%"] }}
                  transition={{ duration: 3.8, repeat: Infinity, times: [0, 0.4, 0.8, 1] }}
                />
              </motion.div>
            </Glass>
            <Glass className="col-span-2 flex items-center gap-3 p-3">
              <div className="flex -space-x-2.5">
                {["A", "M", "E", "K", "S"].map((letter, i) => (
                  <motion.div
                    key={letter}
                    className="flex size-9 items-center justify-center rounded-full border-2 border-primary bg-white text-[10px] font-black text-primary"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.12 }}
                  >
                    {letter}
                  </motion.div>
                ))}
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-slate-700">Recent wins</div>
                <motion.div
                  className="text-[10px] text-primary/70"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2.8, repeat: Infinity }}
                >
                  Amarom · Medplus · Epitome
                </motion.div>
              </div>
            </Glass>
          </div>
        </Window>
        <ToastLoop
          items={[
            { title: "New review", body: "★★★★★ “Clear process”" },
            { title: "Client renewed", body: "Enterprise · Year 2" },
          ]}
        />
      </div>
      <SideRail icons={[I.users, I.check, I.chart, I.spark]} active={0} />
    </MockCanvas>
  );
}

function ReportingStage() {
  return (
    <MockCanvas>
      <div className="relative flex min-w-0 flex-1">
        <Window title="Analytics" badge={<LiveBadge />}>
          <div className="flex gap-2 p-2.5 md:p-3">
            {[
              { l: "Traffic", v: "+38%" },
              { l: "Leads", v: "124" },
              { l: "Conv.", v: "4.2%" },
            ].map((m, i) => (
              <Glass key={m.l} className="flex flex-1 flex-col justify-between p-2.5">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-700/65">{m.l}</span>
                <motion.span
                  className="text-lg font-black text-slate-700"
                  animate={{ opacity: [0.65, 1, 0.65] }}
                  transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.25 }}
                >
                  {m.v}
                </motion.span>
              </Glass>
            ))}
          </div>
          <div className="mx-2.5 mb-2.5 flex min-h-0 flex-1 flex-col rounded-xl border border-primary/15 bg-primary/5 p-2.5 md:mx-3 md:mb-3">
            <div className="mb-1 flex items-center justify-between text-[9px] font-bold text-primary/70">
              <span>Organic · 30 days</span>
              <span className="text-slate-700">↑ trending</span>
            </div>
            <div className="min-h-0 flex-1">
              <Sparkline />
            </div>
            <BarChart values={[36, 52, 44, 70, 58, 84, 72, 90]} className="mt-1 h-10" />
          </div>
        </Window>
        <ToastLoop
          items={[
            { title: "Report ready", body: "March SEO summary" },
            { title: "Keyword up", body: "“web design nairobi” #3" },
          ]}
        />
      </div>
      <SideRail icons={[I.chart, I.bolt, I.users, I.spark]} active={0} />
    </MockCanvas>
  );
}

function GrowthStage() {
  return (
    <MockCanvas>
      <div className="relative flex min-w-0 flex-1">
        <Window title="Growth" badge={<LiveBadge />}>
          <div className="grid flex-1 grid-cols-2 gap-2 p-2.5 md:p-3">
            <Glass className="col-span-2 flex min-h-0 flex-col p-2.5">
              <div className="mb-1 flex justify-between text-[9px] font-bold text-primary/70">
                <span>Visitors</span>
                <span className="text-slate-700">12.4k</span>
              </div>
              <div className="min-h-[72px] flex-1">
                <Sparkline />
              </div>
            </Glass>
            <Glass className="p-2.5">
              <div className="text-[9px] font-bold uppercase tracking-wider text-slate-700/65">Rank</div>
              <motion.div
                className="mt-1 text-2xl font-black text-slate-700"
                animate={{ y: [2, 0, 2] }}
                transition={{ duration: 2.2, repeat: Infinity }}
              >
                ↑ 18
              </motion.div>
            </Glass>
            <Glass className="p-2.5">
              <div className="text-[9px] font-bold uppercase tracking-wider text-slate-700/65">Pages</div>
              <div className="mt-1 text-2xl font-black text-slate-700">64</div>
            </Glass>
          </div>
        </Window>
        <ToastLoop
          items={[
            { title: "Traffic spike", body: "+22% vs last week" },
            { title: "New ranking", body: "Local pack · Top 3" },
          ]}
        />
      </div>
      <SideRail icons={[I.chart, I.bolt, I.pin, I.spark]} active={0} />
    </MockCanvas>
  );
}

function ResultsStage() {
  return (
    <MockCanvas>
      <div className="relative flex min-w-0 flex-1">
        <Window title="Results" badge={<span className="text-[9px] font-bold text-slate-700">Day 30</span>}>
          <div className="flex flex-1 flex-col gap-2 p-2.5 md:p-3">
            <Glass className="p-3">
              <div className="mb-2 flex items-end justify-between">
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-700/65">KPI progress</div>
                  <div className="text-xl font-black text-slate-700">On track</div>
                </div>
                <div className="text-right text-[11px] font-bold text-slate-700">78%</div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-primary/10">
                <motion.div
                  className="h-full rounded-full bg-white"
                  animate={{ width: ["18%", "78%", "78%", "18%"] }}
                  transition={{ duration: 4.2, repeat: Infinity, times: [0, 0.45, 0.8, 1] }}
                />
              </div>
            </Glass>
            <div className="grid min-h-0 flex-1 grid-cols-2 gap-2">
              <Glass className="flex flex-col p-2.5">
                <span className="text-[9px] font-bold text-slate-700/65">ROAS</span>
                <span className="text-2xl font-black text-slate-700">3.4x</span>
                <BarChart values={[30, 45, 40, 60, 55, 75, 80]} className="mt-auto h-12" />
              </Glass>
              <Glass className="flex flex-col p-2.5">
                <span className="text-[9px] font-bold text-slate-700/65">CPL</span>
                <span className="text-2xl font-black text-slate-700">180</span>
                <span className="mt-1 text-[10px] text-slate-700/65">KES · target met</span>
                <motion.div
                  className="mt-auto flex items-center gap-1 text-[10px] font-bold text-slate-700"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {I.check} vs goal
                </motion.div>
              </Glass>
            </div>
          </div>
        </Window>
        <ToastLoop
          items={[
            { title: "KPI hit", body: "Cost per lead on target" },
            { title: "Month close", body: "Report sent to client" },
          ]}
        />
      </div>
      <SideRail icons={[I.chart, I.check, I.bolt, I.spark]} active={0} />
    </MockCanvas>
  );
}

function SpeedStage() {
  return (
    <MockCanvas>
      <div className="relative flex min-w-0 flex-1">
        <Window title="Performance" badge={<LiveBadge />}>
          <div className="grid flex-1 grid-cols-2 gap-2 p-2.5 md:p-3">
            <Glass className="relative flex flex-col items-center justify-center p-3">
              <svg viewBox="0 0 100 100" className="size-[88px] -rotate-90" aria-hidden>
                <circle cx="50" cy="50" r="38" fill="none" stroke="rgb(56 182 255 / 0.2)" strokeWidth="8" />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={239}
                  animate={{ strokeDashoffset: [180, 28, 180] }}
                  transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-700">1.1s</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-700/65">load</span>
              </div>
            </Glass>
            <div className="flex flex-col gap-2">
              {[
                { l: "LCP", v: "Good" },
                { l: "CLS", v: "0.02" },
                { l: "Score", v: "98" },
              ].map((row, i) => (
                <Glass key={row.l} className="flex items-center justify-between px-2.5 py-2">
                  <span className="text-[10px] font-bold text-primary/70">{row.l}</span>
                  <motion.span
                    className="text-[12px] font-black text-slate-700"
                    animate={{ opacity: [0.55, 1, 0.55] }}
                    transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.2 }}
                  >
                    {row.v}
                  </motion.span>
                </Glass>
              ))}
            </div>
            <Glass className="col-span-2 p-2.5">
              <div className="mb-1 text-[9px] font-bold text-slate-700/65">Request timeline</div>
              <BarChart values={[20, 35, 28, 55, 40, 70, 48, 85, 60, 90]} className="h-12" />
            </Glass>
          </div>
        </Window>
        <ToastLoop
          items={[
            { title: "Cache warm", body: "Edge hit · 18ms TTFB" },
            { title: "Lighthouse", body: "Performance 98" },
          ]}
        />
      </div>
      <SideRail icons={[I.bolt, I.chart, I.check, I.spark]} active={0} />
    </MockCanvas>
  );
}

function InboxStage() {
  const rows = [
    { from: "Lead · Westlands", preview: "Can we book a demo tomorrow?", unread: true },
    { from: "Campaign reply", preview: "Yes  send the proposal", unread: true },
    { from: "Deliverability", preview: "Spam rate 0.1% · healthy", unread: false },
    { from: "List hygiene", preview: "42 inactive removed", unread: false },
  ];
  return (
    <MockCanvas>
      <div className="relative flex min-w-0 flex-1">
        <Window
          title="Inbox"
          badge={
            <motion.span
              className="rounded-full bg-white px-1.5 py-0.5 text-[9px] font-black text-primary"
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              2 new
            </motion.span>
          }
        >
          <div className="flex flex-1 flex-col gap-1.5 p-2 md:p-2.5">
            {rows.map((row, i) => (
              <motion.div
                key={row.from}
                className="flex items-start gap-2 rounded-xl border border-primary/15 bg-primary/5 px-2.5 py-2"
                animate={{
                  opacity: row.unread ? [0.7, 1, 0.7] : 0.75,
                  borderColor: row.unread
                    ? ["rgb(56 182 255 / 0.3)", "rgb(56 182 255 / 0.7)", "rgb(56 182 255 / 0.3)"]
                    : "rgb(56 182 255 / 0.3)",
                }}
                transition={{ duration: 2.8, repeat: Infinity, delay: i * 0.2 }}
              >
                <span className={`mt-1 size-2 shrink-0 rounded-full ${row.unread ? "bg-primary" : "bg-primary/35"}`} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[11px] font-bold text-slate-700">{row.from}</div>
                  <div className="truncate text-[10px] text-slate-700/65">{row.preview}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </Window>
        <ToastLoop
          items={[
            { title: "New lead", body: "Westlands · replied in 12s" },
            { title: "Inbox clean", body: "Spam filtered · 99%" },
          ]}
        />
      </div>
      <SideRail icons={[I.mail, I.users, I.check, I.spark]} active={0} />
    </MockCanvas>
  );
}

function SupportStage() {
  return (
    <MockCanvas>
      <div className="relative flex min-w-0 flex-1">
        <Window title="Support" badge={<LiveBadge />}>
          <div className="flex flex-1 flex-col justify-end gap-2 p-3">
            <motion.div
              className="ml-auto max-w-[82%] rounded-2xl rounded-br-md bg-white px-3 py-2 text-[11px] font-semibold text-primary shadow-sm"
              animate={{ opacity: [0, 1, 1, 0], y: [8, 0, 0, -4] }}
              transition={{ duration: 4.6, repeat: Infinity, times: [0, 0.15, 0.7, 1] }}
            >
              Site feels slow on mobile 
            </motion.div>
            <motion.div
              className="mr-auto max-w-[88%] rounded-2xl rounded-bl-md border border-primary/25 bg-primary/10 px-3 py-2 text-[11px] font-medium text-slate-700"
              animate={{ opacity: [0, 0, 1, 1, 0], y: [8, 8, 0, 0, -4] }}
              transition={{ duration: 4.6, repeat: Infinity, times: [0, 0.25, 0.4, 0.75, 1] }}
            >
              On it  checking LCP + cache now.
            </motion.div>
            <div className="flex items-center gap-1.5 pl-1">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="size-1.5 rounded-full bg-white"
                  animate={{ opacity: [0.25, 1, 0.25], y: [0, -2, 0] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
              <span className="ml-1 text-[9px] font-bold text-primary/70">Agent typing</span>
            </div>
          </div>
          <div className="border-t border-primary/15 p-2.5">
            <Glass className="flex items-center px-3 py-2">
              <span className="text-[10px] text-slate-700/60">Message…</span>
              <div className="ml-auto flex size-6 items-center justify-center rounded-full bg-white text-primary">
                {I.spark}
              </div>
            </Glass>
          </div>
        </Window>
        <ToastLoop
          items={[
            { title: "Ticket #482", body: "Resolved in 6 min" },
            { title: "WhatsApp", body: "New chat · English / Swahili" },
          ]}
        />
      </div>
      <SideRail icons={[I.mail, I.users, I.check, I.spark]} active={1} />
    </MockCanvas>
  );
}

function BotStage() {
  return (
    <MockCanvas>
      <div className="relative flex min-w-0 flex-1">
        <Window title="AI assistant" badge={<LiveBadge />}>
          <div className="flex flex-1 flex-col gap-2 p-2.5 md:p-3">
            <Glass className="flex items-center gap-2.5 p-2.5">
              <motion.div
                className="flex size-10 items-center justify-center rounded-xl bg-white text-primary"
                animate={{ borderRadius: ["0.75rem", "1.1rem", "0.75rem"] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <div className="flex gap-1.5">
                  {[0, 1].map((i) => (
                    <motion.span
                      key={i}
                      className="size-1.5 rounded-full bg-primary"
                      animate={{ scaleY: [1, 0.3, 1] }}
                      transition={{ duration: 2.8, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
              </motion.div>
              <div>
                <div className="text-[11px] font-bold text-slate-700">Zeepo</div>
                <div className="text-[9px] text-slate-700/65">Qualifying · booking · handoff</div>
              </div>
            </Glass>
            <motion.div
              className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-[11px] text-slate-700"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              “Ninaweza kukusaidia ku-book appointment?”
            </motion.div>
            <div className="mt-auto space-y-1.5">
              {["Lead scored · Hot", "Calendar slot held", "Handoff to sales"].map((step, i) => (
                <motion.div
                  key={step}
                  className="flex items-center gap-2 rounded-lg border border-primary/15 bg-primary/5 px-2.5 py-1.5 text-[10px] font-bold text-slate-700"
                  animate={{ opacity: [0.35, 1, 0.35], x: [-2, 0, -2] }}
                  transition={{ duration: 3, repeat: Infinity, delay: i * 0.4 }}
                >
                  <span className="text-slate-700">{I.check}</span>
                  {step}
                </motion.div>
              ))}
            </div>
          </div>
        </Window>
        <ToastLoop
          items={[
            { title: "Lead booked", body: "Tue 10:00 · Google Cal" },
            { title: "First reply", body: "Answered in 4 seconds" },
          ]}
        />
      </div>
      <SideRail icons={[I.spark, I.cal, I.users, I.check]} active={0} />
    </MockCanvas>
  );
}

function DeployStage() {
  return (
    <MockCanvas>
      <div className="relative flex min-w-0 flex-1">
        <Window title="Deploy" badge={<LiveBadge />}>
          <div className="flex flex-1 flex-col gap-2 p-2.5 md:p-3">
            <div className="flex items-center gap-2">
              {["Build", "Test", "Ship"].map((step, i) => (
                <div key={step} className="flex flex-1 items-center">
                  <motion.div
                    className="w-full rounded-xl border border-primary/25 bg-primary/10 px-2 py-2 text-center text-[10px] font-bold text-slate-700"
                    animate={{
                      backgroundColor: [
                        "rgb(56 182 255 / 0.15)",
                        "rgb(56 182 255 / 0.4)",
                        "rgb(56 182 255 / 0.15)",
                      ],
                    }}
                    transition={{ duration: 3.2, repeat: Infinity, delay: i * 0.7 }}
                  >
                    {step}
                  </motion.div>
                  {i < 2 ? (
                    <div className="relative mx-1 h-px w-3 overflow-hidden bg-primary/15 md:w-4">
                      <motion.div
                        className="absolute inset-y-0 w-4 bg-white"
                        animate={{ x: ["-100%", "180%"] }}
                        transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.7 }}
                      />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
            <Glass className="flex-1 p-3 font-mono">
              {[
                "$ npm run build",
                "✓ compiled in 3.2s",
                "✓ health checks passed",
                "→ live on edge",
              ].map((line, i) => (
                <motion.div
                  key={line}
                  className="text-[10px] font-medium text-slate-700"
                  animate={{ opacity: [0.25, 1, 1, 0.25] }}
                  transition={{ duration: 4, repeat: Infinity, delay: i * 0.45, times: [0, 0.2, 0.75, 1] }}
                >
                  {line}
                </motion.div>
              ))}
            </Glass>
            <div className="h-2 overflow-hidden rounded-full bg-primary/10">
              <motion.div
                className="h-full rounded-full bg-white"
                animate={{ width: ["12%", "100%", "100%", "12%"] }}
                transition={{ duration: 4, repeat: Infinity, times: [0, 0.4, 0.75, 1] }}
              />
            </div>
          </div>
        </Window>
        <ToastLoop
          items={[
            { title: "Deployed", body: "Production · zero downtime" },
            { title: "SSL renewed", body: "Auto · 90 days left" },
          ]}
        />
      </div>
      <SideRail icons={[I.bolt, I.check, I.shield, I.spark]} active={0} />
    </MockCanvas>
  );
}

function UptimeStage() {
  return (
    <MockCanvas>
      <div className="relative flex min-w-0 flex-1">
        <Window title="Systems" badge={<LiveBadge />}>
          <div className="grid flex-1 grid-cols-2 gap-2 p-2.5 md:p-3">
            <Glass className="col-span-2 flex items-center justify-between p-3">
              <div>
                <div className="text-[9px] font-bold uppercase tracking-wider text-slate-700/65">Uptime</div>
                <div className="text-3xl font-black text-slate-700">99.99%</div>
              </div>
              <motion.div
                className="flex size-12 items-center justify-center rounded-full border-2 border-primary bg-primary/10"
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span className="size-3 rounded-full bg-white" />
              </motion.div>
            </Glass>
            {[
              { l: "API", v: "Operational" },
              { l: "CDN", v: "Operational" },
              { l: "Mail", v: "Operational" },
              { l: "DB", v: "Operational" },
            ].map((s, i) => (
              <Glass key={s.l} className="flex items-center gap-2 px-2.5 py-2">
                <motion.span
                  className="size-1.5 rounded-full bg-white"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.2 }}
                />
                <span className="text-[10px] font-bold text-slate-700">{s.l}</span>
                <span className="ml-auto text-[9px] text-slate-700/65">{s.v}</span>
              </Glass>
            ))}
          </div>
        </Window>
        <ToastLoop
          items={[
            { title: "All systems go", body: "No incidents · 30 days" },
            { title: "Failover ready", body: "Secondary region warm" },
          ]}
        />
      </div>
      <SideRail icons={[I.bolt, I.shield, I.chart, I.check]} active={0} />
    </MockCanvas>
  );
}

function SecurityStage() {
  return (
    <MockCanvas>
      <div className="relative flex min-w-0 flex-1">
        <Window title="Protection" badge={<span className="text-[9px] font-bold text-slate-700">SSL</span>}>
          <div className="flex flex-1 flex-col gap-2 p-2.5 md:p-3">
            <Glass className="flex items-center gap-3 p-3">
              <motion.div
                className="flex size-12 items-center justify-center rounded-xl bg-white text-primary"
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 2.6, repeat: Infinity }}
              >
                <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 3l8 3v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3z" />
                  <motion.path
                    d="M9 12l2 2 4-4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    animate={{ pathLength: [0, 1, 1, 0] }}
                    transition={{ duration: 3.5, repeat: Infinity, times: [0, 0.35, 0.75, 1] }}
                  />
                </svg>
              </motion.div>
              <div>
                <div className="text-sm font-black text-slate-700">Encrypted</div>
                <div className="text-[10px] text-slate-700/65">HTTPS · padlock active</div>
              </div>
              <span className="ml-auto rounded-lg bg-white px-2 py-1 text-[11px] font-black text-primary">A+</span>
            </Glass>
            {[
              { t: "Certificate", d: "Valid · auto-renew" },
              { t: "Threats blocked", d: "0 open · 24h" },
              { t: "Firewall", d: "Rules synced" },
            ].map((row, i) => (
              <motion.div
                key={row.t}
                className="flex items-center justify-between rounded-xl border border-primary/15 bg-primary/5 px-3 py-2"
                animate={{ opacity: [0.55, 1, 0.55] }}
                transition={{ duration: 2.6, repeat: Infinity, delay: i * 0.25 }}
              >
                <div>
                  <div className="text-[11px] font-bold text-slate-700">{row.t}</div>
                  <div className="text-[9px] text-slate-700/60">{row.d}</div>
                </div>
                <span className="text-slate-700">{I.check}</span>
              </motion.div>
            ))}
          </div>
        </Window>
        <ToastLoop
          items={[
            { title: "Threat blocked", body: "Brute force · IP banned" },
            { title: "SSL healthy", body: "Expires in 78 days" },
          ]}
        />
      </div>
      <SideRail icons={[I.shield, I.lock, I.check, I.bolt]} active={0} />
    </MockCanvas>
  );
}

function MapsStage() {
  return (
    <MockCanvas>
      <div className="relative flex min-w-0 flex-1">
        <Window title="Local search" badge={<LiveBadge />}>
          <div className="relative min-h-0 flex-1 p-2.5 md:p-3">
            <div className="absolute inset-2.5 overflow-hidden rounded-xl border border-primary/15 bg-primary/5 md:inset-3">
              <div
                className="absolute inset-0 opacity-50"
                style={{
                  backgroundImage:
                    "linear-gradient(rgb(56 182 255 / 0.18) 1px, transparent 1px), linear-gradient(90deg, rgb(56 182 255 / 0.18) 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              />
              {[
                { x: "30%", y: "38%", label: "Nairobi" },
                { x: "58%", y: "55%", label: "Westlands" },
                { x: "48%", y: "26%", label: "CBD" },
              ].map((p, i) => (
                <motion.div
                  key={p.label}
                  className="absolute"
                  style={{ left: p.x, top: p.y }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.4 }}
                >
                  <motion.span
                    className="absolute -inset-4 rounded-full border border-primary/30"
                    animate={{ scale: [0.6, 1.4], opacity: [0.6, 0] }}
                    transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.4 }}
                  />
                  <span className="block size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_14px_white]" />
                </motion.div>
              ))}
            </div>
          </div>
          <div className="flex gap-2 border-t border-primary/15 p-2.5">
            <Glass className="flex flex-1 flex-col p-2">
              <span className="text-[9px] font-bold text-slate-700/65">Pack</span>
              <span className="text-lg font-black text-slate-700">Top 3</span>
            </Glass>
            <Glass className="flex flex-1 flex-col p-2">
              <span className="text-[9px] font-bold text-slate-700/65">Areas</span>
              <span className="text-lg font-black text-slate-700">24</span>
            </Glass>
          </div>
        </Window>
        <ToastLoop
          items={[
            { title: "Maps rank up", body: "“near me” · position 2" },
            { title: "New review", body: "Google Business · ★★★★★" },
          ]}
        />
      </div>
      <SideRail icons={[I.pin, I.chart, I.users, I.spark]} active={0} />
    </MockCanvas>
  );
}

function TargetingStage() {
  return (
    <MockCanvas>
      <div className="relative flex min-w-0 flex-1">
        <Window title="Targeting" badge={<LiveBadge />}>
          <div className="flex flex-1 flex-col gap-2 p-2.5 md:p-3">
            <Glass className="relative flex min-h-[90px] items-center justify-center overflow-hidden p-3">
              {[96, 64, 34].map((size, i) => (
                <motion.div
                  key={size}
                  className="absolute rounded-full border-2 border-primary/30"
                  style={{ width: size, height: size }}
                  animate={{ scale: [1, 1.08, 1], opacity: [0.35, 0.9, 0.35] }}
                  transition={{ duration: 2.6, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
              <motion.div
                className="relative z-10 size-3 rounded-full bg-white"
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </Glass>
            <div className="grid grid-cols-2 gap-2">
              {[
                { l: "Audience", v: "Buyers 25–44" },
                { l: "Geo", v: "Nairobi +50km" },
                { l: "Waste", v: "Cut 31%" },
                { l: "Intent", v: "High" },
              ].map((m, i) => (
                <Glass key={m.l} className="p-2">
                  <div className="text-[9px] font-bold text-slate-700/65">{m.l}</div>
                  <motion.div
                    className="text-[11px] font-black text-slate-700"
                    animate={{ opacity: [0.55, 1, 0.55] }}
                    transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.15 }}
                  >
                    {m.v}
                  </motion.div>
                </Glass>
              ))}
            </div>
          </div>
        </Window>
        <ToastLoop
          items={[
            { title: "Audience refined", body: "Excluded non-buyers" },
            { title: "CPA down", body: "−18% this week" },
          ]}
        />
      </div>
      <SideRail icons={[I.users, I.chart, I.bolt, I.spark]} active={0} />
    </MockCanvas>
  );
}

function TrackingStage() {
  return (
    <MockCanvas>
      <div className="relative flex min-w-0 flex-1">
        <Window title="Attribution" badge={<LiveBadge />}>
          <div className="flex flex-1 flex-col gap-1.5 p-2.5 md:p-3">
            {[
              { step: "View", meta: "Pixel · page_view", pct: 100 },
              { step: "Click", meta: "GTM · ad_click", pct: 42 },
              { step: "Lead", meta: "Server · form_submit", pct: 11 },
              { step: "Sale", meta: "Purchase · attributed", pct: 4 },
            ].map((row, i) => (
              <motion.div
                key={row.step}
                className="rounded-xl border border-primary/15 bg-primary/5 px-2.5 py-2"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2.8, repeat: Infinity, delay: i * 0.35 }}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-700">{row.step}</span>
                  <span className="text-[9px] font-bold text-primary/70">{row.pct}%</span>
                </div>
                <div className="mb-1 text-[9px] text-primary/50">{row.meta}</div>
                <div className="h-1 overflow-hidden rounded-full bg-primary/10">
                  <motion.div
                    className="h-full rounded-full bg-white"
                    animate={{ width: ["10%", `${row.pct}%`, "10%"] }}
                    transition={{ duration: 3, repeat: Infinity, delay: i * 0.2 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </Window>
        <ToastLoop
          items={[
            { title: "Conversion", body: "Lead attributed · Meta" },
            { title: "Pixel healthy", body: "Server events flowing" },
          ]}
        />
      </div>
      <SideRail icons={[I.chart, I.node, I.check, I.spark]} active={0} />
    </MockCanvas>
  );
}

function CreativeStage() {
  return (
    <MockCanvas>
      <div className="relative flex min-w-0 flex-1">
        <Window title="A/B creative" badge={<span className="text-[9px] font-bold text-slate-700">Test</span>}>
          <div className="relative flex flex-1 items-center justify-center p-3">
            <motion.div
              className="absolute left-3 top-4 w-[46%] rounded-xl border border-primary/20 bg-primary/5 p-2.5"
              animate={{ x: [0, 4, 0], rotate: [-2, -2, -2] }}
              transition={{ duration: 3.4, repeat: Infinity }}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-700">A</span>
                <span className="text-[9px] text-slate-700/60">2.1% CTR</span>
              </div>
              <div className="mb-2 flex h-12 items-center justify-center rounded-lg bg-primary/10">{I.mountain}</div>
              <div className="h-1.5 w-4/5 rounded-full bg-primary/20" />
            </motion.div>
            <motion.div
              className="absolute right-3 top-8 w-[46%] rounded-xl border-2 border-primary bg-primary/10 p-2.5 shadow-[0_0_24px_rgb(255_255_255/0.25)]"
              animate={{ x: [0, -4, 0], y: [0, -3, 0] }}
              transition={{ duration: 3.4, repeat: Infinity }}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-700">B</span>
                <motion.span
                  className="rounded bg-white px-1.5 py-0.5 text-[9px] font-black text-primary"
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                >
                  Winner
                </motion.span>
              </div>
              <div className="mb-2 flex h-12 items-center justify-center rounded-lg bg-primary/15">{I.mountain}</div>
              <div className="h-1.5 w-4/5 rounded-full bg-white" />
            </motion.div>
          </div>
        </Window>
        <ToastLoop
          items={[
            { title: "Variant B wins", body: "+48% CTR vs A" },
            { title: "New creative", body: "Testimonial ad live" },
          ]}
        />
      </div>
      <SideRail icons={[I.pen, I.chart, I.spark, I.check]} active={0} />
    </MockCanvas>
  );
}

function FunnelStage() {
  return (
    <MockCanvas>
      <div className="relative flex min-w-0 flex-1">
        <Window title="Conversion" badge={<span className="text-[9px] font-bold text-slate-700">Journey</span>}>
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-3">
            {[
              { label: "Visit", pct: 100, w: "w-[94%]" },
              { label: "Engage", pct: 38, w: "w-[72%]" },
              { label: "Lead", pct: 12, w: "w-[52%]" },
              { label: "Sale", pct: 4, w: "w-[34%]" },
            ].map((row, i) => (
              <motion.div
                key={row.label}
                className={`${row.w} flex items-center justify-between rounded-xl border border-primary/20 bg-primary/10 px-3 py-2.5`}
                animate={{ opacity: [0.5, 1, 0.5], scaleX: [0.98, 1, 0.98] }}
                transition={{ duration: 2.8, repeat: Infinity, delay: i * 0.28 }}
              >
                <span className="text-[11px] font-black text-slate-700">{row.label}</span>
                <span className="text-[10px] font-bold text-primary/70">{row.pct}%</span>
              </motion.div>
            ))}
          </div>
        </Window>
        <ToastLoop
          items={[
            { title: "Funnel tip", body: "CTA above fold · +9%" },
            { title: "Drop-off cut", body: "Step 2 simplified" },
          ]}
        />
      </div>
      <SideRail icons={[I.chart, I.bolt, I.users, I.check]} active={0} />
    </MockCanvas>
  );
}

function AutomationStage() {
  return (
    <MockCanvas>
      <div className="relative flex min-w-0 flex-1">
        <Window title="Flows" badge={<span className="text-[9px] font-bold text-slate-700">24/7</span>}>
          <div className="flex flex-1 flex-col justify-center gap-3 p-3">
            <div className="flex items-center gap-1.5">
              {["Join", "Wait", "Email", "Tag"].map((node, i) => (
                <div key={node} className="flex flex-1 items-center">
                  <motion.div
                    className="w-full rounded-xl border border-primary/25 bg-primary/10 px-1.5 py-2 text-center text-[9px] font-black text-slate-700"
                    animate={{ opacity: [0.45, 1, 0.45] }}
                    transition={{ duration: 2.6, repeat: Infinity, delay: i * 0.35 }}
                  >
                    {node}
                  </motion.div>
                  {i < 3 ? (
                    <div className="relative mx-0.5 h-px w-2.5 bg-primary/20 md:w-3.5">
                      <motion.span
                        className="absolute top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-white"
                        animate={{ left: ["0%", "100%"], opacity: [0, 1, 0] }}
                        transition={{ duration: 1.3, repeat: Infinity, delay: i * 0.35 }}
                      />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
            <Glass className="p-3">
              <div className="mb-2 text-[9px] font-bold uppercase tracking-wider text-slate-700/65">
                Running now
              </div>
              {[
                { t: "Welcome sequence", n: "48 in flow" },
                { t: "Abandoned cart", n: "12 waiting" },
              ].map((f, i) => (
                <motion.div
                  key={f.t}
                  className="flex items-center justify-between border-t border-primary/ py-2 first:border-0 first:pt-0"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.3 }}
                >
                  <span className="text-[11px] font-bold text-slate-700">{f.t}</span>
                  <span className="text-[10px] text-slate-700/65">{f.n}</span>
                </motion.div>
              ))}
            </Glass>
          </div>
        </Window>
        <ToastLoop
          items={[
            { title: "Flow fired", body: "Welcome email · sent" },
            { title: "Subscriber tagged", body: "Buyer · segment updated" },
          ]}
        />
      </div>
      <SideRail icons={[I.node, I.mail, I.bolt, I.check]} active={0} />
    </MockCanvas>
  );
}

function PaymentStage() {
  return (
    <MockCanvas>
      <div className="relative flex min-w-0 flex-1">
        <Window title="Checkout" badge={<span className="text-[9px] font-bold text-slate-700">Secure</span>}>
          <div className="grid flex-1 grid-cols-[1.1fr_0.9fr] gap-2 p-2.5 md:p-3">
            <Glass className="flex flex-col gap-2 p-2.5">
              <div className="flex flex-1 items-center justify-center rounded-xl bg-primary/10">{I.mountain}</div>
              <div className="h-1.5 w-4/5 rounded-full bg-primary/30" />
              <div className="h-1.5 w-1/2 rounded-full bg-primary/15" />
              <div className="text-[12px] font-black text-slate-700">KES 4,200</div>
            </Glass>
            <div className="flex flex-col gap-2">
              <Glass className="flex-1 p-2.5">
                <div className="text-[9px] font-bold text-slate-700/65">Pay with</div>
                <div className="mt-2 space-y-1.5">
                  {["M-Pesa STK", "Card"].map((m, i) => (
                    <motion.div
                      key={m}
                      className="rounded-lg border border-primary/20 bg-primary/5 px-2 py-1.5 text-[10px] font-bold text-slate-700"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.35 }}
                    >
                      {m}
                    </motion.div>
                  ))}
                </div>
              </Glass>
              <motion.div
                className="rounded-xl bg-white py-2.5 text-center text-[11px] font-black text-primary"
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Pay now
              </motion.div>
            </div>
          </div>
          <div className="border-t border-primary/15 px-3 py-2">
            <div className="mb-1 flex justify-between text-[9px] font-bold text-slate-700/65">
              <span>Settling to bank</span>
              <span className="text-slate-700">KES →</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-primary/10">
              <motion.div
                className="h-full rounded-full bg-white"
                animate={{ width: ["0%", "100%", "100%", "0%"] }}
                transition={{ duration: 3.8, repeat: Infinity, times: [0, 0.4, 0.75, 1] }}
              />
            </div>
          </div>
        </Window>
        <ToastLoop
          items={[
            { title: "Payment received", body: "M-Pesa · settled" },
            { title: "Order #1082", body: "Paid · packing" },
          ]}
        />
      </div>
      <SideRail icons={[I.phone, I.lock, I.check, I.chart]} active={0} />
    </MockCanvas>
  );
}

function InventoryStage() {
  return (
    <MockCanvas>
      <div className="relative flex min-w-0 flex-1">
        <Window title="Inventory" badge={<LiveBadge />}>
          <div className="flex flex-1 flex-col gap-2 p-2.5 md:p-3">
            {[
              { name: "Classic tee", stock: 82, warn: false },
              { name: "Trail bottle", stock: 14, warn: true },
              { name: "Gift card", stock: 120, warn: false },
              { name: "Starter kit", stock: 6, warn: true },
            ].map((item, i) => (
              <div key={item.name} className="rounded-xl border border-primary/15 bg-primary/5 px-2.5 py-2">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700">{item.name}</span>
                  <motion.span
                    className="text-[10px] font-black text-slate-700"
                    animate={item.warn ? { opacity: [0.4, 1, 0.4] } : {}}
                    transition={{ duration: 1.4, repeat: Infinity }}
                  >
                    {item.stock} left
                  </motion.span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-primary/10">
                  <motion.div
                    className="h-full rounded-full bg-white"
                    animate={{ width: [`${Math.max(item.stock, 8)}%`, `${item.stock}%`] }}
                    transition={{ duration: 2.8, repeat: Infinity, delay: i * 0.15 }}
                    style={{ width: `${item.stock}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Window>
        <ToastLoop
          items={[
            { title: "Low stock", body: "Starter kit · 6 left" },
            { title: "Restock alert", body: "Trail bottle · reorder" },
          ]}
        />
      </div>
      <SideRail icons={[I.chart, I.bolt, I.check, I.spark]} active={0} />
    </MockCanvas>
  );
}

function MobileStage() {
  return (
    <MockCanvas>
      <div className="relative flex min-w-0 flex-1 items-stretch gap-2.5">
        <Glass className="flex w-[42%] max-w-[130px] flex-col overflow-hidden rounded-[1.35rem] border-primary/25">
          <div className="mx-auto mt-2 h-1 w-8 rounded-full bg-primary/30" />
          <div className="flex flex-1 flex-col gap-2 p-2.5">
            <motion.div
              className="h-[36%] rounded-xl bg-primary/15"
              animate={{ opacity: [0.55, 1, 0.55] }}
              transition={{ duration: 2.4, repeat: Infinity }}
            />
            <div className="h-1.5 w-[85%] rounded-full bg-primary/40" />
            <div className="h-1.5 w-[55%] rounded-full bg-primary/20" />
            <motion.div
              className="mt-auto rounded-lg bg-white py-2 text-center text-[10px] font-black text-primary"
              animate={{ scale: [1, 0.96, 1] }}
              transition={{ duration: 1.8, repeat: Infinity }}
            >
              Continue
            </motion.div>
          </div>
        </Glass>
        <Window title="Mobile UX" className="flex-1">
          <div className="flex flex-1 flex-col gap-2 p-2.5">
            {[
              { l: "Tap targets", v: "44px+" },
              { l: "Load", v: "1.1s" },
              { l: "Checkout", v: "3 taps" },
            ].map((r, i) => (
              <Glass key={r.l} className="flex items-center justify-between px-2.5 py-2">
                <span className="text-[10px] font-bold text-primary/70">{r.l}</span>
                <motion.span
                  className="text-[12px] font-black text-slate-700"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.2 }}
                >
                  {r.v}
                </motion.span>
              </Glass>
            ))}
            <Glass className="mt-auto p-2">
              <BarChart values={[40, 55, 48, 70, 62, 88]} className="h-10" />
            </Glass>
          </div>
        </Window>
        <ToastLoop
          items={[
            { title: "Mobile sale", body: "Checkout completed" },
            { title: "UX pass", body: "Thumb-zone CTAs OK" },
          ]}
        />
      </div>
    </MockCanvas>
  );
}

function CalendarStage() {
  return (
    <MockCanvas>
      <div className="relative flex min-w-0 flex-1">
        <Window title="Content calendar" badge={<span className="text-[9px] font-bold text-slate-700">Week</span>}>
          <div className="grid flex-1 grid-cols-7 gap-1 p-2.5 md:gap-1.5 md:p-3">
            {Array.from({ length: 14 }).map((_, i) => {
              const hasPost = i % 3 !== 2 && i < 12;
              return (
                <motion.div
                  key={i}
                  className="flex flex-col items-center justify-center gap-1 rounded-lg border border-primary/15 bg-primary/5"
                  animate={{ opacity: hasPost ? [0.55, 1, 0.55] : 0.4 }}
                  transition={{ duration: 2.6, repeat: Infinity, delay: i * 0.05 }}
                >
                  {hasPost ? <span className="size-2 rounded-full bg-white" /> : null}
                </motion.div>
              );
            })}
          </div>
          <div className="flex gap-2 border-t border-primary/15 p-2.5">
            <Glass className="flex flex-1 items-center gap-2 px-2.5 py-2">
              <span className="text-[10px] font-bold text-slate-700">12 queued</span>
            </Glass>
            <motion.div
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white px-2 py-2 text-[10px] font-black text-primary"
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 2.2, repeat: Infinity }}
            >
              {I.check} Approved
            </motion.div>
          </div>
        </Window>
        <ToastLoop
          items={[
            { title: "Post approved", body: "Thu · Instagram reel" },
            { title: "Scheduled", body: "12 posts · next 7 days" },
          ]}
        />
      </div>
      <SideRail icons={[I.cal, I.text, I.check, I.spark]} active={0} />
    </MockCanvas>
  );
}

function ApprovalStage() {
  return (
    <MockCanvas>
      <div className="relative flex min-w-0 flex-1">
        <Window title="Review" badge={<span className="text-[9px] font-bold text-slate-700">Pending</span>}>
          <div className="flex flex-1 flex-col gap-2 p-2.5 md:p-3">
            <Glass className="relative flex-1 p-3">
              <div className="mb-2 h-2 w-20 rounded-full bg-primary/20" />
              <div className="mb-1 h-2 w-32 rounded-full bg-primary/15" />
              <div className="mt-3 flex h-16 items-center justify-center rounded-xl bg-primary/10">{I.mountain}</div>
              <motion.div
                className="absolute -bottom-1 -right-1 rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-primary shadow-md"
                animate={{ scale: [1.15, 1, 1, 1.15], opacity: [0, 1, 1, 0] }}
                transition={{ duration: 3.6, repeat: Infinity, times: [0, 0.2, 0.75, 1] }}
              >
                Approved
              </motion.div>
            </Glass>
            <div className="grid grid-cols-2 gap-2">
              <motion.div className="rounded-xl border border-primary/20 bg-primary/5 py-2 text-center text-[10px] font-bold text-primary/70">
                Request changes
              </motion.div>
              <motion.div
                className="rounded-xl bg-white py-2 text-center text-[10px] font-black text-primary"
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Approve
              </motion.div>
            </div>
          </div>
        </Window>
        <ToastLoop
          items={[
            { title: "Awaiting approval", body: "3 posts in review" },
            { title: "Approved", body: "Brand-safe · scheduled" },
          ]}
        />
      </div>
      <SideRail icons={[I.check, I.text, I.cal, I.spark]} active={0} />
    </MockCanvas>
  );
}

function EngagementStage() {
  return (
    <MockCanvas>
      <div className="relative flex min-w-0 flex-1">
        <Window title="Engagement" badge={<LiveBadge />}>
          <div className="flex flex-1 flex-col gap-2 p-2.5 md:p-3">
            <div className="grid grid-cols-3 gap-2">
              {[
                { l: "Comments", v: "84" },
                { l: "Shares", v: "31" },
                { l: "DMs", v: "19" },
              ].map((m, i) => (
                <Glass key={m.l} className="p-2 text-center">
                  <motion.div
                    className="text-lg font-black text-slate-700"
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.2 }}
                  >
                    {m.v}
                  </motion.div>
                  <div className="text-[9px] font-bold text-slate-700/65">{m.l}</div>
                </Glass>
              ))}
            </div>
            <Glass className="min-h-0 flex-1 p-2.5">
              <div className="mb-1 text-[9px] font-bold text-slate-700/65">Quality over vanity</div>
              <BarChart values={[28, 44, 36, 62, 55, 78, 70, 88]} className="h-full min-h-[64px]" />
            </Glass>
            <motion.div
              className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-[11px] font-medium text-slate-700"
              animate={{ opacity: [0.45, 1, 0.45] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              “Love this  how do we order?”
            </motion.div>
          </div>
        </Window>
        <ToastLoop
          items={[
            { title: "New comment", body: "Buying intent · replied" },
            { title: "DM opened", body: "Lead warmed · handoff" },
          ]}
        />
      </div>
      <SideRail icons={[I.users, I.mail, I.chart, I.spark]} active={0} />
    </MockCanvas>
  );
}

function TypingStage() {
  const full = "Subject: Your offer is ready";
  const [n, setN] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => {
      setN((v) => (v >= full.length ? 0 : v + 1));
    }, 90);
    return () => window.clearInterval(id);
  }, []);
  return (
    <MockCanvas>
      <div className="relative flex min-w-0 flex-1">
        <Window title="Copywriter" badge={<span className="text-[9px] font-bold text-slate-700">Draft</span>}>
          <div className="flex flex-1 flex-col gap-2 p-2.5 md:p-3">
            <Glass className="p-3">
              <div className="mb-1 text-[9px] font-bold uppercase tracking-wider text-slate-700/65">Subject</div>
              <div className="min-h-[1.25rem] text-[12px] font-bold text-slate-700">
                {full.slice(0, n)}
                <motion.span
                  className="ml-0.5 inline-block h-3.5 w-0.5 bg-white align-middle"
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.7, repeat: Infinity }}
                />
              </div>
            </Glass>
            <Glass className="flex flex-1 flex-col gap-2 p-3">
              <div className="text-[9px] font-bold text-slate-700/65">Body</div>
              {[0.95, 0.8, 0.65, 0.5].map((w, i) => (
                <motion.div
                  key={i}
                  className="h-1.5 rounded-full bg-white"
                  style={{ width: `${w * 100}%` }}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </Glass>
          </div>
        </Window>
        <ToastLoop
          items={[
            { title: "Draft ready", body: "Brand voice matched" },
            { title: "Subject tested", body: "Open-rate variant B" },
          ]}
        />
      </div>
      <SideRail icons={[I.text, I.mail, I.spark, I.check]} active={0} />
    </MockCanvas>
  );
}

function SegmentsStage() {
  return (
    <MockCanvas>
      <div className="relative flex min-w-0 flex-1">
        <Window title="Segments" badge={<LiveBadge />}>
          <div className="flex flex-1 flex-col gap-2 p-2.5 md:p-3">
            {[
              { name: "Buyers", n: "1,240", color: "bg-white" },
              { name: "Local Nairobi", n: "860", color: "bg-primary/40" },
              { name: "New subs", n: "312", color: "bg-primary/25" },
              { name: "Inactive 90d", n: "188", color: "bg-primary/15" },
            ].map((s, i) => (
              <motion.div
                key={s.name}
                className="flex items-center gap-2.5 rounded-xl border border-primary/15 bg-primary/5 px-2.5 py-2.5"
                animate={{ opacity: [0.5, 1, 0.5], x: [-2, 0, -2] }}
                transition={{ duration: 2.8, repeat: Infinity, delay: i * 0.25 }}
              >
                <span className={`size-2.5 rounded-full ${s.color}`} />
                <span className="text-[11px] font-bold text-slate-700">{s.name}</span>
                <span className="ml-auto text-[11px] font-black text-slate-700">{s.n}</span>
              </motion.div>
            ))}
          </div>
        </Window>
        <ToastLoop
          items={[
            { title: "Segment updated", body: "Buyers · +24 today" },
            { title: "Campaign targeted", body: "Local Nairobi only" },
          ]}
        />
      </div>
      <SideRail icons={[I.users, I.mail, I.chart, I.spark]} active={0} />
    </MockCanvas>
  );
}

function IntegrateStage() {
  return (
    <MockCanvas>
      <div className="relative flex min-w-0 flex-1">
        <Window title="Integrations" badge={<span className="text-[9px] font-bold text-slate-700">Connected</span>}>
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-3">
            <div className="flex flex-wrap justify-center gap-2">
              {["CRM", "Calendar", "Pay", "Sheets", "Zapier"].map((t, i) => (
                <motion.span
                  key={t}
                  className="rounded-xl border border-primary/25 bg-primary/10 px-3 py-2 text-[11px] font-black text-slate-700"
                  animate={{ y: [4, 0, 4], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2.6, repeat: Infinity, delay: i * 0.15 }}
                >
                  {t}
                </motion.span>
              ))}
            </div>
            <Glass className="w-full p-3">
              {[
                { a: "Form → CRM", s: "Synced" },
                { a: "Cal → Bookings", s: "Live" },
                { a: "Pay → Orders", s: "Live" },
              ].map((row, i) => (
                <motion.div
                  key={row.a}
                  className="flex items-center justify-between border-b border-primary/ py-2 last:border-0"
                  animate={{ opacity: [0.45, 1, 0.45] }}
                  transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.25 }}
                >
                  <span className="text-[11px] font-bold text-slate-700">{row.a}</span>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-slate-700">
                    {I.check} {row.s}
                  </span>
                </motion.div>
              ))}
            </Glass>
          </div>
        </Window>
        <ToastLoop
          items={[
            { title: "CRM synced", body: "Lead pushed to HubSpot" },
            { title: "Calendar linked", body: "Slot held for demo" },
          ]}
        />
      </div>
      <SideRail icons={[I.node, I.cal, I.check, I.spark]} active={0} />
    </MockCanvas>
  );
}

function CodeStage() {
  return (
    <MockCanvas>
      <div className="relative flex min-w-0 flex-1">
        <Window title="site.tsx" badge={<span className="font-mono text-[9px] font-bold text-slate-700">build</span>}>
          <div className="flex flex-1 flex-col gap-2 p-3 font-mono md:p-4">
            {[
              { c: "const page = () => (", w: "w-[85%]" },
              { c: "  <Hero />", w: "w-[55%]" },
              { c: "  <Offer />", w: "w-[50%]" },
              { c: "  <CTA />", w: "w-[45%]" },
              { c: ")", w: "w-[20%]" },
            ].map((row, i) => (
              <motion.div
                key={row.c}
                className="flex items-center gap-2"
                animate={{ opacity: [0.35, 1, 0.35] }}
                transition={{ duration: 2.8, repeat: Infinity, delay: i * 0.18 }}
              >
                <span className="w-3 text-[9px] text-primary/40">{i + 1}</span>
                <div className={`h-2 ${row.w} rounded-full bg-white`} />
              </motion.div>
            ))}
            <div className="mt-auto rounded-xl border border-primary/15 bg-primary/5 px-3 py-2 text-[10px] font-bold text-slate-700">
              No page builders · Hand-coded
            </div>
          </div>
        </Window>
        <ToastLoop
          items={[
            { title: "Build passed", body: "Typecheck · lint clean" },
            { title: "Ship ready", body: "Performance budget OK" },
          ]}
        />
      </div>
      <SideRail icons={[I.node, I.bolt, I.check, I.spark]} active={0} />
    </MockCanvas>
  );
}

function AlgorithmStage() {
  return (
    <MockCanvas>
      <div className="relative flex min-w-0 flex-1">
        <Window title="Reach" badge={<LiveBadge />}>
          <div className="flex flex-1 flex-col gap-2 p-2.5 md:p-3">
            <div className="grid grid-cols-2 gap-2">
              <Glass className="p-2.5">
                <div className="text-[9px] font-bold text-slate-700/65">Impressions</div>
                <div className="text-xl font-black text-slate-700">84k</div>
              </Glass>
              <Glass className="p-2.5">
                <div className="text-[9px] font-bold text-slate-700/65">Eng. rate</div>
                <div className="text-xl font-black text-slate-700">6.2%</div>
              </Glass>
            </div>
            <Glass className="min-h-0 flex-1 p-2.5">
              <div className="mb-1 text-[9px] font-bold text-slate-700/65">Algorithm fit · 7 days</div>
              <BarChart values={[28, 46, 38, 66, 58, 80, 72, 90]} className="h-full min-h-[70px]" />
            </Glass>
          </div>
        </Window>
        <ToastLoop
          items={[
            { title: "Reach up", body: "Reel format · +34%" },
            { title: "Algo shift", body: "Strategy adjusted" },
          ]}
        />
      </div>
      <SideRail icons={[I.chart, I.bolt, I.users, I.spark]} active={0} />
    </MockCanvas>
  );
}

function EthicalStage() {
  return (
    <MockCanvas>
      <div className="relative flex min-w-0 flex-1">
        <Window title="SEO health" badge={<span className="text-[9px] font-bold text-slate-700">Clean</span>}>
          <div className="flex flex-1 flex-col gap-2 p-2.5 md:p-3">
            <Glass className="flex items-center gap-3 p-3">
              <div className="flex size-11 items-center justify-center rounded-full border-2 border-primary bg-primary/10 text-slate-700">
                {I.shield}
              </div>
              <div>
                <div className="text-sm font-black text-slate-700">White-hat only</div>
                <div className="text-[10px] text-slate-700/65">No spam links · no stuffing</div>
              </div>
            </Glass>
            {[
              { t: "Link profile", d: "Natural · relevant" },
              { t: "Content", d: "Helpful · original" },
              { t: "Tech SEO", d: "Indexable · fast" },
            ].map((row, i) => (
              <motion.div
                key={row.t}
                className="flex items-center justify-between rounded-xl border border-primary/15 bg-primary/5 px-3 py-2"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2.6, repeat: Infinity, delay: i * 0.25 }}
              >
                <div>
                  <div className="text-[11px] font-bold text-slate-700">{row.t}</div>
                  <div className="text-[9px] text-slate-700/60">{row.d}</div>
                </div>
                <span className="text-slate-700">{I.check}</span>
              </motion.div>
            ))}
          </div>
        </Window>
        <ToastLoop
          items={[
            { title: "Audit clean", body: "0 toxic links found" },
            { title: "Safe growth", body: "Compounding rankings" },
          ]}
        />
      </div>
      <SideRail icons={[I.shield, I.check, I.chart, I.spark]} active={0} />
    </MockCanvas>
  );
}

function MigrationStage() {
  return (
    <MockCanvas>
      <div className="relative flex min-w-0 flex-1">
        <Window title="Migration" badge={<LiveBadge />}>
          <div className="flex flex-1 flex-col justify-center gap-4 p-4">
            <div className="flex items-center gap-2">
              <Glass className="px-3 py-2 text-[11px] font-bold text-primary/70">Old host</Glass>
              <div className="relative h-px flex-1 overflow-hidden bg-primary/15">
                <motion.div
                  className="absolute inset-y-0 w-10 bg-white"
                  animate={{ x: ["-100%", "220%"] }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                />
              </div>
              <Glass className="border-primary/ bg-primary/15 px-3 py-2 text-[11px] font-black text-slate-700">
                Nisc
              </Glass>
            </div>
            <Glass className="p-3 font-mono">
              {[
                "✓ DNS cutover",
                "✓ Mailboxes synced",
                "✓ SSL issued",
                "→ Zero downtime",
              ].map((line, i) => (
                <motion.div
                  key={line}
                  className="text-[10px] font-bold text-slate-700"
                  animate={{ opacity: [0.3, 1, 1, 0.3] }}
                  transition={{ duration: 3.8, repeat: Infinity, delay: i * 0.4, times: [0, 0.2, 0.75, 1] }}
                >
                  {line}
                </motion.div>
              ))}
            </Glass>
          </div>
        </Window>
        <ToastLoop
          items={[
            { title: "Site live", body: "Moved with zero downtime" },
            { title: "Mail OK", body: "All mailboxes active" },
          ]}
        />
      </div>
      <SideRail icons={[I.bolt, I.check, I.shield, I.spark]} active={0} />
    </MockCanvas>
  );
}

function PricingStage() {
  return (
    <MockCanvas>
      <div className="relative flex min-w-0 flex-1">
        <Window title="Pricing" badge={<span className="text-[9px] font-bold text-slate-700">Clear</span>}>
          <div className="flex flex-1 flex-col p-2.5 md:p-3">
            {["Setup", "SSL", "Support", "Migration"].map((item, i) => (
              <motion.div
                key={item}
                className="flex items-center justify-between border-b border-primary/ px-2 py-3 last:border-0"
                animate={{ opacity: [0.45, 1, 0.45] }}
                transition={{ duration: 2.6, repeat: Infinity, delay: i * 0.2 }}
              >
                <span className="text-[12px] font-bold text-slate-700">{item}</span>
                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-primary">
                  Included
                </span>
              </motion.div>
            ))}
            <Glass className="mt-auto p-3 text-center">
              <div className="text-[9px] font-bold text-slate-700/65">Fixed project price</div>
              <div className="text-xl font-black text-slate-700">No surprises</div>
            </Glass>
          </div>
        </Window>
        <ToastLoop
          items={[
            { title: "Quote sent", body: "Fixed scope · fixed date" },
            { title: "No hidden fees", body: "Everything listed" },
          ]}
        />
      </div>
      <SideRail icons={[I.check, I.lock, I.chart, I.spark]} active={0} />
    </MockCanvas>
  );
}

function ProcessStage() {
  return (
    <MockCanvas>
      <div className="relative flex min-w-0 flex-1">
        <Window title="Delivery" badge={<span className="text-[9px] font-bold text-slate-700">On track</span>}>
          <div className="flex flex-1 flex-col justify-center gap-4 p-4">
            <div className="flex items-center justify-between">
              {["Brief", "Craft", "Ship"].map((step, i) => (
                <div key={step} className="flex flex-1 flex-col items-center gap-2">
                  <motion.div
                    className="flex size-10 items-center justify-center rounded-full border-2 border-primary bg-primary/10 text-sm font-black text-slate-700"
                    animate={{
                      backgroundColor: [
                        "rgb(56 182 255 / 0.15)",
                        "rgb(56 182 255 / 0.95)",
                        "rgb(56 182 255 / 0.15)",
                      ],
                      color: ["var(--primary)", "#0f172a", "var(--primary)"],
                    }}
                    transition={{ duration: 3.4, repeat: Infinity, delay: i * 0.7 }}
                  >
                    {i + 1}
                  </motion.div>
                  <span className="text-[10px] font-bold text-slate-700">{step}</span>
                </div>
              ))}
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-primary/10">
              <motion.div
                className="h-full rounded-full bg-white"
                animate={{ width: ["15%", "85%", "85%", "15%"] }}
                transition={{ duration: 4.2, repeat: Infinity, times: [0, 0.45, 0.8, 1] }}
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {["Day 1", "Day 4", "Day 7"].map((d) => (
                <Glass key={d} className="py-2 text-center text-[10px] font-bold text-slate-700">
                  {d}
                </Glass>
              ))}
            </div>
          </div>
        </Window>
        <ToastLoop
          items={[
            { title: "Milestone hit", body: "Craft phase complete" },
            { title: "Delivery date", body: "Still Day 7 · locked" },
          ]}
        />
      </div>
      <SideRail icons={[I.check, I.cal, I.pen, I.spark]} active={0} />
    </MockCanvas>
  );
}

function StrategyStage() {
  return (
    <MockCanvas>
      <div className="relative flex min-w-0 flex-1">
        <Window title="Strategy" badge={<span className="text-[9px] font-bold text-slate-700">Research</span>}>
          <div className="flex flex-1 flex-col justify-center gap-3 p-3 md:p-4">
            {["Audience", "Offer", "Position"].map((label, i) => (
              <div key={label} className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold text-slate-700">
                  <span>{label}</span>
                  <span className="text-primary/70">{55 + i * 15}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-primary/10">
                  <motion.div
                    className="h-full rounded-full bg-white"
                    animate={{ width: ["18%", `${55 + i * 15}%`, "18%"] }}
                    transition={{ duration: 3.4, repeat: Infinity, delay: i * 0.25 }}
                  />
                </div>
              </div>
            ))}
            <Glass className="mt-1 p-2.5 text-[10px] font-bold text-slate-700/80">
              Decisions rooted in research  not taste
            </Glass>
          </div>
        </Window>
        <ToastLoop
          items={[
            { title: "Insight locked", body: "Positioning clarified" },
            { title: "Audience map", body: "3 segments defined" },
          ]}
        />
      </div>
      <SideRail icons={[I.chart, I.users, I.text, I.spark]} active={0} />
    </MockCanvas>
  );
}

function AssetsStage() {
  const files = [
    { name: "Logo pack", meta: "AI · SVG · PNG" },
    { name: "Guidelines", meta: "PDF · 24 pages" },
    { name: "Templates", meta: "Social · Print" },
    { name: "Source files", meta: "Yours to keep" },
  ];
  return (
    <MockCanvas>
      <div className="relative flex min-w-0 flex-1">
        <Window title="Assets" badge={<span className="text-[9px] font-bold text-slate-700">Ready</span>}>
          <div className="flex flex-1 flex-col gap-1.5 p-2 md:p-2.5">
            {files.map((f, i) => (
              <motion.div
                key={f.name}
                className="flex items-center gap-2.5 rounded-xl border border-primary/15 bg-primary/5 px-2.5 py-2.5"
                animate={{ opacity: [0.5, 1, 0.5], y: [2, 0, 2] }}
                transition={{ duration: 2.8, repeat: Infinity, delay: i * 0.22 }}
              >
                <span className="flex size-8 items-center justify-center rounded-lg bg-white text-primary">
                  {I.pen}
                </span>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-slate-700">{f.name}</div>
                  <div className="text-[9px] text-slate-700/60">{f.meta}</div>
                </div>
                <span className="ml-auto text-slate-700">{I.check}</span>
              </motion.div>
            ))}
          </div>
        </Window>
        <ToastLoop
          items={[
            { title: "Pack exported", body: "All formats ready" },
            { title: "Ownership", body: "IP transferred to you" },
          ]}
        />
      </div>
      <SideRail icons={[I.pen, I.text, I.lock, I.check]} active={0} />
    </MockCanvas>
  );
}

function CraftStage() {
  return (
    <MockCanvas>
      <div className="relative flex min-w-0 flex-1">
        <Window title="Craft" badge={<span className="text-[9px] font-bold text-slate-700">Studio</span>}>
          <div className="grid flex-1 grid-cols-2 grid-rows-2 gap-2 p-2.5 md:p-3">
            <Glass className="relative flex items-center justify-center overflow-hidden">
              <motion.svg
                viewBox="0 0 80 80"
                className="size-16 text-slate-700"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <motion.path
                  d="M16 54 C28 22, 54 18, 66 40"
                  strokeLinecap="round"
                  animate={{ pathLength: [0, 1, 1, 0] }}
                  transition={{ duration: 3.8, repeat: Infinity, times: [0, 0.45, 0.8, 1] }}
                />
                <motion.circle
                  r="3"
                  fill="var(--primary)"
                  animate={{
                    cx: [16, 40, 66, 66, 16],
                    cy: [54, 28, 40, 40, 54],
                    opacity: [0, 1, 1, 0, 0],
                  }}
                  transition={{ duration: 3.8, repeat: Infinity }}
                />
              </motion.svg>
            </Glass>
            <Glass className="flex items-center justify-center">{I.mountain}</Glass>
            <Glass className="flex items-center justify-center">{I.mountain}</Glass>
            <Glass className="flex flex-col justify-center gap-1.5 px-3">
              {[0.9, 0.7, 0.5].map((w, i) => (
                <motion.div
                  key={i}
                  className="h-1.5 rounded-full bg-white"
                  style={{ width: `${w * 100}%` }}
                  animate={{ opacity: [0.35, 1, 0.35] }}
                  transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.18 }}
                />
              ))}
            </Glass>
          </div>
          <div className="border-t border-primary/15 p-2.5">
            <Glass className="flex items-center px-3 py-2">
              <span className="text-[10px] font-bold text-slate-700/80">Designer on canvas…</span>
              <motion.div
                className="ml-auto flex size-6 items-center justify-center rounded-full bg-white text-primary"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {I.pen}
              </motion.div>
            </Glass>
          </div>
        </Window>
        <ToastLoop
          items={[
            { title: "Revision ready", body: "Round 2 · mark refined" },
            { title: "Designer note", body: "Clearer at small sizes" },
          ]}
        />
      </div>
      <SideRail icons={[I.pen, I.text, I.node, I.spark]} active={0} />
    </MockCanvas>
  );
}

function OwnershipStage() {
  return (
    <MockCanvas>
      <div className="relative flex min-w-0 flex-1">
        <Window title="Ownership" badge={<span className="text-[9px] font-bold text-slate-700">Yours</span>}>
          <div className="flex flex-1 flex-col gap-2 p-2.5 md:p-3">
            <Glass className="flex items-center gap-3 p-3">
              <motion.div
                className="flex size-12 items-center justify-center rounded-xl bg-white text-primary"
                animate={{ rotate: [0, -8, 0, 6, 0] }}
                transition={{ duration: 4.5, repeat: Infinity }}
              >
                {I.lock}
              </motion.div>
              <div>
                <div className="text-sm font-black text-slate-700">Full IP transfer</div>
                <div className="text-[10px] text-slate-700/65">Source files · forever yours</div>
              </div>
            </Glass>
            {["Working files", "Licenses", "Brand rights"].map((t, i) => (
              <motion.div
                key={t}
                className="flex items-center justify-between rounded-xl border border-primary/15 bg-primary/5 px-3 py-2.5"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2.6, repeat: Infinity, delay: i * 0.25 }}
              >
                <span className="text-[11px] font-bold text-slate-700">{t}</span>
                <span className="text-slate-700">{I.check}</span>
              </motion.div>
            ))}
          </div>
        </Window>
        <ToastLoop
          items={[
            { title: "Transfer signed", body: "IP assigned to you" },
            { title: "Vault unlocked", body: "All originals included" },
          ]}
        />
      </div>
      <SideRail icons={[I.lock, I.check, I.pen, I.spark]} active={0} />
    </MockCanvas>
  );
}

function DefaultStage() {
  return <CraftStage />;
}

/* ─── Hosting / infrastructure (context-specific) ───────────────────────── */

function Gauge({
  label,
  value,
  delay = 0,
}: {
  label: string;
  value: number;
  delay?: number;
}) {
  return (
    <Glass className="flex flex-col justify-between p-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-bold uppercase tracking-wider text-primary/70">{label}</span>
        <motion.span
          className="text-[11px] font-black text-slate-700"
          animate={{ opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 2.2, repeat: Infinity, delay }}
        >
          {value}%
        </motion.span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-primary/10">
        <motion.div
          className="h-full rounded-full bg-white"
          animate={{ width: [`${Math.max(value - 18, 12)}%`, `${value}%`, `${Math.max(value - 10, 12)}%`] }}
          transition={{ duration: 3.2, repeat: Infinity, delay, ease: "easeInOut" }}
        />
      </div>
    </Glass>
  );
}

/** Grafana-style server metrics  not marketing analytics */
function ServerMonitorStage() {
  return (
    <MockCanvas>
      <div className="relative flex min-w-0 flex-1">
        <Window title="Server metrics" badge={<LiveBadge />}>
          <div className="grid flex-1 grid-cols-2 gap-2 p-2.5 md:p-3">
            <Gauge label="CPU" value={42} />
            <Gauge label="RAM" value={61} delay={0.2} />
            <Gauge label="Disk I/O" value={28} delay={0.4} />
            <Gauge label="Network" value={54} delay={0.6} />
            <Glass className="col-span-2 min-h-0 flex-1 p-2.5">
              <div className="mb-1 flex items-center justify-between text-[9px] font-bold text-primary/70">
                <span>Throughput · last 15m</span>
                <span className="text-slate-700">Gbps in/out</span>
              </div>
              <BarChart values={[32, 48, 40, 62, 55, 78, 70, 88, 64, 92]} className="h-14" />
            </Glass>
          </div>
        </Window>
        <ToastLoop
          items={[
            { title: "Alert rule OK", body: "CPU under 80% threshold" },
            { title: "WhatsApp alert", body: "Disk 72% · acknowledged" },
          ]}
        />
      </div>
      <SideRail icons={[I.chart, I.bolt, I.shield, I.check]} active={0} />
    </MockCanvas>
  );
}

/** OS + SSH provision  not npm/CRM deploy */
function ServerProvisionStage() {
  return (
    <MockCanvas>
      <div className="relative flex min-w-0 flex-1">
        <Window title="Provision" badge={<span className="text-[9px] font-bold text-slate-700">&lt; 5 min</span>}>
          <div className="flex flex-1 flex-col gap-2 p-2.5 md:p-3">
            <Glass className="p-2.5">
              <div className="mb-2 text-[9px] font-bold uppercase tracking-wider text-slate-700/65">Choose OS</div>
              <div className="flex flex-wrap gap-1.5">
                {["Ubuntu 24.04", "Debian 12", "AlmaLinux", "Docker"].map((os, i) => (
                  <motion.span
                    key={os}
                    className={`rounded-lg border px-2 py-1 text-[9px] font-bold ${
                      i === 0
                        ? "border-primary bg-white text-primary"
                        : "border-primary/25 bg-primary/5 text-slate-700"
                    }`}
                    animate={i === 0 ? { scale: [1, 1.04, 1] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {os}
                  </motion.span>
                ))}
              </div>
            </Glass>
            <Glass className="p-2.5 font-mono">
              <div className="mb-1 text-[9px] font-bold text-slate-700/65">SSH public key</div>
              <motion.div
                className="truncate text-[10px] font-bold text-slate-700"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2.4, repeat: Infinity }}
              >
                ssh-ed25519 AAAA…nPanel
              </motion.div>
            </Glass>
            <div className="space-y-1.5">
              {["Allocate vCPU + RAM", "Attach public IPv4", "Boot + SSH ready"].map((step, i) => (
                <motion.div
                  key={step}
                  className="flex items-center gap-2 rounded-xl border border-primary/15 bg-primary/5 px-2.5 py-2 text-[10px] font-bold text-slate-700"
                  animate={{ opacity: [0.35, 1, 0.35] }}
                  transition={{ duration: 3, repeat: Infinity, delay: i * 0.45 }}
                >
                  <span className="text-slate-700">{I.check}</span>
                  {step}
                </motion.div>
              ))}
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-primary/10">
              <motion.div
                className="h-full rounded-full bg-white"
                animate={{ width: ["8%", "100%", "100%", "8%"] }}
                transition={{ duration: 4, repeat: Infinity, times: [0, 0.4, 0.75, 1] }}
              />
            </div>
          </div>
        </Window>
        <ToastLoop
          items={[
            { title: "Server live", body: "SSH open · root@ready" },
            { title: "Stack install", body: "LEMP one-click queued" },
          ]}
        />
      </div>
      <SideRail icons={[I.bolt, I.lock, I.check, I.spark]} active={0} />
    </MockCanvas>
  );
}

/** Store / API / SaaS workloads  never CRM HubSpot */
function WorkloadsStage() {
  const apps = [
    { name: "WooCommerce", meta: "Store · isolated RAM" },
    { name: "Payment API", meta: "Node · sticky sessions" },
    { name: "SaaS app", meta: "Docker · staging" },
    { name: "Staging", meta: "Clone · safe tests" },
  ];
  return (
    <MockCanvas>
      <div className="relative flex min-w-0 flex-1">
        <Window title="Workloads" badge={<span className="text-[9px] font-bold text-slate-700">On VPS/VDS</span>}>
          <div className="flex flex-1 flex-col gap-1.5 p-2 md:p-2.5">
            {apps.map((app, i) => (
              <motion.div
                key={app.name}
                className="flex items-center gap-2.5 rounded-xl border border-primary/15 bg-primary/5 px-2.5 py-2.5"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2.8, repeat: Infinity, delay: i * 0.22 }}
              >
                <span className="flex size-8 items-center justify-center rounded-lg bg-white text-[10px] font-black text-primary">
                  {app.name.slice(0, 1)}
                </span>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-slate-700">{app.name}</div>
                  <div className="text-[9px] text-slate-700/60">{app.meta}</div>
                </div>
                <span className="ml-auto flex items-center gap-1 text-[9px] font-bold text-slate-700">
                  <motion.span
                    className="size-1.5 rounded-full bg-white"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.15 }}
                  />
                  Live
                </span>
              </motion.div>
            ))}
          </div>
        </Window>
        <ToastLoop
          items={[
            { title: "Store healthy", body: "Checkout p95 · 210ms" },
            { title: "API scaled", body: "Workers · 4 replicas" },
          ]}
        />
      </div>
      <SideRail icons={[I.bolt, I.node, I.chart, I.check]} active={0} />
    </MockCanvas>
  );
}

/** Dedicated cores/RAM  VDS isolation story */
function ResourceIsolationStage() {
  return (
    <MockCanvas>
      <div className="relative flex min-w-0 flex-1">
        <Window title="Resource isolation" badge={<span className="text-[9px] font-bold text-slate-700">Dedicated</span>}>
          <div className="flex flex-1 flex-col gap-2 p-2.5 md:p-3">
            <Glass className="p-3">
              <div className="mb-2 text-[9px] font-bold uppercase tracking-wider text-slate-700/65">
                Your slice · not shared
              </div>
              {[
                { l: "vCPU", v: "4 cores · pinned" },
                { l: "RAM", v: "8 GB · guaranteed" },
                { l: "NVMe", v: "160 GB · yours only" },
              ].map((row, i) => (
                <motion.div
                  key={row.l}
                  className="flex items-center justify-between border-t border-primary/ py-2 first:border-0 first:pt-0"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2.6, repeat: Infinity, delay: i * 0.25 }}
                >
                  <span className="text-[11px] font-bold text-slate-700">{row.l}</span>
                  <span className="text-[10px] font-black text-slate-700">{row.v}</span>
                </motion.div>
              ))}
            </Glass>
            <Glass className="flex flex-1 flex-col justify-center gap-2 p-3">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-700">
                <span>Noisy neighbour</span>
                <span className="rounded-full bg-white px-2 py-0.5 text-[9px] font-black text-primary">
                  Blocked
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-primary/10">
                <motion.div
                  className="h-full rounded-full bg-white"
                  animate={{ width: ["100%", "100%"] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ width: "100%" }}
                />
              </div>
              <div className="text-[9px] text-slate-700/65">100% of allocated resources reserved for you</div>
            </Glass>
          </div>
        </Window>
        <ToastLoop
          items={[
            { title: "Isolation OK", body: "No shared CPU steal" },
            { title: "SLA credit", body: "Network 99.99% tracked" },
          ]}
        />
      </div>
      <SideRail icons={[I.shield, I.bolt, I.chart, I.check]} active={0} />
    </MockCanvas>
  );
}

/** Bare metal: DB / game / GPU  not brand IP ownership */
function BareMetalStage() {
  return (
    <MockCanvas>
      <div className="relative flex min-w-0 flex-1">
        <Window title="Bare metal" badge={<span className="text-[9px] font-bold text-slate-700">IPMI</span>}>
          <div className="flex flex-1 flex-col gap-2 p-2.5 md:p-3">
            <Glass className="grid grid-cols-3 gap-2 p-2.5">
              {[
                { l: "CPU", v: "EPYC" },
                { l: "RAM", v: "128G" },
                { l: "Disk", v: "RAID" },
              ].map((s, i) => (
                <div key={s.l} className="text-center">
                  <motion.div
                    className="text-sm font-black text-slate-700"
                    animate={{ opacity: [0.55, 1, 0.55] }}
                    transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.2 }}
                  >
                    {s.v}
                  </motion.div>
                  <div className="text-[9px] font-bold text-slate-700/65">{s.l}</div>
                </div>
              ))}
            </Glass>
            {[
              { name: "Database cluster", meta: "High IOPS · dedicated NVMe" },
              { name: "Game / realtime", meta: "Low latency · full NIC" },
              { name: "ML / GPU jobs", meta: "Hardware owned · no noisy neighbours" },
            ].map((w, i) => (
              <motion.div
                key={w.name}
                className="flex items-center gap-2 rounded-xl border border-primary/15 bg-primary/5 px-2.5 py-2"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2.8, repeat: Infinity, delay: i * 0.25 }}
              >
                <span className="flex size-7 items-center justify-center rounded-lg bg-white text-[9px] font-black text-primary">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-slate-700">{w.name}</div>
                  <div className="text-[9px] text-slate-700/60">{w.meta}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </Window>
        <ToastLoop
          items={[
            { title: "IPMI online", body: "Out-of-band management ready" },
            { title: "RAID rebuild", body: "Redundancy · healthy" },
          ]}
        />
      </div>
      <SideRail icons={[I.bolt, I.shield, I.chart, I.lock]} active={0} />
    </MockCanvas>
  );
}

/** cPanel-style hosting control  shared hosting */
function CpanelStage() {
  return (
    <MockCanvas>
      <div className="relative flex min-w-0 flex-1">
        <Window title="cPanel" badge={<span className="text-[9px] font-bold text-slate-700">Hosting</span>}>
          <div className="grid flex-1 grid-cols-2 gap-2 p-2.5 md:p-3">
            {[
              { t: "Email", d: "you@brand.co.ke" },
              { t: "Files", d: "File Manager" },
              { t: "WordPress", d: "1-click install" },
              { t: "Backups", d: "Restore anytime" },
            ].map((tile, i) => (
              <motion.div
                key={tile.t}
                className="flex flex-col justify-between rounded-xl border border-primary/15 bg-primary/5 p-2.5"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2.6, repeat: Infinity, delay: i * 0.2 }}
              >
                <span className="text-[11px] font-black text-slate-700">{tile.t}</span>
                <span className="text-[9px] text-slate-700/65">{tile.d}</span>
              </motion.div>
            ))}
            <Glass className="col-span-2 p-2.5">
              <div className="mb-1 flex justify-between text-[9px] font-bold text-slate-700/65">
                <span>Resource usage</span>
                <span className="text-slate-700">Healthy</span>
              </div>
              <BarChart values={[30, 44, 38, 52, 48, 60]} className="h-10" />
            </Glass>
          </div>
        </Window>
        <ToastLoop
          items={[
            { title: "WP installed", body: "Softaculous · 1 click" },
            { title: "Backup done", body: "Daily · restore ready" },
          ]}
        />
      </div>
      <SideRail icons={[I.bolt, I.mail, I.check, I.spark]} active={0} />
    </MockCanvas>
  );
}

/** WordPress stack performance */
function WpPerfStage() {
  return (
    <MockCanvas>
      <div className="relative flex min-w-0 flex-1">
        <Window title="WordPress stack" badge={<LiveBadge />}>
          <div className="flex flex-1 flex-col gap-2 p-2.5 md:p-3">
            <div className="grid grid-cols-2 gap-2">
              {[
                { l: "PHP", v: "8.3" },
                { l: "Cache", v: "LiteSpeed" },
                { l: "DB", v: "MariaDB" },
                { l: "HTTP", v: "2 / 3" },
              ].map((m, i) => (
                <Glass key={m.l} className="p-2.5">
                  <div className="text-[9px] font-bold text-slate-700/65">{m.l}</div>
                  <motion.div
                    className="text-sm font-black text-slate-700"
                    animate={{ opacity: [0.55, 1, 0.55] }}
                    transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.15 }}
                  >
                    {m.v}
                  </motion.div>
                </Glass>
              ))}
            </div>
            <Glass className="flex-1 p-2.5">
              <div className="mb-1 text-[9px] font-bold text-slate-700/65">Page generate time</div>
              <BarChart values={[70, 55, 40, 32, 28, 22, 18]} className="h-16" />
              <div className="mt-1 text-[10px] font-bold text-slate-700">Tuned for WP · OPcache on</div>
            </Glass>
          </div>
        </Window>
        <ToastLoop
          items={[
            { title: "Cache hit", body: "LiteSpeed · 94% hits" },
            { title: "PHP worker", body: "OPcache warm" },
          ]}
        />
      </div>
      <SideRail icons={[I.bolt, I.chart, I.check, I.spark]} active={0} />
    </MockCanvas>
  );
}

/** Staging → production for WordPress */
function WpStagingStage() {
  return (
    <MockCanvas>
      <div className="relative flex min-w-0 flex-1">
        <Window title="Staging" badge={<span className="text-[9px] font-bold text-slate-700">Safe</span>}>
          <div className="flex flex-1 flex-col justify-center gap-3 p-3">
            <div className="flex items-center gap-2">
              <Glass className="flex-1 px-3 py-3 text-center">
                <div className="text-[9px] font-bold text-slate-700/65">Staging</div>
                <div className="text-[12px] font-black text-slate-700">Clone</div>
              </Glass>
              <div className="relative h-px w-8 overflow-hidden bg-primary/15">
                <motion.div
                  className="absolute inset-y-0 w-6 bg-white"
                  animate={{ x: ["-100%", "180%"] }}
                  transition={{ duration: 1.6, repeat: Infinity }}
                />
              </div>
              <Glass className="flex-1 border-primary/ bg-primary/15 px-3 py-3 text-center">
                <div className="text-[9px] font-bold text-slate-700/80">Live</div>
                <div className="text-[12px] font-black text-slate-700">Prod</div>
              </Glass>
            </div>
            {[
              "Plugin update tested",
              "Theme redesign preview",
              "Push only when ready",
            ].map((step, i) => (
              <motion.div
                key={step}
                className="flex items-center gap-2 rounded-xl border border-primary/15 bg-primary/5 px-3 py-2 text-[10px] font-bold text-slate-700"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2.8, repeat: Infinity, delay: i * 0.35 }}
              >
                {I.check} {step}
              </motion.div>
            ))}
          </div>
        </Window>
        <ToastLoop
          items={[
            { title: "Staging ready", body: "Full clone · no risk" },
            { title: "Push queued", body: "Prod update · confirmed" },
          ]}
        />
      </div>
      <SideRail icons={[I.check, I.bolt, I.lock, I.spark]} active={0} />
    </MockCanvas>
  );
}

/** Branded mailbox  not marketing lead inbox */
function BusinessMailStage() {
  return (
    <MockCanvas>
      <div className="relative flex min-w-0 flex-1">
        <Window title="Mail" badge={<span className="text-[9px] font-bold text-slate-700">@domain</span>}>
          <div className="flex flex-1 flex-col gap-2 p-2.5 md:p-3">
            <Glass className="p-3">
              <div className="text-[9px] font-bold uppercase tracking-wider text-slate-700/65">From</div>
              <motion.div
                className="mt-1 text-[13px] font-black text-slate-700"
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2.4, repeat: Infinity }}
              >
                you@yourbusiness.co.ke
              </motion.div>
              <div className="mt-1 text-[10px] text-slate-700/65">Looks credible in every inbox</div>
            </Glass>
            {[
              { t: "Outlook / Apple Mail", d: "IMAP ready" },
              { t: "Shared calendar", d: "Team schedules" },
              { t: "Group inbox", d: "info@ · sales@" },
            ].map((row, i) => (
              <motion.div
                key={row.t}
                className="flex items-center justify-between rounded-xl border border-primary/15 bg-primary/5 px-2.5 py-2"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2.6, repeat: Infinity, delay: i * 0.22 }}
              >
                <div>
                  <div className="text-[11px] font-bold text-slate-700">{row.t}</div>
                  <div className="text-[9px] text-slate-700/60">{row.d}</div>
                </div>
                <span className="text-slate-700">{I.check}</span>
              </motion.div>
            ))}
          </div>
        </Window>
        <ToastLoop
          items={[
            { title: "Mailbox live", body: "info@ set up in 30 min" },
            { title: "Mobile sync", body: "Gmail app · connected" },
          ]}
        />
      </div>
      <SideRail icons={[I.mail, I.users, I.check, I.spark]} active={0} />
    </MockCanvas>
  );
}

/** DKIM / SPF / DMARC  email deliverability, not generic SSL shield */
function DeliverabilityStage() {
  return (
    <MockCanvas>
      <div className="relative flex min-w-0 flex-1">
        <Window title="Deliverability" badge={<span className="text-[9px] font-bold text-slate-700">Inbox</span>}>
          <div className="flex flex-1 flex-col gap-2 p-2.5 md:p-3">
            {[
              { t: "SPF", d: "Authorized senders", ok: true },
              { t: "DKIM", d: "Message signed", ok: true },
              { t: "DMARC", d: "Policy enforced", ok: true },
              { t: "SpamExperts", d: "99% spam caught", ok: true },
            ].map((row, i) => (
              <motion.div
                key={row.t}
                className="flex items-center gap-2.5 rounded-xl border border-primary/15 bg-primary/5 px-2.5 py-2.5"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2.6, repeat: Infinity, delay: i * 0.22 }}
              >
                <span className="flex size-9 items-center justify-center rounded-lg bg-white text-[9px] font-black text-primary">
                  {row.t.slice(0, 2)}
                </span>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-slate-700">{row.t}</div>
                  <div className="text-[9px] text-slate-700/60">{row.d}</div>
                </div>
                <span className="ml-auto text-slate-700">{I.check}</span>
              </motion.div>
            ))}
          </div>
        </Window>
        <ToastLoop
          items={[
            { title: "Landed in inbox", body: "Gmail · not spam" },
            { title: "Auth pass", body: "SPF + DKIM + DMARC" },
          ]}
        />
      </div>
      <SideRail icons={[I.mail, I.shield, I.check, I.spark]} active={0} />
    </MockCanvas>
  );
}

const STAGE_MAP: Record<VisualTheme, (props: StageProps) => ReactNode> = {
  brand: () => <BrandStage />,
  clarity: () => <ClarityStage />,
  trust: () => <TrustStage />,
  reporting: () => <ReportingStage />,
  growth: () => <GrowthStage />,
  results: () => <ResultsStage />,
  speed: () => <SpeedStage />,
  inbox: () => <InboxStage />,
  support: () => <SupportStage />,
  bot: () => <BotStage />,
  deploy: () => <DeployStage />,
  uptime: () => <UptimeStage />,
  security: () => <SecurityStage />,
  maps: () => <MapsStage />,
  localMarket: () => <MapsStage />,
  targeting: () => <TargetingStage />,
  tracking: () => <TrackingStage />,
  creative: () => <CreativeStage />,
  funnel: () => <FunnelStage />,
  automation: () => <AutomationStage />,
  payment: () => <PaymentStage />,
  inventory: () => <InventoryStage />,
  mobile: () => <MobileStage />,
  calendar: () => <CalendarStage />,
  approval: () => <ApprovalStage />,
  engagement: () => <EngagementStage />,
  typing: () => <TypingStage />,
  segments: () => <SegmentsStage />,
  integrate: () => <IntegrateStage />,
  code: () => <CodeStage />,
  algorithm: () => <AlgorithmStage />,
  ethical: () => <EthicalStage />,
  migration: () => <MigrationStage />,
  pricing: () => <PricingStage />,
  process: () => <ProcessStage />,
  strategy: () => <StrategyStage />,
  assets: () => <AssetsStage />,
  craft: () => <CraftStage />,
  ownership: () => <OwnershipStage />,
  serverMonitor: () => <ServerMonitorStage />,
  serverProvision: () => <ServerProvisionStage />,
  workloads: () => <WorkloadsStage />,
  resourceIsolation: () => <ResourceIsolationStage />,
  bareMetal: () => <BareMetalStage />,
  cpanel: () => <CpanelStage />,
  wpPerf: () => <WpPerfStage />,
  wpStaging: () => <WpStagingStage />,
  deliverability: () => <DeliverabilityStage />,
  businessMail: () => <BusinessMailStage />,
  default: () => <DefaultStage />,
};

export function ShowcaseStage({
  theme,
  label: _label,
}: {
  theme: VisualTheme;
  label: string;
}) {
  const Stage = STAGE_MAP[theme] ?? DefaultStage;
  return <Stage label={_label} />;
}
