import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { BarChart3, Globe, Lightbulb, Lock, Megaphone, PenTool, Server, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { Pill } from "./kit.tsx";
import { useArtLive } from "./use-art-live.ts";

/** About page illustrations. Businesses and figures shown are fictional and illustrative. */

function useCycle(count: number, ms: number) {
  const { ref, live } = useArtLive<HTMLDivElement>();
  const [step, setStep] = useState(count - 1);
  useEffect(() => {
    if (!live) {
      setStep(count - 1);
      return;
    }
    setStep(0);
    const id = window.setInterval(() => setStep((s) => (s + 1) % count), ms);
    return () => window.clearInterval(id);
  }, [live, count, ms]);
  return { ref, step, live };
}

function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-3.5 shadow-[0_24px_48px_-28px_rgb(14_87_118_/_0.55)]", className)}>
      {children}
    </div>
  );
}

const pop = {
  initial: { opacity: 0, y: 8, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -6, scale: 0.98 },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
};

/* ------------------------------------------------------------------ Hero */

export function AboutHeroVisual({ photo }: { photo: { src: string; srcSet: string; alt: string } }) {
  const { ref, step } = useCycle(3, 2400);
  const reduce = useReducedMotion();
  const bars = [30, 42, 38, 55, 61, 74, 82];
  return (
    <div ref={ref} className="relative">
      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden rounded-[28px] border border-border shadow-[0_40px_80px_-40px_rgb(14_87_118_/_0.6)]"
      >
        <img loading="lazy" decoding="async"
          src={photo.src}
          srcSet={photo.srcSet}
          sizes="(min-width: 1024px) 50vw, 100vw"
          alt={photo.alt}
          className="aspect-[4/3] w-full object-cover object-[40%_center]"
          fetchPriority="high"
        />
      </motion.div>

      <div className="absolute -left-3 top-8 w-56 sm:-left-8" aria-hidden>
        <Card>
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
              <Globe className="size-3.5 text-[#38b6ff]" /> savannabakery.co.ke
            </p>
            <Pill>Online</Pill>
          </div>
          <div className="mt-2.5 flex items-end gap-1" aria-hidden>
            {Array.from({ length: 18 }, (_, i) => (
              <span key={i} className="h-4 flex-1 rounded-sm bg-emerald-500/70" style={{ opacity: 0.55 + ((i * 7) % 5) / 10 }} />
            ))}
          </div>
          <p className="mt-1.5 text-[10px] text-muted-foreground">Hosting, email and SSL on one account</p>
        </Card>
      </div>

      <div className="absolute -bottom-6 -right-3 w-60 sm:-right-8" aria-hidden>
        <AnimatePresence mode="wait">
          <motion.div key={step === 0 ? "draft" : "live"} {...pop}>
            <Card>
              <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
                  <Megaphone className="size-3.5 text-[#fc734d]" /> Weekend menu campaign
                </p>
                <Pill tone={step === 0 ? "amber" : "green"}>{step === 0 ? "Scheduled" : "Live"}</Pill>
              </div>
              <div className="mt-3 flex h-12 items-end gap-1.5">
                {bars.map((h, i) => (
                  <motion.span
                    key={i}
                    className={cn("flex-1 rounded-t-sm", i === bars.length - 1 ? "bg-[#fc734d]" : "bg-[#38b6ff]")}
                    initial={{ height: 4 }}
                    animate={{ height: step === 0 ? 4 : `${h}%` }}
                    transition={{ duration: 0.6, delay: i * 0.05 }}
                  />
                ))}
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Our story journey */

const JOURNEY = [
  { key: "idea", label: "2019", title: "An idea", icon: Lightbulb },
  { key: "build", label: "Build", title: "Brand and website", icon: PenTool },
  { key: "run", label: "Run", title: "Online and secure", icon: Server },
  { key: "grow", label: "Grow", title: "More customers", icon: BarChart3 },
] as const;

function JourneyScreen({ step }: { step: number }) {
  if (step === 0) {
    return (
      <div className="grid h-full place-items-center">
        <div className="grid place-items-center gap-3 text-center">
          <span className="grid size-14 place-items-center rounded-2xl border-2 border-dashed border-[#38b6ff]/60 text-[#38b6ff]">
            <Lightbulb className="size-6" />
          </span>
          <p className="text-xs font-semibold text-foreground">Reliable technology, one team that owns it</p>
          <div className="grid w-40 gap-1.5">
            <span className="h-1.5 rounded-full bg-muted" />
            <span className="h-1.5 w-3/4 rounded-full bg-muted" />
          </div>
        </div>
      </div>
    );
  }
  if (step === 1) {
    return (
      <div className="grid h-full grid-rows-[auto_1fr] gap-3">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-[#02070A] dark:text-white">
            <span className="size-3 rounded-full bg-[#fc734d]" /> SAVANNA BAKERY
          </span>
          <span className="flex gap-2">
            {["Menu", "Order", "Visit"].map((item) => (
              <span key={item} className="text-[9px] text-muted-foreground">
                {item}
              </span>
            ))}
          </span>
        </div>
        <div className="grid grid-cols-[1.2fr_1fr] gap-3">
          <div className="grid content-center gap-2">
            <span className="h-3 w-4/5 rounded bg-foreground/80" />
            <span className="h-3 w-3/5 rounded bg-foreground/80" />
            <span className="mt-1 h-1.5 w-full rounded bg-muted" />
            <span className="h-1.5 w-4/5 rounded bg-muted" />
            <span className="mt-2 h-6 w-20 rounded-md bg-[#38b6ff]" />
          </div>
          <div className="rounded-xl bg-gradient-to-br from-[#fc734d]/40 to-[#38b6ff]/30" />
        </div>
      </div>
    );
  }
  if (step === 2) {
    return (
      <div className="grid h-full content-center gap-2">
        {[
          ["Domain", "savannabakery.co.ke"],
          ["Hosting", "web-01 · Nairobi"],
          ["Email", "orders@savannabakery.co.ke"],
          ["SSL", "Valid · auto-renew"],
        ].map(([k, v], i) => (
          <motion.div
            key={k}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.12 }}
            className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-2.5 py-1.5"
          >
            <span className="flex items-center gap-2 text-[10px] text-muted-foreground">
              {k === "SSL" ? <Lock className="size-3 text-[#38b6ff]" /> : <Server className="size-3 text-[#38b6ff]" />}
              {k}
            </span>
            <span className="truncate font-mono text-[10px] text-foreground">{v}</span>
            <Pill>OK</Pill>
          </motion.div>
        ))}
      </div>
    );
  }
  const points = "0,70 40,62 80,64 120,48 160,40 200,26 240,12";
  return (
    <div className="grid h-full grid-rows-[auto_1fr] gap-2">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-foreground">Online orders</p>
        <Pill tone="sky">
          <Sparkles className="size-2.5" /> Growing
        </Pill>
      </div>
      <svg viewBox="0 0 240 80" className="h-full w-full" preserveAspectRatio="none">
        <motion.polyline
          points={points}
          fill="none"
          stroke="#38b6ff"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        <motion.circle cx="240" cy="12" r="5" fill="#fc734d" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.1 }} />
      </svg>
    </div>
  );
}

export function JourneyArt() {
  const { ref, step } = useCycle(JOURNEY.length, 2600);
  return (
    <figure
      ref={ref}
      role="img"
      aria-label="Illustration of a business growing with Nisc Cloud: an idea, a brand and website, hosting that stays online, then more customers"
      className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#38b6ff]/25 via-[#38b6ff]/10 to-[#fc734d]/10 p-5 dark:from-[#38b6ff]/15 dark:via-[#38b6ff]/5 dark:to-[#fc734d]/5 sm:p-8"
    >
      <div aria-hidden>
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_30px_60px_-30px_rgb(14_87_118_/_0.5)]">
          <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-3 py-2">
            <span className="size-2 rounded-full bg-rose-400" />
            <span className="size-2 rounded-full bg-amber-400" />
            <span className="size-2 rounded-full bg-emerald-400" />
            <span className="ml-2 flex-1 truncate rounded-md bg-background/80 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
              {step === 0 ? "notes" : "savannabakery.co.ke"}
            </span>
          </div>
          <div className="h-56 p-4 sm:h-64 sm:p-5">
            <AnimatePresence mode="wait">
              <motion.div key={step} {...pop} className="h-full">
                <JourneyScreen step={step} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        <ol className="mt-5 grid grid-cols-4 gap-2">
          {JOURNEY.map((item, i) => (
            <li key={item.key} className="grid justify-items-center gap-1.5 text-center">
              <span
                className={cn(
                  "grid size-9 place-items-center rounded-full border-2 transition-all duration-500",
                  i === step
                    ? "border-[#38b6ff] bg-[#38b6ff] text-[#02070A] shadow-[0_0_0_5px_rgb(56_182_255_/_0.2)]"
                    : i < step
                      ? "border-[#38b6ff] bg-card text-[#38b6ff]"
                      : "border-border bg-card text-muted-foreground",
                )}
              >
                <item.icon className="size-4" />
              </span>
              <span className="text-[11px] font-semibold text-foreground">{item.label}</span>
              <span className="hidden text-[10px] text-muted-foreground sm:block">{item.title}</span>
            </li>
          ))}
        </ol>
      </div>
    </figure>
  );
}

/* ------------------------------------------------------------------ Core value vignettes */

function Vignette({ children }: { children: ReactNode }) {
  return (
    <div className="relative grid h-28 place-items-center overflow-hidden rounded-2xl bg-[#38b6ff]/[0.07]" aria-hidden>
      {children}
    </div>
  );
}

export function ValueVignette({ index, active }: { index: number; active: boolean }) {
  const reduce = useReducedMotion();
  const play = active && !reduce;
  switch (index) {
    case 0:
      return (
        <Vignette>
          <svg viewBox="0 0 100 100" className="size-20">
            {[40, 28, 16].map((r, i) => (
              <circle key={r} cx="50" cy="50" r={r} fill="none" strokeWidth="6" className={i === 1 ? "stroke-[#38b6ff]/40" : "stroke-[#38b6ff]"} />
            ))}
            <circle cx="50" cy="50" r="6" fill="#fc734d" />
            <motion.g initial={false} animate={play ? { x: [40, 0], y: [-40, 0], opacity: [0, 1] } : { x: 0, y: 0, opacity: 1 }} transition={{ duration: 0.7, ease: "easeOut" }}>
              <line x1="50" y1="50" x2="78" y2="22" strokeWidth="4" strokeLinecap="round" className="stroke-foreground" />
              <path d="M78 22 l8 -2 l-2 8 z" className="fill-foreground" />
            </motion.g>
          </svg>
        </Vignette>
      );
    case 1:
      return (
        <Vignette>
          <div className="grid w-36 gap-2">
            {[1, 0.75, 0.5].map((w, i) => (
              <div key={i} className="h-2 overflow-hidden rounded-full bg-muted">
                <motion.div
                  className={cn("h-full rounded-full", i === 0 ? "bg-[#fc734d]" : "bg-[#38b6ff]")}
                  initial={false}
                  animate={play ? { width: ["0%", `${w * 100}%`] } : { width: `${w * 100}%` }}
                  transition={{ duration: 0.6, delay: i * 0.12, ease: "easeOut" }}
                />
              </div>
            ))}
            <p className="text-center text-[10px] font-semibold text-foreground">Shipped today</p>
          </div>
        </Vignette>
      );
    case 2:
      return (
        <Vignette>
          <div className="grid w-40 gap-1.5">
            <p className="w-fit rounded-xl rounded-bl-sm bg-card px-2.5 py-1.5 text-[10px] text-foreground shadow-sm">Can you help us today?</p>
            <motion.p
              initial={false}
              animate={play ? { opacity: [0, 1], y: [6, 0] } : { opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="ml-auto w-fit rounded-xl rounded-br-sm bg-[#38b6ff] px-2.5 py-1.5 text-[10px] text-[#02070A]"
            >
              On it now.
            </motion.p>
          </div>
        </Vignette>
      );
    case 3:
      return (
        <Vignette>
          <div className="w-40 rounded-xl border border-border bg-card p-2.5 text-[10px] shadow-sm">
            {[
              ["What we're doing", "Shared"],
              ["Why", "Explained"],
              ["Hidden fees", "None"],
            ].map(([k, v], i) => (
              <motion.div
                key={k}
                initial={false}
                animate={play ? { opacity: [0, 1] } : { opacity: 1 }}
                transition={{ delay: i * 0.2 }}
                className="flex justify-between py-0.5"
              >
                <span className="text-muted-foreground">{k}</span>
                <span className={cn("font-semibold", i === 2 ? "text-[#fc734d]" : "text-foreground")}>{v}</span>
              </motion.div>
            ))}
          </div>
        </Vignette>
      );
    case 4:
      return (
        <Vignette>
          <div className="relative grid place-items-center">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <span key={i} className="absolute" style={{ transform: `rotate(${i * 60}deg) translateX(34px)` }}>
                <motion.span
                  className="block h-1 w-4 rounded-full bg-[#fc734d]"
                  initial={false}
                  animate={play ? { opacity: [0, 1, 0.7], scaleX: [0.3, 1, 1] } : { opacity: 0.7, scaleX: 1 }}
                  transition={{ duration: 0.6, delay: i * 0.06 }}
                />
              </span>
            ))}
            <span className="grid size-12 place-items-center rounded-full bg-[#38b6ff] text-[#02070A]">
              <Lightbulb className="size-6" />
            </span>
          </div>
        </Vignette>
      );
    default:
      return (
        <Vignette>
          <div className="relative h-14 w-32">
            {[
              { x: 0, c: "bg-[#38b6ff]" },
              { x: 38, c: "bg-[#fc734d]" },
              { x: 76, c: "bg-foreground" },
            ].map((dot, i) => (
              <motion.span
                key={i}
                className={cn("absolute top-1 size-12 rounded-full opacity-80 mix-blend-multiply dark:mix-blend-screen", dot.c)}
                initial={false}
                animate={play ? { left: [dot.x + (i - 1) * 18, dot.x] } : { left: dot.x }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              />
            ))}
          </div>
        </Vignette>
      );
  }
}
