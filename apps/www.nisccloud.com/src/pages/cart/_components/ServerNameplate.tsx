import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Cpu, Globe, HardDrive, MapPin, MemoryStick, Network, type LucideIcon } from "lucide-react";
import { BrandLogo } from "@/components/server-logos.tsx";
import { cn } from "@/lib/utils.ts";
import type { ServerSpec } from "./server-options.ts";

const SPEC_ICONS: Record<ServerSpec["key"], LucideIcon> = {
  cpu: Cpu,
  memory: MemoryStick,
  disk: HardDrive,
  network: Network,
  ip: Globe,
};

/** The server being configured, drawn as a faceplate that fills in as the buyer makes choices. */
export function ServerNameplate({
  productLabel,
  planName,
  hostname,
  location,
  osName,
  extras,
  specs,
  status,
  ready,
}: {
  productLabel: string;
  planName: string;
  hostname: string;
  location: string | null;
  osName: string | null;
  extras: string[];
  specs: ServerSpec[];
  status: string;
  ready: boolean;
}) {
  const reduceMotion = useReducedMotion() ?? false;
  const pop = reduceMotion
    ? {}
    : { initial: { opacity: 0, scale: 0.6 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.6 }, transition: { duration: 0.25 } };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0b1220] p-5 text-white shadow-[0_30px_60px_-40px_rgb(2_7_10_/_0.9)] sm:p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-28 opacity-40 sm:block"
        style={{ backgroundImage: "repeating-linear-gradient(90deg, rgb(255 255 255 / 0.10) 0 2px, transparent 2px 9px)" }}
      />

      <div className="relative flex items-center justify-between gap-3">
        <p className="flex items-center gap-2.5 text-sm text-white/80" aria-live="polite">
          <span className="relative flex size-2.5">
            {ready && !reduceMotion ? (
              <motion.span
                key="ping"
                className="absolute inset-0 rounded-full bg-primary"
                initial={{ opacity: 0.8, scale: 1 }}
                animate={{ opacity: 0, scale: 3 }}
                transition={{ duration: 1.1, ease: "easeOut" }}
              />
            ) : null}
            <span className={cn("relative size-2.5 rounded-full transition-colors duration-500", ready ? "bg-primary shadow-[0_0_12px_rgb(56_189_248)]" : "bg-slate-500")} />
          </span>
          {status}
        </p>
        <span className="rounded-full border border-white/15 px-2.5 py-0.5 text-sm text-white/70">{productLabel}</span>
      </div>

      <p className="relative mt-5 break-all text-xl font-medium leading-snug sm:text-2xl">{hostname || "Add a hostname"}</p>
      <p className="relative mt-1 flex flex-wrap items-center gap-x-2 text-[15px] text-white/60">
        <span>{planName}</span>
        {location ? (
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" aria-hidden />
            {location}
          </span>
        ) : null}
      </p>

      <div className="relative mt-5 flex min-h-12 flex-wrap items-center gap-2.5">
        <AnimatePresence mode="popLayout" initial={false}>
          {osName ? (
            <motion.span key={`os-${osName}`} {...pop} className="flex items-center gap-2 rounded-2xl bg-white/5 py-1.5 pl-1.5 pr-3 ring-1 ring-white/10">
              <BrandLogo name={osName} size="sm" />
              <span className="text-sm text-white/85">{osName}</span>
            </motion.span>
          ) : (
            <motion.span key="os-empty" {...pop} className="flex h-11 items-center rounded-2xl border border-dashed border-white/25 px-3 text-sm text-white/50">
              Operating system
            </motion.span>
          )}
          {extras.map((name) => (
            <motion.span key={name} {...pop} className="flex items-center gap-2 rounded-2xl bg-white/5 py-1.5 pl-1.5 pr-3 ring-1 ring-white/10">
              <BrandLogo name={name} size="sm" />
              <span className="text-sm text-white/85">{name}</span>
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      {specs.length ? (
        <ul className="relative mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/10 pt-4">
          {specs.map(({ key, value }) => {
            const Icon = SPEC_ICONS[key];
            return (
              <li key={key} className="flex items-center gap-2 text-sm text-white/75">
                <Icon className="size-4 text-primary" aria-hidden />
                {value}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
