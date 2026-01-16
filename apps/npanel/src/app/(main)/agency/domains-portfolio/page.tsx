"use client";

import * as React from "react";
import { Plus, RefreshCw, Search, Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { DomainPortfolioCardsList, type DomainPortfolio } from "./_components/domain-portfolio-card";
import { EmptyState } from "./_components/empty-state";
import { DomainDetailsDialog } from "./_components/domain-details-dialog";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";

export default function DomainsPortfolioPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [limit] = React.useState(100);
  const [offset, setOffset] = React.useState(0);
  const [selectedDomainId, setSelectedDomainId] = React.useState<string | null>(null);

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

  // Show error state
  if (error) {
    return (
      <div className="@container/main flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-destructive mb-4">
            {error.message || "Failed to load domains portfolio"}
          </p>
          <Button onClick={() => refetch()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const domains = domainsData?.data || [];

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Domains Portfolio</h1>
        <p className="text-muted-foreground">
          Manage and monitor all domains registered through your agency. View domain status, expiry dates, and client information.
        </p>
      </div>

      {/* Search, Refresh, and Actions */}
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
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading}
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={() => router.push("/agency/domains")}>
            <Plus className="mr-2 h-4 w-4" />
            Register Domain
          </Button>
        </div>
      </div>

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
          <DomainPortfolioCardsList
            data={filteredDomains as DomainPortfolio[]}
            cols={4}
            onView={(id) => setSelectedDomainId(id)}
          />
          {domainsData?.meta && domainsData.meta.total > filteredDomains.length && (
            <div className="text-center text-sm text-muted-foreground">
              Showing {filteredDomains.length} of {domainsData.meta.total} domains
            </div>
          )}
        </>
      )}

      {/* Domain Details Dialog */}
      <DomainDetailsDialog
        open={selectedDomainId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedDomainId(null);
        }}
        domain={filteredDomains.find((d) => d.id === selectedDomainId) || null}
        onManage={(id) => {
          toast.info("Manage domain functionality coming soon");
        }}
        onRenew={(id) => {
          toast.info("Renew domain functionality coming soon");
        }}
        onTransfer={(id) => {
          toast.info("Transfer domain functionality coming soon");
        }}
      />
    </div>
  );
}

