"use client";

import * as React from "react";
import { Plus, RefreshCw, Search, Globe, Grid3X3, List, EllipsisVertical, FilePlus2 } from "lucide-react";
import { useNavigate } from "react-router";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { DomainPortfolioCardsList, type DomainPortfolio } from "./agency.domains-portfolio/_components/domain-portfolio-card";
import { CreateSubscriptionFromDomainDialog } from "./agency.domains-portfolio/_components/create-subscription-from-domain-dialog";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

export default function DomainsPortfolioPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [limit] = React.useState(100);
  const [offset, setOffset] = React.useState(0);
  const [viewMode, setViewMode] = React.useState<"card" | "table">("table");
  const [createSubscriptionDomain, setCreateSubscriptionDomain] = React.useState<DomainPortfolio | null>(null);

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  // Fetch domains from OpenProvider
  const {
    data: domainsData,
    isLoading,
    error,
    refetch
  } = trpc.openProvider.domains.list.useQuery(
    {
      limit,
      offset,
      with_customer_info: false, // Set to true when customer info fetching is implemented
    },
    {
      // Keep previous data while refetching to prevent UI freezing
      placeholderData: (previousData) => previousData,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    }
  );

  const handleRefresh = () => {
    refetch();
  };

  // Filter domains based on search query
  const filteredDomains = React.useMemo(() => {
    const domains = (domainsData?.data || []) as DomainPortfolio[];
    if (!searchQuery.trim()) return domains;

    const query = searchQuery.toLowerCase().trim();
    return domains.filter((domain) => {
      return (
        domain.domain.toLowerCase().includes(query) ||
        domain.clientName.toLowerCase().includes(query) ||
        (domain.clientEmail && domain.clientEmail.toLowerCase().includes(query)) ||
        domain.status.toLowerCase().includes(query) ||
        domain.tld.toLowerCase().includes(query)
      );
    });
  }, [domainsData?.data, searchQuery]);

  const openProviderIds = React.useMemo(() => {
    return (filteredDomains as DomainPortfolio[])
      .map((d) => (typeof d.id === "string" ? Number.parseInt(d.id, 10) : d.id))
      .filter((id) => !Number.isNaN(id));
  }, [filteredDomains]);

  const { data: openProviderIdsWithSubscriptions = [] } =
    trpc.clientSubscriptions.getOpenProviderIdsWithSubscriptions.useQuery(
      { openProviderIds },
      { enabled: openProviderIds.length > 0 }
    );

  const openProviderIdsWithSubscriptionsSet = React.useMemo(
    () => new Set(openProviderIdsWithSubscriptions),
    [openProviderIdsWithSubscriptions]
  );

  // Show error state
  if (error) {
    return (
      <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
        <div className="w-full max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-destructive mb-4">
              {error.message || "Failed to load domains portfolio"}
            </p>
            <Button onClick={() => refetch()} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const domains = domainsData?.data || [];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      ACTIVE: "default",
      PENDING: "secondary",
      EXPIRED: "destructive",
      SUSPENDED: "outline",
      TRANSFERRING: "secondary",
    };

    const statusColors: Record<string, string> = {
      ACTIVE: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
      PENDING: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300",
      EXPIRED: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",
      SUSPENDED: "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300",
      TRANSFERRING: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300",
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

  const TableView = () => (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-6">Domain Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Expiry Date</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredDomains.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
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
                            <DropdownMenuItem onClick={() => handleNavigation(`/agency/domains-portfolio/${domain.id}`)}>
                              <Globe className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="block w-full">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      const id = typeof domain.id === "string" ? Number.parseInt(domain.id, 10) : domain.id;
                                      if (!openProviderIdsWithSubscriptionsSet.has(id)) {
                                        setCreateSubscriptionDomain(domain);
                                      }
                                    }}
                                    disabled={openProviderIdsWithSubscriptionsSet.has(
                                      typeof domain.id === "string" ? Number.parseInt(domain.id, 10) : domain.id
                                    )}
                                  >
                                    <FilePlus2 className="mr-2 h-4 w-4" />
                                    Create subscription
                                  </DropdownMenuItem>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="left" className="max-w-xs">
                                {openProviderIdsWithSubscriptionsSet.has(
                                  typeof domain.id === "string" ? Number.parseInt(domain.id, 10) : domain.id
                                )
                                  ? "This domain already has a connected subscription. To connect you need to first suspend the existing to connect it."
                                  : "Create a Nisc subscription for this domain and link it to a user or team."}
                              </TooltipContent>
                            </Tooltip>
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

  const CardView = () => (
    <DomainPortfolioCardsList
      data={filteredDomains as DomainPortfolio[]}
      cols={4}
      onView={(id) => handleNavigation(`/agency/domains-portfolio/${id}`)}
      onCreateSubscription={(d) => setCreateSubscriptionDomain(d)}
      openProviderIdsWithSubscriptions={openProviderIdsWithSubscriptionsSet}
    />
  );

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex flex-col gap-2">
          <h1 className="text-base font-semibold tracking-tight">Domains Portfolio</h1>
          <p className="text-xs text-muted-foreground">
            Manage and monitor all domains registered through your agency. View domain status, expiry dates, and client information.
          </p>
        </div>

        {/* Search, Refresh, and Actions */}
        <div className="mt-6">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search domains by name, client, or status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex items-center border rounded-md">
                <Button
                  variant={viewMode === "card" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("card")}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "table" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
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

        <div className="mt-6">
          {isLoading && !domainsData ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size={32} />
            </div>
          ) : !domains || domains.length === 0 ? (
            <EmptyState />
          ) : filteredDomains.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Globe className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold mb-2">No domains found</p>
              <p className="text-muted-foreground mb-4">
                No domains match your search query "{searchQuery}".
              </p>
              <Button
                variant="outline"
                onClick={() => setSearchQuery("")}
              >
                Clear Search
              </Button>
            </div>
          ) : (
            <>
              {viewMode === "card" ? <CardView /> : <TableView />}
              {createSubscriptionDomain && (
                <CreateSubscriptionFromDomainDialog
                  open={!!createSubscriptionDomain}
                  onOpenChange={(open) => !open && setCreateSubscriptionDomain(null)}
                  domain={createSubscriptionDomain}
                  onSuccess={() => setCreateSubscriptionDomain(null)}
                />
              )}
              {domainsData?.meta && domainsData.meta.total > filteredDomains.length && (
                <div className="text-center text-sm text-muted-foreground">
                  Showing {filteredDomains.length} of {domainsData.meta.total} domains
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
