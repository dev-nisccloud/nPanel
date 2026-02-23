"use client";

import * as React from "react";
import { Info, ArrowLeftRight, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/npanel-ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TransferForm } from "./transfer-form";

export type TransferProvider = "kenic" | "openprovider";

interface TransferReadyCardProps {
  domain: string;
  extension: string;
  /** Customer-facing price (after margin) – shown in UI */
  price: number;
  currency: string;
  /** Provider price (no margin) – for DB when initiating transfer */
  providerPriceAmount?: number | null;
  providerPriceCurrency?: string | null;
  /** Customer price (after margin) – for DB when initiating transfer */
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
  /** Badge label; default "Ready for transfer". Use "We'll check availability" for KENIC pending_check. */
  statusLabel?: string;
}

// Same formatPrice as domain search/registration (Intl.NumberFormat + currency symbols)
function formatPrice(price?: number, currency?: string): string {
  if (price == null) return "N/A";
  const currencySymbols: Record<string, string> = {
    USD: "$",
    KES: "KSh",
    EUR: "€",
    GBP: "£",
    CAD: "C$",
    AUD: "A$",
    JPY: "¥",
    INR: "₹",
    ZAR: "R",
    NGN: "₦",
  };
  const symbol = currencySymbols[currency ?? "USD"] ?? currency ?? "$";
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
}: TransferReadyCardProps) {
  const renewalYear = new Date().getFullYear() + 1;
  const renewalDate = `${renewalYear}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`;

  return (
    <>
      <Card className="overflow-hidden rounded-lg border shadow-sm">
        <CardContent className="p-0">
          <div className="flex flex-wrap items-center justify-between gap-4 p-4">
            <div className="flex flex-col gap-1">
              {statusLabel ? (
                <span className="inline-flex w-fit rounded-full bg-green-500/15 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
                  {statusLabel}
                </span>
              ) : null}
              <span className="text-lg font-bold text-foreground">{domain}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-foreground">
                {formatPrice(price, currency)}
              </span>
              <Button
                size="sm"
                onClick={() => onPurchaseSheetOpenChange(true)}
                className="font-semibold"
              >
                {ctaLabel}
              </Button>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-b-lg bg-muted/50 px-4 py-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-foreground">
              <Info className="h-3.5 w-3.5" />
            </div>
            <p className="text-sm text-muted-foreground">
              The price includes <strong className="text-foreground">domain renewal</strong>. After the successful
              transfer, your domain&apos;s expiration date will be{" "}
              <strong className="text-foreground">{renewalDate}</strong>.
            </p>
          </div>
        </CardContent>
      </Card>

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
                className="size-auto p-0 m-0 hover:bg-transparent"
                aria-label="Close"
              >
                <XIcon className="size-5" />
              </Button>
            </SheetClose>
          </SheetHeader>

          <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
            <ScrollArea className="flex-1 min-h-0 pr-4">
              <div className="px-1 pb-6">
                <TransferForm
                  fullDomain={domain}
                  initialDomain={initialDomain}
                  initialExtension={initialExtension.startsWith(".") ? initialExtension.slice(1) : initialExtension}
                  price={price}
                  currency={currency}
                  providerPriceAmount={providerPriceAmount}
                  providerPriceCurrency={providerPriceCurrency}
                  customerPriceAmount={customerPriceAmount ?? price}
                  customerPriceCurrency={customerPriceCurrency ?? currency}
                  provider={provider}
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
