"use client";

import * as React from "react";
import { Link } from "react-router";
import { ArrowLeftRight, X, AlertCircle, Lock, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/utils/cn";
import { trpc } from "@/utils/trpc";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { useCurrency } from "@/routes/agency.domains/_components/currency-context";
import { useDomainPricing } from "@/hooks/use-domain-pricing";
import type { DomainSearchResult } from "@/hooks/use-domain-search";
import { TransferReadyCard } from "./transfer-ready-card";
import { toast } from "@/components/ui/sonner";

type ValidationStatus = "idle" | "loading" | "valid" | "error";

type TransferProvider = "kenic" | "openprovider" | null;

/** Matches API transferStatus: available = register CTA, locked = unlock message, ready = purchase, pending_check = KENIC Continue (no Ready badge). */
type TransferStatus = "available" | "locked" | "ready" | "pending_check" | "reserved" | "unavailable";

export interface TransferDomainSectionProps {
  /** Base URL for "Register domain" link when domain is available for registration. Defaults to /agency/domains. */
  registerDomainsHref?: string;
  /** For customer/team checkout (createFromPayment teamId). Pass when on a team slug page. */
  teamId?: string | null;
}

// Same formatPrice as domain search/registration (Intl.NumberFormat + currency symbols)
function formatPrice(price?: number, currency?: string): string {
  if (price == null) return "N/A";
  const currencySymbols: Record<string, string> = {
    USD: "$",
    KES: "KSh",
    EUR: "€",
    GBP: " ?",
    CAD: "C$",
    AUD: "A$",
    JPY: " ?",
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

export function TransferDomainSection({ registerDomainsHref = "/agency/domains", teamId }: TransferDomainSectionProps = {}) {
  const [domainInput, setDomainInput] = React.useState("");
  const [status, setStatus] = React.useState<ValidationStatus>("idle");
  const [message, setMessage] = React.useState("");
  const [transferPrice, setTransferPrice] = React.useState<{
    price: number | null;
    currency: string | null;
    createPrice?: number | null;
    createCurrency?: string | null;
  } | null>(null);
  const [parsedDomain, setParsedDomain] = React.useState<{
    name: string;
    extension: string;
    full: string;
  } | null>(null);
  const [provider, setProvider] = React.useState<TransferProvider>(null);
  const [transferStatus, setTransferStatus] = React.useState<TransferStatus | null>(null);
  const [pricedResult, setPricedResult] = React.useState<DomainSearchResult | null>(null);
  const [createPricedResult, setCreatePricedResult] = React.useState<DomainSearchResult | null>(null);
  const [purchaseSheetOpen, setPurchaseSheetOpen] = React.useState(false);
  const [isPricingProcessing, setIsPricingProcessing] = React.useState(false);

  const currencyContext = useCurrency();
  const pricingHook = useDomainPricing(currencyContext);

  const checkTransferMutation = trpc.domainTransfer.checkTransfer.useMutation({
    onError: (err) => {
      toast.error("Transfer check failed", {
        description: err.message ?? "Could not check if the domain can be transferred.",
      });
    },
  });

  const validateAndFetchPrice = React.useCallback(async () => {
    const trimmed = domainInput.trim();
    if (!trimmed) {
      setStatus("error");
      setMessage("Enter a domain name to transfer (e.g. example.com)");
      setTransferPrice(null);
      setParsedDomain(null);
      setProvider(null);
      setTransferStatus(null);
      setPricedResult(null);
      return;
    }

    setStatus("loading");
    setMessage("");
    setTransferPrice(null);
    setParsedDomain(null);
    setProvider(null);
    setTransferStatus(null);
    setPricedResult(null);
    setCreatePricedResult(null);

    try {
      const result = await checkTransferMutation.mutateAsync({ domain: trimmed });
      const statusFromApi = result.transferStatus as TransferStatus | undefined;

      setProvider(result.provider);
      setTransferStatus(statusFromApi ?? (result.transferrable ? "ready" : "unavailable"));

      if (result.transferrable) {
        if (result.name == null || result.extension == null || result.domain == null) {
          setStatus("error");
          setMessage("Invalid response. Please try again.");
          setTransferPrice(null);
          setParsedDomain(null);
          return;
        }
        setParsedDomain({
          name: result.name,
          extension: result.extension,
          full: result.domain,
        });
        setTransferPrice({
          price: result.price ?? null,
          currency: result.currency ?? null,
          createPrice: (result as { createPrice?: number | null }).createPrice ?? null,
          createCurrency: (result as { createCurrency?: string | null }).createCurrency ?? null,
        });
        setStatus("valid");
        setMessage("");
        return;
      }

      setStatus("error");
      setMessage(result.error ?? "This domain cannot be transferred.");
      setTransferPrice(null);
      setParsedDomain(null);

      if (statusFromApi !== "available" && statusFromApi !== "locked") {
        toast.error("Domain not transferrable", {
          description: result.error ?? "This domain cannot be transferred.",
        });
      }
    } catch {
      setStatus("error");
      setMessage(
        checkTransferMutation.error?.message ??
          "Something went wrong. Please try again."
      );
      setTransferPrice(null);
      setParsedDomain(null);
      setProvider(null);
      setTransferStatus("unavailable");
    }
  }, [domainInput, checkTransferMutation]);

  const handleClear = () => {
    setDomainInput("");
    setStatus("idle");
    setMessage("");
    setTransferPrice(null);
    setParsedDomain(null);
    setProvider(null);
      setTransferStatus(null);
      setPricedResult(null);
      setCreatePricedResult(null);
  };

  // Apply TLD settings margin and currency conversion (same as domain search for OpenProvider/KENIC)
  React.useEffect(() => {
    if (
      status !== "valid" ||
      !parsedDomain ||
      transferPrice?.price == null ||
      pricingHook.isLoadingTldSettings
    ) {
      if (pricedResult !== null && (status !== "valid" || transferPrice?.price == null)) {
        setPricedResult(null);
      }
      if (createPricedResult !== null) setCreatePricedResult(null);
      setIsPricingProcessing(false);
      return;
    }

    const rawResult: DomainSearchResult = {
      domain: parsedDomain.full,
      status: "free",
      price: {
        product: {
          price: transferPrice.price,
          currency: transferPrice.currency ?? "USD",
        },
        reseller: {
          price: transferPrice.price,
          currency: transferPrice.currency ?? "USD",
        },
      },
      reason: `Transfer: ${parsedDomain.full}`,
    };

    const hasCreatePrice =
      transferPrice.createPrice != null && (transferPrice.createCurrency ?? "").length > 0;
    const createRawResult: DomainSearchResult | undefined = hasCreatePrice
      ? {
          domain: parsedDomain.full,
          status: "free",
          price: {
            product: {
              price: transferPrice.createPrice!,
              currency: transferPrice.createCurrency ?? "USD",
            },
            reseller: {
              price: transferPrice.createPrice!,
              currency: transferPrice.createCurrency ?? "USD",
            },
          },
          reason: `Create: ${parsedDomain.full}`,
        }
      : undefined;

    const batch = hasCreatePrice ? [rawResult, createRawResult!] : [rawResult];
    setIsPricingProcessing(true);
    pricingHook
      .calculatePricesBatch(batch)
      .then((priced) => {
        setPricedResult(priced[0] ?? null);
        setCreatePricedResult(hasCreatePrice ? (priced[1] ?? null) : null);
      })
      .catch(() => {
        setPricedResult(null);
        setCreatePricedResult(null);
      })
      .finally(() => {
        setIsPricingProcessing(false);
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

  const calculatedCreate = createPricedResult?.price?.calculated as
    | {
        convertedPrice?: number;
        finalPrice: number;
        displayCurrency?: string;
        currency: string;
      }
    | undefined;

  const hasNumericPrice =
    transferPrice != null &&
    typeof transferPrice.price === "number" &&
    !Number.isNaN(transferPrice.price);

  /** Customer-facing transfer price — only after TLD margin + currency conversion (same as agency domains). */
  const displayPrice =
    calculated != null ? (calculated.convertedPrice ?? calculated.finalPrice) : null;

  const displayCurrency =
    calculated != null ? (calculated.displayCurrency ?? calculated.currency) : null;

  const createDisplayPrice =
    calculatedCreate != null
      ? (calculatedCreate.convertedPrice ?? calculatedCreate.finalPrice)
      : null;

  const createDisplayCurrency =
    calculatedCreate != null
      ? (calculatedCreate.displayCurrency ?? calculatedCreate.currency)
      : null;

  const inputBorderClass =
    status === "error"
      ? "border-destructive focus-visible:ring-destructive"
      : status === "valid"
        ? "border-primary focus-visible:ring-primary"
        : "";

  const hasCreatePriceForPending =
    transferStatus === "pending_check" &&
    transferPrice?.createPrice != null &&
    (transferPrice?.createCurrency ?? "").length > 0;

  const transferPricingReady = !hasNumericPrice || calculated != null;
  const createPricingReady =
    !hasCreatePriceForPending || calculatedCreate != null;
  const pricingReady = transferPricingReady && createPricingReady;

  const showReadyCard =
    status === "valid" &&
    parsedDomain != null &&
    provider != null &&
    pricingReady &&
    !isPricingProcessing &&
    !pricingHook.isLoadingTldSettings &&
    (hasNumericPrice ? displayPrice != null : true);

  const showPricingLoading =
    status === "valid" &&
    parsedDomain != null &&
    hasNumericPrice &&
    (pricingHook.isLoadingTldSettings || isPricingProcessing || !pricingReady);

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ArrowLeftRight className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-semibold tracking-tight">Transfer your domain to Nisc Cloud</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter the domain you want to transfer and we?ll check eligibility and price.
        </p>
      </div>

      <div className="mx-auto mt-6 max-w-xl">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              placeholder="example.com or example.co.ke"
              value={domainInput}
              onChange={(e) => {
                setDomainInput(e.target.value);
                if (status !== "idle") {
                  setStatus("idle");
                  setMessage("");
                  setTransferPrice(null);
                  setParsedDomain(null);
                  setProvider(null);
                  setTransferStatus(null);
                }
              }}
              onKeyDown={(e) =>
                e.key === "Enter" && (e.preventDefault(), validateAndFetchPrice())
              }
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
              "Check transfer"
            )}
          </Button>
        </div>

        {/* Only show inline message for non-error states; errors use the dedicated sections below to avoid duplicate text */}
        {message && status !== "error" && (
          <p
            className={cn(
              "mt-2 rounded-md px-3 py-2 text-sm",
              "bg-primary/10 text-primary"
            )}
          >
            {message}
          </p>
        )}

        {/* Available for registration ?? CTA to register page */}
        {status === "error" && transferStatus === "available" && (
          <div className="mt-4 flex flex-col gap-4 rounded-lg border border-primary/30 bg-primary/5 p-4 text-left">
            <div className="flex gap-3">
              <Globe className="h-5 w-5 shrink-0 text-primary" />
              <div>
                <h3 className="font-medium text-foreground">This domain is available for registration</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {message} Go to domain registration to register it.
                </p>
              </div>
            </div>
            <Button asChild className="w-fit">
              <Link to={`${registerDomainsHref}${domainInput.trim() ? `?search=${encodeURIComponent(domainInput.trim())}` : ""}`}>
                Register domain
              </Link>
            </Button>
          </div>
        )}

        {/* Locked ?? explain and ask user to unlock */}
        {status === "error" && transferStatus === "locked" && (
          <div className="mt-4 flex gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-left">
            <Lock className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-500" />
            <div>
              <h3 className="font-medium text-foreground">Domain is locked</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                This domain is locked at the current registrar. Unlock it in your registrar&apos;s
                control panel, then try the transfer again.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                After unlocking at your current registrar, wait about 15 seconds for your changes
                to reflect, then return here and check the domain again to continue with the
                transfer.
              </p>
            </div>
          </div>
        )}

        {/* Other errors (reserved, unavailable, invalid) ?? why transfer failed */}
        {status === "error" && message && transferStatus !== "available" && transferStatus !== "locked" && (
          <div
            className="mt-4 flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-left"
            role="alert"
          >
            <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
            <div>
              <h3 className="font-medium text-destructive">Why the transfer failed</h3>
              <p className="mt-1 text-sm text-muted-foreground">{message}</p>
            </div>
          </div>
        )}

        {showPricingLoading && (
          <p className="mt-2 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Spinner variant="ellipsis" size={14} className="shrink-0 text-muted-foreground" />
            Applying pricing and currency conversion…
          </p>
        )}

      </div>

      {showReadyCard && parsedDomain && provider && (
        <div className="mt-6">
          <TransferReadyCard
            domain={parsedDomain.full}
            extension={parsedDomain.extension}
            price={displayPrice ?? 0}
            currency={displayCurrency ?? "KES"}
            providerPriceAmount={transferPrice?.price ?? null}
            providerPriceCurrency={transferPrice?.currency ?? null}
            customerPriceAmount={displayPrice}
            customerPriceCurrency={displayCurrency}
            provider={provider}
            teamId={teamId}
            onPurchase={() => setPurchaseSheetOpen(true)}
            purchaseSheetOpen={purchaseSheetOpen}
            onPurchaseSheetOpenChange={setPurchaseSheetOpen}
            initialDomain={parsedDomain.name}
            initialExtension={parsedDomain.extension}
            ctaLabel={transferStatus === "pending_check" ? "Continue" : "Purchase"}
            statusLabel={transferStatus === "pending_check" ? "" : undefined}
          />
        </div>
      )}
    </div>
  );
}

