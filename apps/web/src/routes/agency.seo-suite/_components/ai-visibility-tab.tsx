"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";
import { useCredentialsConfigured } from "./credentials-banner";
import {
  CREDENTIALS_TOAST,
  formatDate,
  parseCommaList,
  type SeoProject,
} from "./seo-suite-utils";

interface AiVisibilityTabProps {
  projectId: string;
  project: SeoProject;
}

export function AiVisibilityTab({ projectId, project }: AiVisibilityTabProps) {
  const { configured } = useCredentialsConfigured();
  const utils = trpc.useUtils();
  const [brands, setBrands] = React.useState(
    (project.brandEntities ?? []).join(", ") || project.name,
  );
  const [domains, setDomains] = React.useState(project.primaryDomain);
  const [platform, setPlatform] = React.useState<"google" | "chat_gpt" | "all">("all");

  const entities = trpc.seoSuite.listAiEntities.useQuery(
    { projectId },
    { staleTime: 60_000, refetchOnWindowFocus: false },
  );
  const snapshot = trpc.seoSuite.latestAiMentionSnapshot.useQuery(
    { projectId },
    { staleTime: 60_000, refetchOnWindowFocus: false },
  );

  React.useEffect(() => {
    if (!entities.data?.length) return;
    const brandVals = entities.data.filter((e) => e.entityType === "brand").map((e) => e.value);
    const domainVals = entities.data.filter((e) => e.entityType === "domain").map((e) => e.value);
    if (brandVals.length) setBrands(brandVals.join(", "));
    if (domainVals.length) setDomains(domainVals.join(", "));
  }, [entities.data]);

  const upsert = trpc.seoSuite.upsertAiEntities.useMutation({
    onSuccess: () => {
      toast.success("Entities saved");
      utils.seoSuite.listAiEntities.invalidate({ projectId });
    },
    onError: (e) => toast.error(e.message || "Failed to save entities"),
  });

  const refresh = trpc.seoSuite.refreshAiVisibility.useMutation({
    onSuccess: () => {
      toast.success("AI visibility refreshed");
      utils.seoSuite.latestAiMentionSnapshot.invalidate({ projectId });
    },
    onError: (e) => toast.error(e.message || "Failed to refresh AI visibility"),
  });

  const saveEntities = () => {
    const list = [
      ...parseCommaList(brands).map((value) => ({ entityType: "brand", value })),
      ...parseCommaList(domains).map((value) => ({ entityType: "domain", value })),
    ];
    upsert.mutate({ projectId, entities: list });
  };

  if (entities.isLoading || snapshot.isLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Brand entities</label>
          <Textarea
            rows={3}
            value={brands}
            onChange={(e) => setBrands(e.target.value)}
            placeholder="Brand names, comma-separated"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Domain entities</label>
          <Textarea
            rows={3}
            value={domains}
            onChange={(e) => setDomains(e.target.value)}
            placeholder="Domains, comma-separated"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-48 space-y-1.5">
          <label className="text-xs text-muted-foreground">Platform</label>
          <Select
            value={platform}
            onValueChange={(v) => setPlatform(v as typeof platform)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="google">Google</SelectItem>
              <SelectItem value="chat_gpt">ChatGPT</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" disabled={upsert.isPending} onClick={saveEntities}>
          {upsert.isPending ? <Spinner className="mr-2 h-4 w-4" /> : null}
          Save entities
        </Button>
        <Button
          disabled={refresh.isPending}
          onClick={() => {
            if (!configured) {
              toast.error(CREDENTIALS_TOAST);
              return;
            }
            refresh.mutate({
              projectId,
              platform: platform === "all" ? undefined : platform,
            });
          }}
        >
          {refresh.isPending ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Refreshing…
            </>
          ) : (
            "Refresh visibility"
          )}
        </Button>
      </div>

      <div className="rounded-lg border bg-card p-4 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Latest mention snapshot</h3>
          <p className="text-xs text-muted-foreground">
            {snapshot.data?.capturedAt
              ? formatDate(snapshot.data.capturedAt)
              : "No snapshot yet"}
          </p>
        </div>
        {snapshot.data?.payload != null ? (
          <pre className="text-xs rounded-lg border bg-muted/40 p-3 overflow-auto max-h-80">
            {JSON.stringify(snapshot.data.payload, null, 2)}
          </pre>
        ) : (
          <p className="text-sm text-muted-foreground">
            Save entities and refresh to capture LLM mention data.
          </p>
        )}
      </div>

      {(entities.data ?? []).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {(entities.data ?? []).map((e) => (
            <span
              key={e.id}
              className="rounded-md border bg-muted/40 px-2 py-1 text-xs text-muted-foreground"
            >
              {e.entityType}: {e.value}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
