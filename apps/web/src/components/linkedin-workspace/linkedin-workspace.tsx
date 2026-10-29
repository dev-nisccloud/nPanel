"use client";

import * as React from "react";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

import { ConnectLinkedInButton, ConnectLinkedInCard } from "./connect-linkedin-card";
import { LinkedInCampaignsTab } from "./campaigns-tab";
import { SelectLinkedInAdAccounts } from "./select-ad-accounts";

const cachedLinkedInList = {
  staleTime: Number.POSITIVE_INFINITY,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
} as const;

export function LinkedInWorkspace() {
  const utils = trpc.useUtils();
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const connectionsQuery = trpc.customerOAuth.connections.list.useQuery(
    { platform: "linkedin_ads" },
    cachedLinkedInList,
  );

  const refreshLinkedIn = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        utils.customerOAuth.connections.list.invalidate({ platform: "linkedin_ads" }),
        utils.customerOAuth.assets.list.invalidate(),
        utils.customerOAuth.linkedin.list.invalidate(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauth = params.get("oauth");
    if (!oauth) return;
    if (oauth === "error") {
      toast.error(params.get("message") || "Failed to connect LinkedIn");
    } else if (oauth === "connected") {
      toast.success("LinkedIn connected. Choose the ad accounts to import.");
    }
    params.delete("oauth");
    params.delete("message");
    params.delete("connectionId");
    const next = `${window.location.pathname}${params.size > 0 ? `?${params.toString()}` : ""}`;
    window.history.replaceState(null, "", next);
  }, []);

  const connections = connectionsQuery.data ?? [];
  const pending = connections.find(
    (connection) => connection.status === "PENDING_SELECTION" || connection.awaitingAccountSelection,
  );
  const active = connections.find((connection) => connection.status === "ACTIVE");

  return (
    <div className="@container/main flex flex-col gap-4 px-4 py-4 font-sans text-foreground md:gap-6 md:px-6 md:py-6 lg:px-8">
      <div className="mx-auto w-full min-w-0 max-w-7xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-xl font-bold tracking-tight">LinkedIn</h1>
            <p className="text-xs text-muted-foreground">
              Connected ad accounts and their campaigns.
            </p>
          </div>
          {active ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void refreshLinkedIn()}
                disabled={isRefreshing}
                className="shrink-0"
              >
                <RefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
                Refresh
              </Button>
              <ConnectLinkedInButton />
            </div>
          ) : null}
        </div>

        {connectionsQuery.isLoading ? (
          <div className="mt-16 flex justify-center">
            <Spinner size={28} />
          </div>
        ) : connectionsQuery.isError ? (
          <div className="mt-8 rounded-xl border border-dashed px-6 py-16 text-center">
            <p className="text-sm text-destructive">{connectionsQuery.error.message}</p>
          </div>
        ) : pending ? (
          <SelectLinkedInAdAccounts connectionId={pending.id} />
        ) : !active ? (
          <div className="mt-8 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted py-24 text-center">
            <ConnectLinkedInCard />
          </div>
        ) : (
          <div className="mt-6">
            <LinkedInCampaignsTab />
          </div>
        )}
      </div>
    </div>
  );
}
