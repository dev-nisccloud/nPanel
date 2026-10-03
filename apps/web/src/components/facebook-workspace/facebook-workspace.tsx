"use client";

import * as React from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { FacebookCampaignsTab } from "./campaigns-tab";
import { ConnectFacebookCard } from "./connect-facebook-card";
import { FACEBOOK_WORKSPACE_CONNECTED_KEY } from "./mock-data";
import { FacebookPagesTab } from "./pages-tab";

function readConnected(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(FACEBOOK_WORKSPACE_CONNECTED_KEY) === "1";
}

export function FacebookWorkspace() {
  const [isConnected, setIsConnected] = React.useState(false);

  React.useEffect(() => {
    setIsConnected(readConnected());
  }, []);

  return (
    <div className="@container/main flex flex-col gap-4 px-4 py-4 font-sans text-foreground md:gap-6 md:px-6 md:py-6 lg:px-8">
      <div className="mx-auto w-full min-w-0 max-w-7xl">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-bold tracking-tight">Facebook</h1>
          <p className="text-xs text-muted-foreground">
            Manage Facebook campaigns and pages from one place.
          </p>
        </div>

        {!isConnected ? (
          <div className="mt-8 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted py-24 text-center">
            <ConnectFacebookCard onConnected={() => setIsConnected(true)} />
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
