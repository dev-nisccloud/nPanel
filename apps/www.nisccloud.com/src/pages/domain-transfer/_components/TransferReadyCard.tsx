import { addYears, format } from "date-fns";
import { ArrowLeftRight, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import type { TransferProvider } from "@/lib/domain-transfer-api.ts";

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

interface TransferReadyCardProps {
  domain: string;
  price: number;
  currency: string;
  provider: TransferProvider;
  ctaLabel?: string;
  statusLabel?: string;
  isLoading?: boolean;
  onContinueToCart: () => void;
}

export function TransferReadyCard({
  domain,
  price,
  currency,
  provider,
  ctaLabel = "Continue to cart",
  statusLabel = "Ready for transfer",
  isLoading = false,
  onContinueToCart,
}: TransferReadyCardProps) {
  const isPendingCheck = ctaLabel === "Continue";
  const showStatusBadge = statusLabel !== "";
  const expiryAfterTransferLabel = format(addYears(new Date(), 1), "MMMM d, yyyy");

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          {showStatusBadge ? (
            <Badge variant="outline" className="border-primary/25 bg-primary/5 text-primary">
              {statusLabel}
            </Badge>
          ) : isPendingCheck ? (
            <Badge variant="secondary">We will confirm availability</Badge>
          ) : null}
          <div className="flex items-start gap-2">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
              <ArrowLeftRight className="h-4 w-4 text-muted-foreground" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold tracking-tight text-foreground">{domain}</p>
              <p className="text-xs text-muted-foreground">Transfer here · includes 1 year renewal</p>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end lg:flex-row lg:items-center">
          <p className="text-lg font-semibold tabular-nums text-foreground">{formatPrice(price, currency)}</p>
          <Button
            size="sm"
            className="min-w-[6.5rem] font-semibold"
            onClick={onContinueToCart}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading…
              </>
            ) : (
              ctaLabel
            )}
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
              <span className="font-medium text-foreground">one year of renewal</span>. After a successful
              transfer, your domain is expected to expire on{" "}
              <span className="font-medium text-foreground">{expiryAfterTransferLabel}</span>.
            </>
          ) : (
            <>
              The transfer price includes{" "}
              <span className="font-medium text-foreground">one year of registration</span>. Complete
              checkout to start your transfer. We will confirm the final details for your domain shortly.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
