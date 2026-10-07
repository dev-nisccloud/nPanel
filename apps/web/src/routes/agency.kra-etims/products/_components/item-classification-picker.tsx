"use client";

import * as React from "react";
import { Check, Loader2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

const PAGE_SIZE = 40;
const LEVELS = [1, 2, 3, 4, 5] as const;

function levelFromCode(code?: string): number | null {
  const length = code?.trim().length ?? 0;
  if (length === 2) return 1;
  if (length === 4) return 2;
  if (length === 6) return 3;
  if (length === 8) return 4;
  if (length === 10) return 5;
  return null;
}

type ClassRow = {
  itemClsCd: string;
  itemClsNm: string;
  itemClsLvl: number;
  taxTyCd?: string | null;
};

type Props = {
  value?: string;
  onChange: (itemClsCd: string, taxTyCd?: string | null) => void;
  onBlur?: () => void;
  disabled?: boolean;
  enabled?: boolean;
};

export function ItemClassificationPicker({ value, onChange, onBlur, disabled, enabled = true }: Props) {
  const [level, setLevel] = React.useState(() => levelFromCode(value) ?? 4);
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [rows, setRows] = React.useState<ClassRow[]>([]);
  const [knownTotal, setKnownTotal] = React.useState(0);
  const listRef = React.useRef<HTMLDivElement>(null);
  const loadMoreRef = React.useRef<HTMLDivElement>(null);
  const loadingMoreRef = React.useRef(false);

  const metaQuery = trpc.etims.data.getItemClassMeta.useQuery(undefined, {
    enabled,
    staleTime: 30_000,
    retry: 1,
  });

  const selectedCodeQuery = trpc.etims.data.getItemClassification.useQuery(
    { itemClsCd: value?.trim() ?? "" },
    { enabled: enabled && !!value?.trim() && !!metaQuery.data?.meta, retry: 1 },
  );

  const listQuery = trpc.etims.data.listItemClassifications.useQuery(
    {
      level,
      search: debouncedSearch || undefined,
      page,
      pageSize: PAGE_SIZE,
    },
    {
      enabled: enabled && !!metaQuery.data?.meta,
      retry: 1,
    },
  );

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
      loadingMoreRef.current = false;
    }, 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  React.useEffect(() => {
    if (!enabled) return;
    setLevel(levelFromCode(value) ?? 4);
    setSearch("");
    setDebouncedSearch("");
    setPage(1);
    setRows([]);
    setKnownTotal(0);
  }, [enabled]);

  React.useEffect(() => {
    if (!listQuery.isFetching) loadingMoreRef.current = false;
  }, [listQuery.isFetching]);

  React.useEffect(() => {
    const data = listQuery.data;
    if (!data?.success) return;
    const items = (data.items ?? []) as ClassRow[];
    const returnedPage = data.page ?? 1;
    setKnownTotal(Number(data.total ?? 0));
    setRows((prev) => {
      if (returnedPage <= 1) return items;
      if (returnedPage !== page) return prev;
      const seen = new Set(prev.map((row) => row.itemClsCd));
      return [...prev, ...items.filter((row) => !seen.has(row.itemClsCd))];
    });
  }, [listQuery.data, page]);

  const meta = metaQuery.data?.meta ?? null;
  const empty = Boolean(metaQuery.data?.empty ?? metaQuery.data?.needsSync ?? !meta);
  const errorMessage = metaQuery.data?.errorMessage
    ?? (metaQuery.error?.message || null)
    ?? (listQuery.data && "errorMessage" in listQuery.data ? String(listQuery.data.errorMessage ?? "") : null)
    ?? (listQuery.error?.message || null);

  const total = listQuery.data?.success ? Number(listQuery.data.total ?? knownTotal) : knownTotal;
  const lastPageEmpty = page > 1 && Boolean(listQuery.data?.success) && (listQuery.data?.items?.length ?? 0) === 0;
  const hasMore = rows.length < total && !lastPageEmpty;
  const searching = search.trim() !== debouncedSearch;
  const firstPageLoading = page === 1 && listQuery.isFetching && rows.length === 0;
  const refreshing = page === 1 && listQuery.isFetching && rows.length > 0;
  const selectedItem = selectedCodeQuery.data?.item ?? rows.find((row) => row.itemClsCd === value?.trim()) ?? null;
  const listFailed = Boolean(
    (listQuery.isError || listQuery.data?.success === false) && rows.length === 0,
  );

  React.useEffect(() => {
    const root = listRef.current;
    const target = loadMoreRef.current;
    if (!root || !target || disabled) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        if (listQuery.isFetching || loadingMoreRef.current || !hasMore) return;
        loadingMoreRef.current = true;
        setPage((current) => current + 1);
      },
      { root, rootMargin: "120px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [disabled, hasMore, listQuery.isFetching, rows.length]);

  const handleLevelChange = (next: string) => {
    if (!next) return;
    setLevel(Number(next));
    setPage(1);
    setRows([]);
    setKnownTotal(0);
    loadingMoreRef.current = false;
  };

  const handleSelectCode = (itemClsCd: string, taxTyCd?: string | null) => {
    if (disabled) return;
    onChange(itemClsCd, taxTyCd);
    onBlur?.();
  };

  if (metaQuery.isLoading) {
    return (
      <div className="rounded-lg border p-3 space-y-2">
        <div className="h-8 rounded-md bg-muted animate-pulse" />
        <div className="h-9 rounded-md bg-muted animate-pulse" />
        <div className="h-40 rounded-md bg-muted animate-pulse" />
      </div>
    );
  }

  if (metaQuery.isError || metaQuery.data?.success === false) {
    return (
      <div className="rounded-lg border border-destructive/40 p-3 space-y-2">
        <p className="text-sm text-destructive">{errorMessage || "Could not load codes."}</p>
        <Button type="button" variant="outline" size="sm" onClick={() => void metaQuery.refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  if (empty || !meta) {
    return (
      <div className="rounded-lg border p-3 space-y-2">
        <p className="text-sm">No codes stored.</p>
        <pre className="rounded-md bg-muted px-3 py-2 text-xs overflow-x-auto">bun run etims:sync-classifications</pre>
        <Button type="button" variant="outline" size="sm" onClick={() => void metaQuery.refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {value?.trim() ? (
        <div className="rounded-md border px-3 py-2">
          <p className="font-mono text-sm leading-none">{value.trim()}</p>
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {selectedItem?.itemClsNm
              ?? (selectedCodeQuery.isFetching ? "…" : "Saved code")}
          </p>
        </div>
      ) : null}

      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        value={String(level)}
        onValueChange={handleLevelChange}
        disabled={disabled}
        className="w-full"
        aria-label="Classification level"
      >
        {LEVELS.map((item) => {
          const count = meta.levelCounts?.[item] ?? 0;
          return (
            <ToggleGroupItem
              key={item}
              value={String(item)}
              disabled={disabled || count === 0}
              className="flex-1 px-0 text-xs"
              aria-label={`Level ${item}`}
            >
              {item}
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>

      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          disabled={disabled}
          placeholder="Code or name"
          className="pl-8 pr-8"
          onChange={(event) => setSearch(event.target.value)}
          onPointerDown={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
        />
        {searching || listQuery.isFetching ? (
          <Loader2 className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        ) : null}
      </div>

      <div
        ref={listRef}
        className="relative rounded-lg border max-h-64 overflow-y-auto"
        onPointerDown={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {listFailed ? (
          <div className="py-8 text-center text-sm text-destructive px-3">
            {errorMessage || "Failed to load codes."}
          </div>
        ) : firstPageLoading ? (
          <div className="p-2 space-y-1">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-9 rounded-md bg-muted animate-pulse" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">No matches.</div>
        ) : (
          <ul className={cn("divide-y", refreshing && "opacity-60")}>
            {rows.map((row) => {
              const isSelected = value?.trim() === row.itemClsCd;
              return (
                <li key={row.itemClsCd}>
                  <button
                    type="button"
                    disabled={disabled}
                    onPointerDown={(event) => event.stopPropagation()}
                    onMouseDown={(event) => event.stopPropagation()}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleSelectCode(row.itemClsCd, row.taxTyCd);
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
                    <span className="min-w-0">
                      <span className="font-mono text-xs mr-2">{row.itemClsCd}</span>
                      <span>{row.itemClsNm}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {hasMore && !firstPageLoading ? <div ref={loadMoreRef} className="h-8" /> : null}
        {page > 1 && listQuery.isFetching ? (
          <div className="flex items-center justify-center py-2 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
          </div>
        ) : null}
      </div>

      <p className="text-xs text-muted-foreground">
        {total.toLocaleString()}{debouncedSearch ? " matches" : ""}
      </p>
    </div>
  );
}
