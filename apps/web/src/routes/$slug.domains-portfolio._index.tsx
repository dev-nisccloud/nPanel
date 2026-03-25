"use client";

import * as React from "react";
import { Plus, RefreshCw, Search, Globe, Grid3X3, List } from "lucide-react";
import { useNavigate, useLocation } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { DomainPortfolioCardsList, type DomainPortfolio } from "./$slug.domains-portfolio/_components/domain-portfolio-card";
import { EmptyState } from "./$slug.domains-portfolio/_components/empty-state";
import { trpc } from "@/utils/trpc";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

/** Map listForTeamDomains item to DomainPortfolio-like shape for table/cards. Dates from API are serialized as strings. */
function toDisplayItem(
  sub: {
    id: string;
    subscriptionName: string | null;
    status: string;
    productName: string;
    productPlanName: string | null;
    subscriptionDate: string | null;
    expiryDate: string | null;
    primaryDomain: string | null;
  }
): DomainPortfolio {
  const domain = sub.primaryDomain ?? sub.subscriptionName ?? sub.productName ?? sub.id;
  return {
    id: sub.id,
    domain,
    status: sub.status as DomainPortfolio["status"],
    registrationDate: sub.subscriptionDate ? new Date(sub.subscriptionDate) : new Date(),
    expiryDate: sub.expiryDate ? new Date(sub.expiryDate) : new Date(),
    clientName: "—",
    clientEmail: undefined,
    tld: "",
    autoRenewal: false,
    nameservers: [],
  };
}

export default function DomainsPortfolioPage() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const teamSlug = pathname.split("/")[1] ?? "";

  const [searchQuery, setSearchQuery] = React.useState("");
  const [viewMode, setViewMode] = React.useState<"card" | "table">("table");

  const { data: subscriptions = [], isLoading, error, refetch } = trpc.clientSubscriptions.listForTeamDomains.useQuery(
    { teamSlug },
    { enabled: !!teamSlug }
  );

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const displayItems = React.useMemo(() => subscriptions.map(toDisplayItem), [subscriptions]);

  const filteredDomains = React.useMemo(() => {
    if (!searchQuery.trim()) return displayItems;
    const query = searchQuery.toLowerCase().trim();
    return displayItems.filter(
      (d) =>
        d.domain.toLowerCase().includes(query) ||
        d.status.toLowerCase().includes(query) ||
        (d.clientName && d.clientName.toLowerCase().includes(query))
    );
  }, [displayItems, searchQuery]);

  if (error) {
    return (
      <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
        <div className="w-full max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-destructive mb-4">{error.message || "Failed to load domains portfolio"}</p>
            <Button onClick={() => refetch()} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      ACTIVE: "default",
      PENDING: "secondary",
      EXPIRED: "destructive",
      SUSPENDED: "outline",
      TRANSFERRING: "secondary",
      UPGRADED: "secondary",
      DOWNGRADED: "secondary",
    };
    const statusColors: Record<string, string> = {
      ACTIVE: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
      PENDING: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300",
      EXPIRED: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",
      SUSPENDED: "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300",
      TRANSFERRING: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300",
    };
    return (
      <Badge variant={variants[status] || "secondary"} className={`text-xs ${statusColors[status] || ""}`}>
        {status}
      </Badge>
    );
  };

  const TableView = () => (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-6">Domain / Subscription</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Subscription date</TableHead>
            <TableHead>Expiry date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredDomains.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                No domains found
              </TableCell>
            </TableRow>
          ) : (
            filteredDomains.map((item) => (
              <TableRow
                key={item.id}
                className="cursor-pointer"
                onClick={() => handleNavigation(`/${teamSlug}/domains-portfolio/${item.id}`)}
              >
                <TableCell className="pl-6">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{item.domain}</span>
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(item.status)}</TableCell>
                <TableCell>
                  {item.registrationDate instanceof Date
                    ? item.registrationDate.toLocaleDateString()
                    : new Date(item.registrationDate).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {item.expiryDate instanceof Date
                    ? item.expiryDate.toLocaleDateString()
                    : new Date(item.expiryDate).toLocaleDateString()}
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
      data={filteredDomains}
      cols={4}
      onView={(id) => handleNavigation(`/${teamSlug}/domains-portfolio/${id}`)}
      hideActionMenu
    />
  );

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex flex-col gap-2">
          <h1 className="text-base font-semibold tracking-tight">My Domains</h1>
          <p className="text-xs text-muted-foreground">
            Domain subscriptions for this team. View status and details.
          </p>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name or status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
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
              <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isLoading} title="Refresh">
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
              <Button onClick={() => navigate(`/${teamSlug}/domains`)}>
                <Plus className="mr-2 h-4 w-4" />
                Get a Domain
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-6">
          {isLoading && subscriptions.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size={32} />
            </div>
          ) : displayItems.length === 0 ? (
            <EmptyState teamSlug={teamSlug} />
          ) : filteredDomains.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Globe className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold mb-2">No domains found</p>
              <p className="text-muted-foreground mb-4">No domains match your search &quot;{searchQuery}&quot;.</p>
              <Button variant="outline" onClick={() => setSearchQuery("")}>
                Clear Search
              </Button>
            </div>
          ) : (
            (viewMode === "card" ? <CardView /> : <TableView />)
          )}
        </div>
      </div>
    </div>
  );
}
