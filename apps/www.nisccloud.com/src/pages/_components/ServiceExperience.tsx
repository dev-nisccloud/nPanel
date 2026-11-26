import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import {
  DomainSearchArt,
  HostingDnsArt,
  HostingOverviewArt,
  MailboxesArt,
  MigrationArt,
  ServerArt,
  SslArt,
  WordPressArt,
} from "@/components/artwork/cloud-art.tsx";
import {
  AdsArt,
  AiEmailBuilderArt,
  BrandKitArt,
  CommerceArt,
  CreativeAssetsArt,
  EmailCampaignArt,
  SeoArt,
  TeamWorkspaceArt,
  ZeepoArt,
} from "@/components/artwork/growth-art.tsx";
import {
  CheckoutArt,
  ContentPlanArt,
  CreativeBriefArt,
  DomainTransferArt,
  HostingFilesArt,
  MailDnsArt,
  NameserversArt,
  QuotationArt,
  SeoAnalyticsArt,
  ServerBackupsArt,
  SocialCalendarArt,
  StoreOrdersArt,
  WebmailArt,
  ZeepoActivityArt,
} from "@/components/artwork/more-art.tsx";
import { ResponsiveSiteArt } from "@/components/artwork/build-art.tsx";

export type ExperienceMode =
  | "terminal"
  | "hosting"
  | "wordpress"
  | "migration"
  | "mail"
  | "collaboration"
  | "search"
  | "commerce"
  | "brand"
  | "marketing"
  | "ai"
  | "domain"
  | "web";

/** Editorial photographs kept for the first block of selected services. */
const photos: Partial<Record<ExperienceMode, [string, string]>> = {
  hosting: ["service-cloud.webp", "Website hosting with domain, email and support"],
  wordpress: ["service-wordpress.webp", "Managed WordPress: build, test and publish"],
  brand: ["goal-brand-reference.webp", "Brand identity design"],
  marketing: ["goal-marketing-reference.webp", "Marketing campaigns"],
  ai: ["goal-ai-reference.webp", "Zepo AI helping a customer"],
};

/** Ordered compositions per service; each block on a page takes the next one. */
function compositions(mode: ExperienceMode, path: string): ReactNode[] {
  switch (mode) {
    case "terminal": {
      const kind = path.includes("vds") ? "vds" : path.includes("dedicated") ? "dedicated" : "vps";
      const host = { vps: "web-01", vds: "app-01", dedicated: "db-01" }[kind];
      return [
        <ServerArt key="o" kind={kind} />,
        <ServerArt key="t" kind={kind} variant={1} />,
        <ServerBackupsArt key="b" host={host} />,
      ];
    }
    case "hosting":
      if (path.includes("ssl")) return [<SslArt key="s" />, <HostingDnsArt key="d" />];
      return [<HostingOverviewArt key="o" />, <HostingDnsArt key="d" />, <HostingFilesArt key="f" />];
    case "wordpress":
      return [<WordPressArt key="w" />, <WordPressArt key="b" variant={1} />, <HostingFilesArt key="f" />];
    case "migration":
      return [
        <MigrationArt key="m" />,
        <HostingFilesArt key="f" />,
        <WordPressArt key="b" variant={1} />,
        <NameserversArt key="n" />,
      ];
    case "mail":
      return [<MailboxesArt key="m" />, <MailDnsArt key="d" />, <WebmailArt key="w" />];
    case "collaboration": {
      const product = path.includes("google") ? "Google Workspace" : "Microsoft 365";
      return [<TeamWorkspaceArt key="t" />, <WebmailArt key="w" />, <MailDnsArt key="d" />, <QuotationArt key="q" product={product} />];
    }
    case "search":
      return [<SeoArt key="s" />, <ContentPlanArt key="c" />, <SeoAnalyticsArt key="a" />];
    case "commerce":
      return [<CommerceArt key="c" />, <CheckoutArt key="k" />, <StoreOrdersArt key="o" />];
    case "brand":
      return [<BrandKitArt key="b" />, <CreativeBriefArt key="r" />, <CreativeAssetsArt key="a" />];
    case "marketing":
      if (path.includes("email-marketing"))
        return [<EmailCampaignArt key="e" />, <AiEmailBuilderArt key="a" />, <EmailCampaignArt key="r" variant={1} />];
      if (path.includes("social"))
        return [<SocialCalendarArt key="s" />, <AdsArt key="a" social />, <CreativeAssetsArt key="c" />];
      return [<AdsArt key="a" />, <CreativeBriefArt key="b" />, <CreativeAssetsArt key="c" />];
    case "ai":
      return [<ZeepoArt key="c" />, <ZeepoArt key="g" variant={1} />, <ZeepoActivityArt key="a" />];
    case "domain":
      return [<DomainSearchArt key="s" />, <DomainTransferArt key="t" />, <NameserversArt key="n" />];
    case "web":
      return [<ResponsiveSiteArt key="w" />, <CreativeBriefArt key="r" />, <CommerceArt key="c" />];
  }
}

/** Product-led illustration for a service feature block. */
export function ServiceExperience({
  mode,
  photo = false,
  variant = 0,
}: {
  mode: ExperienceMode;
  photo?: boolean;
  variant?: number;
}) {
  const { pathname } = useLocation();
  const image = pathname.includes("ssl") ? undefined : photos[mode];
  if (photo && image) {
    return (
      <figure className="mx-auto max-w-[560px] overflow-hidden rounded-2xl bg-white">
        <img
          src={`/artwork/${image[0]}`}
          alt={image[1]}
          width="1536"
          height="1024"
          loading="lazy"
          decoding="async"
          className="aspect-[3/2] w-full object-contain"
        />
      </figure>
    );
  }
  const options = compositions(mode, pathname);
  const slot = image && variant > 0 ? variant - 1 : variant;
  return (
    <div className="mx-auto w-full max-w-[600px]">
      {options[slot % options.length]}
    </div>
  );
}
