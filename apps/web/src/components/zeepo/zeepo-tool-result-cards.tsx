"use client";

import { ZeepoDomainPurchaseCard } from "@/components/zeepo/domain-purchase-card";
import { ZeepoHostingPlansCard } from "@/components/zeepo/hosting-plans-card";
import { ZeepoCloudPlansCard } from "@/components/zeepo/cloud-plans-card";
import { ZeepoCloudServersCard } from "@/components/zeepo/cloud-servers-card";
import { ZeepoDomainsPortfolioCard } from "@/components/zeepo/domains-portfolio-card";
import { ZeepoDomainDetailCard } from "@/components/zeepo/domain-detail-card";
import { ZeepoHostingResourcesCard } from "@/components/zeepo/hosting-resources-card";
import { ZeepoHostingDetailCard } from "@/components/zeepo/hosting-detail-card";
import { ZeepoWordPressSitesCard } from "@/components/zeepo/wordpress-sites-card";
import { ZeepoSupportTicketCard, parseSupportTicketResult } from "@/components/zeepo/zeepo-support-ticket-card";
import type {
  AgentDomainCheckResult,
  AgentHostingPlansResult,
  AgentCloudPlansResult,
  AgentCloudServersResult,
  AgentDomainsPortfolioResult,
  AgentDomainDetailResult,
  AgentHostingResourcesResult,
  AgentHostingDetailResult,
  AgentWordPressSitesResult,
} from "@/stores/zeepo-payment-store";

function asObject(payload: unknown): Record<string, unknown> | null {
  if (payload == null) return null;
  if (typeof payload === "string") {
    try {
      const o = JSON.parse(payload) as unknown;
      if (o && typeof o === "object" && !Array.isArray(o)) {
        return o as Record<string, unknown>;
      }
    } catch {
      return null;
    }
    return null;
  }
  if (typeof payload === "object" && !Array.isArray(payload)) {
    return payload as Record<string, unknown>;
  }
  return null;
}

export function parseDomainCheckResult(
  payload: unknown,
): AgentDomainCheckResult | null {
  const o = asObject(payload);
  if (o?._tool === "check_domain_availability") {
    return o as unknown as AgentDomainCheckResult;
  }
  return null;
}

export function parseHostingPlansResult(
  payload: unknown,
): AgentHostingPlansResult | null {
  const o = asObject(payload);
  if (
    o?._tool === "get_web_hosting_plans" ||
    o?._tool === "get_email_hosting_plans" ||
    o?._tool === "get_wordpress_hosting_plans"
  ) {
    return o as unknown as AgentHostingPlansResult;
  }
  return null;
}

export function parseCloudPlansResult(
  payload: unknown,
): AgentCloudPlansResult | null {
  const o = asObject(payload);
  if (
    o?._tool === "get_vps_plans" ||
    o?._tool === "get_vds_plans" ||
    o?._tool === "get_dedicated_server_plans"
  ) {
    return o as unknown as AgentCloudPlansResult;
  }
  return null;
}

export function parseCloudServersResult(
  payload: unknown,
): AgentCloudServersResult | null {
  const o = asObject(payload);
  if (o?._tool === "get_cloud_servers") {
    return o as unknown as AgentCloudServersResult;
  }
  return null;
}

export function parseDomainsPortfolioResult(
  payload: unknown,
): AgentDomainsPortfolioResult | null {
  const o = asObject(payload);
  if (o?._tool === "get_domains_portfolio") {
    return o as unknown as AgentDomainsPortfolioResult;
  }
  return null;
}

export function parseDomainDetailResult(
  payload: unknown,
): AgentDomainDetailResult | null {
  const o = asObject(payload);
  if (o?._tool === "get_domain_detail") {
    return o as unknown as AgentDomainDetailResult;
  }
  return null;
}

export function parseHostingResourcesResult(
  payload: unknown,
): AgentHostingResourcesResult | null {
  const o = asObject(payload);
  if (o?._tool === "get_hosting_resources") {
    return o as unknown as AgentHostingResourcesResult;
  }
  return null;
}

export function parseHostingDetailResult(
  payload: unknown,
): AgentHostingDetailResult | null {
  const o = asObject(payload);
  if (o?._tool === "get_hosting_detail") {
    return o as unknown as AgentHostingDetailResult;
  }
  return null;
}

export function parseWordPressSitesResult(
  payload: unknown,
): AgentWordPressSitesResult | null {
  const o = asObject(payload);
  if (o?._tool === "get_wordpress_sites") {
    return o as unknown as AgentWordPressSitesResult;
  }
  return null;
}

/** True when a tool payload should render a purchase/portfolio/plans card. */
export function hasRenderableZeepoToolCard(payload: unknown): boolean {
  return Boolean(
    parseDomainCheckResult(payload) ||
      parseHostingPlansResult(payload) ||
      parseCloudPlansResult(payload) ||
      parseCloudServersResult(payload) ||
      parseDomainsPortfolioResult(payload) ||
      parseDomainDetailResult(payload) ||
      parseHostingResourcesResult(payload) ||
      parseHostingDetailResult(payload) ||
      parseWordPressSitesResult(payload),
  );
}

/**
 * Renders the matching Zeepo purchase/ops card for a tool result payload.
 * Returns null when the payload is not a known card-backed tool.
 */
export function ZeepoToolResultCard({
  result,
  hideNestedWordpress = false,
  onViewTicket,
}: {
  result: unknown;
  hideNestedWordpress?: boolean;
  onViewTicket?: (ticketId: string) => void;
}) {
  const ticketResult = parseSupportTicketResult(result);
  if (ticketResult) return <ZeepoSupportTicketCard result={result} onViewTicket={onViewTicket} />;
  const domainResult = parseDomainCheckResult(result);
  if (domainResult) return <ZeepoDomainPurchaseCard result={domainResult} />;

  const hostingResult = parseHostingPlansResult(result);
  if (hostingResult) return <ZeepoHostingPlansCard result={hostingResult} />;

  const cloudPlansResult = parseCloudPlansResult(result);
  if (cloudPlansResult) return <ZeepoCloudPlansCard result={cloudPlansResult} />;

  const cloudServersResult = parseCloudServersResult(result);
  if (cloudServersResult) return <ZeepoCloudServersCard result={cloudServersResult} />;

  const portfolioResult = parseDomainsPortfolioResult(result);
  if (portfolioResult) return <ZeepoDomainsPortfolioCard result={portfolioResult} />;

  const domainDetailResult = parseDomainDetailResult(result);
  if (domainDetailResult) return <ZeepoDomainDetailCard result={domainDetailResult} />;

  const nestedWp =
    !hideNestedWordpress &&
    result &&
    typeof result === "object" &&
    "wordpressSites" in result
      ? parseWordPressSitesResult(
          (result as { wordpressSites?: unknown }).wordpressSites,
        )
      : null;

  const hostingResourcesResult = parseHostingResourcesResult(result);
  if (hostingResourcesResult) {
    return (
      <>
        <ZeepoHostingResourcesCard result={hostingResourcesResult} />
        {nestedWp ? (
          <div className="mt-3">
            <ZeepoWordPressSitesCard result={nestedWp} />
          </div>
        ) : null}
      </>
    );
  }

  const hostingDetailResult = parseHostingDetailResult(result);
  if (hostingDetailResult) {
    return (
      <>
        <ZeepoHostingDetailCard result={hostingDetailResult} />
        {nestedWp ? (
          <div className="mt-3">
            <ZeepoWordPressSitesCard result={nestedWp} />
          </div>
        ) : null}
      </>
    );
  }

  const wordpressSitesResult = parseWordPressSitesResult(result);
  if (wordpressSitesResult) return <ZeepoWordPressSitesCard result={wordpressSitesResult} />;

  return null;
}

export function ZeepoToolResultCards({
  results,
  onViewTicket,
}: {
  results: Array<{ toolUseId?: string; toolName?: string; result: unknown }>;
  onViewTicket?: (ticketId: string) => void;
}) {
  const hasStandaloneWordpress = results.some((r) => parseWordPressSitesResult(r.result));
  const cards = results
    .map((r, i) => {
      const card = (
        <ZeepoToolResultCard
          result={r.result}
          hideNestedWordpress={hasStandaloneWordpress}
          onViewTicket={onViewTicket}
        />
      );
      if (!card) return null;
      return (
        <div key={r.toolUseId ?? `${r.toolName ?? "tool"}-${i}`} className="mt-3">
          {card}
        </div>
      );
    })
    .filter(Boolean);

  if (cards.length === 0) return null;
  return <div className="flex flex-col gap-3">{cards}</div>;
}
