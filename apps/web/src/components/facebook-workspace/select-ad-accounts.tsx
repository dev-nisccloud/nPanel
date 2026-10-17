"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";

export function SelectFacebookAdAccounts({ connectionId }: { connectionId: string }) {
  const utils = trpc.useUtils();
  const assetsQuery = trpc.customerOAuth.auth.fetchAvailableAssets.useQuery({ connectionId });
  const [selectedIds, setSelectedIds] = React.useState<string[] | null>(null);

  const adAccounts = React.useMemo(
    () => (assetsQuery.data?.assets ?? []).filter((asset) => asset.assetType === "meta_ad_account"),
    [assetsQuery.data?.assets],
  );
  const chosenIds = selectedIds ?? adAccounts.map((account) => account.platformAssetId);

  const completeSelection = trpc.customerOAuth.auth.completeAccountSelection.useMutation({
    onSuccess: async () => {
      toast.success("Ad accounts imported");
      await Promise.all([
        utils.customerOAuth.connections.list.invalidate(),
        utils.customerOAuth.assets.list.invalidate(),
      ]);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to import ad accounts");
    },
  });

  const toggle = (platformAssetId: string, checked: boolean) => {
    const current = new Set(chosenIds);
    if (checked) current.add(platformAssetId);
    else current.delete(platformAssetId);
    setSelectedIds([...current]);
  };

  return (
    <Card className="mx-auto mt-8 w-full max-w-lg">
      <CardHeader>
        <CardTitle>Choose ad accounts</CardTitle>
        <CardDescription>Import the Meta ad accounts you want to manage in this workspace.</CardDescription>
      </CardHeader>
      <CardContent>
        {assetsQuery.isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Spinner size={24} />
          </div>
        ) : assetsQuery.isError ? (
          <div className="space-y-3">
            <p className="text-sm text-destructive">{assetsQuery.error.message}</p>
            <Button variant="outline" onClick={() => void assetsQuery.refetch()}>
              Try again
            </Button>
          </div>
        ) : adAccounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">This Facebook account has no ad accounts to import.</p>
        ) : (
          <div className="space-y-4">
            <div className="max-h-80 space-y-2 overflow-auto">
              {adAccounts.map((account) => {
                const currency =
                  typeof account.metadata?.currency === "string" ? account.metadata.currency : null;
                return (
                  <label
                    key={account.platformAssetId}
                    className="flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2"
                  >
                    <Checkbox
                      checked={chosenIds.includes(account.platformAssetId)}
                      onCheckedChange={(checked) => toggle(account.platformAssetId, checked === true)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{account.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {account.platformAssetId}
                        {currency ? ` · ${currency}` : ""}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
            <Button
              className="w-full"
              disabled={chosenIds.length === 0 || completeSelection.isPending}
              onClick={() =>
                completeSelection.mutate({
                  connectionId,
                  selectedAssetIds: chosenIds,
                })
              }
            >
              {completeSelection.isPending ? "Importing..." : `Import ${chosenIds.length} ad account${chosenIds.length === 1 ? "" : "s"}`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
