"use client";

import * as React from "react";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

import { FacebookCampaignsTab } from "./campaigns-tab";
import { ConnectFacebookButton, ConnectFacebookCard } from "./connect-facebook-card";
import { FacebookPagesTab } from "./pages-tab";
import { latchPagesConnect, markPagesReturnHandled, schedulePagesConnectReset, takePagesConnectForToast } from "./pages-connect";
import { SelectFacebookAdAccounts } from "./select-ad-accounts";

const cachedFacebookList = {
  staleTime: Number.POSITIVE_INFINITY,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
} as const;

export function FacebookWorkspace() {
  const utils = trpc.useUtils();
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [tab, setTab] = React.useState(() => (latchPagesConnect() ? "pages" : "campaigns"));
  const connectionsQuery = trpc.customerOAuth.connections.list.useQuery(
    { platform: "meta_facebook" },
    cachedFacebookList,
  );

  const refreshFacebook = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        utils.customerOAuth.connections.list.invalidate({ platform: "meta_facebook" }),
        utils.customerOAuth.connections.list.invalidate({ platform: "meta_facebook_pages" }),
        utils.customerOAuth.assets.list.invalidate(),
        utils.customerOAuth.campaigns.list.invalidate(),
        utils.customerOAuth.facebookPages.list.invalidate(),
        utils.customerOAuth.facebookPages.details.invalidate(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  React.useEffect(() => {
    const { pagesConnect, alreadyHandled } = takePagesConnectForToast();
    const params = new URLSearchParams(window.location.search);
    const oauth = params.get("oauth");
    if (oauth && !alreadyHandled) {
      markPagesReturnHandled();
      if (oauth === "error") {
        toast.error(params.get("message") || "Failed to connect Facebook");
      } else if (oauth === "connected") {
        toast.success(
          pagesConnect
            ? "Facebook connected. Choose the pages to import."
            : "Facebook connected. Choose the ad accounts to import.",
        );
      }
      params.delete("oauth");
      params.delete("message");
      params.delete("connectionId");
      const next = `${window.location.pathname}${params.size > 0 ? `?${params.toString()}` : ""}`;
      window.history.replaceState(null, "", next);
    }
    return schedulePagesConnectReset();
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
            <h1 className="text-xl font-bold tracking-tight">Facebook</h1>
            <p className="text-xs text-muted-foreground">
              Connected ad accounts, campaigns, and pages.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refreshFacebook()}
              disabled={isRefreshing}
              className="shrink-0"
            >
              <RefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
              Refresh
            </Button>
            {active ? <ConnectFacebookButton /> : null}
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="mt-6 w-full">
          <TabsList className="w-fit">
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="pages">Pages</TabsTrigger>
          </TabsList>
          <TabsContent value="campaigns" className="mt-6">
            {connectionsQuery.isLoading ? (
              <div className="flex justify-center py-16">
                <Spinner size={28} />
              </div>
            ) : connectionsQuery.isError ? (
              <div className="rounded-xl border border-dashed px-6 py-16 text-center">
                <p className="text-sm text-destructive">{connectionsQuery.error.message}</p>
              </div>
            ) : pending ? (
              <SelectFacebookAdAccounts connectionId={pending.id} />
            ) : !active ? (
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted py-24 text-center">
                <ConnectFacebookCard />
              </div>
            ) : (
              <FacebookCampaignsTab connectionId={active.id} />
            )}
          </TabsContent>
          <TabsContent value="pages" className="mt-6">
            <FacebookPagesTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
