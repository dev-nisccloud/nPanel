"use client";

import { captureEvent } from "@/lib/posthog";

import * as React from "react";
import { Plus, RefreshCw, Globe, FilePlus2, Link2, ArrowRightLeft } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { ViewDetailsButton, VisitSiteButton } from "@/components/ui/list-row-actions";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { type DomainPortfolio } from "./agency.domains-portfolio/_components/domain-portfolio-card";
import { CreateSubscriptionFromDomainDialog } from "./agency.domains-portfolio/_components/create-subscription-from-domain-dialog";
import { LinkKenicDomainToTeamDialog } from "./agency.domains-portfolio/_components/link-kenic-domain-to-team-dialog";
import { EmptyState } from "./agency.domains-portfolio/_components/empty-state";
import {
  DomainListTitle,
  DomainSourceBadge,
  DomainStatusBadge,
  DomainsPortfolioList,
  formatDomainDate,
} from "@/components/domains/domains-portfolio-list";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { trpc } from "@/utils/trpc";

/** Unified domain record used across both OpenProvider and KENIC sources. */
type DomainPortfolioWithSource = DomainPortfolio & {
  source: "openprovider" | "kenic";
};

function toNumericId(id: string | number) {
  return typeof id === "string" ? Number.parseInt(id, 10) : id;
}

export default function DomainsPortfolioPage() {
  React.useEffect(() => {
    captureEvent("domain_portfolio_viewed", { user_type: "agency" });
  }, []);

  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [limit] = React.useState(100);
  const [offset] = React.useState(0);
  const [createSubscriptionDomain, setCreateSubscriptionDomain] =
    React.useState<DomainPortfolio | null>(null);
  const [linkToTeamDomain, setLinkToTeamDomain] = React.useState<DomainPortfolio | null>(null);

  const {
    data: opData,
    isLoading: opLoading,
    error: opError,
    refetch: opRefetch,
  } = trpc.openProvider.domains.list.useQuery(
    {
      limit,
      offset,
      with_customer_info: false,
    },
    {
      placeholderData: (prev) => prev,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
  );

  const {
    data: kenicData,
    isLoading: kenicLoading,
    error: kenicError,
    refetch: kenicRefetch,
  } = trpc.kenic.domainList.list.useQuery(
    {},
    {
      placeholderData: (prev) => prev,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
  );

  const isLoading = opLoading || kenicLoading;

  const handleRefresh = () => {
    opRefetch();
    kenicRefetch();
  };

  const allDomains = React.useMemo<DomainPortfolioWithSource[]>(() => {
    const normalize = (name: string) => name.trim().toLowerCase().replace(/\.$/, "");

    const kenicDomains = ((kenicData?.data ?? []) as DomainPortfolio[]).map((d) => ({
      ...d,
      source: "kenic" as const,
    }));

    const kenicNames = new Set(kenicDomains.map((d) => normalize(d.domain)));

    const opDomains = ((opData?.data ?? []) as DomainPortfolio[])
      .filter((d) => {
        const name = normalize(d.domain);
        if (name.endsWith(".ke") && kenicNames.has(name)) return false;
        return true;
      })
      .map((d) => ({
        ...d,
        source: "openprovider" as const,
      }));

    return [...opDomains, ...kenicDomains];
  }, [opData?.data, kenicData?.data]);

  const filteredDomains = React.useMemo<DomainPortfolioWithSource[]>(() => {
    if (!searchQuery.trim()) return allDomains;
    const query = searchQuery.toLowerCase().trim();
    return allDomains.filter(
      (d) =>
        d.domain.toLowerCase().includes(query) ||
        d.clientName.toLowerCase().includes(query) ||
        (d.clientEmail && d.clientEmail.toLowerCase().includes(query)) ||
        d.status.toLowerCase().includes(query) ||
        d.tld.toLowerCase().includes(query) ||
        d.source.toLowerCase().includes(query) ||
        (query === "op" && d.source === "openprovider") ||
        (query === "kc" && d.source === "kenic"),
    );
  }, [allDomains, searchQuery]);

  const openProviderIds = React.useMemo(() => {
    return filteredDomains
      .filter((d) => d.source === "openprovider")
      .map((d) => toNumericId(d.id))
      .filter((id) => !Number.isNaN(id));
  }, [filteredDomains]);

  const { data: openProviderIdsWithSubscriptions = [] } =
    trpc.clientSubscriptions.getOpenProviderIdsWithSubscriptions.useQuery(
      { openProviderIds },
      { enabled: openProviderIds.length > 0 },
    );

  const openProviderIdsWithSubscriptionsSet = React.useMemo(
    () => new Set(openProviderIdsWithSubscriptions),
    [openProviderIdsWithSubscriptions],
  );

  const hasOpError = !!opError;
  const hasKenicError = !!kenicError;

  if (hasOpError && hasKenicError) {
    return (
      <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
        <div className="w-full max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-destructive mb-4">Failed to load domains portfolio</p>
            <Button onClick={handleRefresh} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const items = filteredDomains.map((domain) => {
    const numericId = toNumericId(domain.id);
    const hasLinkedSubscription =
      domain.source === "openprovider" &&
      openProviderIdsWithSubscriptionsSet.has(numericId);
    const expiry = formatDomainDate(domain.expiryDate);
    const detailHref = `/agency/domains-portfolio/${domain.id}`;

    return {
      key: String(domain.id),
      title: (
        <Link
          to={detailHref}
          className="text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          <DomainListTitle domain={domain.domain} />
        </Link>
      ),
      trailing: (
        <span className="flex flex-wrap items-center justify-end gap-1.5">
          <DomainSourceBadge source={domain.source} />
          <DomainStatusBadge status={domain.status} />
        </span>
      ),
      description: (
        <p>
          {domain.clientName}
          {domain.clientEmail ? ` · ${domain.clientEmail}` : ""}
          {expiry ? ` · Expires ${expiry}` : ""}
        </p>
      ),
      actions: (() => {
        const showCreate = domain.source === "openprovider";
        const showLink = domain.source === "kenic" && !domain.teamId;

        return (
          <>
            <VisitSiteButton url={domain.domain} />
            <ViewDetailsButton onClick={() => navigate(detailHref)} />
            {showCreate || showLink ? (
              <TooltipProvider delayDuration={300}>
                {showCreate ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 px-2.5 text-xs"
                          disabled={hasLinkedSubscription}
                          onClick={() => {
                            if (!hasLinkedSubscription) {
                              setCreateSubscriptionDomain(domain);
                            }
                          }}
                        >
                          <FilePlus2 className="mr-1 h-3.5 w-3.5" />
                          Create
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      {hasLinkedSubscription
                        ? "This domain already has a connected subscription. To connect you need to first suspend the existing to connect it."
                        : "Create a Nisc subscription for this domain and link it to a user or organization."}
                    </TooltipContent>
                  </Tooltip>
                ) : null}
                {showLink ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs"
                    onClick={() => setLinkToTeamDomain(domain)}
                  >
                    <Link2 className="mr-1 h-3.5 w-3.5" />
                    Link org
                  </Button>
                ) : null}
              </TooltipProvider>
            ) : null}
          </>
        );
      })(),
      onClick: () => navigate(detailHref),
    };
  });

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="mx-auto w-full max-w-7xl space-y-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-base font-semibold tracking-tight">Domains Portfolio</h1>
          <p className="text-xs text-muted-foreground">
            Manage and monitor all domains registered through your agency - OpenProvider
            (international TLDs) and KENIC (.ke and sub-TLDs).
          </p>
        </div>

        {hasOpError && !hasKenicError ? (
          <div className="flex items-center gap-2 rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-xs text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300">
            <span>OpenProvider domains could not be loaded.</span>
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs"
              onClick={() => opRefetch()}
            >
              Retry
            </Button>
          </div>
        ) : null}
        {hasKenicError && !hasOpError ? (
          <div className="flex items-center gap-2 rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-xs text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300">
            <span>KENIC domains could not be loaded.</span>
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs"
              onClick={() => kenicRefetch()}
            >
              Retry
            </Button>
          </div>
        ) : null}

        {!isLoading && allDomains.length > 0 ? (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>
              {allDomains.length} total domain{allDomains.length !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-blue-400" />
              {allDomains.filter((d) => d.source === "openprovider").length} OP
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-orange-400" />
              {allDomains.filter((d) => d.source === "kenic").length} KC
            </span>
          </div>
        ) : null}

        {isLoading && allDomains.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size={32} />
          </div>
        ) : allDomains.length === 0 ? (
          <EmptyState />
        ) : filteredDomains.length === 0 && searchQuery ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Globe className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="mb-2 text-lg font-semibold">No domains found</p>
            <p className="mb-4 text-muted-foreground">
              No domains match your search query &quot;{searchQuery}&quot;.
            </p>
            <Button variant="outline" onClick={() => setSearchQuery("")}>
              Clear Search
            </Button>
          </div>
        ) : (
          <>
            <DomainsPortfolioList
              items={items}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              totalCount={allDomains.length}
              searchPlaceholder="Search by domain, client, status, or source…"
              toolbarActions={
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleRefresh}
                    disabled={isLoading}
                    title="Refresh"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/agency/domain-transfer")}
                  >
                    <ArrowRightLeft className="mr-2 h-4 w-4" />
                    Transfer Domain
                  </Button>
                  <Button onClick={() => navigate("/agency/domains")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Register Domain
                  </Button>
                </>
              }
            />

            {createSubscriptionDomain ? (
              <CreateSubscriptionFromDomainDialog
                open={!!createSubscriptionDomain}
                onOpenChange={(open) => !open && setCreateSubscriptionDomain(null)}
                domain={createSubscriptionDomain}
                onSuccess={() => setCreateSubscriptionDomain(null)}
              />
            ) : null}
            <LinkKenicDomainToTeamDialog
              open={!!linkToTeamDomain}
              onOpenChange={(open) => !open && setLinkToTeamDomain(null)}
              domain={linkToTeamDomain}
              onSuccess={() => setLinkToTeamDomain(null)}
            />
          </>
        )}
      </div>
    </div>
  );
}
