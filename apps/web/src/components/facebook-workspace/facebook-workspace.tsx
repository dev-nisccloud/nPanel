"use client";

import * as React from "react";

import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";

import { FacebookCampaignsTab } from "./campaigns-tab";
import { ConnectFacebookButton, ConnectFacebookCard } from "./connect-facebook-card";
import { FacebookPagesTab } from "./pages-tab";
import { SelectFacebookAdAccounts } from "./select-ad-accounts";

export function FacebookWorkspace() {
  const connectionsQuery = trpc.customerOAuth.connections.list.useQuery({
    platform: "meta_facebook",
  });

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauth = params.get("oauth");
    if (!oauth) return;
    if (oauth === "error") {
      toast.error(params.get("message") || "Failed to connect Facebook");
    } else if (oauth === "connected") {
      toast.success("Facebook connected. Choose the ad accounts to import.");
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
            <h1 className="text-xl font-bold tracking-tight">Facebook</h1>
            <p className="text-xs text-muted-foreground">
              Manage Facebook campaigns and pages from one place.
            </p>
          </div>
          {active ? <ConnectFacebookButton /> : null}
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
          <SelectFacebookAdAccounts connectionId={pending.id} />
        ) : !active ? (
          <div className="mt-8 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted py-24 text-center">
            <ConnectFacebookCard />
          </div>
        ) : (
          <Tabs defaultValue="campaigns" className="mt-6 w-full">
            <TabsList className="w-fit">
              <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
              <TabsTrigger value="pages">Pages</TabsTrigger>
            </TabsList>
            <TabsContent value="campaigns" className="mt-6">
              <FacebookCampaignsTab />
            </TabsContent>
            <TabsContent value="pages" className="mt-6">
              <FacebookPagesTab />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
