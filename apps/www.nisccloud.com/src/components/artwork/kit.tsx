import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { useArtLive } from "./use-art-live.ts";
import {
  Bot,
  Cloud,
  CreditCard,
  Globe,
  Home,
  Layers,
  LifeBuoy,
  Mail,
  Megaphone,
  Search,
  Server,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils.ts";

/**
 * Nisc Cloud artwork kit: product-led 2D illustrations built from nPanel's real interface language
 * (white cards, sky accents, green status pills, ring meters). All data shown in artwork is fictional.
 */

export type ArtTone = "sky" | "violet" | "emerald" | "amber" | "slate" | "rose";

const toneBackdrop: Record<ArtTone, string> = {
  sky: "from-sky-200/70 via-sky-100/40 to-blue-100/30 dark:from-sky-500/20 dark:via-sky-500/5 dark:to-blue-500/10",
  violet:
    "from-sky-200/70 via-cyan-100/35 to-slate-100/30 dark:from-sky-500/20 dark:via-cyan-500/5 dark:to-slate-500/10",
  emerald:
    "from-emerald-200/60 via-teal-100/40 to-sky-100/30 dark:from-emerald-500/20 dark:via-teal-500/5 dark:to-sky-500/10",
  amber:
    "from-amber-200/60 via-orange-100/40 to-rose-100/30 dark:from-amber-500/20 dark:via-orange-500/5 dark:to-rose-500/10",
  slate:
    "from-slate-300/60 via-slate-100/40 to-sky-100/40 dark:from-slate-500/25 dark:via-slate-500/5 dark:to-sky-500/10",
  rose: "from-orange-100/70 via-sky-100/35 to-slate-100/30 dark:from-orange-500/15 dark:via-sky-500/5 dark:to-slate-500/10",
};

const CURSOR_TARGETS = "[data-art-target]";
const CURSOR_FALLBACK = "[data-art-pill], [data-art-panel]";
const EASE = "cubic-bezier(0.45, 0, 0.25, 1)";

function seedOf(text: string) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h;
}

const outcomeQuery = (attr: string, action: string) => `[data-art-${attr}="${action}"]`;
const delayOf = (el: HTMLElement) => Number(el.dataset.artDelay ?? 0);

/**
 * What a click changes: `reveal` elements appear, `hide` elements disappear and `flash`
 * elements show briefly (a "Checking..." state), all timed from the press and reset each loop.
 */
function playOutcome(stage: HTMLElement, action: string, press: number, total: number): Animation[] {
  const at = (ms: number) => Math.min(Math.max(ms / total, 0), 1);
  const out: Animation[] = [];
  const timing = { duration: total, iterations: Infinity };
  stage.querySelectorAll<HTMLElement>(outcomeQuery("reveal", action)).forEach((el) => {
    const start = press + delayOf(el);
    out.push(
      el.animate(
        [
          { offset: 0, opacity: 0, transform: "translateY(4px) scale(0.97)" },
          { offset: at(start), opacity: 0, transform: "translateY(4px) scale(0.97)", easing: EASE },
          { offset: at(start + 300), opacity: 1, transform: "none" },
          { offset: at(total - 450), opacity: 1, transform: "none" },
          { offset: at(total - 200), opacity: 0, transform: "none" },
          { offset: 1, opacity: 0, transform: "translateY(4px) scale(0.97)" },
        ],
        timing,
      ),
    );
  });
  stage.querySelectorAll<HTMLElement>(outcomeQuery("hide", action)).forEach((el) => {
    const start = press + delayOf(el);
    out.push(
      el.animate(
        [
          { offset: 0, opacity: 1 },
          { offset: at(start), opacity: 1 },
          { offset: at(start + 200), opacity: 0 },
          { offset: at(total - 250), opacity: 0 },
          { offset: 1, opacity: 1 },
        ],
        timing,
      ),
    );
  });
  stage.querySelectorAll<HTMLElement>(outcomeQuery("flash", action)).forEach((el) => {
    const start = press + delayOf(el);
    const end = start + Number(el.dataset.artFor ?? 900);
    out.push(
      el.animate(
        [
          { offset: 0, opacity: 0 },
          { offset: at(start), opacity: 0 },
          { offset: at(start + 120), opacity: 1 },
          { offset: at(end), opacity: 1 },
          { offset: at(end + 200), opacity: 0 },
          { offset: 1, opacity: 0 },
        ],
        timing,
      ),
    );
  });
  return out;
}

/**
 * Pointer that tours the controls drawn inside an illustration and "clicks" them.
 * Buttons that name an action are clicked in DOM order and play their outcome.
 * Each artwork gets its own route because the route is built from its own targets.
 */
export function ArtCursor({ stageRef, seed }: { stageRef: RefObject<HTMLElement | null>; seed: string }) {
  const cursorRef = useRef<HTMLSpanElement>(null);
  const rippleRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const cursor = cursorRef.current;
    const ripple = rippleRef.current;
    if (!stage || !cursor || !ripple) return;
    const h = seedOf(seed);
    let running: Animation[] = [];

    const build = () => {
      running.forEach((a) => a.cancel());
      running = [];
      const box = stage.getBoundingClientRect();
      if (box.width === 0) return;
      const inside = (el: HTMLElement) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && r.top >= box.top && r.bottom <= box.bottom + 1 && r.right <= box.right + 1;
      };
      let els = [...stage.querySelectorAll<HTMLElement>(CURSOR_TARGETS)].filter(inside);
      if (els.length === 0) els = [...stage.querySelectorAll<HTMLElement>(CURSOR_FALLBACK)].filter(inside);
      if (els.length === 0) return;
      const actions = els.filter((el) => el.dataset.artTarget);
      const rot = h % els.length;
      const picks = actions.length > 0 ? actions.slice(0, 3) : [...els.slice(rot), ...els.slice(0, rot)].slice(0, 3);
      const points = picks.map((el) => {
        const r = el.getBoundingClientRect();
        return { el, x: r.left - box.left + Math.min(r.width * 0.6, r.width - 6), y: r.top - box.top + r.height * 0.62 };
      });
      const home = { x: box.width * (0.5 + ((h >> 4) % 35) / 100), y: box.height * 0.94 };
      const seg = 2300;
      const lead = 500;
      const total = lead + seg * points.length + 1400;
      const at = (ms: number) => Math.min(ms / total, 1);
      const move = (p: { x: number; y: number }, s = 1) => `translate(${p.x}px, ${p.y}px) scale(${s})`;

      const frames: Keyframe[] = [
        { offset: 0, transform: move(home), opacity: 0, easing: EASE },
        { offset: at(lead), transform: move(home), opacity: 1, easing: EASE },
      ];
      const rings: Keyframe[] = [{ offset: 0, opacity: 0, transform: "scale(0.3)" }];
      points.forEach((p, i) => {
        const arrive = lead + i * seg + seg * 0.5;
        const press = arrive + 160;
        const release = press + 170;
        frames.push(
          { offset: at(arrive), transform: move(p), opacity: 1, easing: EASE },
          { offset: at(press), transform: move(p, 0.82), opacity: 1, easing: EASE },
          { offset: at(release), transform: move(p), opacity: 1, easing: EASE },
        );
        rings.push(
          { offset: at(press - 1), opacity: 0, transform: "scale(0.3)" },
          { offset: at(press), opacity: 0.9, transform: "scale(0.3)" },
          { offset: at(press + 520), opacity: 0, transform: "scale(1.7)" },
        );
        running.push(
          p.el.animate(
            [
              { offset: 0, transform: "scale(1)" },
              { offset: at(press - 60), transform: "scale(1)" },
              { offset: at(press), transform: "scale(0.94)" },
              { offset: at(release + 140), transform: "scale(1)" },
              { offset: 1, transform: "scale(1)" },
            ],
            { duration: total, iterations: Infinity },
          ),
        );
        const action = p.el.dataset.artTarget;
        if (action) running.push(...playOutcome(stage, action, press, total));
      });
      const last = points[points.length - 1]!;
      frames.push(
        { offset: at(total - 900), transform: move(last), opacity: 1, easing: EASE },
        { offset: 1, transform: move(home), opacity: 0 },
      );
      rings.push({ offset: 1, opacity: 0, transform: "scale(1.7)" });
      running.push(cursor.animate(frames, { duration: total, iterations: Infinity }));
      running.push(ripple.animate(rings, { duration: total, iterations: Infinity }));
    };

    const settle = window.setTimeout(build, 700);
    const observer = new ResizeObserver(() => build());
    observer.observe(stage);
    return () => {
      window.clearTimeout(settle);
      observer.disconnect();
      running.forEach((a) => a.cancel());
    };
  }, [stageRef, seed]);

  return (
    <span ref={cursorRef} aria-hidden className="pointer-events-none absolute left-0 top-0 z-40 opacity-0">
      <span
        ref={rippleRef}
        className="absolute -left-3 -top-3 size-6 rounded-full border-2 border-primary bg-primary/20 opacity-0"
      />
      <svg width="16" height="20" viewBox="0 0 16 20" className="relative drop-shadow-[0_2px_3px_rgb(2_7_10_/_0.35)]">
        <path d="M1 1 L1 15.5 L4.8 12 L7.6 18.4 L10.2 17.2 L7.5 11 L12.6 11 Z" fill="#ffffff" stroke="#02070A" strokeWidth="1.3" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

/** Tinted stage that every illustration sits on. */
export function ArtStage({
  tone = "sky",
  label,
  children,
  className,
}: {
  tone?: ArtTone;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  const { ref, live } = useArtLive<HTMLElement>();
  return (
    <figure
      ref={ref}
      role="img"
      aria-label={label}
      className={cn(
        "relative mx-auto w-full max-w-[600px] overflow-hidden rounded-[28px] bg-gradient-to-br p-4 sm:p-7",
        toneBackdrop[tone],
        live && "art-live",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgb(14 87 118 / 0.18) 1px, transparent 0)",
          backgroundSize: "22px 22px",
          maskImage: "radial-gradient(ellipse 80% 70% at 50% 40%, black, transparent)",
        }}
      />
      <div aria-hidden className="art-drift pointer-events-none absolute -left-16 -top-16 size-56 rounded-full bg-primary/25 blur-3xl dark:bg-primary/20" />
      <div aria-hidden className="art-drift pointer-events-none absolute -bottom-20 -right-12 size-52 rounded-full bg-brand-orange/20 blur-3xl [animation-delay:-3s] dark:bg-brand-orange/15" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] p-px [mask:linear-gradient(#000_0_0)_content-box_exclude,linear-gradient(#000_0_0)]"
        style={{ background: "linear-gradient(135deg, rgb(56 182 255 / 0.55), transparent 40%, transparent 65%, rgb(252 115 77 / 0.45))" }}
      />
      <div className="relative" aria-hidden>
        {children}
      </div>
      {live ? <ArtCursor stageRef={ref} seed={label} /> : null}
    </figure>
  );
}

const navIcons = {
  home: Home,
  domains: Globe,
  hosting: Server,
  cloud: Cloud,
  email: Mail,
  marketing: Megaphone,
  seo: Search,
  creative: Layers,
  zeepo: Bot,
  support: LifeBuoy,
  clients: Users,
  billing: CreditCard,
} as const;

export type NavKey = keyof typeof navIcons;

function railKeys(active: NavKey): NavKey[] {
  const keys = (Object.keys(navIcons) as NavKey[]).slice(0, 6);
  return keys.includes(active) ? keys : [...keys, active];
}

/** nPanel application window: browser bar, icon rail and a content area. */
export function NpanelWindow({
  path,
  active,
  title,
  subtitle,
  action,
  children,
  className,
  bodyClassName,
}: {
  path: string;
  active: NavKey;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-slate-200/80 bg-card shadow-[0_30px_60px_-30px_rgb(14_87_118_/_0.45)] dark:border-white/10",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-border/70 bg-muted/50 px-3 py-2">
        <span className="size-2 rounded-full bg-rose-400" />
        <span className="size-2 rounded-full bg-amber-400" />
        <span className="size-2 rounded-full bg-emerald-400" />
        <span className="ml-2 min-w-0 flex-1 truncate rounded-md bg-background/80 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
          npanel.nisccloud.com/{path}
        </span>
      </div>
      <div className="flex">
        <nav className="hidden w-11 shrink-0 flex-col items-center gap-1.5 border-r border-border/70 bg-background/60 py-3 sm:flex">
          <img src="/nisciconoriginal.png" alt="" className="mb-2 w-6" width={24} height={15} />
          {railKeys(active).map((key) => {
            const Icon = navIcons[key];
            return (
              <span
                key={key}
                className={cn(
                  "flex size-7 items-center justify-center rounded-lg text-muted-foreground",
                  key === active && "art-rail-on bg-primary/15 text-primary",
                )}
              >
                <Icon className="size-3.5" />
              </span>
            );
          })}
        </nav>
        <div className={cn("art-rise min-w-0 flex-1 bg-slate-50/70 p-3 dark:bg-background/40 sm:p-4", bodyClassName)}>
          {(title || action) && (
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                {title && <p className="truncate text-[13px] font-semibold text-foreground">{title}</p>}
                {subtitle && <p className="truncate text-[10px] text-muted-foreground">{subtitle}</p>}
              </div>
              {action}
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

/** White product card used inside windows and as floating callouts. */
export function Panel({
  title,
  hint,
  icon: Icon,
  children,
  className,
}: {
  title?: string;
  hint?: string;
  icon?: React.ElementType;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div data-art-panel className={cn("rounded-xl border border-border/80 bg-card p-3", className)}>
      {title && (
        <div className="mb-2 flex items-center gap-2">
          {Icon && <Icon className="size-3.5 shrink-0 text-primary" />}
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold text-foreground">{title}</p>
            {hint && <p className="truncate text-[9px] text-muted-foreground">{hint}</p>}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

/**
 * Floating contextual card. On phones it drops into the normal flow below the main
 * window so its text stays readable instead of shrinking with the composition.
 */
export function Float({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "art-drift relative mt-3 rounded-2xl border border-border bg-card p-3 shadow-[0_20px_40px_-20px_rgb(14_87_118_/_0.5)] sm:absolute sm:mt-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

const pillTones = {
  green: "bg-emerald-500/12 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300",
  sky: "bg-sky-500/12 text-sky-700 ring-sky-500/25 dark:text-sky-300",
  amber: "bg-amber-500/15 text-amber-700 ring-amber-500/25 dark:text-amber-300",
  rose: "bg-rose-500/12 text-rose-700 ring-rose-500/25 dark:text-rose-300",
  violet: "bg-primary/12 text-sky-700 ring-primary/25 dark:text-sky-300",
  slate: "bg-slate-500/10 text-slate-600 ring-slate-500/20 dark:text-slate-300",
} as const;

export function Pill({
  tone = "green",
  children,
  className,
}: {
  tone?: keyof typeof pillTones;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      data-art-pill
      className={cn(
        "art-pop inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ring-1 ring-inset",
        pillTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const ringColor = {
  green: "#10b981",
  sky: "var(--primary)",
  amber: "#f59e0b",
  rose: "#f43f5e",
  violet: "var(--color-brand-orange)",
} as const;

/** Donut meter in the style of nPanel's portfolio and resource rings. */
export function Ring({
  value,
  tone = "sky",
  size = 44,
  children,
}: {
  value: number;
  tone?: keyof typeof ringColor;
  size?: number;
  children?: ReactNode;
}) {
  const r = 15.5;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
        <circle cx="18" cy="18" r={r} fill="none" strokeWidth="3.5" className="stroke-muted" />
        <circle
          cx="18"
          cy="18"
          r={r}
          fill="none"
          strokeWidth="3.5"
          strokeLinecap="round"
          stroke={ringColor[tone]}
          className="art-ring-arc"
          strokeDasharray={`${(value / 100) * c} ${c}`}
        />
      </svg>
      <span className="relative text-[10px] font-bold text-foreground">{children}</span>
    </span>
  );
}

/** Thin labelled usage bar. */
export function Meter({
  label,
  value,
  detail,
  tone = "sky",
}: {
  label: string;
  value: number;
  detail?: string;
  tone?: "sky" | "green" | "amber" | "violet";
}) {
  const bar = {
    sky: "bg-primary",
    green: "bg-emerald-500",
    amber: "bg-amber-500",
    // Legacy alias: usage meters stay within the sky family so orange keeps its emphasis role.
    violet: "bg-sky-600 dark:bg-sky-400",
  }[tone];
  return (
    <div>
      <div className="mb-1 flex justify-between gap-2 text-[9px]">
        <span className="font-medium text-foreground">{label}</span>
        {detail && <span className="text-muted-foreground">{detail}</span>}
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={cn("art-meter-fill h-full rounded-full", bar)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

/** Small primary or outline button as drawn inside the interface. */
export function UiButton({
  children,
  variant = "primary",
  action,
  className,
}: {
  children: ReactNode;
  variant?: "primary" | "outline";
  /** Names the outcome this click plays; see `ArtSwap` and `ArtReveal`. */
  action?: string;
  className?: string;
}) {
  return (
    <span
      data-art-target={action ?? ""}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[9px] font-semibold",
        variant === "primary"
          ? "bg-primary text-primary-foreground"
          : "border border-border bg-background text-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Tab strip modelled on nPanel's service detail tabs. */
export function TabStrip({ tabs, active }: { tabs: [string, string][]; active: number }) {
  return (
    <div className="mb-3 flex gap-1.5 overflow-hidden">
      {tabs.map(([label, hint], i) => (
        <span
          key={label}
          data-art-target={i === active ? "" : undefined}
          className={cn(
            "min-w-[68px] shrink-0 rounded-lg border px-2 py-1.5",
            i === active ? "border-primary bg-card ring-1 ring-primary/30" : "border-transparent bg-primary/[0.06]",
          )}
        >
          <span className="block text-[10px] font-semibold text-foreground">{label}</span>
          <span className="block text-[8px] text-muted-foreground">{hint}</span>
        </span>
      ))}
    </div>
  );
}

/** Two-column label/value list used across detail panels. */
export function KeyValues({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
      {rows.map(([k, v]) => (
        <div key={k} className="min-w-0">
          <dt className="text-[8px] uppercase tracking-wide text-muted-foreground">{k}</dt>
          <dd className="truncate text-[10px] font-medium text-primary">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ArtCaption({ children }: { children: ReactNode }) {
  return (
    <p className="mt-3 text-center text-[11px] text-muted-foreground">{children}</p>
  );
}

/**
 * Before/after pair stacked in one grid cell. Static and reduced-motion renders show the
 * finished state; when the cursor clicks the matching action, `before` gives way to `after`.
 */
export function ArtSwap({
  on,
  before,
  after,
  delay,
  block,
  className,
}: {
  on: string;
  before: ReactNode;
  after: ReactNode;
  delay?: number;
  /** Stack full-width blocks (rows, meters, cards) instead of inline content. */
  block?: boolean;
  className?: string;
}) {
  const cell = block ? "block min-w-0" : "flex min-w-0 items-center";
  return (
    <span className={cn("grid [&>*]:col-start-1 [&>*]:row-start-1", className)}>
      <span data-art-hide={on} data-art-delay={delay} className={cn(cell, "opacity-0")}>
        {before}
      </span>
      <span data-art-reveal={on} data-art-delay={delay} className={cell}>
        {after}
      </span>
    </span>
  );
}

/** Content that appears after an action (visible in static renders). */
export function ArtReveal({
  on,
  delay,
  className,
  children,
}: {
  on: string;
  delay?: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div data-art-reveal={on} data-art-delay={delay} className={className}>
      {children}
    </div>
  );
}

/** Transient state shown just after a click, such as "Checking availability…". Hidden when static. */
export function ArtFlash({
  on,
  delay,
  duration,
  className,
  children,
}: {
  on: string;
  delay?: number;
  duration?: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span data-art-flash={on} data-art-delay={delay} data-art-for={duration} className={cn("opacity-0", className)}>
      {children}
    </span>
  );
}
