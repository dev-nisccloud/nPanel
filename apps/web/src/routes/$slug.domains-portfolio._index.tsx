"use client";

import { captureEvent } from "@/lib/posthog";

import * as React from "react";
import { Plus, RefreshCw, Globe, ArrowRightLeft } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router";
import { Button } from "@/components/ui/button";
import { ViewDetailsButton, VisitSiteButton } from "@/components/ui/list-row-actions";
import { CleanListCell } from "@/components/ui/clean-list";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { type DomainPortfolio } from "./$slug.domains-portfolio/_components/domain-portfolio-card";
import { EmptyState } from "./$slug.domains-portfolio/_components/empty-state";
import {
  DomainListTitle,
  DomainStatusBadge,
  DomainsPortfolioList,
  formatDomainDate,
} from "@/components/domains/domains-portfolio-list";
import { trpc } from "@/utils/trpc";
import {
  CUSTOMER_DOMAIN_ERROR_MESSAGE,
  sanitizeDomainProviderMessage,
} from "@npanel/api/lib/domain-provider-copy";

/** Map listForTeamDomains item to DomainPortfolio-like shape for list rows. */
function toDisplayItem(sub: {
  id: string;
  subscriptionName: string | null;
  status: string;
  productName: string;
  productPlanName: string | null;
  subscriptionDate: string | null;
  expiryDate: string | null;
  primaryDomain: string | null;
}): DomainPortfolio {
  const domain = sub.primaryDomain ?? sub.subscriptionName ?? sub.productName ?? sub.id;
  return {
    id: sub.id,
    domain,
    status: sub.status as DomainPortfolio["status"],
    registrationDate: sub.subscriptionDate ? new Date(sub.subscriptionDate) : new Date(),
    expiryDate: sub.expiryDate ? new Date(sub.expiryDate) : new Date(),
    clientName: "-",
    clientEmail: undefined,
    tld: "",
    autoRenewal: false,
    nameservers: [],
  };
}

export default function DomainsPortfolioPage() {
  React.useEffect(() => {
    captureEvent("domain_portfolio_viewed", { user_type: "customer" });
  }, []);

  const navigate = useNavigate();
  const { pathname } = useLocation();
  const teamSlug = pathname.split("/")[1] ?? "";

  const [searchQuery, setSearchQuery] = React.useState("");

  const {
    data: subscriptions = [],
    isLoading,
    error,
    refetch,
  } = trpc.clientSubscriptions.listForTeamDomains.useQuery(
    { teamSlug },
    { enabled: !!teamSlug },
  );

  const displayItems = React.useMemo(() => subscriptions.map(toDisplayItem), [subscriptions]);

  const filteredDomains = React.useMemo(() => {
    if (!searchQuery.trim()) return displayItems;
    const query = searchQuery.toLowerCase().trim();
    return displayItems.filter(
      (d) =>
        d.domain.toLowerCase().includes(query) ||
        d.status.toLowerCase().includes(query) ||
        (d.clientName && d.clientName.toLowerCase().includes(query)),
    );
  }, [displayItems, searchQuery]);

  if (error) {
    return (
      <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
        <div className="mx-auto w-full max-w-7xl">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="mb-4 text-destructive">
              {sanitizeDomainProviderMessage(error.message, "customer") ||
                error.message ||
                CUSTOMER_DOMAIN_ERROR_MESSAGE}
            </p>
            <Button onClick={() => refetch()} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const items = filteredDomains.map((item) => {
    const detailHref = `/${teamSlug}/domains-portfolio/${item.id}`;
    const subscribed = formatDomainDate(item.registrationDate);
    const expires = formatDomainDate(item.expiryDate);

    return {
      key: item.id,
      title: (
        <Link
          to={detailHref}
          className="text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          <DomainListTitle domain={item.domain} />
        </Link>
      ),
      cells: {
        dates: (
          <CleanListCell>
            {subscribed || expires
              ? `${subscribed ? `Subscribed ${subscribed}` : ""}${subscribed && expires ? " · " : ""}${expires ? `Expires ${expires}` : ""}`
              : ""}
          </CleanListCell>
        ),
        status: <DomainStatusBadge status={item.status} />,
      },
      actions: (
        <>
          <VisitSiteButton url={item.domain} />
          <ViewDetailsButton onClick={() => navigate(detailHref)} />
        </>
      ),
      onClick: () => navigate(detailHref),
    };
  });

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="mx-auto w-full max-w-7xl space-y-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-base font-semibold tracking-tight">My Domains</h1>
          <p className="text-xs text-muted-foreground">
            Domain subscriptions for this organization. View status and details.
          </p>
        </div>

        {isLoading && subscriptions.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size={32} />
          </div>
        ) : displayItems.length === 0 ? (
          <EmptyState teamSlug={teamSlug} />
        ) : filteredDomains.length === 0 && searchQuery ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Globe className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="mb-2 text-lg font-semibold">No domains found</p>
            <p className="mb-4 text-muted-foreground">
              No domains match your search &quot;{searchQuery}&quot;.
            </p>
            <Button variant="outline" onClick={() => setSearchQuery("")}>
              Clear Search
            </Button>
          </div>
        ) : (
          <DomainsPortfolioList
            items={items}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            totalCount={displayItems.length}
            searchPlaceholder="Search by name or status..."
            columns={[
              { key: "name", label: "Domain" },
              { key: "dates", label: "Dates", className: "min-w-0 flex-1", hideBelow: "@lg" },
              { key: "status", label: "Status", className: "w-28 shrink-0", hideBelow: "@xl" },
              { key: "actions", label: "Actions", align: "end" },
            ]}
            toolbarActions={
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => refetch()}
                  disabled={isLoading}
                  title="Refresh"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/${teamSlug}/domain-transfer`)}
                >
                  <ArrowRightLeft className="mr-2 h-4 w-4" />
                  Transfer Domain
                </Button>
                <Button onClick={() => navigate(`/${teamSlug}/domains`)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Get a Domain
                </Button>
              </>
            }
          />
        )}
      </div>
    </div>
  );
}
