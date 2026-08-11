"use client";

import * as React from "react";
import { Link } from "react-router";
import {
  endOfDay,
  endOfMonth,
  format,
  startOfDay,
  startOfMonth,
  subDays,
} from "date-fns";
import type { DateRange } from "react-day-picker";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Calendar as CalendarIcon,
  Coins,
  Cpu,
  RefreshCw,
  Timer,
  TriangleAlert,
  Users,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ProviderFilter = "all" | "anthropic" | "google";
type EventTypeFilter = "all" | "chat_turn" | "generation" | "image_edit" | "other";
type StatusFilter = "all" | "succeeded" | "failed" | "cancelled" | "partial";
type GroupBy = "user" | "team";

type Preset = "24h" | "7d" | "30d" | "month" | "custom";

function formatUsd(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(n);
}

function formatInt(n: number): string {
  return Math.round(n).toLocaleString();
}

function providerLabel(provider: string | null | undefined): string {
  if (provider === "anthropic") return "Claude";
  if (provider === "google") return "Google";
  return provider || "—";
}

function eventLabel(eventType: string): string {
  switch (eventType) {
    case "chat_turn":
      return "Chat turn";
    case "generation":
      return "Generation";
    case "image_edit":
      return "Image edit";
    default:
      return eventType.replace(/_/g, " ");
  }
}

function rangeForPreset(preset: Preset): DateRange {
  const now = new Date();
  if (preset === "24h") return { from: subDays(now, 1), to: now };
  if (preset === "7d") return { from: startOfDay(subDays(now, 6)), to: endOfDay(now) };
  if (preset === "30d") return { from: startOfDay(subDays(now, 29)), to: endOfDay(now) };
  if (preset === "month") return { from: startOfMonth(now), to: endOfMonth(now) };
  return { from: startOfDay(subDays(now, 6)), to: endOfDay(now) };
}

function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "default" | "warn" | "accent";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-card px-4 py-3.5 shadow-sm",
        tone === "warn" && "border-amber-500/30 bg-amber-500/[0.04]",
        tone === "accent" && "border-primary/25 bg-primary/[0.03]",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <span
          className={cn(
            "flex size-7 items-center justify-center rounded-lg bg-muted text-muted-foreground",
            tone === "warn" && "bg-amber-500/15 text-amber-700 dark:text-amber-300",
            tone === "accent" && "bg-primary/10 text-primary",
          )}
        >
          <Icon className="size-3.5" />
        </span>
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums text-foreground">
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function ZeepoAiActivityPage() {
  const [preset, setPreset] = React.useState<Preset>("7d");
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(() =>
    rangeForPreset("7d"),
  );
  const [provider, setProvider] = React.useState<ProviderFilter>("all");
  const [eventType, setEventType] = React.useState<EventTypeFilter>("all");
  const [status, setStatus] = React.useState<StatusFilter>("all");
  const [groupBy, setGroupBy] = React.useState<GroupBy>("user");
  const [page, setPage] = React.useState(1);
  const [calendarOpen, setCalendarOpen] = React.useState(false);
  const limit = 50;

  const from = dateRange?.from ?? startOfDay(subDays(new Date(), 6));
  const to = dateRange?.to ?? endOfDay(new Date());

  const query = trpc.zeepoAi.billing.listUsageActivity.useQuery(
    {
      from,
      to,
      page,
      limit,
      provider,
      eventType,
      status,
      groupBy,
    },
    { staleTime: 30_000, placeholderData: (prev) => prev },
  );

  const applyPreset = (next: Preset) => {
    setPreset(next);
    if (next !== "custom") setDateRange(rangeForPreset(next));
    setPage(1);
  };

  const summary = query.data?.summary;
  const totalPages = Math.max(1, Math.ceil((query.data?.total ?? 0) / limit));

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-2">
            <h1 className="text-base font-semibold tracking-tight">Activity usage</h1>
            <p className="text-xs text-muted-foreground">
              Usage, cost, and token activity across all Zeepo AI model providers — grouped by user or
              team.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
            title="Refresh"
          >
            <RefreshCw className={cn("h-4 w-4", query.isFetching && "animate-spin")} />
          </Button>
        </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-2xl border bg-card/80 p-3 shadow-sm sm:p-4">
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ["24h", "Last 24h"],
              ["7d", "7 days"],
              ["30d", "30 days"],
              ["month", "This month"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => applyPreset(id)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                preset === id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                onClick={() => setPreset("custom")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  preset === "custom"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground",
                )}
              >
                <CalendarIcon className="size-3.5" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "MMM d")} – {format(dateRange.to, "MMM d")}
                    </>
                  ) : (
                    format(dateRange.from, "MMM d, yyyy")
                  )
                ) : (
                  "Custom range"
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                numberOfMonths={2}
                selected={dateRange}
                onSelect={(range) => {
                  setPreset("custom");
                  setDateRange(range);
                  setPage(1);
                  if (range?.from && range?.to) setCalendarOpen(false);
                }}
                defaultMonth={dateRange?.from}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ["user", "By user", Users],
                ["team", "By team", Building2],
              ] as const
            ).map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setGroupBy(id);
                  setPage(1);
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  groupBy === id
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-transparent bg-muted/70 text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ["all", "All providers"],
                ["anthropic", "Claude"],
                ["google", "Google"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setProvider(id);
                  setPage(1);
                }}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  provider === id
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-transparent bg-muted/70 text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <Select
            value={eventType}
            onValueChange={(v) => {
              setEventType(v as EventTypeFilter);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-[160px] rounded-full text-xs">
              <SelectValue placeholder="Event type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All events</SelectItem>
              <SelectItem value="chat_turn">Chat turns</SelectItem>
              <SelectItem value="generation">Generations</SelectItem>
              <SelectItem value="image_edit">Image edits</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v as StatusFilter);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-[140px] rounded-full text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="succeeded">Succeeded</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPIs */}
      {query.isLoading && !query.data ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[92px] rounded-2xl" />
          ))}
        </div>
      ) : summary ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <KpiCard
            label="Requests"
            value={formatInt(summary.events)}
            hint="All matching in range"
            icon={Zap}
            tone="accent"
          />
          <KpiCard
            label="Provider cost"
            value={formatUsd(summary.providerCostUsd)}
            hint="Estimated provider cost"
            icon={Coins}
          />
          <KpiCard
            label="Input tokens"
            value={formatInt(summary.inputTokens)}
            hint="Prompt / image input"
            icon={Cpu}
          />
          <KpiCard
            label="Output tokens"
            value={formatInt(summary.outputTokens)}
            hint="Completion / image out"
            icon={Cpu}
          />
          <KpiCard
            label="Customer tokens"
            value={formatInt(summary.tokensDebited)}
            hint="Debited from wallets"
            icon={Coins}
          />
          <KpiCard
            label="Failed"
            value={formatInt(summary.failed)}
            hint={`Avg latency ${formatInt(summary.avgLatencyMs)} ms`}
            icon={summary.failed > 0 ? TriangleAlert : Timer}
            tone={summary.failed > 0 ? "warn" : "default"}
          />
        </div>
      ) : null}

      {/* Breakdowns */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold">By provider</h2>
          <div className="space-y-2">
            {(query.data?.byProvider ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground">No breakdown yet</p>
            ) : (
              (query.data?.byProvider ?? []).map((row) => (
                <div
                  key={row.provider}
                  className="flex items-center justify-between gap-2 rounded-xl bg-muted/40 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{providerLabel(row.provider)}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatInt(row.events)} requests ·{" "}
                      {formatInt(row.inputTokens + row.outputTokens)} tokens
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold tabular-nums">
                    {formatUsd(row.providerCostUsd)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold">By event</h2>
          <div className="space-y-2">
            {(query.data?.byEventType ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground">No breakdown yet</p>
            ) : (
              (query.data?.byEventType ?? []).map((row) => (
                <div
                  key={row.eventType}
                  className="flex items-center justify-between gap-2 rounded-xl bg-muted/40 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium capitalize">{eventLabel(row.eventType)}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatInt(row.events)} requests
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold tabular-nums">
                    {formatUsd(row.providerCostUsd)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold">Top models</h2>
          <div className="space-y-2">
            {(query.data?.byModel ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground">No breakdown yet</p>
            ) : (
              (query.data?.byModel ?? []).map((row) => (
                <div
                  key={`${row.provider}-${row.modelId}`}
                  className="flex items-center justify-between gap-2 rounded-xl bg-muted/40 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{row.modelId}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {providerLabel(row.provider)} · {formatInt(row.events)} requests
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold tabular-nums">
                    {formatUsd(row.providerCostUsd)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Grouped table */}
      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold">
              {groupBy === "user" ? "By user" : "By team"}
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Page {page} of {totalPages} · {formatInt(query.data?.total ?? 0)}{" "}
              {groupBy === "user" ? "users" : "teams"} in range
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-8"
              disabled={page <= 1 || query.isFetching}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ArrowLeft className="size-3.5" />
            </Button>
            <span className="min-w-16 text-center text-xs tabular-nums text-muted-foreground">
              {page} / {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-8"
              disabled={page >= totalPages || query.isFetching}
              onClick={() => setPage((p) => p + 1)}
            >
              <ArrowRight className="size-3.5" />
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{groupBy === "user" ? "User" : "Team"}</TableHead>
                <TableHead className="text-right">Requests</TableHead>
                <TableHead className="text-right">In / Out</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Debited</TableHead>
                <TableHead className="text-right">
                  {groupBy === "user" ? "Teams" : "Users"}
                </TableHead>
                <TableHead className="text-right">Failed</TableHead>
                <TableHead className="whitespace-nowrap text-right">Last activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.isLoading && !query.data ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : query.isError ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-sm text-muted-foreground">
                    {query.error.message || "Could not load activity."}
                  </TableCell>
                </TableRow>
              ) : (query.data?.items.length ?? 0) === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-sm text-muted-foreground">
                    No usage in this range.
                  </TableCell>
                </TableRow>
              ) : (
                query.data?.items.map((row) => (
                  <TableRow key={row.userId ?? row.teamId ?? "agency"}>
                    <TableCell>
                      {groupBy === "user" ? (
                        <div className="min-w-0 max-w-[220px]">
                          <p className="truncate text-sm font-medium">{row.userName || "—"}</p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {row.userEmail || ""}
                          </p>
                        </div>
                      ) : row.teamSlug ? (
                        <Link
                          to={`/${row.teamSlug}/zeepo-ai`}
                          className="block max-w-[220px] truncate text-sm font-medium text-primary hover:underline"
                        >
                          {row.teamName || row.teamSlug}
                        </Link>
                      ) : (
                        <span className="text-sm font-medium">{row.teamName || "Agency"}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {formatInt(row.events)}
                    </TableCell>
                    <TableCell className="text-right text-xs tabular-nums">
                      {formatInt(row.inputTokens)} / {formatInt(row.outputTokens)}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium tabular-nums">
                      {formatUsd(row.providerCostUsd)}
                    </TableCell>
                    <TableCell className="text-right text-xs tabular-nums">
                      {formatInt(row.tokensDebited)}
                    </TableCell>
                    <TableCell className="text-right text-xs tabular-nums text-muted-foreground">
                      {formatInt(groupBy === "user" ? row.teamsTouched : row.usersTouched)}
                    </TableCell>
                    <TableCell className="text-right text-xs tabular-nums">
                      {row.failed > 0 ? (
                        <span className="text-amber-700 dark:text-amber-300">
                          {formatInt(row.failed)}
                        </span>
                      ) : (
                        "0"
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right text-xs tabular-nums text-muted-foreground">
                      {row.lastAt ? format(new Date(row.lastAt), "MMM d, HH:mm") : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      </div>
    </div>
  );
}
