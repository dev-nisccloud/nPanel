import type { ComponentType, CSSProperties } from "react";
import {
  BadgeCheck,
  Globe,
  LayoutTemplate,
  Mail,
  Megaphone,
  Receipt,
  Server,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { useArtLive } from "./use-art-live.ts";
import { ZepoMascot } from "@/components/zepo-mascot.tsx";

/** One full tour of every service, in seconds. Each service owns an equal slot. */
const CYCLE = 16;

type Service = {
  icon: ComponentType<{ className?: string }>;
  label: string;
  detail: string;
  event: string;
  tile: string;
  side: "left" | "right";
  y: number;
};

/** Fictional illustration data only; nothing here is a live availability or account state. */
const SERVICES: Service[] = [
  { icon: Globe, label: "Domains", detail: ".ke · .com", event: "savannabakery.co.ke registered", tile: "from-[#38b6ff] to-[#38b6ff]", side: "left", y: 92 },
  { icon: Server, label: "Hosting", detail: "Web · WordPress", event: "Hosting plan active", tile: "from-slate-700 to-slate-950", side: "left", y: 162 },
  { icon: Mail, label: "Email", detail: "On your domain", event: "Mailbox amina@ created", tile: "from-[#38b6ff] to-[#38b6ff]", side: "left", y: 232 },
  { icon: ShieldCheck, label: "Security", detail: "SSL · backups", event: "SSL certificate issued", tile: "from-emerald-400 to-emerald-600", side: "left", y: 302 },
  { icon: LayoutTemplate, label: "Websites", detail: "Design · build", event: "New website published", tile: "from-orange-400 to-brand-orange", side: "right", y: 92 },
  { icon: Megaphone, label: "Marketing", detail: "SEO · ads", event: "Campaign launched", tile: "from-rose-400 to-brand-orange", side: "right", y: 162 },
  { icon: ZepoMascot, label: "Zepo AI", detail: "AI assistant", event: "Zepo AI answered an enquiry", tile: "from-violet-500 to-[#38b6ff]", side: "right", y: 232 },
  { icon: Receipt, label: "Billing", detail: "One account", event: "Invoice paid · receipt sent", tile: "from-slate-800 to-brand-orange", side: "right", y: 302 },
];

const HUB = { x: 250, y: 197 };

function linkPath(service: Service) {
  const edge = service.side === "left" ? 146 : 354;
  const bend = service.side === "left" ? 200 : 300;
  return `M${HUB.x} ${HUB.y} C ${bend} ${HUB.y}, ${bend} ${service.y}, ${edge} ${service.y}`;
}

function slotStyle(index: number): CSSProperties {
  return { animationDelay: `${index * (CYCLE / SERVICES.length)}s`, animationDuration: `${CYCLE}s` };
}

/** Packets travel from the hub to each service in turn; mounted only while live so SMIL time starts in sync with CSS. */
function Packets() {
  const slot = 1 / SERVICES.length;
  return (
    <svg viewBox="0 0 500 390" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 size-full" aria-hidden>
      {SERVICES.map((service, index) => {
        const start = index * slot + 0.004;
        const arrive = start + 0.05;
        return (
          <circle key={service.label} r="3.6" fill="var(--color-brand-orange)" opacity="0">
            <animateMotion
              dur={`${CYCLE}s`}
              repeatCount="indefinite"
              path={linkPath(service)}
              calcMode="linear"
              keyPoints="0;0;1;1"
              keyTimes={`0;${start.toFixed(3)};${arrive.toFixed(3)};1`}
            />
            <animate
              attributeName="opacity"
              dur={`${CYCLE}s`}
              repeatCount="indefinite"
              values="0;0;1;1;0;0"
              keyTimes={`0;${start.toFixed(3)};${(start + 0.004).toFixed(3)};${arrive.toFixed(3)};${(arrive + 0.006).toFixed(3)};1`}
            />
          </circle>
        );
      })}
    </svg>
  );
}

/**
 * Hero story 1: Nisc Cloud as the hub that connects every service a business runs on.
 * Each service lights up in turn as a packet arrives from the hub, and a matching
 * activity toast appears. Reduced motion shows the connected map with one static event.
 */
export function EcosystemStory() {
  const { ref, live } = useArtLive<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={cn(
        "eco relative h-full min-h-[280px] overflow-hidden rounded-[28px] border border-primary/15 bg-[linear-gradient(135deg,#eaf7ff_0%,#ffffff_48%,#fff1ea_100%)] sm:min-h-[390px] dark:border-white/10 dark:bg-[linear-gradient(135deg,#0b2538_0%,#0a1724_52%,#2a1a14_100%)]",
        live && "art-live",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60 dark:opacity-25"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgb(14 87 118 / 0.16) 1px, transparent 0)",
          backgroundSize: "20px 20px",
          maskImage: "radial-gradient(ellipse 70% 65% at 50% 50%, black, transparent)",
        }}
      />
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 size-[46%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-10 -right-10 size-40 rounded-full bg-brand-orange/15 blur-3xl" />

      <svg viewBox="0 0 500 390" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden>
        <defs>
          <linearGradient id="eco-link-l" x1="1" x2="0">
            <stop offset="0" stopColor="var(--primary)" stopOpacity=".7" />
            <stop offset="1" stopColor="var(--primary)" stopOpacity=".18" />
          </linearGradient>
          <linearGradient id="eco-link-r" x1="0" x2="1">
            <stop offset="0" stopColor="var(--primary)" stopOpacity=".7" />
            <stop offset="1" stopColor="var(--color-brand-orange)" stopOpacity=".3" />
          </linearGradient>
        </defs>
        {SERVICES.map((service) => (
          <path
            key={service.label}
            d={linkPath(service)}
            fill="none"
            stroke={`url(#eco-link-${service.side === "left" ? "l" : "r"})`}
            strokeWidth="1.6"
            strokeDasharray="3 5"
            strokeLinecap="round"
            className="eco-link"
          />
        ))}
      </svg>
      {live ? <Packets /> : null}

      {/* Activity toasts, one per service, sharing a single slot */}
      <div className="absolute left-1/2 top-[4.5%] z-20 h-7 w-[64%] -translate-x-1/2 sm:w-[46%]">
        {SERVICES.map((service, index) => (
          <div
            key={service.label}
            style={slotStyle(index)}
            className={cn(
              "eco-toast absolute inset-0 flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-card/95 px-2 shadow-[0_10px_24px_-14px_rgb(2_60_100/0.55)] backdrop-blur",
              index === 0 ? "opacity-100" : "opacity-0",
            )}
          >
            <BadgeCheck className="size-3.5 shrink-0 text-emerald-500" />
            <span className="min-w-0 flex-1 truncate text-[8px] font-semibold text-foreground sm:text-[9px]">{service.event}</span>
            <span className="shrink-0 text-[7px] font-medium text-muted-foreground">now</span>
          </div>
        ))}
      </div>

      {/* Service nodes */}
      {SERVICES.map((service, index) => {
        const Icon = service.icon;
        return (
          <div
            key={service.label}
            style={{ ...slotStyle(index), top: `${(service.y / 390) * 100}%` }}
            className={cn(
              "eco-node absolute z-10 flex w-[29%] -translate-y-1/2 items-center gap-1.5 rounded-xl border border-border/80 bg-card/95 p-1.5 shadow-[0_12px_26px_-18px_rgb(2_60_100/0.6)] backdrop-blur sm:gap-2 sm:p-2",
              service.side === "left" ? "left-[3%]" : "right-[3%] flex-row-reverse text-right",
            )}
          >
            <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-lg bg-linear-to-br text-white shadow-sm sm:size-7", service.tile)}>
              <Icon className="size-3 sm:size-3.5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[8.5px] font-bold text-foreground sm:text-[10px]">{service.label}</span>
              <span className="block truncate text-[7px] text-muted-foreground sm:text-[7.5px]">{service.detail}</span>
            </span>
            <span className="eco-node-dot size-1.5 shrink-0 rounded-full bg-emerald-500" />
          </div>
        );
      })}

      {/* Nisc Cloud hub */}
      <div
        className="absolute z-10 aspect-square w-[28%] max-w-[150px] -translate-x-1/2 -translate-y-1/2"
        style={{ left: `${(HUB.x / 500) * 100}%`, top: `${(HUB.y / 390) * 100}%` }}
      >
        <span aria-hidden className="eco-pulse absolute inset-0 rounded-full border border-primary/40" />
        <span aria-hidden className="eco-pulse eco-pulse-late absolute inset-0 rounded-full border border-brand-orange/40" />
        <span aria-hidden className="eco-orbit absolute -inset-[9%] rounded-full border border-dashed border-primary/35">
          <span className="absolute left-1/2 top-0 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-orange shadow-[0_0_10px_var(--color-brand-orange)]" />
          <span className="absolute bottom-[14%] left-[6%] size-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
        </span>
        <div className="absolute inset-[6%] flex flex-col items-center justify-center rounded-[28%] bg-[radial-gradient(circle_at_30%_20%,#123247,#02070A_70%)] text-white shadow-[0_26px_50px_-20px_rgb(2_60_100/0.8)] ring-1 ring-white/15">
          <img src="/nisciconoriginal.png" alt="" width={44} height={28} className="w-[34%]" />
          <span className="mt-1 text-[10px] font-black tracking-tight sm:text-[12px]">Nisc Cloud</span>
          <span className="mt-0.5 rounded-full bg-white/10 px-1.5 py-px text-[6.5px] font-semibold text-[#38b6ff] sm:text-[7.5px]">nPanel</span>
        </div>
      </div>

      <p className="absolute inset-x-0 bottom-[4%] z-10 text-center text-[8px] font-semibold uppercase tracking-[0.2em] text-muted-foreground sm:text-[9px]">
        Every service · one connected account
      </p>
    </div>
  );
}
