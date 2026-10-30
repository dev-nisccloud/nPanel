"use client";

import * as React from "react";

import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

import { ConnectFacebookButton } from "./connect-facebook-card";
import { FacebookPageAnalytics } from "./page-analytics";
import { beginFacebookPagesConnect } from "./pages-connect";

const cachedPages = {
  staleTime: Number.POSITIVE_INFINITY,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
} as const;

export function FacebookPagesTab() {
  const utils = trpc.useUtils();
  const connectionsQuery = trpc.customerOAuth.connections.list.useQuery(
    { platform: "meta_facebook_pages" },
    cachedPages,
  );
  const pagesQuery = trpc.customerOAuth.facebookPages.list.useQuery(undefined, cachedPages);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [importing, setImporting] = React.useState(false);

  const connections = connectionsQuery.data ?? [];
  const pending = connections.find(
    (connection) => connection.status === "PENDING_SELECTION" || connection.awaitingAccountSelection,
  );
  const active = connections.find((connection) => connection.status === "ACTIVE");
  const pages = pagesQuery.data ?? [];
  const selected = pages.find((page) => page.id === selectedId) ?? pages[0] ?? null;
  const showPicker = Boolean(pending) || importing || (Boolean(active) && pages.length === 0);

  React.useEffect(() => {
    if (!selectedId && pages[0]) setSelectedId(pages[0].id);
  }, [pages, selectedId]);

  if (connectionsQuery.isLoading || pagesQuery.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={28} />
      </div>
    );
  }

  if (connectionsQuery.isError) {
    return <p className="text-sm text-destructive">{connectionsQuery.error.message}</p>;
  }

  if (!active && !pending) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted py-24 text-center">
        <Card className="mx-auto w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Connect Facebook Pages</CardTitle>
            <CardDescription>Authorize access, then choose the Pages to import.</CardDescription>
          </CardHeader>
          <CardContent>
            <ConnectFacebookButton
              label="Connect Facebook"
              size="lg"
              className="w-full"
              platform="meta_facebook_pages"
              beforeConnect={beginFacebookPagesConnect}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showPicker && (pending ?? active)) {
    return (
      <SelectFacebookPages
        connectionId={(pending ?? active)!.id}
        onDone={async () => {
          setImporting(false);
          await Promise.all([
            utils.customerOAuth.connections.list.invalidate({ platform: "meta_facebook_pages" }),
            utils.customerOAuth.facebookPages.list.invalidate(),
          ]);
        }}
        onCancel={active && pages.length > 0 ? () => setImporting(false) : undefined}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start">
      <aside className="w-full shrink-0 md:w-64">
        <div className="flex max-h-[32rem] flex-col gap-1 overflow-auto rounded-xl border p-2">
          {pages.map((page) => {
            const current = page.id === selected?.id;
            return (
              <button
                key={page.id}
                type="button"
                aria-current={current ? "true" : undefined}
                onClick={() => setSelectedId(page.id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-2 py-2 text-left",
                  current
                    ? "border-primary bg-primary/10"
                    : "border-transparent hover:bg-muted/60",
                )}
              >
                <span className={cn("h-8 w-1 shrink-0 rounded-full", current ? "bg-primary" : "bg-transparent")} />
                <span className="relative">
                  <PageAvatar name={page.name} pictureUrl={page.pictureUrl} />
                  {current ? (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-3 w-3" />
                    </span>
                  ) : null}
                </span>
                <span className="min-w-0">
                  <span className={cn("line-clamp-2 text-sm leading-snug", current ? "font-semibold" : "font-medium")}>
                    {page.name}
                  </span>
                  {page.category ? (
                    <span className="block truncate text-xs text-muted-foreground">{page.category}</span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
        <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => setImporting(true)}>
          Import pages
        </Button>
      </aside>
      <div className="min-w-0 flex-1">
        {selected ? (
          <FacebookPageAnalytics
            key={selected.id}
            pageId={selected.id}
            pageName={selected.name}
            pictureUrl={selected.pictureUrl}
          />
        ) : null}
      </div>
    </div>
  );
}

function PageAvatar({ name, pictureUrl }: { name: string; pictureUrl: string | null }) {
  if (pictureUrl) {
    return (
      <img
        src={pictureUrl}
        alt=""
        referrerPolicy="no-referrer"
        className="h-10 w-10 shrink-0 rounded-lg object-cover"
      />
    );
  }
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

function SelectFacebookPages({
  connectionId,
  onDone,
  onCancel,
}: {
  connectionId: string;
  onDone: () => Promise<void>;
  onCancel?: () => void;
}) {
  const assetsQuery = trpc.customerOAuth.auth.fetchAvailableAssets.useQuery(
    { connectionId },
    { retry: false },
  );
  const [selectedIds, setSelectedIds] = React.useState<string[] | null>(null);
  const pages = React.useMemo(
    () => (assetsQuery.data?.assets ?? []).filter((asset) => asset.assetType === "facebook_page"),
    [assetsQuery.data?.assets],
  );
  const chosenIds = selectedIds ?? pages.map((page) => page.platformAssetId);

  const importPages = trpc.customerOAuth.facebookPages.importPages.useMutation({
    onSuccess: async () => {
      toast.success("Pages imported");
      await onDone();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to import Pages");
    },
  });

  const toggle = (platformAssetId: string, checked: boolean) => {
    const current = new Set(chosenIds);
    if (checked) current.add(platformAssetId);
    else current.delete(platformAssetId);
    setSelectedIds([...current]);
  };

  return (
    <Card className="mx-auto w-full max-w-lg">
      <CardHeader>
        <CardTitle>Choose Pages</CardTitle>
        <CardDescription>Choose the Facebook Pages to import.</CardDescription>
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
        ) : pages.length === 0 ? (
          <p className="text-sm text-muted-foreground">This Facebook account has no Pages to import.</p>
        ) : (
          <div className="space-y-4">
            <div className="max-h-80 space-y-2 overflow-auto">
              {pages.map((page) => (
                <label
                  key={page.platformAssetId}
                  className="flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2"
                >
                  <Checkbox
                    checked={chosenIds.includes(page.platformAssetId)}
                    onCheckedChange={(checked) => toggle(page.platformAssetId, checked === true)}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{page.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {page.username ? `@${page.username}` : page.platformAssetId}
                    </span>
                  </span>
                </label>
              ))}
            </div>
            <Button
              className="w-full"
              disabled={chosenIds.length === 0 || importPages.isPending}
              onClick={() => importPages.mutate({ connectionId, selectedPageIds: chosenIds })}
            >
              {importPages.isPending
                ? "Importing..."
                : `Import ${chosenIds.length} page${chosenIds.length === 1 ? "" : "s"}`}
            </Button>
            {onCancel ? (
              <Button variant="ghost" className="w-full" onClick={onCancel}>
                Cancel
              </Button>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
