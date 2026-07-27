"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";
import { CheckCircle2Icon, XIcon, AlertTriangleIcon, TrendingUpIcon } from "lucide-react";
import { useCredentialsConfigured } from "./credentials-banner";
import { CREDENTIALS_TOAST, type SeoProject } from "./seo-suite-utils";

interface SmartRecommendationsTabProps {
  projectId: string;
  project: SeoProject;
}

export function SmartRecommendationsTab({ projectId }: SmartRecommendationsTabProps) {
  const { configured } = useCredentialsConfigured();
  const utils = trpc.useUtils();

  const recommendations = trpc.seoSuite.listRecommendations.useQuery(
    { projectId },
    { enabled: configured, staleTime: 60_000 },
  );

  const generateRecs = trpc.seoSuite.generateRecommendations.useMutation({
    onSuccess: () => {
      toast.success("Recommendations generated");
      utils.seoSuite.listRecommendations.invalidate({ projectId });
    },
    onError: (e) => toast.error(e.message || "Failed to generate recommendations"),
  });

  const dismissRec = trpc.seoSuite.dismissRecommendation.useMutation({
    onSuccess: () => {
      utils.seoSuite.listRecommendations.invalidate({ projectId });
    },
  });

  if (!configured) {
    return (
      <div className="flex items-center justify-center py-12 text-center">
        <p className="text-sm text-muted-foreground">
          Configure DataForSEO credentials to view recommendations
        </p>
      </div>
    );
  }

  if (recommendations.isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  const activeRecs = (recommendations.data || []).filter((r) => !r.dismissed);

  const getImpactColor = (impact: string | null) => {
    switch (impact) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "quick_win":
        return <TrendingUpIcon className="h-5 w-5 text-green-500" />;
      case "anomaly":
        return <AlertTriangleIcon className="h-5 w-5 text-orange-500" />;
      default:
        return <CheckCircle2Icon className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">Smart Recommendations</h2>
          <p className="text-xs text-muted-foreground">
            AI-powered insights and actionable opportunities
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (!configured) {
              toast.error(CREDENTIALS_TOAST);
              return;
            }
            generateRecs.mutate({ projectId });
          }}
          disabled={generateRecs.isPending}
        >
          {generateRecs.isPending ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Generating...
            </>
          ) : (
            "Generate Recommendations"
          )}
        </Button>
      </div>

      {activeRecs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            No recommendations yet. Click "Generate Recommendations" to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeRecs.map((rec) => (
            <div
              key={rec.id}
              className="rounded-lg border bg-card p-6 shadow-sm hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="mt-0.5">{getTypeIcon(rec.type)}</div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-semibold">{rec.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {rec.description}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => dismissRec.mutate({ id: rec.id })}
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={getImpactColor(rec.impact)}>
                      Impact: {rec.impact || "unknown"}
                    </Badge>
                    <Badge variant="outline">Effort: {rec.effort || "unknown"}</Badge>
                    <Badge variant="secondary">{rec.category}</Badge>
                    {rec.priority != null && (
                      <Badge>Priority: {rec.priority}</Badge>
                    )}
                  </div>
                  {rec.actionUrl && (
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0"
                      onClick={() => {
                        // Navigate to action URL
                        window.location.hash = rec.actionUrl || "";
                      }}
                    >
                      Take Action →
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
