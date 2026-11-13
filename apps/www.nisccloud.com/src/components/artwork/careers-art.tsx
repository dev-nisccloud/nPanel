import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  BadgeCheck,
  CalendarClock,
  Check,
  FileText,
  GitBranch,
  Laptop,
  Mail,
  MessageSquare,
  PartyPopper,
  Rocket,
  Send,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { Meter, Panel, Pill, UiButton } from "./kit.tsx";
import { useArtLive } from "./use-art-live.ts";

/**
 * Careers and About illustrations. Built from the same interface language as the rest of the
 * artwork kit (white cards, sky accents, green status pills). Every name and business shown is fictional.
 */

/** Cycles 0..count-1 while the scene is on screen and motion is allowed; rests on the last frame otherwise. */
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

export function SceneStage({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <figure
      role="img"
      aria-label={label}
      className={cn(
        "relative isolate overflow-hidden rounded-[28px] bg-gradient-to-br from-[#38b6ff]/25 via-[#38b6ff]/10 to-[#fc734d]/10 p-5 dark:from-[#38b6ff]/15 dark:via-[#38b6ff]/5 dark:to-[#fc734d]/5 sm:p-7",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-50 dark:opacity-25"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgb(14 87 118 / 0.22) 1px, transparent 0)",
          backgroundSize: "20px 20px",
          maskImage: "radial-gradient(ellipse 80% 70% at 50% 40%, black, transparent)",
        }}
      />
      <div aria-hidden className="relative flex h-full w-full items-center justify-center">
        {children}
      </div>
    </figure>
  );
}

const pop = {
  initial: { opacity: 0, y: 8, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -6, scale: 0.98 },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
};

function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-3.5 shadow-[0_24px_48px_-28px_rgb(14_87_118_/_0.55)]", className)}>
      {children}
    </div>
  );
}

function Initials({ text, tone = "sky" }: { text: string; tone?: "sky" | "orange" | "dark" }) {
  const toneClass = {
    sky: "bg-[#38b6ff] text-[#02070A]",
    orange: "bg-[#fc734d] text-white",
    dark: "bg-[#02070A] text-white dark:bg-white dark:text-[#02070A]",
  }[tone];
  return <span className={cn("grid size-7 shrink-0 place-items-center rounded-full text-[10px] font-bold", toneClass)}>{text}</span>;
}

function Bubble({ from, text, mine = false }: { from: string; text: string; mine?: boolean }) {
  return (
    <div className={cn("flex items-end gap-2", mine && "flex-row-reverse")}>
      <Initials text={from} tone={mine ? "sky" : "dark"} />
      <p
        className={cn(
          "max-w-[78%] rounded-2xl px-3 py-2 text-[11px] leading-snug",
          mine ? "rounded-br-sm bg-[#38b6ff] text-[#02070A]" : "rounded-bl-sm bg-muted text-foreground",
        )}
      >
        {text}
      </p>
    </div>
  );
}

function Tick({ done, children }: { done: boolean; children: ReactNode }) {
  return (
    <li className="flex items-center gap-2 text-[11px] font-medium text-foreground">
      <span
        className={cn(
          "grid size-4 place-items-center rounded-full transition-colors duration-300",
          done ? "bg-emerald-500 text-white" : "border border-border bg-background",
        )}
      >
        {done ? <Check className="size-2.5" strokeWidth={3} /> : null}
      </span>
      <span className={cn("transition-opacity duration-300", done ? "opacity-100" : "opacity-60")}>{children}</span>
    </li>
  );
}

/* ------------------------------------------------------------------ Careers hero */

type HeroPhoto = { src: string; srcSet: string; alt: string; position: string };

const FAN_SLOTS = [
  { x: -78, y: 34, rotate: -6, z: 1 },
  { x: 0, y: 0, rotate: 0, z: 3 },
  { x: 78, y: 34, rotate: 6, z: 1 },
];

/** Three photos, left to right; the middle one sits in front. Deliberately still. */
export function CareersHeroCollage({ photos }: { photos: HeroPhoto[] }) {
  return (
    <div className="relative mx-auto h-[250px] max-w-6xl sm:h-[320px] md:h-[400px]">
      <ul className="absolute inset-0">
        {photos.slice(0, FAN_SLOTS.length).map((photo, index) => {
          const slot = FAN_SLOTS[index];
          return (
            <li
              key={photo.src}
              style={{ zIndex: slot.z, transform: `translateX(calc(-50% + ${slot.x}%)) translateY(${slot.y}px) rotate(${slot.rotate}deg)` }}
              className="absolute -bottom-10 left-1/2 w-[46%] overflow-hidden rounded-[22px] border border-white/15 bg-[#07131b] shadow-[0_30px_60px_-20px_rgb(0_0_0_/_0.7)] sm:w-[34%] md:w-[30%]"
            >
              <img
                src={photo.src}
                srcSet={photo.srcSet}
                sizes="(min-width: 768px) 360px, 46vw"
                alt={photo.alt}
                fetchPriority={index === 1 ? "high" : undefined}
                className={cn("aspect-[3/4] w-full object-cover", photo.position)}
              />
            </li>
          );
        })}
      </ul>

      <div className="absolute left-2 top-0 z-10 hidden w-52 md:block lg:left-6 xl:left-12" aria-hidden>
        <Card className="text-left">
          <p className="text-[10px] font-semibold text-muted-foreground">Your next role</p>
          <p className="mt-1 text-sm font-semibold text-foreground">Pick where you start</p>
          <div className="mt-2.5 flex gap-1.5">
            {["Build", "Run", "Grow"].map((area, i) => (
              <span
                key={area}
                className={cn("rounded-full px-2.5 py-1 text-[10px] font-semibold", i === 0 ? "bg-[#38b6ff] text-[#02070A]" : "bg-muted text-muted-foreground")}
              >
                {area}
              </span>
            ))}
          </div>
        </Card>
      </div>

      <div className="absolute right-2 top-0 z-10 hidden w-56 md:block lg:right-6 xl:right-12" aria-hidden>
        <Card className="flex items-center gap-3 text-left">
          <span className="grid size-9 place-items-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <BadgeCheck className="size-5" />
          </span>
          <div>
            <p className="text-xs font-semibold text-foreground">Application received</p>
            <p className="text-[10px] text-muted-foreground">Our HR team will read it</p>
          </div>
        </Card>
      </div>

      <div className="absolute right-10 top-24 z-10 hidden w-56 xl:block xl:right-24" aria-hidden>
        <Card className="text-left">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold text-foreground">Your first launch</p>
            <Pill>Live</Pill>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">acaciatraders.co.ke</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-full rounded-full bg-[#38b6ff]" />
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Facts */

export function FactYearArt() {
  const { ref, live } = useCycle(1, 10000);
  const marks = ["2019", "Build", "Run", "Grow", "Today"];
  return (
    <div ref={ref} className="relative mx-auto mt-6 h-12 w-full max-w-[220px]" aria-hidden>
      <div className="absolute inset-x-5 top-[3px] h-0.5 rounded-full bg-muted" />
      <motion.div
        className="absolute left-5 top-[3px] h-0.5 rounded-full bg-[#38b6ff]"
        initial={{ width: 0 }}
        animate={{ width: live ? "calc(100% - 2.5rem)" : "calc(100% - 2.5rem)" }}
        transition={{ duration: 1.6, ease: "easeOut" }}
      />
      <div className="absolute inset-x-0 top-0 flex justify-between">
        {marks.map((mark, i) => (
          <motion.div
            key={mark}
            className="flex w-10 flex-col items-center gap-1.5"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.3 }}
          >
            <span className={cn("size-2 rounded-full ring-4 ring-card", i === marks.length - 1 ? "bg-[#fc734d]" : "bg-[#38b6ff]")} />
            <span className="text-[9px] font-semibold text-muted-foreground">{mark}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

const SITES = ["savannabakery.co.ke", "jamboclinic.com", "kilimatours.co.ke", "baobabmedia.africa", "acaciatraders.co.ke", "savannaind.com"];

export function FactCustomersArt() {
  const { ref, step } = useCycle(SITES.length, 1600);
  const visible = [0, 1, 2].map((offset) => SITES[(step + offset) % SITES.length]);
  return (
    <div ref={ref} className="mx-auto mt-6 grid h-[104px] w-full max-w-[240px] content-start gap-1.5 overflow-hidden" aria-hidden>
      <AnimatePresence initial={false} mode="popLayout">
        {visible.map((site) => (
          <motion.div
            key={site}
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4 }}
            className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-2.5 py-1.5"
          >
            <span className="truncate font-mono text-[10px] text-foreground">{site}</span>
            <Pill>Online</Pill>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function FactTeamArt() {
  const { ref, step } = useCycle(3, 1400);
  const nodes = ["Build", "Run", "Grow"];
  return (
    <div ref={ref} className="relative mx-auto mt-6 flex w-full max-w-[230px] items-center justify-between" aria-hidden>
      <span className="absolute inset-x-8 top-1/2 h-px -translate-y-1/2 border-t border-dashed border-[#38b6ff]/60" />
      {nodes.map((node, i) => (
        <span
          key={node}
          className={cn(
            "relative rounded-full border px-3 py-1.5 text-[10px] font-semibold transition-all duration-500",
            step === i
              ? "border-[#38b6ff] bg-[#38b6ff] text-[#02070A] shadow-[0_0_0_4px_rgb(56_182_255_/_0.2)]"
              : "border-border bg-background text-muted-foreground",
          )}
        >
          {node}
        </span>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ Values */

function ValueResults() {
  const { ref, step } = useCycle(3, 1800);
  return (
    <div ref={ref} className="grid gap-3">
      <Panel title="Success for Jambo Clinic" hint="Agreed before the project starts" icon={Target}>
        <ul className="grid gap-1.5">
          <Tick done>More appointment requests</Tick>
          <Tick done={step >= 1}>Pages load in under 2 seconds</Tick>
          <Tick done={step >= 2}>Checked again at handover</Tick>
        </ul>
      </Panel>
      <Card>
        <Meter label="Appointment requests" value={step >= 2 ? 92 : step === 1 ? 64 : 30} detail="vs goal" />
      </Card>
    </div>
  );
}

function ValueSpeed() {
  const { ref, step } = useCycle(3, 1700);
  const states = ["Testing", "Deploying", "Live"] as const;
  return (
    <div ref={ref} className="grid gap-3">
      <Card>
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <GitBranch className="size-3.5 text-[#38b6ff]" /> fix: checkout button on mobile
          </p>
          <Pill tone={step === 2 ? "green" : "sky"}>{states[step]}</Pill>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
          <motion.div className="h-full rounded-full bg-[#38b6ff]" animate={{ width: `${(step + 1) * 33.4}%` }} transition={{ duration: 0.6 }} />
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground">Shipped today, not next sprint</p>
      </Card>
      <Card className="flex items-center gap-2">
        <Rocket className="size-4 text-[#fc734d]" />
        <p className="text-[11px] text-foreground">Next: bigger improvement after we see how customers use it</p>
      </Card>
    </div>
  );
}

function ValueClient() {
  const { ref, step } = useCycle(4, 1500);
  return (
    <div ref={ref} className="grid gap-2.5">
      <Card className="grid gap-2.5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-foreground">Ticket #2048 · Kilima Tours</p>
          <Pill tone={step >= 3 ? "green" : "amber"}>{step >= 3 ? "Resolved" : "Open"}</Pill>
        </div>
        <Bubble from="KT" text="Our booking emails stopped arriving." />
        {step >= 1 ? <Bubble mine from="You" text="Found it: the mail record expired. Fixed and tested." /> : null}
        {step >= 2 ? <Bubble from="KT" text="Working again, thank you!" /> : null}
      </Card>
      {step >= 3 ? (
        <motion.div {...pop}>
          <Card className="flex items-center gap-2 text-[11px] text-foreground">
            <CalendarClock className="size-4 text-[#38b6ff]" /> Check back in 2 days to make sure it stayed fixed
          </Card>
        </motion.div>
      ) : null}
    </div>
  );
}

function ValueTransparency() {
  const { ref, step } = useCycle(3, 1900);
  return (
    <div ref={ref} className="grid gap-3">
      <Card>
        <p className="text-xs font-semibold text-foreground">Launch date update · Baobab Media</p>
        <div className="mt-3 flex items-center gap-3 text-sm">
          <span className={cn("font-semibold transition-all", step >= 1 ? "text-muted-foreground line-through" : "text-foreground")}>12 March</span>
          {step >= 1 ? (
            <motion.span {...pop} className="font-semibold text-[#38b6ff]">
              15 March
            </motion.span>
          ) : null}
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">Reason: final product photos arrive on 13 March.</p>
      </Card>
      {step >= 2 ? (
        <motion.div {...pop}>
          <Card className="flex items-center gap-2 text-[11px] text-foreground">
            <Mail className="size-4 text-[#38b6ff]" /> Sent to the customer a week early
          </Card>
        </motion.div>
      ) : null}
    </div>
  );
}

function ValueLearning() {
  const { ref, step } = useCycle(3, 1800);
  const notes = ["What changed in the platform", "What it means for our customers", "Who updates which accounts"];
  return (
    <div ref={ref} className="grid gap-3">
      <Card>
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <Sparkles className="size-3.5 text-[#fc734d]" /> Friday team demo
          </p>
          <div className="flex -space-x-2">
            <Initials text="AM" />
            <Initials text="JK" tone="orange" />
            <Initials text="WN" tone="dark" />
          </div>
        </div>
        <ul className="mt-3 grid gap-1.5">
          {notes.map((note, i) => (
            <Tick key={note} done={step >= i}>
              {note}
            </Tick>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function ValueTogether() {
  const { ref, step } = useCycle(3, 1500);
  const roles = [
    { name: "Design", initials: "AM", tone: "sky" as const },
    { name: "Engineering", initials: "JK", tone: "orange" as const },
    { name: "Marketing", initials: "WN", tone: "dark" as const },
  ];
  return (
    <div ref={ref} className="grid gap-3">
      <Card>
        <p className="text-xs font-semibold text-foreground">Acacia Traders · one shared account</p>
        <ul className="mt-3 grid gap-2">
          {roles.map((role, i) => (
            <li
              key={role.name}
              className={cn(
                "flex items-center gap-2.5 rounded-xl border px-2.5 py-2 transition-colors duration-500",
                step === i ? "border-[#38b6ff] bg-[#38b6ff]/10" : "border-border",
              )}
            >
              <Initials text={role.initials} tone={role.tone} />
              <span className="text-[11px] font-semibold text-foreground">{role.name}</span>
              <span className="ml-auto text-[10px] text-muted-foreground">{step === i ? "Updating" : "Up to date"}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

const VALUE_SCENES = [ValueResults, ValueSpeed, ValueClient, ValueTransparency, ValueLearning, ValueTogether];

export function ValueScene({ index, label }: { index: number; label: string }) {
  const Scene = VALUE_SCENES[index] ?? ValueResults;
  return (
    <SceneStage label={label} className="flex h-full min-h-[300px] items-center">
      <div className="mx-auto w-full max-w-sm">
        <Scene />
      </div>
    </SceneStage>
  );
}

/* ------------------------------------------------------------------ Offer tiles */

export function MentorChatArt() {
  const { ref, step } = useCycle(3, 1800);
  return (
    <div ref={ref} className="grid gap-2.5" aria-hidden>
      <Bubble mine from="You" text="How would you set up backups for a busy online store?" />
      {step >= 1 ? (
        <motion.div {...pop}>
          <Bubble from="SE" text="Let's pair on it this afternoon. I'll show you how we do it for our own stores." />
        </motion.div>
      ) : null}
      {step >= 2 ? (
        <motion.div {...pop} className="flex justify-end">
          <Pill tone="sky">Pairing session · 3:00 PM</Pill>
        </motion.div>
      ) : null}
    </div>
  );
}

export function TeamCelebrationArt() {
  const reduce = useReducedMotion();
  const { ref, live } = useArtLive<HTMLDivElement>();
  const confetti = Array.from({ length: 14 }, (_, i) => i);
  return (
    <div ref={ref} className="relative h-full min-h-[150px]" aria-hidden>
      {confetti.map((i) => (
        <motion.span
          key={i}
          className={cn("absolute size-1.5 rounded-sm", i % 3 === 0 ? "bg-[#fc734d]" : i % 3 === 1 ? "bg-[#38b6ff]" : "bg-white")}
          style={{ left: `${6 + ((i * 37) % 88)}%`, top: "-6%" }}
          animate={live && !reduce ? { y: [0, 170], rotate: [0, 220], opacity: [0, 1, 0] } : { opacity: 0 }}
          transition={{ duration: 3, repeat: Infinity, delay: (i % 7) * 0.4, ease: "easeIn" }}
        />
      ))}
      <div className="relative grid gap-2">
        <Card className="flex items-center gap-2.5 bg-white/95 dark:bg-card">
          <PartyPopper className="size-4 text-[#fc734d]" />
          <p className="text-[11px] font-semibold text-foreground">Launch day: Savanna Bakery is live</p>
        </Card>
        <Card className="flex items-center gap-2.5 bg-white/95 dark:bg-card">
          <Users className="size-4 text-[#38b6ff]" />
          <p className="text-[11px] text-foreground">Team outing this Saturday</p>
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Hiring steps */

function HireApply() {
  const { ref, step } = useCycle(4, 1300);
  return (
    <div ref={ref} className="grid gap-3">
      <Card className="grid gap-2">
        <p className="text-xs font-semibold text-foreground">Apply for Web Developer</p>
        {["Full name", "Email", "Phone number"].map((field, i) => (
          <div key={field} className="rounded-lg border border-border bg-background px-2.5 py-1.5">
            <p className="text-[9px] text-muted-foreground">{field}</p>
            <motion.div className="mt-1 h-1.5 rounded-full bg-[#38b6ff]/40" animate={{ width: step > i ? "70%" : "0%" }} transition={{ duration: 0.4 }} />
          </div>
        ))}
        <div className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-[#38b6ff]/60 px-2.5 py-2">
          <span className="flex items-center gap-1.5 text-[10px] text-foreground">
            <FileText className="size-3.5 text-[#38b6ff]" /> my-cv.pdf
          </span>
          <UiButton>Submit application</UiButton>
        </div>
      </Card>
      {step === 3 ? (
        <motion.div {...pop}>
          <Card className="flex items-center gap-2 text-[11px] font-semibold text-foreground">
            <BadgeCheck className="size-4 text-emerald-500" /> Application received
          </Card>
        </motion.div>
      ) : null}
    </div>
  );
}

function HireReview() {
  const { ref, step } = useCycle(3, 1700);
  const status = ["New", "HR review", "Shortlisted"] as const;
  return (
    <div ref={ref} className="grid gap-3">
      <Card>
        <div className="flex items-center gap-2.5">
          <Initials text="You" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground">Your application</p>
            <p className="text-[10px] text-muted-foreground">Web Developer · Nairobi</p>
          </div>
          <Pill tone={step === 2 ? "green" : step === 1 ? "amber" : "slate"}>{status[step]}</Pill>
        </div>
        <div className="mt-3 flex gap-1">
          {status.map((s, i) => (
            <span key={s} className={cn("h-1 flex-1 rounded-full transition-colors duration-500", i <= step ? "bg-[#38b6ff]" : "bg-muted")} />
          ))}
        </div>
      </Card>
      {step === 2 ? (
        <motion.div {...pop}>
          <Card className="flex items-center gap-2 text-[11px] text-foreground">
            <Mail className="size-4 text-[#38b6ff]" /> Email from HR: "Let's set up a first conversation"
          </Card>
        </motion.div>
      ) : null}
    </div>
  );
}

function HireConversation() {
  const { ref, step } = useCycle(3, 1700);
  return (
    <div ref={ref} className="grid gap-3">
      <Card className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-[#38b6ff]/15 text-[#38b6ff]">
          <CalendarClock className="size-5" />
        </span>
        <div>
          <p className="text-xs font-semibold text-foreground">First conversation · 30 min</p>
          <p className="text-[10px] text-muted-foreground">Video call or at our Nairobi office</p>
        </div>
      </Card>
      <Card className="grid gap-2">
        <Bubble from="HR" text="Tell us about something you built that you're proud of." />
        {step >= 1 ? <Bubble mine from="You" text="A booking site for a clinic. Requests doubled in a month." /> : null}
        {step >= 2 ? <Bubble from="HR" text="Great. What would you like to work on next?" /> : null}
      </Card>
    </div>
  );
}

function HireTask() {
  const { ref, step } = useCycle(4, 1300);
  const items = ["Read the brief", "Talk it through with the team", "Share your approach"];
  return (
    <div ref={ref} className="grid gap-3">
      <Panel title="A real problem from the team" hint="Same tools, same people you'd work with" icon={Laptop}>
        <ul className="grid gap-1.5">
          {items.map((item, i) => (
            <Tick key={item} done={step > i}>
              {item}
            </Tick>
          ))}
        </ul>
      </Panel>
      <Card className="font-mono text-[10px] leading-relaxed text-muted-foreground">
        <span className="text-[#38b6ff]">$</span> deploy --site kilimatours.co.ke
        <br />
        {step >= 3 ? <span className="text-emerald-600 dark:text-emerald-400">✓ live in 42s</span> : <span>building…</span>}
      </Card>
    </div>
  );
}

function HireDecision() {
  const { ref, step } = useCycle(4, 1300);
  return (
    <div ref={ref} className="grid gap-3">
      <Card>
        <p className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <Send className="size-3.5 text-[#38b6ff]" /> Welcome to Nisc Cloud
        </p>
        <p className="mt-1 text-[10px] text-muted-foreground">Start date agreed together · Monday 3 March</p>
      </Card>
      <Panel title="Ready for day one" icon={Laptop}>
        <ul className="grid gap-1.5">
          <Tick done={step >= 1}>Laptop ready</Tick>
          <Tick done={step >= 2}>Accounts set up</Tick>
          <Tick done={step >= 3}>Mentor says hello</Tick>
        </ul>
      </Panel>
    </div>
  );
}

const HIRE_SCENES = [HireApply, HireReview, HireConversation, HireTask, HireDecision];

export function HireScene({ index, label }: { index: number; label: string }) {
  const Scene = HIRE_SCENES[index] ?? HireApply;
  return (
    <SceneStage label={label} className="flex min-h-[340px] items-center sm:min-h-[400px]">
      <AnimatePresence mode="wait">
        <motion.div key={index} {...pop} className="mx-auto w-full max-w-sm">
          <Scene />
        </motion.div>
      </AnimatePresence>
    </SceneStage>
  );
}

/* ------------------------------------------------------------------ Not for everyone */

export function PaceArt() {
  const { ref, live } = useArtLive<HTMLDivElement>();
  const reduce = useReducedMotion();
  return (
    <div ref={ref} className="relative h-24" aria-hidden>
      <svg viewBox="0 0 120 70" className="mx-auto h-full">
        <path d="M10 60 A50 50 0 0 1 110 60" fill="none" strokeWidth="8" strokeLinecap="round" className="stroke-muted" />
        <motion.path
          d="M10 60 A50 50 0 0 1 110 60"
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          stroke="#38b6ff"
          initial={{ pathLength: 0.2 }}
          animate={live && !reduce ? { pathLength: [0.2, 0.85, 0.7, 0.85] } : { pathLength: 0.85 }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.g
          style={{ transformOrigin: "60px 60px", transformBox: "view-box" }}
          initial={{ rotate: -60 }}
          animate={live && !reduce ? { rotate: [-60, 50, 30, 50] } : { rotate: 50 }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <line x1="60" y1="60" x2="60" y2="22" stroke="#fc734d" strokeWidth="4" strokeLinecap="round" />
        </motion.g>
        <circle cx="60" cy="60" r="5" className="fill-foreground" />
      </svg>
    </div>
  );
}

export function OwnershipArt() {
  const { ref, step } = useCycle(4, 1000);
  const stages = ["Brief", "Build", "Launch", "Result"];
  return (
    <div ref={ref} className="flex h-24 items-center" aria-hidden>
      <div className="relative flex w-full items-center justify-between">
        <span className="absolute inset-x-3 top-1/2 h-0.5 -translate-y-1/2 bg-muted" />
        <motion.span
          className="absolute left-3 top-1/2 h-0.5 -translate-y-1/2 bg-[#38b6ff]"
          animate={{ width: `calc(${(step / 3) * 100}% - ${(step / 3) * 1.5}rem)` }}
          transition={{ duration: 0.6 }}
        />
        {stages.map((stage, i) => (
          <span key={stage} className="relative flex flex-col items-center gap-1.5">
            <span
              className={cn(
                "grid size-7 place-items-center rounded-full border-2 bg-card text-[9px] font-bold transition-colors duration-300",
                i <= step ? "border-[#38b6ff] text-[#38b6ff]" : "border-muted text-muted-foreground",
                i === step && "bg-[#38b6ff] text-[#02070A]",
              )}
            >
              {i === step ? "You" : i + 1}
            </span>
            <span className="text-[9px] font-semibold text-muted-foreground">{stage}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function PlainTalkArt() {
  const { ref, step } = useCycle(3, 1600);
  return (
    <div ref={ref} className="flex h-24 flex-col justify-center gap-1.5" aria-hidden>
      <div className="flex items-center gap-2">
        <MessageSquare className="size-3.5 shrink-0 text-[#38b6ff]" />
        <p className="rounded-xl rounded-bl-sm bg-muted px-2.5 py-1.5 text-[10px] text-foreground">The homepage is too slow. Here is why.</p>
      </div>
      {step >= 1 ? (
        <motion.div {...pop} className="flex items-center justify-end gap-2">
          <p className="rounded-xl rounded-br-sm bg-[#38b6ff] px-2.5 py-1.5 text-[10px] text-[#02070A]">Fair. I'll fix the images today.</p>
        </motion.div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ Nothing fits */

export function OpenApplicationArt() {
  const { ref, step } = useCycle(4, 1500);
  const message = "I'd own our customers' first week: onboarding, setup and making sure they launch.";
  const shown = step === 0 ? 0 : step === 1 ? 32 : message.length;
  return (
    <div ref={ref} className="grid gap-3" aria-hidden>
      <Card className="grid gap-2.5 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Open application</p>
          <Pill tone="sky">No role posted yet</Pill>
        </div>
        <div className="rounded-lg border border-border bg-background px-3 py-2">
          <p className="text-[10px] text-muted-foreground">What would you own?</p>
          <p className="mt-1 min-h-[34px] text-[11px] leading-snug text-foreground">
            {message.slice(0, shown)}
            {step < 2 ? <span className="ml-0.5 inline-block h-3 w-px translate-y-0.5 animate-pulse bg-foreground" /> : null}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-background px-3 py-2">
          <p className="text-[10px] text-muted-foreground">Something you've built</p>
          <p className="mt-1 font-mono text-[11px] text-[#38b6ff]">github.com/your-work</p>
        </div>
        <div className="flex justify-end">
          <UiButton>
            <Send className="size-3" /> Send to the team
          </UiButton>
        </div>
      </Card>
      <AnimatePresence>
        {step === 3 ? (
          <motion.div {...pop}>
            <Card className="flex items-center gap-2 text-[11px] font-semibold text-foreground">
              <BadgeCheck className="size-4 text-emerald-500" /> Sent. A real person will read it.
            </Card>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
