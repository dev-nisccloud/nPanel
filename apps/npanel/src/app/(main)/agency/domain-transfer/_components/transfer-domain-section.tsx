"use client";

import * as React from "react";
import { ArrowLeftRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/utils/cn";
import { parseQueryWithTld } from "@/lib/domain-query-parse";
import { trpc } from "@/utils/trpc";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { useCurrency } from "@/app/(main)/agency/domains/_components/currency-context";
import { useDomainPricing } from "@/hooks/use-domain-pricing";
import type { DomainSearchResult } from "@/hooks/use-domain-search";
import { TransferReadyCard } from "./transfer-ready-card";

type ValidationStatus = "idle" | "loading" | "valid" | "error";

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

export function TransferDomainSection() {
  const [domainInput, setDomainInput] = React.useState("");
  const [status, setStatus] = React.useState<ValidationStatus>("idle");
  const [message, setMessage] = React.useState("");
  const [transferPrice, setTransferPrice] = React.useState<{
    price: number;
    currency: string;
  } | null>(null);
  const [parsedDomain, setParsedDomain] = React.useState<{
    name: string;
    extension: string;
    full: string;
  } | null>(null);
  const [pricedResult, setPricedResult] = React.useState<DomainSearchResult | null>(null);
  const [purchaseSheetOpen, setPurchaseSheetOpen] = React.useState(false);

  const utils = trpc.useUtils();
  const currencyContext = useCurrency();
  const pricingHook = useDomainPricing(currencyContext);

  const validateAndFetchPrice = React.useCallback(async () => {
    const trimmed = domainInput.trim();
    if (!trimmed) {
      setStatus("error");
      setMessage("Enter a domain name to transfer (e.g. example.com)");
      setTransferPrice(null);
      setParsedDomain(null);
      setPricedResult(null);
      return;
    }

    const parsed = parseQueryWithTld(trimmed);
    if (!parsed) {
      setStatus("error");
      setMessage("Invalid domain format. Enter a full domain with a valid TLD (e.g. example.com or example.co.ke)");
      setTransferPrice(null);
      setParsedDomain(null);
      setPricedResult(null);
      return;
    }

    const fullDomain = `${parsed.name}.${parsed.extension}`;
    const extNoDot = parsed.extension.startsWith(".") ? parsed.extension.slice(1) : parsed.extension;
    setStatus("loading");
    setMessage("");
    setTransferPrice(null);
    setParsedDomain({ name: parsed.name, extension: parsed.extension, full: fullDomain });
    setPricedResult(null);

    try {
      const tldData = await utils.openProvider.tlds.getTldByExtension.fetch({ extension: extNoDot });
      if (!tldData?.success || !tldData?.data) {
        setStatus("error");
        setMessage("This TLD is not available for transfer. Please try another domain.");
        setParsedDomain(null);
        setPricedResult(null);
        return;
      }

      const tld = tldData.data as { prices?: { transfer_price?: { product?: { price?: number; currency?: string }; reseller?: { price?: number; currency?: string } } } };
      const transferPriceInfo = tld?.prices?.transfer_price;
      if (!transferPriceInfo) {
        setStatus("error");
        setMessage("Transfer price not available for this TLD. Please try another domain.");
        setParsedDomain(null);
        setPricedResult(null);
        return;
      }

      const priceSource = transferPriceInfo.reseller ?? transferPriceInfo.product;
      if (!priceSource?.price) {
        setStatus("error");
        setMessage("Transfer price not available for this TLD. Please try another domain.");
        setParsedDomain(null);
        setPricedResult(null);
        return;
      }

      setTransferPrice({
        price: priceSource.price,
        currency: priceSource.currency ?? "USD",
      });
      setStatus("valid");
      setMessage("");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setTransferPrice(null);
      setParsedDomain(null);
      setPricedResult(null);
    }
  }, [domainInput, utils]);

  const handleClear = () => {
    setDomainInput("");
    setStatus("idle");
    setMessage("");
    setTransferPrice(null);
    setParsedDomain(null);
    setPricedResult(null);
  };

  // Apply TLD settings markup and currency conversion (same as domain search)
  React.useEffect(() => {
    if (
      status !== "valid" ||
      !transferPrice ||
      !parsedDomain ||
      pricingHook.isLoadingTldSettings
    ) {
      // Clear priced result when not in a valid/pricable state
      if (pricedResult !== null && (!transferPrice || !parsedDomain || status !== "valid")) {
        setPricedResult(null);
      }
      return;
    }

    const rawResult: DomainSearchResult = {
      domain: parsedDomain.full,
      status: "free",
      price: {
        product: {
          price: transferPrice.price,
          currency: transferPrice.currency,
        },
        reseller: {
          price: transferPrice.price,
          currency: transferPrice.currency,
        },
      },
      reason: `Transfer: ${parsedDomain.full}`,
    };

    pricingHook
      .calculatePricesBatch([rawResult])
      .then(([priced]) => setPricedResult(priced))
      .catch(() => {
        // On failure, fall back to raw price (pricedResult stays null)
        setPricedResult(null);
      });
  }, [
    status,
    transferPrice,
    parsedDomain,
    pricingHook.calculatePricesBatch,
    pricingHook.isLoadingTldSettings,
  ]);

  const calculated = pricedResult?.price?.calculated as
    | {
        convertedPrice?: number;
        finalPrice: number;
        displayCurrency?: string;
        currency: string;
      }
    | undefined;

  const displayPrice =
    calculated != null
      ? (calculated.convertedPrice ?? calculated.finalPrice)
      : transferPrice?.price;

  const displayCurrency =
    calculated != null
      ? (calculated.displayCurrency ?? calculated.currency)
      : transferPrice?.currency ?? "USD";

  const inputBorderClass =
    status === "error"
      ? "border-destructive focus-visible:ring-destructive"
      : status === "valid"
        ? "border-primary focus-visible:ring-primary"
        : "";

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ArrowLeftRight className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-semibold tracking-tight">Transfer your domain to Nisc Cloud</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter the domain you want to transfer and we’ll check eligibility and price.
        </p>
      </div>

      <div className="mx-auto mt-6 max-w-xl">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              placeholder="example.com"
              value={domainInput}
              onChange={(e) => {
                setDomainInput(e.target.value);
                if (status !== "idle") {
                  setStatus("idle");
                  setMessage("");
                  setTransferPrice(null);
                  setParsedDomain(null);
                }
              }}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), validateAndFetchPrice())}
              className={cn("h-11 pr-9", inputBorderClass)}
              disabled={status === "loading"}
            />
            {domainInput.trim() && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Clear"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            type="button"
            onClick={validateAndFetchPrice}
            disabled={status === "loading" || !domainInput.trim()}
            className="h-11 px-6"
          >
            {status === "loading" ? (
              <Spinner variant="ellipsis" className="text-primary-foreground" size="sm" />
            ) : (
              "Transfer"
            )}
          </Button>
        </div>

        {message && (
          <p
            className={cn(
              "mt-2 rounded-md px-3 py-2 text-sm",
              status === "error"
                ? "bg-destructive/10 text-destructive"
                : "bg-primary/10 text-primary"
            )}
          >
            {message}
          </p>
        )}
        {status === "valid" && transferPrice && parsedDomain && !message && displayPrice != null && (
          <p className="mt-2 rounded-md bg-muted/80 px-3 py-2 text-sm text-muted-foreground">
            Transfer your .{parsedDomain.extension} for {formatPrice(displayPrice, displayCurrency)}. The
            price includes domain renewal for a year.
          </p>
        )}
      </div>

      {status === "valid" && transferPrice && parsedDomain && displayPrice != null && (
        <div className="mt-6">
          <TransferReadyCard
            domain={parsedDomain.full}
            extension={parsedDomain.extension}
            price={displayPrice}
            currency={displayCurrency}
            onPurchase={() => setPurchaseSheetOpen(true)}
            purchaseSheetOpen={purchaseSheetOpen}
            onPurchaseSheetOpenChange={setPurchaseSheetOpen}
            initialDomain={parsedDomain.name}
            initialExtension={parsedDomain.extension}
          />
        </div>
      )}
    </div>
  );
}
