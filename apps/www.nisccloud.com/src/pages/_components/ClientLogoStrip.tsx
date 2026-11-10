import { useRef } from "react";
import { useInView } from "motion/react";
import { CLIENT_LOGOS, type ClientLogo } from "@/lib/clients.ts";
import { cn } from "@/lib/utils.ts";

/** Equal-area sizing so stacked marks and long wordmarks carry similar visual weight. */
const LOGO_AREA = 3200;
const MIN_H = 22;
const MAX_H = 46;

export type LogoVariant = "tiles" | "white";

function logoSize(ratio: number) {
  const height = Math.min(MAX_H, Math.max(MIN_H, Math.sqrt(LOGO_AREA / ratio)));
  return { height: Math.round(height), width: Math.round(height * ratio) };
}

function LogoTile({ client, hidden, variant }: { client: ClientLogo; hidden?: boolean; variant: LogoVariant }) {
  const { width, height } = logoSize(client.ratio);
  return (
    <li
      aria-hidden={hidden || undefined}
      className={cn(
        "flex h-16 shrink-0 items-center justify-center transition-transform duration-300 hover:-translate-y-0.5",
        variant === "tiles"
          ? "rounded-xl bg-white px-5 shadow-[0_1px_2px_rgb(2_7_10/0.06)] ring-1 ring-black/5 dark:ring-white/10"
          : "px-4 opacity-80 transition-opacity hover:opacity-100",
      )}
      title={hidden ? undefined : client.name}
    >
      <img
        src={variant === "white" ? client.white : client.logo}
        alt={hidden ? "" : client.name}
        width={width}
        height={height}
        style={{ width, height }}
        className="object-contain"
        loading="lazy"
        decoding="async"
      />
    </li>
  );
}

export function ClientLogoStrip({ className, variant = "tiles" }: { className?: string; variant?: LogoVariant }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.2 });

  return (
    <div
      ref={ref}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/70 bg-card/70 shadow-sm backdrop-blur-sm",
        "grid grid-cols-1 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r/oklch from-transparent via-primary to-transparent"
      />
      <div className="flex items-center gap-3 border-b border-border/60 px-5 py-4 md:border-r md:border-b-0 md:py-5">
        <span className="relative flex size-2.5 shrink-0">
          <span className="absolute inset-0 rounded-full bg-primary/50 motion-safe:animate-ping" />
          <span className="relative size-2.5 rounded-full bg-primary" />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-foreground">
            Trusted by growing businesses
          </p>
          <p className="mt-1 text-xs leading-snug text-muted-foreground">
            From small businesses to corporate teams.
          </p>
        </div>
      </div>

      <div className="logo-marquee relative overflow-hidden py-4 [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
        <ul
          aria-label="Client logos"
          className={cn("logo-marquee-track flex w-max items-center gap-3 px-3", inView && "is-running")}
        >
          {CLIENT_LOGOS.map((client) => (
            <LogoTile key={client.name} client={client} variant={variant} />
          ))}
          {CLIENT_LOGOS.map((client) => (
            <LogoTile key={`${client.name}-copy`} client={client} variant={variant} hidden />
          ))}
        </ul>
      </div>
    </div>
  );
}
