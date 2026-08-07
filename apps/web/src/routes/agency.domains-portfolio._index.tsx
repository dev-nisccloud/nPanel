"use client";

import { captureEvent } from "@/lib/posthog";

import * as React from "react";
import { Plus, RefreshCw, Search, Globe, EllipsisVertical, FilePlus2, Link2 } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { type DomainPortfolio } from "./agency.domains-portfolio/_components/domain-portfolio-card";
import { CreateSubscriptionFromDomainDialog } from "./agency.domains-portfolio/_components/create-subscription-from-domain-dialog";
import { LinkKenicDomainToTeamDialog } from "./agency.domains-portfolio/_components/link-kenic-domain-to-team-dialog";
import { EmptyState } from "./agency.domains-portfolio/_components/empty-state";
import { trpc } from "@/utils/trpc";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

/** Unified domain record used across both OpenProvider and KENIC sources. */
type DomainPortfolioWithSource = DomainPortfolio & {
  /** Identifies which provider registered this domain. */
  source: "openprovider" | "kenic";
};

export default function DomainsPortfolioPage() {
  React.useEffect(() => {
    captureEvent("domain_portfolio_viewed", { user_type: "agency" });
  }, []);

  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [limit] = React.useState(100);
  const [offset, setOffset] = React.useState(0);
  const [createSubscriptionDomain, setCreateSubscriptionDomain] = React.useState<DomainPortfolio | null>(null);
  const [linkToTeamDomain, setLinkToTeamDomain] = React.useState<DomainPortfolio | null>(null);

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  // ── OpenProvider domains ────────────────────────────────────────────────────
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

  // ── KENIC domains ───────────────────────────────────────────────────────────
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

  // ── Merge both sources (dedupe by FQDN; prefer KENIC for *.ke) ───────────────
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
        // Avoid cross-source duplicates when the same .ke domain exists in both lists
        if (name.endsWith(".ke") && kenicNames.has(name)) return false;
        return true;
      })
      .map((d) => ({
        ...d,
        source: "openprovider" as const,
      }));

    return [...opDomains, ...kenicDomains];
  }, [opData?.data, kenicData?.data]);

  // ── Filter by search query ──────────────────────────────────────────────────
  const filteredDomains = React.useMemo<DomainPortfolioWithSource[]>(() => {
    if (!searchQuery.trim()) return allDomains;
    const query = searchQuery.toLowerCase().trim();
    return allDomains.filter((d) =>
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

  // ── OpenProvider subscription check (only for OP domains) ──────────────────
  const openProviderIds = React.useMemo(() => {
    return filteredDomains
      .filter((d) => d.source === "openprovider")
      .map((d) => (typeof d.id === "string" ? Number.parseInt(d.id, 10) : d.id))
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

  // ── Status badge helper ─────────────────────────────────────────────────────
  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      ACTIVE: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
      PENDING: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300",
      EXPIRED: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",
      SUSPENDED: "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300",
      TRANSFERRING: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300",
    };
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      ACTIVE: "default",
      PENDING: "secondary",
      EXPIRED: "destructive",
      SUSPENDED: "outline",
      TRANSFERRING: "secondary",
    };
    return (
      <Badge
        variant={variants[status] || "secondary"}
        className={`text-xs ${statusColors[status] || ""}`}
      >
        {status}
      </Badge>
    );
  };

  /** Source badge: short registry codes (OP = OpenProvider, KC = KENIC). */
  const getSourceBadge = (source: "openprovider" | "kenic") => {
    if (source === "kenic") {
      return (
        <Badge
          variant="outline"
          className="text-xs border-orange-300 text-orange-700 dark:border-orange-600 dark:text-orange-400"
          title="KENIC"
        >
          KC
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="text-xs border-blue-300 text-blue-700 dark:border-blue-600 dark:text-blue-400"
        title="OpenProvider"
      >
        OP
      </Badge>
    );
  };

  // ── Table view ──────────────────────────────────────────────────────────────
  const TableView = () => (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-6">Domain Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Expiry Date</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredDomains.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No domains found
              </TableCell>
            </TableRow>
          ) : (
            filteredDomains.map((domain) => (
              <TableRow
                key={domain.id}
                className="cursor-pointer"
                onClick={() => handleNavigation(`/agency/domains-portfolio/${domain.id}`)}
              >
                <TableCell className="pl-6">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{domain.domain}</span>
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(domain.status)}</TableCell>
                <TableCell>{getSourceBadge(domain.source)}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div className="font-medium">{domain.clientName}</div>
                    {domain.clientEmail && (
                      <div className="text-muted-foreground text-xs">{domain.clientEmail}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">
                    {new Date(domain.expiryDate).toLocaleDateString()}
                  </span>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0" size="icon">
                              <EllipsisVertical className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={() => handleNavigation(`/agency/domains-portfolio/${domain.id}`)}
                            >
                              <Globe className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {/* Create subscription is only available for OpenProvider domains */}
                            {domain.source === "openprovider" && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="block w-full">
                                    <DropdownMenuItem
                                      onClick={() => {
                                        const id =
                                          typeof domain.id === "string"
                                            ? Number.parseInt(domain.id, 10)
                                            : domain.id;
                                        if (!openProviderIdsWithSubscriptionsSet.has(id)) {
                                          setCreateSubscriptionDomain(domain);
                                        }
                                      }}
                                      disabled={openProviderIdsWithSubscriptionsSet.has(
                                        typeof domain.id === "string"
                                          ? Number.parseInt(domain.id, 10)
                                          : domain.id,
                                      )}
                                    >
                                      <FilePlus2 className="mr-2 h-4 w-4" />
                                      Create subscription
                                    </DropdownMenuItem>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="left" className="max-w-xs">
                                  {openProviderIdsWithSubscriptionsSet.has(
                                    typeof domain.id === "string"
                                      ? Number.parseInt(domain.id, 10)
                                      : domain.id,
                                  )
                                    ? "This domain already has a connected subscription. To connect you need to first suspend the existing to connect it."
                                    : "Create a Nisc subscription for this domain and link it to a user or organization."}
                                </TooltipContent>
                              </Tooltip>
                            )}
                            {/* KENIC domains already have a subscription  link missing teamId */}
                            {domain.source === "kenic" && !domain.teamId && (
                              <DropdownMenuItem onClick={() => setLinkToTeamDomain(domain)}>
                                <Link2 className="mr-2 h-4 w-4" />
                                Link to organization
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Actions</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  // ── Error state (show partial errors inline, not a full-page block) ─────────
  const hasOpError = !!opError;
  const hasKenicError = !!kenicError;

  // If both fail, show a combined error page
  if (hasOpError && hasKenicError) {
    return (
      <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
        <div className="w-full max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-destructive mb-4">
              Failed to load domains portfolio
            </p>
            <Button onClick={handleRefresh} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex flex-col gap-2">
          <h1 className="text-base font-semibold tracking-tight">Domains Portfolio</h1>
          <p className="text-xs text-muted-foreground">
            Manage and monitor all domains registered through your agency - OpenProvider (international TLDs) and KENIC (.ke and sub-TLDs).
          </p>
        </div>

        {/* Partial source errors */}
        {hasOpError && !hasKenicError && (
          <div className="flex items-center gap-2 rounded-md border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-2 text-xs text-yellow-800 dark:text-yellow-300">
            <span>OpenProvider domains could not be loaded.</span>
            <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => opRefetch()}>
              Retry
            </Button>
          </div>
        )}
        {hasKenicError && !hasOpError && (
          <div className="flex items-center gap-2 rounded-md border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-2 text-xs text-yellow-800 dark:text-yellow-300">
            <span>KENIC domains could not be loaded.</span>
            <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => kenicRefetch()}>
              Retry
            </Button>
          </div>
        )}

        {/* Search, Refresh, and Actions */}
        <div className="mt-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by domain, client, status, or source…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isLoading}
                title="Refresh"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
              <Button onClick={() => navigate("/agency/domains")}>
                <Plus className="mr-2 h-4 w-4" />
                Register Domain
              </Button>
            </div>
          </div>
        </div>

        {/* Domain count summary */}
        {!isLoading && allDomains.length > 0 && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{allDomains.length} total domain{allDomains.length !== 1 ? "s" : ""}</span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-blue-400 inline-block" />
              {allDomains.filter((d) => d.source === "openprovider").length} OP
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-orange-400 inline-block" />
              {allDomains.filter((d) => d.source === "kenic").length} KC
            </span>
          </div>
        )}

        <div className="mt-2">
          {isLoading && allDomains.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size={32} />
            </div>
          ) : allDomains.length === 0 ? (
            <EmptyState />
          ) : filteredDomains.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Globe className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold mb-2">No domains found</p>
              <p className="text-muted-foreground mb-4">
                No domains match your search query "{searchQuery}".
              </p>
              <Button variant="outline" onClick={() => setSearchQuery("")}>
                Clear Search
              </Button>
            </div>
          ) : (
            <>
              <TableView />
              {createSubscriptionDomain && (
                <CreateSubscriptionFromDomainDialog
                  open={!!createSubscriptionDomain}
                  onOpenChange={(open) => !open && setCreateSubscriptionDomain(null)}
                  domain={createSubscriptionDomain}
                  onSuccess={() => setCreateSubscriptionDomain(null)}
                />
              )}
              <LinkKenicDomainToTeamDialog
                open={!!linkToTeamDomain}
                onOpenChange={(open) => !open && setLinkToTeamDomain(null)}
                domain={linkToTeamDomain}
                onSuccess={() => setLinkToTeamDomain(null)}
              />
              {filteredDomains.length < allDomains.length && (
                <div className="text-center text-sm text-muted-foreground">
                  Showing {filteredDomains.length} of {allDomains.length} domains
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
