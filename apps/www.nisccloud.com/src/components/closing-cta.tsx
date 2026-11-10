import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { useArtLive } from "@/components/artwork/use-art-live.ts";

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
  className?: string;
};

const DEFAULT_POINTS = ["Free strategy call", "Pay with M-Pesa or card", "24/7 ticket support · email, chat and phone during working hours"];

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

export function ClosingCta({
  eyebrow = "Ready when you are",
  headline,
  subtext,
  primary,
  secondary,
  points = DEFAULT_POINTS,
  note,
  className,
}: ClosingCtaProps) {
  const { ref, live } = useArtLive<HTMLElement>();
  return (
    <section
      ref={ref}
      className={cn("px-4 py-12 sm:px-6 md:py-16 lg:px-8", live && "art-live", className)}
      aria-labelledby="closing-cta-heading"
    >
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-2xl bg-[#02070A] text-white ring-1 ring-white/10">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute inset-x-0 top-0 h-0.5 overflow-hidden bg-gradient-to-r from-primary via-primary/70 to-brand-orange">
            <span className="cta-streak absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-white/90 to-transparent opacity-0" />
          </div>
          <div className="cta-glow absolute inset-0 bg-[radial-gradient(60%_120%_at_100%_0%,rgba(56,182,255,0.18),transparent_60%)]" />
          <div className="cta-glow-alt absolute inset-0 bg-[radial-gradient(40%_90%_at_0%_100%,rgba(252,115,77,0.10),transparent_60%)]" />
          <div className="cta-orbit absolute -right-16 top-1/2 hidden size-72 -translate-y-1/2 rounded-full border border-dashed border-white/10 lg:block" />
        </div>

        <div className="relative flex flex-col gap-6 px-6 py-8 sm:px-8 md:py-9 lg:flex-row lg:items-center lg:justify-between lg:gap-10 lg:px-10">
          <div className="art-rise max-w-2xl">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
              <span className="art-ping size-1.5 rounded-full bg-brand-orange" aria-hidden />
              {eyebrow}
            </p>
            <h2
              id="closing-cta-heading"
              className="mt-2.5 text-balance text-2xl font-extrabold leading-tight tracking-tight md:text-3xl"
            >
              {headline}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/70 md:text-base">{subtext}</p>
            {points.length > 0 ? (
              <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5">
                {points.map((point) => (
                  <li key={point} className="flex items-center gap-1.5 text-xs text-white/65">
                    <Check className="size-3.5 shrink-0 text-primary" strokeWidth={3} aria-hidden />
                    {point}
                  </li>
                ))}
              </ul>
            ) : null}
            {note ? <p className="mt-3 text-xs leading-relaxed text-white/45">{note}</p> : null}
          </div>

          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
            <CtaAnchor
              link={primary}
              className="cta-shine group relative inline-flex h-11 items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#02070A]"
            >
              {primary.label}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </CtaAnchor>
            {secondary ? (
              <CtaAnchor
                link={secondary}
                className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-xl border border-white/25 px-6 text-sm font-semibold text-white transition hover:border-white/50 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                {secondary.label}
              </CtaAnchor>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
