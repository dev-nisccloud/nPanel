"use client";

import * as React from "react";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

const LEVEL_INFO: Record<number, { title: string; hint: string }> = {
  1: { title: "Level 1 — Segment", hint: "Top-level UNSPSC segments" },
  2: { title: "Level 2 — Family", hint: "Product/service families" },
  3: { title: "Level 3 — Class", hint: "Broader service categories" },
  4: { title: "Level 4 — Commodity", hint: "Recommended for item registration" },
  5: { title: "Level 5 — Detail", hint: "Most specific commodity codes" },
};

type Props = {
  value?: string;
  onChange: (itemClsCd: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  enabled?: boolean;
};

export function ItemClassificationPicker({ value, onChange, onBlur, disabled, enabled = true }: Props) {
  const [step, setStep] = React.useState<"level" | "browse">("level");
  const [selectedLevel, setSelectedLevel] = React.useState<number | null>(null);
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [syncProgress, setSyncProgress] = React.useState<number | null>(null);
  const [syncError, setSyncError] = React.useState<string | null>(null);

  const utils = trpc.useUtils();

  const metaQuery = trpc.etims.data.getItemClassMeta.useQuery(undefined, {
    enabled,
    staleTime: 30_000,
  });

  const syncMutation = trpc.etims.data.syncItemClassifications.useMutation();

  const selectedCodeQuery = trpc.etims.data.getItemClassification.useQuery(
    { itemClsCd: value?.trim() ?? "" },
    { enabled: enabled && !!value?.trim() && !!metaQuery.data?.meta },
  );

  const listQuery = trpc.etims.data.listItemClassifications.useQuery(
    {
      level: selectedLevel ?? 4,
      search: debouncedSearch || undefined,
      page,
      pageSize: 25,
    },
    {
      enabled: enabled && step === "browse" && selectedLevel != null && !!metaQuery.data?.meta,
      placeholderData: (prev) => prev,
    },
  );

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  React.useEffect(() => {
    if (!enabled) return;
    setStep("level");
    setSelectedLevel(null);
    setSearch("");
    setDebouncedSearch("");
    setPage(1);
  }, [enabled]);

  const runSync = React.useCallback(async (reset = false) => {
    let lastReqDt: string | undefined;
    let hasMore = true;
    let isComplete = false;
    let batches = 0;

    setSyncError(null);
    setSyncProgress(0);

    try {
      while (hasMore && !isComplete) {
        const result = await syncMutation.mutateAsync({
          reset: reset && batches === 0,
          maxPages: 3,
          lastReqDt,
        });

        batches += result.pagesFetched;
        hasMore = result.hasMore;
        isComplete = result.isComplete;
        lastReqDt = result.nextLastReqDt;

        if (isComplete) {
          setSyncProgress(100);
        } else if (result.totalSynced > 0) {
          setSyncProgress(Math.min(95, Math.round((result.totalSynced / 150_000) * 100)));
        }

        reset = false;
      }

      await utils.etims.data.getItemClassMeta.invalidate();
      await utils.etims.data.listItemClassifications.invalidate();
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "Failed to sync classifications from KRA");
      throw error;
    } finally {
      setSyncProgress(null);
    }
  }, [syncMutation, utils.etims.data.getItemClassMeta]);

  const syncAttemptedRef = React.useRef(false);

  React.useEffect(() => {
    if (!enabled) {
      syncAttemptedRef.current = false;
      return;
    }
    if (metaQuery.isLoading || metaQuery.data?.needsSync !== true) return;
    if (syncAttemptedRef.current || syncMutation.isPending || syncProgress != null) return;

    syncAttemptedRef.current = true;
    void runSync(true).catch(() => {
      syncAttemptedRef.current = false;
    });
  }, [enabled, metaQuery.isLoading, metaQuery.data?.needsSync, syncMutation.isPending, syncProgress, runSync]);

  const meta = metaQuery.data?.meta;
  const needsSync = metaQuery.data?.needsSync ?? true;
  const isSyncing = syncMutation.isPending || syncProgress != null;

  const selectedLabel = React.useMemo(() => {
    if (!value?.trim()) return null;
    const fromList = listQuery.data?.items.find((row) => row.itemClsCd === value.trim());
    if (fromList) return `${fromList.itemClsCd} — ${fromList.itemClsNm}`;
    const cached = selectedCodeQuery.data?.item;
    if (cached) return `${cached.itemClsCd} — ${cached.itemClsNm}`;
    return `${value.trim()} (saved classification)`;
  }, [value, listQuery.data?.items, selectedCodeQuery.data?.item]);

  const handlePickLevel = (level: number) => {
    setSelectedLevel(level);
    setSearch("");
    setDebouncedSearch("");
    setPage(1);
    setStep("browse");
  };

  const handleBackToLevels = () => {
    setStep("level");
    setSelectedLevel(null);
    setSearch("");
    setDebouncedSearch("");
    setPage(1);
  };

  const handleSelectCode = (itemClsCd: string) => {
    if (disabled) return;
    onChange(itemClsCd);
    onBlur?.();
    setStep("level");
    setSelectedLevel(null);
    setSearch("");
    setDebouncedSearch("");
    setPage(1);
  };

  const selectedBanner = value?.trim() && selectedLabel ? (
    <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
      <span className="text-muted-foreground">Selected: </span>
      {selectedLabel}
    </div>
  ) : null;

  if (syncError) {
    return (
      <div className="rounded-lg border border-destructive/40 p-4 space-y-3">
        <p className="text-sm text-destructive">{syncError}</p>
        <Button type="button" variant="outline" size="sm" onClick={() => void runSync(true)}>
          Retry sync
        </Button>
      </div>
    );
  }

  if (needsSync || isSyncing) {
    return (
      <div className="rounded-lg border p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin" />
          <span>Getting classification codes for you…</span>
        </div>
        {syncProgress != null && <Progress value={syncProgress} className="h-2" />}
      </div>
    );
  }

  if (step === "level") {
    return (
      <div className="space-y-3">
        {selectedBanner}

        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">Choose a hierarchy level to browse codes.</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled || isSyncing}
            onClick={() => {
              syncAttemptedRef.current = true;
              void runSync(true).finally(() => {
                syncAttemptedRef.current = false;
              });
            }}
          >
            <RefreshCw className="size-3.5 mr-1.5" />
            Resync
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[1, 2, 3, 4, 5].map((level) => {
            const count = meta?.levelCounts[level] ?? 0;
            const info = LEVEL_INFO[level];
            return (
              <button
                key={level}
                type="button"
                disabled={disabled || count === 0}
                onClick={() => handlePickLevel(level)}
                className={cn(
                  "rounded-lg border px-3 py-3 text-left transition-colors hover:bg-muted/50",
                  "disabled:opacity-50 disabled:pointer-events-none",
                  level === 4 && "border-primary/40 bg-primary/5",
                )}
              >
                <div className="font-medium text-sm">{info.title}</div>
                <div className="text-xs text-muted-foreground mt-1">{info.hint}</div>
                <div className="text-xs mt-2">{count.toLocaleString()} codes</div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const levelInfo = selectedLevel ? LEVEL_INFO[selectedLevel] : null;
  const totalPages = listQuery.data?.totalPages ?? 0;
  const currentPage = listQuery.data?.page ?? page;

  return (
    <div className="space-y-3">
      {selectedBanner}

      <div className="flex items-center gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={handleBackToLevels} disabled={disabled}>
          <ArrowLeft className="size-3.5 mr-1" />
          All levels
        </Button>
        <span className="text-sm font-medium">{levelInfo?.title}</span>
      </div>

      <Input
        placeholder="Search by code or name…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        disabled={disabled}
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      />

      <div
        className="rounded-lg border max-h-64 overflow-y-auto"
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {listQuery.isLoading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading…
          </div>
        ) : (listQuery.data?.items.length ?? 0) === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">No codes match your search.</div>
        ) : (
          <ul className="divide-y">
            {listQuery.data?.items.map((row) => {
              const isSelected = value?.trim() === row.itemClsCd;
              return (
                <li key={row.itemClsCd}>
                  <button
                    type="button"
                    disabled={disabled}
                    onPointerDown={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectCode(row.itemClsCd);
                    }}
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors flex items-start gap-2",
                      isSelected && "bg-primary/10",
                    )}
                  >
                    <Check
                      className={cn(
                        "size-4 shrink-0 mt-0.5",
                        isSelected ? "opacity-100 text-primary" : "opacity-0",
                      )}
                    />
                    <span>
                      <span className="font-mono text-xs mr-2">{row.itemClsCd}</span>
                      <span>{row.itemClsNm}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {(listQuery.data?.total ?? 0).toLocaleString()} codes
          {debouncedSearch ? " matching search" : ""}
        </p>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8"
            disabled={disabled || currentPage <= 1 || listQuery.isFetching}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-xs min-w-24 text-center">
            Page {currentPage}{totalPages ? ` of ${totalPages}` : ""}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8"
            disabled={disabled || currentPage >= totalPages || listQuery.isFetching}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
