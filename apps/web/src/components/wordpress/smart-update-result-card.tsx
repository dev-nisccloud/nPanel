"use client";

import * as React from "react";
import { ExternalLink, Sparkles, Check, X } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { WpFeatureCard } from "@/components/wordpress/wp-feature-card";
import { WpPanel } from "@/components/wordpress/wp-detail-primitives";
import { trpc } from "@/utils/trpc";

export function SmartUpdateResultCard({
  installationId,
  enabled,
  shell = "card",
}: {
  installationId: number;
  enabled?: boolean;
  shell?: "card" | "panel" | "none";
}) {
  const utils = trpc.useUtils();
  const { data, isLoading, refetch } = trpc.plesk.wpFeatures.getSmartUpdateResult.useQuery(
    { installationId },
    { enabled: enabled !== false },
  );

  const result = data?.data ?? data;
  const taskStatus = typeof result?.taskStatus === "string" ? result.taskStatus : null;
  const cloneUrl = result?.clone?.url as string | undefined;

  const applyMutation = trpc.plesk.wpFeatures.applySmartUpdate.useMutation({
    onSuccess: () => {
      toast.success("Smart Update applied to live site");
      utils.plesk.wordpress.getById.invalidate({ id: installationId });
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const discardMutation = trpc.plesk.wpFeatures.discardSmartUpdate.useMutation({
    onSuccess: () => {
      toast.success("Smart Update test discarded");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const details = Array.isArray(result?.details) ? result.details : [];
  const hasResult = taskStatus && taskStatus !== "none";

  const content = isLoading ? (
    <p className="text-sm text-muted-foreground">Loading result…</p>
  ) : !hasResult ? (
    <p className="text-sm text-muted-foreground">
      No Smart Update test in progress. Run Smart Update to generate a test clone.
    </p>
  ) : (
    <div className="space-y-3">
          {cloneUrl ? (
            <Button type="button" variant="outline" size="sm" asChild>
              <a href={cloneUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open test clone
              </a>
            </Button>
          ) : null}

          {details.length > 0 ? (
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button type="button" variant="ghost" size="sm" className="px-0">
                  View page comparison ({details.length})
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                {details.map((d: { pageUrl?: string; before?: { httpStatus?: number }; after?: { httpStatus?: number } }, i: number) => (
                  <div
                    key={i}
                    className="rounded-md border border-border/60 px-3 py-2 text-xs"
                  >
                    <p className="font-medium truncate">{d.pageUrl ?? `Page ${i + 1}`}</p>
                    <p className="text-muted-foreground mt-1">
                      HTTP {d.before?.httpStatus ?? "—"} → {d.after?.httpStatus ?? "—"}
                    </p>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          ) : null}

          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              type="button"
              size="sm"
              disabled={applyMutation.isPending}
              onClick={() => applyMutation.mutate({ installationId })}
            >
              <Check className="mr-2 h-4 w-4" />
              Apply to live site
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={discardMutation.isPending}
              onClick={() => discardMutation.mutate({ installationId })}
            >
              <X className="mr-2 h-4 w-4" />
              Discard test
            </Button>
          </div>
        </div>
  );

  const badge = taskStatus ? (
    <Badge variant="outline" className="text-xs capitalize">
      {taskStatus}
    </Badge>
  ) : undefined;

  if (shell === "none") return content;
  if (shell === "panel") {
    return (
      <WpPanel title="Test result" description="Review before applying to live site" badge={badge}>
        {content}
      </WpPanel>
    );
  }

  return (
    <WpFeatureCard
      title="Smart Update test result"
      description="Review the clone test before applying updates to your live site."
      icon={Sparkles}
      badge={taskStatus ? { label: taskStatus, variant: "outline" } : undefined}
    >
      {content}
    </WpFeatureCard>
  );
}
