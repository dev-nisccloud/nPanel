"use client";

import * as React from "react";
import { RefreshCw, Search, ArrowRightLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { DomainTransferCardsList } from "./_components/domain-transfer-card";
import { EmptyState } from "./_components/empty-state";
import { TransferForm } from "./_components/transfer-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock data - will be replaced with real API calls later
type TransferStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | "CANCELLED";

const mockTransfers: Array<{
  id: string;
  domain: string;
  status: TransferStatus;
  requestedAt: Date;
  completedAt: Date | null;
  clientName: string;
  clientEmail: string;
  previousRegistrar: string;
  authCode: string;
  failureReason: string | null;
}> = [
  {
    id: "1",
    domain: "example.com",
    status: "IN_PROGRESS" as const,
    requestedAt: new Date("2024-11-15"),
    completedAt: null,
    clientName: "Acme Corporation",
    clientEmail: "admin@acme.com",
    previousRegistrar: "GoDaddy",
    authCode: "ABC123XYZ",
    failureReason: null,
  },
  {
    id: "2",
    domain: "testdomain.org",
    status: "COMPLETED" as const,
    requestedAt: new Date("2024-10-20"),
    completedAt: new Date("2024-11-05"),
    clientName: "Tech Solutions Ltd",
    clientEmail: "contact@techsolutions.com",
    previousRegistrar: "Namecheap",
    authCode: "DEF456UVW",
    failureReason: null,
  },
  {
    id: "3",
    domain: "sample.net",
    status: "PENDING" as const,
    requestedAt: new Date("2024-11-20"),
    completedAt: null,
    clientName: "Sample Inc",
    clientEmail: "info@sample.net",
    previousRegistrar: "Google Domains",
    authCode: "GHI789RST",
    failureReason: null,
  },
  {
    id: "4",
    domain: "failed.co.ke",
    status: "FAILED" as const,
    requestedAt: new Date("2024-11-10"),
    completedAt: null,
    clientName: "Demo Company",
    clientEmail: "hello@demo.co.ke",
    previousRegistrar: "Registrar.com",
    authCode: "JKL012MNO",
    failureReason: "Invalid authorization code",
  },
  {
    id: "5",
    domain: "business.io",
    status: "COMPLETED" as const,
    requestedAt: new Date("2024-09-15"),
    completedAt: new Date("2024-10-01"),
    clientName: "Business Ventures",
    clientEmail: "support@business.io",
    previousRegistrar: "Cloudflare",
    authCode: "PQR345STU",
    failureReason: null,
  },
];

export default function DomainTransferPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [transfers, setTransfers] = React.useState(mockTransfers);
  const [activeTab, setActiveTab] = React.useState("all");
  const [isFormOpen, setIsFormOpen] = React.useState(false);

  // Simulate loading state
  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  // Filter transfers based on search query and active tab
  const filteredTransfers = React.useMemo(() => {
    let filtered = transfers;

    // Filter by status tab
    if (activeTab !== "all") {
      const statusMap: Record<string, TransferStatus> = {
        pending: "PENDING",
        in_progress: "IN_PROGRESS",
        completed: "COMPLETED",
        failed: "FAILED",
      };
      filtered = filtered.filter((transfer) => transfer.status === statusMap[activeTab]);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((transfer) => {
        return (
          transfer.domain.toLowerCase().includes(query) ||
          transfer.clientName.toLowerCase().includes(query) ||
          transfer.clientEmail.toLowerCase().includes(query) ||
          transfer.previousRegistrar.toLowerCase().includes(query) ||
          transfer.status.toLowerCase().includes(query)
        );
      });
    }

    return filtered;
  }, [transfers, searchQuery, activeTab]);

  // Count transfers by status
  const statusCounts = React.useMemo(() => {
    return {
      all: transfers.length,
      pending: transfers.filter((t) => t.status === "PENDING").length,
      in_progress: transfers.filter((t) => t.status === "IN_PROGRESS").length,
      completed: transfers.filter((t) => t.status === "COMPLETED").length,
      failed: transfers.filter((t) => t.status === "FAILED").length,
    };
  }, [transfers]);

  if (isLoading) {
    return (
      <div className="@container/main flex flex-col gap-4 md:gap-6">
        <div className="flex items-center justify-center py-12">
          <Spinner size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Domain Transfer</h1>
        <p className="text-muted-foreground">
          Transfer domains from other registrars to your agency. Initiate new transfers and monitor the status of existing transfers.
        </p>
      </div>

      {/* Transfer Form Section */}
      <div className="border rounded-lg p-6 bg-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Initiate Domain Transfer</h2>
            <p className="text-sm text-muted-foreground">
              Transfer a domain from another registrar to your agency
            </p>
          </div>
          <Button
            variant={isFormOpen ? "outline" : "default"}
            onClick={() => setIsFormOpen(!isFormOpen)}
          >
            {isFormOpen ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                New Transfer
              </>
            )}
          </Button>
        </div>
        {isFormOpen && <TransferForm onSuccess={() => setIsFormOpen(false)} />}
      </div>

      {/* Search and Refresh */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search transfers by domain, client, or registrar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
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
      </div>

      {/* Status Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">
            All ({statusCounts.all})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({statusCounts.pending})
          </TabsTrigger>
          <TabsTrigger value="in_progress">
            In Progress ({statusCounts.in_progress})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({statusCounts.completed})
          </TabsTrigger>
          <TabsTrigger value="failed">
            Failed ({statusCounts.failed})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {!transfers || transfers.length === 0 ? (
            <EmptyState />
          ) : filteredTransfers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ArrowRightLeft className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold mb-2">No transfers found</p>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? `No transfers match your search query "${searchQuery}".`
                  : `No transfers found with status "${activeTab}".`}
              </p>
              {searchQuery && (
                <Button variant="outline" onClick={() => setSearchQuery("")}>
                  Clear Search
                </Button>
              )}
            </div>
          ) : (
            <DomainTransferCardsList data={filteredTransfers} cols={3} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

