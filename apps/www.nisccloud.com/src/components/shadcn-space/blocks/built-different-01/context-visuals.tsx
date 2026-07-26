import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  BarChart3,
  Check,
  Crosshair,
  FileText,
  FolderOpen,
  Inbox,
  KeyRound,
  Link2,
  Lock,
  MapPin,
  MessageCircle,
  Package,
  Palette,
  PenTool,
  Search,
  Server,
  Settings2,
  Shield,
  ShieldCheck,
  Smartphone,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { extractStat, type BuiltDifferentPoint, type VisualTheme } from "./visual-context.ts";

type VisualProps = {
  point: BuiltDifferentPoint;
};

/** When true, play continuous / remount-friendly animate instead of one-shot whileInView. */
const VisualLoopContext = createContext(false);

function useLoop() {
  return useContext(VisualLoopContext);
}

const softInBase = {
  initial: { opacity: 0, y: 8 },
  viewport: { once: true, margin: "-20px" as const },
};

function useSoftIn(delay = 0) {
  const loop = useLoop();
  if (loop) {
    return {
      initial: softInBase.initial,
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.4, delay },
    };
  }
  return {
    ...softInBase,
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay },
  };
}

/** @deprecated Prefer useSoftIn — kept for spreads that still work when not looping */
const softIn = {
  initial: { opacity: 0, y: 8 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-20px" as const },
};

function Frame({ children }: { children: ReactNode }) {
  const loop = useLoop();
  return (
    <div
      className={
        loop
          ? "mx-auto flex h-[200px] w-full max-w-[300px] items-center justify-center md:h-[220px] md:max-w-[340px]"
          : "mx-auto flex h-[132px] w-full max-w-[220px] items-center justify-center"
      }
    >
      {children}
    </div>
  );
}

function IconMark({ children }: { children: ReactNode }) {
  return (
    <div className="flex size-11 items-center justify-center rounded-2xl border border-border/70 bg-muted/40 text-primary">
      {children}
    </div>
  );
}

/** Uptime — calm status pulse */
export function UptimeVisual({ point }: VisualProps) {
  const stat = extractStat(point.title) ?? extractStat(point.desc) ?? "99.99%";
  const soft = useSoftIn();
  return (
    <Frame>
      <motion.div {...soft} className="w-full space-y-3">
        <div className="flex items-center justify-between rounded-xl border border-border/70 bg-card px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Server className="size-4 text-primary" />
            <span className="text-xs text-muted-foreground">Status</span>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
            <motion.span
              className="size-1.5 rounded-full bg-primary"
              animate={{ opacity: [1, 0.35, 1] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            />
            Online
          </span>
        </div>
        <div className="text-center">
          <div className="text-2xl font-semibold tracking-tight text-foreground">{stat}</div>
          <div className="text-[11px] text-muted-foreground">uptime target</div>
        </div>
      </motion.div>
    </Frame>
  );
}

/** Speed — progress ring filling once */
export function SpeedVisual({ point }: VisualProps) {
  const stat = extractStat(point.desc) ?? extractStat(point.title) ?? "Fast";
  const loop = useLoop();
  return (
    <Frame>
      <div className="relative size-[112px]">
        <svg viewBox="0 0 96 96" className="size-full -rotate-90" aria-hidden>
          <circle cx="48" cy="48" r="38" fill="none" stroke="currentColor" strokeWidth="6" className="text-muted" />
          <motion.circle
            cx="48"
            cy="48"
            r="38"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            className="text-primary"
            strokeDasharray={239}
            initial={{ strokeDashoffset: 239 }}
            animate={loop ? { strokeDashoffset: [239, 48, 239] } : undefined}
            whileInView={!loop ? { strokeDashoffset: 48 } : undefined}
            viewport={!loop ? { once: true } : undefined}
            transition={
              loop
                ? { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
                : { duration: 1.1, ease: "easeOut" }
            }
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Zap className="mb-0.5 size-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">{stat}</span>
        </div>
      </div>
    </Frame>
  );
}

/** Security — lock settles in */
export function SecurityVisual(_props: VisualProps) {
  const soft = useSoftIn();
  const loop = useLoop();
  return (
    <Frame>
      <motion.div {...soft} className="flex flex-col items-center gap-3">
        <div className="relative flex size-16 items-center justify-center">
          <Shield className="absolute size-16 text-muted" strokeWidth={1} />
          <motion.div
            initial={{ y: -6, opacity: 0 }}
            animate={loop ? { y: [-6, 0, 0, -6], opacity: [0, 1, 1, 0] } : undefined}
            whileInView={!loop ? { y: 0, opacity: 1 } : undefined}
            viewport={!loop ? { once: true } : undefined}
            transition={
              loop
                ? { duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }
                : { delay: 0.2, duration: 0.4 }
            }
          >
            <Lock className="relative size-6 text-primary" />
          </motion.div>
        </div>
        <span className="text-xs text-muted-foreground">Protected by default</span>
      </motion.div>
    </Frame>
  );
}

/** Migration — simple A → B handoff */
export function MigrationVisual(_props: VisualProps) {
  const softLeft = useSoftIn();
  const softRight = useSoftIn(0.1);
  return (
    <Frame>
      <div className="flex w-full items-center justify-between gap-2 px-1">
        <motion.div {...softLeft} className="flex flex-col items-center gap-1.5">
          <IconMark>
            <Server className="size-4 text-muted-foreground" />
          </IconMark>
          <span className="text-[10px] text-muted-foreground">Old</span>
        </motion.div>

        <div className="relative h-px flex-1 bg-border">
          <motion.div
            className="absolute top-1/2 size-2 -translate-y-1/2 rounded-full bg-primary"
            initial={{ left: "0%", opacity: 0 }}
            animate={{ left: ["0%", "100%"], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
          <ArrowRight className="absolute left-1/2 top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 text-muted-foreground" />
        </div>

        <motion.div {...softRight} className="flex flex-col items-center gap-1.5">
          <IconMark>
            <Server className="size-4 text-primary" />
          </IconMark>
          <span className="text-[10px] font-medium text-foreground">Nisc</span>
        </motion.div>
      </div>
    </Frame>
  );
}

const TRUST_CLIENT_LOGOS = [
  { name: "Amarom", logo: "/clients/amarom2.png" },
  { name: "Medplus", logo: "/clients/medplus-logo.png" },
  { name: "Epitome", logo: "/clients/epitome-logo.png" },
  { name: "Ashut", logo: "/clients/ashut-logo.png" },
] as const;

/** Trust — client logos + count */
export function TrustVisual({ point }: VisualProps) {
  const stat = extractStat(point.title) ?? extractStat(point.desc) ?? "100+";
  const soft = useSoftIn();
  const loop = useLoop();
  return (
    <Frame>
      <motion.div {...soft} className="flex flex-col items-center gap-3">
        <div className="flex -space-x-2.5">
          {TRUST_CLIENT_LOGOS.map((client, i) => (
            <motion.div
              key={client.name}
              className="flex size-9 items-center justify-center overflow-hidden rounded-full border-2 border-background bg-card shadow-sm"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={loop ? { opacity: 1, scale: [1, 1.06, 1] } : undefined}
              whileInView={!loop ? { opacity: 1, scale: 1 } : undefined}
              viewport={!loop ? { once: true } : undefined}
              transition={
                loop
                  ? {
                      opacity: { duration: 0.35, delay: i * 0.08 },
                      scale: { duration: 2.2, repeat: Infinity, delay: 0.4 + i * 0.08, ease: "easeInOut" },
                    }
                  : { delay: i * 0.08, duration: 0.35 }
              }
            >
              <img
                src={client.logo}
                alt={client.name}
                className="size-6 object-contain"
                loading="lazy"
              />
            </motion.div>
          ))}
        </div>
        <div className="text-center">
          <div className="text-2xl font-semibold tracking-tight text-foreground">{stat}</div>
          <div className="text-[11px] text-muted-foreground">clients we support</div>
        </div>
      </motion.div>
    </Frame>
  );
}

/** Inbox — deliverability / spam filter */
export function InboxVisual({ point }: VisualProps) {
  const stat = extractStat(point.title) ?? extractStat(point.desc);
  const soft = useSoftIn();
  const loop = useLoop();
  return (
    <Frame>
      <motion.div {...soft} className="w-full rounded-xl border border-border/70 bg-card px-3 py-2.5">
        <div className="mb-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Inbox className="size-3.5 text-primary" />
          Inbox health
        </div>
        <ul className="space-y-1.5">
          {[
            { label: "Spam blocked" },
            { label: "Inbox delivery" },
            { label: stat ? `${stat} catch rate` : "Clean reputation" },
          ].map((row, i) => (
            <motion.li
              key={row.label}
              className="flex items-center justify-between text-xs"
              initial={{ opacity: 0, x: -6 }}
              animate={loop ? { opacity: [0, 1, 1, 0], x: [-6, 0, 0, -6] } : undefined}
              whileInView={!loop ? { opacity: 1, x: 0 } : undefined}
              viewport={!loop ? { once: true } : undefined}
              transition={
                loop
                  ? { duration: 3.2, repeat: Infinity, delay: i * 0.35, ease: "easeInOut" }
                  : { delay: 0.1 + i * 0.1 }
              }
            >
              <span className="text-foreground">{row.label}</span>
              <Check className="size-3.5 text-primary" />
            </motion.li>
          ))}
        </ul>
      </motion.div>
    </Frame>
  );
}

/** Pricing — included checklist */
export function PricingVisual(_props: VisualProps) {
  const items = ["Setup", "SSL", "Support"];
  const soft = useSoftIn();
  const loop = useLoop();
  return (
    <Frame>
      <motion.div {...soft} className="w-full rounded-xl border border-border/70 bg-card px-3 py-2.5">
        <div className="mb-2 text-[11px] font-medium text-muted-foreground">What you get</div>
        <ul className="space-y-1.5">
          {items.map((item, i) => (
            <motion.li
              key={item}
              className="flex items-center justify-between text-xs"
              initial={{ opacity: 0, x: -6 }}
              animate={loop ? { opacity: [0, 1, 1, 0], x: [-6, 0, 0, -6] } : undefined}
              whileInView={!loop ? { opacity: 1, x: 0 } : undefined}
              viewport={!loop ? { once: true } : undefined}
              transition={
                loop
                  ? { duration: 3.2, repeat: Infinity, delay: i * 0.35, ease: "easeInOut" }
                  : { delay: 0.1 + i * 0.1 }
              }
            >
              <span className="text-foreground">{item}</span>
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Check className="size-3 text-primary" />
                Included
              </span>
            </motion.li>
          ))}
        </ul>
      </motion.div>
    </Frame>
  );
}

/** Growth — rank climbing bars */
export function GrowthVisual(_props: VisualProps) {
  const loop = useLoop();
  const bars = loop ? [48, 78, 110, 150] : [28, 48, 68, 92];
  return (
    <Frame>
      <div
        className={
          loop
            ? "flex h-[160px] w-full items-end justify-center gap-3 px-2"
            : "flex h-[96px] w-full items-end justify-center gap-2.5 px-4"
        }
      >
        {bars.map((h, i) => (
          <motion.div
            key={i}
            className={loop ? "w-9 rounded-t-md bg-primary/15" : "w-7 rounded-t-md bg-primary/15"}
            initial={{ height: 8 }}
            animate={loop ? { height: [8, h, h, 8] } : undefined}
            whileInView={!loop ? { height: h } : undefined}
            viewport={!loop ? { once: true } : undefined}
            transition={
              loop
                ? { duration: 3.2, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" }
                : { duration: 0.55, delay: i * 0.1, ease: "easeOut" }
            }
          >
            <div
              className="h-full w-full rounded-t-md bg-primary"
              style={{ opacity: 0.35 + i * 0.18 }}
            />
          </motion.div>
        ))}
      </div>
    </Frame>
  );
}

type SupportPhase = "idle" | "user" | "typing" | "reply";

/** Support — looping chat exchange */
export function SupportVisual(_props: VisualProps) {
  const [phase, setPhase] = useState<SupportPhase>("idle");

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        timer = setTimeout(resolve, ms);
      });

    const loop = async () => {
      while (!cancelled) {
        setPhase("idle");
        await wait(500);
        if (cancelled) break;
        setPhase("user");
        await wait(900);
        if (cancelled) break;
        setPhase("typing");
        await wait(1100);
        if (cancelled) break;
        setPhase("reply");
        await wait(2400);
      }
    };

    void loop();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  const showUser = phase === "user" || phase === "typing" || phase === "reply";
  const showTyping = phase === "typing";
  const showReply = phase === "reply";

  return (
    <Frame>
      <div className="flex h-full w-full flex-col justify-end gap-2 px-1">
        <div className="flex min-h-[88px] flex-col justify-end gap-2">
          <AnimatePresence>
            {showUser ? (
              <motion.div
                key="user"
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.96 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-primary px-2.5 py-1.5 text-[11px] text-primary-foreground"
              >
                Need a quick hand?
              </motion.div>
            ) : null}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {showTyping ? (
              <motion.div
                key="typing"
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.96 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="mr-auto flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-border/70 bg-card px-3 py-2"
              >
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="size-1.5 rounded-full bg-muted-foreground/70"
                    animate={{ opacity: [0.35, 1, 0.35], y: [0, -2, 0] }}
                    transition={{
                      duration: 0.9,
                      repeat: Infinity,
                      delay: i * 0.15,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </motion.div>
            ) : null}

            {showReply ? (
              <motion.div
                key="reply"
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.96 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                className="mr-auto flex max-w-[90%] items-start gap-1.5 rounded-2xl rounded-bl-md border border-border/70 bg-card px-2.5 py-1.5 text-[11px] text-foreground"
              >
                <MessageCircle className="mt-0.5 size-3 shrink-0 text-primary" />
                We are on it.
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </Frame>
  );
}

/** Deploy — stacked step carousel (same motion pattern as home “full journey” bento) */
const DEPLOY_STEPS = [
  { id: "provision", title: "Provision server", icon: Server },
  { id: "configure", title: "Configure stack", icon: Settings2 },
  { id: "secure", title: "Secure & SSL", icon: ShieldCheck },
  { id: "launch", title: "Go live", icon: Zap },
  { id: "ready", title: "Ready to use", icon: Check },
] as const;

export function DeployVisual(_props: VisualProps) {
  const loop = useLoop();
  const [visible, setVisible] = useState(() => DEPLOY_STEPS.slice(0, 3));
  const [pointer, setPointer] = useState(2);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible((prev) => {
        const nextIndex = (pointer + 1) % DEPLOY_STEPS.length;
        setPointer(nextIndex);
        return [...prev.slice(1), DEPLOY_STEPS[nextIndex]!];
      });
    }, 1800);
    return () => clearInterval(interval);
  }, [pointer]);

  const rowH = loop ? 52 : 40;

  return (
    <Frame>
      <div className={loop ? "relative h-[168px] w-full overflow-hidden" : "relative h-[120px] w-full overflow-hidden"}>
        <AnimatePresence initial={false}>
          {visible.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ y: 130, opacity: 0, scale: 0.92 }}
              animate={{
                y: i * rowH,
                scale: i === 1 ? 1 : 0.92,
                opacity: i === 1 ? 1 : 0.45,
              }}
              exit={{ y: -56, opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.55, ease: "easeInOut" }}
              className="absolute inset-x-0 flex items-center justify-between rounded-xl border border-border/70 bg-card px-3 py-2.5 text-foreground shadow-sm"
            >
              <div className="flex items-center gap-2">
                <item.icon className="size-3.5 shrink-0 text-primary" />
                <span className="text-xs font-medium">{item.title}</span>
              </div>
              <Check className="size-3.5 shrink-0 text-primary" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Frame>
  );
}

/** Reporting — simple chart card */
export function ReportingVisual(_props: VisualProps) {
  const bars = [40, 62, 48, 78, 66, 88];
  const soft = useSoftIn();
  const loop = useLoop();
  return (
    <Frame>
      <motion.div {...soft} className="w-full rounded-xl border border-border/70 bg-card p-3">
        <div className="mb-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <BarChart3 className="size-3.5 text-primary" />
          Monthly report
        </div>
        <div className="flex h-14 items-end gap-1.5">
          {bars.map((h, i) => (
            <motion.div
              key={i}
              className="flex-1 rounded-sm bg-primary/70"
              initial={{ height: 6 }}
              animate={loop ? { height: ["6%", `${h}%`, `${h}%`, "6%"] } : undefined}
              whileInView={!loop ? { height: `${h}%` } : undefined}
              viewport={!loop ? { once: true } : undefined}
              transition={
                loop
                  ? { duration: 3.2, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" }
                  : { duration: 0.45, delay: i * 0.05 }
              }
            />
          ))}
        </div>
      </motion.div>
    </Frame>
  );
}

/** Results — target progress */
export function ResultsVisual({ point }: VisualProps) {
  const stat = extractStat(point.title) ?? extractStat(point.desc) ?? "30 days";
  const soft = useSoftIn();
  const loop = useLoop();
  return (
    <Frame>
      <motion.div {...soft} className="flex flex-col items-center gap-3">
        <IconMark>
          <Sparkles className="size-4" />
        </IconMark>
        <div className="w-40">
          <div className="mb-1.5 flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium text-foreground">{stat}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: "0%" }}
              animate={loop ? { width: ["0%", "72%", "72%", "0%"] } : undefined}
              whileInView={!loop ? { width: "72%" } : undefined}
              viewport={!loop ? { once: true } : undefined}
              transition={
                loop
                  ? { duration: 3.2, repeat: Infinity, ease: "easeInOut" }
                  : { duration: 0.9, ease: "easeOut" }
              }
            />
          </div>
        </div>
      </motion.div>
    </Frame>
  );
}

/** Brand — palette swatches */
export function BrandVisual(_props: VisualProps) {
  const soft = useSoftIn();
  const loop = useLoop();
  return (
    <Frame>
      <motion.div {...soft} className="flex flex-col items-center gap-3">
        <IconMark>
          <Palette className="size-4" />
        </IconMark>
        <div className="flex gap-2">
          {["bg-primary", "bg-foreground/80", "bg-muted-foreground/40", "bg-muted"].map((tone, i) => (
            <motion.span
              key={tone}
              className={`size-7 rounded-full border border-border/60 ${tone}`}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={loop ? { opacity: 1, scale: [1, 1.08, 1] } : undefined}
              whileInView={!loop ? { opacity: 1, scale: 1 } : undefined}
              viewport={!loop ? { once: true } : undefined}
              transition={
                loop
                  ? {
                      opacity: { duration: 0.3, delay: i * 0.08 },
                      scale: { duration: 2.2, repeat: Infinity, delay: 0.35 + i * 0.08, ease: "easeInOut" },
                    }
                  : { delay: i * 0.08, duration: 0.3 }
              }
            />
          ))}
        </div>
      </motion.div>
    </Frame>
  );
}

/** Clarity — search → clear result */
export function ClarityVisual(_props: VisualProps) {
  const soft = useSoftIn();
  const loop = useLoop();
  return (
    <Frame>
      <motion.div {...soft} className="w-full space-y-2">
        <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-card px-3 py-2 text-xs text-muted-foreground">
          <Search className="size-3.5 text-primary" />
          yourbrand.co.ke
        </div>
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={loop ? { opacity: [0, 1, 1, 0], y: [4, 0, 0, 4] } : undefined}
          whileInView={!loop ? { opacity: 1, y: 0 } : undefined}
          viewport={!loop ? { once: true } : undefined}
          transition={
            loop
              ? { duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.25 }
              : { delay: 0.25 }
          }
          className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-medium text-foreground"
        >
          <Check className="size-3.5 text-primary" />
          Available — clear next step
        </motion.div>
      </motion.div>
    </Frame>
  );
}

/** Local market — pin drops on a soft map */
export function LocalMarketVisual(_props: VisualProps) {
  const loop = useLoop();
  return (
    <Frame>
      <div className="relative flex size-[112px] items-center justify-center">
        <motion.div
          className="absolute size-20 rounded-full border border-border/60 bg-muted/30"
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute size-12 rounded-full border border-primary/25 bg-primary/5"
          animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          initial={{ y: -18, opacity: 0 }}
          animate={loop ? { y: [-18, 0, 0, -18], opacity: [0, 1, 1, 0] } : undefined}
          whileInView={!loop ? { y: 0, opacity: 1 } : undefined}
          viewport={!loop ? { once: true } : undefined}
          transition={
            loop
              ? { duration: 3.2, repeat: Infinity, ease: "easeInOut" }
              : { type: "spring", stiffness: 280, damping: 18 }
          }
        >
          <MapPin className="size-8 text-primary" fill="currentColor" fillOpacity={0.15} />
        </motion.div>
      </div>
    </Frame>
  );
}

/** Strategy — research lines resolve into a mark */
export function StrategyVisual(_props: VisualProps) {
  const soft = useSoftIn();
  const loop = useLoop();
  return (
    <Frame>
      <motion.div {...soft} className="w-full space-y-2">
        {["Audience", "Competitors", "Position"].map((label, i) => (
          <motion.div
            key={label}
            className="flex items-center gap-2 rounded-lg border border-border/70 bg-card px-2.5 py-1.5 text-xs"
            initial={{ opacity: 0, x: -8 }}
            animate={loop ? { opacity: 1, x: 0 } : undefined}
            whileInView={!loop ? { opacity: 1, x: 0 } : undefined}
            viewport={!loop ? { once: true } : undefined}
            transition={{ delay: i * 0.12 }}
          >
            <motion.div
              className="h-1 flex-1 overflow-hidden rounded-full bg-muted"
              initial={{ opacity: 0.5 }}
              animate={loop ? { opacity: 1 } : undefined}
              whileInView={!loop ? { opacity: 1 } : undefined}
              viewport={!loop ? { once: true } : undefined}
            >
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: "0%" }}
                animate={
                  loop ? { width: ["0%", `${55 + i * 15}%`, `${55 + i * 15}%`, "0%"] } : undefined
                }
                whileInView={!loop ? { width: `${55 + i * 15}%` } : undefined}
                viewport={!loop ? { once: true } : undefined}
                transition={
                  loop
                    ? { duration: 3.2, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" }
                    : { delay: 0.15 + i * 0.12, duration: 0.6 }
                }
              />
            </motion.div>
            <span className="w-16 text-right text-[10px] text-muted-foreground">{label}</span>
          </motion.div>
        ))}
      </motion.div>
    </Frame>
  );
}

/** Assets — files stack into a folder */
export function AssetsVisual(_props: VisualProps) {
  const files = ["Logo.svg", "Guide.pdf", "Social.zip"];
  const soft = useSoftIn();
  const loop = useLoop();
  return (
    <Frame>
      <div className="relative w-full">
        <motion.div {...soft} className="mb-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <FolderOpen className="size-3.5 text-primary" />
          Brand kit
        </motion.div>
        <div className="space-y-1.5">
          {files.map((file, i) => (
            <motion.div
              key={file}
              className="flex items-center gap-2 rounded-lg border border-border/70 bg-card px-2.5 py-1.5 text-xs text-foreground"
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={
                loop ? { opacity: [0, 1, 1, 0], y: [10, 0, 0, 10], scale: [0.96, 1, 1, 0.96] } : undefined
              }
              whileInView={!loop ? { opacity: 1, y: 0, scale: 1 } : undefined}
              viewport={!loop ? { once: true } : undefined}
              transition={
                loop
                  ? { duration: 3.2, repeat: Infinity, delay: i * 0.35, ease: "easeInOut" }
                  : { delay: i * 0.14, duration: 0.35 }
              }
            >
              <FileText className="size-3.5 text-primary" />
              {file}
            </motion.div>
          ))}
        </div>
      </div>
    </Frame>
  );
}

/** Craft — pen draws a mark */
export function CraftVisual(_props: VisualProps) {
  const loop = useLoop();
  return (
    <Frame>
      <div className="relative size-[112px]">
        <svg viewBox="0 0 96 96" className="size-full" aria-hidden>
          <motion.path
            d="M24 62 C36 28, 60 28, 72 62"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            className="text-primary"
            initial={{ pathLength: 0, opacity: 0.4 }}
            animate={loop ? { pathLength: [0, 1, 1, 0], opacity: [0.4, 1, 1, 0.4] } : undefined}
            whileInView={!loop ? { pathLength: 1, opacity: 1 } : undefined}
            viewport={!loop ? { once: true } : undefined}
            transition={
              loop
                ? { duration: 3.2, repeat: Infinity, ease: "easeInOut" }
                : { duration: 1.2, ease: "easeInOut" }
            }
          />
          <motion.circle
            cx="48"
            cy="40"
            r="4"
            className="fill-primary"
            initial={{ scale: 0, opacity: 0 }}
            animate={loop ? { scale: [0, 1, 1, 0], opacity: [0, 1, 1, 0] } : undefined}
            whileInView={!loop ? { scale: 1, opacity: 1 } : undefined}
            viewport={!loop ? { once: true } : undefined}
            transition={
              loop
                ? { duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.15 }
                : { delay: 0.9, duration: 0.3 }
            }
          />
        </svg>
        <motion.div
          className="absolute right-3 top-4 text-primary"
          initial={{ x: 8, y: -8, opacity: 0 }}
          animate={loop ? { x: [8, 0, 0, 8], y: [-8, 0, 0, -8], opacity: [0, 1, 1, 0] } : undefined}
          whileInView={!loop ? { x: 0, y: 0, opacity: 1 } : undefined}
          viewport={!loop ? { once: true } : undefined}
          transition={
            loop
              ? { duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.1 }
              : { delay: 0.35, duration: 0.4 }
          }
        >
          <PenTool className="size-4" />
        </motion.div>
      </div>
    </Frame>
  );
}

/** Process — timeline steps light up */
export function ProcessVisual({ point }: VisualProps) {
  const stat = extractStat(point.desc) ?? extractStat(point.title) ?? "7 days";
  const steps = ["Brief", "Design", "Deliver"];
  const loop = useLoop();
  return (
    <Frame>
      <div className="w-full space-y-3">
        <div className="flex items-center justify-between px-1">
          {steps.map((step, i) => (
            <div key={step} className="flex flex-1 items-center">
              <motion.div
                className="flex size-7 items-center justify-center rounded-full border border-border/70 bg-card text-[10px] font-medium text-foreground"
                initial={{ scale: 0.8, opacity: 0.4 }}
                animate={loop ? { scale: [0.8, 1, 1, 0.8], opacity: [0.4, 1, 1, 0.4] } : undefined}
                whileInView={!loop ? { scale: 1, opacity: 1 } : undefined}
                viewport={!loop ? { once: true } : undefined}
                transition={
                  loop
                    ? { duration: 3.2, repeat: Infinity, delay: i * 0.55, ease: "easeInOut" }
                    : { delay: i * 0.2 }
                }
              >
                {i + 1}
              </motion.div>
              {i < steps.length - 1 ? (
                <motion.div
                  className="mx-1 h-px flex-1 bg-primary/40"
                  initial={{ scaleX: 0 }}
                  animate={loop ? { scaleX: [0, 1, 1, 0] } : undefined}
                  whileInView={!loop ? { scaleX: 1 } : undefined}
                  viewport={!loop ? { once: true } : undefined}
                  transition={
                    loop
                      ? { duration: 3.2, repeat: Infinity, delay: 0.15 + i * 0.55, ease: "easeInOut" }
                      : { delay: 0.15 + i * 0.2, duration: 0.35 }
                  }
                  style={{ transformOrigin: "left" }}
                />
              ) : null}
            </div>
          ))}
        </div>
        <div className="text-center text-[11px] text-muted-foreground">
          Typical delivery · <span className="font-medium text-foreground">{stat}</span>
        </div>
      </div>
    </Frame>
  );
}

/** Ownership — key unlocks transfer */
export function OwnershipVisual(_props: VisualProps) {
  const soft = useSoftIn();
  return (
    <Frame>
      <motion.div {...soft} className="flex flex-col items-center gap-3">
        <motion.div
          className="flex size-14 items-center justify-center rounded-2xl border border-border/70 bg-card"
          animate={{ rotate: [0, -8, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.2 }}
        >
          <KeyRound className="size-6 text-primary" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.25 }}
          className="flex items-center gap-1.5 text-xs font-medium text-foreground"
        >
          <Check className="size-3.5 text-primary" />
          Full ownership transfer
        </motion.div>
      </motion.div>
    </Frame>
  );
}

/** Engagement — soft reaction pulses */
export function EngagementVisual(_props: VisualProps) {
  const reactions = [
    { key: "chat", icon: MessageCircle },
    { key: "spark", icon: Sparkles },
    { key: "trend", icon: TrendingUp },
  ] as const;

  return (
    <Frame>
      <div className="flex items-end justify-center gap-3">
        {reactions.map(({ key, icon: Icon }, i) => (
          <motion.div
            key={key}
            className="flex size-11 items-center justify-center rounded-2xl border border-border/70 bg-card"
            initial={{ y: 12, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.12 }}
          >
            <motion.span
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.25, ease: "easeInOut" }}
            >
              <Icon className="size-4 text-primary" />
            </motion.span>
          </motion.div>
        ))}
      </div>
    </Frame>
  );
}

/** Approval — stamp lands */
export function ApprovalVisual(_props: VisualProps) {
  const loop = useLoop();
  return (
    <Frame>
      <div className="relative flex size-[112px] items-center justify-center">
        <div className="rounded-xl border border-dashed border-border px-4 py-3 text-center">
          <div className="text-[10px] text-muted-foreground">Draft post</div>
          <div className="mt-1 h-1.5 w-16 rounded-full bg-muted" />
          <div className="mt-1 h-1.5 w-12 rounded-full bg-muted" />
        </div>
        <motion.div
          className="absolute -right-1 bottom-3 flex items-center gap-1 rounded-full border border-primary/30 bg-primary px-2.5 py-1 text-[10px] font-semibold text-primary-foreground shadow-sm"
          initial={{ scale: 1.4, opacity: 0, rotate: -12 }}
          animate={
            loop
              ? { scale: [1.4, 1, 1, 1.4], opacity: [0, 1, 1, 0], rotate: [-12, -6, -6, -12] }
              : undefined
          }
          whileInView={!loop ? { scale: 1, opacity: 1, rotate: -6 } : undefined}
          viewport={!loop ? { once: true } : undefined}
          transition={
            loop
              ? { duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.25 }
              : { type: "spring", stiffness: 260, damping: 16, delay: 0.25 }
          }
        >
          <Check className="size-3" />
          Approved
        </motion.div>
      </div>
    </Frame>
  );
}

/** Targeting — focus ring tightens */
export function TargetingVisual(_props: VisualProps) {
  const loop = useLoop();
  return (
    <Frame>
      <div className="relative flex size-[112px] items-center justify-center">
        {[96, 68, 40].map((size, i) => (
          <motion.div
            key={size}
            className="absolute rounded-full border border-primary/25"
            style={{ width: size, height: size }}
            initial={{ scale: 1.15, opacity: 0 }}
            animate={
              loop
                ? { scale: [1.15, 1, 1.05, 1], opacity: [0, 1, 1, 1] }
                : undefined
            }
            whileInView={!loop ? { scale: 1, opacity: 1 } : undefined}
            viewport={!loop ? { once: true } : undefined}
            transition={
              loop
                ? {
                    scale: { duration: 2.4, repeat: Infinity, delay: i * 0.12, ease: "easeInOut" },
                    opacity: { duration: 0.4, delay: i * 0.12 },
                  }
                : { delay: i * 0.12, duration: 0.4 }
            }
          />
        ))}
        <Crosshair className="relative size-6 text-primary" />
      </div>
    </Frame>
  );
}

/** Tracking — events tick in */
export function TrackingVisual(_props: VisualProps) {
  const events = ["Page view", "Add to cart", "Purchase"];
  return (
    <Frame>
      <div className="w-full space-y-1.5">
        {events.map((event, i) => (
          <motion.div
            key={event}
            className="flex items-center gap-2 rounded-lg border border-border/70 bg-card px-2.5 py-1.5 text-xs"
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.18 }}
          >
            <motion.span
              className="size-1.5 rounded-full bg-primary"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.2 }}
            />
            <span className="text-foreground">{event}</span>
            <span className="ml-auto text-[10px] text-muted-foreground">tracked</span>
          </motion.div>
        ))}
      </div>
    </Frame>
  );
}

/** Creative — A/B flip */
export function CreativeVisual(_props: VisualProps) {
  const [variant, setVariant] = useState<"A" | "B">("A");

  useEffect(() => {
    const id = setInterval(() => {
      setVariant((v) => (v === "A" ? "B" : "A"));
    }, 1800);
    return () => clearInterval(id);
  }, []);

  return (
    <Frame>
      <div className="w-full">
        <div className="mb-2 flex gap-1.5">
          {(["A", "B"] as const).map((v) => (
            <span
              key={v}
              className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${
                variant === v
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              Variant {v}
            </span>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={variant}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="rounded-xl border border-border/70 bg-card p-3"
          >
            <div className="mb-2 h-8 rounded-md bg-muted/70" />
            <div className="h-1.5 w-2/3 rounded-full bg-muted" />
            <div className="mt-1.5 h-1.5 w-1/2 rounded-full bg-muted" />
          </motion.div>
        </AnimatePresence>
      </div>
    </Frame>
  );
}

/** Mobile — phone frame tap */
export function MobileVisual(_props: VisualProps) {
  const soft = useSoftIn();
  return (
    <Frame>
      <motion.div
        {...soft}
        className="relative h-[108px] w-[64px] rounded-[1.1rem] border-2 border-border bg-card p-1.5 shadow-sm"
      >
        <div className="mx-auto mb-1.5 h-1 w-8 rounded-full bg-muted" />
        <div className="space-y-1.5">
          <div className="h-6 rounded-md bg-muted/80" />
          <div className="h-1.5 w-full rounded-full bg-muted" />
          <div className="h-1.5 w-3/4 rounded-full bg-muted" />
          <motion.div
            className="mt-2 rounded-md bg-primary py-1 text-center text-[8px] font-medium text-primary-foreground"
            animate={{ scale: [1, 0.96, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          >
            Buy
          </motion.div>
        </div>
        <Smartphone className="absolute -right-3 -bottom-1 size-4 text-muted-foreground/50" />
      </motion.div>
    </Frame>
  );
}

/** Inventory — stock levels */
export function InventoryVisual(_props: VisualProps) {
  const rows = [
    { name: "SKU-01", level: 82 },
    { name: "SKU-02", level: 45 },
    { name: "SKU-03", level: 18 },
  ];
  const loop = useLoop();
  return (
    <Frame>
      <div className="w-full space-y-2">
        {rows.map((row, i) => (
          <div key={row.name} className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground">{row.name}</span>
              <span className="text-foreground">{row.level}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: "0%" }}
                animate={
                  loop
                    ? { width: ["0%", `${row.level}%`, `${row.level}%`, "0%"] }
                    : undefined
                }
                whileInView={!loop ? { width: `${row.level}%` } : undefined}
                viewport={!loop ? { once: true } : undefined}
                transition={
                  loop
                    ? { duration: 3.2, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" }
                    : { delay: i * 0.12, duration: 0.55 }
                }
              />
            </div>
          </div>
        ))}
      </div>
    </Frame>
  );
}

/** Payment — settle confirmation */
export function PaymentVisual(_props: VisualProps) {
  const soft = useSoftIn();
  const loop = useLoop();
  return (
    <Frame>
      <motion.div {...soft} className="w-full rounded-xl border border-border/70 bg-card px-3 py-3 text-center">
        <Package className="mx-auto mb-2 size-5 text-primary" />
        <div className="text-xs font-medium text-foreground">Payment settled</div>
        <motion.div
          className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={loop ? { opacity: [0, 1, 1, 0], scale: [0.9, 1, 1, 0.9] } : undefined}
          whileInView={!loop ? { opacity: 1, scale: 1 } : undefined}
          viewport={!loop ? { once: true } : undefined}
          transition={
            loop
              ? { duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }
              : { delay: 0.3 }
          }
        >
          <Check className="size-3" />
          To your account
        </motion.div>
      </motion.div>
    </Frame>
  );
}

/** Automation — nodes connect */
export function AutomationVisual(_props: VisualProps) {
  const nodes = ["Join", "Wait", "Send"];
  const loop = useLoop();
  return (
    <Frame>
      <div className="flex w-full items-center justify-between gap-1 px-1">
        {nodes.map((node, i) => (
          <div key={node} className="flex flex-1 items-center">
            <motion.div
              className="rounded-lg border border-border/70 bg-card px-2 py-1.5 text-[10px] font-medium text-foreground"
              initial={{ opacity: 0, y: 6 }}
              animate={loop ? { opacity: [0, 1, 1, 0], y: [6, 0, 0, 6] } : undefined}
              whileInView={!loop ? { opacity: 1, y: 0 } : undefined}
              viewport={!loop ? { once: true } : undefined}
              transition={
                loop
                  ? { duration: 3.2, repeat: Infinity, delay: i * 0.55, ease: "easeInOut" }
                  : { delay: i * 0.18 }
              }
            >
              {node}
            </motion.div>
            {i < nodes.length - 1 ? (
              <motion.div
                className="mx-0.5 h-px flex-1 bg-primary"
                initial={{ scaleX: 0 }}
                animate={loop ? { scaleX: [0, 1, 1, 0] } : undefined}
                whileInView={!loop ? { scaleX: 1 } : undefined}
                viewport={!loop ? { once: true } : undefined}
                transition={
                  loop
                    ? { duration: 3.2, repeat: Infinity, delay: 0.2 + i * 0.55, ease: "easeInOut" }
                    : { delay: 0.2 + i * 0.18, duration: 0.35 }
                }
                style={{ transformOrigin: "left" }}
              />
            ) : null}
          </div>
        ))}
      </div>
    </Frame>
  );
}

/** Segments — list splits */
export function SegmentsVisual(_props: VisualProps) {
  const chips = ["Buyers", "Local", "New"];
  const soft = useSoftIn();
  const loop = useLoop();
  return (
    <Frame>
      <motion.div {...soft} className="w-full space-y-2">
        <div className="rounded-lg border border-border/70 bg-muted/40 px-2.5 py-1.5 text-[10px] text-muted-foreground">
          Full list · 12,400
        </div>
        <div className="flex flex-wrap gap-1.5">
          {chips.map((chip, i) => (
            <motion.span
              key={chip}
              className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-[10px] font-medium text-foreground"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={loop ? { opacity: 1, scale: [1, 1.06, 1] } : undefined}
              whileInView={!loop ? { opacity: 1, scale: 1 } : undefined}
              viewport={!loop ? { once: true } : undefined}
              transition={
                loop
                  ? {
                      opacity: { duration: 0.3, delay: 0.15 + i * 0.12 },
                      scale: { duration: 2.2, repeat: Infinity, delay: 0.4 + i * 0.12, ease: "easeInOut" },
                    }
                  : { delay: 0.15 + i * 0.12 }
              }
            >
              {chip}
            </motion.span>
          ))}
        </div>
      </motion.div>
    </Frame>
  );
}

/** Typing — subject line types out */
export function TypingVisual(_props: VisualProps) {
  const full = "Your offer is ready";
  const [text, setText] = useState("");

  useEffect(() => {
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      if (i <= full.length) {
        setText(full.slice(0, i));
        i += 1;
        timer = setTimeout(tick, 70);
      } else {
        timer = setTimeout(() => {
          i = 0;
          setText("");
          timer = setTimeout(tick, 400);
        }, 1600);
      }
    };

    timer = setTimeout(tick, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  return (
    <Frame>
      <div className="w-full rounded-xl border border-border/70 bg-card px-3 py-2.5">
        <div className="mb-1.5 text-[10px] text-muted-foreground">Subject</div>
        <div className="min-h-[1.25rem] text-xs font-medium text-foreground">
          {text}
          <motion.span
            className="ml-0.5 inline-block h-3 w-px bg-primary align-middle"
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
        </div>
      </div>
    </Frame>
  );
}

/** Bot — AI reply card */
export function BotVisual(_props: VisualProps) {
  const soft = useSoftIn();
  return (
    <Frame>
      <div className="w-full space-y-2">
        <motion.div
          {...soft}
          className="ml-auto max-w-[80%] rounded-2xl rounded-br-md bg-muted px-2.5 py-1.5 text-[11px] text-foreground"
        >
          Do you deliver to Westlands?
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: [0, 1, 1, 1, 0], y: [6, 0, 0, 0, -4] }}
          transition={{ duration: 4.5, repeat: Infinity, times: [0, 0.15, 0.7, 0.85, 1] }}
          className="mr-auto max-w-[90%] rounded-2xl rounded-bl-md border border-primary/20 bg-primary/5 px-2.5 py-1.5 text-[11px] text-foreground"
        >
          Yes — same-day available. Book a slot?
        </motion.div>
      </div>
    </Frame>
  );
}

/** Integrate — links connect */
export function IntegrateVisual(_props: VisualProps) {
  const tools = ["CRM", "Cal", "Pay"];
  const loop = useLoop();
  return (
    <Frame>
      <div className="flex w-full flex-col items-center gap-3">
        <div className="flex gap-2">
          {tools.map((tool, i) => (
            <motion.div
              key={tool}
              className="rounded-lg border border-border/70 bg-card px-2.5 py-1.5 text-[10px] font-medium text-foreground"
              initial={{ opacity: 0, y: 8 }}
              animate={loop ? { opacity: [0, 1, 1, 0], y: [8, 0, 0, 8] } : undefined}
              whileInView={!loop ? { opacity: 1, y: 0 } : undefined}
              viewport={!loop ? { once: true } : undefined}
              transition={
                loop
                  ? { duration: 3.2, repeat: Infinity, delay: i * 0.35, ease: "easeInOut" }
                  : { delay: i * 0.1 }
              }
            >
              {tool}
            </motion.div>
          ))}
        </div>
        <motion.div
          className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={loop ? { opacity: [0, 1, 1, 0] } : undefined}
          whileInView={!loop ? { opacity: 1 } : undefined}
          viewport={!loop ? { once: true } : undefined}
          transition={
            loop
              ? { duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.35 }
              : { delay: 0.35 }
          }
        >
          <Link2 className="size-3.5 text-primary" />
          Connected
        </motion.div>
      </div>
    </Frame>
  );
}

/** Code — lines build */
export function CodeVisual(_props: VisualProps) {
  const lines = ["w-3/4", "w-full", "w-2/3", "w-5/6"];
  const loop = useLoop();
  return (
    <Frame>
      <div className="w-full rounded-xl border border-border/70 bg-card p-3 font-mono">
        <div className="mb-2 text-[10px] text-muted-foreground">custom.tsx</div>
        <div className="space-y-1.5">
          {lines.map((w, i) => (
            <motion.div
              key={i}
              className={`h-1.5 ${w} rounded-full bg-primary/70`}
              initial={{ scaleX: 0, opacity: 0 }}
              animate={loop ? { scaleX: [0, 1, 1, 0], opacity: [0, 1, 1, 0] } : undefined}
              whileInView={!loop ? { scaleX: 1, opacity: 1 } : undefined}
              viewport={!loop ? { once: true } : undefined}
              transition={
                loop
                  ? { duration: 3.2, repeat: Infinity, delay: i * 0.35, ease: "easeInOut" }
                  : { delay: i * 0.12, duration: 0.35 }
              }
              style={{ transformOrigin: "left" }}
            />
          ))}
        </div>
      </div>
    </Frame>
  );
}

/** Funnel — stages narrow */
export function FunnelVisual(_props: VisualProps) {
  const stages = [
    { label: "Visit", w: "w-full" },
    { label: "Engage", w: "w-4/5" },
    { label: "Convert", w: "w-3/5" },
  ];
  const loop = useLoop();
  return (
    <Frame>
      <div className="flex w-full flex-col items-center gap-1.5">
        {stages.map((stage, i) => (
          <motion.div
            key={stage.label}
            className={`${stage.w} rounded-md bg-primary/15 px-2 py-1.5 text-center text-[10px] font-medium text-foreground`}
            initial={{ opacity: 0, scaleX: 0.7 }}
            animate={loop ? { opacity: [0, 1, 1, 0], scaleX: [0.7, 1, 1, 0.7] } : undefined}
            whileInView={!loop ? { opacity: 1, scaleX: 1 } : undefined}
            viewport={!loop ? { once: true } : undefined}
            transition={
              loop
                ? { duration: 3.2, repeat: Infinity, delay: i * 0.35, ease: "easeInOut" }
                : { delay: i * 0.15 }
            }
          >
            <span className="inline-block rounded bg-primary/20 px-1.5 py-0.5">{stage.label}</span>
          </motion.div>
        ))}
      </div>
    </Frame>
  );
}

/** Calendar — week fills in */
export function CalendarVisual(_props: VisualProps) {
  const loop = useLoop();
  return (
    <Frame>
      <div className="w-full rounded-xl border border-border/70 bg-card p-2.5">
        <div className="mb-2 text-[10px] text-muted-foreground">Content week</div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <motion.div
              key={i}
              className="flex aspect-square items-center justify-center rounded-md bg-muted text-[9px] text-muted-foreground"
              initial={{ opacity: 0.3 }}
              animate={loop ? { opacity: [0.3, 1, 1, 0.3] } : undefined}
              whileInView={!loop ? { opacity: 1 } : undefined}
              viewport={!loop ? { once: true } : undefined}
              transition={
                loop
                  ? { duration: 3.2, repeat: Infinity, delay: i * 0.08, ease: "easeInOut" }
                  : { delay: i * 0.08 }
              }
            >
              {i < 5 ? (
                <motion.span
                  className="size-1.5 rounded-full bg-primary"
                  initial={{ scale: 0 }}
                  animate={loop ? { scale: [0, 1, 1, 0] } : undefined}
                  whileInView={!loop ? { scale: 1 } : undefined}
                  viewport={!loop ? { once: true } : undefined}
                  transition={
                    loop
                      ? { duration: 3.2, repeat: Infinity, delay: 0.2 + i * 0.1, ease: "easeInOut" }
                      : { delay: 0.2 + i * 0.1 }
                  }
                />
              ) : null}
            </motion.div>
          ))}
        </div>
      </div>
    </Frame>
  );
}

/** Algorithm — reach wave */
export function AlgorithmVisual(_props: VisualProps) {
  const points = [20, 35, 28, 55, 48, 72, 88];
  return (
    <Frame>
      <div className="w-full">
        <div className="mb-2 text-[10px] text-muted-foreground">Reach trend</div>
        <div className="flex h-16 items-end gap-1">
          {points.map((h, i) => (
            <motion.div
              key={i}
              className="flex-1 rounded-sm bg-primary/80"
              initial={{ height: 4 }}
              animate={{ height: [h * 0.45, h * 0.9, h * 0.7] }}
              transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.08, ease: "easeInOut" }}
            />
          ))}
        </div>
      </div>
    </Frame>
  );
}

/** Ethical — clean shield check */
export function EthicalVisual(_props: VisualProps) {
  const soft = useSoftIn();
  const loop = useLoop();
  return (
    <Frame>
      <motion.div {...soft} className="flex flex-col items-center gap-2">
        <motion.div
          className="relative"
          animate={loop ? { scale: [1, 1.06, 1] } : undefined}
          transition={loop ? { duration: 2.4, repeat: Infinity, ease: "easeInOut" } : undefined}
        >
          <ShieldCheck className="size-14 text-primary" strokeWidth={1.25} />
        </motion.div>
        <div className="text-center text-[11px] text-muted-foreground">
          White-hat only
        </div>
      </motion.div>
    </Frame>
  );
}

/** Maps — pin + search */
export function MapsVisual(_props: VisualProps) {
  const loop = useLoop();
  return (
    <Frame>
      <div className="w-full space-y-2">
        <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-card px-3 py-2 text-xs text-muted-foreground">
          <Search className="size-3.5 text-primary" />
          near me
        </div>
        <motion.div
          className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-medium text-foreground"
          initial={{ opacity: 0, y: 6 }}
          animate={loop ? { opacity: [0, 1, 1, 0], y: [6, 0, 0, 6] } : undefined}
          whileInView={!loop ? { opacity: 1, y: 0 } : undefined}
          viewport={!loop ? { once: true } : undefined}
          transition={
            loop
              ? { duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }
              : { delay: 0.2 }
          }
        >
          <MapPin className="size-3.5 text-primary" />
          Your business · Maps
        </motion.div>
      </div>
    </Frame>
  );
}

/** Default — quiet icon + optional stat */
export function DefaultVisual({ point }: VisualProps) {
  const stat = extractStat(point.title) ?? extractStat(point.desc);
  const soft = useSoftIn();
  return (
    <Frame>
      <motion.div {...soft} className="flex flex-col items-center gap-2.5">
        <IconMark>
          <FileText className="size-4" />
        </IconMark>
        {stat ? (
          <div className="text-center">
            <div className="text-xl font-semibold tracking-tight text-foreground">{stat}</div>
            <div className="text-[11px] text-muted-foreground">built into the plan</div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <TrendingUp className="size-3.5 text-primary" />
            Built for clarity
          </div>
        )}
      </motion.div>
    </Frame>
  );
}

export function ContextualVisual({
  point,
  theme,
  loop = false,
}: {
  point: BuiltDifferentPoint;
  theme: VisualTheme;
  /** Continuous / remount-friendly motion for showcase cards */
  loop?: boolean;
}) {
  return (
    <VisualLoopContext.Provider value={loop}>
      <VisualByTheme point={point} theme={theme} />
    </VisualLoopContext.Provider>
  );
}

function VisualByTheme({ point, theme }: { point: BuiltDifferentPoint; theme: VisualTheme }) {
  switch (theme) {
    case "uptime":
      return <UptimeVisual point={point} />;
    case "speed":
      return <SpeedVisual point={point} />;
    case "security":
      return <SecurityVisual point={point} />;
    case "migration":
      return <MigrationVisual point={point} />;
    case "trust":
      return <TrustVisual point={point} />;
    case "pricing":
      return <PricingVisual point={point} />;
    case "growth":
      return <GrowthVisual point={point} />;
    case "support":
      return <SupportVisual point={point} />;
    case "deploy":
      return <DeployVisual point={point} />;
    case "reporting":
      return <ReportingVisual point={point} />;
    case "results":
      return <ResultsVisual point={point} />;
    case "brand":
      return <BrandVisual point={point} />;
    case "clarity":
      return <ClarityVisual point={point} />;
    case "inbox":
      return <InboxVisual point={point} />;
    case "localMarket":
      return <LocalMarketVisual point={point} />;
    case "strategy":
      return <StrategyVisual point={point} />;
    case "assets":
      return <AssetsVisual point={point} />;
    case "craft":
      return <CraftVisual point={point} />;
    case "process":
      return <ProcessVisual point={point} />;
    case "ownership":
      return <OwnershipVisual point={point} />;
    case "engagement":
      return <EngagementVisual point={point} />;
    case "approval":
      return <ApprovalVisual point={point} />;
    case "targeting":
      return <TargetingVisual point={point} />;
    case "tracking":
      return <TrackingVisual point={point} />;
    case "creative":
      return <CreativeVisual point={point} />;
    case "mobile":
      return <MobileVisual point={point} />;
    case "inventory":
      return <InventoryVisual point={point} />;
    case "payment":
      return <PaymentVisual point={point} />;
    case "automation":
      return <AutomationVisual point={point} />;
    case "segments":
      return <SegmentsVisual point={point} />;
    case "typing":
      return <TypingVisual point={point} />;
    case "bot":
      return <BotVisual point={point} />;
    case "integrate":
      return <IntegrateVisual point={point} />;
    case "code":
      return <CodeVisual point={point} />;
    case "funnel":
      return <FunnelVisual point={point} />;
    case "calendar":
      return <CalendarVisual point={point} />;
    case "algorithm":
      return <AlgorithmVisual point={point} />;
    case "ethical":
      return <EthicalVisual point={point} />;
    case "maps":
      return <MapsVisual point={point} />;
    case "serverMonitor":
      return <ReportingVisual point={point} />;
    case "serverProvision":
      return <DeployVisual point={point} />;
    case "workloads":
      return <DeployVisual point={point} />;
    case "resourceIsolation":
      return <OwnershipVisual point={point} />;
    case "bareMetal":
      return <DeployVisual point={point} />;
    case "cpanel":
      return <DeployVisual point={point} />;
    case "wpPerf":
      return <SpeedVisual point={point} />;
    case "wpStaging":
      return <ProcessVisual point={point} />;
    case "deliverability":
      return <InboxVisual point={point} />;
    case "businessMail":
      return <InboxVisual point={point} />;
    default:
      return <DefaultVisual point={point} />;
  }
}
