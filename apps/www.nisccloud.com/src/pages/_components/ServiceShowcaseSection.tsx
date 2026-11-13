import { ServiceExperience, type ExperienceMode } from "./ServiceExperience";
import { useLocation } from "react-router-dom";
/**
 * Alternating content + Quiet Stage visual panels under "What You Get".
 */

import type { ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import type { VisualTheme } from "@/components/shadcn-space/blocks/built-different-01/visual-context.ts";
import {
  HostingFlagshipArt,
  SeoFlagshipArt,
} from "@/components/artwork/flagship-art.tsx";
import { CodePipelineArt, MobileFlowArt } from "@/components/artwork/build-art.tsx";
import {
  HostingSupportArt,
  MigrationArt,
  SslArt,
} from "@/components/artwork/cloud-art.tsx";
import {
  SeoAnalyticsArt,
  ZeepoActivityArt,
  CheckoutArt,
  CreativeBriefArt,
} from "@/components/artwork/more-art.tsx";
import {
  NpanelBusinessArt,
  NpanelOperationsArt,
} from "@/components/artwork/npanel-art.tsx";
import {
  TeamWorkspaceArt,
  BrandKitArt,
  ZeepoArt,
  AdsArt,
} from "@/components/artwork/growth-art.tsx";

/**
 * Approved artwork for the legacy `visual` theme keys still used by
 * `/services` and `/about` feature blocks. The old `showcase-stages` themes
 * had drifted from the brand system; this keeps the data shape intact while
 * rendering the same artwork language as the rest of the site.
 */
const THEME_ARTWORK: Partial<Record<VisualTheme, () => ReactNode>> = {
  brand: () => <BrandKitArt />,
  craft: () => <CreativeBriefArt />,
  uptime: () => <HostingFlagshipArt />,
  speed: () => <HostingFlagshipArt />,
  security: () => <SslArt />,
  migration: () => <MigrationArt />,
  support: () => <HostingSupportArt />,
  trust: () => <TeamWorkspaceArt />,
  process: () => <NpanelOperationsArt />,
  clarity: () => <NpanelBusinessArt />,
  growth: () => <SeoFlagshipArt />,
  reporting: () => <SeoAnalyticsArt />,
  results: () => <SeoAnalyticsArt />,
  targeting: () => <AdsArt />,
  automation: () => <ZeepoActivityArt />,
  bot: () => <ZeepoArt />,
  payment: () => <CheckoutArt />,
  mobile: () => <MobileFlowArt />,
  code: () => <CodePipelineArt />,
};

export type ShowcaseVisualKind = "concept-illustration" | "npanel-product-view";

function OperationalProofVisual({
  children,
  kind = "concept-illustration",
  caption,
  className,
}: {
  children: ReactNode;
  kind?: ShowcaseVisualKind;
  caption?: ReactNode | false;
  className?: string;
}) {
  return (
    <figure
      className={cn("w-full", className)}
      data-showcase-visual-kind={kind}
    >
      <div>{children}</div>
      {caption !== false && caption != null && (
        <figcaption className="mt-3 text-center text-xs text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

export type ShowcaseBlock = {
  /** Optional section label  not rendered (kept for existing page data). */
  tag?: string;
  artwork?: ReactNode;
  /**
   * Defaults to concept artwork. Use `npanel-product-view` only for a
   * verified screenshot of the real nPanel interface.
   */
  visualKind?: ShowcaseVisualKind;
  /** Set to false when the supplied artwork already carries its own disclosure. */
  caption?: ReactNode | false;
  id?: string;
  headline: string;
  body: string;
  bullets: string[];
  /** Themed stage shown opposite the copy */
  visual: VisualTheme;
  /** When true the visual sits on the right */
  visualRight?: boolean;
  /** @deprecated Use visualRight */
  mockupRight?: boolean;
};

type Props = {
  blocks: ShowcaseBlock[];
  className?: string;
};

export function ShowcaseVisualCard({
  visual,
  headline,
  className,
  visualKind = "concept-illustration",
}: {
  visual: VisualTheme;
  headline: string;
  className?: string;
  visualKind?: ShowcaseVisualKind;
}) {
  const render = THEME_ARTWORK[visual] ?? THEME_ARTWORK.clarity!;
  return (
    <OperationalProofVisual
      kind={visualKind}
      className={className}
      caption={false}
    >
      <div className="w-full" data-showcase-headline={headline}>
        {render()}
      </div>
    </OperationalProofVisual>
  );
}

function Block({ block, index }: { block: ShowcaseBlock; index: number }) {
  const { pathname } = useLocation();
  const mode: ExperienceMode =
    pathname.includes("vps") ||
    pathname.includes("dedicated") ||
    pathname.includes("vds")
      ? "terminal"
      : pathname.includes("wordpress")
        ? "wordpress"
        : pathname.includes("transfer")
          ? "migration"
          : pathname.includes("email-marketing")
            ? "marketing"
            : pathname.includes("email")
              ? "mail"
              : pathname.includes("brand")
                ? "brand"
                : pathname.includes("ecommerce")
                  ? "commerce"
                  : pathname.includes("seo")
                    ? "search"
                    : pathname.includes("zeepo")
                      ? "ai"
                      : pathname.includes("social") ||
                          pathname.includes("paid-ads")
                        ? "marketing"
                        : pathname.includes("domain")
                          ? "domain"
                          : pathname.includes("website-design")
                            ? "web"
                            : "hosting";

  const right =
    block.visualRight !== undefined
      ? block.visualRight
      : block.mockupRight !== undefined
        ? block.mockupRight
        : index % 2 === 0;

  const text = (
    <div className="flex flex-col justify-center">
      <h3 className="type-h2 mb-4 text-balance">
        {block.headline}
      </h3>
      <p className="mb-6 text-base leading-relaxed text-muted-foreground">
        {block.body}
      </p>
      <ul className="space-y-2.5">
        {block.bullets.map((b) => (
          <li
            key={b}
            className="flex items-start gap-3 text-base text-muted-foreground"
          >
            <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-primary" />
            {b}
          </li>
        ))}
      </ul>
    </div>
  );

  const visualPanel = (
    <OperationalProofVisual
      kind={block.visualKind}
      caption={block.caption}
    >
      {block.artwork ?? (
        <ServiceExperience mode={mode} photo={index === 0} variant={index} />
      )}
    </OperationalProofVisual>
  );

  return (
    <div
      id={block.id}
      className="grid scroll-mt-28 items-center gap-12 md:grid-cols-2 md:gap-16 [&>*]:min-w-0"
    >
      {right ? (
        <>
          {text}
          {visualPanel}
        </>
      ) : (
        <>
          {visualPanel}
          {text}
        </>
      )}
    </div>
  );
}

export default function ServiceShowcaseSection({ blocks, className }: Props) {
  return (
    <section
      className={cn(
        "mx-auto max-w-7xl space-y-20 px-4 pb-20 pt-6 md:space-y-24 md:px-8",
        className,
      )}
    >
      {blocks.map((b, i) => (
        <Block key={`${b.headline}-${i}`} block={b} index={i} />
      ))}
    </section>
  );
}
