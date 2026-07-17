import * as React from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeftRight, X, AlertCircle, Lock, Globe, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { cn } from "@/lib/utils.ts";
import {
  checkDomainTransfer,
  type CheckTransferResult,
  type TransferProvider,
  type TransferStatus,
} from "@/lib/domain-transfer-api.ts";
import { usePricing } from "@/lib/domain-search/pricing-context.tsx";
import type { DomainSearchResult } from "@/lib/domain-search/types.ts";
import {
  buildDomainTransferCartParams,
  navigateToStorefrontCart,
} from "@/lib/storefront-cart-url.ts";
import { TransferReadyCard } from "./TransferReadyCard.tsx";

type ValidationStatus = "idle" | "loading" | "valid" | "error";

export function TransferDomainSection() {
  const [domainInput, setDomainInput] = React.useState("");
  const [status, setStatus] = React.useState<ValidationStatus>("idle");
  const [message, setMessage] = React.useState("");
  const [transferPrice, setTransferPrice] = React.useState<{
    price: number | null;
    currency: string | null;
  } | null>(null);
  const [parsedDomain, setParsedDomain] = React.useState<{
    name: string;
    extension: string;
    full: string;
  } | null>(null);
  const [provider, setProvider] = React.useState<TransferProvider | null>(null);
  const [transferStatus, setTransferStatus] = React.useState<TransferStatus | null>(null);
  const [pricedResult, setPricedResult] = React.useState<DomainSearchResult | null>(null);
  const [isPricingProcessing, setIsPricingProcessing] = React.useState(false);
  const [isNavigatingToCart, setIsNavigatingToCart] = React.useState(false);

  const pricingHook = usePricing();

  const checkTransferMutation = useMutation({
    mutationFn: checkDomainTransfer,
    onError: (err: Error) => {
      toast.error("Transfer check failed", {
        description: err.message ?? "Could not check if the domain can be transferred.",
      });
    },
  });

  const applyCheckResult = React.useCallback((result: CheckTransferResult) => {
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
  }, []);

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

    try {
      const result = await checkTransferMutation.mutateAsync(trimmed);
      applyCheckResult(result);
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
      setTransferPrice(null);
      setParsedDomain(null);
      setProvider(null);
      setTransferStatus("unavailable");
    }
  }, [domainInput, checkTransferMutation, applyCheckResult]);

  const handleClear = () => {
    setDomainInput("");
    setStatus("idle");
    setMessage("");
    setTransferPrice(null);
    setParsedDomain(null);
    setProvider(null);
    setTransferStatus(null);
    setPricedResult(null);
  };

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

    let cancelled = false;
    setIsPricingProcessing(true);
    pricingHook
      .calculatePricesBatch([rawResult])
      .then((priced) => {
        if (!cancelled) setPricedResult(priced[0] ?? null);
      })
      .catch(() => {
        if (!cancelled) setPricedResult(null);
      })
      .finally(() => {
        if (!cancelled) setIsPricingProcessing(false);
      });

    return () => {
      cancelled = true;
    };
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

  const hasNumericPrice =
    transferPrice != null &&
    typeof transferPrice.price === "number" &&
    !Number.isNaN(transferPrice.price);

  const displayPrice =
    calculated != null ? (calculated.convertedPrice ?? calculated.finalPrice) : null;
  const displayCurrency =
    calculated != null ? (calculated.displayCurrency ?? calculated.currency) : null;

  const inputBorderClass =
    status === "error"
      ? "border-destructive focus-visible:ring-destructive"
      : status === "valid"
        ? "border-primary focus-visible:ring-primary"
        : "";

  const transferPricingReady = !hasNumericPrice || calculated != null;
  const showReadyCard =
    status === "valid" &&
    parsedDomain != null &&
    provider != null &&
    transferPricingReady &&
    !isPricingProcessing &&
    !pricingHook.isLoadingTldSettings &&
    (hasNumericPrice ? displayPrice != null : true);

  const showPricingLoading =
    status === "valid" &&
    parsedDomain != null &&
    hasNumericPrice &&
    (pricingHook.isLoadingTldSettings || isPricingProcessing || !transferPricingReady);

  const handleContinueToCart = async () => {
    if (!parsedDomain || !provider || displayPrice == null) return;
    setIsNavigatingToCart(true);
    try {
      await navigateToStorefrontCart(
        buildDomainTransferCartParams({
          domain: parsedDomain.full,
          provider,
          customerPriceAmount: displayPrice,
          customerPriceCurrency: displayCurrency ?? "KES",
          providerPriceAmount: transferPrice?.price ?? null,
          providerPriceCurrency: transferPrice?.currency ?? null,
        }),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open cart. Please try again.");
      setIsNavigatingToCart(false);
    }
  };

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ArrowLeftRight className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-semibold tracking-tight">Transfer your domain here</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter the domain you want to move. We will check if it can transfer and show the live price.
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
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking…
              </>
            ) : (
              "Check transfer"
            )}
          </Button>
        </div>

        {message && status !== "error" && (
          <p className="mt-2 rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">{message}</p>
        )}

        {status === "error" && transferStatus === "available" && (
          <div className="mt-4 flex flex-col gap-4 rounded-lg border border-primary/30 bg-primary/5 p-4 text-left">
            <div className="flex gap-3">
              <Globe className="h-5 w-5 shrink-0 text-primary" />
              <div>
                <h3 className="font-medium text-foreground">This domain is free to register</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {message} It is not currently registered, so you can register it instead of transferring.
                </p>
              </div>
            </div>
            <Button asChild className="w-fit">
              <Link
                to={`/hosting/domains${domainInput.trim() ? `?search=${encodeURIComponent(domainInput.trim())}` : ""}`}
              >
                Register domain
              </Link>
            </Button>
          </div>
        )}

        {status === "error" && transferStatus === "locked" && (
          <div className="mt-4 flex gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-left">
            <Lock className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-500" />
            <div>
              <h3 className="font-medium text-foreground">Domain is locked</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                This domain is locked at your current provider. Turn off transfer lock in their control panel, then try again.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                After unlocking, wait about 15 seconds for the change to show, then check the domain again.
              </p>
            </div>
          </div>
        )}

        {status === "error" && message && transferStatus !== "available" && transferStatus !== "locked" && (
          <div
            className="mt-4 flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-left"
            role="alert"
          >
            <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
            <div>
              <h3 className="font-medium text-destructive">This domain cannot transfer yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">{message}</p>
            </div>
          </div>
        )}

        {showPricingLoading && (
          <p className="mt-2 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
            Applying your live transfer price…
          </p>
        )}
      </div>

      {showReadyCard && parsedDomain && provider && displayPrice != null && (
        <div className="mt-6">
          <TransferReadyCard
            domain={parsedDomain.full}
            price={displayPrice}
            currency={displayCurrency ?? "KES"}
            provider={provider}
            ctaLabel={transferStatus === "pending_check" ? "Continue" : "Continue to cart"}
            statusLabel={transferStatus === "pending_check" ? "" : undefined}
            isLoading={isNavigatingToCart}
            onContinueToCart={handleContinueToCart}
          />
        </div>
      )}
    </div>
  );
}
