"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Check, ChevronsUpDown, Plus } from "lucide-react";
import { type DateRange } from "react-day-picker";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CleanListCell } from "@/components/ui/clean-list";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { ViewDetailsButton } from "@/components/ui/list-row-actions";
import {
  SearchableCleanList,
  type CleanListColumn,
  type SearchableCleanListItem,
} from "@/components/ui/searchable-clean-list";
import { cn } from "@/lib/utils";
import { trpc, type RouterOutputs } from "@/utils/trpc";

type Campaign = RouterOutputs["customerOAuth"]["campaigns"]["list"]["campaigns"][number];
type AdAccount = RouterOutputs["customerOAuth"]["assets"]["list"][number];

const CAMPAIGN_COLUMNS: CleanListColumn[] = [
  { key: "name", label: "Campaign" },
  { key: "status", label: "Status", className: "w-28", hideBelow: "@md" },
  { key: "spend", label: "Spend", className: "w-40", hideBelow: "@lg" },
  { key: "reach", label: "Reach", className: "w-24", hideBelow: "@xl" },
  { key: "results", label: "Results", className: "w-36", hideBelow: "@2xl" },
  { key: "ctr", label: "CTR", className: "w-20", hideBelow: "@3xl" },
  { key: "schedule", label: "Schedule", className: "w-44", hideBelow: "@5xl" },
  { key: "actions", label: "Actions", align: "end" },
];

function formatNumber(num: number | string): string {
  const value = typeof num === "string" ? Number.parseFloat(num) : num;
  if (!Number.isFinite(value)) return "0";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function formatCurrency(num: number | string, currency: string): string {
  const value = typeof num === "string" ? Number.parseFloat(num) : num;
  if (!Number.isFinite(value)) return `${currency} 0`;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${formatNumber(value)}`;
  }
}

function formatCtr(ctr?: string | null) {
  if (!ctr || ctr === "0") return "0%";
  const ctrNum = Number.parseFloat(ctr);
  if (!Number.isFinite(ctrNum)) return "0%";
  return `${ctrNum.toFixed(2)}%`;
}

function accountStatus(account: AdAccount): string {
  if (account.accountStatus) return account.accountStatus;
  const metadata = account.metadata as { account_status?: number | string } | null;
  const status = metadata?.account_status;
  if (typeof status === "string" && status.length > 0) return status;
  if (status === 1) return "ACTIVE";
  if (status === 2) return "DISABLED";
  if (status === 101 || status === 202) return "CLOSED";
  return "UNKNOWN";
}

function accountCurrency(account: AdAccount): string {
  if (account.currency) return account.currency;
  const metadata = account.metadata as { currency?: string } | null;
  return metadata?.currency || "USD";
}

function parseObjective(objective?: string): string {
  if (!objective) return "";
  if (objective.startsWith("OUTCOME_")) return objective.replace("OUTCOME_", "").replace(/_/g, " ");
  return objective.replace(/_/g, " ");
}

function getAccountStatusStyles(status?: string) {
  if (!status) return { variant: "secondary" as const, className: undefined };
  const upperStatus = status.toUpperCase();
  if (upperStatus === "ACTIVE") {
    return {
      variant: "outline" as const,
      className:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800 font-sans rounded-full",
    };
  }
  if (upperStatus === "DISABLED" || upperStatus === "CLOSED") {
    return { variant: "destructive" as const, className: undefined };
  }
  return { variant: "secondary" as const, className: undefined };
}

function getCampaignStatusStyles(status?: string) {
  if (!status) return { variant: "secondary" as const, className: undefined };
  const upperStatus = status.toUpperCase();
  if (upperStatus === "ACTIVE") {
    return {
      variant: "outline" as const,
      className:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800",
    };
  }
  if (upperStatus === "PAUSED") {
    return {
      variant: "outline" as const,
      className:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800",
    };
  }
  if (upperStatus === "DELETED") {
    return {
      variant: "outline" as const,
      className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-800",
    };
  }
  return { variant: "secondary" as const, className: undefined };
}

function formatSchedule(campaign: Campaign) {
  const start = campaign.startTime ? format(new Date(campaign.startTime), "MMM d, yyyy") : "No start";
  const end = campaign.stopTime ? format(new Date(campaign.stopTime), "MMM d, yyyy") : "Ongoing";
  return `${start} – ${end}`;
}

function CampaignStatusBadge({ status }: { status: string }) {
  const statusStyles = getCampaignStatusStyles(status);
  return (
    <Badge variant={statusStyles.variant} className={cn("px-2 py-0.5 text-[10px] font-semibold", statusStyles.className)}>
      {status}
    </Badge>
  );
}

function SpendCell({ campaign, currency }: { campaign: Campaign; currency: string }) {
  const insights = campaign.insights;
  if (!insights) {
    return <CleanListCell>No performance data</CleanListCell>;
  }

  const budgetProgress = campaign.budget ? (insights.spend / campaign.budget) * 100 : 0;

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <p className="truncate text-sm font-medium text-foreground">{formatCurrency(insights.spend, currency)}</p>
      {campaign.budget ? (
        <>
          <CleanListCell>of {formatCurrency(campaign.budget, currency)}</CleanListCell>
          <Progress
            value={Math.min(budgetProgress, 100)}
            className={cn("h-1", budgetProgress > 90 && "[&>div]:bg-amber-500")}
          />
        </>
      ) : null}
    </div>
  );
}

function ResultsCell({ campaign, currency }: { campaign: Campaign; currency: string }) {
  const insights = campaign.insights;
  if (insights?.results == null) {
    return <CleanListCell>—</CleanListCell>;
  }

  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <p className="truncate text-sm font-medium text-foreground">{formatNumber(insights.results)}</p>
      <CleanListCell>
        {insights.costPerResult != null
          ? `${formatCurrency(insights.costPerResult, currency)} / result`
          : ""}
      </CleanListCell>
    </div>
  );
}

function toCampaignItem(
  campaign: Campaign,
  currency: string,
  onView: (campaign: Campaign) => void,
): SearchableCleanListItem {
  return {
    key: campaign.id,
    title: campaign.name || `Campaign ${campaign.id}`,
    description: <span className="block truncate capitalize">{parseObjective(campaign.objective)}</span>,
    cells: {
      status: <CampaignStatusBadge status={campaign.status} />,
      spend: <SpendCell campaign={campaign} currency={currency} />,
      reach: <CleanListCell>{campaign.insights ? formatNumber(campaign.insights.reach) : "—"}</CleanListCell>,
      results: <ResultsCell campaign={campaign} currency={currency} />,
      ctr: <CleanListCell>{campaign.insights ? formatCtr(campaign.insights.ctr) : "—"}</CleanListCell>,
      schedule: <CleanListCell>{formatSchedule(campaign)}</CleanListCell>,
    },
    onClick: () => onView(campaign),
    actions: <ViewDetailsButton onClick={() => onView(campaign)} />,
  };
}

export function FacebookCampaignsTab() {
  const [accountPickerOpen, setAccountPickerOpen] = React.useState(false);
  const [selectedAccountId, setSelectedAccountId] = React.useState("");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);

  const accountsQuery = trpc.customerOAuth.assets.list.useQuery({
    platform: "meta_facebook",
    assetType: "meta_ad_account",
    isActive: true,
  });
  const accounts = accountsQuery.data ?? [];

  React.useEffect(() => {
    if (selectedAccountId || accounts.length === 0) return;
    const first = accounts[0];
    if (first) setSelectedAccountId(first.id);
  }, [accounts, selectedAccountId]);

  const selectedAccount = accounts.find((account) => account.id === selectedAccountId);
  const currency = selectedAccount ? accountCurrency(selectedAccount) : "USD";
  const timeRange =
    dateRange?.from && dateRange?.to
      ? { since: format(dateRange.from, "yyyy-MM-dd"), until: format(dateRange.to, "yyyy-MM-dd") }
      : undefined;

  const campaignsQuery = trpc.customerOAuth.campaigns.list.useQuery(
    { assetId: selectedAccountId, timeRange },
    { enabled: selectedAccountId.length > 0 },
  );

  const accountCampaigns = campaignsQuery.data?.campaigns ?? [];

  const filteredCampaigns = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return accountCampaigns;
    return accountCampaigns.filter((campaign) => {
      const objective = parseObjective(campaign.objective).toLowerCase();
      return (
        campaign.name.toLowerCase().includes(query) ||
        campaign.status.toLowerCase().includes(query) ||
        objective.includes(query)
      );
    });
  }, [accountCampaigns, searchQuery]);

  const items = filteredCampaigns.map((campaign) =>
    toCampaignItem(campaign, currency, () => {
      // Campaign detail is not wired yet.
    }),
  );

  return (
    <div className="space-y-4">
      <div className="w-full md:max-w-md">
        <Popover open={accountPickerOpen} onOpenChange={setAccountPickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={accountPickerOpen}
              className="h-auto min-h-9 w-full justify-between border-muted/60 px-3 py-1.5 font-normal shadow-sm"
            >
              {selectedAccount ? (
                <AdAccountLabel account={selectedAccount} />
              ) : (
                <span className="text-muted-foreground">Select an ad account</span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search ad accounts..." />
              <CommandList className="max-h-64 overflow-auto">
                <CommandEmpty>No ad account found.</CommandEmpty>
                <CommandGroup>
                  {accounts.map((account) => {
                    const status = accountStatus(account);
                    const statusStyles = getAccountStatusStyles(status);
                    return (
                      <CommandItem
                        key={account.id}
                        value={`${account.name} ${account.platformAssetId} ${accountCurrency(account)}`}
                        onSelect={() => {
                          setSelectedAccountId(account.id);
                          setAccountPickerOpen(false);
                          setSearchQuery("");
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedAccountId === account.id ? "opacity-100" : "opacity-0",
                          )}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{account.name}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {accountCurrency(account)}
                          </span>
                        </span>
                        <Badge
                          variant={statusStyles.variant}
                          className={cn("shrink-0 px-1 py-0 text-[8px] font-bold uppercase", statusStyles.className)}
                        >
                          {status}
                        </Badge>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <SearchableCleanList
        items={items}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        totalCount={accountCampaigns.length}
        searchPlaceholder="Search campaigns..."
        emptyMessage={
          accounts.length === 0
            ? "No ad accounts imported yet."
            : searchQuery.trim()
              ? "No campaigns match your search."
              : "No campaigns for this ad account."
        }
        isLoading={accountsQuery.isLoading || (selectedAccountId.length > 0 && campaignsQuery.isLoading)}
        isError={accountsQuery.isError || campaignsQuery.isError}
        error={(accountsQuery.error ?? campaignsQuery.error) as Error | null}
        onRetry={() => {
          void accountsQuery.refetch();
          void campaignsQuery.refetch();
        }}
        columns={CAMPAIGN_COLUMNS}
        toolbarActions={
          <>
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-9 justify-start border-muted/60 px-3 font-normal shadow-sm",
                    !dateRange && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "MMM dd, yyyy")} - {format(dateRange.to, "MMM dd, yyyy")}
                      </>
                    ) : (
                      format(dateRange.from, "MMM dd, yyyy")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
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
                />
              </PopoverContent>
            </Popover>
            <Button size="sm" className="h-9 w-fit">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Create campaign
            </Button>
          </>
        }
      />
    </div>
  );
}

function AdAccountLabel({ account }: { account: AdAccount }) {
  const status = accountStatus(account);
  const statusStyles = getAccountStatusStyles(status);
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate font-medium">{account.name}</span>
        <span className="block truncate text-xs text-muted-foreground">{accountCurrency(account)}</span>
      </span>
      <Badge
        variant={statusStyles.variant}
        className={cn("shrink-0 px-1 py-0 text-[8px] font-bold uppercase", statusStyles.className)}
      >
        {status}
      </Badge>
    </div>
  );
}
