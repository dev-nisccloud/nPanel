"use client";

import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowRightLeft,
  CalendarClock,
  ChartColumnIncreasing,
  Check,
  Cpu,
  CreditCard,
  DatabaseBackup,
  FolderOpen,
  Gauge,
  Globe,
  HardDrive,
  Headphones,
  KeyRound,
  LayoutDashboard,
  Mail,
  ShieldCheck,
} from "lucide-react";

import { cn } from "@/lib/utils.ts";

export type ServiceStatisticsItem = {
  /** Metric label (shown as title). */
  title: string;
  /** Metric value (shown prominently). */
  subtitle: string;
  cardIcon?: LucideIcon;
  badgeColor?: string;
  statusValue?: string;
  caption?: string;
};

export type ServiceStatisticsProps = {
  items: ServiceStatisticsItem[];
  className?: string;
  /** Reduced vertical padding  used under service/hosting heroes. */
  compact?: boolean;
  /** Drop outer section spacing  for use inside another column/section. */
  embedded?: boolean;
};

type ParsedStatValue = {
  prefix: string;
  number: number;
  suffix: string;
  decimals: number;
  animatable: boolean;
};

/** Parses values like "300+", "98%", "4.9★", "<2s", "KES 85M+" for count-up animation. */
function parseStatValue(value: string): ParsedStatValue {
  const match = value.match(/^([^\d]*?)([\d,.]+)([^\d]*)$/);
  if (!match) {
    return { prefix: "", number: 0, suffix: value, decimals: 0, animatable: false };
  }

  const [, prefix, numStr, suffix] = match;
  const cleaned = numStr.replace(/,/g, "");
  const decimals = cleaned.includes(".") ? cleaned.split(".")[1]!.length : 0;
  const number = parseFloat(cleaned);

  if (!Number.isFinite(number)) {
    return { prefix: "", number: 0, suffix: value, decimals: 0, animatable: false };
  }

  return {
    prefix,
    number,
    suffix,
    decimals,
    animatable: true,
  };
}

/**
 * Renders the real value until the metric scrolls into view, so crawlers, screenshots and
 * reduced-motion users never see a transient "0".
 */
function useAnimatedCounter(target: number, decimals: number, duration = 1800) {
  const [count, setCount] = useState(target);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || started.current) return;

        started.current = true;
        const startTime = performance.now();

        const animate = (now: number) => {
          const progress = Math.min((now - startTime) / duration, 1);
          const eased = 1 - (1 - progress) ** 3;
          setCount(parseFloat((eased * target).toFixed(decimals)));

          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };

        requestAnimationFrame(animate);
      },
      { threshold: 0.35 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration, decimals]);

  return { count, ref };
}

function AnimatedMetricValue({ value }: { value: string }) {
  const parsed = parseStatValue(value);

  // Percentages are targets or rates, not tallies; counting them up from 0 misstates them.
  if (!parsed.animatable || parsed.suffix.includes("%")) {
    return <>{value}</>;
  }

  return <CountUpValue parsed={parsed} />;
}

/** Split out so the counter hook is only mounted for animatable values (rules-of-hooks). */
function CountUpValue({ parsed }: { parsed: ParsedStatValue }) {
  const { count, ref } = useAnimatedCounter(parsed.number, parsed.decimals);
  const displayNum =
    parsed.decimals > 0 ? count.toFixed(parsed.decimals) : Math.floor(count).toLocaleString();

  return (
    <span ref={ref}>
      {parsed.prefix}
      {displayNum}
      {parsed.suffix}
    </span>
  );
}

const ICON_RULES: [RegExp, LucideIcon][] = [
  [/ssl|encrypt|certificate|secure|security/i, ShieldCheck],
  [/backup/i, DatabaseBackup],
  [/migrat|transfer/i, ArrowRightLeft],
  [/storage|ssd|nvme/i, HardDrive],
  [/uptime|available|online/i, Activity],
  [/root|access/i, KeyRound],
  [/cpu|ram|allocation/i, Cpu],
  [/dns|tld|domain/i, Globe],
  [/renewal|reminder|issuance|deliver|days/i, CalendarClock],
  [/email|imap|client|audience/i, Mail],
  [/m-pesa|payment|checkout|billing|pricing|fee|spend/i, CreditCard],
  [/support|manager|handoff|strategy|call|training|setup/i, Headphones],
  [/report/i, ChartColumnIncreasing],
  [/speed|load/i, Gauge],
  [/file|guide|source/i, FolderOpen],
  [/npanel|management|workspace/i, LayoutDashboard],
];

function iconFor(item: ServiceStatisticsItem): LucideIcon {
  if (item.cardIcon) return item.cardIcon;
  const text = `${item.title} ${item.subtitle}`;
  return ICON_RULES.find(([pattern]) => pattern.test(text))?.[1] ?? Check;
}

export default function ServiceStatistics({
  items,
  className,
  compact = false,
  embedded = false,
}: ServiceStatisticsProps) {
  if (items.length === 0) return null;

  const Wrapper = embedded ? "div" : "section";

  return (
    <Wrapper
      className={cn(embedded ? "py-0" : compact ? "py-4 sm:py-6" : "py-8 sm:py-12", className)}
      aria-label={embedded ? undefined : "Key facts"}
    >
      <div className={cn("mx-auto w-full", embedded ? "max-w-none px-0" : "max-w-7xl px-4 md:px-8")}>
        <ul
          className={cn(
            "grid gap-2 sm:gap-3",
            items.length === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2",
            !embedded && items.length >= 4 && "lg:grid-cols-4",
          )}
        >
          {items.map((item, index) => {
            const Icon = iconFor(item);
            const accent = index === 0;
            return (
              <li
                key={`${item.title}-${index}`}
                className="group flex items-center gap-3 rounded-xl border border-border/70 bg-card px-3.5 py-3 transition-colors hover:border-primary/40"
              >
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg",
                    accent ? "bg-brand-orange/12 text-brand-orange" : "bg-primary/10 text-primary",
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="min-w-0 leading-tight">
                  <span className="block text-[15px] font-bold tabular-nums text-foreground">
                    <AnimatedMetricValue value={item.subtitle} />
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{item.title}</span>
                  {item.caption ? (
                    <span className="mt-0.5 block text-[11px] text-muted-foreground/80">{item.caption}</span>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </Wrapper>
  );
}
/** Map legacy `{ label, value }` trust stats to statistics block items. */
export function trustStatsToStatisticsItems(
  stats: { label: string; value: string }[],
): ServiceStatisticsItem[] {
  return stats.map((stat) => ({
    title: stat.label,
    subtitle: stat.value,
  }));
}
