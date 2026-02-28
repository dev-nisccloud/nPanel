"use client";

import * as React from "react";
import { format } from "date-fns";
import { type DateRange } from "react-day-picker";
import { Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/npanel-ui/sheet";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import { cn } from "@/lib/utils";
import type { ItemCommissionContext } from "@/app/(main)/agency/invoices/create/types";

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  KES: "KSh",
};

/** If account currency contains KSH (case-insensitive) or is KES, use KES; else USD */
function getAccountCurrency(currency: string | null | undefined): "USD" | "KES" {
  if (!currency || typeof currency !== "string") return "USD";
  const u = currency.toUpperCase();
  if (u.includes("KSH") || u === "KES") return "KES";
  return "USD";
}

function getCurrencySymbol(currency: "USD" | "KES"): string {
  return CURRENCY_SYMBOLS[currency] ?? currency;
}

interface SelectAdAccountSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commissionRatePercent: number;
  onSelect: (context: ItemCommissionContext) => void;
}

export function SelectAdAccountSheet({
  open,
  onOpenChange,
  commissionRatePercent,
  onSelect,
}: SelectAdAccountSheetProps) {
  const [selectedAccountId, setSelectedAccountId] = React.useState<string | null>(null);
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);
  const [selectedCampaign, setSelectedCampaign] = React.useState<{
    id: string;
    name: string;
    spend: number;
  } | null>(null);

  const timeRange =
    dateRange?.from && dateRange?.to
      ? { since: format(dateRange.from, "yyyy-MM-dd"), until: format(dateRange.to, "yyyy-MM-dd") }
      : undefined;

  const { data: accountsData, isLoading: isLoadingAccounts } =
    trpc.metaAds.accounts.listAdAccounts.useQuery(undefined, {
      enabled: open,
      refetchOnWindowFocus: false,
      retry: 1,
    });

  const {
    data: campaignsData,
    isLoading: isLoadingCampaigns,
    error: campaignsError,
  } = trpc.metaAds.campaigns.listCampaigns.useQuery(
    { accountId: selectedAccountId ?? "", timeRange },
    {
      enabled: open && !!selectedAccountId && !!timeRange,
      refetchOnWindowFocus: false,
      retry: 1,
    }
  );

  const convertPricesMutation = trpc.currency.convertPrices.useMutation();

  React.useEffect(() => {
    if (campaignsError) {
      toast.error(campaignsError.message || "Failed to load campaigns");
    }
  }, [campaignsError]);

  const accounts = (accountsData as {
    data?: Array<{ accountId: string; accountName?: string; currency?: string }>;
  })?.data ?? [];
  const campaigns = (campaignsData as {
    data?: Array<{ id: string; name?: string; insights?: { spend?: string } }>;
  })?.data ?? [];

  const selectedAccount = accounts.find(
    (a: { accountId: string }) => a.accountId === selectedAccountId
  ) as { accountId: string; accountName?: string; currency?: string } | undefined;

  const accountCurrency = getAccountCurrency(selectedAccount?.currency);
  const currencySymbol = getCurrencySymbol(accountCurrency);

  const totalAmount = selectedCampaign?.spend ?? 0;

  const [kesConverted, setKesConverted] = React.useState<number | null>(null);
  React.useEffect(() => {
    if (accountCurrency !== "USD" || totalAmount <= 0) {
      setKesConverted(null);
      return;
    }
    let cancelled = false;
    convertPricesMutation
      .mutateAsync({
        prices: [{ amount: totalAmount, currency: "USD" }],
        targetCurrency: "KES",
      })
      .then((result) => {
        if (cancelled || !result?.success || !result.data?.length) return;
        setKesConverted(result.data[0].convertedAmount);
      })
      .catch(() => {
        if (!cancelled) setKesConverted(null);
      });
    return () => {
      cancelled = true;
    };
  }, [accountCurrency, totalAmount]);

  const handleConfirm = () => {
    if (!selectedAccountId || !selectedAccount || !selectedCampaign || !dateRange?.from || !dateRange?.to) {
      toast.error("Please select an account, date range, and a campaign.");
      return;
    }
    onSelect({
      metaAdsAccountId: selectedAccountId,
      metaAdsAccountName: selectedAccount.accountName ?? undefined,
      metaAdsCampaignId: selectedCampaign.id,
      metaAdsCampaignName: selectedCampaign.name,
      dateRangeSince: format(dateRange.from, "yyyy-MM-dd"),
      dateRangeUntil: format(dateRange.to, "yyyy-MM-dd"),
      adSpend: selectedCampaign.spend,
      commissionRatePercent,
    });
    onOpenChange(false);
    setSelectedAccountId(null);
    setSelectedCampaign(null);
  };

  const handleClose = (next: boolean) => {
    if (!next) {
      setSelectedAccountId(null);
      setSelectedCampaign(null);
    }
    onOpenChange(next);
  };

  const formatAmount = (value: number, currency: "USD" | "KES"): string => {
    return `${getCurrencySymbol(currency)} ${value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="overflow-y-auto sm:max-w-[520px]" title="Select ad account">
        <SheetHeader className="mb-6 flex justify-between items-center flex-row">
          <div className="flex flex-col gap-1">
            <SheetTitle className="text-2xl font-bold">Select ad account</SheetTitle>
            <SheetDescription className="text-base">
              Choose an ad account, date range, then a campaign to use ad spend for commission.
            </SheetDescription>
          </div>
          <SheetClose asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
              ×
            </Button>
          </SheetClose>
        </SheetHeader>

        <div className="flex flex-col gap-6">
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Ad account</p>
            {isLoadingAccounts ? (
              <div className="flex items-center justify-center py-8">
                <Spinner size={24} />
              </div>
            ) : accounts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                No Meta ad accounts found. Connect your account in Ad Campaigns first.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-[200px] overflow-y-auto rounded-lg border border-border p-1">
                {accounts.map((account: { accountId: string; accountName?: string }) => (
                  <button
                    key={account.accountId}
                    type="button"
                    onClick={() => {
                      setSelectedAccountId(account.accountId);
                      setSelectedCampaign(null);
                    }}
                    className={cn(
                      "w-full text-left p-3 rounded-md border transition-colors",
                      selectedAccountId === account.accountId
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-transparent hover:bg-muted/60"
                    )}
                  >
                    <p className="font-medium truncate">
                      {account.accountName || `Account ${account.accountId}`}
                    </p>
                    <p className="text-xs text-muted-foreground">ID: {account.accountId}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedAccountId && (
            <>
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Date range</p>
                <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-left font-normal h-9"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from && dateRange?.to ? (
                        format(dateRange.from, "MMM dd") === format(dateRange.to, "MMM dd") ? (
                          format(dateRange.from, "MMM dd, yyyy")
                        ) : (
                          <>
                            {format(dateRange.from, "MMM dd")} – {format(dateRange.to, "MMM dd, yyyy")}
                          </>
                        )
                      ) : (
                        "Pick a date range"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                      disabled={(date) => date > new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {timeRange && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Campaigns (ad spend for period)</p>
                  {isLoadingCampaigns ? (
                    <div className="flex items-center justify-center py-8">
                      <Spinner size={24} />
                    </div>
                  ) : campaigns.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">
                      No campaigns with spend in this date range.
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-[240px] overflow-y-auto rounded-lg border border-border">
                      {campaigns.map((campaign: { id: string; name?: string; insights?: { spend?: string } }) => {
                        const spend = parseFloat(campaign.insights?.spend ?? "0") || 0;
                        const isSelected = selectedCampaign?.id === campaign.id;
                        return (
                          <button
                            key={campaign.id}
                            type="button"
                            onClick={() =>
                              setSelectedCampaign({
                                id: campaign.id,
                                name: campaign.name ?? `Campaign ${campaign.id}`,
                                spend,
                              })
                            }
                            className={cn(
                              "w-full text-left p-3 rounded-md border transition-colors flex items-center justify-between gap-3",
                              isSelected
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-transparent hover:bg-muted/60"
                            )}
                          >
                            <span className="font-medium truncate min-w-0 flex-1">
                              {campaign.name ?? `Campaign ${campaign.id}`}
                            </span>
                            <span className="text-sm font-medium text-muted-foreground shrink-0">
                              {formatAmount(spend, accountCurrency)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {selectedAccount && selectedCampaign && dateRange?.from && dateRange?.to && (
                <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2 text-sm">
                  <p className="font-medium text-foreground">Summary</p>
                  <div className="space-y-1 text-muted-foreground">
                    <p>
                      <span className="text-foreground">Ad account:</span>{" "}
                      {selectedAccount.accountName || `Account ${selectedAccount.accountId}`}
                    </p>
                    <p>
                      <span className="text-foreground">Period:</span>{" "}
                      {format(dateRange.from, "MMM d, yyyy")} – {format(dateRange.to, "MMM d, yyyy")}
                    </p>
                    <p>
                      <span className="text-foreground">Currency:</span> {currencySymbol} (
                      {accountCurrency})
                    </p>
                    <p className="pt-2 font-medium text-foreground">
                      Total ad spend: {formatAmount(totalAmount, accountCurrency)}
                    </p>
                    {accountCurrency === "USD" && (
                      <p className="text-muted-foreground">
                        {kesConverted != null ? (
                          <>≈ KSh {kesConverted.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>
                        ) : convertPricesMutation.isPending ? (
                          "Converting to KES…"
                        ) : null}
                      </p>
                    )}
                    <p>
                      <span className="text-foreground">Commission rate:</span> {commissionRatePercent}%
                    </p>
                    <p className="font-medium text-foreground">
                      Agency amount: {formatAmount((totalAmount * commissionRatePercent) / 100, accountCurrency)}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex justify-end pt-2">
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={!selectedAccountId || !selectedCampaign || !dateRange?.from || !dateRange?.to}
            >
              Use selection
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
