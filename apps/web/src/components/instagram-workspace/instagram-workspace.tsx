"use client";

import * as React from "react";
import { RefreshCw } from "lucide-react";

import { FacebookCampaignsTab } from "@/components/facebook-workspace/campaigns-tab";
import { ConnectFacebookButton } from "@/components/facebook-workspace/connect-facebook-card";
import { SelectFacebookAdAccounts } from "@/components/facebook-workspace/select-ad-accounts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

const RETURN_PATH = "/agency/social-media-ads/instagram";

const cachedList = {
  staleTime: Number.POSITIVE_INFINITY,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
} as const;

export function InstagramWorkspace() {
  const utils = trpc.useUtils();
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const connectionsQuery = trpc.customerOAuth.connections.list.useQuery(
    { platform: "meta_facebook" },
    cachedList,
  );

  const refresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        utils.customerOAuth.connections.list.invalidate({ platform: "meta_facebook" }),
        utils.customerOAuth.assets.list.invalidate(),
        utils.customerOAuth.campaigns.list.invalidate(),
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
      toast.error(params.get("message") || "Failed to connect Meta");
    } else if (oauth === "connected") {
      toast.success("Meta connected. Choose the ad accounts to import.");
    }
    params.delete("oauth");
    params.delete("message");
    params.delete("connectionId");
    const next = `${window.location.pathname}${params.size > 0 ? `?${params.toString()}` : ""}`;
    window.history.replaceState(null, "", next);
  }, []);

  const instagramAccountsQuery = trpc.customerOAuth.assets.list.useQuery(
    { platform: "meta_instagram", assetType: "meta_ad_account", isActive: true },
    cachedList,
  );
  const connections = connectionsQuery.data ?? [];
  const pending = connections.find(
    (connection) => connection.status === "PENDING_SELECTION" || connection.awaitingAccountSelection,
  );
  const active = connections.find((connection) => connection.status === "ACTIVE");
  const metaConnection = active ?? pending;
  const hasInstagramAccounts = (instagramAccountsQuery.data?.length ?? 0) > 0;

  return (
    <div className="@container/main flex flex-col gap-4 px-4 py-4 font-sans text-foreground md:gap-6 md:px-6 md:py-6 lg:px-8">
      <div className="mx-auto w-full min-w-0 max-w-7xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-xl font-bold tracking-tight">Instagram</h1>
            <p className="text-xs text-muted-foreground">
              Connected ad accounts and their Instagram campaigns.
            </p>
          </div>
          {metaConnection ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void refresh()}
                disabled={isRefreshing}
                className="shrink-0"
              >
                <RefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
                Refresh
              </Button>
              <ConnectFacebookButton label="Connect Meta" returnUrl={RETURN_PATH} />
            </div>
          ) : null}
        </div>

        {connectionsQuery.isLoading || (metaConnection && instagramAccountsQuery.isLoading) ? (
          <div className="mt-16 flex justify-center">
            <Spinner size={28} />
          </div>
        ) : connectionsQuery.isError ? (
          <div className="mt-8 rounded-xl border border-dashed px-6 py-16 text-center">
            <p className="text-sm text-destructive">{connectionsQuery.error.message}</p>
          </div>
        ) : !metaConnection ? (
          <div className="mt-8 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted py-24 text-center">
            <Card className="mx-auto w-full max-w-md">
              <CardHeader className="text-center">
                <CardTitle>Connect Instagram</CardTitle>
                <CardDescription>
                  Authorize access, then choose the ad accounts to import.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ConnectFacebookButton
                  label="Connect with Meta"
                  size="lg"
                  className="w-full"
                  returnUrl={RETURN_PATH}
                />
              </CardContent>
            </Card>
          </div>
        ) : !hasInstagramAccounts ? (
          <SelectFacebookAdAccounts connectionId={metaConnection.id} assetPlatform="meta_instagram" />
        ) : (
          <div className="mt-6">
            <FacebookCampaignsTab
              detailsBase={RETURN_PATH}
              publisherPlatform="instagram"
              assetPlatform="meta_instagram"
            />
          </div>
        )}
      </div>
    </div>
  );
}
