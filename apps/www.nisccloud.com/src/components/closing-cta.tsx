import { Link, useLocation } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import {
  BriefCard,
  CampaignTimeline,
  CommandBar,
  PathChooser,
  ServerRack,
  ShieldScan,
  StorefrontReceipt,
  InboxCard,
  SpecSheet,
  DomainTicker,
  StagingSwitch,
  SitesBoard,
  BrandBoard,
  type ClosingVariant,
} from "./closing-visuals.tsx";
import { CLOSING_PRESETS, CLOSING_THEMES, type ClosingLayout } from "./closing-presets.ts";

export type ClosingDetails = {
  variant: ClosingVariant;
  /** Receipt: the product line. */
  product?: string;
  domain?: string;
  /** Receipt footer / first path. */
  actionLabel?: string;
  /** Timeline and shield: the sequence shown. */
  items?: string[];
  rows?: { label: string; value: string }[];
  command?: string;
  title?: string;
};

type CtaLink = { label: string; href: string; external?: boolean; onClick?: () => void };

export type ClosingCtaProps = {
  eyebrow?: string;
  headline: string;
  subtext: string;
  primary: CtaLink;
  secondary?: CtaLink;
  /** Short reassurances under the buttons; keep them to verified facts. */
  points?: string[];
  note?: string;
  /** Three short steps shown in the "How it works" card. */
  steps?: string[];
  /** Page-specific card design and details; falls back to the "How it works" card. */
  details?: ClosingDetails;
  /** Overrides the closing card chosen for this page type. */
  closingCard?: "storefront" | "brief";
  className?: string;
};

const DEFAULT_POINTS = ["Free strategy call", "Pay with M-Pesa or card"];
const DEFAULT_STEPS = ["Tell us what you need", "Get a clear plan and price", "Manage everything in nPanel"];

function CtaAnchor({ link, className, children }: { link: CtaLink; className: string; children: React.ReactNode }) {
  if (link.onClick) {
    return (
      <button type="button" onClick={link.onClick} className={cn("cursor-pointer", className)}>
        {children}
      </button>
    );
  }
  if (link.external || /^https?:/.test(link.href)) {
    return (
      <a href={link.href} rel="noopener" className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link to={link.href} className={className}>
      {children}
    </Link>
  );
}

function HowItWorks({ steps }: { steps: string[] }) {
  return (
    <div className="rounded-3xl bg-white p-6 text-[#02070a] shadow-[0_30px_60px_-35px_rgb(2_7_10_/_0.55)] sm:p-7 dark:bg-slate-950 dark:text-white dark:ring-1 dark:ring-white/10">
      <p className="type-label text-primary dark:text-primary">How it works</p>
      <ol className="mt-5 space-y-4">
        {steps.map((step, i) => (
          <li key={step} className="flex items-center gap-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-primary/30 bg-primary/[0.06] text-base font-bold text-primary dark:text-primary">
              {i + 1}
            </span>
            <span className="text-base font-semibold leading-snug md:text-lg">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function ClosingCard({ details, steps, primary, secondary }: { details?: ClosingDetails; steps: string[]; primary: string; secondary?: string }) {
  switch (details?.variant) {
    case "storefront":
      return <StorefrontReceipt product={details.product ?? "Nisc Cloud service"} domain={details.domain} cta={details.actionLabel ?? primary} />;
    case "timeline":
      return <CampaignTimeline steps={details.items ?? steps} />;
    case "rack":
      return <ServerRack />;
    case "command":
      return <CommandBar command={details.command} title={details.title} lines={details.items} />;
    case "brief":
      return <BriefCard fields={details.items ?? steps} />;
    case "paths":
      return <PathChooser primary={primary} secondary={details.actionLabel ?? secondary ?? "Talk to our team"} />;
    case "shield":
      return <ShieldScan checks={details.items ?? ["SSL certificate", "Firewall rules", "Backups", "Malware scan"]} />;
    case "inbox":
      return <InboxCard address={details.items?.[0]} />;
    case "spec":
      return <SpecSheet rows={details.rows ?? []} />;
    case "domains":
      return <DomainTicker names={details.items ?? []} />;
    case "staging":
      return <StagingSwitch />;
    case "sites":
      return <SitesBoard sites={details.items ?? []} />;
    case "brand":
      return <BrandBoard />;
    default:
      return <HowItWorks steps={steps} />;
  }
}

const LOGO_POSITION: Record<ClosingLayout, string> = {
  split: "-bottom-16 -right-10 w-[420px]",
  reverse: "-bottom-16 -left-10 w-[420px]",
  centered: "-top-24 left-1/2 w-[520px] -translate-x-1/2",
};

export function ClosingCta({
  eyebrow,
  headline,
  subtext,
  primary,
  secondary,
  points,
  note,
  steps = DEFAULT_STEPS,
  details,
  className,
}: ClosingCtaProps) {
  const { pathname } = useLocation();
  const preset = CLOSING_PRESETS[pathname.replace(/\/+$/, "") || "/"];
  const theme = CLOSING_THEMES[preset?.theme ?? "sky"];
  const dark = theme.tone === "dark";
  const layout = theme.layout;

  const primaryLink = preset?.primaryLabel ? { ...primary, label: preset.primaryLabel } : primary;
  const secondaryLink = preset?.secondary ?? secondary;
  const shownPoints = points ?? preset?.points ?? DEFAULT_POINTS;
  const card: ClosingDetails | undefined = preset
    ? { ...details, ...preset.card, actionLabel: preset.primaryLabel ?? details?.actionLabel }
    : details;

  const copy = (
    <div className={cn(layout === "centered" && "mx-auto max-w-3xl text-center")}>
        <p className={cn("type-label flex items-center gap-2", layout === "centered" && "justify-center", dark ? "text-white/90" : "text-[#02070a]/75")}>
        <span className={cn("size-2 rounded-full", theme.dot)} aria-hidden />
        {eyebrow ?? preset?.eyebrow ?? "Ready when you are"}
      </p>
      <h2
        id="closing-cta-heading"
        className={cn("type-h2 mt-3 max-w-2xl text-balance", layout === "centered" && "mx-auto")}
      >
        {headline}
      </h2>
      <p className={cn("mt-4 max-w-[60ch] text-base leading-relaxed md:text-lg", layout === "centered" && "mx-auto", dark ? "text-white/90" : "text-[#02070a]/80")}>
        {subtext}
      </p>

      <div className={cn("mt-7 flex flex-col gap-3 sm:flex-row", layout === "centered" && "sm:justify-center")}>
        <CtaAnchor
          link={primaryLink}
          className={cn(
            "group inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-6 text-base font-bold shadow-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
            theme.primaryButton,
          )}
        >
          {primaryLink.label}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </CtaAnchor>
        {secondaryLink ? (
          <CtaAnchor
            link={secondaryLink}
            className={cn(
              "inline-flex h-12 items-center justify-center whitespace-nowrap rounded-xl px-6 text-base font-semibold transition focus-visible:outline-none focus-visible:ring-2",
              theme.secondaryButton,
            )}
          >
            {secondaryLink.label}
          </CtaAnchor>
        ) : null}
      </div>

      {shownPoints.length > 0 ? (
        <ul className={cn("mt-6 flex flex-wrap gap-2", layout === "centered" && "justify-center")}>
          {shownPoints.map((point) => (
            <li
              key={point}
              className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium", dark ? "bg-white/10" : "bg-white/50")}
            >
              <Check className="size-4 shrink-0" strokeWidth={3} aria-hidden />
              {point}
            </li>
          ))}
        </ul>
      ) : null}
      {note ? <p className={cn("mt-4 text-sm leading-relaxed", dark ? "text-white/90" : "text-[#02070a]/75")}>{note}</p> : null}
    </div>
  );

  const visual = (
    <div className={cn("relative", layout === "centered" && "mx-auto w-full max-w-md", layout === "reverse" && "lg:order-first")}>
      <ClosingCard details={card} steps={steps} primary={primaryLink.label} secondary={secondaryLink?.label} />
    </div>
  );

  return (
    <section className={cn("px-4 py-14 sm:px-6 md:py-20 lg:px-8", className)} aria-labelledby="closing-cta-heading">
      <div
        className={cn(
          "relative mx-auto max-w-7xl overflow-hidden rounded-[28px] shadow-[0_40px_80px_-50px_rgb(2_7_10_/_0.7)]",
          theme.surface,
          dark ? "text-white" : "text-[#02070a]",
        )}
      >
        <div aria-hidden className={cn("pointer-events-none absolute inset-0", theme.pattern)} />
        <img
          src="/nisciconoriginal.png"
          alt=""
          aria-hidden
          className={cn(
            "pointer-events-none absolute max-w-none brightness-0",
            LOGO_POSITION[layout],
            dark ? "opacity-[0.12] invert" : "opacity-[0.08]",
          )}
        />

        <div
          className={cn(
            "relative grid gap-10 px-6 py-10 sm:px-10 md:py-12 lg:px-14 lg:py-14",
            layout === "split" && "lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:items-center lg:gap-14",
            layout === "reverse" && "lg:grid-cols-[minmax(320px,0.85fr)_minmax(0,1.15fr)] lg:items-center lg:gap-14",
          )}
        >
          {copy}
          {visual}
        </div>
      </div>
    </section>
  );
}
