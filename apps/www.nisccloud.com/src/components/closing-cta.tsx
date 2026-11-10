import { Link } from "react-router-dom";
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
  type ClosingVariant,
} from "./closing-visuals.tsx";

export type ClosingDetails = {
  variant: ClosingVariant;
  /** Receipt: the product line. */
  product?: string;
  domain?: string;
  /** Receipt footer / first path. */
  actionLabel?: string;
  /** Timeline and shield: the sequence shown. */
  items?: string[];
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
      <p className="type-label text-sky-700 dark:text-primary">How it works</p>
      <ol className="mt-5 space-y-4">
        {steps.map((step, i) => (
          <li key={step} className="flex items-center gap-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-primary/30 bg-primary/[0.06] text-base font-bold text-sky-700 dark:text-primary">
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
      return <CommandBar />;
    case "brief":
      return <BriefCard fields={details.items ?? steps} />;
    case "paths":
      return <PathChooser primary={primary} secondary={details.actionLabel ?? "Talk to our team"} />;
    case "shield":
      return <ShieldScan checks={details.items ?? ["SSL certificate", "Firewall rules", "Backups", "Malware scan"]} />;
    default:
      return <HowItWorks steps={steps} />;
  }
}

export function ClosingCta({
  eyebrow = "Ready when you are",
  headline,
  subtext,
  primary,
  secondary,
  points = DEFAULT_POINTS,
  note,
  steps = DEFAULT_STEPS,
  details,
  className,
}: ClosingCtaProps) {
  return (
    <section className={cn("px-4 py-14 sm:px-6 md:py-20 lg:px-8", className)} aria-labelledby="closing-cta-heading">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[28px] bg-[linear-gradient(120deg,#5cc4ff_0%,#38b6ff_45%,#1592e0_100%)] text-[#02070a] shadow-[0_40px_80px_-50px_rgb(2_132_199_/_0.9)] dark:bg-[linear-gradient(120deg,#0e4a73_0%,#0b3a5c_55%,#07243a_100%)] dark:text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgb(255_255_255_/_0.35)_1px,transparent_0)] [background-size:22px_22px] [mask-image:linear-gradient(to_left,black,transparent_70%)]"
        />
        <img
          src="/nisciconoriginal.png"
          alt=""
          aria-hidden
          className="pointer-events-none absolute -bottom-16 -right-10 w-[420px] max-w-none opacity-[0.14] brightness-0 invert"
        />

        <div className="relative grid gap-10 px-6 py-10 sm:px-10 md:py-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:items-center lg:gap-14 lg:px-14 lg:py-14">
          <div>
            <p className="type-label flex items-center gap-2 text-[#02070a]/80 dark:text-sky-200">
              <span className="size-2 rounded-full bg-brand-orange" aria-hidden />
              {eyebrow}
            </p>
            <h2
              id="closing-cta-heading"
              className="mt-3 max-w-2xl text-balance text-3xl font-extrabold leading-[1.1] tracking-tight md:text-4xl lg:text-[2.75rem]"
            >
              {headline}
            </h2>
            <p className="mt-4 max-w-[60ch] text-base leading-relaxed text-[#02070a]/80 md:text-lg dark:text-white/80">{subtext}</p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <CtaAnchor
                link={primary}
                className="group inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#02070a] px-6 text-base font-bold text-white shadow-lg shadow-[#02070a]/25 transition hover:bg-[#02070a]/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02070a] focus-visible:ring-offset-2 focus-visible:ring-offset-primary dark:bg-primary dark:text-[#02070a] dark:hover:bg-primary/90"
              >
                {primary.label}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </CtaAnchor>
              {secondary ? (
                <CtaAnchor
                  link={secondary}
                  className="inline-flex h-12 items-center justify-center whitespace-nowrap rounded-xl border border-[#02070a]/25 bg-white/30 px-6 text-base font-semibold text-[#02070a] transition hover:bg-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02070a] dark:border-white/25 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                >
                  {secondary.label}
                </CtaAnchor>
              ) : null}
            </div>

            {points.length > 0 ? (
              <ul className="mt-6 flex flex-wrap gap-2">
                {points.map((point) => (
                  <li
                    key={point}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/40 px-3 py-1.5 text-sm font-medium dark:bg-white/10"
                  >
                    <Check className="size-4 shrink-0" strokeWidth={3} aria-hidden />
                    {point}
                  </li>
                ))}
              </ul>
            ) : null}
            {note ? <p className="mt-4 text-sm leading-relaxed text-[#02070a]/75 dark:text-white/70">{note}</p> : null}
          </div>

          <div className="relative">
            <ClosingCard details={details} steps={steps} primary={primary.label} secondary={secondary?.label} />
          </div>
        </div>
      </div>
    </section>
  );
}
