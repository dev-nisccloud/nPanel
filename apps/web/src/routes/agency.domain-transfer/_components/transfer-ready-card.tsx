"use client";

import * as React from "react";
import { addYears, format } from "date-fns";
import { ArrowLeftRight, Info, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/npanel-ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DomainRenewalInfoSection } from "@/components/domain-renewal-info-section";
import { TransferForm } from "./transfer-form";

export type TransferProvider = "kenic" | "openprovider";

interface TransferReadyCardProps {
  domain: string;
  extension: string;
  /** Customer-facing price (after margin) - shown in UI */
  price: number;
  currency: string;
  /** Provider price (no margin) - for DB when initiating transfer */
  providerPriceAmount?: number | null;
  providerPriceCurrency?: string | null;
  /** Customer price (after margin) - for DB when initiating transfer */
  customerPriceAmount?: number | null;
  customerPriceCurrency?: string | null;
  provider: TransferProvider;
  onPurchase: () => void;
  purchaseSheetOpen: boolean;
  onPurchaseSheetOpenChange: (open: boolean) => void;
  initialDomain: string;
  initialExtension: string;
  /** CTA button label; default "Purchase". Use "Continue" for KENIC pending_check. */
  ctaLabel?: string;
  /** Badge label; default "Ready for transfer". Empty string hides the badge. */
  statusLabel?: string;
  /** For customer/team checkout (createFromPayment teamId) */
  teamId?: string | null;
}

function formatPrice(price?: number, currency?: string): string {
  if (price == null || !Number.isFinite(price)) return "N/A";
  const symbol =
    (currency || "KES") === "KES" ? "KSh" : currency === "USD" ? "$" : currency || "KSh";
  const formattedNumber = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
  return `${symbol} ${formattedNumber}`;
}

export function TransferReadyCard({
  domain,
  extension,
  price,
  currency,
  providerPriceAmount,
  providerPriceCurrency,
  customerPriceAmount,
  customerPriceCurrency,
  provider,
  purchaseSheetOpen,
  onPurchaseSheetOpenChange,
  initialDomain,
  initialExtension,
  ctaLabel = "Purchase",
  statusLabel = "Ready for transfer",
  teamId,
}: TransferReadyCardProps) {
  const isPendingCheck = ctaLabel === "Continue";
  const showStatusBadge = statusLabel !== "";

  /** After transfer (+1 year included), approximate expiry date */
  const expiryAfterTransferLabel = React.useMemo(
    () => format(addYears(new Date(), 1), "MMMM d, yyyy"),
    [],
  );

  const handlePurchaseClick = () => {
    onPurchaseSheetOpenChange(true);
  };

  return (
    <>
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1 space-y-2">
            {showStatusBadge ? (
              <Badge
                variant="outline"
                className="border-primary/25 bg-primary/5 text-primary"
              >
                {statusLabel}
              </Badge>
            ) : isPendingCheck ? (
              <Badge variant="secondary">We&apos;ll check availability</Badge>
            ) : null}
            <div className="flex items-start gap-2">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                <ArrowLeftRight className="h-4 w-4 text-muted-foreground" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold tracking-tight text-foreground">
                  {domain}
                </p>
                <p className="text-xs text-muted-foreground">
                  Transfer to Nisc Cloud · includes 1 year renewal
                </p>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end lg:flex-row lg:items-center">
            <p className="text-lg font-semibold tabular-nums text-foreground">
              {formatPrice(price, currency)}
            </p>
            <Button size="sm" className="min-w-[6.5rem] font-semibold" onClick={handlePurchaseClick}>
              {ctaLabel}
            </Button>
          </div>
        </div>

        <Separator />

        <div className="flex gap-3 bg-muted/40 px-4 py-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">
            {provider === "openprovider" ? (
              <>
                The transfer price includes{" "}
                <span className="font-medium text-foreground">one year of renewal</span>. After a
                successful transfer, your domain is expected to expire on{" "}
                <span className="font-medium text-foreground">{expiryAfterTransferLabel}</span>.
              </>
            ) : (
              <>
                The transfer price includes{" "}
                <span className="font-medium text-foreground">one year of registration</span>.
                Complete checkout to start your transfer-we&apos;ll confirm availability and pricing
                for Kenyan domains shortly.
              </>
            )}
          </p>
        </div>

        {provider === "openprovider" ? (
          <>
            <Separator />
            <div className="px-4 py-3">
              <DomainRenewalInfoSection
                domain={domain}
                yearsFromNow={1}
                hideForKenic
                className="rounded-lg border border-dashed bg-muted/40 px-4 py-3"
              />
            </div>
          </>
        ) : null}
      </div>

      <Sheet open={purchaseSheetOpen} onOpenChange={onPurchaseSheetOpenChange}>
        <SheetContent className="flex flex-col overflow-hidden sm:max-w-lg">
          <SheetHeader className="mb-6 flex flex-shrink-0 flex-row items-center justify-between">
            <div className="mb-2 flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <ArrowLeftRight className="h-6 w-6 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-2xl font-bold">Complete transfer</SheetTitle>
                <SheetDescription className="text-base">
                  Enter your authorization code to transfer {domain} to Nisc Cloud
                </SheetDescription>
              </div>
            </div>
            <SheetClose asChild>
              <Button
                size="icon"
                variant="ghost"
                className="m-0 size-auto p-0 hover:bg-transparent"
                aria-label="Close"
              >
                <XIcon className="size-5" />
              </Button>
            </SheetClose>
          </SheetHeader>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <ScrollArea className="min-h-0 flex-1 pr-4">
              <div className="px-1 pb-6">
                <TransferForm
                  fullDomain={domain}
                  initialDomain={initialDomain}
                  initialExtension={
                    initialExtension.startsWith(".") ? initialExtension.slice(1) : initialExtension
                  }
                  price={price}
                  currency={currency}
                  providerPriceAmount={providerPriceAmount}
                  providerPriceCurrency={providerPriceCurrency}
                  customerPriceAmount={customerPriceAmount ?? price}
                  customerPriceCurrency={customerPriceCurrency ?? currency}
                  provider={provider}
                  teamId={teamId}
                  onSuccess={() => onPurchaseSheetOpenChange(false)}
                />
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
