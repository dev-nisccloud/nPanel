"use client";

import * as React from "react";
import { format } from "date-fns";
import { Building2, Calendar as CalendarIcon, Check, ChevronsUpDown, Plus } from "lucide-react";
import { type DateRange } from "react-day-picker";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { FacebookCampaignCard } from "./campaign-card";
import { MOCK_AD_ACCOUNTS, MOCK_CAMPAIGNS, type MockAdAccount } from "./mock-data";

function getStatusStyles(status?: string) {
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

export function FacebookCampaignsTab() {
  const [accountPickerOpen, setAccountPickerOpen] = React.useState(false);
  const [selectedAccountId, setSelectedAccountId] = React.useState(MOCK_AD_ACCOUNTS[0]?.accountId ?? "");
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)), // Default to last 30 days
    to: new Date(),
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);

  const selectedAccount = MOCK_AD_ACCOUNTS.find((account) => account.accountId === selectedAccountId);
  const campaigns = MOCK_CAMPAIGNS.filter((campaign) => campaign.accountId === selectedAccountId);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="w-full md:max-w-md">
          <Popover open={accountPickerOpen} onOpenChange={setAccountPickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={accountPickerOpen}
                className="h-9 w-full justify-between border-muted/60 px-3 font-normal shadow-sm"
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
                    {MOCK_AD_ACCOUNTS.map((account) => {
                      const statusStyles = getStatusStyles(account.status);
                      return (
                        <CommandItem
                          key={account.accountId}
                          value={`${account.accountName} ${account.accountId}`}
                          onSelect={() => {
                            setSelectedAccountId(account.accountId);
                            setAccountPickerOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedAccountId === account.accountId ? "opacity-100" : "opacity-0",
                            )}
                          />
                          <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span className="truncate font-medium">{account.accountName}</span>
                          <Badge
                            variant={statusStyles.variant}
                            className={cn("ml-auto px-1 py-0 text-[8px] font-bold uppercase", statusStyles.className)}
                          >
                            {account.status}
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

        <div className="flex items-center gap-2">
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

          <Button size="sm" className="w-fit">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Create campaign
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold tracking-tight uppercase opacity-60">Active Campaigns</h2>
        <Badge variant="outline" className="text-[10px] font-bold opacity-60">
          {campaigns.length} total
        </Badge>
      </div>

      <div className="max-h-[calc(100vh-15rem)] overflow-y-auto pr-1">
        {campaigns.length > 0 ? (
          <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {campaigns.map((campaign) => (
              <FacebookCampaignCard
                key={campaign.id}
                campaign={campaign}
                currency={selectedAccount?.currency ?? "KES"}
              />
            ))}
          </div>
        ) : (
          <div className="py-10 text-center">
            <h3 className="text-sm font-bold tracking-tight">No campaign data available</h3>
            <p className="mt-1 text-xs text-muted-foreground">We couldn't find any campaigns for this ad account.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AdAccountLabel({ account }: { account: MockAdAccount }) {
  const statusStyles = getStatusStyles(account.status);
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="truncate font-medium">{account.accountName}</span>
      <Badge
        variant={statusStyles.variant}
        className={cn("ml-auto shrink-0 px-1 py-0 text-[8px] font-bold uppercase", statusStyles.className)}
      >
        {account.status}
      </Badge>
    </div>
  );
}
