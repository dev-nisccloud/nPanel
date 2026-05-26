"use client";

import * as React from "react";
import { formatDistanceToNow } from "date-fns";
import { Clock, RotateCw, Sparkles, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/utils/trpc";
import type { RouterOutputs } from "@/utils/trpc";
import type {
  CreativeAssetAiAnalysisDetailView,
  CreativeAssetAiHistoryRowView,
} from "./ai-analysis-ui-types";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/npanel-ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

import { cn } from "@/lib/utils";
import { AiAnalysisContextDialog } from "./ai-analysis-context-dialog";

type AiAnalysisListRow = RouterOutputs["creativeAssets"]["listAiImageAnalyses"][number];

function toDetailView(d: AiAnalysisListRow["detail"]): CreativeAssetAiAnalysisDetailView | null {
  if (!d) return null;
  return { ...d };
}

function buildFallbackDetailView(row: AiAnalysisListRow): CreativeAssetAiAnalysisDetailView | null {
  if (row.status !== "COMPLETED") return null;
  if (row.overallRatingValue == null) return null;
  return {
    headline: row.summary?.trim() || "Analysis",
    modelLabel: row.model ?? "AI analysis",
    overallRatingScaleMax: row.overallRatingScaleMax,
    overallRatingValue: row.overallRatingValue,
    overallRatingReason:
      row.overallRatingReason?.trim() || "No detailed rationale was stored for this run.",
    overallRatingBand: row.overallRatingBand ?? null,
    confidenceScore: row.confidenceScore,
    ratingSummary:
      row.summary?.trim() ||
      `${row.overallRatingValue.toFixed(1)}/${row.overallRatingScaleMax}`,
    overallSummary: "",
    scores: [],
    sections: [],
    recommendations: [],
  };
}

function pickLatestCompletedDetail(rows: AiAnalysisListRow[]): CreativeAssetAiAnalysisDetailView | null {
  for (const r of rows) {
    if (r.status !== "COMPLETED") continue;
    const merged = toDetailView(r.detail) ?? buildFallbackDetailView(r);
    if (merged) return merged;
  }
  return null;
}

function mapToHistoryRow(row: AiAnalysisListRow, internalVersionNumber: number): CreativeAssetAiHistoryRowView {
  const createdRaw = row.createdAt as Date | string;
  const created = createdRaw instanceof Date ? createdRaw : new Date(createdRaw);
  const versionLabel = `Internal v${internalVersionNumber}`;
  const analysisDetail = toDetailView(row.detail) ?? buildFallbackDetailView(row);
  const failed = row.status === "FAILED";
  return {
    id: row.id,
    createdAtLabel: formatDistanceToNow(created, { addSuffix: true }),
    versionLabel,
    summary:
      row.summary?.trim() ||
      (failed ? "Analysis failed" : row.status === "PROCESSING" ? "Processing…" : "Analysis run"),
    detail: failed ? row.errorMessage ?? undefined : undefined,
    status: row.status,
    overallRatingValue: row.overallRatingValue ?? undefined,
    overallRatingScaleMax: row.overallRatingScaleMax,
    overallRatingBand: row.overallRatingBand,
    userContext: row.userContext,
    analysisDetail,
  };
}

function ratingBandBadgeClass(band: string): string {
  const b = band.toUpperCase();
  if (b.includes("STRONG") || b === "EXCELLENT")
    return "border-emerald-500/45 bg-emerald-500/12 text-emerald-900 dark:text-emerald-100";
  if (b.includes("GOOD") || b === "SOLID")
    return "border-sky-500/45 bg-sky-500/12 text-sky-900 dark:text-sky-100";
  if (b.includes("NEEDS") || b.includes("WEAK") || b === "FAIR")
    return "border-amber-500/50 bg-amber-500/12 text-amber-950 dark:text-amber-100";
  if (b.includes("POOR") || b.includes("BAD"))
    return "border-red-500/45 bg-red-500/12 text-red-900 dark:text-red-100";
  return "border-border bg-muted/60 text-foreground";
}

function statusBadgeVariant(
  status: string,
): "default" | "destructive" | "secondary" {
  const u = status.toUpperCase();
  if (u === "COMPLETED") return "default";
  if (u === "FAILED") return "destructive";
  return "secondary";
}

function confidenceBadgeClass(score: number): string {
  if (score >= 0.85)
    return "border-emerald-500/45 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100";
  if (score >= 0.65)
    return "border-sky-500/45 bg-sky-500/10 text-sky-900 dark:text-sky-100";
  return "border-amber-500/50 bg-amber-500/10 text-amber-950 dark:text-amber-100";
}

interface OverallStarRatingProps {
  value: number;
  scaleMax: number;
  /** Smaller icons for dense cards (e.g. history strip). */
  compact?: boolean;
}

function OverallStarRating({ value, scaleMax, compact }: OverallStarRatingProps) {
  const count = Math.max(1, Math.min(10, Math.round(scaleMax)));
  const clamped = Math.min(Math.max(value, 0), scaleMax);
  const perStar = scaleMax / count;
  const size = compact ? "h-4 w-4" : "h-6 w-6";

  return (
    <div
      className={cn("flex flex-wrap", compact ? "gap-px justify-end" : "gap-0.5 sm:gap-1")}
      role="img"
      aria-label={`${clamped.toFixed(1)} out of ${scaleMax} on ${count} stars`}
    >
      {Array.from({ length: count }, (_, i) => {
        const starFloor = perStar * i;
        const fill = Math.min(1, Math.max(0, (clamped - starFloor) / perStar));

        return (
          <div
            key={i}
            className={cn("relative shrink-0", compact ? "h-4 w-4" : "h-6 w-6")}
            aria-hidden
          >
            <Star
              className={cn(
                "absolute inset-0 text-muted-foreground/30 fill-muted/15",
                size,
              )}
              strokeWidth={1.25}
            />
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${fill * 100}%` }}
            >
              <Star
                className={cn(
                  "text-amber-500 fill-amber-400 drop-shadow-[0_0_2px_rgba(251,191,36,0.45)]",
                  size,
                )}
                strokeWidth={1.25}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AiAnalysisUserContextCard({ userContext }: { userContext: string }) {
  return (
    <Card className="border-border/80 bg-muted/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Context provided for this run</CardTitle>
        <CardDescription className="text-xs">
          This was shared with the AI when scoring and writing recommendations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{userContext}</p>
      </CardContent>
    </Card>
  );
}

function AiAnalysisDetailContent({
  latest,
  userContext,
}: {
  latest: CreativeAssetAiAnalysisDetailView;
  userContext?: string | null;
}) {
  return (
    <div className="space-y-5 pb-8">
      {userContext ? <AiAnalysisUserContextCard userContext={userContext} /> : null}
      <div>
        <h3 className="text-base font-semibold leading-tight">{latest.headline}</h3>
        <p className="text-xs text-muted-foreground mt-1">{latest.modelLabel}</p>
      </div>

      <Card className="border-primary/20 bg-gradient-to-br from-primary/8 via-transparent to-transparent">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-sm">Overall rating</CardTitle>
            {latest.overallRatingBand ? (
              <Badge
                variant="outline"
                className={cn(
                  "font-normal border",
                  ratingBandBadgeClass(latest.overallRatingBand),
                )}
              >
                {latest.overallRatingBand.replace(/_/g, " ")}
              </Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-2">
            <span className="text-5xl font-semibold tracking-tight tabular-nums text-foreground leading-none">
              {latest.overallRatingValue.toFixed(1)}
            </span>
            <span className="text-xl text-muted-foreground tabular-nums pb-1">
              / {latest.overallRatingScaleMax}
            </span>
            {latest.confidenceScore != null ? (
              <Badge
                variant="outline"
                className={cn(
                  "ml-auto text-[10px] font-normal tabular-nums border",
                  confidenceBadgeClass(latest.confidenceScore),
                )}
              >
                Confidence {(latest.confidenceScore * 100).toFixed(0)}%
              </Badge>
            ) : null}
          </div>
          <OverallStarRating value={latest.overallRatingValue} scaleMax={latest.overallRatingScaleMax} />
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Summary</p>
            <p className="text-sm text-foreground/90 mt-1 leading-relaxed">{latest.ratingSummary}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Reason for this rating</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">{latest.overallRatingReason}</p>
          {latest.overallSummary ? (
            <p className="text-xs text-muted-foreground leading-relaxed mt-4 pt-4 border-t border-border/70">
              {latest.overallSummary}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Scores</CardTitle>
          <CardDescription>Dimension ratings (0–100)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {latest.scores.length === 0 ? (
            <p className="text-sm text-muted-foreground">No per-dimension scores for this run.</p>
          ) : (
            latest.scores.map((s) => {
              const pct = Math.round((s.value / s.max) * 100);
              return (
                <div key={s.id} className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-medium">{s.label}</span>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {s.value}/{s.max}
                    </span>
                  </div>
                  <Progress value={pct} className="h-2" />
                  <p className="text-xs text-muted-foreground leading-snug">{s.note}</p>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h4 className="text-sm font-semibold">Deep dive</h4>
        {latest.sections.length === 0 ? (
          <p className="text-sm text-muted-foreground">No deep-dive sections for this run.</p>
        ) : (
          latest.sections.map((sec) => (
            <Card key={sec.title}>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm">{sec.title}</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                <p className="text-sm text-muted-foreground leading-relaxed">{sec.body}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-2">Recommendations</h4>
        {latest.recommendations.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recommendations listed for this run.</p>
        ) : (
          <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground leading-relaxed">
            {latest.recommendations.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export interface VersionAiAnalysisSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** True while Replicate/analysis mutation is in flight */
  isLoading: boolean;
  /** Starts another analysis pass — must call API mutation in parent */
  onRunNewAnalysis?: (userContext?: string) => void;
  versionId: string;
  internalVersionNumber: number;
  fileName: string;
}

export function VersionAiAnalysisSheet({
  open,
  onOpenChange,
  isLoading,
  onRunNewAnalysis,
  versionId,
  internalVersionNumber,
  fileName,
}: VersionAiAnalysisSheetProps) {
  const analysesQuery = trpc.creativeAssets.listAiImageAnalyses.useQuery(
    { versionId },
    { enabled: open },
  );

  const apiRows = analysesQuery.data ?? [];
  const latestDetail = React.useMemo(() => pickLatestCompletedDetail(apiRows), [apiRows]);
  const latestCompletedRow = React.useMemo(() => {
    for (const row of apiRows) {
      if (row.status === "COMPLETED") return row;
    }
    return null;
  }, [apiRows]);
  const historyRows = React.useMemo(
    () => apiRows.map((row) => mapToHistoryRow(row, internalVersionNumber)),
    [apiRows, internalVersionNumber],
  );

  const listLoading = analysesQuery.isLoading;
  const listError = analysesQuery.isError;

  const [historyDetailOpen, setHistoryDetailOpen] = React.useState(false);
  const [historyDetailRow, setHistoryDetailRow] = React.useState<CreativeAssetAiHistoryRowView | null>(null);
  const [mainTab, setMainTab] = React.useState<"analysis" | "history" | "new-run">("analysis");
  const [contextDialogOpen, setContextDialogOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setHistoryDetailOpen(false);
      setHistoryDetailRow(null);
      setMainTab("analysis");
      setContextDialogOpen(false);
    }
  }, [open]);

  const versionBadge = `Internal v${internalVersionNumber}`;

  const openRunAnalysisDialog = React.useCallback(() => {
    if (!onRunNewAnalysis || isLoading) return;
    setContextDialogOpen(true);
  }, [onRunNewAnalysis, isLoading]);

  const handleConfirmRunAnalysis = React.useCallback(
    (userContext?: string) => {
      if (!onRunNewAnalysis) return;
      setMainTab("analysis");
      onRunNewAnalysis(userContext);
    },
    [onRunNewAnalysis],
  );

  function openHistoryRun(row: CreativeAssetAiHistoryRowView) {
    setHistoryDetailRow(row);
    setHistoryDetailOpen(true);
  }

  return (
    <>
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="z-50 w-full sm:max-w-xl md:max-w-2xl p-0 flex flex-col gap-0" side="right">
        <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0 space-y-1 text-left">
          <SheetTitle className="flex flex-wrap items-center gap-2 pr-10">
            <Sparkles className="h-5 w-5 text-primary shrink-0" aria-hidden />
            <span>AI image analysis</span>
          </SheetTitle>
          <SheetDescription className="flex flex-wrap items-center gap-2">
            <span className="truncate max-w-[min(100%,32rem)]" title={fileName}>
              {fileName}
            </span>
            <span className="text-muted-foreground">·</span>
            <Badge variant="outline" className="text-xs font-mono shrink-0">
              {versionBadge}
            </Badge>
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex flex-col flex-1 min-h-[320px] items-center justify-center gap-4 px-6 py-16">
            <Spinner variant="ring" className="size-14 text-primary" />
            <div className="text-center space-y-1">
              <p className="text-sm font-medium">Analyzing image…</p>
              <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
                Running AI vision analysis on our servers. This usually takes half a minute to a couple of minutes. Keep this
                panel open until it finishes.
              </p>
            </div>
          </div>
        ) : (
          <Tabs
            value={mainTab}
            onValueChange={(v) => setMainTab(v as "analysis" | "history" | "new-run")}
            className="flex flex-col flex-1 min-h-0"
          >
            <div className="px-6 pt-4 pb-0 shrink-0 border-b">
              <TabsList
                className={cn(
                  "w-full grid h-10",
                  onRunNewAnalysis ? "grid-cols-3" : "grid-cols-2",
                )}
              >
                <TabsTrigger value="analysis" className="gap-2 px-2 text-xs sm:text-sm">
                  <Sparkles className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">Latest</span>
                </TabsTrigger>
                <TabsTrigger value="history" className="gap-2 px-2 text-xs sm:text-sm">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">History</span>
                </TabsTrigger>
                {onRunNewAnalysis ? (
                  <TabsTrigger value="new-run" className="gap-2 px-2 text-xs sm:text-sm">
                    <RotateCw className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">New run</span>
                  </TabsTrigger>
                ) : null}
              </TabsList>
            </div>

            <TabsContent value="analysis" className="flex-1 min-h-0 mt-0 data-[state=inactive]:hidden">
              <ScrollArea className="h-[min(70vh,540px)] md:h-[min(75vh,620px)]">
                <div className="px-6 py-5">
                  {listError ? (
                    <Card className="border-destructive/35 bg-destructive/5">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Could not load analyses</CardTitle>
                        <CardDescription className="text-xs">{analysesQuery.error.message}</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <Button type="button" variant="outline" size="sm" onClick={() => analysesQuery.refetch()}>
                          Try again
                        </Button>
                      </CardContent>
                    </Card>
                  ) : listLoading && apiRows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                      <Spinner variant="ring" className="size-10 text-primary" />
                      <p className="text-sm text-muted-foreground">Loading analysis history…</p>
                    </div>
                  ) : !latestDetail ? (
                    <Card className="border-dashed border-border/80 bg-muted/15">
                      <CardHeader>
                        <CardTitle className="text-base">No completed analysis yet</CardTitle>
                        <CardDescription className="text-sm leading-relaxed">
                          Run AI vision on this image to get a headline score, rationale, and recommendations. Each run is
                          saved so you can compare over time in History.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          If a run failed, check History for the error message, fix the file or try again.
                        </p>
                        {onRunNewAnalysis ? (
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant="default"
                              className="gap-2"
                              disabled={isLoading}
                              onClick={openRunAnalysisDialog}
                            >
                              <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
                              Run analysis
                            </Button>
                            <Button type="button" variant="outline" onClick={() => setMainTab("history")}>
                              View history
                            </Button>
                          </div>
                        ) : null}
                      </CardContent>
                    </Card>
                  ) : (
                    <AiAnalysisDetailContent
                      latest={latestDetail}
                      userContext={latestCompletedRow?.userContext}
                    />
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="history" className="flex-1 min-h-0 mt-0 data-[state=inactive]:hidden">
              <ScrollArea className="h-[min(70vh,540px)] md:h-[min(75vh,620px)]">
                <div className="px-6 py-5 space-y-3 pb-8">
                  {listError ? (
                    <Card className="border-destructive/35 bg-destructive/5">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Could not load history</CardTitle>
                        <CardDescription className="text-xs">{analysesQuery.error.message}</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <Button type="button" variant="outline" size="sm" onClick={() => analysesQuery.refetch()}>
                          Try again
                        </Button>
                      </CardContent>
                    </Card>
                  ) : listLoading && historyRows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                      <Spinner variant="ring" className="size-10 text-primary" />
                      <p className="text-sm text-muted-foreground">Loading runs…</p>
                    </div>
                  ) : historyRows.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border/80 bg-muted/10 px-6 py-12 text-center">
                      <p className="text-sm font-medium text-foreground">No runs yet</p>
                      <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto leading-relaxed">
                        When you analyze this version, each attempt appears here (newest first), including failures.
                      </p>
                      {onRunNewAnalysis ? (
                        <Button
                          type="button"
                          variant="default"
                          className="mt-6 gap-2"
                          disabled={isLoading}
                          onClick={openRunAnalysisDialog}
                        >
                          <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
                          Run first analysis
                        </Button>
                      ) : null}
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {historyRows.map((row) => {
                        const starRating =
                          row.status === "COMPLETED" &&
                          row.overallRatingValue != null &&
                          row.overallRatingScaleMax != null ? (
                            <OverallStarRating
                              value={row.overallRatingValue}
                              scaleMax={row.overallRatingScaleMax}
                              compact
                            />
                          ) : (
                            <span className="text-[10px] text-muted-foreground tabular-nums">Not rated</span>
                          );

                        return (
                          <li key={row.id}>
                            <Card
                              className={cn(
                                "border-border/80 transition-colors gap-0",
                                "cursor-pointer hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                              )}
                              role="button"
                              tabIndex={0}
                              onClick={() => openHistoryRun(row)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  openHistoryRun(row);
                                }
                              }}
                            >
                              <CardHeader className="py-3 px-4 pb-3 space-y-2">
                                <div className="flex flex-wrap items-center gap-2 justify-between">
                                  <span className="text-xs text-muted-foreground tabular-nums">{row.createdAtLabel}</span>
                                  <div className="flex flex-wrap items-center gap-2 justify-end">
                                    {row.status === "COMPLETED" &&
                                    row.overallRatingValue != null &&
                                    row.overallRatingScaleMax != null ? (
                                      <Badge variant="secondary" className="text-[10px] tabular-nums font-mono">
                                        {row.overallRatingValue.toFixed(1)}/{row.overallRatingScaleMax}
                                      </Badge>
                                    ) : null}
                                    {row.overallRatingBand ? (
                                      <Badge
                                        variant="outline"
                                        className={cn(
                                          "text-[10px] border",
                                          ratingBandBadgeClass(row.overallRatingBand),
                                        )}
                                      >
                                        {row.overallRatingBand.replace(/_/g, " ")}
                                      </Badge>
                                    ) : null}
                                    <Badge variant="outline" className="text-[10px] font-mono">
                                      {row.versionLabel}
                                    </Badge>
                                    <Badge variant={statusBadgeVariant(row.status)} className="text-[10px]">
                                      {row.status}
                                    </Badge>
                                  </div>
                                </div>
                                <CardTitle className="text-sm font-medium leading-snug">{row.summary}</CardTitle>
                                {row.detail ? (
                                  <CardDescription className="text-xs leading-relaxed">{row.detail}</CardDescription>
                                ) : null}
                              </CardHeader>
                              <CardFooter className="border-t px-4 py-2.5 flex items-center justify-end bg-muted/20">
                                {starRating}
                              </CardFooter>
                            </Card>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {onRunNewAnalysis ? (
              <TabsContent value="new-run" className="flex-1 min-h-0 mt-0 data-[state=inactive]:hidden">
                <ScrollArea className="h-[min(70vh,540px)] md:h-[min(75vh,620px)]">
                  <div className="px-6 py-5 pb-8 space-y-4">
                    <Card className="border-primary/20 bg-gradient-to-br from-primary/6 via-transparent to-transparent">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Run a new analysis</CardTitle>
                        <CardDescription className="text-xs leading-relaxed">
                          Each run calls the vision model and saves a row for this file version. Latest shows the most
                          recent successful result; all attempts appear in History.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Analysis can take up to a few minutes. Leave this panel open while the request completes. You
                          can add optional context before each run to improve channel-fit scoring.
                        </p>
                        <Button
                          type="button"
                          disabled={isLoading}
                          className="w-full gap-2 sm:w-auto"
                          onClick={openRunAnalysisDialog}
                        >
                          <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
                          Run analysis now
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
              </TabsContent>
            ) : null}
          </Tabs>
        )}

        <div className="mt-auto border-t px-6 py-3 flex flex-wrap items-center justify-between gap-2 shrink-0">
          {onRunNewAnalysis ? (
            <Button
              type="button"
              variant="default"
              className="gap-2"
              disabled={isLoading}
              onClick={openRunAnalysisDialog}
            >
              <RotateCw className="h-4 w-4 shrink-0" aria-hidden />
              Run new analysis
            </Button>
          ) : (
            <span aria-hidden />
          )}
          <SheetClose asChild>
            <Button type="button" variant="outline">
              Close
            </Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>

    <AiAnalysisContextDialog
      open={contextDialogOpen}
      onOpenChange={setContextDialogOpen}
      onRun={handleConfirmRunAnalysis}
      isLoading={isLoading}
    />

    <Sheet
      open={historyDetailOpen}
      onOpenChange={(nextOpen) => {
        setHistoryDetailOpen(nextOpen);
        if (!nextOpen) setHistoryDetailRow(null);
      }}
    >
      <SheetContent
        side="right"
        className="z-[70] w-full sm:max-w-xl md:max-w-2xl p-0 flex flex-col gap-0"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0 space-y-1 text-left">
          <SheetTitle className="flex flex-wrap items-center gap-2 pr-10">
            <Clock className="h-5 w-5 text-muted-foreground shrink-0" aria-hidden />
            <span>Past run</span>
            {historyDetailRow ? (
              <Badge variant={statusBadgeVariant(historyDetailRow.status)} className="font-normal text-xs">
                {historyDetailRow.status}
              </Badge>
            ) : null}
          </SheetTitle>
          <SheetDescription className="flex flex-wrap items-center gap-x-2 gap-y-1 text-left">
            {historyDetailRow ? (
              <>
                <span className="tabular-nums">{historyDetailRow.createdAtLabel}</span>
                <span className="text-muted-foreground">·</span>
                <Badge variant="outline" className="text-xs font-mono shrink-0">
                  {historyDetailRow.versionLabel}
                </Badge>
              </>
            ) : (
              <span>Open a row from History to view details.</span>
            )}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0 h-[min(70vh,540px)] md:h-[min(75vh,620px)]">
          <div className="px-6 py-5">
            {historyDetailRow == null ? (
              <p className="text-sm text-muted-foreground">Nothing selected.</p>
            ) : historyDetailRow.status === "FAILED" ? (
              <div className="space-y-3">
                <Card className="border-destructive/40 bg-destructive/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Run failed</CardTitle>
                    <CardDescription className="text-xs">No analysis was produced.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm pt-0">
                    <p className="text-foreground leading-relaxed">{historyDetailRow.summary}</p>
                    {historyDetailRow.detail ? (
                      <p className="text-xs text-muted-foreground leading-relaxed">{historyDetailRow.detail}</p>
                    ) : null}
                  </CardContent>
                </Card>
              </div>
            ) : historyDetailRow.status === "PENDING" || historyDetailRow.status === "PROCESSING" ? (
              <Card className="border-border/90">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Run not finished</CardTitle>
                  <CardDescription className="text-xs">
                    This record is still marked {historyDetailRow.status.toLowerCase()}. If it stays like this, start a new
                    run from the main panel.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground leading-relaxed">{historyDetailRow.summary}</p>
                </CardContent>
              </Card>
            ) : historyDetailRow.analysisDetail ? (
              <AiAnalysisDetailContent
                latest={historyDetailRow.analysisDetail}
                userContext={historyDetailRow.userContext}
              />
            ) : (
              <Card className="border-border/80">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">No saved snapshot</CardTitle>
                  <CardDescription className="text-xs">
                    This completed run doesn&apos;t have detailed analysis cached for preview.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  <p className="text-sm text-muted-foreground leading-relaxed">{historyDetailRow.summary}</p>
                  {historyDetailRow.detail ? (
                    <p className="text-xs text-muted-foreground leading-relaxed">{historyDetailRow.detail}</p>
                  ) : null}
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>

        <div className="mt-auto border-t px-6 py-3 flex justify-end shrink-0">
          <SheetClose asChild>
            <Button type="button" variant="outline">
              Close
            </Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
    </>
  );
}
