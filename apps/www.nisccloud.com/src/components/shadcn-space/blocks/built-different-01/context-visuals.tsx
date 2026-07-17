import { motion } from "motion/react";
import {
  Check,
  CheckCircle2,
  Globe2,
  Lock,
  MapPin,
  Server,
  Shield,
  ShieldCheck,
  Smartphone,
  TrendingUp,
  Zap,
} from "lucide-react";
import { extractStat, type BuiltDifferentPoint } from "./visual-context.ts";
import type { VisualTheme } from "./visual-context.ts";

type VisualProps = {
  point: BuiltDifferentPoint;
  compact?: boolean;
};

/* ─── Uptime: pulsing server grid + live status ─── */
export function UptimeVisual({ point, compact }: VisualProps) {
  const stat = extractStat(point.title) ?? "99.99%";
  const nodes = [0, 1, 2, 3, 4, 5];

  return (
    <div className={compact ? "w-full max-w-[220px] mx-auto" : "w-full"}>
      <div className="relative rounded-xl border border-border bg-muted/30 p-3">
        <div className="mb-2 flex items-center justify-between text-[10px] font-mono">
          <span className="text-muted-foreground">cluster status</span>
          <motion.span
            className="flex items-center gap-1 text-green-500 font-semibold"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="size-1.5 rounded-full bg-green-500" />
            LIVE
          </motion.span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {nodes.map((i) => (
            <motion.div
              key={i}
              className="flex flex-col items-center gap-1 rounded-lg border border-border/60 bg-card px-2 py-2"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <Server className="size-3.5 text-primary/70" />
              <motion.div
                className="size-1.5 rounded-full bg-green-500"
                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
              />
            </motion.div>
          ))}
        </div>
        <motion.div
          className="mt-3 text-center text-3xl font-bold text-primary"
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          {stat}
        </motion.div>
      </div>
    </div>
  );
}

/* ─── Speed: animated speedometer + data packets ─── */
export function SpeedVisual({ point, compact }: VisualProps) {
  const stat = extractStat(point.desc) ?? extractStat(point.title) ?? "<2s";

  return (
    <div className={`relative mx-auto ${compact ? "size-36" : "size-44"}`}>
      <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden>
        <circle cx="60" cy="60" r="48" fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/30" />
        <motion.circle
          cx="60" cy="60" r="48" fill="none" stroke="currentColor" strokeWidth="6"
          strokeLinecap="round" className="text-primary"
          strokeDasharray={301.6}
          initial={{ strokeDashoffset: 301.6 }}
          whileInView={{ strokeDashoffset: 301.6 * 0.15 }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          className="absolute top-1/2 left-1/2 h-[38%] w-0.5 origin-bottom rounded-full bg-primary"
          style={{ x: "-50%", y: "-100%" }}
          initial={{ rotate: -120 }}
          whileInView={{ rotate: 20 }}
          viewport={{ once: true }}
          transition={{ duration: 1.8, ease: "easeOut" }}
        />
        <Zap className="relative z-10 size-5 text-primary mb-0.5" />
        <span className="relative z-10 text-lg font-bold text-primary">{stat}</span>
      </div>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute size-1.5 rounded-full bg-primary"
          style={{ top: "50%", left: "50%" }}
          animate={{
            x: [0, (i - 1) * 40],
            y: [0, -30 - i * 10],
            opacity: [0, 1, 0],
            scale: [0.5, 1, 0.5],
          }}
          transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.5 }}
        />
      ))}
    </div>
  );
}

/* ─── M-Pesa: phone + STK push success flow ─── */
export function MpesaVisual({ compact }: VisualProps) {
  return (
    <div className={`relative mx-auto ${compact ? "h-36 w-44" : "h-44 w-52"}`}>
      <motion.div
        className="absolute inset-x-4 top-2 rounded-2xl border-2 border-green-500/30 bg-green-500/5 p-3"
        initial={{ y: 20, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Smartphone className="size-4 text-green-600" />
          <span className="text-[10px] font-bold text-green-600">M-PESA</span>
        </div>
        <motion.div
          className="rounded-lg bg-green-600 px-2 py-1.5 text-[9px] font-semibold text-white text-center"
          initial={{ scale: 0.9, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          STK Push Sent
        </motion.div>
        <motion.div
          className="mt-2 flex items-center gap-1.5 text-[9px] text-green-700"
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.9 }}
        >
          <CheckCircle2 className="size-3.5" />
          Payment confirmed
        </motion.div>
      </motion.div>
      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-1"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 1.2 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="size-1.5 rounded-full bg-green-500"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </motion.div>
    </div>
  );
}

/* ─── Security: shield scan + lock close ─── */
export function SecurityVisual({ compact }: VisualProps) {
  return (
    <div className={`relative mx-auto flex items-center justify-center ${compact ? "size-36" : "size-44"}`}>
      <motion.div
        className="absolute inset-4 rounded-full border border-primary/20"
        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0, 0.4] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      />
      <Shield className="size-16 text-primary/20 absolute" strokeWidth={0.75} />
      <motion.div
        className="relative z-10 flex size-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/30"
        whileHover={{ scale: 1.05 }}
      >
        <motion.div
          initial={{ y: -4, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 300, delay: 0.3 }}
        >
          <Lock className="size-7 text-primary" />
        </motion.div>
      </motion.div>
      <motion.div
        className="absolute inset-x-6 h-0.5 bg-primary/60 rounded-full"
        initial={{ top: "20%" }}
        animate={{ top: ["20%", "75%", "20%"] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-[9px] font-bold text-green-600"
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.8, type: "spring" }}
      >
        <ShieldCheck className="size-3" />
        HTTPS
      </motion.div>
    </div>
  );
}

/* ─── Migration: files flying between servers ─── */
export function MigrationVisual({ compact }: VisualProps) {
  return (
    <div className={`relative mx-auto ${compact ? "h-32 w-full max-w-xs" : "h-44 w-full"}`}>
      <div className="flex items-center justify-between px-2">
        <motion.div
          className="flex flex-col items-center gap-1"
          initial={{ opacity: 0, x: -12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <div className="rounded-lg border border-border bg-muted p-2">
            <Server className="size-5 text-muted-foreground" />
          </div>
          <span className="text-[8px] text-muted-foreground">Old host</span>
        </motion.div>

        <div className="relative flex-1 mx-2 h-8">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute top-1/2 -translate-y-1/2 size-2 rounded-sm bg-primary"
              initial={{ left: "0%", opacity: 0 }}
              animate={{ left: ["0%", "100%"], opacity: [0, 1, 1, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.5, ease: "easeInOut" }}
            />
          ))}
          <div className="absolute inset-x-0 top-1/2 h-px bg-primary/30 -translate-y-1/2" />
        </div>

        <motion.div
          className="flex flex-col items-center gap-1"
          initial={{ opacity: 0, x: 12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <div className="rounded-lg border border-primary/40 bg-primary/10 p-2">
            <Server className="size-5 text-primary" />
          </div>
          <span className="text-[8px] text-primary font-semibold">Nisc Cloud</span>
        </motion.div>
      </div>
      <motion.div
        className="mt-3 mx-auto w-fit rounded-full bg-green-500/10 border border-green-500/30 px-3 py-1 text-[10px] font-semibold text-green-600"
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.6 }}
      >
        Zero downtime ✓
      </motion.div>
    </div>
  );
}

/* ─── Trust: Kenya counties lighting up + counter ─── */
export function TrustVisual({ point, compact }: VisualProps) {
  const stat = extractStat(point.title) ?? "100+";
  const dots = Array.from({ length: 12 }, (_, i) => ({
    x: 15 + (i % 4) * 22 + (Math.floor(i / 4) % 2) * 8,
    y: 20 + Math.floor(i / 4) * 28,
    delay: i * 0.07,
  }));

  return (
    <div className={`relative mx-auto ${compact ? "min-h-[160px] w-full max-w-[200px]" : "min-h-[200px] w-full"}`}>
      <svg viewBox="0 0 100 90" className="mx-auto h-24 w-28 text-primary/15" aria-hidden>
        <motion.path
          d="M50 8 L78 22 L85 50 L72 78 L50 85 L28 78 L15 50 L22 22 Z"
          fill="currentColor"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        />
      </svg>
      {dots.map((d, i) => (
        <motion.div
          key={i}
          className="absolute size-2 rounded-full bg-primary"
          style={{ left: `${d.x}%`, top: `${d.y}%` }}
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 + d.delay, type: "spring" }}
        />
      ))}
      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.8 }}
      >
        <div className="text-2xl font-bold text-primary">{stat}</div>
        <div className="text-[9px] text-muted-foreground">businesses growing with us</div>
      </motion.div>
    </div>
  );
}

/* ─── Location: fast for visitors wherever they are ─── */
export function LocationVisual({ compact }: VisualProps) {
  return (
    <div className={`relative mx-auto flex items-center justify-center ${compact ? "size-36" : "size-44"}`}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-primary/30"
          style={{ width: `${(i + 1) * 33}%`, height: `${(i + 1) * 33}%` }}
          animate={{ scale: [0.8, 1.2], opacity: [0.6, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.6 }}
        />
      ))}
      <div className="relative z-10 flex flex-col items-center">
        <MapPin className="size-8 text-primary mb-1" />
        <motion.span
          className="text-xs font-bold text-primary font-mono"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Fast where visitors are
        </motion.span>
      </div>
    </div>
  );
}

/* ─── Pricing: KES receipt with checkmarks ─── */
export function PricingVisual({ point, compact }: VisualProps) {
  const items = ["Setup", "SSL", "Backups", "Support"];

  return (
    <div className={`mx-auto ${compact ? "w-48" : "w-56"}`}>
      <motion.div
        className="rounded-xl border border-border bg-card p-3 shadow-sm"
        initial={{ rotate: -2, opacity: 0 }}
        whileInView={{ rotate: 0, opacity: 1 }}
        viewport={{ once: true }}
      >
        <div className="mb-2 flex items-center justify-between border-b border-dashed border-border pb-2">
          <span className="text-[10px] font-bold text-primary">KES Receipt</span>
          <span className="text-[9px] text-muted-foreground">No surprises</span>
        </div>
        {items.map((item, i) => (
          <motion.div
            key={item}
            className="flex items-center justify-between py-1 text-[10px]"
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 + i * 0.12 }}
          >
            <span className="text-muted-foreground">{item}</span>
            <motion.span
              className="flex items-center gap-0.5 font-semibold text-green-600"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 + i * 0.12, type: "spring" }}
            >
              <Check className="size-3" />
              FREE
            </motion.span>
          </motion.div>
        ))}
        <motion.div
          className="mt-2 flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1 text-[9px] font-bold text-primary"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.9 }}
        >
          {extractStat(point.desc) ?? "KES"} · All inclusive
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ─── Growth: ranking climb animation ─── */
export function GrowthVisual({ compact }: VisualProps) {
  const ranks = [
    { pos: 10, label: "Week 1", opacity: 0.4 },
    { pos: 6, label: "Week 2", opacity: 0.6 },
    { pos: 3, label: "Week 4", opacity: 0.85 },
    { pos: 1, label: "Now", opacity: 1 },
  ];

  return (
    <div className={`mx-auto ${compact ? "w-full max-w-xs" : "w-full"}`}>
      <div className="space-y-2">
        {ranks.map(({ pos, label, opacity }, i) => (
          <motion.div
            key={label}
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15 }}
          >
            <span className="w-12 text-[9px] font-mono text-muted-foreground">{label}</span>
            <div className="flex-1 h-6 rounded-md bg-muted/50 overflow-hidden relative">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-md bg-primary flex items-center px-2"
                initial={{ width: "10%" }}
                whileInView={{ width: `${100 - pos * 8}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 + i * 0.1 }}
                style={{ opacity }}
              >
                {i === ranks.length - 1 && (
                  <TrendingUp className="size-3 text-primary-foreground ml-auto" />
                )}
              </motion.div>
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-foreground">
                #{pos}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ─── Support: live chat bubbles ─── */
export function SupportVisual({ compact }: VisualProps) {
  const messages = [
    { from: "user", text: "Need help with DNS?" },
    { from: "agent", text: "On it! Updating now ✓" },
    { from: "agent", text: "All set — site is live" },
  ];

  return (
    <div className={`mx-auto space-y-2 ${compact ? "w-48 py-2" : "w-56 py-4"}`}>
      {messages.map((msg, i) => (
        <motion.div
          key={i}
          className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
          initial={{ opacity: 0, y: 8, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.35 }}
        >
          <div
            className={`max-w-[85%] rounded-2xl px-2.5 py-1.5 text-[10px] ${
              msg.from === "user"
                ? "bg-primary text-primary-foreground rounded-br-sm"
                : "bg-muted border border-border rounded-bl-sm"
            }`}
          >
            {msg.text}
          </div>
        </motion.div>
      ))}
      <motion.div
        className="flex gap-1 pl-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 1.2, repeat: Infinity, delay: 1.2 }}
      >
        {[0, 1, 2].map((i) => (
          <span key={i} className="size-1 rounded-full bg-muted-foreground/50" />
        ))}
      </motion.div>
    </div>
  );
}

/* ─── Deploy: terminal deploy sequence ─── */
export function DeployVisual({ compact }: VisualProps) {
  const lines = ["Provisioning...", "NVMe ready", "Online ✓"];

  return (
    <div className={`mx-auto rounded-lg border border-border bg-[oklch(0.12_0.015_260)] font-mono text-[9px] text-green-400 ${compact ? "w-44 p-2" : "w-52 p-3"}`}>
      <div className="flex gap-1 mb-2">
        {["bg-red-500/80", "bg-yellow-500/80", "bg-green-500/80"].map((c) => (
          <span key={c} className={`size-1.5 rounded-full ${c}`} />
        ))}
      </div>
      {lines.map((line, i) => (
        <motion.div
          key={line}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.4 }}
        >
          {i === 0 ? "> " : "✔ "}{line}
        </motion.div>
      ))}
      <motion.span
        className="inline-block w-1.5 h-3 bg-green-400 ml-0.5 align-middle"
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 0.8, repeat: Infinity }}
      />
    </div>
  );
}

/* ─── Default: orbiting stat with particles ─── */
export function DefaultStatVisual({ point, compact }: VisualProps) {
  const stat = extractStat(point.title) ?? extractStat(point.desc) ?? "100%";
  const orbit = compact ? 48 : 62;

  return (
    <div className={`relative mx-auto flex items-center justify-center ${compact ? "size-32" : "size-40"}`}>
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      >
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="absolute left-1/2 top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/70"
            style={{
              transform: `rotate(${i * 90}deg) translateY(-${orbit}px)`,
            }}
          />
        ))}
      </motion.div>
      <motion.div
        className="relative z-10 flex flex-col items-center"
        initial={{ scale: 0.8, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true }}
      >
        <Globe2 className="size-6 text-primary/50 mb-1" />
        <span className="text-3xl font-bold text-primary">{stat}</span>
      </motion.div>
    </div>
  );
}

/* ─── Wide: SLA gauge for uptime/security themes ─── */
export function WideMonitorVisual({ point, theme }: VisualProps & { theme: VisualTheme }) {
  if (theme === "migration") return <MigrationVisual point={point} compact={false} />;
  if (theme === "growth") return <GrowthVisual point={point} compact={false} />;
  if (theme === "security") {
    return (
      <div className="rounded-tl-xl relative -mb-6 -mr-6 mt-2 border-l border-t border-border p-4 sm:p-6">
        <div className="flex h-44 items-end gap-1.5 pt-4">
          {[40, 65, 55, 80, 70, 92, 85, 98, 95, 100].map((h, i) => (
            <motion.div
              key={i}
              className="flex-1 rounded-t bg-primary/20 overflow-hidden flex flex-col justify-end"
              style={{ height: "100%" }}
            >
              <motion.div
                className="w-full rounded-t bg-primary"
                initial={{ height: 0 }}
                whileInView={{ height: `${h * 0.5}%` }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.5 }}
              />
            </motion.div>
          ))}
        </div>
        <motion.div
          className="absolute top-8 right-6 rounded-xl border border-green-500/30 bg-green-500/10 px-3 py-2 text-center"
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8, type: "spring" }}
        >
          <div className="text-lg font-bold text-green-600">{extractStat(point.title) ?? "99.99%"}</div>
          <div className="text-[8px] text-green-600/80">SLA met</div>
        </motion.div>
      </div>
    );
  }

  return <GrowthVisual point={point} compact={false} />;
}

/* ─── Router ─── */
export function ContextualVisual({
  point,
  theme,
  variant,
}: {
  point: BuiltDifferentPoint;
  theme: VisualTheme;
  variant: "stat" | "ring" | "chart" | "shield-wide" | "social-wide" | "banner";
}) {
  const compact = variant === "stat" || variant === "ring" || variant === "chart";

  if (variant === "shield-wide") {
    return <WideMonitorVisual point={point} theme={theme} />;
  }

  if (variant === "social-wide") {
    if (theme === "trust" || theme === "location") return <TrustVisual point={point} compact={false} />;
    if (theme === "support") return <SupportVisual point={point} compact={false} />;
    return <TrustVisual point={point} compact={false} />;
  }

  if (variant === "banner") {
    if (theme === "mpesa") return <MpesaVisual point={point} compact={false} />;
    if (theme === "pricing") return <PricingVisual point={point} compact={false} />;
    if (theme === "deploy") return <DeployVisual point={point} compact={false} />;
    return <MigrationVisual point={point} compact={false} />;
  }

  // Compact cards — pick by theme
  switch (theme) {
    case "uptime":
      return <UptimeVisual point={point} compact={compact} />;
    case "speed":
      return <SpeedVisual point={point} compact={compact} />;
    case "mpesa":
      return <MpesaVisual point={point} compact={compact} />;
    case "security":
      return <SecurityVisual point={point} compact={compact} />;
    case "migration":
      return <MigrationVisual point={point} compact={compact} />;
    case "trust":
      return <TrustVisual point={point} compact={compact} />;
    case "location":
      return <LocationVisual point={point} compact={compact} />;
    case "pricing":
      return <PricingVisual point={point} compact={compact} />;
    case "growth":
      return <GrowthVisual point={point} compact={compact} />;
    case "support":
      return <SupportVisual point={point} compact={compact} />;
    case "deploy":
      return <DeployVisual point={point} compact={compact} />;
    default:
      return <DefaultStatVisual point={point} compact={compact} />;
  }
}
