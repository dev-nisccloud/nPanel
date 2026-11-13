import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Bell,
  Check,
  CheckCircle2,
  Coffee,
  CreditCard,
  GitBranch,
  Home,
  Laptop,
  Leaf,
  Lightbulb,
  Monitor,
  Package,
  PenLine,
  Rocket,
  Search,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Star,
  Tablet,
  Terminal,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { Pill } from "./kit.tsx";
import { useArtLive } from "./use-art-live.ts";

/**
 * Build-side illustrations. Each scene loops while on screen and rests on its finished frame when
 * off screen or when the visitor prefers reduced motion. Every business, person and figure is fictional.
 */

function useLoop(count: number, ms: number) {
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

const ease = [0.22, 1, 0.36, 1] as const;

function Stage({ label, tone = "sky", className, children }: { label: string; tone?: "sky" | "night" | "warm"; className?: string; children: ReactNode }) {
  const backdrop = {
    sky: "bg-gradient-to-br from-[#38b6ff]/30 via-[#38b6ff]/10 to-[#fc734d]/10 dark:from-[#38b6ff]/15 dark:via-[#38b6ff]/5 dark:to-[#fc734d]/5",
    night: "bg-[#02070A]",
    warm: "bg-gradient-to-br from-[#fc734d]/20 via-[#38b6ff]/10 to-[#38b6ff]/25 dark:from-[#fc734d]/10 dark:to-[#38b6ff]/10",
  }[tone];
  return (
    <figure role="img" aria-label={label} className={cn("relative mx-auto w-full max-w-[600px] overflow-hidden rounded-[28px] p-5 sm:p-7", backdrop, className)}>
      <div
        aria-hidden
        className={cn("pointer-events-none absolute inset-0", tone === "night" ? "opacity-30" : "opacity-50 dark:opacity-25")}
        style={{
          backgroundImage: tone === "night" ? "linear-gradient(rgb(56 182 255 / 0.12) 1px, transparent 1px), linear-gradient(90deg, rgb(56 182 255 / 0.12) 1px, transparent 1px)" : "radial-gradient(circle at 1px 1px, rgb(14 87 118 / 0.2) 1px, transparent 0)",
          backgroundSize: tone === "night" ? "28px 28px" : "20px 20px",
        }}
      />
      <div aria-hidden className="relative">
        {children}
      </div>
    </figure>
  );
}

function Avatar({ text, tone = "sky" }: { text: string; tone?: "sky" | "orange" | "dark" }) {
  return (
    <span
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-full text-[8px] font-bold ring-2 ring-card",
        tone === "sky" && "bg-[#38b6ff] text-[#02070A]",
        tone === "orange" && "bg-[#fc734d] text-white",
        tone === "dark" && "bg-[#02070A] text-white dark:bg-white dark:text-[#02070A]",
      )}
    >
      {text}
    </span>
  );
}

/* ------------------------------------------------------------------ Careers: your first project */

const COLUMNS = ["Brief", "Design", "Build", "Live"] as const;

/** A project card travels across the board while the team gathers around it. */
export function ProjectJourneyArt() {
  const { ref, step } = useLoop(5, 1600);
  const col = Math.min(step, 3);
  const done = step === 4;
  return (
    <div ref={ref} className="w-full">
      <Stage label="Illustration: a project card moves from brief to design, build and live while the team works on it">
        <div className="rounded-2xl border border-border bg-card p-3 shadow-[0_30px_60px_-30px_rgb(14_87_118_/_0.45)]">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[12px] font-semibold text-foreground">Your first project</p>
            <div className="flex -space-x-1.5">
              <Avatar text="You" tone="orange" />
              <Avatar text="AM" />
              <Avatar text="KO" tone="dark" />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {COLUMNS.map((name, i) => (
              <div key={name} className={cn("min-h-[150px] rounded-xl p-2 transition-colors duration-500", i === col ? "bg-[#38b6ff]/10" : "bg-muted/60")}>
                <p className="flex items-center justify-between text-[9px] font-semibold text-muted-foreground">
                  {name}
                  {i < col || (i === 3 && done) ? <CheckCircle2 className="size-3 text-emerald-500" /> : null}
                </p>
                <div className="mt-2 space-y-1.5">
                  <span className="block h-5 rounded-md bg-card/80" />
                  {i === col ? (
                    <motion.div layoutId="journey-card" transition={{ duration: 0.6, ease }} className="rounded-lg border border-[#38b6ff]/50 bg-card p-1.5 shadow-md">
                      <p className="text-[8px] font-semibold leading-tight text-foreground">kilele-coffee.co.ke</p>
                      <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
                        <motion.div className="h-full bg-[#38b6ff]" animate={{ width: `${(col + 1) * 25}%` }} transition={{ duration: 0.6 }} />
                      </div>
                      <div className="mt-1 flex -space-x-1">
                        <span className="size-3 rounded-full bg-[#fc734d] ring-1 ring-card" />
                        <span className="size-3 rounded-full bg-[#38b6ff] ring-1 ring-card" />
                      </div>
                    </motion.div>
                  ) : null}
                  <span className="block h-5 rounded-md bg-card/60" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <AnimatePresence>
          {done ? (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute -bottom-2 right-2 flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 shadow-lg"
            >
              <Rocket className="size-4 text-[#fc734d]" />
              <span className="text-[11px] font-semibold text-foreground">Launched. The client is live.</span>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </Stage>
    </div>
  );
}

/* ------------------------------------------------------------------ About: blueprint to website */

const MODES = ["Wireframe", "Design", "Live"] as const;

/** One page drawn as a blueprint, then styled, then switched live. */
export function BlueprintSiteArt() {
  const { ref, step } = useLoop(3, 2200);
  const wire = step === 0;
  const live = step === 2;
  const block = (styled: string) => cn("rounded-lg transition-all duration-700", wire ? "border border-dashed border-[#38b6ff]/70 bg-transparent" : styled);
  return (
    <div ref={ref} className="w-full">
      <Stage tone={wire ? "night" : "sky"} label="Illustration: a website page turns from a blueprint wireframe into a finished design and goes live">
        <div className="mb-3 flex justify-center gap-1 rounded-full bg-card/80 p-1 shadow-sm backdrop-blur">
          {MODES.map((m, i) => (
            <span key={m} className={cn("rounded-full px-3 py-1 text-[10px] font-semibold transition-colors", i === step ? "bg-[#38b6ff] text-[#02070A]" : "text-muted-foreground")}>
              {m}
            </span>
          ))}
        </div>
        <div className={cn("rounded-2xl p-3 transition-colors duration-700", wire ? "border border-[#38b6ff]/40 bg-transparent" : "border border-border bg-card shadow-[0_30px_60px_-30px_rgb(14_87_118_/_0.45)]")}>
          <div className="flex items-center justify-between">
            <span className={block("h-4 w-20 bg-[#02070A] dark:bg-white")} />
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <span key={i} className={block("h-2.5 w-8 bg-muted")} />
              ))}
            </div>
          </div>
          <div className={cn("mt-3 grid gap-3 p-3 sm:grid-cols-[1.2fr_1fr]", block("bg-gradient-to-br from-[#38b6ff]/25 to-[#fc734d]/15"))}>
            <div className="space-y-2">
              <span className={cn("block h-3 w-4/5", block("bg-foreground/80"))} />
              <span className={cn("block h-3 w-3/5", block("bg-foreground/80"))} />
              <span className={cn("block h-2 w-full", block("bg-muted-foreground/30"))} />
              <span className={cn("mt-1 inline-flex h-6 w-20 items-center justify-center text-[9px] font-semibold", block("bg-[#fc734d] text-white"))}>{wire ? "" : "Order now"}</span>
            </div>
            <div className={cn("grid aspect-[4/3] place-items-center", block("bg-card"))}>
              {wire ? <span className="text-[9px] font-semibold text-[#38b6ff]">IMAGE</span> : <Coffee className="size-10 text-[#fc734d]" />}
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {["Menu", "Visit", "Reviews"].map((t) => (
              <div key={t} className={cn("p-2", block("bg-muted/70"))}>
                <span className={cn("block h-6 w-6", block("bg-[#38b6ff]/20"))} />
                <p className={cn("mt-1.5 text-[9px] font-semibold transition-opacity", wire ? "opacity-0" : "text-foreground")}>{t}</p>
              </div>
            ))}
          </div>
        </div>
        <AnimatePresence>
          {live ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute -bottom-1 left-3 flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 shadow-lg"
            >
              <span className="size-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-semibold text-foreground">kilele-coffee.co.ke is live</span>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </Stage>
    </div>
  );
}

/* ------------------------------------------------------------------ Home: idea to first order */

/** A sticky-note idea becomes a phone shop, and the first order lands. */
export function IdeaToOrderArt() {
  const { ref, step } = useLoop(4, 1900);
  return (
    <div ref={ref} className="w-full">
      <Stage tone="warm" label="Illustration: a business idea on a sticky note becomes an online shop and the first order arrives">
        <div className="relative grid min-h-[300px] grid-cols-[1fr_auto] items-center gap-4">
          <div className="relative h-full">
            <motion.div
              animate={{ rotate: step === 0 ? -4 : -8, x: step === 0 ? 0 : -6, scale: step === 0 ? 1 : 0.92, opacity: step >= 2 ? 0.55 : 1 }}
              transition={{ duration: 0.6, ease }}
              className="absolute left-0 top-4 w-40 rounded-md bg-[#fde68a] p-3 text-[#02070A] shadow-lg"
            >
              <Lightbulb className="size-4" />
              <p className="mt-2 text-[11px] font-semibold leading-snug">Sell our coffee beans online, with M-Pesa</p>
              <p className="mt-2 text-[9px] opacity-60">Kilele Coffee</p>
            </motion.div>
            <svg viewBox="0 0 160 120" className="absolute bottom-6 left-10 h-24 w-40 text-[#38b6ff]" fill="none">
              <motion.path
                d="M5 20 C 60 10, 70 100, 150 95"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeDasharray="6 6"
                strokeLinecap="round"
                initial={false}
                animate={{ pathLength: step >= 1 ? 1 : 0 }}
                transition={{ duration: 0.8 }}
              />
            </svg>
            <AnimatePresence>
              {step >= 1 ? (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute bottom-2 left-0 flex gap-1.5">
                  {[PenLine, Laptop, Rocket].map((Icon, i) => (
                    <span key={i} className="grid size-8 place-items-center rounded-xl bg-card text-[#38b6ff] shadow-sm">
                      <Icon className="size-4" />
                    </span>
                  ))}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <motion.div
            animate={{ y: step >= 2 ? 0 : 14, opacity: step >= 1 ? 1 : 0.35 }}
            transition={{ duration: 0.6, ease }}
            className="relative w-[150px] rounded-[26px] border-[5px] border-[#02070A] bg-card p-2 shadow-2xl dark:border-white/80"
          >
            <span className="mx-auto mb-2 block h-1 w-10 rounded-full bg-muted" />
            <div className="rounded-xl bg-gradient-to-br from-[#fc734d]/25 to-[#38b6ff]/20 p-2">
              <Coffee className="size-6 text-[#fc734d]" />
              <p className="mt-1 text-[10px] font-semibold text-foreground">Kilele Coffee</p>
              <p className="text-[8px] text-muted-foreground">Fresh beans from Nyeri</p>
            </div>
            <div className="mt-2 space-y-1.5">
              {["House blend", "Single origin"].map((p, i) => (
                <div key={p} className="flex items-center justify-between rounded-lg bg-muted/70 px-2 py-1.5">
                  <span className="text-[9px] font-medium text-foreground">{p}</span>
                  <span className={cn("rounded-md px-1.5 py-0.5 text-[8px] font-semibold transition-colors", step >= 2 && i === 0 ? "bg-[#38b6ff] text-[#02070A]" : "bg-card text-muted-foreground")}>
                    {step >= 2 && i === 0 ? "Added" : "Add"}
                  </span>
                </div>
              ))}
            </div>
            <span className={cn("mt-2 block rounded-lg py-1.5 text-center text-[9px] font-bold transition-colors", step >= 2 ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground")}>Pay with M-Pesa</span>
          </motion.div>

          <AnimatePresence>
            {step === 3 ? (
              <motion.div
                initial={{ opacity: 0, y: -14, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, ease }}
                className="absolute right-0 top-0 flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 shadow-xl"
              >
                <Bell className="size-4 text-[#fc734d]" />
                <span>
                  <span className="block text-[10px] font-semibold text-foreground">New order</span>
                  <span className="block text-[9px] text-muted-foreground">House blend · paid</span>
                </span>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </Stage>
    </div>
  );
}

/* ------------------------------------------------------------------ Services: mobile experience */

const SCREENS = ["home", "product", "checkout", "done"] as const;

/** A phone app flows from browse to paid, with the tap marker guiding each step. */
export function MobileFlowArt() {
  const { ref, step } = useLoop(4, 1700);
  const screen = SCREENS[step];
  return (
    <div ref={ref} className="w-full">
      <Stage label="Illustration: a mobile app moves from the home screen to a product, checkout and a confirmed order">
        <div className="flex items-center justify-center gap-5">
          <div className="hidden w-28 space-y-2 sm:block">
            {["Browse", "Choose", "Pay", "Track"].map((t, i) => (
              <div key={t} className={cn("flex items-center gap-2 rounded-xl px-2.5 py-2 text-[10px] font-semibold transition-colors", i === step ? "bg-card text-foreground shadow-md" : "text-muted-foreground")}>
                <span className={cn("grid size-5 place-items-center rounded-full text-[9px]", i <= step ? "bg-[#38b6ff] text-[#02070A]" : "bg-muted")}>{i + 1}</span>
                {t}
              </div>
            ))}
          </div>
          <div className="relative h-[300px] w-[160px] overflow-hidden rounded-[30px] border-[5px] border-[#02070A] bg-card shadow-2xl dark:border-white/80">
            <span className="absolute left-1/2 top-1.5 z-10 h-1 w-10 -translate-x-1/2 rounded-full bg-muted" />
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div key={screen} initial={{ x: 160 }} animate={{ x: 0 }} exit={{ x: -160 }} transition={{ duration: 0.45, ease }} className="absolute inset-0 p-3 pt-5">
                {screen === "home" ? (
                  <>
                    <div className="flex items-center gap-1.5 rounded-lg bg-muted px-2 py-1.5 text-[9px] text-muted-foreground">
                      <Search className="size-3" /> Search plants
                    </div>
                    <div className="mt-2 rounded-xl bg-gradient-to-br from-emerald-400/30 to-[#38b6ff]/20 p-2">
                      <p className="text-[10px] font-semibold text-foreground">Green Haven</p>
                      <p className="text-[8px] text-muted-foreground">Plants delivered in Nairobi</p>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-1.5">
                      {[0, 1, 2, 3].map((i) => (
                        <div key={i} className={cn("rounded-lg p-1.5", i === 0 ? "bg-[#38b6ff]/15 ring-1 ring-[#38b6ff]" : "bg-muted/70")}>
                          <Leaf className="size-5 text-emerald-500" />
                          <span className="mt-1 block h-1 w-8 rounded bg-foreground/20" />
                        </div>
                      ))}
                    </div>
                  </>
                ) : null}
                {screen === "product" ? (
                  <>
                    <div className="grid aspect-square place-items-center rounded-xl bg-emerald-400/20">
                      <Leaf className="size-12 text-emerald-500" />
                    </div>
                    <p className="mt-2 text-[11px] font-semibold text-foreground">Monstera, medium</p>
                    <div className="mt-1 flex gap-0.5 text-amber-400">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <Star key={i} className="size-2.5 fill-current" />
                      ))}
                    </div>
                    <span className="mt-3 block rounded-lg bg-[#38b6ff] py-1.5 text-center text-[9px] font-bold text-[#02070A]">Add to bag</span>
                  </>
                ) : null}
                {screen === "checkout" ? (
                  <>
                    <p className="text-[11px] font-semibold text-foreground">Checkout</p>
                    {[["Delivery", "Westlands"], ["Payment", "M-Pesa"]].map(([k, v]) => (
                      <div key={k} className="mt-2 rounded-lg bg-muted/70 px-2 py-1.5">
                        <p className="text-[8px] text-muted-foreground">{k}</p>
                        <p className="text-[10px] font-semibold text-foreground">{v}</p>
                      </div>
                    ))}
                    <span className="mt-3 flex items-center justify-center gap-1 rounded-lg bg-emerald-500 py-1.5 text-[9px] font-bold text-white">
                      <CreditCard className="size-3" /> Confirm payment
                    </span>
                  </>
                ) : null}
                {screen === "done" ? (
                  <div className="grid h-full place-items-center text-center">
                    <div>
                      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 14 }} className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-500 text-white">
                        <Check className="size-6" strokeWidth={3} />
                      </motion.span>
                      <p className="mt-3 text-[11px] font-semibold text-foreground">Order confirmed</p>
                      <p className="mt-1 flex items-center justify-center gap-1 text-[9px] text-muted-foreground">
                        <Package className="size-3" /> Arriving today
                      </p>
                    </div>
                  </div>
                ) : null}
              </motion.div>
            </AnimatePresence>
            <div className="absolute inset-x-3 bottom-2 z-10 flex justify-around rounded-xl bg-card/90 py-1.5 text-muted-foreground backdrop-blur">
              <Home className="size-3.5" />
              <ShoppingBag className="size-3.5" />
              <User className="size-3.5" />
            </div>
          </div>
        </div>
      </Stage>
    </div>
  );
}

/* ------------------------------------------------------------------ Services: software and code */

const CODE = [
  ["const", " order = await ", "createOrder", "(cart);"],
  ["await", " mpesa.", "requestPayment", "(order);"],
  ["notify", "(customer, ", "\"Order received\"", ");"],
] as const;
const PIPE = ["Build", "Test", "Deploy"] as const;

/** Code is typed, the pipeline runs and the preview updates. */
export function CodePipelineArt() {
  const { ref, step } = useLoop(6, 1100);
  const lines = Math.min(step + 1, 3);
  const pipe = step - 2;
  return (
    <div ref={ref} className="w-full">
      <Stage tone="night" label="Illustration: code is written, tested and deployed through a pipeline, and the app preview updates">
        <div className="grid gap-3 sm:grid-cols-[1.25fr_1fr]">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#07131b] shadow-2xl">
            <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
              <span className="size-2 rounded-full bg-rose-400" />
              <span className="size-2 rounded-full bg-amber-400" />
              <span className="size-2 rounded-full bg-emerald-400" />
              <span className="ml-2 text-[9px] font-semibold text-white/60">checkout.ts</span>
              <span className="ml-auto flex items-center gap-1 text-[9px] text-white/50">
                <GitBranch className="size-3" /> main
              </span>
            </div>
            <div className="space-y-1.5 p-3 font-mono text-[10px] leading-relaxed">
              {CODE.map((line, i) => (
                <motion.p key={i} initial={false} animate={{ opacity: i < lines ? 1 : 0.15 }} className="whitespace-nowrap">
                  <span className="mr-3 text-white/30">{i + 1}</span>
                  <span className="text-[#fc734d]">{line[0]}</span>
                  <span className="text-white/80">{line[1]}</span>
                  <span className="text-[#38b6ff]">{line[2]}</span>
                  <span className="text-white/80">{line[3]}</span>
                  {i === lines - 1 && step < 3 ? <span className="ml-0.5 inline-block h-3 w-1.5 translate-y-0.5 animate-pulse bg-[#38b6ff]" /> : null}
                </motion.p>
              ))}
            </div>
            <div className="border-t border-white/10 px-3 py-2">
              <div className="flex items-center gap-2">
                {PIPE.map((p, i) => {
                  const state = pipe > i || step === 5 ? "done" : pipe === i ? "run" : "wait";
                  return (
                    <div key={p} className="flex flex-1 items-center gap-1.5">
                      <span
                        className={cn(
                          "grid size-5 place-items-center rounded-full text-[9px] transition-colors",
                          state === "done" && "bg-emerald-500 text-white",
                          state === "run" && "bg-[#38b6ff] text-[#02070A]",
                          state === "wait" && "bg-white/10 text-white/40",
                        )}
                      >
                        {state === "done" ? <Check className="size-3" strokeWidth={3} /> : state === "run" ? <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="block size-2.5 rounded-full border-2 border-[#02070A] border-t-transparent" /> : i + 1}
                      </span>
                      <span className={cn("text-[9px] font-semibold", state === "wait" ? "text-white/40" : "text-white/85")}>{p}</span>
                      {i < PIPE.length - 1 ? <span className={cn("h-px flex-1", pipe > i || step === 5 ? "bg-emerald-500" : "bg-white/15")} /> : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="rounded-2xl border border-white/10 bg-[#07131b] p-3 font-mono text-[9px] text-white/70">
              <p className="flex items-center gap-1.5 text-white/50">
                <Terminal className="size-3 text-[#38b6ff]" /> tests
              </p>
              {["creates an order", "requests payment", "notifies customer"].map((t, i) => (
                <p key={t} className={cn("mt-1 transition-opacity", pipe >= 1 || step === 5 ? "opacity-100" : "opacity-20")}>
                  <span className="text-emerald-400">✓</span> {t}
                </p>
              ))}
            </div>
            <div className="relative flex-1 rounded-2xl bg-card p-3 shadow-xl">
              <p className="text-[10px] font-semibold text-foreground">Preview</p>
              <div className="mt-2 rounded-lg bg-muted/70 p-2">
                <p className="text-[9px] text-muted-foreground">Order #1042</p>
                <p className="text-[11px] font-semibold text-foreground">Payment received</p>
              </div>
              <AnimatePresence>
                {step === 5 ? (
                  <motion.span initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-2 inline-flex">
                    <Pill>Deployed</Pill>
                  </motion.span>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </Stage>
    </div>
  );
}

/* ------------------------------------------------------------------ Service pages: responsive website */

const DEVICES = [
  { id: "desktop", icon: Monitor, width: "100%", label: "1440px" },
  { id: "tablet", icon: Tablet, width: "62%", label: "820px" },
  { id: "phone", icon: Smartphone, width: "36%", label: "390px" },
] as const;

/** One website reflowing as the viewport shrinks from desktop to phone. */
export function ResponsiveSiteArt() {
  const { ref, step } = useLoop(3, 2000);
  const device = DEVICES[step];
  const narrow = step === 2;
  const mid = step === 1;
  return (
    <div ref={ref} className="w-full">
      <Stage label="Illustration: the same website reflows neatly from a desktop screen to a tablet and a phone">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex gap-1 rounded-full bg-card/80 p-1 shadow-sm">
            {DEVICES.map((d, i) => (
              <span key={d.id} className={cn("grid size-7 place-items-center rounded-full transition-colors", i === step ? "bg-[#38b6ff] text-[#02070A]" : "text-muted-foreground")}>
                <d.icon className="size-3.5" />
              </span>
            ))}
          </div>
          <span className="rounded-full bg-[#02070A] px-2.5 py-1 font-mono text-[10px] font-semibold text-white">{device.label}</span>
        </div>
        <div className="flex h-[300px] justify-center">
          <motion.div
            animate={{ width: device.width }}
            transition={{ duration: 0.8, ease }}
            className="h-full overflow-hidden rounded-2xl border border-border bg-card shadow-[0_30px_60px_-30px_rgb(14_87_118_/_0.45)]"
          >
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <span className="text-[10px] font-bold text-foreground">Tamu Bakes</span>
              {narrow ? (
                <span className="space-y-0.5">
                  <span className="block h-0.5 w-3 bg-foreground" />
                  <span className="block h-0.5 w-3 bg-foreground" />
                </span>
              ) : (
                <span className="flex gap-2 text-[8px] text-muted-foreground">
                  <span>Cakes</span>
                  <span>Order</span>
                  <span>Visit</span>
                </span>
              )}
            </div>
            <motion.div layout className={cn("grid gap-2 p-3", narrow ? "grid-cols-1" : "grid-cols-[1.2fr_1fr]")}>
              <motion.div layout className="space-y-1.5">
                <span className="block h-2.5 w-4/5 rounded bg-foreground/80" />
                <span className="block h-2.5 w-3/5 rounded bg-foreground/80" />
                <span className="block h-1.5 w-full rounded bg-muted-foreground/30" />
                <span className="inline-block rounded-md bg-[#fc734d] px-2 py-1 text-[8px] font-semibold text-white">Order a cake</span>
              </motion.div>
              <motion.div layout className="grid aspect-[4/3] place-items-center rounded-lg bg-gradient-to-br from-[#fc734d]/25 to-[#38b6ff]/20">
                <Sparkles className="size-6 text-[#fc734d]" />
              </motion.div>
            </motion.div>
            <motion.div layout className={cn("grid gap-2 px-3 pb-3", narrow ? "grid-cols-1" : mid ? "grid-cols-2" : "grid-cols-3")}>
              {[0, 1, 2].map((i) => (
                <motion.div layout key={i} className="rounded-lg bg-muted/70 p-2">
                  <span className="block h-5 w-5 rounded-md bg-[#38b6ff]/25" />
                  <span className="mt-1 block h-1 w-10 rounded bg-foreground/25" />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </Stage>
    </div>
  );
}

/* ------------------------------------------------------------------ Work: brand system */

const APPLICATIONS = [
  { id: "card", label: "Business card" },
  { id: "sign", label: "Shop sign" },
  { id: "post", label: "Social post" },
] as const;

function TeaMark({ size = 56, assembled = true }: { size?: number; assembled?: boolean }) {
  return (
    <svg viewBox="0 0 60 60" width={size} height={size}>
      <motion.circle cx="30" cy="34" r="20" fill="#fc734d" initial={false} animate={{ scale: assembled ? 1 : 0.2, opacity: assembled ? 1 : 0 }} transition={{ duration: 0.5 }} style={{ transformOrigin: "30px 34px" }} />
      <motion.path d="M10 40 L30 14 L50 40 Z" fill="#38b6ff" initial={false} animate={{ y: assembled ? 0 : -18, opacity: assembled ? 1 : 0 }} transition={{ duration: 0.5, delay: 0.15 }} />
      <motion.path d="M22 40 L30 28 L38 40 Z" fill="#02070A" initial={false} animate={{ y: assembled ? 0 : 18, opacity: assembled ? 1 : 0 }} transition={{ duration: 0.5, delay: 0.3 }} />
    </svg>
  );
}

/** A mark is constructed from simple shapes, then applied across real touchpoints. */
export function BrandSystemArt() {
  const { ref, step } = useLoop(4, 1800);
  const assembled = step >= 1;
  const applied = step >= 2;
  return (
    <div ref={ref} className="w-full">
      <Stage tone="warm" label="Illustration: a logo is built from simple shapes and then applied to a business card, shop sign and social post">
        <div className="grid items-center gap-4 sm:grid-cols-[0.9fr_1.1fr]">
          <div className="relative grid aspect-square place-items-center rounded-2xl border border-border bg-card shadow-lg">
            <svg viewBox="0 0 100 100" className="absolute inset-4 text-[#38b6ff]/40" fill="none">
              <circle cx="50" cy="56" r="33" stroke="currentColor" strokeDasharray="3 3" />
              <path d="M17 66 L50 23 L83 66" stroke="currentColor" strokeDasharray="3 3" />
              <path d="M0 66 H100 M50 0 V100" stroke="currentColor" strokeDasharray="2 4" />
            </svg>
            <div className="relative text-center">
              <TeaMark size={88} assembled={assembled} />
              <motion.p initial={false} animate={{ opacity: assembled ? 1 : 0 }} className="mt-1 text-[12px] font-bold tracking-[0.25em] text-foreground">
                KILIMA
              </motion.p>
              <motion.p initial={false} animate={{ opacity: assembled ? 1 : 0 }} className="text-[8px] tracking-[0.3em] text-muted-foreground">
                TEA HOUSE
              </motion.p>
            </div>
            <span className="absolute bottom-2 left-2 rounded-md bg-muted px-1.5 py-0.5 text-[8px] font-semibold text-muted-foreground">{assembled ? "Mark ready" : "Construction"}</span>
          </div>

          <div className="relative h-[220px]">
            {APPLICATIONS.map((app, i) => {
              const spread = applied ? [{ x: 0, y: 0, r: -6 }, { x: 30, y: 70, r: 3 }, { x: 70, y: 140, r: -2 }][i] : { x: 40, y: 70, r: 0 };
              const highlight = step === 3 && i === 2;
              return (
                <motion.div
                  key={app.id}
                  initial={false}
                  animate={{ x: spread.x, y: spread.y, rotate: spread.r, opacity: applied ? 1 : 0, scale: highlight ? 1.05 : 1 }}
                  transition={{ duration: 0.6, ease, delay: applied ? i * 0.12 : 0 }}
                  className={cn("absolute left-0 top-0 w-44 rounded-xl border border-border p-2.5 shadow-lg", app.id === "sign" ? "bg-[#02070A] text-white" : "bg-card")}
                >
                  <div className="flex items-center gap-2">
                    <TeaMark size={app.id === "sign" ? 30 : 24} />
                    <div>
                      <p className={cn("text-[9px] font-bold tracking-[0.18em]", app.id === "sign" ? "text-white" : "text-foreground")}>KILIMA</p>
                      <p className={cn("text-[7px]", app.id === "sign" ? "text-white/60" : "text-muted-foreground")}>{app.id === "post" ? "New: Kericho gold blend" : app.id === "sign" ? "Open daily" : "Wanjiru M. · Founder"}</p>
                    </div>
                  </div>
                  <p className={cn("mt-1.5 text-[8px] font-semibold", app.id === "sign" ? "text-[#38b6ff]" : "text-[#38b6ff]")}>{app.label}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          {["#fc734d", "#38b6ff", "#02070A", "#f4e3c1"].map((c, i) => (
            <motion.span key={c} initial={false} animate={{ scale: assembled ? 1 : 0.6, opacity: assembled ? 1 : 0.3 }} transition={{ delay: i * 0.08 }} className="h-7 flex-1 rounded-lg ring-1 ring-black/5" style={{ background: c }} />
          ))}
          <span className="ml-2 text-[9px] font-semibold text-muted-foreground">Aa · DM Sans</span>
        </div>
      </Stage>
    </div>
  );
}
