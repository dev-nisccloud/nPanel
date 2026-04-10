"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, RefreshCw } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

import type { GoogleCampaign, LinkedInCampaignGroup, MetaCampaign } from "./types";
import { formatMoney } from "./format";
import { toTimeRange } from "./date-range";

function DateRangePicker({
  dateRange,
  setDateRange,
}: {
  dateRange: DateRange | undefined;
  setDateRange: (v: DateRange | undefined) => void;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="nodrag h-7 px-2 text-xs">
          <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
          {dateRange?.from && dateRange?.to
            ? `${format(dateRange.from, "MMM dd")} – ${format(
                dateRange.to,
                "MMM dd, yyyy"
              )}`
            : "Pick range"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={dateRange?.from}
          selected={dateRange}
          onSelect={setDateRange}
          numberOfMonths={2}
          disabled={(d) => d > new Date()}
        />
      </PopoverContent>
    </Popover>
  );
}

export function MetaCampaignsNode({
  accountId,
  accountName,
  currency,
  dateRange,
  setDateRange,
  selectedIds,
  onToggle,
}: {
  accountId: string;
  accountName: string;
  currency: string;
  dateRange: DateRange | undefined;
  setDateRange: (v: DateRange | undefined) => void;
  selectedIds: string[];
  onToggle: (campaign: MetaCampaign, checked: boolean) => void;
}) {
  const utils = trpc.useUtils();
  const timeRange = React.useMemo(() => toTimeRange(dateRange), [dateRange]);

  const q = trpc.metaAds.campaigns.listCampaigns.useQuery(
    { accountId, timeRange },
    { enabled: !!accountId, refetchOnWindowFocus: false, retry: 1 }
  );
  const campaigns: MetaCampaign[] = (q.data as any)?.data ?? [];

  const selectedSpend = React.useMemo(() => {
    const s = new Set(selectedIds);
    return campaigns.reduce((sum, c) => {
      if (!s.has(c.id)) return sum;
      const spend = c.insights?.spend ? Number(c.insights.spend) : 0;
      return sum + (Number.isFinite(spend) ? spend : 0);
    }, 0);
  }, [campaigns, selectedIds]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">Meta: Campaigns</div>
          <div className="text-[11px] text-muted-foreground truncate">
            {accountName} <span className="font-mono">({accountId})</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="nodrag h-7 w-7 px-0"
            title="Refresh campaigns"
            disabled={q.isFetching}
            onClick={async () => {
              await utils.metaAds.campaigns.listCampaigns.invalidate();
              await q.refetch();
            }}
          >
            <RefreshCw className={q.isFetching ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
          </Button>
          <DateRangePicker dateRange={dateRange} setDateRange={setDateRange} />
        </div>
      </div>

      <div className="text-[11px] text-muted-foreground">
        {q.isLoading
          ? "Loading…"
          : q.isError
            ? `Failed: ${q.error?.message ?? "Unknown error"}`
            : `${campaigns.length} found`}
      </div>

      <div className="nowheel flex max-h-[220px] flex-col gap-1 overflow-auto pr-1">
        {campaigns.map((c) => {
          const checked = selectedIds.includes(c.id);
          const spend = c.insights?.spend ? Number(c.insights.spend) : 0;
          return (
            <label
              key={c.id}
              className="nodrag flex cursor-pointer items-start gap-2 rounded-md border px-2 py-1.5 hover:bg-accent"
            >
              <Checkbox checked={checked} onCheckedChange={(v) => onToggle(c, v === true)} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium truncate">
                    {c.name ?? `Campaign ${c.id}`}
                  </span>
                  {c.status && (
                    <Badge variant="outline" className="text-[10px]">
                      {c.status}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-xs font-medium whitespace-nowrap">
                {formatMoney(Number.isFinite(spend) ? spend : 0, currency)}
              </div>
            </label>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">Selected: {selectedIds.length}</span>
        <span className="font-medium">Total: {formatMoney(selectedSpend, currency)}</span>
      </div>
    </div>
  );
}

export function GoogleCampaignsNode({
  customerId,
  accountName,
  currency,
  dateRange,
  setDateRange,
  selectedIds,
  onToggle,
}: {
  customerId: string;
  accountName: string;
  currency: string;
  dateRange: DateRange | undefined;
  setDateRange: (v: DateRange | undefined) => void;
  selectedIds: string[];
  onToggle: (campaign: GoogleCampaign, checked: boolean) => void;
}) {
  const utils = trpc.useUtils();
  const timeRange = React.useMemo(() => toTimeRange(dateRange), [dateRange]);

  const q = trpc.googleAds.campaigns.listCampaigns.useQuery(
    { customerId, timeRange },
    { enabled: !!customerId, refetchOnWindowFocus: false, retry: 1 }
  );
  const campaigns: GoogleCampaign[] = (q.data as any)?.data ?? [];

  const selectedSpend = React.useMemo(() => {
    const s = new Set(selectedIds);
    return campaigns.reduce((sum, c) => {
      if (!s.has(c.id)) return sum;
      const spend = c.insights?.cost ? Number(c.insights.cost) : 0;
      return sum + (Number.isFinite(spend) ? spend : 0);
    }, 0);
  }, [campaigns, selectedIds]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">Google Ads: Campaigns</div>
          <div className="text-[11px] text-muted-foreground truncate">
            {accountName} <span className="font-mono">({customerId})</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="nodrag h-7 w-7 px-0"
            title="Refresh campaigns"
            disabled={q.isFetching}
            onClick={async () => {
              await utils.googleAds.campaigns.listCampaigns.invalidate();
              await q.refetch();
            }}
          >
            <RefreshCw className={q.isFetching ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
          </Button>
          <DateRangePicker dateRange={dateRange} setDateRange={setDateRange} />
        </div>
      </div>

      <div className="text-[11px] text-muted-foreground">
        {q.isLoading
          ? "Loading…"
          : q.isError
            ? `Failed: ${q.error?.message ?? "Unknown error"}`
            : `${campaigns.length} found`}
      </div>

      <div className="nowheel flex max-h-[220px] flex-col gap-1 overflow-auto pr-1">
        {campaigns.map((c) => {
          const checked = selectedIds.includes(c.id);
          const spend = c.insights?.cost ? Number(c.insights.cost) : 0;
          return (
            <label
              key={c.id}
              className="nodrag flex cursor-pointer items-start gap-2 rounded-md border px-2 py-1.5 hover:bg-accent"
            >
              <Checkbox checked={checked} onCheckedChange={(v) => onToggle(c, v === true)} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium truncate">
                    {c.name ?? `Campaign ${c.id}`}
                  </span>
                  {c.status && (
                    <Badge variant="outline" className="text-[10px]">
                      {String(c.status)}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-xs font-medium whitespace-nowrap">
                {formatMoney(Number.isFinite(spend) ? spend : 0, currency)}
              </div>
            </label>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">Selected: {selectedIds.length}</span>
        <span className="font-medium">Total: {formatMoney(selectedSpend, currency)}</span>
      </div>
    </div>
  );
}

export function LinkedInCampaignGroupsNode({
  accountId,
  accountName,
  currency,
  dateRange,
  setDateRange,
  selectedIds,
  onToggle,
}: {
  accountId: string;
  accountName: string;
  currency: string;
  dateRange: DateRange | undefined;
  setDateRange: (v: DateRange | undefined) => void;
  selectedIds: string[];
  onToggle: (group: LinkedInCampaignGroup, checked: boolean) => void;
}) {
  const utils = trpc.useUtils();
  const timeRange = React.useMemo(() => toTimeRange(dateRange), [dateRange]);

  const q = trpc.linkedInAds.campaignGroups.listCampaignGroups.useQuery(
    { accountId, timeRange },
    { enabled: !!accountId, refetchOnWindowFocus: false, retry: 1 }
  );
  const groups: LinkedInCampaignGroup[] = (q.data as any)?.data ?? [];

  const selectedSpend = React.useMemo(() => {
    const s = new Set(selectedIds);
    return groups.reduce((sum, g) => {
      const id = String(g.id);
      if (!s.has(id)) return sum;
      const spendRaw = (g.insights as any)?.spend;
      const spend = spendRaw != null ? Number(spendRaw) : 0;
      return sum + (Number.isFinite(spend) ? spend : 0);
    }, 0);
  }, [groups, selectedIds]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">LinkedIn: Campaign groups</div>
          <div className="text-[11px] text-muted-foreground truncate">
            {accountName} <span className="font-mono">({accountId})</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="nodrag h-7 w-7 px-0"
            title="Refresh groups"
            disabled={q.isFetching}
            onClick={async () => {
              await utils.linkedInAds.campaignGroups.listCampaignGroups.invalidate();
              await q.refetch();
            }}
          >
            <RefreshCw className={q.isFetching ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
          </Button>
          <DateRangePicker dateRange={dateRange} setDateRange={setDateRange} />
        </div>
      </div>

      <div className="text-[11px] text-muted-foreground">
        {q.isLoading
          ? "Loading…"
          : q.isError
            ? `Failed: ${q.error?.message ?? "Unknown error"}`
            : `${groups.length} found`}
      </div>

      <div className="nowheel flex max-h-[220px] flex-col gap-1 overflow-auto pr-1">
        {groups.map((g) => {
          const id = String(g.id);
          const checked = selectedIds.includes(id);
          const spendRaw = (g.insights as any)?.spend;
          const spend = spendRaw != null ? Number(spendRaw) : 0;
          return (
            <label
              key={id}
              className="nodrag flex cursor-pointer items-start gap-2 rounded-md border px-2 py-1.5 hover:bg-accent"
            >
              <Checkbox checked={checked} onCheckedChange={(v) => onToggle(g, v === true)} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium truncate">
                    {g.name ?? `Group ${id}`}
                  </span>
                  {g.status && (
                    <Badge variant="outline" className="text-[10px]">
                      {String(g.status)}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-xs font-medium whitespace-nowrap">
                {formatMoney(Number.isFinite(spend) ? spend : 0, currency)}
              </div>
            </label>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">Selected: {selectedIds.length}</span>
        <span className="font-medium">Total: {formatMoney(selectedSpend, currency)}</span>
      </div>
    </div>
  );
}

